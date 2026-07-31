// Controlador de reservas. La validación de reglas la hace la BD (triggers/checks);
// aquí traducimos esos errores a respuestas HTTP claras y resolvemos casos de UI.
import {
  reservasDeUsuario,
  crearReserva,
  reservaPorId,
  reservasDeEspacios,
  bloqueosDeEspacios,
  reservasDeUsuarioEnFecha,
  reservaConDueno,
  cancelarReservas,
  registrarHistorial,
} from '../models/reserva.model.js'
import { espaciosPorTipo, espacioPorId } from '../models/catalogo.model.js'
import { crearNotificacion } from '../models/notificacion.model.js'

const HORA_RE = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/
const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/
// Ventana de reservas: 8:00 a 20:00 (bloques por hora 8..19).
const HORA_MIN = 8
const HORA_MAX = 20

// Fecha de hoy (local del servidor) en formato YYYY-MM-DD.
function hoyISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const horaNum = (t) => parseInt(String(t).slice(0, 2), 10)

// ¿La fecha ISO cae en sabado o domingo? La universidad no agenda en fin de
// semana (el calendario del frontend ya los deshabilita; aqui se valida de
// verdad, porque un cliente puede llamar a la API directamente).
function esFinDeSemana(fechaISO) {
  const [y, m, d] = fechaISO.split('-').map(Number)
  const dia = new Date(y, m - 1, d).getDay()
  return dia === 0 || dia === 6
}

// GET /api/reservas/mias
export async function misReservas(req, res, next) {
  try {
    const reservas = await reservasDeUsuario(req.user.id)
    res.json({ reservas })
  } catch (err) {
    next(err)
  }
}

// GET /api/reservas/horas-ocupadas?fecha=YYYY-MM-DD&espacio_id=NN | &tipo_id=NN
// Devuelve las horas (8..19) que NO se pueden reservar.
// - Con espacio_id: la hora está ocupada si ese espacio tiene reserva/bloqueo.
// - Con tipo_id (p. ej. Cubículo, auto-asignado): la hora está ocupada solo si
//   TODOS los espacios de ese tipo están ocupados (no queda ninguno libre).
export async function getHorasOcupadas(req, res, next) {
  try {
    const fecha = String(req.query.fecha || '')
    if (!FECHA_RE.test(fecha)) {
      return res.status(400).json({ message: 'fecha (YYYY-MM-DD) es obligatoria.' })
    }

    let espacioIds = []
    if (req.query.espacio_id) {
      espacioIds = [Number(req.query.espacio_id)]
    } else if (req.query.tipo_id) {
      const espacios = await espaciosPorTipo(Number(req.query.tipo_id))
      espacioIds = espacios.map((e) => e.espacio_id)
    } else {
      return res.status(400).json({ message: 'Indica espacio_id o tipo_id.' })
    }

    const total = espacioIds.length
    const reservas = await reservasDeEspacios(espacioIds, fecha)
    const bloqueos = await bloqueosDeEspacios(espacioIds, fecha)
    // Horas donde el propio usuario ya tiene una reserva (no puede duplicarla).
    const propias = await reservasDeUsuarioEnFecha(req.user.id, fecha)

    const ocupadas = []
    for (let h = HORA_MIN; h < HORA_MAX; h++) {
      // ¿El usuario ya tiene algo a esta hora? -> ocupada para él.
      const yaTiene = propias.some((r) => horaNum(r.hora_inicio) <= h && horaNum(r.hora_fin) > h)
      if (yaTiene) { ocupadas.push(h); continue }

      // Espacios ocupados en el bloque [h, h+1)
      const ocup = new Set()
      for (const r of reservas) {
        if (horaNum(r.hora_inicio) <= h && horaNum(r.hora_fin) > h) ocup.add(r.espacio_id)
      }
      for (const b of bloqueos) {
        const ini = b.fecha_inicio.startsWith(fecha) ? horaNum(b.fecha_inicio.slice(11)) : 0
        const fin = b.fecha_fin.startsWith(fecha) ? horaNum(b.fecha_fin.slice(11)) : 24
        if (ini <= h && fin > h) ocup.add(b.espacio_id)
      }
      if (total > 0 && ocup.size >= total) ocupadas.push(h)
    }

    res.json({ ocupadas, total })
  } catch (err) {
    next(err)
  }
}

