// Cascada de cancelaciones: cuando una accion de administracion invalida una
// reserva, esta debe CANCELARSE (para liberar el horario) y su dueño recibir
// una notificacion con el motivo.
//
// Se prueba el servicio directamente contra dobles de los modelos, porque es
// la pieza que comparten todos los puntos de administracion.
import { test, describe, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'

// --- Dobles de los modelos que usa el servicio ------------------------------
let activasDeUsuario = []
let activasDeEspacio = []
let activasEnRango = []
let tiposDelRol = []

const canceladas = []
const notificaciones = []
const historial = []

mock.module('../src/models/reserva.model.js', {
  namedExports: {
    reservasActivasDeUsuarioDesde: async () => activasDeUsuario,
    reservasActivasDeEspacioDesde: async () => activasDeEspacio,
    reservasActivasEnRango: async () => activasEnRango,
    cancelarReservas: async (ids) => {
      canceladas.push(...ids)
      return ids.length
    },
    registrarHistorial: async (id, gestor, accion, comentario) => {
      historial.push({ id, gestor, accion, comentario })
      return 1
    },
  },
})

mock.module('../src/models/catalogo.model.js', {
  namedExports: {
    tiposPorRol: async () => tiposDelRol,
    espacioPorId: async () => null,
    espaciosPorTipo: async () => [],
  },
})

mock.module('../src/models/notificacion.model.js', {
  namedExports: {
    crearNotificacion: async (usuarioId, titulo, mensaje) => {
      notificaciones.push({ usuarioId, titulo, mensaje })
      return 1
    },
  },
})

const {
  cancelarPorUsuarioInactivo,
  cancelarPorCambioDeRol,
  cancelarPorEspacioInhabilitado,
  cancelarPorCierre,
  notificarResolucion,
} = await import('../src/services/reserva.service.js')

// Reserva de ejemplo con los campos que usa el servicio.
function reserva(id, extra = {}) {
  return {
    reserva_id: id,
    usuario_id: 7,
    espacio_id: 3,
    fecha_reserva: '2099-05-04',
    hora_inicio: '10:00:00',
    hora_fin: '11:00:00',
    espacio: `Cubículo ${id}`,
    edificio: 'Biblioteca',
    tipo_id: 1,
    tipo: 'Cubículo',
    ...extra,
  }
}

beforeEach(() => {
  activasDeUsuario = []
  activasDeEspacio = []
  activasEnRango = []
  tiposDelRol = []
  canceladas.length = 0
  notificaciones.length = 0
  historial.length = 0
})

describe('Usuario desactivado', () => {
  test('cancela sus reservas futuras y le avisa', async () => {
    activasDeUsuario = [reserva(1), reserva(2)]

    const n = await cancelarPorUsuarioInactivo(7, 99)

    assert.equal(n, 2)
    assert.deepEqual(canceladas, [1, 2], 'las dos deben liberar su horario')
    assert.equal(notificaciones.length, 2)
    assert.match(notificaciones[0].mensaje, /CANCELADA/)
    assert.match(notificaciones[0].mensaje, /desactivada/i)
    // Queda constancia de quien lo hizo.
    assert.equal(historial[0].gestor, 99)
    assert.equal(historial[0].accion, 'Cancelada')
  })

  test('sin reservas activas no cancela ni notifica nada', async () => {
    activasDeUsuario = []

    const n = await cancelarPorUsuarioInactivo(7, 99)

    assert.equal(n, 0)
    assert.deepEqual(canceladas, [])
    assert.equal(notificaciones.length, 0)
  })
})

describe('Cambio de rol', () => {
  test('cancela solo las reservas de tipos que el nuevo rol no puede reservar', async () => {
    // El usuario tiene un Cubículo (tipo 1) y un Auditorio (tipo 2)...
    activasDeUsuario = [reserva(1, { tipo_id: 1 }), reserva(2, { tipo_id: 2, tipo: 'Auditorio' })]
    // ...y su nuevo rol solo puede reservar Cubículos.
    tiposDelRol = [{ tipo_id: 1 }]

    const n = await cancelarPorCambioDeRol(7, 1, 99)

    assert.equal(n, 1)
    assert.deepEqual(canceladas, [2], 'solo cae la del tipo que ya no puede reservar')
    assert.match(notificaciones[0].mensaje, /nuevo rol/i)
  })

  test('si el nuevo rol conserva todos los permisos no cancela nada', async () => {
    activasDeUsuario = [reserva(1, { tipo_id: 1 }), reserva(2, { tipo_id: 2 })]
    tiposDelRol = [{ tipo_id: 1 }, { tipo_id: 2 }]

    const n = await cancelarPorCambioDeRol(7, 2, 99)

    assert.equal(n, 0)
    assert.deepEqual(canceladas, [])
  })
})

describe('Espacio inhabilitado', () => {
  test('cancela las reservas futuras de ese espacio con el motivo indicado', async () => {
    activasDeEspacio = [reserva(5)]

    const n = await cancelarPorEspacioInhabilitado(3, 99, 'Cubículo 5 entró en mantenimiento')

    assert.equal(n, 1)
    assert.deepEqual(canceladas, [5])
    assert.match(notificaciones[0].mensaje, /mantenimiento/i)
    assert.match(notificaciones[0].mensaje, /queda libre/i)
  })
})

describe('Cierre de ciclo escolar', () => {
  test('cancela las reservas que caen dentro del rango cerrado', async () => {
    activasEnRango = [reserva(8), reserva(9)]

    const n = await cancelarPorCierre('2099-12-20', '2099-12-31', 99)

    assert.equal(n, 2)
    assert.deepEqual(canceladas, [8, 9])
    assert.match(notificaciones[0].mensaje, /cerrada/i)
  })

  test('un rango que ya paso por completo no cancela nada', async () => {
    activasEnRango = [reserva(8)]

    const n = await cancelarPorCierre('2000-01-01', '2000-01-10', 99)

    assert.equal(n, 0)
    assert.deepEqual(canceladas, [], 'no se tocan reservas de fechas pasadas')
  })
})

describe('Resolucion de una reserva', () => {
  test('aprobar notifica al solicitante y deja historial', async () => {
    await notificarResolucion(reserva(4), 'Confirmada', 99)

    assert.equal(notificaciones[0].titulo, 'Reserva aprobada')
    assert.match(notificaciones[0].mensaje, /APROBADA/)
    assert.equal(historial[0].accion, 'Aprobada')
  })

  test('rechazar incluye el motivo y avisa de que el horario se libera', async () => {
    await notificarResolucion(reserva(4), 'Rechazada', 99, 'documentación incompleta')

    assert.equal(notificaciones[0].titulo, 'Reserva rechazada')
    assert.match(notificaciones[0].mensaje, /RECHAZADA/)
    assert.match(notificaciones[0].mensaje, /documentación incompleta/)
    assert.equal(historial[0].accion, 'Rechazada')
  })
})
