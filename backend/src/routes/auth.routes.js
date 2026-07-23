import { Router } from 'express'

import { register, login, me, perfil, editarPerfil, cambiarPassword } from '../controllers/auth.controller.js'
import { requireAuth } from '../middlewares/auth.middleware.js'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.get('/me', requireAuth, me)
router.get('/perfil', requireAuth, perfil)
router.put('/perfil', requireAuth, editarPerfil)
router.post('/cambiar-password', requireAuth, cambiarPassword)

export default router
