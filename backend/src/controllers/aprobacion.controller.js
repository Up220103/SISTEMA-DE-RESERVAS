// Controladores de aprobaciones de reservas de cubículos (Admin Biblioteca).
import {
  reservasDeCubiculos,
  reservaEsCubiculo,
  cambiarEstadoReserva,
} from '../models/aprobacion.model.js'
import { reservaConDueno, traslapeActivo } from '../models/reserva.model.js'
import { notificarResolucion, hoyISO } from '../services/reserva.service.js'

// Estado BD -> estado front (tabs Pendientes/Aprobadas/Rechazadas).
const ESTADO_A_FRONT = {
  Pendiente: 'pendiente',
  Confirmada: 'aprobada',
  Rechazada: 'rechazada',
}
// Acción front -> estado_id de la BD.
const ACCION_A_ESTADO_ID = { aprobada: 2, rechazada: 5 } // 2=Confirmada, 5=Rechazada

const ROL_A_TIPO = { Estudiante: 'ESTUDIANTE', Docente: 'DOCENTE' }

function iniciales(nombre, apellido) {
  return ((nombre?.[0] || '') + (apellido?.[0] || '')).toUpperCase()
}

function fechaLegible(fechaISO) {
  // fechaISO viene como 'YYYY-MM-DD' (dateStrings). Se formatea sin desfase horario.
  const [y, m, d] = fechaISO.split('-').map(Number)
  const fecha = new Date(y, m - 1, d)
  const txt = fecha.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })
  return txt.charAt(0).toUpperCase() + txt.slice(1).replace('.', '')
}

const hhmm = (t) => (t ? String(t).slice(0, 5) : '')

function aFront(row) {
  return {
    id: row.reserva_id,
    initials: iniciales(row.nombre, row.apellido),
    nombre: `${row.nombre} ${row.apellido}`,
    tipo: ROL_A_TIPO[row.nombre_rol] || row.nombre_rol?.toUpperCase() || '',
    lugar: row.cubiculo,
    fecha: fechaLegible(row.fecha_reserva),
    hora: `${hhmm(row.hora_inicio)}–${hhmm(row.hora_fin)}`,
    motivo: row.observaciones || row.titulo || '',
    estado: ESTADO_A_FRONT[row.estado] || 'pendiente',
  }
}

// GET /api/admin/aprobaciones
export async function getAprobaciones(req, res, next) {
  try {
    const filas = await reservasDeCubiculos()
    // Solo las que corresponden a las tres pestañas del panel.
    const items = filas.filter((f) => ESTADO_A_FRONT[f.estado]).map(aFront)
    res.json({ items })
  } catch (err) {
    next(err)
  }
}

// PATCH /api/admin/aprobaciones/:id   body: { estado: 'aprobada' | 'rechazada' }
export async function patchAprobacion(req, res, next) {
  try {
    const id = Number(req.params.id)
    const estadoFront = req.body?.estado
    const estadoId = ACCION_A_ESTADO_ID[estadoFront]
    if (!estadoId) {
      return res.status(400).json({ message: "estado debe ser 'aprobada' o 'rechazada'." })
    }

    if (!(await reservaEsCubiculo(id))) {
      return res.status(404).json({ message: 'Reserva de cubículo no encontrada.' })
    }

    const reserva = await reservaConDueno(id)
    // Solo se resuelve lo que sigue Pendiente: sin esto, dos clics seguidos (o
    // dos administradores a la vez) podrian rechazar algo ya aprobado.
    if (reserva.estado !== 'Pendiente') {
      return res.status(409).json({
        message: `Esta reserva ya fue resuelta (${reserva.estado}).`,
      })
    }
    if (reserva.fecha_reserva < hoyISO()) {
      return res.status(409).json({ message: 'Esa reserva ya pasó; no se puede resolver.' })
    }

    if (estadoFront === 'aprobada') {
      // Aprobar es lo que reserva el hueco de verdad. Entre que se creo la
      // solicitud y ahora, el cubiculo pudo inhabilitarse u otra solicitud del
      // mismo horario pudo aprobarse antes.
      if (reserva.estado_espacio !== 'Disponible') {
        return res.status(409).json({
          message: `${reserva.espacio} está inhabilitado: reactívalo antes de aprobar esta reserva.`,
        })
      }
      if (await traslapeActivo(reserva)) {
        return res.status(409).json({
          message: `Ya hay otra reserva confirmada para ${reserva.espacio} en ese horario.`,
        })
      }
    }

    await cambiarEstadoReserva(id, estadoId)
    // El solicitante se entera por su campana de notificaciones.
    await notificarResolucion(
      reserva,
      estadoFront === 'aprobada' ? 'Confirmada' : 'Rechazada',
      req.user.id,
      req.body?.motivo,
    )
    res.json({ id, estado: estadoFront })
  } catch (err) {
    next(err)
  }
}
