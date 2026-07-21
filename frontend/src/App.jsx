import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

import Login from './features/auth/Login.jsx'
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
