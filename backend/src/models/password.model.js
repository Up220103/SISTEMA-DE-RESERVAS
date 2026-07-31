// Acceso a `solicitud_password`: las peticiones de "olvide mi contrasena".
//
// Seguridad: el token que viaja en el enlace NUNCA se guarda en claro. Se
// almacena su SHA-256, igual que se hace con las contrasenas. Al validar, se
// vuelve a hashear lo que llega y se compara.
import { query } from '../config/db.js'

// Minutos que dura un enlace de restablecimiento.
export const MINUTOS_VIGENCIA = 60

// Crea la solicitud. Invalida las anteriores del mismo usuario para que solo
// el ultimo enlace pedido siga sirviendo.
export async function crearSolicitud(usuarioId, tokenHash) {
  await query(
    'UPDATE solicitud_password SET usado = TRUE WHERE usuario_id = ? AND usado = FALSE',
    [usuarioId],
  )
  const [r] = await query(
    `INSERT INTO solicitud_password (usuario_id, token_hash, expira)
     VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))`,
    [usuarioId, tokenHash, MINUTOS_VIGENCIA],
  )
  return r.insertId
}

// Devuelve la solicitud vigente que corresponde a ese token, o null.
// "Vigente" = no usada y no expirada.
export async function solicitudVigentePorToken(tokenHash) {
  const [rows] = await query(
    `SELECT s.solicitud_id, s.usuario_id, s.expira, u.email, u.nombre, u.apellido, u.estado
       FROM solicitud_password s
       JOIN usuario u ON u.usuario_id = s.usuario_id
      WHERE s.token_hash = ? AND s.usado = FALSE AND s.expira > NOW()
      LIMIT 1`,
    [tokenHash],
  )
  return rows[0] || null
}

// Marca la solicitud como usada (tras restablecer la contrasena).
export async function marcarUsada(solicitudId, adminId = null) {
  const [r] = await query(
    'UPDATE solicitud_password SET usado = TRUE, atendida_por = ? WHERE solicitud_id = ?',
    [adminId, solicitudId],
  )
  return r.affectedRows
}

// Marca como atendidas todas las solicitudes abiertas de un usuario. Se usa
// cuando el Admin General le restablece la contrasena a mano: la peticion ya
// quedo resuelta, asi que desaparece de la bandeja.
export async function cerrarSolicitudesDeUsuario(usuarioId, adminId) {
  const [r] = await query(
    'UPDATE solicitud_password SET usado = TRUE, atendida_por = ? WHERE usuario_id = ? AND usado = FALSE',
    [adminId, usuarioId],
  )
  return r.affectedRows
}

// Solicitudes pendientes (sin usar y sin expirar) para el panel del Admin General.
export async function solicitudesPendientes() {
  const [rows] = await query(
    `SELECT s.solicitud_id, s.usuario_id, s.fecha_solicitud, s.expira,
            u.nombre, u.apellido, u.email, r.nombre_rol AS rol
       FROM solicitud_password s
       JOIN usuario u ON u.usuario_id = s.usuario_id
       JOIN rol r     ON r.rol_id = u.rol_id
      WHERE s.usado = FALSE AND s.expira > NOW()
      ORDER BY s.fecha_solicitud DESC`,
  )
  return rows
}
