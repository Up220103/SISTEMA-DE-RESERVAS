import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'

import routes from './routes/index.js'
import { testConnection } from './config/db.js'
import { notFound, errorHandler } from './middlewares/error.middleware.js'

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }))
app.use(express.json())
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

// El pipeline de Azure hace smoke test contra esta ruta: no la protejas.
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() })
})

app.use('/api', routes)

app.use(notFound)
app.use(errorHandler)

app.listen(PORT, async () => {
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

export default app
