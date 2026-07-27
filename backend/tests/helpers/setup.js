// Entorno comun para los tests. Se importa ANTES que la app para que los
// controladores lean estas variables al cargarse.
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'secreto_de_pruebas'
process.env.JWT_EXPIRES_IN = '1h'
// Apunta a un host inexistente a proposito: si algun test llegara a tocar
// MySQL, falla rapido en vez de pegarle a una BD real.
process.env.DB_HOST = '127.0.0.1'
process.env.DB_PORT = '1'

import jwt from 'jsonwebtoken'

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
