import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api.js'
import { aprobar, rechazar } from '../aprobaciones/aprobacionesSlice.js'

// Reservas de cubículos del mes en vista (para pintar el calendario del panel).
export const fetchReservasMes = createAsyncThunk(
  'calendario/fetchMes',
  async ({ anio, mes }, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/admin/calendario', { params: { anio, mes } })
      return data.items
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Error al cargar el calendario')
    }
  },
)

const calendarioSlice = createSlice({
  name: 'calendario',
  initialState: { items: [], status: 'idle', error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchReservasMes.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchReservasMes.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchReservasMes.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
      // Al aprobar/rechazar (desde Aprobaciones o desde el propio calendario)
      // se actualiza la reserva aqui para que el badge del dia baje al instante.
      .addMatcher(
        (action) => aprobar.fulfilled.match(action) || rechazar.fulfilled.match(action),
        (state, action) => {
          const r = state.items.find((x) => x.id === action.payload.id)
          if (r) r.estado = action.payload.estado
        },
      )
  },
})

export const selectReservasMes = (state) => state.calendario.items
export default calendarioSlice.reducer
