import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="auth-page">
        <p className="auth-loading">Завантаження…</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />
  }

  return children
}
