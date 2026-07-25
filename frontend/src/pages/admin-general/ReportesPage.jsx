import { useEffect, useState } from 'react'

import PageHeading from '../../components/ui/PageHeading.jsx'
import { getReportes, msgError } from '../../features/adminGeneral/adminApi.js'

// --- utilidades de semana --------------------------------------------------
const lunesDeLaSemana = (f) => {
  const d = new Date(f)
  const dia = d.getDay() // 0=domingo
  const diff = (dia === 0 ? -6 : 1) - dia
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}
const fmtISO = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const fmtDiaMes = (d) =>
  d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }).replace('.', '')

function Barra({ label, sub, total, max }) {
  const pct = max > 0 ? Math.round((total / max) * 100) : 0
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <p className="text-sm font-semibold text-slate-900">
          {label} {sub && <span className="font-normal text-slate-400">· {sub}</span>}
        </p>
        <p className="font-mono text-sm text-slate-500">{total}</p>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-upa-blue" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function ReportesPage() {
  const [refFecha, setRefFecha] = useState(() => new Date())
  const lunes = lunesDeLaSemana(refFecha)
  const domingo = new Date(lunes)
  domingo.setDate(lunes.getDate() + 6)
  const desde = fmtISO(lunes)
  const hasta = fmtISO(domingo)
  const rango = `${fmtDiaMes(lunes)} — ${fmtDiaMes(domingo)} ${domingo.getFullYear()}`

  const [data, setData] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setCargando(true)
    getReportes(desde, hasta)
      .then(setData)
      .catch((err) => setError(msgError(err, 'No se pudieron cargar los reportes')))
      .finally(() => setCargando(false))
  }, [desde, hasta])

  const cambiarSemana = (delta) => {
    const d = new Date(lunes)
    d.setDate(lunes.getDate() + delta * 7)
    setRefFecha(d)
  }

  const descargarPDF = () => {
    if (!data) return
    const fecha = new Date().toLocaleString('es-MX')
    const filas = (arr, cols) =>
      arr.map((r) => `<tr>${cols.map((c) => `<td>${r[c] ?? ''}</td>`).join('')}</tr>`).join('')
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Reporte semanal de Reservas UPA</title>
      <style>
        body{font-family:Arial,Helvetica,sans-serif;color:#0f172a;padding:32px;}
        h1{color:#0033A0;margin-bottom:4px;} .sub{color:#64748b;margin-top:0;font-size:12px;}
        h2{margin-top:28px;border-bottom:2px solid #0033A0;padding-bottom:4px;font-size:15px;}
        table{width:100%;border-collapse:collapse;margin-top:8px;font-size:13px;}
        th,td{border:1px solid #e2e8f0;padding:6px 10px;text-align:left;}
        th{background:#f1f5f9;color:#475569;}
      </style></head><body>
      <h1>UPA · Reporte semanal de Reservas</h1>
      <p class="sub">Semana ${rango} · Generado: ${fecha}</p>
      <h2>Reservas por edificio</h2>
      <table><thead><tr><th>Edificio</th><th>Total reservas</th></tr></thead>
        <tbody>${filas(data.porEdificio, ['edificio', 'total'])}</tbody></table>
      <h2>Reservas por espacio</h2>
      <table><thead><tr><th>Espacio</th><th>Edificio</th><th>Total</th></tr></thead>
        <tbody>${filas(data.porEspacio, ['espacio', 'edificio', 'total'])}</tbody></table>
      <h2>Reservas por estado</h2>
      <table><thead><tr><th>Estado</th><th>Total</th></tr></thead>
        <tbody>${filas(data.porEstado, ['estado', 'total'])}</tbody></table>
      </body></html>`
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 300)
  }

  const maxEd = data ? Math.max(1, ...data.porEdificio.map((r) => r.total)) : 1
  const maxEs = data ? Math.max(1, ...data.porEspacio.map((r) => r.total)) : 1

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4">
        <PageHeading
          eyebrow="ADMIN GENERAL"
          title="Reportes semanales"
          subtitle="Reservas realizadas por edificio y por espacio en la semana seleccionada. Descarga el reporte en PDF."
        />
        <button
          onClick={descargarPDF}
          disabled={!data}
          className="mt-2 shrink-0 rounded-lg bg-upa-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-upa-hover disabled:opacity-50"
        >
          Descargar PDF
        </button>
      </div>

      {/* Navegación de semana */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Semana
          </p>
          <p className="font-display text-lg font-bold text-slate-900">{rango}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => cambiarSemana(-1)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            ← Anterior
          </button>
          <button
            onClick={() => setRefFecha(new Date())}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Esta semana
          </button>
          <button
            onClick={() => cambiarSemana(1)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Siguiente →
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {cargando || !data ? (
        <p className="text-slate-400">Cargando reportes…</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 p-6">
            <p className="mb-4 font-mono text-[10px] font-semibold tracking-widest text-slate-400">
              RESERVAS POR EDIFICIO
            </p>
            <div className="space-y-4">
              {data.porEdificio.map((r) => (
                <Barra key={r.edificio_id} label={r.edificio} total={r.total} max={maxEd} />
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-6">
            <p className="mb-4 font-mono text-[10px] font-semibold tracking-widest text-slate-400">
              RESERVAS POR ESPACIO
            </p>
            <div className="space-y-4">
              {data.porEspacio.map((r) => (
                <Barra key={r.espacio_id} label={r.espacio} sub={r.edificio} total={r.total} max={maxEs} />
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-6 lg:col-span-2">
            <p className="mb-4 font-mono text-[10px] font-semibold tracking-widest text-slate-400">
              RESERVAS POR ESTADO
            </p>
            <div className="flex flex-wrap gap-4">
              {data.porEstado.map((r) => (
                <div key={r.estado} className="rounded-xl border border-slate-200 px-5 py-4">
                  <p className="text-3xl font-black text-slate-900">{r.total}</p>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
                    {r.estado}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
