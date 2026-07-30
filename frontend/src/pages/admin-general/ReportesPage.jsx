import { useEffect, useMemo, useState } from 'react'

import PageHeading from '../../components/ui/PageHeading.jsx'
import { getReportes, msgError } from '../../features/adminGeneral/adminApi.js'

// Paleta para las gráficas (tonos de azul UPA + acentos), coherente con el resto.
const COLORES = ['#0033A0', '#3B82F6', '#60A5FA', '#93C5FD', '#1E3A8A', '#0EA5E9']
const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

// --- Gráfica de barras verticales: reservas por día de la semana -------------
function GraficaDias({ dias }) {
  const max = Math.max(1, ...dias.map((d) => d.total))
  const W = 560, H = 200, padX = 24, padB = 28, padT = 18
  const bw = (W - padX * 2) / dias.length
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Reservas por día">
      {dias.map((d, i) => {
        const h = (d.total / max) * (H - padB - padT)
        const w = bw * 0.6
        const x = padX + i * bw + (bw - w) / 2
        const y = H - padB - h
        return (
          <g key={i}>
            <rect x={x} y={y} width={w} height={h} rx="3" fill="#0033A0" />
            {d.total > 0 && (
              <text x={x + w / 2} y={y - 5} textAnchor="middle" fontSize="10" fill="#64748B">
                {d.total}
              </text>
            )}
            <text
              x={x + w / 2}
              y={H - padB + 15}
              textAnchor="middle"
              fontSize="10"
              fontFamily="monospace"
              fill="#94A3B8"
            >
              {d.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// --- Gráfica de dona: reservas por tipo de espacio ---------------------------
function GraficaDona({ items }) {
  const totalReal = items.reduce((s, i) => s + Number(i.total), 0)
  const total = totalReal || 1
  const C = 2 * Math.PI * 45
  let offset = 0
  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg viewBox="0 0 180 180" className="h-44 w-44 shrink-0">
        <g transform="rotate(-90 90 90)">
          <circle cx="90" cy="90" r="45" fill="none" stroke="#F1F5F9" strokeWidth="18" />
          {totalReal > 0 &&
            items.map((it, i) => {
              const len = (Number(it.total) / total) * C
              const seg = (
                <circle
                  key={i}
                  cx="90"
                  cy="90"
                  r="45"
                  fill="none"
                  stroke={COLORES[i % COLORES.length]}
                  strokeWidth="18"
                  strokeDasharray={`${len} ${C - len}`}
                  strokeDashoffset={-offset}
                />
              )
              offset += len
              return seg
            })}
        </g>
        <text x="90" y="86" textAnchor="middle" fontSize="26" fontWeight="800" fill="#0F172A">
          {totalReal}
        </text>
        <text x="90" y="104" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="#94A3B8">
          RESERVAS
        </text>
      </svg>
      <ul className="space-y-2 text-sm">
        {items.map((it, i) => (
          <li key={it.tipo_id ?? i} className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-sm"
              style={{ backgroundColor: COLORES[i % COLORES.length] }}
            />
            <span className="text-slate-700">{it.tipo}</span>
            <span className="font-mono text-slate-400">· {it.total}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

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

    // --- Gráficas para el PDF (SVG/HTML inline; los colores se imprimen gracias
    //     a print-color-adjust:exact). Usan los mismos datos que la pantalla. ---
    const svgDias = (items) => {
      const max = Math.max(1, ...items.map((d) => d.total))
      const W = 560, H = 180, padX = 24, padB = 24, padT = 16
      const bw = (W - padX * 2) / items.length
      const barras = items
        .map((d, i) => {
          const h = (d.total / max) * (H - padB - padT)
          const w = bw * 0.6
          const x = padX + i * bw + (bw - w) / 2
          const y = H - padB - h
          return (
            `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="3" fill="#0033A0"/>` +
            (d.total > 0
              ? `<text x="${(x + w / 2).toFixed(1)}" y="${(y - 4).toFixed(1)}" text-anchor="middle" font-size="10" fill="#64748b">${d.total}</text>`
              : '') +
            `<text x="${(x + w / 2).toFixed(1)}" y="${H - padB + 14}" text-anchor="middle" font-size="10" fill="#94a3b8" font-family="monospace">${d.label}</text>`
          )
        })
        .join('')
      return `<svg viewBox="0 0 ${W} ${H}" width="100%" xmlns="http://www.w3.org/2000/svg">${barras}</svg>`
    }
    const barrasHtml = (items, keyLabel, keySub) => {
      const max = Math.max(1, ...items.map((it) => Number(it.total)))
      return items
        .map((it) => {
          const pct = Math.round((Number(it.total) / max) * 100)
          const sub = keySub && it[keySub] ? ` · ${it[keySub]}` : ''
          return `<div style="margin:7px 0">
            <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:2px">
              <span>${it[keyLabel]}<span style="color:#94a3b8">${sub}</span></span><span>${it.total}</span></div>
            <div style="height:8px;background:#eef2f7;border-radius:6px;overflow:hidden">
              <div style="height:100%;width:${pct}%;background:#0033A0"></div></div></div>`
        })
        .join('')
    }
    const graficaDias = svgDias(dias)
    const graficaTop = topEspacios.length
      ? barrasHtml(topEspacios, 'espacio', 'edificio')
      : '<p style="color:#94a3b8;font-size:12px">Sin reservas en esta semana.</p>'
    const graficaTipo = barrasHtml(data.porTipo || [], 'tipo')

    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Reporte semanal de Reservas UPA</title>
      <style>
        body{font-family:Arial,Helvetica,sans-serif;color:#0f172a;padding:32px;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
        h1{color:#0033A0;margin-bottom:4px;} .sub{color:#64748b;margin-top:0;font-size:12px;}
        h2{margin-top:28px;border-bottom:2px solid #0033A0;padding-bottom:4px;font-size:15px;}
        table{width:100%;border-collapse:collapse;margin-top:8px;font-size:13px;}
        th,td{border:1px solid #e2e8f0;padding:6px 10px;text-align:left;}
        th{background:#f1f5f9;color:#475569;}
        .grafica{margin-top:10px;max-width:600px;}
      </style></head><body>
      <h1>UPA · Reporte semanal de Reservas</h1>
      <p class="sub">Semana ${rango} · Generado: ${fecha}</p>

      <h2>Gráfica · Reservas por día</h2>
      <div class="grafica">${graficaDias}</div>
      <h2>Gráfica · Top espacios más reservados</h2>
      <div class="grafica">${graficaTop}</div>
      <h2>Gráfica · Reservas por tipo de espacio</h2>
      <div class="grafica">${graficaTipo}</div>

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

  // Reservas por día: los 7 días de la semana (rellena con 0 los días sin reservas).
  const dias = useMemo(() => {
    const conteo = new Map((data?.porDia || []).map((d) => [String(d.fecha).slice(0, 10), Number(d.total)]))
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(lunes)
      d.setDate(lunes.getDate() + i)
      return { label: DIAS_SEMANA[i], total: conteo.get(fmtISO(d)) || 0 }
    })
  }, [data, desde])

  // Top 5 espacios más reservados (porEspacio ya viene ordenado desc por total).
  const topEspacios = useMemo(
    () => (data?.porEspacio || []).filter((e) => e.total > 0).slice(0, 5),
    [data],
  )

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
          {/* --- Sección de gráficas --- */}
          <div className="rounded-2xl border border-slate-200 p-6 lg:col-span-2">
            <p className="mb-4 font-mono text-[10px] font-semibold tracking-widest text-slate-400">
              RESERVAS POR DÍA
            </p>
            <GraficaDias dias={dias} />
          </div>

          <div className="rounded-2xl border border-slate-200 p-6">
            <p className="mb-4 font-mono text-[10px] font-semibold tracking-widest text-slate-400">
              TOP 5 ESPACIOS MÁS RESERVADOS
            </p>
            {topEspacios.length === 0 ? (
              <p className="text-sm text-slate-400">Sin reservas en esta semana.</p>
            ) : (
              <div className="space-y-4">
                {topEspacios.map((r) => (
                  <Barra
                    key={r.espacio_id}
                    label={r.espacio}
                    sub={r.edificio}
                    total={r.total}
                    max={topEspacios[0].total}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 p-6">
            <p className="mb-4 font-mono text-[10px] font-semibold tracking-widest text-slate-400">
              RESERVAS POR TIPO DE ESPACIO
            </p>
            <GraficaDona items={data.porTipo || []} />
          </div>

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
