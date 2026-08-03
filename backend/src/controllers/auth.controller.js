// Controladores de autenticacion (BD reservas_upa, tabla `usuario`).
// Respuestas: login/register -> { token, user }; errores -> { message }.
import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

import {
  findByEmail,
  findById,
  createUser,
  perfilPorId,
  actualizarPassword,
  actualizarPerfil,
} from '../models/user.model.js'
import {
  crearSolicitud,
  solicitudVigentePorToken,
  marcarUsada,
  MINUTOS_VIGENCIA,
} from '../models/password.model.js'
import { enviarCorreo, correoRestablecer } from '../services/correo.service.js'
import { crearNotificacion } from '../models/notificacion.model.js'

const JWT_SECRET = process.env.JWT_SECRET || 'secreto_de_desarrollo'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h'
const BCRYPT_ROUNDS = 10

// El auto-registro acepta alumnos y profesores (los admin se dan de alta en la BD):
//   Alumno   -> up<matricula>@alumnos.upa.edu(.mx)   -> rol 1 (Estudiante)
//   Profesor -> nombre.apellido@upa.edu.mx           -> rol 2 (Docente)
const EMAIL_ESTUDIANTE = /^up\d+@alumnos\.upa\.edu(\.mx)?$/i
const EMAIL_DOCENTE = /^[a-z0-9._%+-]+@upa\.edu\.mx$/i
// Roles asignados automaticamente segun el dominio del correo (ver tabla rol).
const ROL_ESTUDIANTE = 1
const ROL_DOCENTE = 2

// Cuentas institucionales: su nombre identifica a la dependencia (Biblioteca,
// Admin General), no a la persona que la atiende, asi que es FIJO. Quien la use
// puede cambiar su telefono y su contrasena, pero no renombrar la cuenta.
const ROLES_NOMBRE_FIJO = [3, 4] // Admin Biblioteca, Admin General

export function tieneNombreFijo(rolId) {
  return ROLES_NOMBRE_FIJO.includes(Number(rolId))
}

// Devuelve el rol_id que corresponde al correo, o null si no es un correo UPA valido.
// Se comprueba primero alumno: su subdominio (@alumnos.upa.edu.mx) no coincide con
// el patron de docente (@upa.edu.mx), asi que no hay ambiguedad.
function rolPorCorreo(email) {
  if (EMAIL_ESTUDIANTE.test(email)) return ROL_ESTUDIANTE
  if (EMAIL_DOCENTE.test(email)) return ROL_DOCENTE
  return null
}

// ID a mostrar: para alumnos es su matrícula tal cual aparece en el correo
// (upXXXXXX). Al derivarse del correo (no editable) es inmutable. Para el resto
// se usa su identificador (matrícula/num. empleado) o un genérico USR-<id>.
function idParaMostrar(u) {
  const m = /^(up\d+)@alumnos\.upa\.edu(\.mx)?$/i.exec(u.email || '')
  if (m) return m[1].toLowerCase()
  return u.identificador || `USR-${u.usuario_id}`
}

// Forma publica del usuario que se envia al frontend (sin el hash).
function usuarioPublico(u) {
  return {
    id: u.usuario_id,
    nombre: u.nombre,
    apellido: u.apellido,
    email: u.email,
    rol: u.nombre_rol,
    rol_id: u.rol_id,
  }
}

function firmarToken(user) {
  // rol_id viaja en el token para poder autorizar por rol sin ir a la BD.
  return jwt.sign(
    { id: user.id, email: user.email, rol_id: user.rol_id },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  )
}

// POST /api/auth/register
export async function register(req, res, next) {
  try {
    const { nombre, apellido, email, password, telefono } = req.body || {}
    if (!nombre || !apellido || !email || !password || !telefono) {
      return res
        .status(400)
        .json({ message: 'Nombre, apellido, correo, teléfono y contraseña son obligatorios.' })
    }
    const rolId = rolPorCorreo(email)
    if (!rolId) {
      return res.status(400).json({
        message:
          'Usa tu correo UPA: up<matrícula>@alumnos.upa.edu.mx para alumnos o nombre.apellido@upa.edu.mx para profesores.',
      })
    }
    // El teléfono debe ser exactamente 10 dígitos (sin espacios ni signos).
    if (!/^\d{10}$/.test(String(telefono))) {
      return res.status(400).json({ message: 'El teléfono debe tener exactamente 10 dígitos.' })
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'La contrasena debe tener al menos 8 caracteres.' })
    }

    const existente = await findByEmail(email)
    if (existente) {
      return res.status(409).json({ message: 'Ya existe una cuenta con este correo.' })
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)
    const creado = await createUser({
      nombre,
      apellido,
      email,
      passwordHash,
      rolId,
      telefono: String(telefono),
    })

    const user = usuarioPublico(creado)
    res.status(201).json({ token: firmarToken(user), user })
  } catch (err) {
    next(err)
  }
}

