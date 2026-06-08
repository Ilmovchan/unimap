import { ApiError, apiRequest, apiRequestForm } from './http'

export { ApiError as LocationPhotosApiError }

export type LocationPhotoAdminDto = {
  id: string
  locationId: string
  url: string | null
  storageKey: string
  altUk?: string | null
  createdAt: string
  updatedAt: string
}

function normalizePhotoUrl(photo: LocationPhotoAdminDto): LocationPhotoAdminDto {
  if (!photo.url) return photo

  try {
    const url = new URL(photo.url, window.location.origin)
    if (url.pathname.startsWith('/api/pictures/')) {
      return {
        ...photo,
        url: `${url.pathname}${url.search}${url.hash}`,
      }
    }
  } catch {
    // Keep the original value if it is not a URL the browser can parse.
  }

  return photo
}

export function listLocationPhotos(locationId: string): Promise<LocationPhotoAdminDto[]> {
  return apiRequest<LocationPhotoAdminDto[]>(
    `/api/admin/locations/${encodeURIComponent(locationId)}/photos`,
  ).then((photos) => photos.map(normalizePhotoUrl))
}

export function uploadLocationPhoto(
  locationId: string,
  file: File,
  options?: { altUk?: string },
): Promise<LocationPhotoAdminDto> {
  const form = new FormData()
  form.append('file', file)
  if (options?.altUk?.trim()) form.append('altUk', options.altUk.trim())

  return apiRequestForm<LocationPhotoAdminDto>(
    `/api/admin/locations/${encodeURIComponent(locationId)}/photos`,
    form,
    { method: 'POST' },
  ).then(normalizePhotoUrl)
}

export function updateLocationPhoto(
  locationId: string,
  photoId: string,
  body: { altUk?: string | null },
): Promise<LocationPhotoAdminDto> {
  return apiRequest<LocationPhotoAdminDto>(
    `/api/admin/locations/${encodeURIComponent(locationId)}/photos/${encodeURIComponent(photoId)}`,
    {
      method: 'PUT',
      body: JSON.stringify(body),
    },
  ).then(normalizePhotoUrl)
}

export function deleteLocationPhoto(locationId: string, photoId: string): Promise<void> {
  return apiRequest<void>(
    `/api/admin/locations/${encodeURIComponent(locationId)}/photos/${encodeURIComponent(photoId)}`,
    { method: 'DELETE' },
  )
}
