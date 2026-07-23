import { useEffect, useState } from 'react'
import api from '../services/api.js'

// Iconos
const IconClose = () => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12 M18 6L6 18" /></svg>)
const IconId = () => (<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="8.5" cy="12" r="2" /><path d="M13 10h5 M13 14h5" /></svg>)
const IconMail = () => (<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>)
const IconRole = () => (<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 20a8 8 0 0 1 16 0" /></svg>)
const IconStatus = () => (<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M9 12l2 2 4-4" /></svg>)
const IconEye = ({ open }) => open
  ? (<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>)
  : (<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3l18 18 M10.6 10.6a3 3 0 0 0 4.2 4.2 M9.9 5.1A9.5 9.5 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.3 4M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.5 9.5 0 0 0 2.1-.2" /></svg>)

function Campo({ icono, label, valor }) {
  return (
    <div>
      <p className="mb-0.5 flex items-center gap-1.5 font-mono-upa text-[10px] uppercase tracking-wide text-slate-400">{icono} {label}</p>
      <p className="font-display text-sm font-semibold text-[#0F172A]">{valor || '—'}</p>
    </div>
  )
}

export default function UserProfileModal({ open, onClose }) {
  const [perfil, setPerfil] = useState(null)
  const [cargando, setCargando] = useState(false)

  // Cambio de contraseña
  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const [verActual, setVerActual] = useState(false)
  const [verNueva, setVerNueva] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [msg, setMsg] = useState(null)   // { tipo:'ok'|'err', texto }
  const [modoPass, setModoPass] = useState(false)

  // Edición de perfil
  const [modoEdit, setModoEdit] = useState(false)
  const [edit, setEdit] = useState({ nombre: '', apellido: '', telefono: '' })
  const [guardandoEdit, setGuardandoEdit] = useState(false)
  const [msgEdit, setMsgEdit] = useState(null)

  useEffect(() => {
    if (!open) return
    setCargando(true)
    setMsg(null); setModoPass(false); setActual(''); setNueva('')
    setModoEdit(false); setMsgEdit(null)
    api.get('/auth/perfil')
      .then(({ data }) => setPerfil(data.perfil))
      .catch(() => setPerfil(null))
      .finally(() => setCargando(false))
  }, [open])

  const abrirEdicion = () => {
    setEdit({ nombre: perfil?.nombre || '', apellido: perfil?.apellido || '', telefono: perfil?.telefono || '' })
    setMsgEdit(null); setModoEdit(true)
  }

  const guardarPerfil = async () => {
    if (!edit.nombre.trim() || !edit.apellido.trim()) { setMsgEdit({ tipo: 'err', texto: 'Nombre y apellido son obligatorios.' }); return }
    setGuardandoEdit(true)
    try {
      const { data } = await api.put('/auth/perfil', edit)
      setPerfil(data.perfil)
      // Refleja el nuevo nombre en la sesión guardada.
      try {
        const u = JSON.parse(localStorage.getItem('user') || '{}')
        localStorage.setItem('user', JSON.stringify({ ...u, nombre: data.perfil.nombre, apellido: data.perfil.apellido }))
      } catch { /* noop */ }
      setMsgEdit({ tipo: 'ok', texto: 'Perfil actualizado.' })
      setModoEdit(false)
    } catch (err) {
      setMsgEdit({ tipo: 'err', texto: err.response?.data?.message || 'No se pudo actualizar el perfil.' })
    } finally {
      setGuardandoEdit(false)
    }
  }

  if (!open) return null

  const iniciales = perfil ? `${perfil.nombre?.[0] || ''}${perfil.apellido?.[0] || ''}`.toUpperCase() : '··'
  const activo = perfil?.estado === 'Activo'

  const guardarPassword = async () => {
    setMsg(null)
    if (!actual || !nueva) { setMsg({ tipo: 'err', texto: 'Completa ambos campos.' }); return }
    if (nueva.length < 8) { setMsg({ tipo: 'err', texto: 'La nueva contraseña debe tener al menos 8 caracteres.' }); return }
    setGuardando(true)
    try {
      const { data } = await api.post('/auth/cambiar-password', { actual, nueva })
      setMsg({ tipo: 'ok', texto: data.message })
      setActual(''); setNueva('')
    } catch (err) {
      setMsg({ tipo: 'err', texto: err.response?.data?.message || 'No se pudo cambiar la contraseña.' })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        {/* Encabezado */}
        <div className="relative bg-upa-blue px-6 py-5 text-white">
          <button onClick={onClose} className="absolute right-4 top-4 text-white/80 hover:text-white" aria-label="Cerrar"><IconClose /></button>
          <p className="mb-3 font-mono-upa text-[10px] uppercase tracking-[0.2em] text-white/70">Datos del usuario</p>
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-white/15 font-display text-lg font-bold">{iniciales}</span>
            <div>
              <h3 className="font-display text-xl font-extrabold">{perfil?.nombre_completo || 'Cargando…'}</h3>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-white/20 px-2 py-0.5 font-mono-upa text-[10px] font-semibold uppercase tracking-wide">{perfil?.rol || '—'}</span>
                <span className={`flex items-center gap-1 rounded-md px-2 py-0.5 font-mono-upa text-[10px] font-semibold uppercase tracking-wide ${activo ? 'bg-green-400/25 text-green-50' : 'bg-red-400/25 text-red-50'}`}>
                  <IconStatus /> {perfil?.estado || '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Datos */}
        <div className="px-6 py-5">
          {cargando ? (
            <p className="text-sm text-slate-400">Cargando datos…</p>
          ) : modoEdit ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <CampoEdit label="Nombre" value={edit.nombre} onChange={(v) => setEdit({ ...edit, nombre: v })} />
              <CampoEdit label="Apellido" value={edit.apellido} onChange={(v) => setEdit({ ...edit, apellido: v })} />
              <CampoEdit label="Teléfono" value={edit.telefono} onChange={(v) => setEdit({ ...edit, telefono: v })} />
              <div className="flex items-end">
                <p className="font-mono-upa text-[11px] text-slate-400">UP/ID, correo, rol y estatus no son editables.</p>
              </div>
              {msgEdit && <div className={`sm:col-span-2 rounded-lg border px-3 py-2 text-sm ${msgEdit.tipo === 'ok' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>{msgEdit.texto}</div>}
              <div className="sm:col-span-2 flex gap-2">
                <button onClick={() => setModoEdit(false)} className="flex-1 rounded-lg border border-[#CBD5E1] py-2 font-display text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancelar</button>
                <button onClick={guardarPerfil} disabled={guardandoEdit} className="flex-1 rounded-lg bg-upa-blue py-2 font-display text-sm font-semibold text-white hover:bg-upa-hover disabled:opacity-60">{guardandoEdit ? 'Guardando…' : 'Guardar cambios'}</button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Campo icono={<IconId />} label="UP / Matrícula / ID" valor={perfil?.identificador} />
              <Campo icono={<IconMail />} label="Correo institucional" valor={perfil?.email} />
              <Campo icono={<IconRole />} label="Tipo de usuario" valor={perfil?.rol} />
              <Campo icono={<IconStatus />} label="Estatus" valor={perfil?.estado} />
              <Campo icono={<IconRole />} label="Nombre completo" valor={perfil?.nombre_completo} />
              <Campo icono={<IconId />} label="Teléfono" valor={perfil?.telefono} />
              {msgEdit && msgEdit.tipo === 'ok' && <div className="sm:col-span-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{msgEdit.texto}</div>}
            </div>
          )}

          {/* Cambiar contraseña */}
          <div className="mt-5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <div className="flex items-center justify-between">
              <p className="font-display text-sm font-bold text-[#0F172A]">Contraseña</p>
              {!modoPass && (
                <button onClick={() => { setModoPass(true); setMsg(null) }} className="font-display text-sm font-semibold text-upa-blue hover:text-upa-hover">Cambiar contraseña</button>
              )}
            </div>

            {!modoPass ? (
              <p className="mt-1 font-mono-upa text-xs text-slate-400">•••••••• (por seguridad no se puede mostrar la contraseña guardada)</p>
            ) : (
              <div className="mt-3 space-y-3">
                <CampoPass label="Contraseña actual" value={actual} onChange={setActual} ver={verActual} setVer={setVerActual} />
                <CampoPass label="Nueva contraseña (mín. 8)" value={nueva} onChange={setNueva} ver={verNueva} setVer={setVerNueva} />
                {msg && (
                  <div className={`rounded-lg border px-3 py-2 text-sm ${msg.tipo === 'ok' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>{msg.texto}</div>
                )}
                <div className="flex gap-2">
                  <button onClick={() => { setModoPass(false); setMsg(null); setActual(''); setNueva('') }} className="flex-1 rounded-lg border border-[#CBD5E1] py-2 font-display text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancelar</button>
                  <button onClick={guardarPassword} disabled={guardando} className="flex-1 rounded-lg bg-upa-blue py-2 font-display text-sm font-semibold text-white hover:bg-upa-hover disabled:opacity-60">{guardando ? 'Guardando…' : 'Guardar'}</button>
                </div>
              </div>
            )}
            {!modoPass && msg && msg.tipo === 'ok' && (
              <div className="mt-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{msg.texto}</div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-[#E2E8F0] px-6 py-4">
          <button onClick={onClose} className="flex-1 rounded-lg border border-[#CBD5E1] py-2.5 font-display text-sm font-semibold text-slate-600 hover:bg-slate-50">Cerrar</button>
          {!modoEdit && (
            <button onClick={abrirEdicion} className="flex-1 rounded-lg bg-upa-blue py-2.5 font-display text-sm font-semibold text-white hover:bg-upa-hover">Editar perfil</button>
          )}
        </div>
      </div>
    </div>
  )
}

function CampoEdit({ label, value, onChange }) {
  return (
    <div>
      <label className="mb-1 block font-mono-upa text-[10px] uppercase tracking-wide text-slate-500">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-sm outline-none focus:border-upa-blue focus:ring-2 focus:ring-upa-blue/15" />
    </div>
  )
}

function CampoPass({ label, value, onChange, ver, setVer }) {
  return (
    <div>
      <label className="mb-1 block font-mono-upa text-[10px] uppercase tracking-wide text-slate-500">{label}</label>
      <div className="relative">
        <input type={ver ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 pr-10 text-sm outline-none focus:border-upa-blue focus:ring-2 focus:ring-upa-blue/15" />
        <button type="button" onClick={() => setVer(!ver)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-upa-blue" aria-label="Ver/ocultar">
          <IconEye open={ver} />
        </button>
      </div>
    </div>
  )
}
