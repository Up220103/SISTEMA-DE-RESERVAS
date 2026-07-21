import { useState } from 'react'

import PageHeading from '../../components/ui/PageHeading.jsx'
import { anio, mes, nombreMes, diasSemana, horas, eventosPorDia } from '../../features/calendario/calendarData.js'

const fmt = (h) => `${h}:00`

// Estructura del mes: cuántos días tiene y con cuántos huecos empieza (lunes primero).
const diasEnMes = new Date(anio, mes + 1, 0).getDate()
const huecosInicio = (new Date(anio, mes, 1).getDay() + 6) % 7 // 0=Lun ... 6=Dom

export default function CalendarioPage() {
  const [diaSel, setDiaSel] = useState(21)     // día del mes seleccionado
  const [slotSel, setSlotSel] = useState(null) // hora seleccionada dentro del día

  const eventosDia = eventosPorDia[diaSel] || []
  const eventoEn = (hora) => eventosDia.find((e) => e.hora === hora)

  const celdas = [
    ...Array(huecosInicio).fill(null),
    ...Array.from({ length: diasEnMes }, (_, i) => i + 1),
  ]

  const seleccionarDia = (d) => {
    setDiaSel(d)
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
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="font-mono text-[11px] tracking-widest text-slate-400">CALENDARIO MENSUAL</p>
              <h2 className="text-lg font-bold text-slate-900">{nombreMes}</h2>
            </div>
            <span className="flex items-center gap-2 text-xs text-slate-500">
              <span className="h-2 w-2 rounded-full bg-brand" />
              Con reservas
            </span>
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
              const conEventos = (eventosPorDia[d] || []).length > 0
              const activo = d === diaSel
              return (
                <button
                  key={d}
                  onClick={() => seleccionarDia(d)}
                  className={`relative flex h-14 flex-col items-center justify-center rounded-lg border text-sm font-semibold transition ${
                    activo
                      ? 'border-brand bg-brand text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-brand/40 hover:bg-slate-50'
                  }`}
                >
                  {d}
                  {conEventos && (
                    <span
                      className={`absolute bottom-1.5 h-1.5 w-1.5 rounded-full ${
                        activo ? 'bg-white' : 'bg-brand'
                      }`}
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
          <h2 className="mb-4 text-lg font-bold text-slate-900">
            {diaSel} de {nombreMes.split(' ')[0]}
          </h2>

          <div className="max-h-[460px] space-y-2 overflow-y-auto pr-1">
            {horas.map((h) => {
              const ev = eventoEn(h)
              const sel = slotSel === h

              if (ev) {
                return (
                  <div
                    key={h}
                    className="flex items-center gap-3 rounded-lg bg-ink px-4 py-3 text-white"
                  >
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
                  <span className={`font-mono text-xs ${sel ? 'text-white/70' : 'text-slate-400'}`}>
                    {fmt(h)}
                  </span>
                  <span className={`text-sm font-medium ${sel ? 'text-white' : 'text-slate-500'}`}>
                    {sel ? 'Seleccionado' : 'Disponible'}
                  </span>
                </button>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
