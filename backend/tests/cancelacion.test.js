// Cancelacion de una reserva por su propio dueño, y proteccion de las rutas
// frente a cuentas desactivadas. Todo se resuelve antes de tocar MySQL de
// verdad: los modelos que harian la consulta estan mockeados.
import { test, describe, after, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'

import {
  app,
  cerrarPool,
  tokenDe,
  setUsuarioActual,
  restaurarUsuario,
  setReserva,
  reservasCanceladas,
  reiniciarReservas,
} from './helpers/setup.js'

after(cerrarPool)
beforeEach(() => {
  restaurarUsuario()
  reiniciarReservas()
})

const auth = { Authorization: `Bearer ${tokenDe()}` }

// Fecha/hora futura suficientemente lejos del margen de 2 horas.
function enHoras(horas) {
  const d = new Date(Date.now() + horas * 60 * 60 * 1000)
  const fecha = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return { fecha, hora: `${String(d.getHours()).padStart(2, '0')}:00:00` }
}

function reservaBase(extra = {}) {
  const { fecha, hora } = enHoras(48)
  return {
    reserva_id: 10,
    usuario_id: 1,
    espacio_id: 3,
    titulo: 'Estudio',
    fecha_reserva: fecha,
    hora_inicio: hora,
    hora_fin: hora,
    estado_id: 1,
    estado: 'Pendiente',
    espacio: 'Cubículo 3',
    estado_espacio: 'Disponible',
    edificio: 'Biblioteca',
    tipo: 'Cubículo',
    ...extra,
  }
}

describe('PATCH /api/reservas/:id/cancelar', () => {
  test('sin token -> 401', async () => {
    const res = await request(app).patch('/api/reservas/10/cancelar')
    assert.equal(res.status, 401)
  })

  test('una cuenta desactivada no puede operar aunque tenga token valido -> 403', async () => {
    setUsuarioActual({ estado: 'Inactivo' })
    const res = await request(app).patch('/api/reservas/10/cancelar').set(auth)

    assert.equal(res.status, 403)
    assert.match(res.body.message, /inactiva/i)
  })

  test('reserva inexistente -> 404', async () => {
    setReserva(null)
    const res = await request(app).patch('/api/reservas/10/cancelar').set(auth)

    assert.equal(res.status, 404)
  })

  test('no se puede cancelar la reserva de otro usuario -> 404', async () => {
    setReserva(reservaBase({ usuario_id: 999 }))
    const res = await request(app).patch('/api/reservas/10/cancelar').set(auth)

    assert.equal(res.status, 404)
    assert.deepEqual(reservasCanceladas(), [], 'no debe cancelar nada')
  })

  test('una reserva ya cancelada no se vuelve a cancelar -> 409', async () => {
    setReserva(reservaBase({ estado: 'Cancelada' }))
    const res = await request(app).patch('/api/reservas/10/cancelar').set(auth)

    assert.equal(res.status, 409)
    assert.match(res.body.message, /ya está/i)
  })

  test('dentro del margen de 2 horas -> 409', async () => {
    const { fecha, hora } = enHoras(1)
    setReserva(reservaBase({ fecha_reserva: fecha, hora_inicio: hora }))
    const res = await request(app).patch('/api/reservas/10/cancelar').set(auth)

    assert.equal(res.status, 409)
    assert.match(res.body.message, /2 horas de anticipaci/i)
    assert.deepEqual(reservasCanceladas(), [])
  })

  test('con margen suficiente cancela y libera el horario -> 200', async () => {
    setReserva(reservaBase())
    const res = await request(app).patch('/api/reservas/10/cancelar').set(auth)

    assert.equal(res.status, 200)
    assert.equal(res.body.estado, 'Cancelada')
    // Es lo que libera el hueco: deja de contar como reserva activa.
    assert.deepEqual(reservasCanceladas(), [10])
  })
})
