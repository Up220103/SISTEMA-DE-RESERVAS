// Acceso a la tabla `notificacion` de la BD existente.
import { query } from '../config/db.js'

// Notificaciones de un usuario, más recientes primero.
export async function notificacionesDeUsuario(usuarioId) {
  const [rows] = await query(
    `SELECT notificacion_id, titulo, mensaje, leida, fecha_envio
       FROM notificacion
      WHERE usuario_id = ?
      ORDER BY fecha_envio DESC, notificacion_id DESC`,
    [usuarioId],
  )
  return rows
}

// Número de notificaciones sin leer.
export async function contarNoLeidas(usuarioId) {
  const [rows] = await query(
    'SELECT COUNT(*) AS n FROM notificacion WHERE usuario_id = ? AND leida = FALSE',
    [usuarioId],
  )
  return rows[0].n
}

// Crea una notificación para un usuario.
export async function crearNotificacion(usuarioId, titulo, mensaje) {
  const [result] = await query(
    'INSERT INTO notificacion (usuario_id, titulo, mensaje, leida) VALUES (?, ?, ?, FALSE)',
    [usuarioId, titulo, mensaje],
  )
  return result.insertId
}

// Marca todas las notificaciones del usuario como leídas.
export async function marcarLeidas(usuarioId) {
  const [result] = await query(
    'UPDATE notificacion SET leida = TRUE WHERE usuario_id = ? AND leida = FALSE',
    [usuarioId],
  )
  return result.affectedRows
}
