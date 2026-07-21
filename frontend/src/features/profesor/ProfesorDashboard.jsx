import { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { logout } from '../auth/authSlice.js'
import logoUpa from '../../assets/upa-logo.webp'

// --- Tipos de espacio que puede reservar un docente (todos) ----------------
// Auditorio y Laboratorio despliegan una lista de espacios agrupada por edificio.
const ESPACIOS = [
  { id: 'cubiculo', nombre: 'Cubículo', desc: 'Espacio individual de estudio', cap: 'Cap. 1 persona', icono: 'cube' },
  { id: 'auditorio', nombre: 'Auditorio', desc: 'Para conferencias y eventos', cap: 'Cap. 120 personas', icono: 'mic' },
  { id: 'laboratorio', nombre: 'Laboratorio', desc: 'Cómputo y prácticas', cap: 'Cap. 30 personas', icono: 'flask' },
  { id: 'sala', nombre: 'Sala de Reuniones', desc: 'Reuniones de equipo', cap: 'Cap. 12 personas', icono: 'users' },
]

// Espacios de muestra (solo front) agrupados por edificio.
const LISTAS = {
  auditorio: {
    'Edificio A': ['Auditorio Principal', 'Auditorio B'],
    'Edificio 5 · Biblioteca': ['Auditorio Central'],
  },
  laboratorio: {
    'Edificio A': ['Lab 1', 'Lab 2', 'Lab 3'],
    'Edificio B': ['Lab 3', 'Lab 4', 'Lab 5'],
  },
}

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

// --- Calendario mensual: matriz de semanas (inicia en lunes) ---------------
function matrizMes(anio, mes) {
  const primero = new Date(anio, mes, 1)
  // offset para que la semana empiece en lunes (getDay: 0=domingo)
  const offset = (primero.getDay() + 6) % 7
  const inicio = new Date(anio, mes, 1 - offset)
  const semanas = []
  let cursor = new Date(inicio)
  for (let s = 0; s < 6; s++) {
    const semana = []
    for (let d = 0; d < 7; d++) {
      semana.push(new Date(cursor))
      cursor.setDate(cursor.getDate() + 1)
    }
    semanas.push(semana)
    // Si ya cubrimos todo el mes, no agregamos semanas de mas.
    if (cursor.getMonth() !== mes && cursor > new Date(anio, mes + 1, 1)) break
  }
  return semanas
}
const mismaFecha = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

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
const ICONOS_ESPACIO = {
  cube: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" /><path d="M9 4v16" />
    </svg>
  ),
  mic: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0 M12 18v3" />
    </svg>
  ),
  flask: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3h6 M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3 M7 15h10" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0 M16 5a3 3 0 0 1 0 6 M21 20a6 6 0 0 0-4-5.6" />
    </svg>
  ),
}

