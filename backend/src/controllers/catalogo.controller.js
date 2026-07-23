// Catálogos para armar una reserva: tipos de espacio permitidos y espacios.
import { findById } from '../models/user.model.js'
import { tiposPorRol, espaciosPorTipo } from '../models/catalogo.model.js'

// GET /api/catalogo/tipos  -> tipos que el rol del usuario autenticado puede reservar
export async function getTipos(req, res, next) {
  try {
    const usuario = await findById(req.user.id)
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado.' })
    const tipos = await tiposPorRol(usuario.rol_id)
    res.json({ tipos })
  } catch (err) {
    next(err)
  }
}

// GET /api/catalogo/espacios?tipo_id=NN  -> espacios de ese tipo, planos y agrupados por edificio
export async function getEspacios(req, res, next) {
  try {
    const tipoId = Number(req.query.tipo_id)
    if (!tipoId) return res.status(400).json({ message: 'El parámetro tipo_id es obligatorio.' })

    const espacios = await espaciosPorTipo(tipoId)
    const porEdificio = {}
    for (const e of espacios) {
      if (!porEdificio[e.edificio]) porEdificio[e.edificio] = []
      porEdificio[e.edificio].push(e)
    }
    res.json({ espacios, porEdificio })
  } catch (err) {
    next(err)
  }
}
