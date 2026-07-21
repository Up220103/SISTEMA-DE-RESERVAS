import { Outlet } from 'react-router-dom'

import Header from './Header.jsx'
import Sidebar from './Sidebar.jsx'

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <Header />
      <div className="flex flex-1">
        <main className="flex-1 overflow-x-auto px-10 py-10">
          <Outlet />
        </main>
        <Sidebar />
      </div>
    </div>
  )
}