// PATCH /api/reservas/:id/cancelar
// El propio usuario cancela su reserva. Los terminos aceptados al reservar dan
// un margen de 2 horas de anticipacion; al cancelar, el horario se libera de
// inmediato para los demas (deja de contar como reserva activa).
const HORAS_ANTICIPACION = 2

export async function cancelarMiReserva(req, res, next) {
  try {
    const reserva = await reservaConDueno(Number(req.params.id))
    if (!reserva) return res.status(404).json({ message: 'Reserva no encontrada.' })
    if (reserva.usuario_id !== req.user.id) {
      // 404 y no 403: no revelamos la existencia de reservas ajenas.
      return res.status(404).json({ message: 'Reserva no encontrada.' })
    }
    if (!['Pendiente', 'Confirmada'].includes(reserva.estado)) {
      return res
        .status(409)
        .json({ message: `Esta reserva ya está ${reserva.estado.toLowerCase()}.` })
    }

    const inicio = new Date(`${reserva.fecha_reserva}T${reserva.hora_inicio}`)
    const margenMs = HORAS_ANTICIPACION * 60 * 60 * 1000
    if (inicio.getTime() - Date.now() < margenMs) {
      return res.status(409).json({
        message: `Solo puedes cancelar con al menos ${HORAS_ANTICIPACION} horas de anticipación.`,
      })
    }

    await cancelarReservas([reserva.reserva_id])
    try {
      await registrarHistorial(reserva.reserva_id, req.user.id, 'Cancelada', 'Cancelada por el usuario')
    } catch {
      /* el historial es informativo: no debe tumbar la cancelacion */
    }
    await crearNotificacion(
      req.user.id,
      'Reserva cancelada',
      `Cancelaste tu reserva de ${reserva.espacio} (${reserva.edificio}) el ${reserva.fecha_reserva} de ${String(reserva.hora_inicio).slice(0, 5)} a ${String(reserva.hora_fin).slice(0, 5)}. El horario vuelve a estar disponible.`,
    )
    res.json({ reserva_id: reserva.reserva_id, estado: 'Cancelada' })
  } catch (err) {
    next(err)
  }
}

