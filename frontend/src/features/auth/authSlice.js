import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api.js'

// --- DEMO SOLO-FRONT (quitar cuando el backend esté conectado) ---
// Permite probar la app sin backend. Cualquier contraseña sirve.
// rol_id: 1=Estudiante, 2=Docente, 3=Admin Biblioteca, 4=Admin General.
const DEMO_USERS = {
  'alumno@upa.edu.mx':     { usuario_id: 901, nombre: 'Daniela',    apellido: 'Hernández', email: 'alumno@upa.edu.mx',     rol_id: 1 },
  'profesor@upa.edu.mx':   { usuario_id: 902, nombre: 'Andrés',     apellido: 'Ruiz',      email: 'profesor@upa.edu.mx',   rol_id: 2 },
  'biblioteca@upa.edu.mx': { usuario_id: 903, nombre: 'Lic. Sofía', apellido: 'Ramos',     email: 'biblioteca@upa.edu.mx', rol_id: 3 },
}

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    // DEMO SOLO-FRONT: las cuentas demo entran sin backend (quitar al conectar el back).
    const demo = DEMO_USERS[email.trim().toLowerCase()]
    if (demo) {
      const payload = { token: `demo-${demo.rol_id}`, user: demo }
      localStorage.setItem('token', payload.token)
      localStorage.setItem('user', JSON.stringify(demo))
      return payload
    }
    try {
      const { data } = await api.post('/auth/login', { email, password })
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Error al iniciar sesion')
    }
  },
)

export const register = createAsyncThunk(
  'auth/register',
  async ({ nombre, apellido, email, password }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/register', { nombre, apellido, email, password })
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Error al registrarse')
    }
  },
)

function usuarioGuardado() {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const initialState = {
  user: usuarioGuardado(),
  token: localStorage.getItem('token'),
  status: 'idle',   // idle | loading | succeeded | failed
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      state.user = null
      state.token = null
      state.status = 'idle'
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.user = action.payload.user
        state.token = action.payload.token
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
      .addCase(register.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(register.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.user = action.payload.user
        state.token = action.payload.token
      })
      .addCase(register.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
  },
})

export const { logout } = authSlice.actions
export const selectIsAuthenticated = (state) => Boolean(state.auth.token)
export const selectUser = (state) => state.auth.user
// rol_id 1 = Estudiante (ver tabla `rol` en la BD).
export const selectEsAlumno = (state) => state.auth.user?.rol_id === 1
export default authSlice.reducer
