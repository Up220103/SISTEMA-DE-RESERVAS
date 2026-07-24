// Acceso a datos de aprobaciones de reservas de CUBÍCULOS (Admin Biblioteca).
// Solo reservas sobre espacios tipo_id=1 (Cubículo) del edificio_id=1 (Biblioteca).
import { query } from '../config/db.js'

const TIPO_CUBICULO = 1
const EDIFICIO_BIBLIOTECA = 1

// Lista las reservas de cubículos con datos del solicitante y del espacio.
export async function reservasDeCubiculos() {
  const [rows] = await query(
    `SELECT r.reserva_id, r.fecha_reserva, r.hora_inicio, r.hora_fin,
            r.titulo, r.observaciones,
            u.nombre, u.apellido, ro.nombre_rol,
            e.nombre AS cubiculo, er.nombre_estado AS estado
       FROM reserva r
       JOIN usuario u          ON u.usuario_id = r.usuario_id
       JOIN rol ro             ON ro.rol_id    = u.rol_id
       JOIN espacio e          ON e.espacio_id = r.espacio_id
       JOIN estado_reserva er  ON er.estado_id = r.estado_id
      WHERE e.tipo_id = ? AND e.edificio_id = ?
      ORDER BY r.fecha_reserva DESC, r.hora_inicio DESC`,
    [TIPO_CUBICULO, EDIFICIO_BIBLIOTECA],
  )
  return rows
}

// Reservas de cubículos de un mes concreto (para el calendario del panel).
export async function reservasDeCubiculosPorMes(anio, mes) {
  const [rows] = await query(
    `SELECT r.reserva_id, r.fecha_reserva, r.hora_inicio, r.hora_fin,
            e.nombre AS cubiculo, CONCAT(u.nombre, ' ', u.apellido) AS solicitante,
            er.nombre_estado AS estado
       FROM reserva r
       JOIN usuario u          ON u.usuario_id = r.usuario_id
       JOIN espacio e          ON e.espacio_id = r.espacio_id
       JOIN estado_reserva er  ON er.estado_id = r.estado_id
      WHERE e.tipo_id = ? AND e.edificio_id = ?
        AND YEAR(r.fecha_reserva) = ? AND MONTH(r.fecha_reserva) = ?
      ORDER BY r.fecha_reserva, r.hora_inicio`,
    [TIPO_CUBICULO, EDIFICIO_BIBLIOTECA, anio, mes],
  )
  return rows
}

// Valida que la reserva sea de un cubículo de la biblioteca (autorización de dominio).
export async function reservaEsCubiculo(reservaId) {
  const [rows] = await query(
    `SELECT 1
       FROM reserva r
       JOIN espacio e ON e.espacio_id = r.espacio_id
      WHERE r.reserva_id = ? AND e.tipo_id = ? AND e.edificio_id = ?
      LIMIT 1`,
    [reservaId, TIPO_CUBICULO, EDIFICIO_BIBLIOTECA],
  )
  return rows.length > 0
}

// Cambia el estado de una reserva (estado_id de la tabla estado_reserva).
export async function cambiarEstadoReserva(reservaId, estadoId) {
  const [result] = await query(
    `UPDATE reserva SET estado_id = ? WHERE reserva_id = ?`,
    [estadoId, reservaId],
  )
  return result.affectedRows > 0
}
