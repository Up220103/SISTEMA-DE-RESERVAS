// Controladores del panel de Administrador General.
// Respuestas JSON; errores -> { message }. Protegido por requireAdminGeneral.
import bcrypt from 'bcryptjs'

import * as model from '../models/admin.model.js'
import { actualizarPassword } from '../models/user.model.js'
import { solicitudesPendientes, cerrarSolicitudesDeUsuario } from '../models/password.model.js'
import { tieneNombreFijo } from './auth.controller.js'
import {
  cancelarPorUsuarioInactivo,
  cancelarPorCambioDeRol,
  cancelarPorEspacioInhabilitado,
  cancelarPorCierre,
  notificarResolucion,
} from '../services/reserva.service.js'
import { reservaConDueno, traslapeActivo } from '../models/reserva.model.js'
import { crearNotificacion } from '../models/notificacion.model.js'
import { emitAUsuario } from '../realtime.js'

// Avisa en tiempo real (Socket.IO) al usuario afectado por un cambio del admin.
// El frontend muestra un aviso emergente con un boton para recargar la pagina.
function avisarUsuario(usuarioId, titulo, mensaje) {
  emitAUsuario(usuarioId, 'usuario:actualizado', { titulo, mensaje })
}

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
    // Se comprueba ANTES de escribir para poder responder 404 sin efectos.
    const objetivo = await model.findUsuario(req.params.id)
    if (!objetivo) return res.status(404).json({ message: 'Usuario no encontrado.' })

    const usuario = await model.setUsuarioEstado(req.params.id, estado)

    // Al desactivar, sus reservas futuras se cancelan: si no, seguirian
    // ocupando esos horarios sin que nadie pueda presentarse a usarlos.
    let reservasCanceladas = 0
    if (estado === 'Inactivo' && objetivo.estado !== 'Inactivo') {
      reservasCanceladas = await cancelarPorUsuarioInactivo(usuario.usuario_id, req.user.id)
    }
    if (estado === 'Activo' && objetivo.estado !== 'Activo') {
      await crearNotificacion(
        usuario.usuario_id,
        'Cuenta reactivada',
        'Tu cuenta fue reactivada. Ya puedes iniciar sesión y hacer reservas de nuevo.',
      )
    }
    avisarUsuario(
      usuario.usuario_id,
      'Tu cuenta cambió',
      `Un administrador cambió el estado de tu cuenta a ${estado}.`,
    )
    res.json({ usuario: protegerUsuario(usuario), reservasCanceladas })
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

    // Quitarse a uno mismo el rol de Admin General dejaria el panel inaccesible.
    if (Number(req.params.id) === req.user.id) {
      return res.status(400).json({ message: 'No puedes cambiar tu propio rol.' })
    }

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

    // El permiso rol-tipo (regla 1 del trigger) cambia con el rol: las reservas
    // futuras de un tipo que el nuevo rol ya no puede reservar se cancelan y
    // liberan su horario.
    let reservasCanceladas = 0
    if (rolId !== objetivo.rol_id) {
      reservasCanceladas = await cancelarPorCambioDeRol(usuario.usuario_id, rolId, req.user.id)
      await crearNotificacion(
        usuario.usuario_id,
        'Rol actualizado',
        `Tu rol ahora es ${usuario.nombre_rol}. Vuelve a iniciar sesión para que los cambios se apliquen en tu panel.`,
      )
      avisarUsuario(
        usuario.usuario_id,
        'Tu rol cambió',
        `Un administrador actualizó tu rol a ${usuario.nombre_rol}.`,
      )
    }
    res.json({ usuario: protegerUsuario(usuario), reservasCanceladas })
  } catch (err) {
    next(err)
  }
}

