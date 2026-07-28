// Consultas de estadísticas de reservas de CUBÍCULOS (Admin Biblioteca).
// Todas las métricas se limitan a espacios tipo_id=1 (Cubículo), edificio_id=1.
import { query } from '../config/db.js'

const TIPO_CUBICULO = 1
const EDIFICIO_BIBLIOTECA = 1

// Filtro común: cubículos de biblioteca dentro del rango de fechas.
const BASE_FROM = `
  FROM reserva r
  JOIN espacio e         ON e.espacio_id = r.espacio_id
  JOIN estado_reserva er ON er.estado_id = r.estado_id
 WHERE e.tipo_id = ? AND e.edificio_id = ?
   AND r.fecha_reserva BETWEEN ? AND ?`

// Variante que además trae al solicitante y su rol.
const BASE_FROM_USUARIO = `
  FROM reserva r
  JOIN espacio e         ON e.espacio_id = r.espacio_id
  JOIN estado_reserva er ON er.estado_id = r.estado_id
  JOIN usuario u         ON u.usuario_id = r.usuario_id
  JOIN rol ro            ON ro.rol_id    = u.rol_id
 WHERE e.tipo_id = ? AND e.edificio_id = ?
   AND r.fecha_reserva BETWEEN ? AND ?`

const args = (desde, hasta) => [TIPO_CUBICULO, EDIFICIO_BIBLIOTECA, desde, hasta]

// Totales por estado + horas reservadas.
export async function resumenGeneral(desde, hasta) {
  const [rows] = await query(
    `SELECT
        COUNT(*)                                                        AS total,
        SUM(er.nombre_estado = 'Pendiente')                             AS pendientes,
        SUM(er.nombre_estado IN ('Confirmada','Completada'))            AS aprobadas,
        SUM(er.nombre_estado = 'Rechazada')                             AS rechazadas,
        SUM(er.nombre_estado = 'Cancelada')                             AS canceladas,
        COALESCE(SUM(TIMESTAMPDIFF(MINUTE, r.hora_inicio, r.hora_fin)), 0) AS minutos
     ${BASE_FROM}`,
    args(desde, hasta),
  )
  return rows[0]
}

// Inventario actual de cubículos (no depende del rango).
export async function inventarioCubiculos() {
  const [rows] = await query(
    `SELECT COUNT(*) AS total,
            SUM(estado = 'Disponible')                     AS disponibles,
            SUM(estado IN ('Mantenimiento','Bloqueado'))   AS inhabilitados
       FROM espacio
      WHERE tipo_id = ? AND edificio_id = ?`,
    [TIPO_CUBICULO, EDIFICIO_BIBLIOTECA],
  )
  return rows[0]
}

// Reservas agrupadas por estado.
export async function porEstado(desde, hasta) {
  const [rows] = await query(
    `SELECT er.nombre_estado AS etiqueta, COUNT(*) AS total
     ${BASE_FROM}
     GROUP BY er.nombre_estado
     ORDER BY total DESC`,
    args(desde, hasta),
  )
  return rows
}

// Reservas por día de la semana (1=Domingo ... 7=Sábado en MySQL).
export async function porDiaSemana(desde, hasta) {
  const [rows] = await query(
    `SELECT DAYOFWEEK(r.fecha_reserva) AS dow, COUNT(*) AS total
     ${BASE_FROM}
     GROUP BY dow
     ORDER BY dow`,
    args(desde, hasta),
  )
  return rows
}

// Uso por cubículo: número de reservas y horas acumuladas.
export async function porCubiculo(desde, hasta) {
  const [rows] = await query(
    `SELECT e.nombre AS etiqueta,
            COUNT(*) AS total,
            COALESCE(SUM(TIMESTAMPDIFF(MINUTE, r.hora_inicio, r.hora_fin)), 0) AS minutos
     ${BASE_FROM}
     GROUP BY e.espacio_id, e.nombre
     ORDER BY total DESC, e.nombre`,
    args(desde, hasta),
  )
  return rows
}

// Reservas por tipo de solicitante (Estudiante / Docente).
export async function porRol(desde, hasta) {
  const [rows] = await query(
    `SELECT ro.nombre_rol AS etiqueta, COUNT(*) AS total
     ${BASE_FROM_USUARIO}
     GROUP BY ro.nombre_rol
     ORDER BY total DESC`,
    args(desde, hasta),
  )
  return rows
}

// Distribución por hora de inicio (para detectar horas pico).
export async function porHora(desde, hasta) {
  const [rows] = await query(
    `SELECT HOUR(r.hora_inicio) AS hora, COUNT(*) AS total
     ${BASE_FROM}
     GROUP BY hora
     ORDER BY hora`,
    args(desde, hasta),
  )
  return rows
}

// Usuarios que más reservan.
export async function topSolicitantes(desde, hasta, limite = 5) {
  const [rows] = await query(
    `SELECT CONCAT(u.nombre, ' ', u.apellido) AS etiqueta,
            ro.nombre_rol AS rol,
            COUNT(*) AS total
     ${BASE_FROM_USUARIO}
     GROUP BY u.usuario_id, etiqueta, ro.nombre_rol
     ORDER BY total DESC
     LIMIT ${Number(limite)}`,
    args(desde, hasta),
  )
  return rows
}
