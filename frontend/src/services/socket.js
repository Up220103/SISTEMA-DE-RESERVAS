import { io } from 'socket.io-client'

// Conexion Socket.IO con el backend para recibir avisos en tiempo real.
// Se conecta al mismo host que la API, pero sin el sufijo `/api`.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
const SOCKET_URL = API_URL.replace(/\/api\/?$/, '')

let socket = null

// Abre (o reutiliza) la conexion autenticada con el token guardado.
export function conectarSocket() {
  const token = localStorage.getItem('token')
  if (!token) return null
  if (socket && socket.connected) return socket
  if (socket) socket.disconnect()
  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
  })
  return socket
}

export function desconectarSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
