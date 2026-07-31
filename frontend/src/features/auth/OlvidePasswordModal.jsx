// Modal de "¿Olvidaste tu contraseña?" del login. Dos vías:
//   1. Enviarme un enlace  -> el backend genera un token de un solo uso.
//   2. Contactar a soporte -> datos de la mesa de ayuda / administrador.
import { useState } from 'react'
import api from '../../services/api.js'
import { SOPORTE } from '../../components/SoporteContacto.jsx'

const IconClose = () => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12 M18 6L6 18" /></svg>)
const IconMail = () => (<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>)
const IconPhone = () => (<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 1.9.6 2.8a2 2 0 0 1-.5 2.1L8.1 9.7a16 16 0 0 0 6 6l1.1-1.1a2 2 0 0 1 2.1-.5c.9.3 1.8.5 2.8.6a2 2 0 0 1 1.7 2z" /></svg>)
const IconClock = () => (<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>)

export default function OlvidePasswordModal({ open, onClose }) {
  const [pestana, setPestana] = useState('enlace') // 'enlace' | 'soporte'
  const [email, setEmail] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [msg, setMsg] = useState(null)      // { tipo:'ok'|'err', texto }
  const [enlaceDemo, setEnlaceDemo] = useState(null)

  if (!open) return null

  const cerrar = () => {
    setMsg(null); setEnlaceDemo(null); setEmail(''); setPestana('enlace')
    onClose()
  }

  const enviar = async (e) => {
    e.preventDefault()
    setMsg(null); setEnlaceDemo(null)
    if (!email.trim()) { setMsg({ tipo: 'err', texto: 'Escribe tu correo institucional.' }); return }
    setEnviando(true)
    try {
      const { data } = await api.post('/auth/olvide-password', { email: email.trim().toLowerCase() })
      setMsg({ tipo: 'ok', texto: data.message })
      // En modo demo el correo no sale de verdad: el backend devuelve el enlace
      // para poder probar el flujo completo.
      if (data.enlace_demo) setEnlaceDemo(data.enlace_demo)
    } catch (err) {
      setMsg({ tipo: 'err', texto: err.response?.data?.message || 'No se pudo procesar la solicitud.' })
    } finally {
      setEnviando(false)
    }
  }

  const Pestana = ({ id, children }) => (
    <button
      type="button"
      onClick={() => { setPestana(id); setMsg(null) }}
      className={`flex-1 border-b-2 pb-2 font-display text-sm font-semibold transition ${
        pestana === id ? 'border-[#0033A0] text-[#0033A0]' : 'border-transparent text-slate-400 hover:text-slate-600'
      }`}
    >
      {children}
    </button>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={cerrar}>
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="relative bg-[#0033A0] px-6 py-5 text-white">
          <button onClick={cerrar} className="absolute right-4 top-4 text-white/80 hover:text-white" aria-label="Cerrar"><IconClose /></button>
          <p className="mb-1 font-mono-upa text-[10px] uppercase tracking-[0.2em] text-white/70">Recuperar acceso</p>
          <h3 className="font-display text-xl font-extrabold">¿Olvidaste tu contraseña?</h3>
        </div>

        <div className="px-6 pt-4">
          <div className="flex gap-4">
            <Pestana id="enlace">Enviarme un enlace</Pestana>
            <Pestana id="soporte">Contactar a soporte</Pestana>
          </div>
        </div>

        <div className="px-6 py-5">
          {pestana === 'enlace' ? (
            <form onSubmit={enviar}>
              <p className="mb-3 text-sm text-[#475569]">
                Escribe tu correo institucional y te enviaremos un enlace para elegir una
                contraseña nueva. El enlace caduca en 1 hora y solo sirve una vez.
              </p>
              <label htmlFor="email-recuperar" className="mb-1 block font-mono-upa text-[10px] uppercase tracking-wide text-slate-500">
                Correo institucional
              </label>
              <input
                id="email-recuperar"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tucorreo@upa.edu.mx"
                autoComplete="email"
                className="w-full rounded-lg border border-[#CBD5E1] px-3 py-2.5 text-sm outline-none focus:border-[#0033A0] focus:ring-2 focus:ring-[#0033A0]/15"
              />

              {msg && (
                <div className={`mt-3 rounded-lg border px-3 py-2 text-sm ${msg.tipo === 'ok' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
                  {msg.texto}
                </div>
              )}

              {/* Solo aparece si el servidor no tiene SMTP configurado. */}
              {enlaceDemo && (
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                  <p className="font-display text-xs font-bold text-amber-800">Modo demostración</p>
                  <p className="mt-0.5 text-xs text-amber-700">
                    El servidor aún no tiene correo configurado, así que el mensaje no salió de
                    verdad. Usa este enlace para continuar:
                  </p>
                  <a href={enlaceDemo} className="mt-1.5 block break-all font-mono-upa text-xs font-semibold text-[#0033A0] underline">
                    {enlaceDemo}
                  </a>
                </div>
              )}

              <button
                type="submit"
                disabled={enviando}
                className="mt-4 w-full rounded-lg bg-[#0033A0] py-2.5 font-display text-sm font-semibold text-white transition hover:bg-[#00287A] disabled:opacity-60"
              >
                {enviando ? 'Enviando…' : 'Enviarme el enlace'}
              </button>
            </form>
          ) : (
            <div>
              <p className="mb-3 text-sm text-[#475569]">
                Si no tienes acceso a tu correo institucional, escribe o llama a la mesa de
                ayuda: un administrador verificará tu identidad y restablecerá tu contraseña.
              </p>
              <ul className="space-y-2.5">
                <li className="flex items-start gap-2.5 text-sm text-[#475569]">
                  <span className="mt-0.5 shrink-0 text-slate-400"><IconMail /></span>
                  <a href={`mailto:${SOPORTE.email}?subject=${encodeURIComponent('Restablecer mi contraseña · Sistema de Reservas UPA')}`} className="font-semibold text-[#0033A0] hover:underline">
                    {SOPORTE.email}
                  </a>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-[#475569]">
                  <span className="mt-0.5 shrink-0 text-slate-400"><IconPhone /></span>
                  <span>{SOPORTE.telefono} <span className="text-slate-400">ext. {SOPORTE.extension}</span></span>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-[#475569]">
                  <span className="mt-0.5 shrink-0 text-slate-400"><IconClock /></span>
                  <span>{SOPORTE.horario}</span>
                </li>
              </ul>
              <p className="mt-4 rounded-lg bg-[#F8FAFC] px-3 py-2 font-mono-upa text-[11px] leading-relaxed text-slate-500">
                Ten a la mano tu matrícula o número de empleado: te los pedirán para
                confirmar que la cuenta es tuya.
              </p>
              <a
                href={`mailto:${SOPORTE.email}?subject=${encodeURIComponent('Restablecer mi contraseña · Sistema de Reservas UPA')}`}
                className="mt-4 block w-full rounded-lg bg-[#0033A0] py-2.5 text-center font-display text-sm font-semibold text-white transition hover:bg-[#00287A]"
              >
                Escribir a soporte
              </a>
            </div>
          )}
        </div>

        <div className="border-t border-[#E2E8F0] px-6 py-4">
          <button onClick={cerrar} className="w-full rounded-lg border border-[#CBD5E1] py-2.5 font-display text-sm font-semibold text-slate-600 hover:bg-slate-50">
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    </div>
  )
}
