// Acceso a catálogos para armar una reserva (tipos de espacio y espacios).
// Solo lectura sobre la BD existente reservas_upa.
import { query } from '../config/db.js'

// Tipos de espacio que un rol puede reservar (tabla pivote rol_tipo_espacio).
export async function tiposPorRol(rolId) {
  const [rows] = await query(
    `SELECT te.tipo_id, te.nombre_tipo, te.descripcion, te.capacidad_default
       FROM rol_tipo_espacio rte
       JOIN tipo_espacio te ON te.tipo_id = rte.tipo_id
      WHERE rte.rol_id = ?
      ORDER BY te.tipo_id`,
    [rolId],
  )
  return rows
}

// Espacios concretos de un tipo, con su edificio. Ordenados por edificio y nombre.
export async function espaciosPorTipo(tipoId) {
  const [rows] = await query(
    `SELECT e.espacio_id, e.nombre, e.capacidad, e.estado,
            ed.edificio_id, ed.nombre AS edificio, ed.codigo AS edificio_codigo
       FROM espacio e
       JOIN edificio ed ON ed.edificio_id = e.edificio_id
      WHERE e.tipo_id = ?
      ORDER BY ed.nombre, e.nombre`,
    [tipoId],
  )
  return rows
}