// PATCH /api/admin-general/usuarios/:id
// El Admin General corrige los datos de contacto de cualquier cuenta.
// No se toca el correo (de el dependen el rol y la matricula) ni el nombre de
// las cuentas institucionales.
export async function patchUsuario(req, res, next) {
  try {
    const objetivo = await model.findUsuario(req.params.id)
    if (!objetivo) return res.status(404).json({ message: 'Usuario no encontrado.' })

    const { nombre, apellido, telefono } = req.body || {}
    if (telefono && !/^\d{10}$/.test(String(telefono))) {
      return res.status(400).json({ message: 'El teléfono debe tener exactamente 10 dígitos.' })
    }

    let nuevoNombre = nombre?.trim() ?? objetivo.nombre
    let nuevoApellido = apellido?.trim() ?? objetivo.apellido
    if (tieneNombreFijo(objetivo.rol_id)) {
      // Cuenta institucional: su nombre identifica a la dependencia.
      nuevoNombre = objetivo.nombre
      nuevoApellido = objetivo.apellido
    } else if (!nuevoNombre || !nuevoApellido) {
      return res.status(400).json({ message: 'Nombre y apellido son obligatorios.' })
    }

    const usuario = await model.updateUsuario(req.params.id, {
      nombre: nuevoNombre,
      apellido: nuevoApellido,
      telefono: telefono ?? objetivo.telefono,
    })
    await crearNotificacion(
      usuario.usuario_id,
      'Datos actualizados',
      'Un administrador actualizó los datos de tu cuenta. Revísalos en "Mi perfil".',
    )
    avisarUsuario(
      usuario.usuario_id,
      'Tus datos cambiaron',
      'Un administrador actualizó los datos de tu cuenta.',
    )
    res.json({ usuario: protegerUsuario(usuario) })
  } catch (err) {
    next(err)
  }
}

// POST /api/admin-general/usuarios/:id/password   body: { nueva }
// Restablece la contraseña de un usuario que no puede entrar. El admin nunca
// ve la anterior (esta hasheada): la sustituye por una nueva y se la comunica.
export async function postPasswordUsuario(req, res, next) {
  try {
    const { nueva } = req.body || {}
    if (!nueva || String(nueva).length < 8) {
      return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 8 caracteres.' })
    }
    const objetivo = await model.findUsuario(req.params.id)
    if (!objetivo) return res.status(404).json({ message: 'Usuario no encontrado.' })

    await actualizarPassword(objetivo.usuario_id, await bcrypt.hash(String(nueva), 10))
    // La peticion de "olvide mi contrasena" queda resuelta.
    await cerrarSolicitudesDeUsuario(objetivo.usuario_id, req.user.id)
    await crearNotificacion(
      objetivo.usuario_id,
      'Contraseña restablecida',
      'Un administrador restableció tu contraseña. Inicia sesión con la nueva y cámbiala desde "Mi perfil".',
    )
    avisarUsuario(
      objetivo.usuario_id,
      'Contraseña restablecida',
      'Un administrador restableció tu contraseña.',
    )
    res.json({ message: `Contraseña de ${objetivo.nombre} restablecida.` })
  } catch (err) {
    next(err)
  }
}

// GET /api/admin-general/solicitudes-password
// Bandeja de quienes pidieron recuperar su contraseña desde el login.
export async function getSolicitudesPassword(req, res, next) {
  try {
    res.json({ solicitudes: await solicitudesPendientes() })
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

    // Si el espacio deja de estar Disponible, sus reservas futuras ya no se
    // pueden cumplir: se cancelan para liberar esos horarios.
    let reservasCanceladas = 0
    if (estado !== 'Disponible' && actual.estado === 'Disponible') {
      reservasCanceladas = await cancelarPorEspacioInhabilitado(
        espacio.espacio_id,
        req.user.id,
        `el espacio pasó a estado ${estado}`,
      )
    }
    res.json({ espacio, reservasCanceladas })
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

    const actual = await reservaConDueno(Number(req.params.id))
    if (!actual) return res.status(404).json({ message: 'Reserva no encontrada.' })
    if (actual.estado === estado) {
      return res.status(409).json({ message: `La reserva ya está ${estado}.` })
    }

    // Confirmar es lo que ocupa el horario de verdad: se revalida que el
    // espacio siga habilitado y que nadie mas tenga ya ese hueco confirmado.
    if (estado === 'Confirmada') {
      if (actual.estado_espacio !== 'Disponible') {
        return res.status(409).json({
          message: `${actual.espacio} está inhabilitado: reactívalo antes de confirmar esta reserva.`,
        })
      }
      if (await traslapeActivo(actual)) {
        return res.status(409).json({
          message: `Ya hay otra reserva confirmada para ${actual.espacio} en ese horario.`,
        })
      }
    }

    const reserva = await model.setReservaEstado(req.params.id, estadoId, motivo)

    if (estado === 'Confirmada' || estado === 'Cancelada') {
      await notificarResolucion(
        actual,
        estado === 'Confirmada' ? 'Confirmada' : 'Rechazada',
        req.user.id,
        motivo,
      )
    }
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
    // La universidad no abre en ese rango: las reservas que caian dentro se
    // cancelan y se avisa a cada usuario.
    const reservasCanceladas = await cancelarPorCierre(inicio, fin, req.user.id)
    res.json({ cierre, reservasCanceladas })
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
