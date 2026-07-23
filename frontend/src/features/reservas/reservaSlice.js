import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api.js'

// Tipos de espacio que el usuario puede reservar (según su rol).
export const fetchTipos = createAsyncThunk('reservas/tipos', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/catalogo/tipos')
    return data.tipos
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Error al cargar tipos de espacio')
  }
})

// Espacios de un tipo, agrupados por edificio.
export const fetchEspacios = createAsyncThunk('reservas/espacios', async (tipoId, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/catalogo/espacios', { params: { tipo_id: tipoId } })
    return { tipoId, porEdificio: data.porEdificio, espacios: data.espacios }
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Error al cargar espacios')
  }
})

// Horas ocupadas (8..19) de un espacio o de un tipo en una fecha.
export const fetchHorasOcupadas = createAsyncThunk(
  'reservas/horasOcupadas',
  async ({ fecha, espacioId, tipoId }, { rejectWithValue }) => {
    try {
      const params = { fecha }
      if (espacioId) params.espacio_id = espacioId
      else if (tipoId) params.tipo_id = tipoId
      const { data } = await api.get('/reservas/horas-ocupadas', { params })
      return data.ocupadas
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Error al cargar disponibilidad')
    }
  },
)

// Reservas del usuario autenticado.
export const fetchMisReservas = createAsyncThunk('reservas/mias', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/reservas/mias')
    return data.reservas
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Error al cargar tus reservas')
  }
})

// Notificaciones del usuario.
export const fetchNotificaciones = createAsyncThunk('reservas/notis', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/notificaciones')
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Error al cargar notificaciones')
  }
})

export const leerNotificaciones = createAsyncThunk('reservas/notisLeer', async (_, { rejectWithValue }) => {
  try {
    await api.post('/notificaciones/leer')
    return true
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Error')
  }
})

// Crea una reserva. En caso de regla de negocio, el backend responde con message.
export const crearReserva = createAsyncThunk('reservas/crear', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/reservas', payload)
    return data.reserva
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'No se pudo crear la reserva')
  }
})

const reservaSlice = createSlice({
  name: 'reservas',
  initialState: {
    tipos: [],
    porEdificio: {},
    espacios: [],
    mias: [],
    ocupadas: [],
    notificaciones: [],
    noLeidas: 0,
    creando: false,
    error: null,
    exito: null,
  },
  reducers: {
    limpiarMensajes(state) {
      state.error = null
      state.exito = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTipos.fulfilled, (state, action) => {
        state.tipos = action.payload
      })
      .addCase(fetchEspacios.fulfilled, (state, action) => {
        state.porEdificio = action.payload.porEdificio
        state.espacios = action.payload.espacios
      })
      .addCase(fetchMisReservas.fulfilled, (state, action) => {
        state.mias = action.payload
      })
      .addCase(fetchHorasOcupadas.pending, (state) => {
        state.ocupadas = []
      })
      .addCase(fetchHorasOcupadas.fulfilled, (state, action) => {
        state.ocupadas = action.payload
      })
      .addCase(fetchNotificaciones.fulfilled, (state, action) => {
        state.notificaciones = action.payload.notificaciones
        state.noLeidas = action.payload.noLeidas
      })
      .addCase(leerNotificaciones.fulfilled, (state) => {
        state.noLeidas = 0
        state.notificaciones = state.notificaciones.map((n) => ({ ...n, leida: 1 }))
      })
      .addCase(crearReserva.pending, (state) => {
        state.creando = true
        state.error = null
        state.exito = null
      })
      .addCase(crearReserva.fulfilled, (state, action) => {
        state.creando = false
        state.exito = 'Reserva creada correctamente.'
        state.mias.unshift(action.payload)
      })
      .addCase(crearReserva.rejected, (state, action) => {
        state.creando = false
        state.error = action.payload
      })
  },
})

export const { limpiarMensajes } = reservaSlice.actions
export default reservaSlice.reducer
