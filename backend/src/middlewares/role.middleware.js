// Middlewares que consultan el estado REAL del usuario en la BD.
//
// Por que no basta el JWT: el token se firma al iniciar sesion y vive 8 horas.
// Si en ese rato el Admin General desactiva la cuenta o le cambia el rol, el
// token viejo sigue diciendo lo de antes. Estos middlewares releen la BD en
// cada peticion, asi que un cambio de usuario surte efecto de inmediato.
import { findById } from '../models/user.model.js'

// Carga el usuario real en req.user y rechaza las cuentas desactivadas.
export async function requireActivo(req, res, next) {
  try {
    const usuario = await findById(req.user.id)
    if (!usuario) return res.status(401).json({ message: 'Usuario no encontrado.' })
    if (usuario.estado !== 'Activo') {
      return res.status(403).json({ message: 'La cuenta esta inactiva.' })
    }
    req.user.rol_id = usuario.rol_id
    req.user.nombre_rol = usuario.nombre_rol
    next()
  } catch (err) {
    next(err)
  }
}

// Restringe a ciertos rol_id, comprobando ademas que la cuenta siga activa.
// rol_id: 1=Estudiante, 2=Docente, 3=Admin Biblioteca, 4=Admin General.
export function requireRol(...rolesPermitidos) {
  return async function (req, res, next) {
    try {
      const usuario = await findById(req.user.id)
      if (!usuario) return res.status(401).json({ message: 'Usuario no encontrado.' })
      if (usuario.estado !== 'Activo') {
        return res.status(403).json({ message: 'La cuenta esta inactiva.' })
      }
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
export const requireAdminBiblioteca = requireRol(3)
