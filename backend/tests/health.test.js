// Smoke test del servicio: la ruta que el pipeline de Azure usa para validar
// que el contenedor arranco bien, y el manejo de rutas inexistentes.
import { test, describe, after } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'

import { app, cerrarPool } from './helpers/setup.js'

after(cerrarPool)

describe('Salud del servicio', () => {
  test('GET /health responde 200 con status ok', async () => {
    const res = await request(app).get('/health')

    assert.equal(res.status, 200)
    assert.equal(res.body.status, 'ok')
    assert.equal(typeof res.body.uptime, 'number')
  })

  test('/health no requiere token (el smoke test de Azure no lo manda)', async () => {
    const res = await request(app).get('/health')
    assert.equal(res.status, 200)
  })

  test('una ruta inexistente responde 404 con { message }', async () => {
    const res = await request(app).get('/api/esta-ruta-no-existe')

    assert.equal(res.status, 404)
    // El frontend lee err.response.data.message: la forma importa.
    assert.ok(res.body.message.includes('Ruta no encontrada'))
  })
})
