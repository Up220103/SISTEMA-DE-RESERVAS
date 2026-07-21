import PageHeading from '../../components/ui/PageHeading.jsx'
import Icon from '../../components/ui/Icon.jsx'

// Datos mock — luego vendrán de GET /api/historial.
const eventos = [
  { icon: 'check', tono: 'text-green-600 bg-green-50', txt: 'Aprobaste la reserva de Ana Torres',    meta: 'Cubículo 1 · Vie 21 Feb',    time: 'Hace 5 min' },
  { icon: 'bell',  tono: 'text-brand bg-brand/10',      txt: 'Nueva solicitud de Daniela Hernández',  meta: 'Cubículo 3 · Estudio grupal', time: 'Hace 22 min' },
  { icon: 'book',  tono: 'text-orange-600 bg-orange-50', txt: 'Inhabilitaste el Cubículo 6',           meta: 'Motivo: Mantenimiento',       time: 'Hoy 09:14' },
  { icon: 'x',     tono: 'text-red-600 bg-red-50',       txt: 'Rechazaste la reserva de Luis Herrera', meta: 'Cubículo 7 · Lun 17 Feb',     time: 'Ayer 17:40' },
  { icon: 'calendar', tono: 'text-slate-600 bg-slate-100', txt: 'Se creó la reserva de Carlos Núñez', meta: 'Cubículo 5 · Proyecto integrador', time: 'Ayer 11:02' },
  { icon: 'check', tono: 'text-green-600 bg-green-50',   txt: 'Aprobaste la reserva de Mtra. López',   meta: 'Cubículo 2 · Cálculo I',      time: 'Lun 17 Feb' },
]

export default function HistorialPage() {
  return (
    <div>
      <PageHeading title="Historial" subtitle="Registro de acciones recientes sobre reservas y espacios." />

      <section className="rounded-2xl border border-slate-200 p-6">
        <ul className="space-y-1">
          {eventos.map((e, i) => (
            <li key={i} className="flex gap-4 py-3">
              <div className="flex flex-col items-center">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${e.tono}`}>
                  <Icon name={e.icon} className="h-4 w-4" />
                </span>
                {i < eventos.length - 1 && <span className="mt-1 w-px flex-1 bg-slate-200" />}
              </div>
              <div className="pb-2">
                <p className="text-sm font-semibold text-slate-900">{e.txt}</p>
                <p className="text-sm text-slate-500">{e.meta}</p>
                <p className="mt-0.5 font-mono text-[10px] tracking-widest text-slate-400">{e.time}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
