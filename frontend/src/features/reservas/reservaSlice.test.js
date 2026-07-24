import { describe, test, expect, vi, beforeEach } from 'vitest'

vi.mock('../../services/api.js', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}))

const api = (await import('../../services/api.js')).default
const {
  default: reservaReducer,
  fetchTipos,
  fetchMisReservas,
  fetchHorasOcupadas,
  fetchNotificaciones,
  leerNotificaciones,
  crearReserva,
  limpiarMensajes,
} = await import('./reservaSlice.js')

const estadoInicial = reservaReducer(undefined, { type: '@@INIT' })

beforeEach(() => {
  vi.clearAllMocks()
})

describe('reservaSlice · catalogo y reservas', () => {
  test('el estado inicial arranca vacio', () => {
    expect(estadoInicial.mias).toEqual([])
    expect(estadoInicial.ocupadas).toEqual([])
    expect(estadoInicial.creando).toBe(false)
  })

  test('fetchTipos.fulfilled guarda los tipos de espacio', () => {
    const tipos = [{ tipo_id: 1, nombre_tipo: 'Cubiculo' }]
    const estado = reservaReducer(estadoInicial, {
      type: fetchTipos.fulfilled.type,
      payload: tipos,
    })

    expect(estado.tipos).toEqual(tipos)
  })

  test('fetchMisReservas.fulfilled reemplaza la lista', () => {
    const estado = reservaReducer(estadoInicial, {
      type: fetchMisReservas.fulfilled.type,
      payload: [{ reserva_id: 1, titulo: 'Estudio' }],
    })

    expect(estado.mias).toHaveLength(1)
  })

  test('fetchHorasOcupadas limpia las horas mientras carga', () => {
    const conDatos = { ...estadoInicial, ocupadas: [8, 9, 10] }
    const cargando = reservaReducer(conDatos, { type: fetchHorasOcupadas.pending.type })

    // Si no se limpia, el calendario muestra la disponibilidad de la fecha anterior.
    expect(cargando.ocupadas).toEqual([])

    const listo = reservaReducer(cargando, {
      type: fetchHorasOcupadas.fulfilled.type,
      payload: [14, 15],
    })
    expect(listo.ocupadas).toEqual([14, 15])
  })
})

describe('reservaSlice · crear reserva', () => {
  test('pending activa el flag y limpia mensajes anteriores', () => {
    const previo = { ...estadoInicial, error: 'Error viejo', exito: 'Exito viejo' }
    const estado = reservaReducer(previo, { type: crearReserva.pending.type })

    expect(estado.creando).toBe(true)
    expect(estado.error).toBeNull()
    expect(estado.exito).toBeNull()
  })

  test('fulfilled agrega la reserva al inicio de la lista', () => {
    const previo = { ...estadoInicial, mias: [{ reserva_id: 1 }], creando: true }
    const estado = reservaReducer(previo, {
      type: crearReserva.fulfilled.type,
      payload: { reserva_id: 2, titulo: 'Nueva' },
    })

    expect(estado.creando).toBe(false)
    expect(estado.mias[0].reserva_id).toBe(2)
    expect(estado.mias).toHaveLength(2)
  })

  test('rejected muestra la regla de negocio que devolvio el backend', () => {
    const estado = reservaReducer(
      { ...estadoInicial, creando: true },
      { type: crearReserva.rejected.type, payload: 'Ya tienes una reserva en ese horario.' },
    )

    expect(estado.creando).toBe(false)
    expect(estado.error).toBe('Ya tienes una reserva en ese horario.')
  })

  test('el thunk traduce un 409 al mensaje del backend', async () => {
    api.post.mockRejectedValue({
      response: { status: 409, data: { message: 'Ya tienes una reserva en ese horario.' } },
    })

    const resultado = await crearReserva({ espacio_id: 1 })(vi.fn(), () => ({}), undefined)

    expect(resultado.payload).toBe('Ya tienes una reserva en ese horario.')
  })

  test('limpiarMensajes borra error y exito', () => {
    const estado = reservaReducer(
      { ...estadoInicial, error: 'x', exito: 'y' },
      limpiarMensajes(),
    )

    expect(estado.error).toBeNull()
    expect(estado.exito).toBeNull()
  })
})

describe('reservaSlice · notificaciones', () => {
  test('fetchNotificaciones guarda la lista y el contador de no leidas', () => {
    const estado = reservaReducer(estadoInicial, {
      type: fetchNotificaciones.fulfilled.type,
      payload: { notificaciones: [{ id: 1, leida: 0 }], noLeidas: 1 },
    })

    expect(estado.noLeidas).toBe(1)
  })

  test('leerNotificaciones marca todas como leidas y pone el contador en 0', () => {
    const previo = {
      ...estadoInicial,
      notificaciones: [{ id: 1, leida: 0 }, { id: 2, leida: 0 }],
      noLeidas: 2,
    }
    const estado = reservaReducer(previo, { type: leerNotificaciones.fulfilled.type })

    expect(estado.noLeidas).toBe(0)
    expect(estado.notificaciones.every((n) => n.leida === 1)).toBe(true)
  })
})