// POST /api/auth/login
export async function login(req, res, next) {
  try {
    const { email, password } = req.body || {}
    if (!email || !password) {
      return res.status(400).json({ message: 'Correo y contrasena son obligatorios.' })
    }

    const usuario = await findByEmail(email)
    // Mensaje generico para no revelar si el correo existe.
    if (!usuario) return res.status(401).json({ message: 'Correo o contrasena incorrectos.' })
    if (usuario.estado !== 'Activo') {
      return res.status(403).json({ message: 'La cuenta esta inactiva.' })
    }

    const coincide = await bcrypt.compare(password, usuario.password_hash)
    if (!coincide) return res.status(401).json({ message: 'Correo o contrasena incorrectos.' })

    const user = usuarioPublico(usuario)
    res.json({ token: firmarToken(user), user })
  } catch (err) {
    next(err)
  }
}

// GET /api/auth/me  (protegida)
export async function me(req, res, next) {
  try {
    const usuario = await findById(req.user.id)
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado.' })
    res.json({ user: usuarioPublico(usuario) })
  } catch (err) {
    next(err)
  }
}

// GET /api/auth/perfil  (protegida) -> datos para el panel de usuario (sin el hash)
export async function perfil(req, res, next) {
  try {
    const u = await perfilPorId(req.user.id)
    if (!u) return res.status(404).json({ message: 'Usuario no encontrado.' })
    res.json({
      perfil: {
        id: u.usuario_id,
        identificador: idParaMostrar(u),
        nombre: u.nombre,
        apellido: u.apellido,
        nombre_completo: `${u.nombre} ${u.apellido}`,
        email: u.email,
        telefono: u.telefono,
        rol: u.nombre_rol,
        rol_id: u.rol_id,
        estado: u.estado,
        // El frontend usa esto para no ofrecer editar el nombre de las
        // cuentas institucionales (Biblioteca / Admin General).
        nombre_fijo: tieneNombreFijo(u.rol_id),
      },
    })
  } catch (err) {
    next(err)
  }
}

// PUT /api/auth/perfil  (protegida) -> edita nombre, apellido y teléfono
export async function editarPerfil(req, res, next) {
  try {
    const { nombre, apellido, telefono } = req.body || {}

    const actual = await perfilPorId(req.user.id)
    if (!actual) return res.status(404).json({ message: 'Usuario no encontrado.' })

    // El telefono debe seguir siendo de 10 digitos si se envia.
    if (telefono && !/^\d{10}$/.test(String(telefono))) {
      return res.status(400).json({ message: 'El teléfono debe tener exactamente 10 dígitos.' })
    }

    // En las cuentas institucionales el nombre no se toca: se conserva el de
    // la BD aunque el cliente mande otro.
    let nuevoNombre = nombre
    let nuevoApellido = apellido
    if (tieneNombreFijo(actual.rol_id)) {
      nuevoNombre = actual.nombre
      nuevoApellido = actual.apellido
    } else if (!nombre || !apellido) {
      return res.status(400).json({ message: 'Nombre y apellido son obligatorios.' })
    }

    await actualizarPerfil(req.user.id, {
      nombre: nuevoNombre,
      apellido: nuevoApellido,
      telefono,
    })
    const u = await perfilPorId(req.user.id)
    res.json({
      perfil: {
        id: u.usuario_id,
        identificador: idParaMostrar(u),
        nombre: u.nombre,
        apellido: u.apellido,
        nombre_completo: `${u.nombre} ${u.apellido}`,
        email: u.email,
        telefono: u.telefono,
        rol: u.nombre_rol,
        rol_id: u.rol_id,
        estado: u.estado,
        // El frontend usa esto para no ofrecer editar el nombre de las
        // cuentas institucionales (Biblioteca / Admin General).
        nombre_fijo: tieneNombreFijo(u.rol_id),
      },
    })
  } catch (err) {
    next(err)
  }
}

