// Pantalla a la que lleva el enlace del correo: /restablecer?token=...
// Valida el token contra el backend antes de pedir la contraseña nueva.
import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'

import api from '../../services/api.js'
import logoUpa from '../../assets/upa-logo.webp'

const IconEye = ({ open }) => open
  ? (<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>)
  : (<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3l18 18 M10.6 10.6a3 3 0 0 0 4.2 4.2 M9.9 5.1A9.5 9.5 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.3 4M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.5 9.5 0 0 0 2.1-.2" /></svg>)

export default function RestablecerPassword() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token') || ''

  const [estado, setEstado] = useState('validando') // validando | valido | invalido | listo
  const [cuenta, setCuenta] = useState(null)
  const [nueva, setNueva] = useState('')
  const [repetir, setRepetir] = useState('')
  const [ver, setVer] = useState(false)
  const [error, setError] = useState(null)
  const [guardando, setGuardando] = useState(false)

  // Se valida al entrar: así no se pide una contraseña que luego no se podrá guardar.
  useEffect(() => {
    if (!token) { setEstado('invalido'); setError('El enlace no trae token.'); return }
    api.get(`/auth/restablecer/${token}`)
      .then(({ data }) => { setCuenta(data); setEstado('valido') })
      .catch((err) => {
        setEstado('invalido')
        setError(err.response?.data?.message || 'El enlace no es válido o ya caducó.')
      })
  }, [token])

  const guardar = async (e) => {
    e.preventDefault()
    setError(null)
    if (nueva.length < 8) { setError('La contraseña debe tener al menos 8 caracteres.'); return }
    if (nueva !== repetir) { setError('Las dos contraseñas no coinciden.'); return }
    setGuardando(true)
    try {
      await api.post('/auth/restablecer', { token, nueva })
      setEstado('listo')
      // Se vuelve al login para que entre con la contraseña nueva.
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo restablecer la contraseña.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
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

          {estado === 'validando' && (
            <p className="text-center text-sm text-slate-400">Comprobando el enlace…</p>
          )}

          {estado === 'invalido' && (
            <div className="text-center">
              <h1 className="font-display text-3xl font-extrabold text-[#0F172A]">Enlace no válido</h1>
              <p className="mt-2 text-[15px] text-[#475569]">{error}</p>
              <Link
                to="/login"
                className="mt-6 inline-block w-full rounded-lg bg-[#0033A0] py-3 font-display text-base font-semibold text-white transition hover:bg-[#00287A]"
              >
                Volver al inicio de sesión
              </Link>
              <p className="mt-3 text-sm text-slate-400">
                Desde ahí puedes pedir un enlace nuevo o contactar a soporte.
              </p>
            </div>
          )}

          {estado === 'listo' && (
            <div className="text-center">
              <h1 className="font-display text-3xl font-extrabold text-[#0F172A]">¡Listo!</h1>
              <p className="mt-2 text-[15px] text-[#475569]">
                Tu contraseña se actualizó. Te llevamos al inicio de sesión…
              </p>
              <Link
                to="/login"
                className="mt-6 inline-block w-full rounded-lg bg-[#0033A0] py-3 font-display text-base font-semibold text-white transition hover:bg-[#00287A]"
              >
                Iniciar sesión
              </Link>
            </div>
          )}

          {estado === 'valido' && (
            <>
              <p className="mb-2 font-mono-upa text-[11px] font-medium uppercase tracking-[0.22em] text-[#94A3B8]">
                Restablecer contraseña
              </p>
              <h1 className="font-display text-4xl font-extrabold tracking-tight text-[#0F172A]">
                Elige una nueva
              </h1>
              <p className="mt-2 text-[15px] text-[#475569]">
                Para la cuenta <b className="text-[#0F172A]">{cuenta?.email}</b>.
              </p>

              <form onSubmit={guardar} className="mt-8 space-y-5">
                <div>
                  <label htmlFor="nueva" className="mb-2 block font-mono-upa text-[11px] font-medium uppercase tracking-[0.12em] text-[#475569]">
                    Nueva contraseña (mín. 8)
                  </label>
                  <div className="relative">
                    <input
                      id="nueva"
                      type={ver ? 'text' : 'password'}
                      value={nueva}
                      onChange={(e) => setNueva(e.target.value)}
                      autoComplete="new-password"
                      className="w-full rounded-lg border border-[#CBD5E1] bg-white py-3 pl-4 pr-11 text-[15px] outline-none focus:border-[#0033A0] focus:ring-2 focus:ring-[#0033A0]/15"
                    />
                    <button type="button" onClick={() => setVer(!ver)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0033A0]" aria-label="Ver u ocultar contraseña">
                      <IconEye open={ver} />
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="repetir" className="mb-2 block font-mono-upa text-[11px] font-medium uppercase tracking-[0.12em] text-[#475569]">
                    Repite la contraseña
                  </label>
                  <input
                    id="repetir"
                    type={ver ? 'text' : 'password'}
                    value={repetir}
                    onChange={(e) => setRepetir(e.target.value)}
                    autoComplete="new-password"
                    className="w-full rounded-lg border border-[#CBD5E1] bg-white px-4 py-3 text-[15px] outline-none focus:border-[#0033A0] focus:ring-2 focus:ring-[#0033A0]/15"
                  />
                </div>

                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
                )}

                <button
                  type="submit"
                  disabled={guardando}
                  className="w-full rounded-lg bg-[#0033A0] py-3.5 font-display text-base font-semibold text-white transition hover:bg-[#00287A] disabled:opacity-60"
                >
                  {guardando ? 'Guardando…' : 'Guardar contraseña'}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-[#475569]">
                <Link to="/login" className="font-semibold text-[#0033A0] underline hover:text-[#00287A]">
                  Volver al inicio de sesión
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
