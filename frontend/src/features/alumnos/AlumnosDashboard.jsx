import { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { logout } from '../auth/authSlice.js'
import logoUpa from '../../assets/upa-logo.webp'

// --- Configuracion del calendario -----------------------------------------
// Semanal, de lunes a viernes, de 8:00 a 20:00 (8am - 8pm).
const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie']
const HORA_INICIO = 8
const HORA_FIN = 20 // ultima franja mostrada: 19:00 - 20:00
const HORAS = Array.from({ length: HORA_FIN - HORA_INICIO }, (_, i) => HORA_INICIO + i)
const fmtHora = (h) => `${String(h).padStart(2, '0')}:00`

// Tipos de espacio reservables (paso 1). El alumno solo puede reservar cubiculo.
const ESPACIOS = [
  { id: 'cubiculo', nombre: 'Cubículo', desc: 'Espacio individual de estudio', cap: 'Cap. 1 persona' },
]

// Reservas ocupadas (solo front). Clave: `${diaIndex}-${hora}`.
// El calendario inicia vacio; se llenara al conectar con el backend.
const OCUPADOS = {}

// --- Utilidades de fecha ---------------------------------------------------
function lunesDeLaSemana(fecha) {
  const d = new Date(fecha)
  const dia = d.getDay() // 0 = domingo, 1 = lunes ...
  const diff = (dia === 0 ? -6 : 1) - dia
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}
function sumarDias(fecha, n) {
  const d = new Date(fecha)
  d.setDate(d.getDate() + n)
  return d
}
const fmtDiaMes = (d) =>
  d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }).replace('.', '')

// --- Iconos inline ---------------------------------------------------------
const IconGlobe = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" /><path d="M3 12h18 M12 3c2.5 2.5 2.5 15 0 18 M12 3c-2.5 2.5-2.5 15 0 18" />
  </svg>
)
const IconUser = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" /><path d="M4 20a8 8 0 0 1 16 0" />
  </svg>
)
const IconBell = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9 M13.7 21a2 2 0 0 1-3.4 0" />
  </svg>
)
const IconCalendar = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4 M8 2v4 M3 10h18" />
  </svg>
)
const IconBookmark = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
)
const IconLogout = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9" />
  </svg>
)
const IconCheck = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5" />
  </svg>
)
const IconCube = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2" /><path d="M9 4v16" />
  </svg>
)

// --- Componentes pequenos --------------------------------------------------
function Paso({ n, titulo, sub, activo }) {
  return (
    <div className="flex flex-1 items-center gap-3 px-4 py-3">
      <span
        className={`grid h-7 w-7 shrink-0 place-items-center rounded-full font-mono-upa text-xs font-semibold ${
          activo ? 'bg-white text-upa-blue' : 'bg-slate-200 text-slate-500'
        }`}
      >
        {n}
      </span>
      <div className="leading-tight">
        <p className={`font-display text-sm font-bold ${activo ? 'text-white' : 'text-[#0F172A]'}`}>
          {titulo}
        </p>
        <p className={`text-xs ${activo ? 'text-white/70' : 'text-slate-500'}`}>{sub}</p>
      </div>
    </div>
  )
}

