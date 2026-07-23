// Acceso a datos de reservas (tabla `reserva` de la BD existente).
// Las reglas de negocio (permiso rol-tipo, traslapes, bloqueos, horario 07-20)
// las aplican los TRIGGERS de la BD; aquí solo insertamos/consultamos.
import { query } from '../config/db.js'

// Reservas de un usuario, con datos legibles del espacio/edificio/estado.
export async function reservasDeUsuario(usuarioId) {
  const [rows] = await query(
    `SELECT r.reserva_id, r.titulo, r.fecha_reserva, r.hora_inicio, r.hora_fin,
            r.observaciones, er.nombre_estado AS estado,
            e.nombre AS espacio, te.nombre_tipo AS tipo, ed.nombre AS edificio
       FROM reserva r
       JOIN estado_reserva er ON er.estado_id = r.estado_id
       JOIN espacio e         ON e.espacio_id = r.espacio_id
       JOIN tipo_espacio te   ON te.tipo_id   = e.tipo_id
       JOIN edificio ed       ON ed.edificio_id = e.edificio_id
      WHERE r.usuario_id = ?
      ORDER BY r.fecha_reserva DESC, r.hora_inicio DESC`,
    [usuarioId],
  )
  return rows
}

// Reservas activas y bloqueos de un espacio en una fecha (para pintar disponibilidad).
export async function disponibilidad(espacioId, fecha) {
  const [reservas] = await query(
    `SELECT r.hora_inicio, r.hora_fin, r.titulo, er.nombre_estado AS estado
       FROM reserva r
       JOIN estado_reserva er ON er.estado_id = r.estado_id
      WHERE r.espacio_id = ? AND r.fecha_reserva = ?
        AND er.nombre_estado IN ('Pendiente','Confirmada')
      ORDER BY r.hora_inicio`,
    [espacioId, fecha],
  )
  const [bloqueos] = await query(
    `SELECT fecha_inicio, fecha_fin, motivo
       FROM bloqueo_espacio
      WHERE espacio_id = ?
        AND DATE(fecha_inicio) <= ? AND DATE(fecha_fin) >= ?`,
    [espacioId, fecha, fecha],
  )
  return { reservas, bloqueos }
}

// Reservas activas (Pendiente/Confirmada) de un conjunto de espacios en una fecha.
export async function reservasDeEspacios(espacioIds, fecha) {
  if (!espacioIds.length) return []
  const marcas = espacioIds.map(() => '?').join(',')
  const [rows] = await query(
    `SELECT r.espacio_id, r.hora_inicio, r.hora_fin
       FROM reserva r
       JOIN estado_reserva er ON er.estado_id = r.estado_id
      WHERE r.fecha_reserva = ?
        AND er.nombre_estado IN ('Pendiente','Confirmada')
        AND r.espacio_id IN (${marcas})`,
    [fecha, ...espacioIds],
  )
  return rows
}

// Reservas activas del propio usuario en una fecha (para no dejar doble reserva).
export async function reservasDeUsuarioEnFecha(usuarioId, fecha) {
  const [rows] = await query(
    `SELECT r.hora_inicio, r.hora_fin
       FROM reserva r
       JOIN estado_reserva er ON er.estado_id = r.estado_id
      WHERE r.usuario_id = ? AND r.fecha_reserva = ?
        AND er.nombre_estado IN ('Pendiente','Confirmada')`,
    [usuarioId, fecha],
  )
  return rows
}

// Bloqueos que afectan a un conjunto de espacios en una fecha.
export async function bloqueosDeEspacios(espacioIds, fecha) {
  if (!espacioIds.length) return []
  const marcas = espacioIds.map(() => '?').join(',')
  const [rows] = await query(
    `SELECT espacio_id, fecha_inicio, fecha_fin
       FROM bloqueo_espacio
      WHERE DATE(fecha_inicio) <= ? AND DATE(fecha_fin) >= ?
        AND espacio_id IN (${marcas})`,
    [fecha, fecha, ...espacioIds],
  )
  return rows
}

// Inserta una reserva en estado Pendiente (estado_id = 1). Devuelve el id nuevo.
export async function crearReserva({ usuarioId, espacioId, titulo, fecha, horaInicio, horaFin, observaciones }) {
  const [result] = await query(
    `INSERT INTO reserva
        (usuario_id, espacio_id, estado_id, titulo, fecha_reserva, hora_inicio, hora_fin, observaciones)
     VALUES (?, ?, 1, ?, ?, ?, ?, ?)`,
    [usuarioId, espacioId, titulo, fecha, horaInicio, horaFin, observaciones || null],
  )
  return result.insertId
}

// Devuelve una reserva concreta con detalle (para responder tras crearla).
export async function reservaPorId(reservaId) {
  const [rows] = await query(
    `SELECT r.reserva_id, r.titulo, r.fecha_reserva, r.hora_inicio, r.hora_fin,
            r.observaciones, er.nombre_estado AS estado,
            e.nombre AS espacio, te.nombre_tipo AS tipo, ed.nombre AS edificio
       FROM reserva r
       JOIN estado_reserva er ON er.estado_id = r.estado_id
       JOIN espacio e         ON e.espacio_id = r.espacio_id
       JOIN tipo_espacio te   ON te.tipo_id   = e.tipo_id
       JOIN edificio ed       ON ed.edificio_id = e.edificio_id
      WHERE r.reserva_id = ? LIMIT 1`,
    [reservaId],
  )
  return rows[0] || null
}
