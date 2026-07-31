import { Router } from 'express'

import {
  register,
  login,
  me,
  perfil,
  editarPerfil,
  cambiarPassword,
  olvidePassword,
  validarTokenPassword,
  restablecerPassword,
} from '../controllers/auth.controller.js'
import { requireAuth } from '../middlewares/auth.middleware.js'

const router = Router()

router.post('/register', register)
router.post('/login', login)

// Recuperacion de contrasena: publicas a proposito (quien las usa es
// justamente alguien que no puede iniciar sesion). La proteccion es el token
// de un solo uso que viaja por correo, no la sesion.
router.post('/olvide-password', olvidePassword)
router.get('/restablecer/:token', validarTokenPassword)
router.post('/restablecer', restablecerPassword)

router.get('/me', requireAuth, me)
router.get('/perfil', requireAuth, perfil)
router.put('/perfil', requireAuth, editarPerfil)
router.post('/cambiar-password', requireAuth, cambiarPassword)

export default router
