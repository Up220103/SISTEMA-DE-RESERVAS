import { useMemo, useState } from 'react'

import PageHeading from '../../components/ui/PageHeading.jsx'
import Icon from '../../components/ui/Icon.jsx'
import { diasSemana, horas, construirEventos, isoDe, esFinDeSemana } from '../../features/calendario/calendarData.js'

const fmt = (h) => `${h}:00`
const inicioDeMes = (d) => new Date(d.getFullYear(), d.getMonth(), 1)
const capitalizar = (s) => s.charAt(0).toUpperCase() + s.slice(1)

function LegendChip({ color, label }) {
  return (
    <span className="flex items-center gap-2 text-xs text-slate-500">
      <span className={`h-3 w-3 rounded-sm border ${color}`} />
      {label}
    </span>
  )
}

export default function CalendarioPage() {
  // "Hoy" fijo al montar (medianoche local).
  const hoy = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const eventos = useMemo(() => construirEventos(hoy), [hoy])

  const [mesVista, setMesVista] = useState(() => inicioDeMes(hoy))
  const [diaSel, setDiaSel] = useState(() => new Date(hoy))
  const [slotSel, setSlotSel] = useState(null)

  const anio = mesVista.getFullYear()
  const mes = mesVista.getMonth()
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
  const eventosDe = (fecha) => eventos[isoDe(fecha)] || []

  const eventosDiaSel = diaSel ? eventosDe(diaSel) : []
  const eventoEn = (hora) => eventosDiaSel.find((e) => e.hora === hora)

  const cambiarMes = (delta) => setMesVista(new Date(anio, mes + delta, 1))
  const irHoy = () => {
    setMesVista(inicioDeMes(hoy))
    setDiaSel(new Date(hoy))
    setSlotSel(null)
  }
  const seleccionarDia = (dia) => {
    setDiaSel(fechaDe(dia))
    setSlotSel(null)
  }

  return (
    <div>
      <PageHeading
        title="Nueva reserva"
        subtitle="Selecciona un día del mes y luego un horario disponible entre 8:00 AM y 8:00 PM."
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
              <button
                onClick={() => cambiarMes(-1)}
                className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                aria-label="Mes anterior"
              >
                ‹
              </button>
              <button
                onClick={irHoy}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Hoy
              </button>
              <button
                onClick={() => cambiarMes(1)}
                className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                aria-label="Mes siguiente"
              >
                ›
              </button>
            </div>
          </div>

          {/* Encabezado de días */}
          <div className="mb-2 grid grid-cols-7 gap-2">
            {diasSemana.map((d) => (
              <div key={d} className="text-center font-mono text-[10px] tracking-widest text-slate-400">
                {d}
              </div>
            ))}
          </div>

          {/* Rejilla de días */}
          <div className="grid grid-cols-7 gap-2">
            {celdas.map((d, i) => {
              if (d === null) return <div key={`x${i}`} />
              const fecha = fechaDe(d)
              const finde = esFinDeSemana(fecha)

              // Fin de semana: no se agenda, celda deshabilitada.
              if (finde) {
                return (
                  <div
                    key={d}
                    title="No se agendan citas en fin de semana"
                    className="flex h-14 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 text-sm font-medium text-slate-300"
                  >
                    {d}
                  </div>
                )
              }

              const conEventos = eventosDe(fecha).length > 0
              const activo = mismaFecha(fecha, diaSel)
              const esHoy = mismaFecha(fecha, hoy)
              return (
                <button
                  key={d}
                  onClick={() => seleccionarDia(d)}
                  className={`relative flex h-14 flex-col items-center justify-center rounded-lg border text-sm font-semibold transition ${
                    activo
                      ? 'border-brand bg-brand text-white'
                      : esHoy
                        ? 'border-brand/50 bg-brand/5 text-slate-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-brand/40 hover:bg-slate-50'
                  }`}
                >
                  {d}
                  {conEventos && (
                    <span
                      className={`absolute bottom-1.5 h-1.5 w-1.5 rounded-full ${activo ? 'bg-white' : 'bg-brand'}`}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </section>

        {/* Horarios del día seleccionado */}
        <section className="rounded-2xl border border-slate-200 p-6">
          <p className="font-mono text-[11px] tracking-widest text-slate-400">HORARIOS DEL DÍA</p>
          <h2 className="mb-4 text-lg font-bold text-slate-900">{tituloDiaSel}</h2>

          {diaSel && esFinDeSemana(diaSel) ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
              <Icon name="info" className="h-8 w-8 text-slate-300" />
              <p className="text-sm font-medium text-slate-500">No se agendan citas en fin de semana</p>
              <p className="text-xs text-slate-400">Selecciona un día de lunes a viernes.</p>
            </div>
          ) : (
          <>
          <div className="max-h-[460px] space-y-2 overflow-y-auto pr-1">
            {horas.map((h) => {
              const ev = eventoEn(h)
              const sel = slotSel === h

              if (ev) {
                return (
                  <div key={h} className="flex items-center gap-3 rounded-lg bg-ink px-4 py-3 text-white">
                    <span className="font-mono text-xs text-white/60">{fmt(h)}</span>
                    <div className="leading-tight">
                      <p className="text-sm font-bold">{ev.titulo}</p>
                      <p className="text-xs text-white/70">{ev.detalle}</p>
                    </div>
                  </div>
                )
              }

              return (
                <button
                  key={h}
                  onClick={() => setSlotSel(sel ? null : h)}
                  className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition ${
                    sel
                      ? 'border-brand bg-brand text-white'
                      : 'border-slate-200 bg-slate-50 hover:border-brand/40 hover:bg-white'
                  }`}
                >
                  <span className={`font-mono text-xs ${sel ? 'text-white/70' : 'text-slate-400'}`}>{fmt(h)}</span>
                  <span className={`text-sm font-medium ${sel ? 'text-white' : 'text-slate-500'}`}>
                    {sel ? 'Seleccionado' : 'Disponible'}
                  </span>
                </button>
              )
            })}
          </div>

          <p className="mt-4 flex items-center gap-2 text-xs text-slate-400">
            <Icon name="info" className="h-4 w-4" />
            Los cubículos ocupados aparecen en negro con su reserva.
          </p>
          </>
          )}
        </section>
      </div>
    </div>
  )
}
