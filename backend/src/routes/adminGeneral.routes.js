// Rutas del panel de Administrador General. Se montan bajo /api/admin-general
// (separado del /api/admin del Admin Biblioteca para evitar colisiones).
// Protegido: requiere sesion (JWT) + rol 4 (Admin General).
import { Router } from 'express'

import { requireAuth } from '../middlewares/auth.middleware.js'
import { requireAdminGeneral } from '../middlewares/role.middleware.js'
import * as ctrl from '../controllers/admin.controller.js'

const router = Router()

router.use(requireAuth, requireAdminGeneral)

// Usuarios
router.get('/usuarios', ctrl.getUsuarios)
router.get('/usuarios/:id/reservas', ctrl.getReservasUsuario)
router.patch('/usuarios/:id', ctrl.patchUsuario)
router.patch('/usuarios/:id/estado', ctrl.patchEstado)
router.patch('/usuarios/:id/rol', ctrl.patchRol)
router.post('/usuarios/:id/password', ctrl.postPasswordUsuario)
router.get('/roles', ctrl.getRoles)

// Solicitudes de "olvide mi contrasena" pendientes de atender.
router.get('/solicitudes-password', ctrl.getSolicitudesPassword)

// Espacios / edificios
router.get('/edificios', ctrl.getEdificios)
router.get('/tipos-espacio', ctrl.getTipos)
router.get('/espacios', ctrl.getEspacios)
router.post('/espacios', ctrl.postEspacio)
router.patch('/espacios/:id', ctrl.patchEspacio)
router.post('/edificios', ctrl.postEdificio)

// Reportes / calendario / reservas
router.get('/reportes', ctrl.getReportes)
router.get('/reservas', ctrl.getReservas)
router.patch('/reservas/:id/estado', ctrl.patchReservaEstado)

// Cierre por ciclo escolar / universidad cerrada
router.get('/cierre', ctrl.getCierre)
router.put('/cierre', ctrl.putCierre)
router.delete('/cierre', ctrl.deleteCierre)

export default router
