import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

import Login from './features/auth/Login.jsx'
import CalendarView from './features/bookings/CalendarView.jsx'
import { selectIsAuthenticated } from './features/auth/authSlice.js'

function PrivateRoute({ children }) {
  const isAuth = useSelector(selectIsAuthenticated)
  return isAuth ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
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
