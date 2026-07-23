import { notificacionesDeUsuario, contarNoLeidas, marcarLeidas } from '../models/notificacion.model.js'

// GET /api/notificaciones -> lista + conteo de no leídas
export async function getNotificaciones(req, res, next) {
  try {
    const notificaciones = await notificacionesDeUsuario(req.user.id)
    const noLeidas = await contarNoLeidas(req.user.id)
    res.json({ notificaciones, noLeidas })
  } catch (err) {
    next(err)
  }
}

// POST /api/notificaciones/leer -> marca todas como leídas
export async function leerNotificaciones(req, res, next) {
  try {
    await marcarLeidas(req.user.id)
    res.json({ message: 'Notificaciones marcadas como leídas.' })
  } catch (err) {
    next(err)
  }
}
