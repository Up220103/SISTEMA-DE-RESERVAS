// Acceso a datos de cubículos (subconjunto de `espacio`: tipo_id=1, edificio_id=1).
// El Admin Biblioteca solo administra cubículos del Edificio 5 (Biblioteca).
import { query } from '../config/db.js'

const TIPO_CUBICULO = 1
const EDIFICIO_BIBLIOTECA = 1

// Lista los cubículos con un flag de si tienen reserva confirmada para hoy.
export async function listarCubiculos() {
  const [rows] = await query(
    `SELECT e.espacio_id AS id, e.nombre, e.capacidad AS lugares, e.estado AS estado_espacio,
            EXISTS (
              SELECT 1 FROM reserva r
                JOIN estado_reserva er ON er.estado_id = r.estado_id
               WHERE r.espacio_id = e.espacio_id
                 AND er.nombre_estado = 'Confirmada'
                 AND r.fecha_reserva = CURDATE()
            ) AS reservado_hoy
       FROM espacio e
      WHERE e.tipo_id = ? AND e.edificio_id = ?
      ORDER BY e.espacio_id`,
    [TIPO_CUBICULO, EDIFICIO_BIBLIOTECA],
  )
  return rows
}

// Devuelve un cubículo concreto (o null) validando que sea de la biblioteca.
export async function cubiculoPorId(id) {
  const [rows] = await query(
    `SELECT espacio_id AS id, nombre, capacidad AS lugares, estado AS estado_espacio
       FROM espacio
      WHERE espacio_id = ? AND tipo_id = ? AND edificio_id = ?
      LIMIT 1`,
    [id, TIPO_CUBICULO, EDIFICIO_BIBLIOTECA],
  )
  return rows[0] || null
}

// Crea un cubículo nuevo (estado Disponible). Devuelve el id insertado.
export async function crearCubiculo({ nombre, capacidad }) {
  const [result] = await query(
    `INSERT INTO espacio (tipo_id, edificio_id, nombre, capacidad, estado)
     VALUES (?, ?, ?, ?, 'Disponible')`,
    [TIPO_CUBICULO, EDIFICIO_BIBLIOTECA, nombre, capacidad],
  )
  return result.insertId
}

// Cambia el estado del espacio (Disponible / Mantenimiento).
export async function actualizarEstadoCubiculo(id, estado) {
  const [result] = await query(
    `UPDATE espacio SET estado = ?
      WHERE espacio_id = ? AND tipo_id = ? AND edificio_id = ?`,
    [estado, id, TIPO_CUBICULO, EDIFICIO_BIBLIOTECA],
  )
  return result.affectedRows > 0
}

// Elimina un cubículo. Lanza el error de FK si tiene reservas (lo maneja el controlador).
export async function eliminarCubiculo(id) {
  const [result] = await query(
    `DELETE FROM espacio
      WHERE espacio_id = ? AND tipo_id = ? AND edificio_id = ?`,
    [id, TIPO_CUBICULO, EDIFICIO_BIBLIOTECA],
  )
  return result.affectedRows > 0
}
