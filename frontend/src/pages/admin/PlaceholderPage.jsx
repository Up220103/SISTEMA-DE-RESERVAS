import PageHeading from '../../components/ui/PageHeading.jsx'
import Icon from '../../components/ui/Icon.jsx'

// Vista temporal para las secciones del menú aún no diseñadas.
export default function PlaceholderPage({ title, icon = 'info' }) {
  return (
    <div>
      <PageHeading title={title} subtitle="Esta sección está en construcción." />
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 py-24 text-slate-400">
        <Icon name={icon} className="h-10 w-10" />
        <p className="text-sm">Próximamente</p>
      </div>
    </div>
  )
}
