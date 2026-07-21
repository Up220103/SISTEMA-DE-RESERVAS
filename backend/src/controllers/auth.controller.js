// Controladores de autenticacion (BD reservas_upa, tabla `usuario`).
// Respuestas: login/register -> { token, user }; errores -> { message }.
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

import { findByEmail, findById, createUser } from '../models/user.model.js'

const JWT_SECRET = process.env.JWT_SECRET || 'secreto_de_desarrollo'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h'
const BCRYPT_ROUNDS = 10

// El auto-registro es solo para alumnos: up<matricula>@alumnos.upa.edu(.mx).
// (Docentes y admin se dan de alta en la BD, con dominio @upa.edu.mx.)
const EMAIL_ESTUDIANTE = /^up\d+@alumnos\.upa\.edu(\.mx)?$/i
// Rol por defecto para auto-registro: 1 = Estudiante (ver tabla rol).
const ROL_ESTUDIANTE = 1

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
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

// POST /api/auth/register
export async function register(req, res, next) {
  try {
    const { nombre, apellido, email, password } = req.body || {}
    if (!nombre || !apellido || !email || !password) {
      return res
        .status(400)
        .json({ message: 'Nombre, apellido, correo y contrasena son obligatorios.' })
    }
    if (!EMAIL_ESTUDIANTE.test(email)) {
      return res.status(400).json({
        message: 'El correo de alumno debe tener el formato up<matricula>@alumnos.upa.edu.mx',
      })
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
      rolId: ROL_ESTUDIANTE,
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
