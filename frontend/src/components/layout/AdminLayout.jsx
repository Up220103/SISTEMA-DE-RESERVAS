import { useState } from 'react'
import { Outlet } from 'react-router-dom'

import Header from './Header.jsx'
import Sidebar from './Sidebar.jsx'
import UserProfileModal from '../UserProfileModal.jsx'

export default function AdminLayout() {
  // El modal vive aqui porque se abre desde dos sitios (el boton del header y
  // el de la sesion en el sidebar) y debe haber uno solo.
  const [perfilAbierto, setPerfilAbierto] = useState(false)
  const abrirPerfil = () => setPerfilAbierto(true)

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <Header onAbrirPerfil={abrirPerfil} />
      <div className="flex flex-1">
        <main className="flex-1 overflow-x-auto px-10 py-10">
          <Outlet />
        </main>
        <Sidebar onAbrirPerfil={abrirPerfil} />
      </div>
      <UserProfileModal open={perfilAbierto} onClose={() => setPerfilAbierto(false)} />
    </div>
  )
}
