import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'

import { register } from './authSlice.js'
import logoUpa from '../../assets/upa-logo.webp'

const IconArrow = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14 M13 6l6 6-6 6" />
  </svg>
)

const inputCls =
  'w-full rounded-lg border border-[#CBD5E1] bg-white px-4 py-3 text-[15px] text-[#0F172A] outline-none transition placeholder:text-[#94A3B8] focus:border-[#0033A0] focus:ring-2 focus:ring-[#0033A0]/15'
const labelCls =
  "mb-2 block font-['IBM_Plex_Mono'] text-[11px] font-medium uppercase tracking-[0.12em] text-[#475569]"

export default function Register() {
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [password, setPassword] = useState('')

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { status, error } = useSelector((state) => state.auth)
  const cargando = status === 'loading'

  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = await dispatch(register({ nombre, apellido, email, password, telefono }))
    if (register.fulfilled.match(result)) {
      // El rol se asigna por el dominio del correo (1=Estudiante, 2=Docente):
      // llevamos a cada uno a su pantalla correspondiente.
      const rol = result.payload?.user?.rol_id
      navigate(rol === 2 ? '/profesor' : '/alumnos')
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Banner decorativo superior con franjas diagonales UPA */}
      <div
        className="h-16 w-full bg-[#0F172A]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(115deg, transparent 0 16px, rgba(0,51,160,0.85) 16px 20px, rgba(96,140,255,0.6) 20px 24px, transparent 24px 46px)',
        }}
      />

      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex justify-center">
            <img src={logoUpa} alt="UPA" className="h-20 w-auto" />
          </div>

          <p className="mb-2 font-['IBM_Plex_Mono'] text-[11px] font-medium uppercase tracking-[0.22em] text-[#94A3B8]">
            Crear cuenta
          </p>
          <h1 className="font-['Outfit'] text-4xl font-extrabold tracking-tight text-[#0F172A]">
            Regístrate en el sistema
          </h1>
          <p className="mt-2 text-[15px] text-[#475569]">
            Usa tu correo proporcionado por la UPA para crear tu cuenta.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="nombre" className={labelCls}>Nombre</label>
              <input
                id="nombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                className={inputCls}
              />
            </div>

            <div>
              <label htmlFor="apellido" className={labelCls}>Apellido</label>
              <input
                id="apellido"
                type="text"
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                required
                className={inputCls}
              />
            </div>

            <div>
              <label htmlFor="email" className={labelCls}>Correo institucional</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Ingresa tu correo institucional aquí"
                autoComplete="email"
                className={inputCls}
              />
              <span className="mt-1 block text-xs text-[#94A3B8]">
                Formato: up&lt;matrícula&gt;@alumnos.upa.edu.mx para alumnos, nombre.apellido@upa.edu.mx para profesores.
              </span>
            </div>

            <div>
              <label htmlFor="telefono" className={labelCls}>Teléfono</label>
              <input
                id="telefono"
                type="tel"
                inputMode="numeric"
                value={telefono}
                // Solo dígitos, máximo 10 (número telefónico a 10 dígitos).
                onChange={(e) => setTelefono(e.target.value.replace(/\D/g, '').slice(0, 10))}
                required
                placeholder="10 dígitos"
                autoComplete="tel"
                className={inputCls}
              />
              <span className="mt-1 block text-xs text-[#94A3B8]">Debe tener 10 dígitos.</span>
            </div>

            <div>
              <label htmlFor="password" className={labelCls}>Contraseña</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="••••••••"
                autoComplete="new-password"
                className={inputCls}
              />
              <span className="mt-1 block text-xs text-[#94A3B8]">Mínimo 8 caracteres.</span>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0033A0] py-3.5 font-['Outfit'] text-base font-semibold text-white transition hover:bg-[#00287A] disabled:opacity-60"
            >
              {cargando ? 'Creando cuenta…' : 'Registrarse'}
              {!cargando && <IconArrow />}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-[#475569]">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="font-semibold text-[#0033A0] underline hover:text-[#00287A]">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
