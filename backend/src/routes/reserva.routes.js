import { Router } from 'express'

import {
  misReservas,
  getHorasOcupadas,
  postReserva,
  cancelarMiReserva,
} from '../controllers/reserva.controller.js'
import { requireAuth } from '../middlewares/auth.middleware.js'
import { requireActivo } from '../middlewares/role.middleware.js'

const router = Router()

// requireActivo: una cuenta desactivada no puede seguir operando con un token
// emitido antes de la desactivacion.
router.get('/mias', requireAuth, requireActivo, misReservas)
router.get('/horas-ocupadas', requireAuth, requireActivo, getHorasOcupadas)
router.post('/', requireAuth, requireActivo, postReserva)
router.patch('/:id/cancelar', requireAuth, requireActivo, cancelarMiReserva)

export default router
