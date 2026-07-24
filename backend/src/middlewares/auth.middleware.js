// Middleware de autenticacion y autorizacion (JWT + roles).
// requireAuth: protege rutas que requieren "Authorization: Bearer <token>".
// requireRol:  restringe una ruta a uno o varios roles (rol_id).
import jwt from 'jsonwebtoken'

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const [scheme, token] = header.split(' ')

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Token no proporcionado.' })
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secreto_de_desarrollo')
    req.user = { id: payload.id, email: payload.email, rol_id: payload.rol_id }
    next()
  } catch {
    return res.status(401).json({ message: 'Token invalido o expirado.' })
  }
}

// Uso: router.get('/ruta', requireAuth, requireRol(3), handler)
// rol_id: 1=Estudiante, 2=Docente, 3=Admin Biblioteca, 4=Admin General.
export function requireRol(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'No autenticado.' })
    }
    if (!rolesPermitidos.includes(req.user.rol_id)) {
      return res.status(403).json({ message: 'No tienes permiso para esta accion.' })
    }
    next()
  }
}

export default requireAuth
