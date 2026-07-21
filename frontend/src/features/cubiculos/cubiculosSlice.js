import { createSlice, createSelector } from '@reduxjs/toolkit'

// Estados posibles: 'disponible' | 'reservado' | 'inhabilitado'
// Datos mock — se reemplazarán por una llamada al backend (GET /api/cubiculos).
const initialState = {
  edificio: 'Edificio 5 · Biblioteca',
  items: [
    { id: 1, nombre: 'Cubículo 1', lugares: 4, estado: 'disponible' },
    { id: 2, nombre: 'Cubículo 2', lugares: 6, estado: 'reservado',    reserva: { por: 'Mtra. López',    hasta: '14:00', motivo: 'Cálculo I' } },
    { id: 3, nombre: 'Cubículo 3', lugares: 6, estado: 'disponible' },
    { id: 4, nombre: 'Cubículo 4', lugares: 6, estado: 'reservado',    reserva: { por: 'Equipo Robótica', hasta: '12:00', motivo: 'Reunión' } },
    { id: 5, nombre: 'Cubículo 5', lugares: 6, estado: 'disponible' },
    { id: 6, nombre: 'Cubículo 6', lugares: 4, estado: 'inhabilitado', reserva: { motivo: 'Mantenimiento' } },
    { id: 7, nombre: 'Cubículo 7', lugares: 4, estado: 'reservado',    reserva: { por: 'Daniela H.',      hasta: '13:00', motivo: 'Estudio' } },
  ],
}

const cubiculosSlice = createSlice({
  name: 'cubiculos',
  initialState,
  reducers: {
    setEstado(state, action) {
      const { id, estado } = action.payload
      const cub = state.items.find((c) => c.id === id)
      if (cub) cub.estado = estado
    },
  },
})

export const { setEstado } = cubiculosSlice.actions

export const selectCubiculos = (state) => state.cubiculos.items
export const selectEdificio = (state) => state.cubiculos.edificio

export const selectResumen = createSelector([selectCubiculos], (items) => ({
  total:        items.length,
  reservados:   items.filter((c) => c.estado === 'reservado').length,
  disponibles:  items.filter((c) => c.estado === 'disponible').length,
  inhabilitados: items.filter((c) => c.estado === 'inhabilitado').length,
}))

export default cubiculosSlice.reducer
