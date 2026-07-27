import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

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
import { selectIsAuthenticated, selectUser } from './features/auth/authSlice.js'

function PrivateRoute({ children }) {
  const isAuth = useSelector(selectIsAuthenticated)
  return isAuth ? children : <Navigate to="/login" replace />
}

// Restringe una ruta a ciertos rol_id (1=Estudiante, 2=Docente,
// 3=Admin Biblioteca, 4=Admin General). Sin sesion -> login;
// con sesion pero sin permiso -> raiz.
function RoleRoute({ roles, children }) {
  const isAuth = useSelector(selectIsAuthenticated)
  const user = useSelector(selectUser)
  if (!isAuth) return <Navigate to="/login" replace />
  return roles.includes(user?.rol_id) ? children : <Navigate to="/" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Panel Admin Biblioteca: solo rol 3 (Admin Biblioteca) y 4 (Admin General). */}
      <Route
        path="/admin"
        element={
          <RoleRoute roles={[3, 4]}>
            <AdminLayout />
          </RoleRoute>
        }
      >
        <Route index element={<Navigate to="calendario" replace />} />
        <Route path="calendario" element={<CalendarioPage />} />
        <Route path="cubiculos" element={<CubiculosPage />} />
        <Route path="aprobaciones" element={<AprobacionesPage />} />
        <Route path="reportes" element={<ReportesPage />} />
        <Route path="historial" element={<HistorialPage />} />
        <Route path="notificaciones" element={<NotificacionesPage />} />
        <Route path="ayuda" element={<AyudaPage />} />
      </Route>

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
