// Encabezado estándar de las vistas del panel: eyebrow + título + subtítulo.
export default function PageHeading({ eyebrow = 'ADMIN BIBLIOTECA', title, subtitle }) {
  return (
    <div className="mb-8">
      <p className="mb-2 font-mono text-[11px] font-semibold tracking-widest text-slate-400">
        {eyebrow}
      </p>
      <h1 className="text-4xl font-black tracking-tight text-slate-900">{title}</h1>
      {subtitle && <p className="mt-3 max-w-2xl text-slate-500">{subtitle}</p>}
    </div>
  )
}
