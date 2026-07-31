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
import { getReporteCubiculos, getReporteCubiculosPdf } from '../controllers/reporte.controller.js'
import { requireAuth } from '../middlewares/auth.middleware.js'
import { requireAdminBiblioteca } from '../middlewares/role.middleware.js'

const router = Router()

// Guard global: autenticado + Admin Biblioteca. El rol se lee de la BD (no del
// JWT) para que quitarle el rol a alguien le cierre el panel al instante.
router.use(requireAuth, requireAdminBiblioteca)

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

// Reportes: métricas para el dashboard y descarga en PDF.
router.get('/reportes/cubiculos', getReporteCubiculos)
router.get('/reportes/cubiculos/pdf', getReporteCubiculosPdf)

export default router
