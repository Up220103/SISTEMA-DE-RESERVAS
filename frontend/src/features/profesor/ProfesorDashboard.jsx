import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { logout } from '../auth/authSlice.js'
import {
  fetchTipos,
  fetchEspacios,
  fetchMisReservas,
  fetchHorasOcupadas,
  fetchNotificaciones,
  leerNotificaciones,
  crearReserva,
} from '../reservas/reservaSlice.js'
import UserProfileModal from '../../components/UserProfileModal.jsx'
import api from '../../services/api.js'
import logoUpa from '../../assets/upa-logo.webp'

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const ICONO_POR_TIPO = { 'Cubículo': 'cube', 'Auditorio': 'mic', 'Laboratorio': 'flask', 'Sala de Reuniones': 'users' }
// Horario de reservas: 8:00 a 20:00 (bloques por hora 8..19).
const HORAS = Array.from({ length: 12 }, (_, i) => 8 + i)

function matrizMes(anio, mes) {
  const primero = new Date(anio, mes, 1)
  const offset = (primero.getDay() + 6) % 7
  const inicio = new Date(anio, mes, 1 - offset)
  const semanas = []
  const cursor = new Date(inicio)
  for (let s = 0; s < 6; s++) {
    const semana = []
    for (let d = 0; d < 7; d++) { semana.push(new Date(cursor)); cursor.setDate(cursor.getDate() + 1) }
    semanas.push(semana)
    if (cursor.getMonth() !== mes && cursor > new Date(anio, mes + 1, 1)) break
  }
  return semanas
}
const mismaFecha = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
const aISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const fmtHora = (h) => `${String(h).padStart(2, '0')}:00`

