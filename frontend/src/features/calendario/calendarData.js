// Datos mock del calendario mensual (Admin Biblioteca).
// El calendario se basa en la fecha actual y se navega por mes.
// Luego se reemplaza por GET /api/reservas?mes=YYYY-MM.

// Encabezados de la semana (lunes primero).
export const diasSemana = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM']

// Rango horario del panel: 8:00 AM a 8:00 PM.
export const horas = Array.from({ length: 13 }, (_, i) => 8 + i) // 8..20

// Clave ISO local (YYYY-MM-DD) de una fecha.
export function isoDe(fecha) {
  const y = fecha.getFullYear()
  const m = String(fecha.getMonth() + 1).padStart(2, '0')
  const d = String(fecha.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// ¿Es fin de semana? (0 = domingo, 6 = sábado)
export function esFinDeSemana(fecha) {
  const d = fecha.getDay()
  return d === 0 || d === 6
}

// Devuelve los próximos `n` días hábiles (lun–vie) a partir de "hoy" inclusive.
function proximosDiasHabiles(hoy, n) {
  const dias = []
  const cursor = new Date(hoy)
  cursor.setHours(0, 0, 0, 0)
  while (dias.length < n) {
    if (!esFinDeSemana(cursor)) dias.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return dias
}

// Genera reservas de cubículos ancladas a días hábiles a partir de "hoy",
// de modo que siempre haya eventos visibles (nunca en fin de semana).
export function construirEventos(hoy = new Date()) {
  const habiles = proximosDiasHabiles(hoy, 7)
  const map = {}
  const put = (fecha, eventos) => { map[isoDe(fecha)] = eventos }

  put(habiles[0], [
    { hora: 10, titulo: 'Cubículo 1', detalle: 'Repaso examen' },
    { hora: 16, titulo: 'Cubículo 7', detalle: 'Tarea en equipo' },
  ])
  put(habiles[1], [{ hora: 11, titulo: 'Cubículo 3', detalle: 'Proyecto ISC' }])
  put(habiles[2], [
    { hora: 9,  titulo: 'Cubículo 4', detalle: 'Reunión' },
    { hora: 13, titulo: 'Cubículo 3', detalle: 'Estudio grupal' },
  ])
  put(habiles[3], [{ hora: 10, titulo: 'Cubículo 5', detalle: 'Proyecto integrador' }])
  put(habiles[5], [{ hora: 12, titulo: 'Cubículo 7', detalle: 'Estudio' }])

  return map
}
