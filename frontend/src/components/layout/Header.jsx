import Icon from '../ui/Icon.jsx'
import Logo from '../ui/Logo.jsx'

export default function Header() {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
      {/* Marca */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <Logo className="h-10 w-auto" />
          <div className="hidden border-l border-slate-200 pl-3 leading-tight sm:block">
            <p className="font-mono text-[10px] tracking-widest text-slate-400">
              UNIVERSIDAD POLITÉCNICA
            </p>
          </div>
        </div>

        <div className="hidden items-center gap-2 rounded-full border border-slate-200 px-4 py-1.5 md:flex">
          <span className="h-2 w-2 rounded-full bg-brand" />
          <span className="font-mono text-[11px] font-medium tracking-widest text-slate-500">
            PANEL · ADMIN BIBLIOTECA
          </span>
        </div>
      </div>

      {/* Perfil */}
      <button className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
        <Icon name="user" className="h-4 w-4" />
        Mi perfil
      </button>
    </header>
  )
}
