import { configureStore } from '@reduxjs/toolkit'

import authReducer from '../features/auth/authSlice.js'
import bookingReducer from '../features/bookings/bookingSlice.js'
import cubiculosReducer from '../features/cubiculos/cubiculosSlice.js'
import aprobacionesReducer from '../features/aprobaciones/aprobacionesSlice.js'
import calendarioReducer from '../features/calendario/calendarioSlice.js'
import reportesReducer from '../features/reportes/reportesSlice.js'
import reservasReducer from '../features/reservas/reservaSlice.js'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    bookings: bookingReducer,
    cubiculos: cubiculosReducer,
    aprobaciones: aprobacionesReducer,
    calendario: calendarioReducer,
    reportes: reportesReducer,
    reservas: reservasReducer,
  },
})
