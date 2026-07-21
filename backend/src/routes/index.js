// Enrutador raiz. Se monta bajo /api en app.js.
import { Router } from 'express'

import authRoutes from './auth.routes.js'

const router = Router()

router.use('/auth', authRoutes)
// Rutas futuras del dominio de reservas:
// router.use('/bookings', bookingRoutes)

export default router
