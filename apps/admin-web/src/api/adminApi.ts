const API_BASE = import.meta.env.VITE_API_URL ?? ''

export class AdminApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'AdminApiError'
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

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })

  if (!res.ok) {
    const message = await parseError(res)
    if (res.status === 404 && path.startsWith('/api/admin/')) {
      throw new AdminApiError(
        `${message}. Перезапустіть API (dotnet run) — на порту 5286 може працювати стара збірка без /api/admin.`,
        res.status,
      )
    }
    throw new AdminApiError(message, res.status)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export function adminList<T>(resource: string): Promise<T[]> {
  return request<T[]>(`/api/admin/${resource}`)
}

export function adminGet<T>(resource: string, id: string): Promise<T> {
  return request<T>(`/api/admin/${resource}/${id}`)
}

export function adminCreate<T>(
  resource: string,
  body: unknown,
): Promise<T> {
  return request<T>(`/api/admin/${resource}`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function adminUpdate<T>(
  resource: string,
  id: string,
  body: unknown,
): Promise<T> {
  return request<T>(`/api/admin/${resource}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export function adminDelete(resource: string, id: string): Promise<void> {
  return request<void>(`/api/admin/${resource}/${id}`, { method: 'DELETE' })
}
