import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'

import Logo from '../ui/Logo.jsx'
import Icon from '../ui/Icon.jsx'
import { logout, selectUser } from '../../features/auth/authSlice.js'

// Secciones del panel del Administrador General (documento).
const NAV = [
  { to: '/admin-general/espacios', label: 'Espacios', icon: 'book' },
  { to: '/admin-general/calendario', label: 'Calendario', icon: 'calendar' },
  { to: '/admin-general/reservas', label: 'Reservas', icon: 'check' },
  { to: '/admin-general/usuarios', label: 'Usuarios', icon: 'user' },
  { to: '/admin-general/reportes', label: 'Reportes', icon: 'chart' },
]

function SectionLabel({ children }) {
  return (
    <p className="font-mono text-[10px] font-semibold tracking-widest text-slate-400">{children}</p>
  )
}

export default function AdminGeneralLayout() {
  const user = useSelector(selectUser)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const cerrarSesion = () => {
    dispatch(logout())
    navigate('/login')
  }

  const iniciales = user
    ? `${user.nombre?.[0] || ''}${user.apellido?.[0] || ''}`.toUpperCase() || 'AG'
    : 'AG'

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      {/* Header (mismo estilo que el panel de biblioteca) */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
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
            <span className="h-2 w-2 rounded-full bg-upa-blue" />
            <span className="font-mono text-[11px] font-medium tracking-widest text-slate-500">
              PANEL · ADMIN GENERAL
            </span>
          </div>
        </div>
        <button className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
          <Icon name="user" className="h-4 w-4" />
          Mi perfil
        </button>
      </header>

      <div className="flex flex-1">
        <main className="flex-1 overflow-x-auto px-10 py-10">
          <Outlet />
        </main>

        {/* Sidebar derecho */}
        <aside className="flex w-72 shrink-0 flex-col gap-6 border-l border-slate-200 bg-white px-6 py-6">
          <div className="space-y-3">
            <SectionLabel>SESIÓN ACTIVA</SectionLabel>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-ink text-sm font-bold text-white">
                {iniciales}
              </div>
              <div className="leading-tight">
                <p className="text-sm font-bold text-slate-900">
                  {user ? `${user.nombre} ${user.apellido}` : 'Administrador'}
                </p>
                <p className="text-xs text-slate-400">{user?.email}</p>
              </div>
            </div>
            <span className="inline-block rounded-md bg-upa-blue px-2.5 py-1 font-mono text-[10px] font-bold tracking-widest text-white">
              {(user?.rol || 'ADMIN GENERAL').toUpperCase()}
            </span>
          </div>

          <nav className="space-y-2">
            <SectionLabel>NAVEGACIÓN</SectionLabel>
            <ul className="space-y-1">
              {NAV.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      [
                        'flex items-center gap-3 rounded-lg border-l-2 px-3 py-2 text-sm font-semibold transition',
                        isActive
                          ? 'border-upa-blue bg-upa-light text-slate-900'
                          : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                      ].join(' ')
                    }
                  >
                    <Icon name={item.icon} className="h-4 w-4 text-slate-400" />
                    <span className="flex-1">{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

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
      </div>
    </div>
  )
}
