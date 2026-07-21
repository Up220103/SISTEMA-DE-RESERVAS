import { configureStore } from '@reduxjs/toolkit'

import authReducer from '../features/auth/authSlice.js'
import bookingReducer from '../features/bookings/bookingSlice.js'
import cubiculosReducer from '../features/cubiculos/cubiculosSlice.js'
import aprobacionesReducer from '../features/aprobaciones/aprobacionesSlice.js'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    bookings: bookingReducer,
    cubiculos: cubiculosReducer,
    aprobaciones: aprobacionesReducer,
  },
})
