import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'
import {
  deleteLocationPhoto,
  listLocationPhotos,
  LocationPhotosApiError,
  updateLocationPhoto,
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
  const [setAsMain, setSetAsMain] = useState(false)
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

    if (!file.type.startsWith('image/')) {
      setError('Дозволені лише зображення (image/*).')
      return
    }

    setUploading(true)
    setError(null)
    try {
      await uploadLocationPhoto(locationId, file, {
        altUk: altUk.trim() || undefined,
        isMain: setAsMain,
      })
      setAltUk('')
      setSetAsMain(false)
      await load()
    } catch (err) {
      setError(err instanceof LocationPhotosApiError ? err.message : 'Помилка завантаження')
    } finally {
      setUploading(false)
    }
  }

  const onSetMain = async (photo: LocationPhotoAdminDto) => {
    if (photo.isMain) return
    setError(null)
    try {
      await updateLocationPhoto(locationId, photo.id, { isMain: true })
      await load()
    } catch (err) {
      setError(err instanceof LocationPhotosApiError ? err.message : 'Помилка оновлення')
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
        <label className="location-photos-checkbox">
          <input
            type="checkbox"
            checked={setAsMain}
            onChange={(e) => setSetAsMain(e.target.checked)}
            disabled={uploading}
          />
          Головне фото
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
                {photo.isMain ? <span className="location-photo-badge">Головне</span> : null}
                {photo.altUk?.trim() ? (
                  <span className="location-photo-alt">{photo.altUk.trim()}</span>
                ) : null}
              </div>
              <div className="location-photo-actions">
                {!photo.isMain ? (
                  <button
                    type="button"
                    className="btn"
                    onClick={() => void onSetMain(photo)}
                  >
                    Зробити головним
                  </button>
                ) : null}
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
