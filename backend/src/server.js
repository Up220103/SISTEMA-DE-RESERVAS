// Punto de entrada del proceso: levanta el servidor HTTP o HTTPS.
// La app de Express vive en app.js (sin listen) para poder testearla.
import 'dotenv/config'
import http from 'http'
import https from 'https'
import fs from 'fs'

import app from './app.js'
import { testConnection } from './config/db.js'
import { initRealtime } from './realtime.js'

// App Service inyecta PORT; en local usamos BACKEND_PORT o 4000.
const PORT = process.env.PORT || process.env.BACKEND_PORT || 4000

// -------------------------------------------------------------------------
// TLS/HTTPS opcional. Si se definen TLS_KEY y TLS_CERT (rutas a los archivos
// emitidos por la CA privada), el backend arranca en HTTPS. Si no, HTTP.
// TLS_CA es opcional: la cadena/intermedia de la CA para que los clientes
// completen la ruta de confianza.
// -------------------------------------------------------------------------
function opcionesTLS() {
  const { TLS_KEY, TLS_CERT, TLS_CA } = process.env
  if (!TLS_KEY || !TLS_CERT) return null
  try {
    const opts = {
      key: fs.readFileSync(TLS_KEY),
      cert: fs.readFileSync(TLS_CERT),
    }
    if (TLS_CA) opts.ca = fs.readFileSync(TLS_CA)
    return opts
  } catch (err) {
    console.error('No se pudieron leer los certificados TLS:', err.message)
    console.error('Se arrancará en HTTP. Revisa las rutas TLS_KEY / TLS_CERT / TLS_CA.')
    return null
  }
}

const tls = opcionesTLS()
// Un solo servidor (http o https) del que cuelga también Socket.IO.
const server = tls ? https.createServer(tls, app) : http.createServer(app)
const protocolo = tls ? 'https' : 'http'

initRealtime(server)

server.listen(PORT, async () => {
  console.log(`API escuchando en ${protocolo}://localhost:${PORT}`)
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
