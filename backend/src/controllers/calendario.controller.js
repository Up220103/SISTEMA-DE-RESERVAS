// Controlador del calendario de reservas de cubículos (Admin Biblioteca).
import { reservasDeCubiculosPorMes } from '../models/aprobacion.model.js'

const ESTADO_A_FRONT = {
  Pendiente: 'pendiente',
  Confirmada: 'aprobada',
  Rechazada: 'rechazada',
}

const hhmm = (t) => (t ? String(t).slice(0, 5) : '')

// GET /api/admin/calendario?anio=YYYY&mes=M
// Devuelve las reservas de cubículos del mes, agrupables por día en el front.
export async function getCalendario(req, res, next) {
  try {
    const anio = Number(req.query.anio)
    const mes = Number(req.query.mes) // 1-12
    if (!anio || !mes || mes < 1 || mes > 12) {
      return res.status(400).json({ message: 'anio y mes (1-12) son obligatorios.' })
    }

    const filas = await reservasDeCubiculosPorMes(anio, mes)
    const items = filas.map((r) => ({
      id: r.reserva_id,
      fecha: r.fecha_reserva, // 'YYYY-MM-DD'
      hora: `${hhmm(r.hora_inicio)}–${hhmm(r.hora_fin)}`,
      cubiculo: r.cubiculo,
      solicitante: r.solicitante,
      estado: ESTADO_A_FRONT[r.estado] || 'pendiente',
    }))
    res.json({ items })
  } catch (err) {
    next(err)
  }
}
