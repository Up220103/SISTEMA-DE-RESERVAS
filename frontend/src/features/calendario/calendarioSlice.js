import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api.js'

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
  },
})

export const selectReservasMes = (state) => state.calendario.items
export default calendarioSlice.reducer
