import { Router } from 'express'

import { getTipos, getEspacios } from '../controllers/catalogo.controller.js'
import { requireAuth } from '../middlewares/auth.middleware.js'

const router = Router()

router.get('/tipos', requireAuth, getTipos)
router.get('/espacios', requireAuth, getEspacios)

export default router
