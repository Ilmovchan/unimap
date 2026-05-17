const API_BASE = import.meta.env.VITE_API_URL ?? ''

let onUnauthorized: (() => void) | null = null

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function parseError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string }
    if (body.error) return body.error
  } catch {
    /* ignore */
  }
  return res.statusText || `HTTP ${res.status}`
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })

  if (!res.ok) {
    const message = await parseError(res)
    if (
      res.status === 401 &&
      path.startsWith('/api/admin/') &&
      !path.startsWith('/api/admin/auth/')
    ) {
      onUnauthorized?.()
    }
    throw new ApiError(message, res.status)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}
