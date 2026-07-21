import PageHeading from '../../components/ui/PageHeading.jsx'
import Icon from '../../components/ui/Icon.jsx'

const faqs = [
  { q: '¿Cómo apruebo o rechazo una reserva?', a: 'Ve a la pestaña Aprobaciones, revisa la solicitud y usa los botones Aprobar o Rechazar. La solicitud se moverá a la pestaña correspondiente.' },
  { q: '¿Cómo inhabilito un cubículo?', a: 'En Gestión de Cubículos haz clic en el cubículo para abrir su detalle y cambia su estado a Inhabilitado (por ejemplo, por mantenimiento).' },
  { q: '¿Qué significan los colores del calendario?', a: 'Blanco = horario disponible, negro = ocupado por otra reserva, azul = horario seleccionado por ti.' },
  { q: '¿Cómo genero un reporte de uso?', a: 'Entra a la pestaña Reportes: ahí verás métricas de reservas, tasa de aprobación y ocupación por espacio.' },
]

export default function AyudaPage() {
  return (
    <div>
      <PageHeading title="Ayuda" subtitle="Preguntas frecuentes y contacto de soporte." />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* FAQ */}
        <section className="space-y-3 lg:col-span-2">
          {faqs.map((f, i) => (
            <details key={i} className="group rounded-2xl border border-slate-200 p-5 open:bg-slate-50">
              <summary className="flex cursor-pointer items-center justify-between text-sm font-bold text-slate-900 marker:content-none">
                {f.q}
                <span className="ml-4 text-slate-400 transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm text-slate-500">{f.a}</p>
            </details>
          ))}
        </section>

        {/* Contacto */}
        <aside className="h-fit rounded-2xl border border-slate-200 p-6">
          <p className="font-mono text-[10px] tracking-widest text-slate-400">SOPORTE</p>
          <h2 className="mb-4 text-lg font-bold text-slate-900">¿Necesitas más ayuda?</h2>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-3 text-slate-600">
              <Icon name="mail" className="h-4 w-4 text-slate-400" />
              soporte@upa.edu.mx
            </li>
            <li className="flex items-center gap-3 text-slate-600">
              <Icon name="clock" className="h-4 w-4 text-slate-400" />
              Lun a Vie · 8:00 – 18:00
            </li>
          </ul>
          <button className="mt-6 w-full rounded-lg bg-ink py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
            Contactar soporte
          </button>
        </aside>
      </div>
    </div>
  )
}
