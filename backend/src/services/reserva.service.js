// Efectos en cascada de las acciones administrativas sobre las reservas.
//
// Regla del sistema: una reserva Pendiente o Confirmada OCUPA el horario de su
// espacio (asi lo consultan `reservasDeEspacios` y el trigger de la BD). Por eso,
// cuando una accion de administracion deja una reserva sin sentido -- se
// desactiva al usuario, se le quita el permiso sobre ese tipo de espacio, se
// inhabilita el espacio o se cierra la universidad -- hay que CANCELARLA:
// mientras siga activa bloquea el hueco para todos los demas sin que nadie
// pueda usarlo.
//
// Todas las funciones de aqui cancelan + notifican al dueño + dejan constancia
// en historial_reserva, y devuelven cuantas reservas afectaron.
import {
  reservasActivasDeUsuarioDesde,
  reservasActivasDeEspacioDesde,
  reservasActivasEnRango,
  cancelarReservas,
  registrarHistorial,
} from '../models/reserva.model.js'
import { tiposPorRol } from '../models/catalogo.model.js'
import { crearNotificacion } from '../models/notificacion.model.js'

// Fecha de hoy (local del servidor) en formato YYYY-MM-DD.
export function hoyISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const hhmm = (t) => String(t).slice(0, 5)

// Texto legible de una reserva, para el cuerpo de la notificacion.
function describir(r) {
  return `${r.espacio} (${r.edificio}) el ${r.fecha_reserva} de ${hhmm(r.hora_inicio)} a ${hhmm(r.hora_fin)}`
}

// Cancela un lote de reservas ya consultadas, avisa a cada dueño y registra
// quien lo hizo. `gestorId` es el administrador que ejecuto la accion.
async function cancelarYNotificar(reservas, { motivo, gestorId }) {
  if (!reservas.length) return 0

  await cancelarReservas(reservas.map((r) => r.reserva_id))

  for (const r of reservas) {
    await crearNotificacion(
      r.usuario_id,
      'Reserva cancelada',
      `Tu reserva de ${describir(r)} fue CANCELADA. Motivo: ${motivo}. El horario queda libre para otros usuarios.`,
    )
    // El historial es informativo: si falla no debe tumbar la accion principal,
    // que ya se aplico sobre la reserva.
    try {
      await registrarHistorial(r.reserva_id, gestorId, 'Cancelada', motivo)
    } catch {
      /* noop */
    }
  }
  return reservas.length
}

// El usuario se desactiva: no podra entrar, asi que sus reservas futuras se
// cancelan y liberan el horario.
export async function cancelarPorUsuarioInactivo(usuarioId, gestorId) {
  const reservas = await reservasActivasDeUsuarioDesde(usuarioId, hoyISO())
  return cancelarYNotificar(reservas, {
    motivo: 'la cuenta fue desactivada por el administrador',
    gestorId,
  })
}

// El usuario cambia de rol: conserva las reservas de los tipos de espacio que
// el NUEVO rol sigue pudiendo reservar y pierde las demas (regla 1 del trigger).
export async function cancelarPorCambioDeRol(usuarioId, nuevoRolId, gestorId) {
  const permitidos = new Set((await tiposPorRol(nuevoRolId)).map((t) => t.tipo_id))
  const activas = await reservasActivasDeUsuarioDesde(usuarioId, hoyISO())
  const reservas = activas.filter((r) => !permitidos.has(r.tipo_id))
  return cancelarYNotificar(reservas, {
    motivo: 'su nuevo rol no puede reservar ese tipo de espacio',
    gestorId,
  })
}

// El espacio se inhabilita (Mantenimiento/Bloqueado/Ocupado): sus reservas
// futuras no se pueden cumplir.
export async function cancelarPorEspacioInhabilitado(espacioId, gestorId, motivo) {
  const reservas = await reservasActivasDeEspacioDesde(espacioId, hoyISO())
  return cancelarYNotificar(reservas, {
    motivo: motivo || 'el espacio fue inhabilitado por el administrador',
    gestorId,
  })
}

// Cierre por ciclo escolar: la universidad no abre en ese rango.
export async function cancelarPorCierre(inicio, fin, gestorId) {
  const desde = inicio < hoyISO() ? hoyISO() : inicio
  if (desde > fin) return 0
  const reservas = await reservasActivasEnRango(desde, fin)
  return cancelarYNotificar(reservas, {
    motivo: 'la universidad permanecera cerrada en esas fechas',
    gestorId,
  })
}

// Aviso al usuario de que su reserva fue resuelta por un administrador.
export async function notificarResolucion(reserva, estado, gestorId, motivo) {
  const aprobada = estado === 'Confirmada'
  const titulo = aprobada ? 'Reserva aprobada' : 'Reserva rechazada'
  const cola = aprobada
    ? 'Preséntate puntualmente; hay 10 minutos de tolerancia.'
    : `Motivo: ${motivo || 'no especificado'}. El horario queda libre para otros usuarios.`

  await crearNotificacion(
    reserva.usuario_id,
    titulo,
    `Tu reserva de ${describir(reserva)} fue ${aprobada ? 'APROBADA' : 'RECHAZADA'}. ${cola}`,
  )
  try {
    await registrarHistorial(
      reserva.reserva_id,
      gestorId,
      aprobada ? 'Aprobada' : 'Rechazada',
      motivo,
    )
  } catch {
    /* noop */
  }
}
