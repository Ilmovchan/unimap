import { apiRequest } from './http'

export const SUPER_ADMIN_ROLE = 'super_admin'

export function isSuperAdmin(role?: string | null): boolean {
  return role === SUPER_ADMIN_ROLE
}

export function formatAdminRoleLabel(role?: string | null): string {
  if (isSuperAdmin(role)) return 'Супер-адмін'
  if (role === 'admin') return 'Адмін'
  return role ?? ''
}

export type AdminUser = {
  id: string
  email: string
  username: string
  role: string
  lastLoginAt?: string | null
}

export function authLogin(email: string, password: string): Promise<AdminUser> {
  return apiRequest<AdminUser>('/api/admin/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function authLogout(): Promise<void> {
  return apiRequest<void>('/api/admin/auth/logout', { method: 'POST' })
}

export function authMe(): Promise<AdminUser> {
  return apiRequest<AdminUser>('/api/admin/auth/me')
}
