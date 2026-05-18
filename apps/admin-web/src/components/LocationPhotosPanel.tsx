import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'
import {
  deleteLocationPhoto,
  listLocationPhotos,
  LocationPhotosApiError,
  uploadLocationPhoto,
  type LocationPhotoAdminDto,
} from '../api/locationPhotosApi'

type Props = {
  locationId: string
  locationTitle?: string
}

export default function LocationPhotosPanel({ locationId, locationTitle }: Props) {
  const [photos, setPhotos] = useState<LocationPhotoAdminDto[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [altUk, setAltUk] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listLocationPhotos(locationId)
      setPhotos(data)
    } catch (e) {
      setError(e instanceof LocationPhotosApiError ? e.message : 'Не вдалося завантажити фото')
    } finally {
      setLoading(false)
    }
  }, [locationId])

  useEffect(() => {
    void load()
  }, [load])

  const onPickFile = () => fileInputRef.current?.click()

  const onFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    const isImage =
      file.type.startsWith('image/') ||
      /\.(jpe?g|png|webp|gif|avif|svg)$/i.test(file.name)
    if (!isImage) {
      setError('Дозволені лише файли зображень (jpg, png, webp тощо).')
      return
    }

    setUploading(true)
    setError(null)
    try {
      await uploadLocationPhoto(locationId, file, {
        altUk: altUk.trim() || undefined,
      })
      setAltUk('')
      await load()
    } catch (err) {
      setError(err instanceof LocationPhotosApiError ? err.message : 'Помилка завантаження')
    } finally {
      setUploading(false)
    }
  }

  const onDelete = async (photo: LocationPhotoAdminDto) => {
    if (!window.confirm('Видалити це фото?')) return
    setError(null)
    try {
      await deleteLocationPhoto(locationId, photo.id)
      await load()
    } catch (err) {
      setError(err instanceof LocationPhotosApiError ? err.message : 'Помилка видалення')
    }
  }

  return (
    <section className="location-photos-panel" aria-label="Фото локації">
      <div className="location-photos-header">
        <h4>Фото</h4>
        {locationTitle ? <span className="location-photos-subtitle">{locationTitle}</span> : null}
      </div>

      {error ? <p className="location-photos-error">{error}</p> : null}

      <div className="location-photos-upload">
        <label className="form-field">
          <span>Підпис (alt, необовʼязково)</span>
          <input
            type="text"
            value={altUk}
            onChange={(e) => setAltUk(e.target.value)}
            placeholder="Корпус №1"
            disabled={uploading}
          />
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="location-photos-file-input"
          onChange={(e) => void onFileChange(e)}
        />
        <button
          type="button"
          className="btn btn-primary"
          onClick={onPickFile}
          disabled={uploading}
        >
          {uploading ? 'Завантаження…' : 'Додати фото'}
        </button>
      </div>

      {loading ? (
        <p className="location-photos-status">Завантаження фото…</p>
      ) : photos.length === 0 ? (
        <p className="location-photos-status">Фото ще немає</p>
      ) : (
        <ul className="location-photos-grid">
          {photos.map((photo) => (
            <li key={photo.id} className="location-photo-card">
              {photo.url ? (
                <img src={photo.url} alt={photo.altUk?.trim() || 'Фото локації'} loading="lazy" />
              ) : (
                <div className="location-photo-placeholder">Немає URL</div>
              )}
              <div className="location-photo-meta">
                {photo.altUk?.trim() ? (
                  <span className="location-photo-alt">{photo.altUk.trim()}</span>
                ) : null}
              </div>
              <div className="location-photo-actions">
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => void onDelete(photo)}
                >
                  Видалити
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
