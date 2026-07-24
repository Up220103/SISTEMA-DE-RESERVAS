// Controladores de gestión de cubículos (Admin Biblioteca).
// Mapea el modelo de BD (espacio.estado + reserva) al modelo del frontend:
//   front 'disponible' | 'reservado' | 'inhabilitado'
import {
  listarCubiculos,
  cubiculoPorId,
  crearCubiculo,
  actualizarEstadoCubiculo,
  eliminarCubiculo,
} from '../models/cubiculo.model.js'

// Estados de espacio que representan "inhabilitado" en el front.
const ESTADOS_INHABILITADO = ['Mantenimiento', 'Bloqueado']

// Convierte una fila de BD al cubículo que espera el frontend.
function aFront(row) {
  let estado = 'disponible'
  if (ESTADOS_INHABILITADO.includes(row.estado_espacio)) estado = 'inhabilitado'
  else if (row.reservado_hoy) estado = 'reservado'
  return { id: row.id, nombre: row.nombre, lugares: row.lugares, estado }
}

// GET /api/admin/cubiculos
export async function getCubiculos(req, res, next) {
  try {
    const filas = await listarCubiculos()
    const items = filas.map(aFront)
    const resumen = {
      total: items.length,
      reservados: items.filter((c) => c.estado === 'reservado').length,
      disponibles: items.filter((c) => c.estado === 'disponible').length,
      inhabilitados: items.filter((c) => c.estado === 'inhabilitado').length,
    }
    res.json({ edificio: 'Edificio 5 · Biblioteca', resumen, items })
  } catch (err) {
    next(err)
  }
}

// POST /api/admin/cubiculos   body: { lugares, nombre? }
export async function postCubiculo(req, res, next) {
  try {
    const lugares = Number(req.body?.lugares)
    if (!Number.isInteger(lugares) || lugares < 1 || lugares > 20) {
      return res.status(400).json({ message: 'La capacidad debe ser un entero entre 1 y 20.' })
    }

    // Nombre automático "Cubículo N" (N = siguiente número libre).
    const existentes = await listarCubiculos()
    const maxNum = existentes.reduce((max, c) => {
      const m = /Cubículo\s+(\d+)/i.exec(c.nombre)
      return m ? Math.max(max, Number(m[1])) : max
    }, 0)
    const nombre = (req.body?.nombre || `Cubículo ${maxNum + 1}`).trim()

    const id = await crearCubiculo({ nombre, capacidad: lugares })
    const creado = await cubiculoPorId(id)
    res.status(201).json({ id: creado.id, nombre: creado.nombre, lugares: creado.lugares, estado: 'disponible' })
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Ya existe un cubículo con ese nombre.' })
    }
    next(err)
  }
}

// PATCH /api/admin/cubiculos/:id/estado   body: { estado: 'disponible' | 'inhabilitado' }
export async function patchEstadoCubiculo(req, res, next) {
  try {
    const id = Number(req.params.id)
    const estadoFront = req.body?.estado
    if (!['disponible', 'inhabilitado'].includes(estadoFront)) {
      return res.status(400).json({ message: "estado debe ser 'disponible' o 'inhabilitado'." })
    }

    const cub = await cubiculoPorId(id)
    if (!cub) return res.status(404).json({ message: 'Cubículo no encontrado.' })

    const estadoBD = estadoFront === 'inhabilitado' ? 'Mantenimiento' : 'Disponible'
    await actualizarEstadoCubiculo(id, estadoBD)
    res.json({ id, estado: estadoFront })
  } catch (err) {
    next(err)
  }
}

// DELETE /api/admin/cubiculos/:id
export async function deleteCubiculo(req, res, next) {
  try {
    const id = Number(req.params.id)
    const cub = await cubiculoPorId(id)
    if (!cub) return res.status(404).json({ message: 'Cubículo no encontrado.' })

    await eliminarCubiculo(id)
    res.json({ id, eliminado: true })
  } catch (err) {
    // FK: el cubículo tiene reservas asociadas → no se puede borrar.
    if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.errno === 1451) {
      return res.status(409).json({
        message: 'No se puede eliminar: el cubículo tiene reservas. Deshabilítalo en su lugar.',
      })
    }
    next(err)
  }
}
