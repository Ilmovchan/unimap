import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAuthErrorMessage, useAuth } from '../auth/AuthContext'
import './Auth.css'

export default function AuthPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const form = new FormData(e.currentTarget)
    const email = String(form.get('email') ?? '').trim()
    const password = String(form.get('password') ?? '')

    if (!email || !password) {
      setError('Введіть email і пароль.')
      return
    }

    setSubmitting(true)
    try {
      await login(email, password)
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(getAuthErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <header className="auth-header">
          <h1>UniMap Admin</h1>
          <p>Вхід</p>
        </header>

        <form className="auth-form" onSubmit={onSubmit}>
          {error ? (
            <p className="auth-error" role="alert">
              {error}
            </p>
          ) : null}

          <div className="auth-field">
            <label htmlFor="email">email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              disabled={submitting}
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">Пароль</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              disabled={submitting}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary auth-submit"
            disabled={submitting}
          >
            {submitting ? 'Вхід…' : 'Увійти'}
          </button>
        </form>
      </div>
    </div>
  )
}
