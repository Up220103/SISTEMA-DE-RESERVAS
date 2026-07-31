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
import RestablecerPassword from './features/auth/RestablecerPassword.jsx'
import AlumnosDashboard from './features/alumnos/AlumnosDashboard.jsx'
import ProfesorDashboard from './features/profesor/ProfesorDashboard.jsx'
import AdminGeneralLayout from './components/layout/AdminGeneralLayout.jsx'
import AGUsuariosPage from './pages/admin-general/UsuariosPage.jsx'
import AGEspaciosPage from './pages/admin-general/EspaciosPage.jsx'
import AGCalendarioPage from './pages/admin-general/CalendarioPage.jsx'
import AGReservasPage from './pages/admin-general/ReservasPage.jsx'
import AGReportesPage from './pages/admin-general/ReportesPage.jsx'
import AvisoTiempoReal from './components/AvisoTiempoReal.jsx'
import { selectIsAuthenticated, selectUser } from './features/auth/authSlice.js'

// Restringe una ruta a ciertos rol_id (1=Estudiante, 2=Docente,
// 3=Admin Biblioteca, 4=Admin General). Sin sesion -> login;
// con sesion pero sin permiso -> raiz.
function RoleRoute({ roles, children }) {
  const isAuth = useSelector(selectIsAuthenticated)
  const user = useSelector(selectUser)
  if (!isAuth) return <Navigate to="/login" replace />
  return roles.includes(user?.rol_id) ? children : <Navigate to="/" replace />
}

// Ruta raiz: no tiene pantalla propia. Envia a cada usuario al panel que le
// corresponde por rol (1=Estudiante, 2=Docente, 3=Admin Biblioteca,
// 4=Admin General); si no hay sesion, al login.
function HomeRedirect() {
  const isAuth = useSelector(selectIsAuthenticated)
  const user = useSelector(selectUser)
  if (!isAuth) return <Navigate to="/login" replace />
  const rol = user?.rol_id
  const destino =
    rol === 1 ? '/alumnos' :
    rol === 2 ? '/profesor' :
    rol === 3 ? '/admin' :
    rol === 4 ? '/admin-general' :
    '/login'
  return <Navigate to={destino} replace />
}

export default function App() {
  return (
    <>
      <AvisoTiempoReal />
      <Routes>
      <Route path="/login" element={<Login />} />
      {/* Publica: llega desde el enlace del correo, sin sesion iniciada. */}
      <Route path="/restablecer" element={<RestablecerPassword />} />

      {/* Panel Admin Biblioteca: SOLO rol 3. El Admin General no gestiona
          cubiculos (el backend tambien se lo niega con 403), asi que no debe
          poder abrir este panel. */}
      <Route
        path="/admin"
        element={
          <RoleRoute roles={[3]}>
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

      {/* Panel Admin General: solo rol 4 (antes bastaba con estar autenticado). */}
      <Route
        path="/admin-general"
        element={
          <RoleRoute roles={[4]}>
            <AdminGeneralLayout />
          </RoleRoute>
        }
      >
        <Route index element={<Navigate to="usuarios" replace />} />
        <Route path="espacios" element={<AGEspaciosPage />} />
        <Route path="calendario" element={<AGCalendarioPage />} />
        <Route path="reservas" element={<AGReservasPage />} />
        <Route path="usuarios" element={<AGUsuariosPage />} />
        <Route path="reportes" element={<AGReportesPage />} />
      </Route>

      <Route path="/register" element={<Register />} />
      {/* Cada panel es de su rol: quien no lo tenga vuelve a su propia pantalla. */}
      <Route
        path="/alumnos"
        element={
          <RoleRoute roles={[1]}>
            <AlumnosDashboard />
          </RoleRoute>
        }
      />
      <Route
        path="/profesor"
        element={
          <RoleRoute roles={[2]}>
            <ProfesorDashboard />
          </RoleRoute>
        }
      />
      <Route path="/" element={<HomeRedirect />} />
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
