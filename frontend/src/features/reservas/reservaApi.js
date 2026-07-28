// Cliente de reservas (estudiante/docente). Usa el axios compartido con JWT.
import api from '../../services/api.js'

export const getEspaciosReservables = (tipo = 'Cubículo') =>
  api.get('/reservas/espacios', { params: { tipo } }).then((r) => r.data.espacios)

export const getDisponibilidad = (espacioId, desde, hasta) =>
  api
    .get('/reservas/disponibilidad', { params: { espacio_id: espacioId, desde, hasta } })
    .then((r) => r.data.reservas)

export const crearReserva = (payload) => api.post('/reservas', payload).then((r) => r.data)

export const getMisReservas = () => api.get('/reservas/mias').then((r) => r.data.reservas)

export const msgError = (err, fallback = 'Ocurrió un error') =>
  err?.response?.data?.message || fallback

// Utilidad: Date -> 'YYYY-MM-DD' en hora local (evita corrimientos de zona).
export const fmtISO = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
