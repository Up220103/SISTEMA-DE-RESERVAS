// Acceso a datos de la tabla `usuario` (esquema real del equipo, BD reservas_upa).
// Ver database/sistema_reservas_upa.sql. `password_hash` guarda el hash bcrypt.
import { query } from '../config/db.js'

// Devuelve el usuario por correo (incluye el hash y el rol), o null. Para login.
export async function findByEmail(email) {
  const [rows] = await query(
    `SELECT u.usuario_id, u.rol_id, u.nombre, u.apellido, u.email,
            u.password_hash, u.estado, r.nombre_rol
       FROM usuario u
       JOIN rol r ON r.rol_id = u.rol_id
      WHERE u.email = ? LIMIT 1`,
    [email],
  )
  return rows[0] || null
}

// Devuelve el usuario por id, sin el hash (datos publicos), o null. Para /me.
export async function findById(id) {
  const [rows] = await query(
    `SELECT u.usuario_id, u.rol_id, u.nombre, u.apellido, u.email, u.estado, r.nombre_rol
       FROM usuario u
       JOIN rol r ON r.rol_id = u.rol_id
      WHERE u.usuario_id = ? LIMIT 1`,
    [id],
  )
  return rows[0] || null
}

// Perfil completo para el panel de usuario: incluye identificador (matrícula del
// estudiante o número de empleado del docente) y el hash (para validar el cambio).
export async function perfilPorId(id) {
  const [rows] = await query(
    `SELECT u.usuario_id, u.rol_id, u.nombre, u.apellido, u.email, u.estado,
            u.telefono, u.password_hash, r.nombre_rol,
            COALESCE(e.matricula, d.num_empleado) AS identificador
       FROM usuario u
       JOIN rol r            ON r.rol_id = u.rol_id
       LEFT JOIN estudiante e ON e.usuario_id = u.usuario_id
       LEFT JOIN docente d    ON d.usuario_id = u.usuario_id
      WHERE u.usuario_id = ? LIMIT 1`,
    [id],
  )
  return rows[0] || null
}

// Actualiza datos editables del perfil (nombre, apellido, teléfono).
export async function actualizarPerfil(id, { nombre, apellido, telefono }) {
  const [result] = await query(
    'UPDATE usuario SET nombre = ?, apellido = ?, telefono = ? WHERE usuario_id = ?',
    [nombre, apellido, telefono || null, id],
  )
  return result.affectedRows
}

// Actualiza el hash de la contraseña de un usuario.
export async function actualizarPassword(id, passwordHash) {
  const [result] = await query('UPDATE usuario SET password_hash = ? WHERE usuario_id = ?', [
    passwordHash,
    id,
  ])
  return result.affectedRows
}

// Crea un usuario y devuelve la fila completa (con rol). rolId por defecto 1 (Estudiante).
export async function createUser({ nombre, apellido, email, passwordHash, rolId = 1, telefono = null }) {
  const [result] = await query(
    `INSERT INTO usuario (rol_id, nombre, apellido, email, password_hash, telefono, estado)
     VALUES (?, ?, ?, ?, ?, ?, 'Activo')`,
    [rolId, nombre, apellido, email, passwordHash, telefono],
  )
  return findById(result.insertId)
}
