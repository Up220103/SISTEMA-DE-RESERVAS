// Enrutador raiz. Se monta bajo /api en app.js.
import { Router } from 'express'

import authRoutes from './auth.routes.js'
import catalogoRoutes from './catalogo.routes.js'
import reservaRoutes from './reserva.routes.js'
import notificacionRoutes from './notificacion.routes.js'
import adminRoutes from './admin.routes.js'
import adminGeneralRoutes from './adminGeneral.routes.js'

const router = Router()

router.use('/auth', authRoutes)
router.use('/catalogo', catalogoRoutes)
router.use('/reservas', reservaRoutes)
router.use('/notificaciones', notificacionRoutes)
router.use('/admin', adminRoutes)
router.use('/admin-general', adminGeneralRoutes)

export default router
