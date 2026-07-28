// Controladores de reportes de cubículos (Admin Biblioteca).
// - JSON: alimenta el dashboard de métricas del panel.
// - PDF : descarga del reporte con gráficas y texto.
import { construirMetricas, rangoPorDefecto } from '../services/reporte.service.js'
import { generarReportePdf } from '../services/reportePdf.service.js'
import { findById } from '../models/user.model.js'

const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/

// Resuelve y valida el rango del reporte (por defecto, mes actual).
function resolverRango(req) {
  const def = rangoPorDefecto()
  const desde = FECHA_RE.test(req.query.desde || '') ? req.query.desde : def.desde
  const hasta = FECHA_RE.test(req.query.hasta || '') ? req.query.hasta : def.hasta
  if (desde > hasta) return { error: 'La fecha inicial no puede ser mayor que la final.' }
  return { desde, hasta }
}

// GET /api/admin/reportes/cubiculos?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
export async function getReporteCubiculos(req, res, next) {
  try {
    const rango = resolverRango(req)
    if (rango.error) return res.status(400).json({ message: rango.error })

    const metricas = await construirMetricas(rango.desde, rango.hasta)
    res.json(metricas)
  } catch (err) {
    next(err)
  }
}

// GET /api/admin/reportes/cubiculos/pdf?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
export async function getReporteCubiculosPdf(req, res, next) {
  try {
    const rango = resolverRango(req)
    if (rango.error) return res.status(400).json({ message: rango.error })

    const metricas = await construirMetricas(rango.desde, rango.hasta)

    let generadoPor = req.user?.email || ''
    try {
      const u = await findById(req.user.id)
      if (u) generadoPor = `${u.nombre} ${u.apellido} (${u.email})`
    } catch {
      // Si falla, basta con el correo del token.
    }

    const nombre = `reporte-cubiculos_${rango.desde}_a_${rango.hasta}.pdf`
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${nombre}"`)

    generarReportePdf(metricas, { generadoPor }, res)
  } catch (err) {
    next(err)
  }
}