// --- Iconos ---
const IconGlobe = () => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M3 12h18 M12 3c2.5 2.5 2.5 15 0 18 M12 3c-2.5 2.5-2.5 15 0 18" /></svg>)
const IconUser = () => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 20a8 8 0 0 1 16 0" /></svg>)
const IconBell = () => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9 M13.7 21a2 2 0 0 1-3.4 0" /></svg>)
const IconBookmark = () => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>)
const IconLogout = () => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9" /></svg>)
const IconCheck = () => (<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>)
const IconDoc = () => (<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z M14 3v5h5 M9 13h6 M9 17h6" /></svg>)
const ICONOS_ESPACIO = {
  cube: (<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M9 4v16" /></svg>),
  mic: (<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0 M12 18v3" /></svg>),
  flask: (<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3h6 M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3 M7 15h10" /></svg>),
  users: (<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0 M16 5a3 3 0 0 1 0 6 M21 20a6 6 0 0 0-4-5.6" /></svg>),
}

function Paso({ n, titulo, sub, estado, onClick }) {
  const activo = estado === 'activo'
  const hecho = estado === 'hecho'
  return (
    <button onClick={onClick} disabled={!onClick} className={`flex flex-1 items-center gap-3 px-4 py-3 text-left ${activo ? 'bg-upa-blue' : 'bg-white'} ${onClick ? 'cursor-pointer' : 'cursor-default'}`}>
      <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full font-mono-upa text-xs font-semibold ${activo ? 'bg-white text-upa-blue' : hecho ? 'bg-upa-blue text-white' : 'bg-slate-200 text-slate-500'}`}>
        {hecho ? <IconCheck /> : n}
      </span>
      <div className="leading-tight">
        <p className={`font-display text-sm font-bold ${activo ? 'text-white' : 'text-[#0F172A]'}`}>{titulo}</p>
        <p className={`text-xs ${activo ? 'text-white/70' : 'text-slate-500'}`}>{sub}</p>
      </div>
    </button>
  )
}

export default function ProfesorDashboard() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth.user)
  const { tipos, porEdificio, mias, ocupadas, notificaciones, noLeidas, creando, error } = useSelector((state) => state.reservas)

  const [perfilData, setPerfilData] = useState(null) // datos frescos del backend (nombre correcto)
  const [notiAbierto, setNotiAbierto] = useState(false)
  const [paso, setPaso] = useState(1)
  const [tipoSel, setTipoSel] = useState(null)
  const [espacioSel, setEspacioSel] = useState(null)
  const [refFecha, setRefFecha] = useState(() => new Date())
  const [diaSel, setDiaSel] = useState(null)
  const [horaSlot, setHoraSlot] = useState(null)
  const [titulo, setTitulo] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [folio, setFolio] = useState('')
  const [perfilAbierto, setPerfilAbierto] = useState(false)

  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const anio = refFecha.getFullYear()
  const mes = refFecha.getMonth()
  const semanas = useMemo(() => matrizMes(anio, mes), [anio, mes])

  const tipoObj = tipos.find((t) => t.tipo_id === tipoSel)
  const tipoNombre = tipoObj?.nombre_tipo || ''
  const esCubiculo = tipoNombre === 'Cubículo'

  useEffect(() => {
    dispatch(fetchTipos()); dispatch(fetchMisReservas()); dispatch(fetchNotificaciones())
    // Datos frescos del backend (evita acentos corruptos de una sesión vieja en localStorage).
    api.get('/auth/perfil').then(({ data }) => setPerfilData(data.perfil)).catch(() => {})
  }, [dispatch])
  useEffect(() => { if (tipos.length && tipoSel == null) setTipoSel(tipos[0].tipo_id) }, [tipos, tipoSel])
  useEffect(() => { if (tipoSel != null) { dispatch(fetchEspacios(tipoSel)); setEspacioSel(null) } }, [tipoSel, dispatch])
  // Al elegir día en el paso 2, consulta las horas ocupadas del espacio/tipo.
  useEffect(() => {
    if (paso === 2 && diaSel) {
      setHoraSlot(null)
      dispatch(fetchHorasOcupadas({ fecha: aISO(diaSel), espacioId: espacioSel?.espacio_id, tipoId: esCubiculo ? tipoSel : undefined }))
    }
  }, [paso, diaSel, espacioSel, tipoSel, esCubiculo, dispatch])

  const diasConReserva = useMemo(() => new Set(mias.map((r) => r.fecha_reserva)), [mias])
  const nombre = perfilData?.nombre || user?.nombre || 'Docente'
  const apellido = perfilData?.apellido || user?.apellido || ''
  const email = perfilData?.email || user?.email || 'docente@upa.edu.mx'
  const iniciales = `${nombre[0] || 'D'}${apellido[0] || ''}`.toUpperCase()

  const paso1Listo = tipoSel != null && (esCubiculo || espacioSel)
  const paso2Listo = diaSel && horaSlot != null

  const abrirConfirmacion = () => { setFolio(`R-${Math.floor(1000 + Math.random() * 9000)}`); setModalAbierto(true) }

  const handleReservar = async () => {
    const payload = {
      titulo: titulo.trim() || `Reserva de ${tipoNombre}`,
      fecha: aISO(diaSel),
      hora_inicio: fmtHora(horaSlot),
      hora_fin: fmtHora(horaSlot + 1),
    }
    if (esCubiculo) payload.tipo_id = tipoSel
    else payload.espacio_id = espacioSel.espacio_id
    const res = await dispatch(crearReserva(payload))
    if (crearReserva.fulfilled.match(res)) {
      setModalAbierto(false)
      dispatch(fetchNotificaciones()) // llega la notificación de "pendiente"
      // Reinicia el asistente
      setPaso(1); setEspacioSel(null); setDiaSel(null); setHoraSlot(null); setTitulo('')
    }
  }

  const handleLogout = () => { dispatch(logout()); navigate('/login') }
  const cambiarMes = (delta) => { setRefFecha(new Date(anio, mes + delta, 1)); setDiaSel(null); setHoraSlot(null) }

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] text-[#0F172A]">
      {/* Barra superior */}
      <header className="sticky top-0 z-10 border-b border-[#E2E8F0] bg-white">
        <div className="flex items-center gap-4 px-6 py-3">
          <div className="flex items-center gap-3">
            <img src={logoUpa} alt="UPA" className="h-9 w-auto" />
            <span className="hidden font-mono-upa text-[10px] uppercase tracking-[0.14em] text-slate-500 sm:block">Universidad Politécnica</span>
          </div>
          <span className="ml-2 hidden items-center gap-2 rounded-full bg-upa-light px-3 py-1 font-mono-upa text-[10px] font-semibold uppercase tracking-[0.14em] text-upa-blue md:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-upa-blue" /> Panel · Docente
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button className="grid h-9 w-9 place-items-center rounded-lg border border-[#E2E8F0] text-slate-600 transition hover:border-upa-blue hover:text-upa-blue" aria-label="Idioma"><IconGlobe /></button>
            <button onClick={() => setPerfilAbierto(true)} className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] px-3 py-2 font-display text-sm font-semibold text-slate-600 transition hover:border-upa-blue hover:text-upa-blue"><IconUser /><span className="hidden sm:inline">Mi perfil</span></button>
            <div className="relative">
              <button onClick={() => { const abrir = !notiAbierto; setNotiAbierto(abrir); if (abrir && noLeidas > 0) dispatch(leerNotificaciones()) }}
                className="relative grid h-9 w-9 place-items-center rounded-lg border border-[#E2E8F0] text-slate-600 transition hover:border-upa-blue hover:text-upa-blue" aria-label="Notificaciones">
                <IconBell />
                {noLeidas > 0 && (<span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 font-mono-upa text-[9px] font-bold text-white">{noLeidas}</span>)}
              </button>
              {notiAbierto && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setNotiAbierto(false)} />
                  <div className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-xl">
                    <div className="border-b border-[#E2E8F0] px-4 py-3">
                      <p className="font-display text-sm font-bold text-[#0F172A]">Notificaciones</p>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notificaciones.length === 0 && <p className="px-4 py-6 text-center text-sm text-slate-400">No tienes notificaciones.</p>}
                      {notificaciones.map((n) => (
                        <div key={n.notificacion_id} className={`border-b border-slate-100 px-4 py-3 ${n.leida ? '' : 'bg-upa-light/40'}`}>
                          <p className="font-display text-sm font-bold text-[#0F172A]">{n.titulo}</p>
                          <p className="mt-0.5 text-xs text-[#475569]">{n.mensaje}</p>
                          <p className="mt-1 font-mono-upa text-[10px] text-slate-400">{String(n.fecha_envio).slice(0, 16).replace('T', ' ')}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-8 lg:flex-row">
        <main className="min-w-0 flex-1">
          <p className="font-mono-upa text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Docente</p>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-[#0F172A]">Nueva reserva</h1>
          <p className="mt-1 text-[15px] text-[#475569]">Haz una reserva en tu espacio favorito de trabajo.</p>

          {/* Stepper (permite volver a pasos ya completados) */}
          <div className="mt-6 flex flex-col overflow-hidden rounded-xl border border-[#E2E8F0] bg-white sm:flex-row">
            <Paso n="1" titulo="Qué reservar" sub="Tipo y espacio" estado={paso === 1 ? 'activo' : 'hecho'} onClick={paso > 1 ? () => setPaso(1) : null} />
            <div className="border-t border-[#E2E8F0] sm:border-l sm:border-t-0" />
            <Paso n="2" titulo="Día y horario" sub="Calendario" estado={paso === 2 ? 'activo' : paso > 2 ? 'hecho' : 'pendiente'} onClick={paso > 2 && paso1Listo ? () => setPaso(2) : null} />
            <div className="border-t border-[#E2E8F0] sm:border-l sm:border-t-0" />
            <Paso n="3" titulo="Confirmación" sub="Guardar reserva" estado={paso === 3 ? 'activo' : 'pendiente'} onClick={null} />
          </div>

          {/* ===================== PASO 1 ===================== */}
          {paso === 1 && (
            <section className="mt-6">
              <p className="font-mono-upa text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">Paso 1 de 3</p>
              <h2 className="mb-1 font-display text-xl font-bold text-[#0F172A]">¿Qué deseas reservar?</h2>
              <p className="mb-4 text-sm text-[#475569]">Selecciona el tipo de espacio que necesitas.</p>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {tipos.map((t) => {
                  const activo = tipoSel === t.tipo_id
                  const icono = ICONO_POR_TIPO[t.nombre_tipo] || 'cube'
                  return (
                    <button key={t.tipo_id} onClick={() => setTipoSel(t.tipo_id)}
                      className={`relative flex flex-col gap-2 rounded-xl border p-3 text-left transition ${activo ? 'border-upa-blue bg-upa-light/60 ring-1 ring-upa-blue' : 'border-[#E2E8F0] bg-white hover:border-upa-blue/50'}`}>
                      <span className={`grid h-9 w-9 place-items-center rounded-lg ${activo ? 'bg-upa-blue text-white' : 'bg-slate-100 text-slate-500'}`}>{ICONOS_ESPACIO[icono]}</span>
                      <span className="font-display text-sm font-bold text-[#0F172A]">{t.nombre_tipo}</span>
                      <span className="text-xs text-[#475569]">{t.descripcion}</span>
                      <span className="font-mono-upa text-[10px] uppercase tracking-wide text-slate-500">Cap. {t.capacidad_default}</span>
                      {activo && (<span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-upa-blue text-white"><IconCheck /></span>)}
                    </button>
                  )
                })}
              </div>

              {/* Cubículo: la encargada asigna. Otros: elegir espacio por edificio. */}
              {esCubiculo ? (
                <div className="mt-4 rounded-xl border border-upa-light bg-upa-light/40 p-4">
                  <p className="font-display text-sm font-bold text-upa-blue">Biblioteca · asignación automática</p>
                  <p className="mt-1 text-sm text-[#475569]">No necesitas elegir un cubículo específico: la encargada te asignará uno disponible al confirmar.</p>
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-[#E2E8F0] bg-white p-4">
                  <p className="mb-3 font-mono-upa text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">Selecciona un espacio</p>
                  {Object.keys(porEdificio).length === 0 && <p className="text-sm text-slate-400">No hay espacios para este tipo.</p>}
                  <div className="space-y-4">
                    {Object.entries(porEdificio).map(([edificio, items]) => (
                      <div key={edificio}>
                        <p className="mb-2 font-mono-upa text-[11px] font-semibold uppercase tracking-wide text-upa-blue">{edificio}</p>
                        <div className="flex flex-wrap gap-2">
                          {items.map((e) => {
                            const sel = espacioSel?.espacio_id === e.espacio_id
                            return (
                              <button key={e.espacio_id} onClick={() => setEspacioSel(sel ? null : e)}
                                className={`rounded-lg border px-3 py-1.5 font-display text-sm font-semibold transition ${sel ? 'border-upa-blue bg-upa-blue text-white' : 'border-[#E2E8F0] text-slate-600 hover:border-upa-blue hover:text-upa-blue'}`}>
                                {e.nombre}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-5 flex justify-end">
                <button onClick={() => setPaso(2)} disabled={!paso1Listo}
                  className="rounded-lg bg-upa-blue px-6 py-2.5 font-display text-sm font-semibold text-white transition hover:bg-upa-hover disabled:cursor-not-allowed disabled:opacity-50">
                  Siguiente →
                </button>
              </div>
            </section>
          )}

          {/* ===================== PASO 2 ===================== */}
          {paso === 2 && (
            <section className="mt-6">
              <p className="font-mono-upa text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">Paso 2 de 3</p>
              <h2 className="mb-1 font-display text-xl font-bold text-[#0F172A]">Elige día y horario</h2>
              <p className="mb-4 text-sm text-[#475569]">
                {esCubiculo ? 'Cubículo (Biblioteca)' : `${espacioSel?.nombre} · ${espacioSel?.edificio}`} · selecciona un día disponible y una hora libre.
              </p>

              <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 sm:p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-display text-lg font-bold text-[#0F172A]">{MESES[mes]} {anio}</h3>
                  <div className="flex items-center gap-1">
                    <BtnNav dir="left" onClick={() => cambiarMes(-1)} />
                    <button onClick={() => { setRefFecha(new Date()); setDiaSel(null) }} className="rounded-lg border border-[#E2E8F0] px-3 py-1.5 font-display text-xs font-semibold text-slate-600 transition hover:border-upa-blue hover:text-upa-blue">Hoy</button>
                    <BtnNav dir="right" onClick={() => cambiarMes(1)} />
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {DIAS_SEMANA.map((d) => (<div key={d} className="pb-1 text-center font-mono-upa text-[10px] uppercase tracking-wide text-slate-400">{d}</div>))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {semanas.flat().map((fecha, i) => {
                    const delMes = fecha.getMonth() === mes
                    const finde = fecha.getDay() === 0 || fecha.getDay() === 6
                    const pasado = fecha < hoy
                    const deshabilitado = !delMes || pasado || finde
                    const sel = diaSel && mismaFecha(fecha, diaSel)
                    const tieneReserva = diasConReserva.has(aISO(fecha))
                    return (
                      <button key={i} disabled={deshabilitado} onClick={() => setDiaSel(new Date(fecha))}
                        className={`relative flex h-14 flex-col items-start rounded-lg border p-1.5 text-left transition ${
                          sel ? 'border-upa-blue bg-upa-blue text-white'
                          : deshabilitado ? 'cursor-not-allowed border-transparent bg-slate-50 text-slate-300'
                          : 'border-[#E2E8F0] bg-white text-[#0F172A] hover:border-upa-blue hover:bg-upa-light/40'}`}>
                        <span className="font-display text-sm font-bold">{fecha.getDate()}</span>
                        {tieneReserva && !deshabilitado && (<span className={`absolute bottom-1.5 right-1.5 h-1.5 w-1.5 rounded-full ${sel ? 'bg-white' : 'bg-upa-blue'}`} />)}
                      </button>
                    )
                  })}
                </div>

                {/* Horas del día seleccionado */}
                {diaSel && (
                  <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="font-mono-upa text-[11px] font-semibold uppercase tracking-wide text-slate-500">Horas disponibles · {aISO(diaSel)}</p>
                      <div className="flex items-center gap-3 font-mono-upa text-[10px] uppercase text-slate-400">
                        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded border border-[#CBD5E1] bg-white" /> Libre</span>
                        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-[#0F172A]" /> Ocupado</span>
                        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-upa-blue" /> Elegida</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                      {HORAS.map((h) => {
                        const ocupada = ocupadas.includes(h)
                        const sel = horaSlot === h
                        return (
                          <button key={h} disabled={ocupada} onClick={() => setHoraSlot(sel ? null : h)}
                            className={`rounded-lg border py-2 font-mono-upa text-xs font-semibold transition ${
                              sel ? 'border-upa-blue bg-upa-blue text-white'
                              : ocupada ? 'cursor-not-allowed border-[#0F172A] bg-[#0F172A] text-white/70'
                              : 'border-[#E2E8F0] bg-white text-slate-600 hover:border-upa-blue hover:text-upa-blue'}`}>
                            {fmtHora(h)}–{fmtHora(h + 1)}
                            {ocupada && <span className="block text-[8px] font-normal">Ocupado</span>}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-5 flex items-center justify-between">
                <button onClick={() => setPaso(1)} className="rounded-lg border border-[#CBD5E1] px-5 py-2.5 font-display text-sm font-semibold text-slate-600 hover:bg-slate-50">← Atrás</button>
                <button onClick={() => setPaso(3)} disabled={!paso2Listo}
                  className="rounded-lg bg-upa-blue px-6 py-2.5 font-display text-sm font-semibold text-white transition hover:bg-upa-hover disabled:cursor-not-allowed disabled:opacity-50">Siguiente →</button>
              </div>
            </section>
          )}

          {/* ===================== PASO 3 ===================== */}
          {paso === 3 && (
            <section className="mt-6">
              <p className="font-mono-upa text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">Paso 3 de 3</p>
              <h2 className="mb-1 font-display text-xl font-bold text-[#0F172A]">Confirma tu reserva</h2>
              <p className="mb-4 text-sm text-[#475569]">Revisa los detalles antes de finalizar.</p>

              <div className="max-w-md rounded-2xl border border-[#E2E8F0] bg-white p-5">
                <div className="mb-3">
                  <label className="mb-1 block font-mono-upa text-[10px] uppercase tracking-wide text-slate-500">Motivo / título</label>
                  <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder={`Reserva de ${tipoNombre}`}
                    className="w-full rounded-lg border border-[#CBD5E1] px-3 py-2 text-sm outline-none focus:border-upa-blue focus:ring-2 focus:ring-upa-blue/15" />
                </div>
                <dl className="space-y-2 rounded-xl bg-[#F8FAFC] p-4 text-sm">
                  <Fila k="Solicitante" v={`${nombre} ${apellido}`} />
                  <Fila k="Rol" v={user?.rol || 'Docente'} />
                  <Fila k="Tipo de espacio" v={tipoNombre} />
                  <Fila k="Edificio" v={esCubiculo ? 'Biblioteca' : espacioSel?.edificio} />
                  <Fila k="Espacio" v={esCubiculo ? 'Lo asigna la encargada' : espacioSel?.nombre} />
                  <Fila k="Horario" v={`${aISO(diaSel)} · ${fmtHora(horaSlot)}–${fmtHora(horaSlot + 1)}`} />
                  <Fila k="Capacidad" v={`${esCubiculo ? tipoObj?.capacidad_default : espacioSel?.capacidad} personas`} />
                </dl>

                {error && <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

                <div className="mt-4 flex items-center justify-between gap-3">
                  <button onClick={() => setPaso(2)} className="rounded-lg border border-[#CBD5E1] px-5 py-2.5 font-display text-sm font-semibold text-slate-600 hover:bg-slate-50">← Atrás</button>
                  <button onClick={abrirConfirmacion} className="flex-1 rounded-lg bg-upa-blue py-2.5 font-display text-sm font-semibold text-white transition hover:bg-upa-hover">Aceptar reserva ✓</button>
                </div>
              </div>
            </section>
          )}

          <p className="mt-4 font-mono-upa text-[11px] text-slate-400">Reservas de lunes a viernes, 8:00 a 20:00 h. No se permiten fechas pasadas.</p>
        </main>

        {/* Sidebar */}
        <aside className="w-full shrink-0 lg:w-72">
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
            <p className="mb-3 font-mono-upa text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">Sesión activa</p>
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-upa-blue font-display text-sm font-bold text-white">{iniciales}</span>
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-bold text-[#0F172A]">{nombre} {apellido}</p>
                <p className="truncate text-xs text-[#475569]">{email}</p>
              </div>
            </div>
            <span className="mt-3 inline-block rounded-md bg-[#0F172A] px-2 py-1 font-mono-upa text-[10px] font-semibold uppercase tracking-wide text-white">Docente</span>
          </div>

          <div className="mt-5 rounded-xl border border-[#E2E8F0] bg-white p-4">
            <p className="mb-3 flex items-center gap-2 font-mono-upa text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400"><IconBookmark /> Mis reservas</p>
            {mias.length === 0 && <p className="text-sm text-slate-400">Aún no tienes reservas.</p>}
            <ul className="space-y-2">
              {mias.map((r) => (
                <li key={r.reserva_id} className="rounded-lg border border-[#E2E8F0] p-2.5">
                  <p className="font-display text-sm font-bold text-[#0F172A]">{r.titulo}</p>
                  <p className="text-xs text-[#475569]">{r.espacio} · {r.edificio}</p>
                  <p className="font-mono-upa text-[11px] text-slate-500">{r.fecha_reserva} · {r.hora_inicio?.slice(0, 5)}–{r.hora_fin?.slice(0, 5)}</p>
                  <span className={`mt-1 inline-block rounded px-1.5 py-0.5 font-mono-upa text-[9px] font-semibold uppercase ${r.estado === 'Confirmada' ? 'bg-green-100 text-green-700' : r.estado === 'Cancelada' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{r.estado}</span>
                </li>
              ))}
            </ul>
          </div>

          <button onClick={handleLogout} className="mt-5 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 font-display text-sm font-semibold text-[#475569] transition hover:bg-red-50 hover:text-red-600"><IconLogout /> Cerrar sesión</button>
        </aside>
      </div>

      <UserProfileModal open={perfilAbierto} onClose={() => setPerfilAbierto(false)} />

      {/* Modal: Términos y condiciones + confirmación */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => !creando && setModalAbierto(false)}>
          <div className="max-h-[90vh] w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3 bg-upa-blue px-5 py-4 text-white">
              <span className="mt-0.5"><IconDoc /></span>
              <div>
                <h3 className="font-display text-base font-bold">Términos y condiciones de la reserva</h3>
                <p className="text-xs text-white/80">Lee y acepta antes de finalizar tu solicitud.</p>
              </div>
            </div>
            <div className="max-h-[calc(90vh-160px)] overflow-y-auto px-5 py-4">
              <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-mono-upa text-[10px] uppercase tracking-wide text-slate-400">Folio</span>
                  <span className="rounded bg-upa-blue px-2 py-0.5 font-mono-upa text-[10px] font-semibold uppercase text-white">Borrador</span>
                </div>
                <p className="font-display text-lg font-extrabold text-[#0F172A]">{folio}</p>
                <dl className="mt-2 space-y-1.5 text-sm">
                  <Fila k="Solicitante" v={`${nombre} ${apellido}`} />
                  <Fila k="Rol" v={user?.rol || 'Docente'} />
                  <Fila k="Tipo de espacio" v={tipoNombre} />
                  <Fila k="Edificio" v={esCubiculo ? 'Biblioteca' : espacioSel?.edificio} />
                  <Fila k="Espacio" v={esCubiculo ? 'Lo asigna la encargada' : espacioSel?.nombre} />
                  <Fila k="Horario" v={diaSel ? `${aISO(diaSel)} · ${fmtHora(horaSlot)}–${fmtHora(horaSlot + 1)}` : ''} />
                  <Fila k="Capacidad" v={`${esCubiculo ? tipoObj?.capacidad_default : espacioSel?.capacidad} personas`} />
                </dl>
              </div>
              <ol className="mt-4 list-decimal space-y-2.5 pl-5 text-sm text-[#475569]">
                <li>Llegar puntualmente al espacio reservado. Tienes una tolerancia de <b>10 minutos</b>; pasado ese tiempo, la reserva se libera automáticamente.</li>
                <li>El espacio debe utilizarse únicamente para fines académicos. Está prohibido consumir alimentos o bebidas dentro de los espacios.</li>
                <li>El usuario es responsable del orden y los bienes dentro del espacio durante el periodo reservado.</li>
                <li>Cualquier daño al mobiliario o equipo podrá generar una sanción administrativa según el reglamento UPA.</li>
                <li>Las reservas pueden cancelarse hasta con <b>2 horas de anticipación</b>.</li>
              </ol>
              {error && <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
            </div>
            <div className="flex gap-3 border-t border-[#E2E8F0] px-5 py-4">
              <button onClick={() => setModalAbierto(false)} disabled={creando} className="flex-1 rounded-lg border border-[#CBD5E1] py-2.5 font-display text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50">Cancelar</button>
              <button onClick={handleReservar} disabled={creando} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-upa-blue py-2.5 font-display text-sm font-semibold text-white transition hover:bg-upa-hover disabled:opacity-60">
                {creando ? 'Guardando…' : <><IconCheck /> Aceptar y confirmar</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="border-t border-[#E2E8F0] bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 px-6 py-5 text-center sm:flex-row sm:text-left">
          <p className="font-mono-upa text-[11px] uppercase tracking-[0.14em] text-slate-400">Sistema de Reservas UPA</p>
          <p className="text-sm text-slate-400">© {new Date().getFullYear()} Universidad Politécnica de Aguascalientes</p>
        </div>
      </footer>
    </div>
  )
}

function Fila({ k, v }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="font-mono-upa text-[10px] uppercase tracking-wide text-slate-400">{k}</dt>
      <dd className="truncate text-right font-display text-sm font-semibold text-[#0F172A]">{v || '—'}</dd>
    </div>
  )
}

function BtnNav({ dir, onClick }) {
  return (
    <button onClick={onClick} aria-label={dir === 'left' ? 'Mes anterior' : 'Mes siguiente'}
      className="grid h-8 w-8 place-items-center rounded-lg border border-[#E2E8F0] text-slate-600 transition hover:border-upa-blue hover:text-upa-blue">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{dir === 'left' ? <path d="M15 6l-6 6 6 6" /> : <path d="M9 6l6 6-6 6" />}</svg>
    </button>
  )
}
