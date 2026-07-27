// Middleware de autorizacion por rol. Se usa despues de requireAuth.
// Consulta el rol real del usuario en la BD (el JWT solo trae id/email).
import { findById } from '../models/user.model.js'

// rol_id 4 = Administrador General (ver tabla `rol` en reservas_upa).
export function requireRol(...rolesPermitidos) {
  return async function (req, res, next) {
    try {
      const usuario = await findById(req.user.id)
      if (!usuario) return res.status(401).json({ message: 'Usuario no encontrado.' })
      if (!rolesPermitidos.includes(usuario.rol_id)) {
        return res.status(403).json({ message: 'No tienes permisos para esta accion.' })
      }
      req.user.rol_id = usuario.rol_id
      req.user.nombre_rol = usuario.nombre_rol
      next()
    } catch (err) {
      next(err)
    }
  }
}

export const requireAdminGeneral = requireRol(4)
