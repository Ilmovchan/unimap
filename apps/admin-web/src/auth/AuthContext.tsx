import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { authLogin, authLogout, authMe, type AdminUser } from '../api/authApi'
import { ApiError, setUnauthorizedHandler } from '../api/http'

type AuthContextValue = {
  user: AdminUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshSession = useCallback(async () => {
    try {
      const me = await authMe()
      setUser(me)
      return true
    } catch {
      setUser(null)
      return false
    }
  }, [])

  useEffect(() => {
    refreshSession().finally(() => setLoading(false))
  }, [refreshSession])

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null))
    return () => setUnauthorizedHandler(null)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const loggedIn = await authLogin(email, password)
    setUser(loggedIn)
  }, [])

  const logout = useCallback(async () => {
    try {
      await authLogout()
    } finally {
      setUser(null)
    }
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, logout }),
    [user, loading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function getAuthErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return 'Невірний email або пароль.'
    return err.message
  }
  if (err instanceof Error) return err.message
  return 'Сталася помилка. Спробуйте ще раз.'
}
