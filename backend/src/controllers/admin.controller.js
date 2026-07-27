// Controladores del panel de Administrador General.
// Respuestas JSON; errores -> { message }. Protegido por requireAdminGeneral.
import * as model from '../models/admin.model.js'

const ESTADOS_USUARIO = ['Activo', 'Inactivo']
const ESTADOS_ESPACIO = ['Disponible', 'Ocupado', 'Bloqueado', 'Mantenimiento']
// El Admin General NO administra alumnos para roles (solo cuentas @upa.edu.mx).
const EMAIL_ALUMNO = /@alumnos\.upa\.edu(\.mx)?$/i

// Oculta el hash real; el frontend solo muestra que esta cifrada.
function protegerUsuario(u) {
  return {
    id: u.usuario_id,
    nombre: u.nombre,
    apellido: u.apellido,
    email: u.email,
    rol: u.nombre_rol,
    rol_id: u.rol_id,
    estado: u.estado,
    matricula: u.matricula || null,
    identificador: u.matricula || u.num_empleado || null,
    carrera: u.carrera || null,
    departamento: u.departamento || null,
    telefono: u.telefono || null,
    // Nunca enviamos el hash: el Admin General no puede ver la contraseña.
    tienePassword: Boolean(u.password_hash),
  }
}

// --------------------------------------------------------------- USUARIOS ---

export async function getUsuarios(req, res, next) {
  try {
    const usuarios = await model.listUsuarios()
    res.json({ usuarios: usuarios.map(protegerUsuario) })
  } catch (err) {
    next(err)
  }
}

export async function getReservasUsuario(req, res, next) {
  try {
    const reservas = await model.listReservasUsuario(req.params.id, req.query.limit)
    res.json({ reservas })
  } catch (err) {
    next(err)
  }
}

export async function patchEstado(req, res, next) {
  try {
    const { estado } = req.body || {}
    if (!ESTADOS_USUARIO.includes(estado)) {
      return res.status(400).json({ message: "Estado invalido (usa 'Activo' o 'Inactivo')." })
    }
    if (Number(req.params.id) === req.user.id) {
      return res.status(400).json({ message: 'No puedes cambiar tu propio estado.' })
    }
    const usuario = await model.setUsuarioEstado(req.params.id, estado)
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado.' })
    res.json({ usuario: protegerUsuario(usuario) })
  } catch (err) {
    next(err)
  }
}

export async function patchRol(req, res, next) {
  try {
    const rolId = Number(req.body?.rol_id)
    if (!rolId) return res.status(400).json({ message: 'rol_id es obligatorio.' })

    const objetivo = await model.findUsuario(req.params.id)
    if (!objetivo) return res.status(404).json({ message: 'Usuario no encontrado.' })

    // Regla del documento: los roles solo se administran para cuentas @upa.edu.mx.
    if (EMAIL_ALUMNO.test(objetivo.email)) {
      return res.status(403).json({
        message: 'No se pueden asignar roles a cuentas de alumno (@alumnos.upa.edu.mx).',
      })
    }
    const roles = await model.listRoles()
    if (!roles.some((r) => r.rol_id === rolId)) {
      return res.status(400).json({ message: 'El rol indicado no existe.' })
    }
    const usuario = await model.setUsuarioRol(req.params.id, rolId)
    res.json({ usuario: protegerUsuario(usuario) })
  } catch (err) {
    next(err)
  }
}

export async function getRoles(req, res, next) {
  try {
    res.json({ roles: await model.listRoles() })
  } catch (err) {
    next(err)
  }
}

// ------------------------------------------------------ EDIFICIOS / ESPACIOS ---

export async function getEdificios(req, res, next) {
  try {
    res.json({ edificios: await model.listEdificios() })
  } catch (err) {
    next(err)
  }
}

export async function getTipos(req, res, next) {
  try {
    res.json({ tipos: await model.listTiposEspacio() })
  } catch (err) {
    next(err)
  }
}

export async function getEspacios(req, res, next) {
  try {
    const espacios = (await model.listEspacios()).map((e) => ({
      ...e,
      es_biblioteca: Boolean(e.es_biblioteca),
    }))
    res.json({ espacios })
  } catch (err) {
    next(err)
  }
}

// Verifica que el edificio/tipo NO sea de la Biblioteca (cubículos).
async function esZonaBiblioteca({ edificio_id, tipo_id }) {
  const [edificios, tipos] = [await model.listEdificios(), await model.listTiposEspacio()]
  const ed = edificios.find((e) => e.edificio_id === Number(edificio_id))
  const tp = tipos.find((t) => t.tipo_id === Number(tipo_id))
  return (ed && ed.nombre === 'Biblioteca') || (tp && tp.nombre_tipo === 'Cubículo')
}

