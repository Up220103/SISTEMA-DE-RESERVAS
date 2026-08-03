// Entorno comun para los tests. Se importa ANTES que la app para que los
// controladores lean estas variables al cargarse.
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'secreto_de_pruebas'
process.env.JWT_EXPIRES_IN = '1h'
// Apunta a un host inexistente a proposito: si algun test llegara a tocar
// MySQL, falla rapido en vez de pegarle a una BD real.
process.env.DB_HOST = '127.0.0.1'
process.env.DB_PORT = '1'

import { mock } from 'node:test'
import jwt from 'jsonwebtoken'

// Usuario que devolvera `findById` en los tests. Los guards de sesion
// (requireActivo / requireRol) leen el estado real del usuario en la BD; sin
// este doble, las pruebas de VALIDACION DE ENTRADA -- que a proposito no tocan
// MySQL -- moririan en el guard en vez de llegar al controlador.
// Un test puede cambiarlo con `setUsuarioActual()` para probar, por ejemplo,
// una cuenta desactivada o un rol sin permisos.
export const USUARIO_POR_DEFECTO = {
  usuario_id: 1,
  rol_id: 1,
  nombre: 'Ana',
  apellido: 'Garcia',
  email: 'up220101@alumnos.upa.edu.mx',
  estado: 'Activo',
  nombre_rol: 'Estudiante',
}

let usuarioActual = { ...USUARIO_POR_DEFECTO }

// Sustituye (o restaura) el usuario que ven los guards durante un test.
export function setUsuarioActual(parcial) {
  usuarioActual = parcial === null ? null : { ...USUARIO_POR_DEFECTO, ...parcial }
}
export function restaurarUsuario() {
  usuarioActual = { ...USUARIO_POR_DEFECTO }
}

// El mock se registra ANTES de importar la app para que los middlewares
// resuelvan contra este modulo y no contra el real (que abriria MySQL).
mock.module('../../src/models/user.model.js', {
  namedExports: {
    findById: async () => usuarioActual,
    findByEmail: async () => null,
    perfilPorId: async () => usuarioActual,
    actualizarPerfil: async () => 1,
    actualizarPassword: async () => 1,
    createUser: async () => usuarioActual,
  },
})

// --- Doble del modelo de reservas -------------------------------------------
// Permite probar las reglas del controlador (dueño, estado, margen de 2 horas)
// sin MySQL, y observar QUE reservas se acabaron cancelando.
let reservaActual = null
let canceladas = []

export function setReserva(r) {
  reservaActual = r
}
export function reservasCanceladas() {
  return canceladas
}
export function reiniciarReservas() {
  reservaActual = null
  canceladas = []
}

mock.module('../../src/models/reserva.model.js', {
  namedExports: {
    reservaConDueno: async () => reservaActual,
    cancelarReservas: async (ids) => {
      canceladas.push(...ids)
      return ids.length
    },
    registrarHistorial: async () => 1,
    reservasDeUsuario: async () => [],
    reservasDeUsuarioEnFecha: async () => [],
    reservasDeEspacios: async () => [],
    bloqueosDeEspacios: async () => [],
    reservasActivasDeUsuarioDesde: async () => [],
    reservasActivasDeEspacioDesde: async () => [],
    reservasActivasEnRango: async () => [],
    traslapeActivo: async () => null,
    crearReserva: async () => 1,
    reservaPorId: async () => reservaActual,
    disponibilidad: async () => ({ reservas: [], bloqueos: [] }),
  },
})

mock.module('../../src/models/notificacion.model.js', {
  namedExports: {
    crearNotificacion: async () => 1,
    notificacionesDeUsuario: async () => [],
    contarNoLeidas: async () => 0,
    marcarLeidas: async () => 0,
  },
})

const { default: app } = await import('../../src/app.js')
const { default: pool } = await import('../../src/config/db.js')

// Token valido firmado con el mismo secreto que usa el middleware.
export function tokenDe(id = 1, email = 'up220101@alumnos.upa.edu.mx') {
  return jwt.sign({ id, email }, process.env.JWT_SECRET, { expiresIn: '1h' })
}

// mysql2 no abre conexiones hasta la primera query, pero cerramos el pool
// igual para que el proceso de test termine limpio.
export async function cerrarPool() {
  await pool.end()
}

export { app }
