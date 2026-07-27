// Pruebas unitarias de los middlewares, sin levantar la app.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import jwt from 'jsonwebtoken'

process.env.JWT_SECRET = 'secreto_de_pruebas'

const { requireAuth } = await import('../src/middlewares/auth.middleware.js')
const { notFound, errorHandler } = await import('../src/middlewares/error.middleware.js')

// Doble de `res` con la interfaz que usan los middlewares.
function resFalso() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code
      return this
    },
    json(payload) {
      this.body = payload
      return this
    },
  }
}

describe('requireAuth', () => {
  test('sin header Authorization responde 401', () => {
    const res = resFalso()
    let siguio = false
    requireAuth({ headers: {} }, res, () => { siguio = true })

    assert.equal(res.statusCode, 401)
    assert.equal(siguio, false)
  })

  test('con token valido llama a next y llena req.user', () => {
    const token = jwt.sign({ id: 7, email: 'up220101@alumnos.upa.edu.mx' }, process.env.JWT_SECRET)
    const req = { headers: { authorization: `Bearer ${token}` } }
    const res = resFalso()
    let siguio = false

    requireAuth(req, res, () => { siguio = true })

    assert.equal(siguio, true)
    assert.equal(req.user.id, 7)
    assert.equal(req.user.email, 'up220101@alumnos.upa.edu.mx')
  })

  test('token manipulado responde 401 y no llama a next', () => {
    const req = { headers: { authorization: 'Bearer no.es.un.jwt' } }
    const res = resFalso()
    let siguio = false

    requireAuth(req, res, () => { siguio = true })

    assert.equal(res.statusCode, 401)
    assert.equal(siguio, false)
  })
})

describe('errorHandler', () => {
  test('usa el statusCode del error cuando viene definido', () => {
    const res = resFalso()
    const err = Object.assign(new Error('Espacio no disponible'), { statusCode: 409 })

    errorHandler(err, {}, res, () => {})

    assert.equal(res.statusCode, 409)
    assert.equal(res.body.message, 'Espacio no disponible')
  })

  test('un error sin status cae en 500 con mensaje generico', () => {
    const res = resFalso()
    // errorHandler hace console.error en los 500 (a proposito): lo silenciamos
    // para que la salida del pipeline no muestre un stack trace esperado.
    const original = console.error
    console.error = () => {}
    try {
      errorHandler(new Error(''), {}, res, () => {})
    } finally {
      console.error = original
    }

    assert.equal(res.statusCode, 500)
    assert.equal(res.body.message, 'Error interno del servidor')
  })
})

describe('notFound', () => {
  test('responde 404 incluyendo metodo y ruta', () => {
    const res = resFalso()
    notFound({ method: 'GET', originalUrl: '/api/nada' }, res, () => {})

    assert.equal(res.statusCode, 404)
    assert.match(res.body.message, /GET \/api\/nada/)
  })
})
