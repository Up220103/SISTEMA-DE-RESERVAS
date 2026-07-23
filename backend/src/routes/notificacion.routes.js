import { Router } from 'express'

import { getNotificaciones, leerNotificaciones } from '../controllers/notificacion.controller.js'
import { requireAuth } from '../middlewares/auth.middleware.js'

const router = Router()

router.get('/', requireAuth, getNotificaciones)
router.post('/leer', requireAuth, leerNotificaciones)

export default router
