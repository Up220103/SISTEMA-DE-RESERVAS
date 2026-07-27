// Autenticacion: validaciones de entrada y proteccion de rutas.
// Todos estos casos cortan ANTES de tocar MySQL, asi que corren en CI sin BD.
import { test, describe, after } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import jwt from 'jsonwebtoken'

import { app, cerrarPool, tokenDe } from './helpers/setup.js'

after(cerrarPool)

describe('POST /api/auth/login', () => {
  test('sin cuerpo responde 400', async () => {
    const res = await request(app).post('/api/auth/login').send({})

    assert.equal(res.status, 400)
    assert.match(res.body.message, /obligatorios/i)
  })

  test('sin contrasena responde 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'up220101@alumnos.upa.edu.mx' })

    assert.equal(res.status, 400)
  })
})

describe('POST /api/auth/register', () => {
  const valido = {
    nombre: 'Ana',
    apellido: 'Garcia',
    email: 'up220199@alumnos.upa.edu.mx',
    password: 'upa12345',
  }

  test('faltan campos obligatorios -> 400', async () => {
    const res = await request(app).post('/api/auth/register').send({ nombre: 'Ana' })

    assert.equal(res.status, 400)
    assert.match(res.body.message, /obligatorios/i)
  })

  test('rechaza correo que no es de alumno UPA', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...valido, email: 'ana@gmail.com' })

    assert.equal(res.status, 400)
    assert.match(res.body.message, /alumnos\.upa\.edu\.mx/i)
  })

  test('rechaza correo de docente (el auto-registro es solo para alumnos)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...valido, email: 'maria.lopez@upa.edu.mx' })

    assert.equal(res.status, 400)
  })

  test('rechaza contrasena de menos de 8 caracteres', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...valido, password: 'corta' })

    assert.equal(res.status, 400)
    assert.match(res.body.message, /8 caracteres/i)
  })
})

describe('Proteccion de rutas con JWT', () => {
  const protegidas = [
    ['get', '/api/auth/me'],
    ['get', '/api/auth/perfil'],
    ['get', '/api/catalogo/tipos'],
    ['get', '/api/reservas/mias'],
    ['get', '/api/notificaciones'],
  ]

  for (const [metodo, ruta] of protegidas) {
    test(`${metodo.toUpperCase()} ${ruta} sin token -> 401`, async () => {
      const res = await request(app)[metodo](ruta)

      assert.equal(res.status, 401)
      assert.match(res.body.message, /token/i)
    })
  }

  test('token con firma invalida -> 401', async () => {
    const falso = jwt.sign({ id: 1 }, 'otro_secreto_distinto')
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${falso}`)

    assert.equal(res.status, 401)
    assert.match(res.body.message, /invalido|expirado/i)
  })

  test('token expirado -> 401', async () => {
    const vencido = jwt.sign({ id: 1 }, process.env.JWT_SECRET, { expiresIn: '-1h' })
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${vencido}`)

    assert.equal(res.status, 401)
  })

  test('esquema distinto de Bearer -> 401', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Basic ${tokenDe()}`)

    assert.equal(res.status, 401)
    assert.match(res.body.message, /no proporcionado/i)
  })
})