function Paso({ n, titulo, sub, activo }) {
  return (
    <div className="flex flex-1 items-center gap-3 px-4 py-3">
      <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full font-mono-upa text-xs font-semibold ${activo ? 'bg-white text-upa-blue' : 'bg-slate-200 text-slate-500'}`}>
        {n}
      </span>
      <div className="leading-tight">
        <p className={`font-display text-sm font-bold ${activo ? 'text-white' : 'text-[#0F172A]'}`}>{titulo}</p>
        <p className={`text-xs ${activo ? 'text-white/70' : 'text-slate-500'}`}>{sub}</p>
      </div>
    </div>
  )
}

export default function ProfesorDashboard() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth.user)

  const [espacio, setEspacio] = useState('cubiculo')
  const [espacioElegido, setEspacioElegido] = useState(null) // item de la lista (auditorio/lab)
  const [refFecha, setRefFecha] = useState(() => new Date())
  const [diaSel, setDiaSel] = useState(null)

  const anio = refFecha.getFullYear()
  const mes = refFecha.getMonth()
  const semanas = useMemo(() => matrizMes(anio, mes), [anio, mes])
  const hoy = new Date()

  const nombre = user?.nombre || 'Docente'
  const apellido = user?.apellido || ''
  const email = user?.email || 'docente@upa.edu.mx'
  const iniciales = `${nombre[0] || 'D'}${apellido[0] || ''}`.toUpperCase()

  const lista = LISTAS[espacio] // undefined para cubiculo / sala

  const cambiarMes = (delta) => {
    setRefFecha(new Date(anio, mes + delta, 1))
    setDiaSel(null)
  }
  const irHoy = () => {
    setRefFecha(new Date())
    setDiaSel(null)
  }
  const elegirEspacio = (id) => {
    setEspacio(id)
    setEspacioElegido(null)
  }
  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] text-[#0F172A]">
      {/* ===== Barra superior ===== */}
      <header className="sticky top-0 z-10 border-b border-[#E2E8F0] bg-white">
        <div className="flex items-center gap-4 px-6 py-3">
          <div className="flex items-center gap-3">
            <img src={logoUpa} alt="UPA" className="h-9 w-auto" />
            <span className="hidden font-mono-upa text-[10px] uppercase tracking-[0.14em] text-slate-500 sm:block">
              Universidad Politécnica
            </span>
          </div>

          <span className="ml-2 hidden items-center gap-2 rounded-full bg-upa-light px-3 py-1 font-mono-upa text-[10px] font-semibold uppercase tracking-[0.14em] text-upa-blue md:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-upa-blue" />
            Panel · Docente
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
              <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-upa-blue font-mono-upa text-[9px] font-semibold text-white">2</span>
            </button>
          </div>
        </div>
      </header>

      {/* ===== Cuerpo ===== */}
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-8 lg:flex-row">
        <main className="min-w-0 flex-1">
          <p className="font-mono-upa text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Docente</p>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-[#0F172A]">Nueva reserva</h1>
          <p className="mt-1 text-[15px] text-[#475569]">
            Selecciona qué reservar, el espacio y un día del mes.
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

          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[340px_1fr]">
            {/* Paso 1: tipos de espacio */}
            <section>
              <p className="font-mono-upa text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">Paso 1 de 3</p>
              <h2 className="mb-1 font-display text-xl font-bold text-[#0F172A]">¿Qué deseas reservar?</h2>
              <p className="mb-4 text-sm text-[#475569]">Selecciona el tipo de espacio que necesitas.</p>

              <div className="grid grid-cols-2 gap-3">
                {ESPACIOS.map((e) => {
                  const activo = espacio === e.id
                  return (
                    <button
                      key={e.id}
                      onClick={() => elegirEspacio(e.id)}
                      className={`relative flex flex-col gap-2 rounded-xl border p-3 text-left transition ${
                        activo ? 'border-upa-blue bg-upa-light/60 ring-1 ring-upa-blue' : 'border-[#E2E8F0] bg-white hover:border-upa-blue/50'
                      }`}
                    >
                      <span className={`grid h-9 w-9 place-items-center rounded-lg ${activo ? 'bg-upa-blue text-white' : 'bg-slate-100 text-slate-500'}`}>
                        {ICONOS_ESPACIO[e.icono]}
                      </span>
                      <span className="font-display text-sm font-bold text-[#0F172A]">{e.nombre}</span>
                      <span className="text-xs text-[#475569]">{e.desc}</span>
                      <span className="font-mono-upa text-[10px] uppercase tracking-wide text-slate-500">{e.cap}</span>
                      {activo && (
                        <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-upa-blue text-white">
                          <IconCheck />
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Lista de espacios por edificio (auditorio / laboratorio) */}
              {lista && (
                <div className="mt-4 rounded-xl border border-[#E2E8F0] bg-white p-4">
                  <p className="mb-3 font-mono-upa text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                    Selecciona un espacio
                  </p>
                  <div className="space-y-4">
                    {Object.entries(lista).map(([edificio, items]) => (
                      <div key={edificio}>
                        <p className="mb-2 font-mono-upa text-[11px] font-semibold uppercase tracking-wide text-upa-blue">
                          {edificio}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {items.map((nombreEsp) => {
                            const clave = `${edificio}·${nombreEsp}`
                            const sel = espacioElegido === clave
                            return (
                              <button
                                key={clave}
                                onClick={() => setEspacioElegido(sel ? null : clave)}
                                className={`rounded-lg border px-3 py-1.5 font-display text-sm font-semibold transition ${
                                  sel ? 'border-upa-blue bg-upa-blue text-white' : 'border-[#E2E8F0] text-slate-600 hover:border-upa-blue hover:text-upa-blue'
                                }`}
                              >
                                {nombreEsp}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Calendario mensual */}
            <section className="rounded-xl border border-[#E2E8F0] bg-white p-4 sm:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg font-bold text-[#0F172A]">Calendario mensual</h3>
                  <p className="font-mono-upa text-[11px] uppercase tracking-[0.14em] text-slate-500">
                    {MESES[mes]} {anio}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <BtnNav dir="left" onClick={() => cambiarMes(-1)} />
                  <button onClick={irHoy} className="rounded-lg border border-[#E2E8F0] px-3 py-1.5 font-display text-xs font-semibold text-slate-600 transition hover:border-upa-blue hover:text-upa-blue">
                    Hoy
                  </button>
                  <BtnNav dir="right" onClick={() => cambiarMes(1)} />
                </div>
              </div>

              {/* Cabecera dias de la semana */}
              <div className="grid grid-cols-7 gap-1">
                {DIAS_SEMANA.map((d) => (
                  <div key={d} className="pb-1 text-center font-mono-upa text-[10px] uppercase tracking-wide text-slate-400">
                    {d}
                  </div>
                ))}
              </div>

              {/* Rejilla del mes (vacia) */}
              <div className="grid grid-cols-7 gap-1">
                {semanas.flat().map((fecha, i) => {
                  const delMes = fecha.getMonth() === mes
                  const esHoy = mismaFecha(fecha, hoy)
                  const sel = diaSel && mismaFecha(fecha, diaSel)
                  const finde = fecha.getDay() === 0 || fecha.getDay() === 6
                  return (
                    <button
                      key={i}
                      onClick={() => setDiaSel(sel ? null : new Date(fecha))}
                      className={`flex h-16 flex-col items-start rounded-lg border p-1.5 text-left transition ${
                        sel
                          ? 'border-upa-blue bg-upa-blue text-white'
                          : delMes
                            ? `border-[#E2E8F0] bg-white hover:border-upa-blue hover:bg-upa-light/40 ${finde ? 'text-slate-400' : 'text-[#0F172A]'}`
                            : 'border-transparent bg-slate-50 text-slate-300'
                      }`}
                    >
                      <span className={`font-display text-sm font-bold ${esHoy && !sel ? 'grid h-6 w-6 place-items-center rounded-full bg-upa-blue text-white' : ''}`}>
                        {fecha.getDate()}
                      </span>
                    </button>
                  )
                })}
              </div>

              <p className="mt-3 font-mono-upa text-[11px] text-slate-400">
                Reservas de lunes a viernes, 7:00 a 20:00 h. Selecciona un día para ver los horarios.
              </p>
            </section>
          </div>
        </main>

        {/* ===== Sidebar derecho ===== */}
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
            <button className="mt-3 w-full rounded-lg border border-[#E2E8F0] py-2 font-display text-sm font-semibold text-slate-600 transition hover:border-upa-blue hover:text-upa-blue">
              Ver datos del usuario
            </button>
          </div>

          <nav className="mt-5">
            <p className="mb-2 font-mono-upa text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">Navegación</p>
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

          <button onClick={handleLogout} className="mt-5 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 font-display text-sm font-semibold text-[#475569] transition hover:bg-red-50 hover:text-red-600">
            <IconLogout /> Cerrar sesión
          </button>
        </aside>
      </div>

      {/* ===== Footer ===== */}
      <footer className="border-t border-[#E2E8F0] bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 px-6 py-5 text-center sm:flex-row sm:text-left">
          <p className="font-mono-upa text-[11px] uppercase tracking-[0.14em] text-slate-400">Sistema de Reservas UPA</p>
          <p className="text-sm text-slate-400">© {new Date().getFullYear()} Universidad Politécnica de Aguascalientes</p>
        </div>
      </footer>
    </div>
  )
}

function BtnNav({ dir, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label={dir === 'left' ? 'Mes anterior' : 'Mes siguiente'}
      className="grid h-8 w-8 place-items-center rounded-lg border border-[#E2E8F0] text-slate-600 transition hover:border-upa-blue hover:text-upa-blue"
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {dir === 'left' ? <path d="M15 6l-6 6 6 6" /> : <path d="M9 6l6 6-6 6" />}
      </svg>
    </button>
  )
}
