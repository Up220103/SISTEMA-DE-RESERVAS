// Pool de conexiones a MySQL (mysql2/promise).
// Lee la configuracion desde variables de entorno (ver .env.example).
import mysql from 'mysql2/promise'

// Azure Database for MySQL Flexible Server trae require_secure_transport=ON:
// sin TLS rechaza la conexion. En local (contenedor MySQL) no hace falta, por
// eso se activa con DB_SSL=true. El certificado de Azure encadena a DigiCert
// Global Root, que ya viene en el almacen de CAs de Node: no hay que bajar .pem.
const ssl =
  process.env.DB_SSL === 'true' ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : undefined

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'reservas_upa',
  ssl,
  // Forzar utf8mb4 para que los acentos (í, ó, é...) viajen correctamente.
  charset: 'utf8mb4',
  // Devuelve DATE/TIME/DATETIME como texto ('YYYY-MM-DD', 'HH:MM:SS')
  // para evitar desfases de zona horaria al serializar a JSON.
  dateStrings: true,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

// Helper para ejecutar queries parametrizadas.
export function query(sql, params) {
  return pool.execute(sql, params)
}

// Prueba la conexion (usada por app.js al arrancar).
export async function testConnection() {
  const conn = await pool.getConnection()
  await conn.ping()
  conn.release()
}

export default pool