// POST /api/auth/cambiar-password  (protegida)
// Body: { actual, nueva }. Valida la actual y guarda el nuevo hash bcrypt.
export async function cambiarPassword(req, res, next) {
  try {
    const { actual, nueva } = req.body || {}
    if (!actual || !nueva) {
      return res.status(400).json({ message: 'La contraseña actual y la nueva son obligatorias.' })
    }
    if (nueva.length < 8) {
      return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 8 caracteres.' })
    }

    const u = await perfilPorId(req.user.id)
    if (!u) return res.status(404).json({ message: 'Usuario no encontrado.' })

    const coincide = await bcrypt.compare(actual, u.password_hash)
    if (!coincide) return res.status(401).json({ message: 'La contraseña actual no es correcta.' })

    const nuevoHash = await bcrypt.hash(nueva, BCRYPT_ROUNDS)
    await actualizarPassword(req.user.id, nuevoHash)
    res.json({ message: 'Contraseña actualizada correctamente.' })
  } catch (err) {
    next(err)
  }
}

// ------------------------------------------- OLVIDE MI CONTRASEÑA ---
// El token viaja en el enlace; en la BD solo se guarda su SHA-256.
const hashToken = (t) => crypto.createHash('sha256').update(t).digest('hex')

// URL del frontend a la que apunta el enlace del correo.
const APP_URL = process.env.APP_URL || 'http://localhost:5173'

// POST /api/auth/olvide-password   body: { email }
// SIEMPRE responde lo mismo, exista o no la cuenta: si el mensaje cambiara,
// cualquiera podría usar este endpoint para averiguar qué correos están dados
// de alta en la universidad.
export async function olvidePassword(req, res, next) {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase()
    if (!email) {
      return res.status(400).json({ message: 'Indica tu correo institucional.' })
    }

    const respuestaGenerica = {
      message:
        'Si el correo corresponde a una cuenta registrada, te enviamos un enlace para restablecer tu contraseña. Revisa tu bandeja.',
    }

    const usuario = await findByEmail(email)
    // Cuenta inexistente o desactivada: se corta aquí, con la misma respuesta.
    if (!usuario || usuario.estado !== 'Activo') {
      return res.json(respuestaGenerica)
    }

    const token = crypto.randomBytes(32).toString('hex')
    await crearSolicitud(usuario.usuario_id, hashToken(token))

    const enlace = `${APP_URL}/restablecer?token=${token}`
    const { asunto, texto } = correoRestablecer({
      nombre: usuario.nombre,
      enlace,
      minutos: MINUTOS_VIGENCIA,
    })
    const envio = await enviarCorreo({ para: usuario.email, asunto, texto })

    // El administrador ve la solicitud en su panel y puede resolverla a mano.
    res.json({
      ...respuestaGenerica,
      modo: envio.modo,
      // En modo demo NO sale correo de verdad, así que se devuelve el enlace
      // para poder probar el flujo completo. Con SMTP configurado no se expone.
      ...(envio.modo === 'demo' ? { enlace_demo: enlace } : {}),
    })
  } catch (err) {
    next(err)
  }
}

// GET /api/auth/restablecer/:token -> valida el enlace antes de pintar el formulario
export async function validarTokenPassword(req, res, next) {
  try {
    const solicitud = await solicitudVigentePorToken(hashToken(String(req.params.token || '')))
    if (!solicitud) {
      return res
        .status(404)
        .json({ message: 'El enlace no es válido o ya caducó. Solicita uno nuevo.' })
    }
    res.json({ valido: true, email: solicitud.email, nombre: solicitud.nombre })
  } catch (err) {
    next(err)
  }
}

// POST /api/auth/restablecer   body: { token, nueva }
export async function restablecerPassword(req, res, next) {
  try {
    const { token, nueva } = req.body || {}
    if (!token || !nueva) {
      return res.status(400).json({ message: 'Faltan el enlace y la nueva contraseña.' })
    }
    if (String(nueva).length < 8) {
      return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 8 caracteres.' })
    }

    const solicitud = await solicitudVigentePorToken(hashToken(String(token)))
    if (!solicitud) {
      return res
        .status(404)
        .json({ message: 'El enlace no es válido o ya caducó. Solicita uno nuevo.' })
    }
    if (solicitud.estado !== 'Activo') {
      return res.status(403).json({ message: 'La cuenta está inactiva. Contacta al administrador.' })
    }

    await actualizarPassword(solicitud.usuario_id, await bcrypt.hash(nueva, BCRYPT_ROUNDS))
    // Un enlace sirve una sola vez.
    await marcarUsada(solicitud.solicitud_id)
    await crearNotificacion(
      solicitud.usuario_id,
      'Contraseña restablecida',
      'Tu contraseña se cambió mediante el enlace de recuperación. Si no fuiste tú, avisa a soporte de inmediato.',
    )

    res.json({ message: 'Contraseña actualizada. Ya puedes iniciar sesión.' })
  } catch (err) {
    next(err)
  }
}
