import { Router } from 'express'

import { misReservas, getHorasOcupadas, postReserva } from '../controllers/reserva.controller.js'
import { requireAuth } from '../middlewares/auth.middleware.js'

const router = Router()

router.get('/mias', requireAuth, misReservas)
router.get('/horas-ocupadas', requireAuth, getHorasOcupadas)
router.post('/', requireAuth, postReserva)

export default router
