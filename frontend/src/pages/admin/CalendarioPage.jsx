import { useMemo, useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import PageHeading from '../../components/ui/PageHeading.jsx'
import Icon from '../../components/ui/Icon.jsx'
import { diasSemana, isoDe, esFinDeSemana } from '../../features/calendario/calendarData.js'
import { fetchReservasMes, selectReservasMes } from '../../features/calendario/calendarioSlice.js'

const inicioDeMes = (d) => new Date(d.getFullYear(), d.getMonth(), 1)
const capitalizar = (s) => s.charAt(0).toUpperCase() + s.slice(1)

const estadoBadge = {
  pendiente: { chip: 'bg-amber-100 text-amber-700', label: 'Pendiente' },
  aprobada: { chip: 'bg-green-100 text-green-700', label: 'Aprobada' },
  rechazada: { chip: 'bg-red-100 text-red-600', label: 'Rechazada' },
}

export default function CalendarioPage() {
  const dispatch = useDispatch()
  const reservas = useSelector(selectReservasMes)

  const hoy = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const [mesVista, setMesVista] = useState(() => inicioDeMes(hoy))
  const [diaSel, setDiaSel] = useState(() => new Date(hoy))

  const anio = mesVista.getFullYear()
  const mes = mesVista.getMonth() // 0-11

  // Carga las reservas del mes en vista.
  useEffect(() => {
    dispatch(fetchReservasMes({ anio, mes: mes + 1 }))
  }, [dispatch, anio, mes])

  // Agrupa reservas por día (ISO) y cuenta las pendientes.
  const porDia = useMemo(() => {
    const map = {}
    for (const r of reservas) {
      if (!map[r.fecha]) map[r.fecha] = []
      map[r.fecha].push(r)
    }
    return map
  }, [reservas])

  const pendientesDe = (iso) => (porDia[iso] || []).filter((r) => r.estado === 'pendiente').length

  const diasEnMes = new Date(anio, mes + 1, 0).getDate()
  const huecosInicio = (new Date(anio, mes, 1).getDay() + 6) % 7 // 0=Lun ... 6=Dom

  const nombreMes = capitalizar(mesVista.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }))
  const tituloDiaSel = diaSel
    ? capitalizar(diaSel.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }))
    : ''

  const celdas = [
    ...Array(huecosInicio).fill(null),
    ...Array.from({ length: diasEnMes }, (_, i) => i + 1),
  ]

  const mismaFecha = (a, b) =>
    a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

  const fechaDe = (dia) => new Date(anio, mes, dia)
  const reservasDiaSel = diaSel ? (porDia[isoDe(diaSel)] || []) : []
  const totalPendientesMes = reservas.filter((r) => r.estado === 'pendiente').length

  const cambiarMes = (delta) => setMesVista(new Date(anio, mes + delta, 1))
  const irHoy = () => {
    setMesVista(inicioDeMes(hoy))
    setDiaSel(new Date(hoy))
  }

  return (
    <div>
      <PageHeading
        title="Calendario de reservas"
        subtitle="Reservas de cubículos por día. El número rojo indica cuántas están por confirmar."
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Calendario mensual */}
        <section className="rounded-2xl border border-slate-200 p-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] tracking-widest text-slate-400">CALENDARIO MENSUAL</p>
              <h2 className="text-lg font-bold text-slate-900">{nombreMes}</h2>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => cambiarMes(-1)} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50" aria-label="Mes anterior">‹</button>
              <button onClick={irHoy} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Hoy</button>
              <button onClick={() => cambiarMes(1)} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50" aria-label="Mes siguiente">›</button>
            </div>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-2">
            {diasSemana.map((d) => (
              <div key={d} className="text-center font-mono text-[10px] tracking-widest text-slate-400">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {celdas.map((d, i) => {
              if (d === null) return <div key={`x${i}`} />
              const fecha = fechaDe(d)
              const finde = esFinDeSemana(fecha)

              if (finde) {
                return (
                  <div key={d} title="Fin de semana" className="flex h-14 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 text-sm font-medium text-slate-300">
                    {d}
                  </div>
                )
              }

              const iso = isoDe(fecha)
              const pend = pendientesDe(iso)
              const activo = mismaFecha(fecha, diaSel)
              const esHoy = mismaFecha(fecha, hoy)
              return (
                <button
                  key={d}
                  onClick={() => setDiaSel(fecha)}
                  className={`relative flex h-14 flex-col items-center justify-center rounded-lg border text-sm font-semibold transition ${
                    activo
                      ? 'border-brand bg-brand text-white'
                      : esHoy
                        ? 'border-brand/50 bg-brand/5 text-slate-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-brand/40 hover:bg-slate-50'
                  }`}
                >
                  {d}
                  {pend > 0 && (
                    <span
                      className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
                      title={`${pend} por confirmar`}
                    >
                      {pend}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <p className="mt-5 flex items-center gap-2 text-xs text-slate-400">
            <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">n</span>
            Reservas por confirmar ese día · {totalPendientesMes} pendientes este mes
          </p>
        </section>

        {/* Reservas del día seleccionado */}
        <section className="rounded-2xl border border-slate-200 p-6">
          <p className="font-mono text-[11px] tracking-widest text-slate-400">RESERVAS DEL DÍA</p>
          <h2 className="mb-4 text-lg font-bold text-slate-900">{tituloDiaSel}</h2>

          {diaSel && esFinDeSemana(diaSel) ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
              <Icon name="info" className="h-8 w-8 text-slate-300" />
              <p className="text-sm font-medium text-slate-500">No se agendan citas en fin de semana</p>
            </div>
          ) : reservasDiaSel.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 py-12 text-center text-sm text-slate-400">
              Sin reservas este día.
            </p>
          ) : (
            <ul className="space-y-2">
              {reservasDiaSel.map((r) => {
                const b = estadoBadge[r.estado] || estadoBadge.pendiente
                return (
                  <li key={r.id} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
                    <span className="font-mono text-xs text-slate-400">{r.hora}</span>
                    <div className="min-w-0 flex-1 leading-tight">
                      <p className="truncate text-sm font-bold text-slate-900">{r.cubiculo}</p>
                      <p className="truncate text-xs text-slate-500">{r.solicitante}</p>
                    </div>
                    <span className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-bold ${b.chip}`}>{b.label}</span>
                  </li>
                )
              })}
            </ul>
          )}

          {reservasDiaSel.some((r) => r.estado === 'pendiente') && (
            <p className="mt-4 flex items-center gap-2 text-xs text-slate-400">
              <Icon name="info" className="h-4 w-4" />
              Apruébalas o recházalas en la pestaña Aprobaciones.
            </p>
          )}
        </section>
      </div>
    </div>
  )
}
