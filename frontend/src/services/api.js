import axios from 'axios'

// Vite resuelve VITE_API_URL en tiempo de build (ver Dockerfile del frontend).
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  headers: { 'Content-Type': 'application/json' },
})

// Adjunta el token en cada peticion si existe
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Si el token expiro o es invalido, limpiamos la sesion y mandamos al login.
// (Sin esto, el panel se queda abierto pero vacio y sin explicacion.)
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.replace('/login')
      }
    }
    return Promise.reject(error)
  },
)

export default api
