// Reglas de negocio de reservas que se validan en el controlador antes de
// llegar a MySQL: ventana horaria, formato de fecha y fechas pasadas.
import { test, describe, after } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'

import { app, cerrarPool, tokenDe } from './helpers/setup.js'

after(cerrarPool)

const auth = { Authorization: `Bearer ${tokenDe()}` }

const aISO = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

// Una fecha futura siempre valida, para aislar el caso que se esta probando.
// Se corre al lunes si cae en fin de semana: solo se reserva de lunes a viernes,
// y esa regla se comprueba antes que el horario.
function fechaFutura(diasAdelante = 30) {
  const d = new Date()
  d.setDate(d.getDate() + diasAdelante)
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1)
  return aISO(d)
}

// El proximo sabado, para probar la regla de fin de semana.
function proximoSabado() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  while (d.getDay() !== 6) d.setDate(d.getDate() + 1)
  return aISO(d)
}

const base = {
  espacio_id: 1,
  titulo: 'Sesion de estudio',
  fecha: fechaFutura(),
  hora_inicio: '10:00',
  hora_fin: '12:00',
}

describe('POST /api/reservas · validaciones', () => {
  test('sin token -> 401', async () => {
    const res = await request(app).post('/api/reservas').send(base)
    assert.equal(res.status, 401)
  })

  test('faltan campos obligatorios -> 400', async () => {
    const res = await request(app).post('/api/reservas').set(auth).send({ titulo: 'Algo' })

    assert.equal(res.status, 400)
    assert.match(res.body.message, /obligatorios/i)
  })

  test('sin espacio_id ni tipo_id -> 400', async () => {
    const { espacio_id, ...sinEspacio } = base
    const res = await request(app).post('/api/reservas').set(auth).send(sinEspacio)

    assert.equal(res.status, 400)
  })

  test('formato de fecha invalido -> 400', async () => {
    const res = await request(app)
      .post('/api/reservas')
      .set(auth)
      .send({ ...base, fecha: '25-12-2026' })

    assert.equal(res.status, 400)
    assert.match(res.body.message, /YYYY-MM-DD/)
  })

  test('fecha en el pasado -> 400', async () => {
    const res = await request(app)
      .post('/api/reservas')
      .set(auth)
      .send({ ...base, fecha: '2020-01-15' })

    assert.equal(res.status, 400)
    assert.match(res.body.message, /ya pas/i)
  })

  test('fecha en fin de semana -> 400', async () => {
    const res = await request(app)
      .post('/api/reservas')
      .set(auth)
      .send({ ...base, fecha: proximoSabado() })

    assert.equal(res.status, 400)
    assert.match(res.body.message, /lunes a viernes/i)
  })

  test('hora de fin anterior a la de inicio -> 400', async () => {
    const res = await request(app)
      .post('/api/reservas')
      .set(auth)
      .send({ ...base, hora_inicio: '14:00', hora_fin: '11:00' })

    assert.equal(res.status, 400)
    assert.match(res.body.message, /horario inv/i)
  })

  test('hora con formato invalido -> 400', async () => {
    const res = await request(app)
      .post('/api/reservas')
      .set(auth)
      .send({ ...base, hora_inicio: '25:00' })

    assert.equal(res.status, 400)
  })

  test('antes de las 8:00 queda fuera de la ventana -> 400', async () => {
    const res = await request(app)
      .post('/api/reservas')
      .set(auth)
      .send({ ...base, hora_inicio: '07:00', hora_fin: '09:00' })

    assert.equal(res.status, 400)
    assert.match(res.body.message, /8:00 a 20:00/)
  })

  test('despues de las 20:00 queda fuera de la ventana -> 400', async () => {
    const res = await request(app)
      .post('/api/reservas')
      .set(auth)
      .send({ ...base, hora_inicio: '19:00', hora_fin: '21:00' })

    assert.equal(res.status, 400)
    assert.match(res.body.message, /8:00 a 20:00/)
  })
})

describe('GET /api/reservas/horas-ocupadas · validaciones', () => {
  test('sin token -> 401', async () => {
    const res = await request(app).get('/api/reservas/horas-ocupadas')
    assert.equal(res.status, 401)
  })

  test('sin fecha -> 400', async () => {
    const res = await request(app).get('/api/reservas/horas-ocupadas').set(auth)

    assert.equal(res.status, 400)
    assert.match(res.body.message, /fecha/i)
  })

  test('fecha con formato invalido -> 400', async () => {
    const res = await request(app)
      .get('/api/reservas/horas-ocupadas')
      .query({ fecha: '15/08/2026' })
      .set(auth)

    assert.equal(res.status, 400)
  })

  test('fecha valida pero sin espacio_id ni tipo_id -> 400', async () => {
    const res = await request(app)
      .get('/api/reservas/horas-ocupadas')
      .query({ fecha: fechaFutura() })
      .set(auth)

    assert.equal(res.status, 400)
    assert.match(res.body.message, /espacio_id o tipo_id/i)
  })
})
