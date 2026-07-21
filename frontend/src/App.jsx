import { Routes, Route, Navigate } from 'react-router-dom'

import Login from './features/auth/Login.jsx'
import AdminLayout from './components/layout/AdminLayout.jsx'
import CalendarioPage from './pages/admin/CalendarioPage.jsx'
import CubiculosPage from './pages/admin/CubiculosPage.jsx'
import AprobacionesPage from './pages/admin/AprobacionesPage.jsx'
import ReportesPage from './pages/admin/ReportesPage.jsx'
import HistorialPage from './pages/admin/HistorialPage.jsx'
import NotificacionesPage from './pages/admin/NotificacionesPage.jsx'
import AyudaPage from './pages/admin/AyudaPage.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Panel Admin Biblioteca. Front-only por ahora: sin gate de auth.
          Al conectar el backend, envolver en <PrivateRoute>. */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="calendario" replace />} />
        <Route path="calendario" element={<CalendarioPage />} />
        <Route path="cubiculos" element={<CubiculosPage />} />
        <Route path="aprobaciones" element={<AprobacionesPage />} />
        <Route path="reportes" element={<ReportesPage />} />
        <Route path="historial" element={<HistorialPage />} />
        <Route path="notificaciones" element={<NotificacionesPage />} />
        <Route path="ayuda" element={<AyudaPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  )
}
