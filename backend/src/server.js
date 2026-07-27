// Punto de entrada del proceso: levanta el servidor HTTP.
// La app de Express vive en app.js (sin listen) para poder testearla.
import 'dotenv/config'

import app from './app.js'
import { testConnection } from './config/db.js'

// App Service inyecta PORT; en local usamos BACKEND_PORT o 4000.
const PORT = process.env.PORT || process.env.BACKEND_PORT || 4000

const server = app.listen(PORT, async () => {
  console.log(`API escuchando en el puerto ${PORT}`)
  try {
    await testConnection()
    console.log('Conexion a MySQL establecida')
  } catch (err) {
    // No tumbamos el proceso: /health debe seguir respondiendo aunque
    // la BD tarde en levantar, si no App Service reinicia en bucle.
    console.error('No se pudo conectar a MySQL:', err.message)
  }
})

// Docker manda SIGTERM al parar el contenedor: cerramos ordenadamente.
for (const señal of ['SIGTERM', 'SIGINT']) {
  process.on(señal, () => {
    console.log(`${señal} recibido, cerrando servidor...`)
    server.close(() => process.exit(0))
  })
}

export default server
