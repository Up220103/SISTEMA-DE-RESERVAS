// Middleware de autenticacion JWT.
// Protege rutas que requieren "Authorization: Bearer <token>".
import jwt from 'jsonwebtoken'

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const [scheme, token] = header.split(' ')

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Token no proporcionado.' })
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secreto_de_desarrollo')
    req.user = { id: payload.id, email: payload.email }
    next()
  } catch {
    return res.status(401).json({ message: 'Token invalido o expirado.' })
  }
}

export default requireAuth
