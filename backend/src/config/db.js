// Pool de conexiones a MySQL (mysql2/promise).
// Lee la configuracion desde variables de entorno (ver .env.example).
import mysql from 'mysql2/promise'

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'reservas_db',
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
