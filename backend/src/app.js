import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'

import routes from './routes/index.js'
import { notFound, errorHandler } from './middlewares/error.middleware.js'

const app = express()

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }))
app.use(express.json())
// En los tests no queremos ruido en la consola.
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))
}

// El pipeline de Azure hace smoke test contra esta ruta: no la protejas.
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() })
})

app.use('/api', routes)

app.use(notFound)
app.use(errorHandler)

// Solo exporta la app: el arranque del servidor vive en server.js para que
// los tests puedan montarla con supertest sin abrir un puerto.
export default app
