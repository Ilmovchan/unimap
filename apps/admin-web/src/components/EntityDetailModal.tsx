import { useEffect } from 'react'
import type { AdminTable, TableField } from '../config/tables'

type Row = Record<string, unknown> & { id: string }

type Props = {
  table: AdminTable
  row: Row
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}

function formatDetailValue(value: unknown, field: TableField): string {
  if (value === null || value === undefined || value === '') return '—'
  if (field.type === 'checkbox') return value ? 'true' : 'false'
  if (field.type === 'datetime') {
    const date = new Date(String(value))
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('uk-UA')
  }
  if (typeof value === 'object') return JSON.stringify(value, null, 2)
  return String(value)
}

function isLongText(field: TableField, value: unknown): boolean {
  if (field.type === 'textarea') return true
  if (field.key === 'addressJson') return true
  const text = String(value ?? '')
  return text.length > 120 || text.includes('\n')
}

export default function EntityDetailModal({
  table,
  row,
  onClose,
  onEdit,
  onDelete,
}: Props) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="detail-overlay" onClick={onClose} role="presentation">
      <div
        className="detail-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="detail-header">
          <h3 id="detail-title">{table.label}</h3>
          <button type="button" className="btn btn-icon detail-close" onClick={onClose} aria-label="Закрити">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M18.3 5.71 12 12.01 5.7 5.71 4.29 7.12l6.3 6.3-6.3 6.29 1.41 1.42 6.29-6.3 6.3 6.3 1.41-1.41-6.3-6.29 6.3-6.29z"
              />
            </svg>
          </button>
        </header>

        <dl className="detail-fields">
          {table.fields.map((field) => {
            const value = row[field.key]
            const long = isLongText(field, value)
            return (
              <div key={field.key} className="detail-field">
                <dt>{field.label}</dt>
                <dd className={long ? 'detail-value-long' : undefined}>
                  {long ? <pre>{formatDetailValue(value, field)}</pre> : formatDetailValue(value, field)}
                </dd>
              </div>
            )
          })}
        </dl>

        <div className="detail-actions">
          <button type="button" className="btn btn-primary" onClick={onEdit}>
            Редагувати
          </button>
          <button type="button" className="btn btn-danger" onClick={onDelete}>
            Видалити
          </button>
        </div>
      </div>
    </div>
  )
}