// POST /api/reservas
// Body: { espacio_id? , tipo_id? , titulo, fecha, hora_inicio, hora_fin, observaciones? }
// Si viene tipo_id sin espacio_id (caso Cubículo), se auto-asigna un espacio libre.
export async function postReserva(req, res, next) {
  try {
    const { espacio_id, tipo_id, titulo, fecha, hora_inicio, hora_fin, observaciones } = req.body || {}

    if (!titulo || !fecha || !hora_inicio || !hora_fin || (!espacio_id && !tipo_id)) {
      return res.status(400).json({
        message: 'titulo, fecha, hora_inicio, hora_fin y (espacio_id o tipo_id) son obligatorios.',
      })
    }
    if (!FECHA_RE.test(fecha)) {
      return res.status(400).json({ message: 'La fecha debe tener formato YYYY-MM-DD.' })
    }
    if (fecha < hoyISO()) {
      return res.status(400).json({ message: 'No puedes reservar en una fecha que ya pasó.' })
    }
    if (esFinDeSemana(fecha)) {
      return res
        .status(400)
        .json({ message: 'Solo se puede reservar de lunes a viernes.' })
    }
    if (!HORA_RE.test(hora_inicio) || !HORA_RE.test(hora_fin) || hora_inicio >= hora_fin) {
      return res.status(400).json({ message: 'Horario inválido: revisa la hora de inicio y fin.' })
    }
    if (horaNum(hora_inicio) < HORA_MIN || horaNum(hora_fin) > HORA_MAX) {
      return res.status(400).json({ message: 'El horario permitido es de 8:00 a 20:00.' })
    }
    // Hoy solo se aceptan bloques que aun no han empezado.
    if (fecha === hoyISO() && horaNum(hora_inicio) <= new Date().getHours()) {
      return res
        .status(400)
        .json({ message: 'Esa hora ya pasó. Elige un horario posterior.' })
    }

    // El usuario no puede tener dos reservas en el mismo horario (no puede estar en dos lugares).
    const propias = await reservasDeUsuarioEnFecha(req.user.id, fecha)
    const hi = horaNum(hora_inicio)
    const hf = horaNum(hora_fin)
    const seTraslapa = propias.some((r) => hi < horaNum(r.hora_fin) && hf > horaNum(r.hora_inicio))
    if (seTraslapa) {
      return res.status(409).json({ message: 'Ya tienes una reserva en ese horario.' })
    }

    // Lista de espacios candidatos: uno concreto, o todos los del tipo (auto-asignar).
    // Regla: un espacio INHABILITADO (estado != 'Disponible') no acepta reservas
    // hasta que el administrador lo reactive.
    let candidatos = []
    if (espacio_id) {
      const esp = await espacioPorId(Number(espacio_id))
      if (!esp) {
        return res.status(400).json({ message: 'El espacio seleccionado no existe.' })
      }
      if (esp.estado !== 'Disponible') {
        return res.status(409).json({ message: 'Este espacio está inhabilitado y no acepta reservas.' })
      }
      candidatos = [Number(espacio_id)]
    } else {
      const espacios = await espaciosPorTipo(Number(tipo_id))
      // Solo los espacios disponibles pueden autoasignarse.
      candidatos = espacios.filter((e) => e.estado === 'Disponible').map((e) => e.espacio_id)
      if (!candidatos.length) {
        return res.status(409).json({
          message: 'No hay espacios disponibles de ese tipo (pueden estar inhabilitados).',
        })
      }
    }

    // Intenta reservar en el primer candidato libre. El TRIGGER de la BD valida
    // permisos, traslapes y bloqueos; si choca, probamos el siguiente.
    let ultimoError = null
    for (const espId of candidatos) {
      try {
        const reservaId = await crearReserva({
          usuarioId: req.user.id,
          espacioId: espId,
          titulo,
          fecha,
          horaInicio: hora_inicio,
          horaFin: hora_fin,
          observaciones,
        })
        const reserva = await reservaPorId(reservaId)
        // Notifica al usuario que su solicitud quedó pendiente de aprobación.
        await crearNotificacion(
          req.user.id,
          'Reserva enviada',
          `Tu reserva de ${reserva.espacio} (${reserva.edificio}) el ${reserva.fecha_reserva} de ${reserva.hora_inicio.slice(0, 5)} a ${reserva.hora_fin.slice(0, 5)} quedó PENDIENTE de aprobación por el administrador.`,
        )
        return res.status(201).json({ message: 'Reserva creada correctamente.', reserva })
      } catch (err) {
        ultimoError = err
        // 45000 = regla de negocio (traslape/bloqueo/permiso). Probar siguiente espacio.
        if (err && err.sqlState === '45000') continue
        throw err
      }
    }

    // Ningún candidato quedó libre.
    if (espacio_id) {
      return res.status(409).json({ message: ultimoError?.sqlMessage || 'El espacio no está disponible en ese horario.' })
    }
    return res.status(409).json({ message: 'No hay espacios disponibles de ese tipo en ese horario.' })
  } catch (err) {
    if (err && (err.code === 'ER_CHECK_CONSTRAINT_VIOLATED' || err.errno === 3819)) {
      return res.status(400).json({ message: 'El horario debe estar entre 7:00 y 20:00.' })
    }
    if (err && (err.code === 'ER_NO_REFERENCED_ROW_2' || err.errno === 1452)) {
      return res.status(400).json({ message: 'El espacio seleccionado no existe.' })
    }
    next(err)
  }
}
