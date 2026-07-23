import { useState } from 'react'

import PageHeading from '../../components/ui/PageHeading.jsx'
import Icon from '../../components/ui/Icon.jsx'

// Datos mock — luego vendrán de GET /api/notificaciones.
const iniciales = [
  { id: 1, unread: true,  icon: 'bell',     titulo: 'Nueva solicitud de reserva',    desc: 'Daniela Hernández · Cubículo 3', time: 'Hace 22 min' },
  { id: 2, unread: true,  icon: 'check',    titulo: 'Solicitud pendiente por vencer', desc: 'Carlos Núñez · Cubículo 5', time: 'Hace 1 h' },
  { id: 3, unread: false, icon: 'info',     titulo: 'Mantenimiento programado',       desc: 'El Cubículo 6 quedará inhabilitado', time: 'Ayer' },
  { id: 4, unread: false, icon: 'calendar', titulo: 'Resumen semanal disponible',     desc: 'Ya puedes ver el reporte de la semana', time: 'Lun 17 Feb' },
]

export default function NotificacionesPage() {
  const [items, setItems] = useState(iniciales)
  const sinLeer = items.filter((n) => n.unread).length

  const marcarTodas = () => setItems((prev) => prev.map((n) => ({ ...n, unread: false })))
  const marcarUna = (id) => setItems((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)))

  return (
    <div>
      <PageHeading title="Notificaciones" subtitle="Avisos sobre solicitudes, espacios y reportes." />

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Tienes <span className="font-bold text-slate-900">{sinLeer}</span> sin leer.
        </p>
        <button
          onClick={marcarTodas}
          disabled={sinLeer === 0}
          className="text-sm font-semibold text-brand transition hover:text-brand-dark disabled:opacity-40"
        >
          Marcar todas como leídas
        </button>
      </div>

      <ul className="space-y-3">
        {items.map((n) => (
          <li
            key={n.id}
            className={`flex items-start gap-4 rounded-2xl border p-4 transition ${
              n.unread ? 'border-brand/30 bg-brand/5' : 'border-slate-200 bg-white'
            }`}
          >
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
              n.unread ? 'bg-brand text-white' : 'bg-slate-100 text-slate-500'
            }`}>
              <Icon name={n.icon} className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-900">{n.titulo}</p>
              <p className="text-sm text-slate-500">{n.desc}</p>
              <p className="mt-0.5 font-mono text-[10px] tracking-widest text-slate-400">{n.time}</p>
            </div>
            {n.unread && (
              <button
                onClick={() => marcarUna(n.id)}
                className="flex items-center gap-2 text-xs font-semibold text-brand"
                title="Marcar como leída"
              >
                <span className="h-2.5 w-2.5 rounded-full bg-brand" />
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
