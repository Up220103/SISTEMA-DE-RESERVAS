// Rutas del panel Admin Biblioteca. Todas requieren rol 3 (Admin Biblioteca).
import { Router } from 'express'

import {
  getCubiculos,
  postCubiculo,
  patchEstadoCubiculo,
  deleteCubiculo,
} from '../controllers/cubiculo.controller.js'
import { getAprobaciones, patchAprobacion } from '../controllers/aprobacion.controller.js'
import { getCalendario } from '../controllers/calendario.controller.js'
import { requireAuth, requireRol } from '../middlewares/auth.middleware.js'

const router = Router()

// Guard global: autenticado + Admin Biblioteca.
router.use(requireAuth, requireRol(3))

// Gestión de cubículos (CRUD).
router.get('/cubiculos', getCubiculos)
router.post('/cubiculos', postCubiculo)
router.patch('/cubiculos/:id/estado', patchEstadoCubiculo)
router.delete('/cubiculos/:id', deleteCubiculo)

// Aprobaciones de reservas de cubículos.
router.get('/aprobaciones', getAprobaciones)
router.patch('/aprobaciones/:id', patchAprobacion)

// Calendario de reservas de cubículos (por mes).
router.get('/calendario', getCalendario)

export default router