export default function AlumnosDashboard() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth.user)

  const [espacio, setEspacio] = useState('cubiculo')
  const [seleccion, setSeleccion] = useState(null) // `${diaIndex}-${hora}`
  const [refFecha, setRefFecha] = useState(() => new Date())

  const lunes = useMemo(() => lunesDeLaSemana(refFecha), [refFecha])
  const fechas = useMemo(() => DIAS.map((_, i) => sumarDias(lunes, i)), [lunes])
  const rangoSemana = `${fmtDiaMes(lunes)} — ${fmtDiaMes(sumarDias(lunes, 4))} ${lunes
    .getFullYear()}`

  const nombre = user?.nombre || 'Alumno'
  const apellido = user?.apellido || ''
  const email = user?.email || 'alumno@upa.edu.mx'
  const iniciales = `${nombre[0] || 'A'}${apellido[0] || ''}`.toUpperCase()

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] text-[#0F172A]">
      {/* ===== Barra superior ===== */}
      <header className="sticky top-0 z-10 border-b border-[#E2E8F0] bg-white">
        <div className="flex items-center gap-4 px-6 py-3">
          {/* Logo UPA (esquina superior izquierda) */}
          <div className="flex items-center gap-3">
            <img src={logoUpa} alt="UPA" className="h-9 w-auto" />
            <span className="hidden font-mono-upa text-[10px] uppercase tracking-[0.14em] text-slate-500 sm:block">
              Universidad Politécnica
            </span>
          </div>

          <span className="ml-2 hidden items-center gap-2 rounded-full bg-upa-light px-3 py-1 font-mono-upa text-[10px] font-semibold uppercase tracking-[0.14em] text-upa-blue md:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-upa-blue" />
            Panel · Estudiante
          </span>

          <div className="ml-auto flex items-center gap-2">
            <button className="grid h-9 w-9 place-items-center rounded-lg border border-[#E2E8F0] text-slate-600 transition hover:border-upa-blue hover:text-upa-blue" aria-label="Idioma">
              <IconGlobe />
            </button>
            <button className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] px-3 py-2 font-display text-sm font-semibold text-slate-600 transition hover:border-upa-blue hover:text-upa-blue">
              <IconUser />
              <span className="hidden sm:inline">Mi perfil</span>
            </button>
            <button className="relative grid h-9 w-9 place-items-center rounded-lg border border-[#E2E8F0] text-slate-600 transition hover:border-upa-blue hover:text-upa-blue" aria-label="Notificaciones">
              <IconBell />
              <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-upa-blue font-mono-upa text-[9px] font-semibold text-white">
                1
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* ===== Cuerpo: contenido + sidebar ===== */}
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-8 lg:flex-row">
        {/* ---- Contenido principal ---- */}
        <main className="min-w-0 flex-1">
          <p className="font-mono-upa text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">
            Estudiante
          </p>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-[#0F172A]">
            Nueva reserva
          </h1>
          <p className="mt-1 text-[15px] text-[#475569]">
            Reserva un espacio en línea siguiendo estos pasos.
          </p>

          {/* Stepper */}
          <div className="mt-6 flex flex-col overflow-hidden rounded-xl border border-[#E2E8F0] bg-white sm:flex-row">
            <div className="flex flex-1 bg-upa-blue">
              <Paso n="1" titulo="Qué reservar" sub="Tipo de espacio" activo />
            </div>
            <div className="flex flex-1 border-t border-[#E2E8F0] sm:border-l sm:border-t-0">
              <Paso n="2" titulo="Edificio" sub="Ubicación y horario" />
            </div>
            <div className="flex flex-1 border-t border-[#E2E8F0] sm:border-l sm:border-t-0">
              <Paso n="3" titulo="Confirmación" sub="Resumen final" />
            </div>
          </div>

          {/* Paso 1 + Calendario */}
          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[300px_1fr]">
            {/* Tipos de espacio */}
            <section>
              <p className="font-mono-upa text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
                Paso 1 de 3
              </p>
              <h2 className="mb-4 font-display text-xl font-bold text-[#0F172A]">
                ¿Qué deseas reservar?
              </h2>
              <p className="mb-4 text-sm text-[#475569]">
                Selecciona el tipo de espacio que necesitas para tu reserva.
              </p>

              <div className="space-y-3">
                {ESPACIOS.map((e) => {
                  const activo = espacio === e.id
                  return (
                    <button
                      key={e.id}
                      onClick={() => setEspacio(e.id)}
                      className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition ${
                        activo
                          ? 'border-upa-blue bg-upa-light/60 ring-1 ring-upa-blue'
                          : 'border-[#E2E8F0] bg-white hover:border-upa-blue/50'
                      }`}
                    >
                      <span
                        className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${
                          activo ? 'bg-upa-blue text-white' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <IconCube />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-display text-base font-bold text-[#0F172A]">
                          {e.nombre}
                        </span>
                        <span className="block text-sm text-[#475569]">{e.desc}</span>
                        <span className="mt-1 block font-mono-upa text-[11px] uppercase tracking-wide text-slate-500">
                          {e.cap}
                        </span>
                      </span>
                      {activo && (
                        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-upa-blue text-white">
                          <IconCheck />
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </section>

            {/* Calendario semanal */}
            <section className="rounded-xl border border-[#E2E8F0] bg-white p-4 sm:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg font-bold text-[#0F172A]">Calendario semanal</h3>
                  <p className="font-mono-upa text-[11px] uppercase tracking-[0.14em] text-slate-500">
                    Semana del {rangoSemana}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {/* Leyenda */}
                  <div className="hidden items-center gap-3 sm:flex">
                    <Leyenda color="border border-[#CBD5E1] bg-white" label="Disponible" />
                    <Leyenda color="bg-[#0F172A]" label="Ocupado" />
                    <Leyenda color="bg-upa-blue" label="Seleccionado" />
                  </div>
                  <div className="flex items-center gap-1">
                    <BtnNav dir="left" onClick={() => setRefFecha(sumarDias(lunes, -7))} />
                    <button
                      onClick={() => setRefFecha(new Date())}
                      className="rounded-lg border border-[#E2E8F0] px-3 py-1.5 font-display text-xs font-semibold text-slate-600 transition hover:border-upa-blue hover:text-upa-blue"
                    >
                      Hoy
                    </button>
                    <BtnNav dir="right" onClick={() => setRefFecha(sumarDias(lunes, 7))} />
                  </div>
                </div>
              </div>

              {/* Rejilla */}
              <div className="overflow-x-auto">
                <div className="min-w-[560px]">
                  {/* Cabecera dias */}
                  <div className="grid grid-cols-[64px_repeat(5,1fr)] border-b border-[#E2E8F0]">
                    <div className="px-2 py-2 font-mono-upa text-[10px] uppercase tracking-wide text-slate-400">
                      Hora
                    </div>
                    {DIAS.map((d, i) => (
                      <div key={d} className="px-2 py-2 text-center">
                        <p className="font-mono-upa text-[10px] uppercase tracking-[0.14em] text-slate-400">
                          {d}
                        </p>
                        <p className="font-display text-sm font-bold text-[#0F172A]">
                          {fechas[i].getDate()}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Filas por hora */}
                  {HORAS.map((h) => (
                    <div
                      key={h}
                      className="grid grid-cols-[64px_repeat(5,1fr)] border-b border-slate-100 last:border-b-0"
                    >
                      <div className="flex items-start justify-end px-2 py-1.5">
                        <span className="font-mono-upa text-[11px] text-slate-400">{fmtHora(h)}</span>
                      </div>
                      {DIAS.map((d, i) => {
                        const key = `${i}-${h}`
                        const ocupado = OCUPADOS[key]
                        const activo = seleccion === key
                        if (ocupado) {
                          return (
                            <div key={key} className="p-1">
                              <div className="flex h-11 flex-col justify-center rounded-md bg-[#0F172A] px-2 py-1 leading-tight">
                                <span className="truncate font-mono-upa text-[9px] uppercase tracking-wide text-white/70">
                                  {ocupado.titulo}
                                </span>
                                {ocupado.sub && (
                                  <span className="truncate font-display text-xs font-semibold text-white">
                                    {ocupado.sub}
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                        }
                        return (
                          <div key={key} className="p-1">
                            <button
                              onClick={() => setSeleccion(activo ? null : key)}
                              title={`${d} ${fmtHora(h)} – ${fmtHora(h + 1)}`}
                              className={`h-11 w-full rounded-md border transition ${
                                activo
                                  ? 'border-upa-blue bg-upa-blue text-white'
                                  : 'border-[#E2E8F0] bg-white hover:border-upa-blue hover:bg-upa-light/50'
                              }`}
                            >
                              {activo && (
                                <span className="font-mono-upa text-[10px] font-semibold uppercase">
                                  Seleccionado
                                </span>
                              )}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>

              <p className="mt-3 font-mono-upa text-[11px] text-slate-400">
                Horario de reservas: lunes a viernes, 8:00 a 20:00 h.
              </p>
            </section>
          </div>
        </main>

        {/* ---- Sidebar derecho ---- */}
        <aside className="w-full shrink-0 lg:w-72">
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
            <p className="mb-3 font-mono-upa text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">
              Sesión activa
            </p>
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-upa-blue font-display text-sm font-bold text-white">
                {iniciales}
              </span>
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-bold text-[#0F172A]">
                  {nombre} {apellido}
                </p>
                <p className="truncate text-xs text-[#475569]">{email}</p>
              </div>
            </div>
            <span className="mt-3 inline-block rounded-md bg-upa-light px-2 py-1 font-mono-upa text-[10px] font-semibold uppercase tracking-wide text-upa-blue">
              Estudiante
            </span>
            <button className="mt-3 w-full rounded-lg border border-[#E2E8F0] py-2 font-display text-sm font-semibold text-slate-600 transition hover:border-upa-blue hover:text-upa-blue">
              Ver datos del usuario
            </button>
          </div>

          <nav className="mt-5">
            <p className="mb-2 font-mono-upa text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">
              Navegación
            </p>
            <ul className="space-y-1">
              <li>
                <button className="flex w-full items-center gap-3 rounded-lg bg-upa-light px-3 py-2.5 font-display text-sm font-semibold text-upa-blue">
                  <IconCalendar /> Calendario
                </button>
              </li>
              <li>
                <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 font-display text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-upa-blue">
                  <IconBookmark /> Mis Reservas
                </button>
              </li>
            </ul>
          </nav>

          <button
            onClick={handleLogout}
            className="mt-5 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 font-display text-sm font-semibold text-[#475569] transition hover:bg-red-50 hover:text-red-600"
          >
            <IconLogout /> Cerrar sesión
          </button>
        </aside>
      </div>

      {/* ===== Footer sencillo ===== */}
      <footer className="border-t border-[#E2E8F0] bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 px-6 py-5 text-center sm:flex-row sm:text-left">
          <p className="font-mono-upa text-[11px] uppercase tracking-[0.14em] text-slate-400">
            Sistema de Reservas UPA
          </p>
          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()} Universidad Politécnica de Aguascalientes
          </p>
        </div>
      </footer>
    </div>
  )
}

// --- Auxiliares de UI ------------------------------------------------------
function Leyenda({ color, label }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-3 w-3 rounded ${color}`} />
      <span className="font-mono-upa text-[10px] uppercase tracking-wide text-slate-500">{label}</span>
    </span>
  )
}

function BtnNav({ dir, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label={dir === 'left' ? 'Semana anterior' : 'Semana siguiente'}
      className="grid h-8 w-8 place-items-center rounded-lg border border-[#E2E8F0] text-slate-600 transition hover:border-upa-blue hover:text-upa-blue"
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {dir === 'left' ? <path d="M15 6l-6 6 6 6" /> : <path d="M9 6l6 6-6 6" />}
      </svg>
    </button>
  )
}
