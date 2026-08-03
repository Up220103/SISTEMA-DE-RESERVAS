// Tiempo real (Socket.IO). Permite avisar al instante a un usuario conectado
// cuando el administrador hace cambios sobre su cuenta.
//
// Cada cliente se conecta enviando su JWT; se une a una sala propia
// `user:<id>`. Para notificarle basta con emitAUsuario(id, evento, datos).
import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'

let io = null

// Levanta Socket.IO sobre el mismo servidor HTTP de Express.
export function initRealtime(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: process.env.CORS_ORIGIN || '*' },
  })

  // Autenticacion: el cliente manda el token en `auth.token`. Sin token valido
  // no se acepta la conexion (nadie escucha canales ajenos).
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token
    if (!token) return next(new Error('Token no proporcionado.'))
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'secreto_de_desarrollo')
      socket.data.userId = payload.id
      next()
    } catch {
      next(new Error('Token invalido o expirado.'))
    }
  })

  io.on('connection', (socket) => {
    socket.join(`user:${socket.data.userId}`)
  })

  return io
}

// Emite un evento a TODAS las pestañas/dispositivos de un usuario concreto.
export function emitAUsuario(usuarioId, evento, datos) {
  if (!io) return
  io.to(`user:${usuarioId}`).emit(evento, datos)
}
