import PageHeading from '../../components/ui/PageHeading.jsx'

// Datos mock — luego vendrán de GET /api/reportes?tipo=cubiculo.
// El Admin Biblioteca solo reporta reservas de cubículos.
const kpis = [
  { label: 'RESERVAS DE CUBÍCULOS', value: '128' },
  { label: 'TASA DE APROBACIÓN', value: '86%', color: 'text-green-600' },
  { label: 'OCUPACIÓN PROMEDIO', value: '64%', color: 'text-brand' },
  { label: 'CUBÍCULO MÁS USADO', value: 'Cubículo 4' },
]

const porDia = [
  { d: 'LUN', v: 12 },
  { d: 'MAR', v: 9 },
  { d: 'MIÉ', v: 15 },
  { d: 'JUE', v: 7 },
  { d: 'VIE', v: 11 },
]
const maxDia = Math.max(...porDia.map((x) => x.v))

// Ocupación por cubículo (Cubículo 1–7).
const porCubiculo = [
  { n: 'Cubículo 4', pct: 82 },
  { n: 'Cubículo 3', pct: 74 },
  { n: 'Cubículo 7', pct: 61 },
  { n: 'Cubículo 1', pct: 48 },
  { n: 'Cubículo 5', pct: 40 },
  { n: 'Cubículo 2', pct: 33 },
  { n: 'Cubículo 6', pct: 0 },
]

export default function ReportesPage() {
  return (
    <div>
      <PageHeading title="Reportes" subtitle="Métricas de uso y ocupación de los cubículos de la biblioteca." />

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-slate-200 p-5">
            <p className="mb-3 font-mono text-[10px] font-semibold tracking-widest text-slate-400">{k.label}</p>
            <p className={`text-3xl font-black ${k.color || 'text-slate-900'}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Barras por día */}
        <section className="rounded-2xl border border-slate-200 p-6">
          <p className="font-mono text-[10px] tracking-widest text-slate-400">ESTA SEMANA</p>
          <h2 className="mb-6 text-lg font-bold text-slate-900">Reservas por día</h2>
          <div className="flex h-48 items-end justify-between gap-3">
            {porDia.map((x) => (
              <div key={x.d} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-sm font-bold text-slate-700">{x.v}</span>
                <div
                  className="w-full rounded-t-md bg-brand/90"
                  style={{ height: `${(x.v / maxDia) * 100}%` }}
                />
                <span className="font-mono text-[10px] tracking-widest text-slate-400">{x.d}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Ocupación por cubículo */}
        <section className="rounded-2xl border border-slate-200 p-6">
          <p className="font-mono text-[10px] tracking-widest text-slate-400">OCUPACIÓN</p>
          <h2 className="mb-6 text-lg font-bold text-slate-900">Uso por cubículo</h2>
          <div className="space-y-4">
            {porCubiculo.map((c) => (
              <div key={c.n}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{c.n}</span>
                  <span className="font-mono text-xs text-slate-400">{c.pct}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-ink" style={{ width: `${c.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
