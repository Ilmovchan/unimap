import { type FormEvent } from 'react'
import './Auth.css'

export default function AuthPage() {
  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <header className="auth-header">
          <h1>UniMap Admin</h1>
          <p>Вхід</p>
        </header>

        <form className="auth-form" onSubmit={onSubmit}>
          <div className="auth-field">
            <label htmlFor="email">email</label>
            <input id="email" name="email" type="email" autoComplete="email" />
          </div>

          <div className="auth-field">
            <label htmlFor="password">Пароль</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="btn btn-primary auth-submit">
            Увійти
          </button>
        </form>

      </div>
    </div>
  )
}
