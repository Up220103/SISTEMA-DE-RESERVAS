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
import Register from './features/auth/Register.jsx'
import CalendarView from './features/bookings/CalendarView.jsx'
import AlumnosDashboard from './features/alumnos/AlumnosDashboard.jsx'
import ProfesorDashboard from './features/profesor/ProfesorDashboard.jsx'
import { selectIsAuthenticated } from './features/auth/authSlice.js'

function PrivateRoute({ children }) {
  const isAuth = useSelector(selectIsAuthenticated)
  return isAuth ? children : <Navigate to="/login" replace />
}

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
      <Route path="/register" element={<Register />} />
      <Route
        path="/alumnos"
        element={
          <PrivateRoute>
            <AlumnosDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/profesor"
        element={
          <PrivateRoute>
            <ProfesorDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <CalendarView />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
