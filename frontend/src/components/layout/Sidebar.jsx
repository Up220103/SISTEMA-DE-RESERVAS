import { NavLink, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'

import Icon from '../ui/Icon.jsx'
import { logout } from '../../features/auth/authSlice.js'
import { sessionUser, navItems } from '../../config/session.js'

function SectionLabel({ children }) {
  return (
    <p className="font-mono text-[10px] font-semibold tracking-widest text-slate-400">
      {children}
    </p>
  )
}

export default function Sidebar() {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const cerrarSesion = () => {
    dispatch(logout())
    navigate('/login')
  }

  return (
    <aside className="flex w-72 shrink-0 flex-col gap-6 border-l border-slate-200 bg-white px-6 py-6">
      {/* Sesión activa */}
      <div className="space-y-3">
        <SectionLabel>SESIÓN ACTIVA</SectionLabel>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-ink text-sm font-bold text-white">
            {sessionUser.initials}
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold text-slate-900">{sessionUser.name}</p>
            <p className="text-xs text-slate-400">{sessionUser.email}</p>
          </div>
        </div>
        <span className="inline-block rounded-md bg-ink px-2.5 py-1 font-mono text-[10px] font-bold tracking-widest text-white">
          {sessionUser.role}
        </span>
        <button className="w-full rounded-lg border border-slate-200 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
          Ver datos del usuario
        </button>
      </div>

      {/* Navegación */}
      <nav className="space-y-2">
        <SectionLabel>NAVEGACIÓN</SectionLabel>
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.key}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-3 rounded-lg border-l-2 px-3 py-2 text-sm font-semibold transition',
                    isActive
                      ? 'border-brand bg-slate-50 text-slate-900'
                      : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                  ].join(' ')
                }
              >
                <Icon name={item.icon} className="h-4 w-4 text-slate-400" />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Pie */}
      <div className="mt-auto space-y-3 border-t border-slate-100 pt-4">
        <button
          onClick={cerrarSesion}
          className="flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-slate-600"
        >
          <Icon name="logout" className="h-4 w-4" />
          Cerrar sesión
        </button>
        <p className="font-mono text-[10px] tracking-widest text-slate-300">UPA · v1.0</p>
      </div>
    </aside>
  )
}
