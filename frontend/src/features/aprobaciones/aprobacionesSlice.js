import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api.js'

// Estado de cada solicitud: 'pendiente' | 'aprobada' | 'rechazada'

export const fetchAprobaciones = createAsyncThunk(
  'aprobaciones/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/admin/aprobaciones')
      return data.items
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Error al cargar las solicitudes')
    }
  },
)

export const aprobar = createAsyncThunk(
  'aprobaciones/aprobar',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/admin/aprobaciones/${id}`, { estado: 'aprobada' })
      return data // { id, estado }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Error al aprobar')
    }
  },
)

export const rechazar = createAsyncThunk(
  'aprobaciones/rechazar',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/admin/aprobaciones/${id}`, { estado: 'rechazada' })
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Error al rechazar')
    }
  },
)

const initialState = {
  items: [],
  status: 'idle', // idle | loading | succeeded | failed
  error: null,
}

const aprobacionesSlice = createSlice({
  name: 'aprobaciones',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    const setEstado = (state, action) => {
      const s = state.items.find((x) => x.id === action.payload.id)
      if (s) s.estado = action.payload.estado
    }
    builder
      .addCase(fetchAprobaciones.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchAprobaciones.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchAprobaciones.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
      .addCase(aprobar.fulfilled, setEstado)
      .addCase(rechazar.fulfilled, setEstado)
  },
})

export const selectSolicitudes = (state) => state.aprobaciones.items
export const selectAprStatus = (state) => state.aprobaciones.status
export default aprobacionesSlice.reducer
