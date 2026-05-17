import { ApiError, apiRequest } from './http'

export { ApiError as AdminApiError }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    return await apiRequest<T>(path, init)
  } catch (err) {
    if (err instanceof ApiError && err.status === 404 && path.startsWith('/api/admin/')) {
      throw new ApiError(
        `${err.message}. Перезапустіть API (dotnet run) — на порту 5286 може працювати стара збірка без /api/admin.`,
        err.status,
      )
    }
    throw err
  }
}

export function adminList<T>(resource: string): Promise<T[]> {
  return request<T[]>(`/api/admin/${resource}`)
}

export function adminGet<T>(resource: string, id: string): Promise<T> {
  return request<T>(`/api/admin/${resource}/${id}`)
}

export function adminCreate<T>(resource: string, body: unknown): Promise<T> {
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
