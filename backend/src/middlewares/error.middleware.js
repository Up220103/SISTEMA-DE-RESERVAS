// Manejo centralizado de errores.
// Las respuestas de error siempre tienen la forma { message } para que el
// frontend (axios) pueda leer err.response.data.message.

// 404: ninguna ruta coincidio.
export function notFound(req, res, next) {
  res.status(404).json({ message: `Ruta no encontrada: ${req.method} ${req.originalUrl}` })
}

// Manejador final: traduce cualquier error a JSON con su codigo de estado.
export function errorHandler(err, req, res, next) {
  const status = err.statusCode || err.status || 500
  const message = err.message || 'Error interno del servidor'
  if (status >= 500) console.error(err)
  res.status(status).json({ message })
}
