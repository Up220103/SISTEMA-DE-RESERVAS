import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'

import { login } from './authSlice.js'
import logoUpa from '../../assets/upa-logo.webp'

// Iconos inline (sin dependencias externas).
const IconMail = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 7l9 6 9-6" />
  </svg>
)
const IconLock = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="10" width="16" height="10" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </svg>
)
const IconArrow = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14 M13 6l6 6-6 6" />
  </svg>
)

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [recordarme, setRecordarme] = useState(false)

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { status, error } = useSelector((state) => state.auth)
  const cargando = status === 'loading'

  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = await dispatch(login({ email, password }))
    if (login.fulfilled.match(result)) {
      // Redireccion por rol: 1=Estudiante, 2=Docente, 3=Admin Biblioteca, 4=Admin General.
      const rol = result.payload?.user?.rol_id
      const destino =
        rol === 1 ? '/alumnos' :
        rol === 2 ? '/profesor' :
        rol === 3 ? '/admin' :
        '/'
      navigate(destino)
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
            Iniciar sesión
          </p>
          <h1 className="font-['Outfit'] text-4xl font-extrabold tracking-tight text-[#0F172A]">
            Bienvenido de vuelta
          </h1>
          <p className="mt-2 text-[15px] text-[#475569]">
            Ingresa con tu cuenta institucional para continuar.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block font-['IBM_Plex_Mono'] text-[11px] font-medium uppercase tracking-[0.12em] text-[#475569]"
              >
                Correo institucional
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]">
                  <IconMail />
                </span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="up230743@alumnos.upa.edu.mx"
                  autoComplete="email"
                  className="w-full rounded-lg border border-[#CBD5E1] bg-white py-3 pl-11 pr-4 text-[15px] text-[#0F172A] outline-none transition placeholder:text-[#94A3B8] focus:border-[#0033A0] focus:ring-2 focus:ring-[#0033A0]/15"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block font-['IBM_Plex_Mono'] text-[11px] font-medium uppercase tracking-[0.12em] text-[#475569]"
              >
                Contraseña
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]">
                  <IconLock />
                </span>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-[#CBD5E1] bg-white py-3 pl-11 pr-4 text-[15px] text-[#0F172A] outline-none transition placeholder:text-[#94A3B8] focus:border-[#0033A0] focus:ring-2 focus:ring-[#0033A0]/15"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-[#475569]">
                <input
                  type="checkbox"
                  checked={recordarme}
                  onChange={(e) => setRecordarme(e.target.checked)}
                  className="h-4 w-4 rounded border-[#CBD5E1] accent-[#0033A0]"
                />
                Recordarme
              </label>
              <button type="button" className="text-sm font-medium text-[#0033A0] hover:text-[#00287A]">
                ¿Olvidaste tu contraseña?
              </button>
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
              {cargando ? 'Ingresando…' : 'Iniciar sesión'}
              {!cargando && <IconArrow />}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-[#475569]">
            <Link to="/register" className="font-semibold text-[#0033A0] underline hover:text-[#00287A]">
              Regístrate ahora como nuevo usuario
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
