import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

export default function GuestRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="auth-page">
        <p className="auth-loading">Завантаження…</p>
      </div>
    )
  }

  if (user) return <Navigate to="/admin" replace />

  return children
}
