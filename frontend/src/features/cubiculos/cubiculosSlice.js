import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit'
import api from '../../services/api.js'

// Estados: 'disponible' | 'reservado' | 'inhabilitado' (los deriva el backend).

export const fetchCubiculos = createAsyncThunk(
  'cubiculos/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/admin/cubiculos')
      return data // { edificio, resumen, items }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Error al cargar cubículos')
    }
  },
)

export const agregarCubiculo = createAsyncThunk(
  'cubiculos/agregar',
  async ({ lugares }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/admin/cubiculos', { lugares })
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Error al agregar el cubículo')
    }
  },
)

export const setEstado = createAsyncThunk(
  'cubiculos/setEstado',
  async ({ id, estado }, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/admin/cubiculos/${id}/estado`, { estado })
      // { id, estado, reservasCanceladas }: al inhabilitarlo, el backend cancela
      // las reservas futuras de ese cubículo y libera sus horarios.
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Error al cambiar el estado')
    }
  },
)

export const eliminarCubiculo = createAsyncThunk(
  'cubiculos/eliminar',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/admin/cubiculos/${id}`)
      return id
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Error al eliminar el cubículo')
    }
  },
)

const initialState = {
  edificio: '',
  items: [],
  status: 'idle', // idle | loading | succeeded | failed
  error: null,
  aviso: null, // mensaje informativo tras una acción (p. ej. reservas canceladas)
}

const cubiculosSlice = createSlice({
  name: 'cubiculos',
  initialState,
  reducers: {
    limpiarAviso(state) {
      state.aviso = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCubiculos.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchCubiculos.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.edificio = action.payload.edificio
        state.items = action.payload.items
      })
      .addCase(fetchCubiculos.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
      .addCase(agregarCubiculo.fulfilled, (state, action) => {
        state.items.push(action.payload)
      })
      .addCase(setEstado.fulfilled, (state, action) => {
        const cub = state.items.find((c) => c.id === action.payload.id)
        if (cub) cub.estado = action.payload.estado
        const n = action.payload.reservasCanceladas || 0
        state.aviso = n
          ? `Se cancelaron ${n} reserva${n === 1 ? '' : 's'} futura${n === 1 ? '' : 's'} de este cubículo y se avisó a cada usuario.`
          : null
      })
      .addCase(eliminarCubiculo.fulfilled, (state, action) => {
        state.items = state.items.filter((c) => c.id !== action.payload)
      })
  },
})

export const { limpiarAviso } = cubiculosSlice.actions
export const selectCubiculos = (state) => state.cubiculos.items
export const selectEdificio = (state) => state.cubiculos.edificio
export const selectCubStatus = (state) => state.cubiculos.status
export const selectCubError = (state) => state.cubiculos.error
export const selectCubAviso = (state) => state.cubiculos.aviso

export const selectResumen = createSelector([selectCubiculos], (items) => ({
  total: items.length,
  reservados: items.filter((c) => c.estado === 'reservado').length,
  disponibles: items.filter((c) => c.estado === 'disponible').length,
  inhabilitados: items.filter((c) => c.estado === 'inhabilitado').length,
}))

export default cubiculosSlice.reducer
