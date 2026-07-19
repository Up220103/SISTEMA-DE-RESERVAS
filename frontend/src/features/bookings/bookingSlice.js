import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api.js'

export const fetchBookings = createAsyncThunk(
  'bookings/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/bookings')
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Error al cargar reservas')
    }
  },
)

export const createBooking = createAsyncThunk(
  'bookings/create',
  async (booking, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/bookings', booking)
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Error al crear la reserva')
    }
  },
)

const bookingSlice = createSlice({
  name: 'bookings',
  initialState: {
    items: [],
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBookings.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(fetchBookings.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchBookings.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.items.push(action.payload)
      })
  },
})

export const selectAllBookings = (state) => state.bookings.items
export default bookingSlice.reducer
