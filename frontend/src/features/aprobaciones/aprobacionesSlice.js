import { createSlice } from '@reduxjs/toolkit'

// Estado de cada solicitud: 'pendiente' | 'aprobada' | 'rechazada'
// El Admin Biblioteca SOLO aprueba reservas de cubículos; las de laboratorios
// y auditorios las gestiona el Admin General.
// Datos mock — luego vendrán de GET /api/reservas?tipo=cubiculo&estado=pendiente.
const initialState = {
  items: [
    {
      id: 1,
      initials: 'DH',
      nombre: 'Daniela Hernández',
      tipo: 'ESTUDIANTE',
      lugar: 'Cubículo 3',
      fecha: 'Mié 19 Feb',
      hora: '13:00–14:00',
      motivo: 'Estudio grupal',
      estado: 'pendiente',
    },
    {
      id: 2,
      initials: 'CN',
      nombre: 'Carlos Núñez',
      tipo: 'ESTUDIANTE',
      lugar: 'Cubículo 5',
      fecha: 'Jue 20 Feb',
      hora: '10:00–12:00',
      motivo: 'Proyecto integrador',
      estado: 'pendiente',
    },
    {
      id: 3,
      initials: 'AT',
      nombre: 'Ana Torres',
      tipo: 'ESTUDIANTE',
      lugar: 'Cubículo 1',
      fecha: 'Vie 21 Feb',
      hora: '9:00–11:00',
      motivo: 'Repaso para examen',
      estado: 'pendiente',
    },
    {
      id: 4,
      initials: 'LH',
      nombre: 'Luis Herrera',
      tipo: 'ESTUDIANTE',
      lugar: 'Cubículo 7',
      fecha: 'Lun 17 Feb',
      hora: '16:00–18:00',
      motivo: 'Tarea en equipo',
      estado: 'pendiente',
    },
  ],
}

const aprobacionesSlice = createSlice({
  name: 'aprobaciones',
  initialState,
  reducers: {
    aprobar(state, action) {
      const s = state.items.find((x) => x.id === action.payload)
      if (s) s.estado = 'aprobada'
    },
    rechazar(state, action) {
      const s = state.items.find((x) => x.id === action.payload)
      if (s) s.estado = 'rechazada'
    },
  },
})

export const { aprobar, rechazar } = aprobacionesSlice.actions
export const selectSolicitudes = (state) => state.aprobaciones.items
export default aprobacionesSlice.reducer
