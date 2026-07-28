import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import PageHeading from '../../components/ui/PageHeading.jsx'
import Icon from '../../components/ui/Icon.jsx'
import {
  fetchReporte, descargarReportePdf,
  selectReporte, selectReporteStatus, selectReporteError, selectDescargando,
} from '../../features/reportes/reportesSlice.js'

// Rango por defecto: mes actual.
function rangoMesActual() {
  const h = new Date()
  const iso = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return {
    desde: iso(new Date(h.getFullYear(), h.getMonth(), 1)),
    hasta: iso(new Date(h.getFullYear(), h.getMonth() + 1, 0)),
  }
}

function StatCard({ label, value, sub, color = 'text-slate-900' }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-5">
      <p className="mb-2 font-mono text-[10px] font-semibold tracking-widest text-slate-400">{label}</p>
      <p className={`text-3xl font-black ${color}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
    </div>
  )
}

// Gráfica de barras verticales.
function BarrasVerticales({ datos, color = 'bg-brand' }) {
  const max = Math.max(...datos.map((d) => d.total), 1)
  return (
    <div className="flex h-44 items-end justify-between gap-2">
      {datos.map((d) => (
        <div key={d.etiqueta} className="flex flex-1 flex-col items-center gap-1.5">
          <span className="text-xs font-bold text-slate-700">{d.total || ''}</span>
          <div
            className={`w-full rounded-t-md ${d.total > 0 ? color : 'bg-slate-100'}`}
            style={{ height: d.total > 0 ? `${(d.total / max) * 100}%` : '3px' }}
            title={`${d.etiqueta}: ${d.total}`}
          />
          <span className="font-mono text-[9px] tracking-widest text-slate-400">{d.etiqueta}</span>
        </div>
      ))}
    </div>
  )
}

// Barras horizontales con porcentaje.
function BarrasHorizontales({ datos, sufijo = '' }) {
  const max = Math.max(...datos.map((d) => d.total), 1)
  return (
    <div className="space-y-4">
      {datos.map((d) => (
        <div key={d.etiqueta}>
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">{d.etiqueta}</span>
            <span className="font-mono text-xs text-slate-400">
              {d.total}{sufijo} {d.pct != null && `· ${d.pct}%`}
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-ink" style={{ width: `${(d.total / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function ReportesPage() {
  const dispatch = useDispatch()
  const data = useSelector(selectReporte)
  const status = useSelector(selectReporteStatus)
  const error = useSelector(selectReporteError)
  const descargando = useSelector(selectDescargando)

  const [rango, setRango] = useState(rangoMesActual)

  useEffect(() => {
    dispatch(fetchReporte(rango))
  }, [dispatch, rango.desde, rango.hasta])

  const aplicar = (campo) => (e) => setRango((r) => ({ ...r, [campo]: e.target.value }))

  return (
    <div>
      <PageHeading
        title="Reportes"
        subtitle="Métricas de uso y ocupación de los cubículos de la biblioteca."
      />

      {/* Filtros + descarga */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-slate-200 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="mb-1 block font-mono text-[10px] font-semibold tracking-widest text-slate-400">DESDE</span>
            <input type="date" value={rango.desde} onChange={aplicar('desde')}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-brand focus:outline-none" />
          </label>
          <label className="block">
            <span className="mb-1 block font-mono text-[10px] font-semibold tracking-widest text-slate-400">HASTA</span>
            <input type="date" value={rango.hasta} onChange={aplicar('hasta')}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-brand focus:outline-none" />
          </label>
          <button onClick={() => setRango(rangoMesActual())}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
            Mes actual
          </button>
        </div>

        <button
          onClick={() => dispatch(descargarReportePdf(rango))}
          disabled={descargando || status !== 'succeeded'}
          className="flex items-center gap-2 rounded-lg bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
        >
          <Icon name="chart" className="h-4 w-4" />
          {descargando ? 'Generando PDF…' : 'Descargar PDF'}
        </button>
      </div>

      {status === 'loading' && <p className="py-10 text-center text-sm text-slate-400">Cargando métricas…</p>}

      {status === 'failed' && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <p className="text-sm font-semibold text-red-700">No se pudieron cargar las métricas</p>
          <p className="mt-1 text-sm text-red-600">{error}</p>
          <button onClick={() => dispatch(fetchReporte(rango))}
            className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700">
            Reintentar
          </button>
        </div>
      )}

      {status === 'succeeded' && data && (
        <>
          {/* KPIs */}
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="RESERVAS DEL PERIODO" value={data.kpis.totalReservas} sub={`${data.periodo.diasHabiles} días hábiles`} />
            <StatCard label="TASA DE APROBACIÓN" value={`${data.kpis.tasaAprobacion}%`} color="text-green-600"
              sub={`${data.kpis.aprobadas} aprobadas · ${data.kpis.rechazadas} rechazadas`} />
            <StatCard label="PENDIENTES" value={data.kpis.pendientes} color="text-amber-600" sub="Por revisar" />
            <StatCard label="OCUPACIÓN" value={`${data.kpis.ocupacion}%`} color="text-brand"
              sub={`${data.kpis.horasReservadas} h reservadas`} />
          </div>

          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="CUBÍCULOS" value={data.inventario.total}
              sub={`${data.inventario.disponibles} habilitados · ${data.inventario.inhabilitados} fuera de servicio`} />
            <StatCard label="CUBÍCULO MÁS USADO" value={data.kpis.cubiculoTop} />
            <StatCard label="HORA PICO" value={data.kpis.horaPico} />
            <StatCard label="PROMEDIO POR RESERVA" value={`${data.kpis.promedioHoras} h`} />
          </div>

          {/* Gráficas */}
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 p-6">
              <p className="font-mono text-[10px] tracking-widest text-slate-400">DEMANDA SEMANAL</p>
              <h2 className="mb-6 text-lg font-bold text-slate-900">Reservas por día</h2>
              <BarrasVerticales datos={data.porDiaSemana} />
            </section>

            <section className="rounded-2xl border border-slate-200 p-6">
              <p className="font-mono text-[10px] tracking-widest text-slate-400">HORAS PICO</p>
              <h2 className="mb-6 text-lg font-bold text-slate-900">Distribución por hora</h2>
              <BarrasVerticales datos={data.porHora} color="bg-ink" />
            </section>

            <section className="rounded-2xl border border-slate-200 p-6">
              <p className="font-mono text-[10px] tracking-widest text-slate-400">OCUPACIÓN</p>
              <h2 className="mb-6 text-lg font-bold text-slate-900">Uso por cubículo</h2>
              {data.porCubiculo.length
                ? <BarrasHorizontales datos={data.porCubiculo} sufijo=" res" />
                : <p className="text-sm text-slate-400">Sin reservas en el periodo.</p>}
            </section>

            <section className="rounded-2xl border border-slate-200 p-6">
              <p className="font-mono text-[10px] tracking-widest text-slate-400">SOLICITANTES</p>
              <h2 className="mb-4 text-lg font-bold text-slate-900">Quién reserva más</h2>

              {data.porRol.length > 0 && (
                <div className="mb-5 flex flex-wrap gap-2">
                  {data.porRol.map((r) => (
                    <span key={r.etiqueta} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {r.etiqueta}: {r.total} ({r.pct}%)
                    </span>
                  ))}
                </div>
              )}

              {data.topSolicitantes.length ? (
                <ul className="space-y-2">
                  {data.topSolicitantes.map((s) => (
                    <li key={s.etiqueta} className="flex items-center justify-between border-b border-slate-100 pb-2 text-sm last:border-0">
                      <span className="font-medium text-slate-700">{s.etiqueta}</span>
                      <span className="flex items-center gap-3">
                        <span className="font-mono text-[10px] tracking-widest text-slate-400">{s.rol?.toUpperCase()}</span>
                        <span className="font-bold text-slate-900">{s.total}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-slate-400">Sin solicitantes en el periodo.</p>}
            </section>
          </div>

          {/* Desglose por estado */}
          <section className="mt-6 rounded-2xl border border-slate-200 p-6">
            <p className="font-mono text-[10px] tracking-widest text-slate-400">ESTADO DE LAS SOLICITUDES</p>
            <h2 className="mb-6 text-lg font-bold text-slate-900">Desglose por estado</h2>
            {data.porEstado.length
              ? <BarrasHorizontales datos={data.porEstado} />
              : <p className="text-sm text-slate-400">Sin solicitudes en el periodo.</p>}
          </section>
        </>
      )}
    </div>
  )
}
