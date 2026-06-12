import { createElement, useEffect, type MouseEvent } from 'react'
import type { AdminTable, TableField } from '../config/tables'
import LocationPhotosPanel from './LocationPhotosPanel'

type Row = Record<string, unknown> & { id: string }

type ScheduleItem = {
  dayOfWeek: number
  openingAt: string | null
  closingAt: string | null
  isClosed: boolean
}

type Props = {
  table: AdminTable
  row: Row
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  canDelete?: boolean
}

const el = 'd' + 'iv'

function showInDetail(field: TableField): boolean {
  if (field.detail === false) return false
  if (field.detail === true) return true
  return !(field.form === true && field.list === false)
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

function MaskedSecret({ value }: { value: string }) {
  const text = value.trim()
  if (!text) return '—'

  return createElement(
    'span',
    { className: 'detail-secret' },
    createElement('span', { className: 'detail-secret-mask', 'aria-hidden': true }, '•'.repeat(12)),
    createElement('span', { className: 'detail-secret-value' }, text),
  )
}

const WEEK_DAY_LABELS = new Map([
  [1, 'Понеділок'],
  [2, 'Вівторок'],
  [3, 'Середа'],
  [4, 'Четвер'],
  [5, 'Пʼятниця'],
  [6, 'Субота'],
  [7, 'Неділя'],
])

function parseSchedule(value: unknown): ScheduleItem[] {
  if (!Array.isArray(value)) return []

  const parsed: ScheduleItem[] = []
  for (const item of value) {
    if (!item || typeof item !== 'object') continue
    const raw = item as Record<string, unknown>
    const dayOfWeek = Number(raw.dayOfWeek)
    if (!Number.isInteger(dayOfWeek)) continue

    parsed.push({
      dayOfWeek,
      openingAt:
        raw.openingAt === null || raw.openingAt === undefined
          ? null
          : String(raw.openingAt),
      closingAt:
        raw.closingAt === null || raw.closingAt === undefined
          ? null
          : String(raw.closingAt),
      isClosed: Boolean(raw.isClosed),
    })
  }

  return parsed.sort((a, b) => a.dayOfWeek - b.dayOfWeek)
}

function formatScheduleTime(value: string | null | undefined): string {
  const text = value?.trim()
  return text ? text.slice(0, 5) : '—'
}

function LocationScheduleDetail({ value }: { value: unknown }) {
  const schedule = parseSchedule(value)

  return createElement(
    'section',
    { className: 'detail-schedule' },
    createElement('div', { className: 'detail-schedule-title' }, 'Розклад'),
    schedule.length === 0
      ? createElement('div', { className: 'detail-schedule-empty' }, 'Не задано')
      : createElement(
          'div',
          { className: 'detail-schedule-list' },
          ...schedule.map((day) =>
            createElement(
              'div',
              { key: day.dayOfWeek, className: 'detail-schedule-row' },
              createElement(
                'span',
                { className: 'detail-schedule-day' },
                WEEK_DAY_LABELS.get(day.dayOfWeek) ?? `День ${day.dayOfWeek}`,
              ),
              createElement(
                'span',
                {
                  className: day.isClosed
                    ? 'detail-schedule-time detail-schedule-closed'
                    : 'detail-schedule-time',
                },
                day.isClosed
                  ? 'Закрито'
                  : `${formatScheduleTime(day.openingAt)} - ${formatScheduleTime(day.closingAt)}`,
              ),
            ),
          ),
        ),
  )
}

export default function EntityDetailModal({
  table,
  row,
  onClose,
  onEdit,
  onDelete,
  canDelete = true,
}: Props) {
  const detailFields = table.fields.filter(showInDetail)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return createElement(
    el,
    { className: 'detail-overlay', onClick: onClose, role: 'presentation' },
    createElement(
      el,
      {
        className: `detail-dialog${table.id === 'locations' ? ' detail-dialog-wide' : ''}`,
        role: 'dialog',
        'aria-modal': true,
        'aria-labelledby': 'detail-title',
        onClick: (e: MouseEvent) => e.stopPropagation(),
      },
      createElement(
        'header',
        { className: 'detail-header' },
        createElement('h3', { id: 'detail-title' }, table.label),
        createElement(
          'button',
          {
            type: 'button',
            className: 'btn btn-icon detail-close',
            onClick: onClose,
            'aria-label': 'Закрити',
          },
          createElement(
            'svg',
            { viewBox: '0 0 24 24', 'aria-hidden': true },
            createElement('path', {
              fill: 'currentColor',
              d: 'M18.3 5.71 12 12.01 5.7 5.71 4.29 7.12l6.3 6.3-6.3 6.29 1.41 1.42 6.29-6.3 6.3 6.3 1.41-1.41-6.3-6.29 6.3-6.29z',
            }),
          ),
        ),
      ),
      table.id === 'locations'
        ? createElement(LocationPhotosPanel, {
            locationId: row.id,
            locationTitle: String(row.title ?? '').trim() || undefined,
          })
        : null,
      table.id === 'locations'
        ? createElement(LocationScheduleDetail, { value: row.schedule })
        : null,
      createElement(
        'dl',
        { className: 'detail-fields' },
        ...detailFields.map((field) => {
          const value = row[field.key]
          const long = isLongText(field, value)
          const isSecret = field.key === 'passwordHash'

          return createElement(
            el,
            { key: field.key, className: 'detail-field' },
            createElement('dt', null, field.label),
            createElement(
              'dd',
              { className: long ? 'detail-value-long' : undefined },
              isSecret
                ? createElement(MaskedSecret, { value: String(value ?? '') })
                : long
                  ? createElement('pre', null, formatDetailValue(value, field))
                  : formatDetailValue(value, field),
            ),
          )
        }),
      ),
      createElement(
        el,
        { className: 'detail-actions' },
        createElement(
          'button',
          { type: 'button', className: 'btn btn-primary', onClick: onEdit },
          'Редагувати',
        ),
        canDelete
          ? createElement(
              'button',
              { type: 'button', className: 'btn btn-danger', onClick: onDelete },
              'Видалити',
            )
          : null,
      ),
    ),
  )
}
