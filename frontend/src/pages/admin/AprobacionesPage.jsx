import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import PageHeading from '../../components/ui/PageHeading.jsx'
import { selectSolicitudes, aprobar, rechazar } from '../../features/aprobaciones/aprobacionesSlice.js'

const TABS = [
  { key: 'pendiente', label: 'Pendientes' },
  { key: 'aprobada',  label: 'Aprobadas' },
  { key: 'rechazada', label: 'Rechazadas' },
]

const badgeEstado = {
  pendiente: 'bg-slate-100 text-slate-500',
  aprobada:  'bg-ink text-white',
  rechazada: 'bg-red-100 text-red-600',
}
const textoEstado = { pendiente: 'Pendiente', aprobada: 'Aprobada', rechazada: 'Rechazada' }

export default function AprobacionesPage() {
  const dispatch = useDispatch()
  const solicitudes = useSelector(selectSolicitudes)
  const [tab, setTab] = useState('pendiente')

  const visibles = solicitudes.filter((s) => s.estado === tab)

  return (
    <div>
      <PageHeading title="Aprobaciones" subtitle="Revisa y gestiona las solicitudes de reserva de cubículos." />

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-3">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full border px-5 py-2 text-sm font-semibold transition ${
              tab === t.key
                ? 'border-ink bg-ink text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {visibles.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-slate-400">
          No hay solicitudes {textoEstado[tab].toLowerCase()}s.
        </p>
      ) : (
        <ul className="space-y-4">
          {visibles.map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 p-5"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-ink text-sm font-bold text-white">
                {s.initials}
              </div>

              <div className="min-w-[240px] flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-slate-900">{s.nombre}</p>
                  <span className="font-mono text-[9px] font-semibold tracking-widest text-slate-400">
                    {s.tipo}
                  </span>
                </div>
                <p className="text-sm text-slate-500">
                  {s.lugar} · {s.fecha} · {s.hora}
                </p>
                <p className="text-sm text-slate-400">Motivo: {s.motivo}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => dispatch(aprobar(s.id))}
                  disabled={s.estado === 'aprobada'}
                  className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-40"
                >
                  Aprobar
                </button>
                <button
                  onClick={() => dispatch(rechazar(s.id))}
                  disabled={s.estado === 'rechazada'}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
                >
                  Rechazar
                </button>
                <span className={`rounded-lg px-3 py-2 text-sm font-semibold ${badgeEstado[s.estado]}`}>
                  {textoEstado[s.estado]}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
