import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AdminPanel from './AdminPanel'
import { AuthProvider } from './auth/AuthContext'
import GuestRoute from './auth/GuestRoute'
import ProtectedRoute from './auth/ProtectedRoute'
import AuthPage from './pages/AuthPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <GuestRoute>
                <AuthPage />
              </GuestRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminPanel />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