export async function postEspacio(req, res, next) {
  try {
    const { tipo_id, edificio_id, nombre, capacidad, estado } = req.body || {}
    if (!tipo_id || !edificio_id || !nombre || !capacidad) {
      return res
        .status(400)
        .json({ message: 'tipo_id, edificio_id, nombre y capacidad son obligatorios.' })
    }
    if (estado && !ESTADOS_ESPACIO.includes(estado)) {
      return res.status(400).json({ message: 'Estado de espacio invalido.' })
    }
    if (await esZonaBiblioteca({ edificio_id, tipo_id })) {
      return res.status(403).json({
        message: 'El Admin General no administra la Biblioteca ni los cubículos.',
      })
    }
    const espacio = await model.createEspacio({ tipo_id, edificio_id, nombre, capacidad, estado })
    res.status(201).json({ espacio })
  } catch (err) {
    next(err)
  }
}

export async function patchEspacio(req, res, next) {
  try {
    const actual = await model.findEspacio(req.params.id)
    if (!actual) return res.status(404).json({ message: 'Espacio no encontrado.' })

    // No permitir tocar espacios que ya son de la Biblioteca/cubículos...
    if (actual.edificio === 'Biblioteca' || actual.nombre_tipo === 'Cubículo') {
      return res.status(403).json({ message: 'Ese espacio lo administra el Admin de Biblioteca.' })
    }
    const nombre = req.body?.nombre ?? actual.nombre
    const capacidad = req.body?.capacidad ?? actual.capacidad
    const estado = req.body?.estado ?? actual.estado
    const tipo_id = req.body?.tipo_id ?? actual.tipo_id
    const edificio_id = req.body?.edificio_id ?? actual.edificio_id

    if (!ESTADOS_ESPACIO.includes(estado)) {
      return res.status(400).json({ message: 'Estado de espacio invalido.' })
    }
    // ...ni moverlo hacia la Biblioteca/cubículos.
    if (await esZonaBiblioteca({ edificio_id, tipo_id })) {
      return res.status(403).json({ message: 'No puedes mover un espacio a la Biblioteca.' })
    }
    const espacio = await model.updateEspacio(req.params.id, {
      nombre,
      capacidad,
      estado,
      tipo_id,
      edificio_id,
    })
    res.json({ espacio })
  } catch (err) {
    next(err)
  }
}

export async function postEdificio(req, res, next) {
  try {
    const { nombre } = req.body || {}
    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ message: 'El nombre del edificio es obligatorio.' })
    }
    if (nombre.trim().toLowerCase() === 'biblioteca') {
      return res.status(403).json({ message: 'No puedes crear otro edificio "Biblioteca".' })
    }
    // Solo se captura el nombre; el codigo se genera automatico en el modelo.
    const id = await model.createEdificio({ nombre: nombre.trim() })
    const edificios = await model.listEdificios()
    res.status(201).json({ edificio: edificios.find((e) => e.edificio_id === id) })
  } catch (err) {
    next(err)
  }
}

// --------------------------------------------------------------- REPORTES ---

export async function getReportes(req, res, next) {
  try {
    const { desde, hasta } = req.query
    res.json(await model.reporteReservas(desde || null, hasta || null))
  } catch (err) {
    next(err)
  }
}

export async function getReservas(req, res, next) {
  try {
    res.json({ reservas: await model.listReservas() })
  } catch (err) {
    next(err)
  }
}

// Aprobar / rechazar / cancelar una reserva.
const ESTADOS_RESERVA = { Pendiente: 1, Confirmada: 2, Completada: 3, Cancelada: 4 }

export async function patchReservaEstado(req, res, next) {
  try {
    const { estado, motivo } = req.body || {}
    const estadoId = ESTADOS_RESERVA[estado]
    if (!estadoId) {
      return res
        .status(400)
        .json({ message: 'Estado inválido (Confirmada, Cancelada, Completada o Pendiente).' })
    }
    const reserva = await model.setReservaEstado(req.params.id, estadoId, motivo)
    if (!reserva) return res.status(404).json({ message: 'Reserva no encontrada.' })
    res.json({ reserva })
  } catch (err) {
    next(err)
  }
}

// ------------------------------------------- CIERRE POR CICLO ESCOLAR ---
const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/

export async function getCierre(req, res, next) {
  try {
    res.json({ cierre: await model.getCierre() })
  } catch (err) {
    next(err)
  }
}

export async function putCierre(req, res, next) {
  try {
    const { inicio, fin } = req.body || {}
    if (!FECHA_RE.test(inicio || '') || !FECHA_RE.test(fin || '')) {
      return res.status(400).json({ message: 'Indica inicio y fin en formato YYYY-MM-DD.' })
    }
    if (fin < inicio) {
      return res.status(400).json({ message: 'La fecha de fin no puede ser anterior a la de inicio.' })
    }
    const cierre = await model.setCierre(req.user.id, inicio, fin)
    res.json({ cierre })
  } catch (err) {
    next(err)
  }
}

export async function deleteCierre(req, res, next) {
  try {
    await model.deleteCierre()
    res.json({ cierre: null })
  } catch (err) {
    next(err)
  }
}
