// Datos mock del calendario mensual (Admin Biblioteca).
// Luego se reemplaza por GET /api/reservas?mes=...

export const anio = 2026
export const mes = 1 // 0-indexed → 1 = Febrero
export const nombreMes = 'Febrero 2026'

// Encabezados de la semana (lunes primero).
export const diasSemana = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM']

// Rango horario del panel: 8:00 AM a 8:00 PM.
export const horas = Array.from({ length: 13 }, (_, i) => 8 + i) // 8..20

// Reservas de cubículos por día del mes. `hora` = hora de inicio.
export const eventosPorDia = {
  17: [{ hora: 16, titulo: 'Cubículo 7', detalle: 'Tarea en equipo' }],
  18: [{ hora: 11, titulo: 'Cubículo 3', detalle: 'Proyecto ISC' }],
  19: [
    { hora: 9,  titulo: 'Cubículo 4', detalle: 'Reunión' },
    { hora: 13, titulo: 'Cubículo 3', detalle: 'Estudio grupal' },
  ],
  20: [{ hora: 10, titulo: 'Cubículo 5', detalle: 'Proyecto integrador' }],
  21: [
    { hora: 9,  titulo: 'Cubículo 1', detalle: 'Repaso examen' },
    { hora: 12, titulo: 'Cubículo 7', detalle: 'Estudio' },
  ],
}
