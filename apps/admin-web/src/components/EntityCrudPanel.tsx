import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type RefObject,
} from 'react'
import {
  adminCreate,
  adminDelete,
  adminList,
  adminUpdate,
  AdminApiError,
} from '../api/adminApi'
import { SUPER_ADMIN_ROLE } from '../api/authApi'
import type { AdminTable, TableField, TableLayoutMode } from '../config/tables'
import { useAuth } from '../auth/AuthContext'
import EntityDetailModal from './EntityDetailModal'

type Row = Record<string, unknown> & { id: string }

type Props = {
  table: AdminTable
}

type ScheduleFormDay = {
  dayOfWeek: number
  openingAt: string
  closingAt: string
  isClosed: boolean
}

type ApiScheduleDay = {
  dayOfWeek?: unknown
  openingAt?: unknown
  closingAt?: unknown
  isClosed?: unknown
}

const WEEK_DAYS = [
  { value: 1, label: 'Понеділок' },
  { value: 2, label: 'Вівторок' },
  { value: 3, label: 'Середа' },
  { value: 4, label: 'Четвер' },
  { value: 5, label: 'Пʼятниця' },
  { value: 6, label: 'Субота' },
  { value: 7, label: 'Неділя' },
] as const

function emptyScheduleForm(): ScheduleFormDay[] {
  return WEEK_DAYS.map((day) => ({
    dayOfWeek: day.value,
    openingAt: '',
    closingAt: '',
    isClosed: false,
  }))
}

function timeToInput(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value).trim().slice(0, 5)
}

function rowToScheduleForm(row: Row): { enabled: boolean; days: ScheduleFormDay[] } {
  const raw = row.schedule
  if (!Array.isArray(raw) || raw.length === 0) {
    return { enabled: false, days: emptyScheduleForm() }
  }

  const byDay = new Map<number, ApiScheduleDay>()
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const scheduleDay = item as ApiScheduleDay
    const dayOfWeek = Number(scheduleDay.dayOfWeek)
    if (Number.isInteger(dayOfWeek)) byDay.set(dayOfWeek, scheduleDay)
  }

  return {
    enabled: true,
    days: WEEK_DAYS.map((day) => {
      const item = byDay.get(day.value)
      return {
        dayOfWeek: day.value,
        openingAt: timeToInput(item?.openingAt),
        closingAt: timeToInput(item?.closingAt),
        isClosed: Boolean(item?.isClosed),
      }
    }),
  }
}

function scheduleToPayload(enabled: boolean, days: ScheduleFormDay[]): unknown[] | null {
  if (!enabled) return []

  const hasIncompleteOpenDay = days.some(
    (day) => !day.isClosed && (!day.openingAt.trim() || !day.closingAt.trim()),
  )
  if (days.length !== 7 || hasIncompleteOpenDay) return null

  return days.map((day) => ({
    dayOfWeek: day.dayOfWeek,
    openingAt: day.isClosed ? null : day.openingAt,
    closingAt: day.isClosed ? null : day.closingAt,
    isClosed: day.isClosed,
  }))
}

function emptyForm(fields: TableField[]): Record<string, string> {
  const form: Record<string, string> = {}
  for (const field of fields) {
    if (field.type === 'checkbox') form[field.key] = 'false'
    else if (field.type === 'enum') form[field.key] = field.enumOptions?.[0]?.value ?? ''
    else form[field.key] = ''
  }
  return form
}

function rowToForm(row: Row, fields: TableField[]): Record<string, string> {
  const form = emptyForm(fields)
  for (const field of fields) {
    const value = row[field.key]
    if (field.type === 'checkbox') {
      form[field.key] = value ? 'true' : 'false'
    } else if (field.type === 'password') {
      form[field.key] = ''
    } else if (field.type === 'time' && value !== null && value !== undefined) {
      form[field.key] = String(value).slice(0, 5)
    } else if (value !== null && value !== undefined) {
      form[field.key] = String(value)
    }
  }
  return form
}

function formToPayload(
  form: Record<string, string>,
  fields: TableField[],
  isEdit: boolean,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  for (const field of fields) {
    if (field.type === 'checkbox') {
      payload[field.key] = form[field.key] === 'true'
      continue
    }

    const payloadKey = field.payloadKey ?? field.key
    const raw = form[field.key]?.trim() ?? ''
    if (!raw && isEdit) {
      if (!field.required && field.type !== 'password') {
        payload[payloadKey] = null
      }
      continue
    }
    if (!raw && !field.required) continue

    switch (field.type) {
      case 'number':
        payload[payloadKey] = raw === '' ? null : Number(raw)
        break
      default:
        payload[payloadKey] = raw
    }
  }
  return payload
}

function formatCell(value: unknown, field: TableField): string {
  if (value === null || value === undefined) return '—'
  if (field.type === 'checkbox') return value ? 'true' : 'false'
  if (field.type === 'datetime') {
    const date = new Date(String(value))
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('uk-UA')
  }
  if (field.type === 'time') {
    const text = String(value).trim()
    return text ? text.slice(0, 5) : '—'
  }
  if (field.key === 'addressJson') {
    const text = String(value).trim()
    if (!text) return '—'
    return text.length > 56 ? `${text.slice(0, 56)}…` : text
  }
  if (field.key === 'passwordHash') {
    const text = String(value).trim()
    return text ? '••••••••' : '—'
  }
  if (field.key === 'imageUrl') {
    const text = String(value).trim()
    if (!text) return '—'
    return text.length > 48 ? `${text.slice(0, 48)}…` : text
  }
  return String(value)
}

const FLEX_COL_MIN = 88
const ADDRESS_JSON_WIDTH = 260
/** header label + sort control (e.g. Description) */
const DESCRIPTION_COL_MIN = 172
const FIXED_COL_WIDTH = {
  id: 320,
  createdAt: 168,
  updatedAt: 184,
  lastLoginAt: 184,
  passwordHash: 152,
  addressJson: ADDRESS_JSON_WIDTH,
} as const
const FIXED_COL_TOTAL =
  FIXED_COL_WIDTH.id +
  FIXED_COL_WIDTH.createdAt +
  FIXED_COL_WIDTH.updatedAt +
  FIXED_COL_WIDTH.lastLoginAt

function isTitleColumn(field: TableField): boolean {
  return (
    field.key === 'title' ||
    field.key === 'titleUk' ||
    field.key === 'locationTitle' ||
    field.key === 'locationTypeTitle' ||
    field.key === 'objectTypeTitleUk'
  )
}

function isWideFlexColumn(field: TableField): boolean {
  return field.type === 'textarea' || field.key === 'content' || field.key === 'description'
}

function minListColumnWidth(field: TableField): number {
  if (field.key === 'description' || field.key === 'content') return DESCRIPTION_COL_MIN
  return 0
}

function isFixedDataColumn(field: TableField): boolean {
  return field.key === 'addressJson'
}

type ColumnLayout = {
  widths: Record<string, number>
  hasGutter: boolean
  tableMinWidth: number
}

function estimateTextWidth(field: TableField, rows: Row[], min = 88, max = 640): number {
  const maxChars = Math.max(
    field.label.length,
    ...rows.map((r) => formatCell(r[field.key], field).length),
    4,
  )
  return Math.min(max, Math.max(min, Math.ceil(maxChars * 7.2) + 32))
}

function estimateFlexColumnWidth(field: TableField, rows: Row[]): number {
  const min = Math.max(FLEX_COL_MIN, minListColumnWidth(field))
  return Math.max(min, estimateTextWidth(field, rows, min, 960))
}

function distributeWideColumnBudget(
  wide: TableField[],
  wideMins: number[],
  budget: number,
  widths: Record<string, number>,
): void {
  const wideSum = wideMins.reduce((sum, w) => sum + w, 0) || 1
  if (budget >= wideSum) {
    const extra = budget - wideSum
    wide.forEach((field, index) => {
      widths[field.key] = wideMins[index] + (wideMins[index] / wideSum) * extra
    })
    return
  }
  const perWide = Math.max(FLEX_COL_MIN, budget / wide.length)
  wide.forEach((field) => {
    widths[field.key] = perWide
  })
}

function estimateTitleWidth(field: TableField, rows: Row[]): number {
  return estimateTextWidth(field, rows, 160, 520)
}

function splitListFields(fields: TableField[]) {
  const createdIdx = fields.findIndex((f) => f.key === 'createdAt')
  if (createdIdx === -1) {
    return { middle: fields, tail: [] as TableField[] }
  }
  return {
    middle: fields.slice(0, createdIdx),
    tail: fields.slice(createdIdx),
  }
}

function fixedWidths(): Record<string, number> {
  return {
    id: FIXED_COL_WIDTH.id,
    createdAt: FIXED_COL_WIDTH.createdAt,
    updatedAt: FIXED_COL_WIDTH.updatedAt,
    lastLoginAt: FIXED_COL_WIDTH.lastLoginAt,
  }
}

function computeCompactLayout(
  tableWidth: number,
  middleFields: TableField[],
  rows: Row[],
): ColumnLayout {
  const widths = fixedWidths()

  for (const field of middleFields) {
    let w = isTitleColumn(field)
      ? estimateTitleWidth(field, rows)
      : estimateTextWidth(field, rows, FLEX_COL_MIN, 200)
    if (field.key === 'passwordHash') {
      w = Math.max(w, FIXED_COL_WIDTH.passwordHash)
    }
    const minW = minListColumnWidth(field)
    if (minW > 0) w = Math.max(w, minW)
    widths[field.key] = w
  }

  return {
    widths,
    hasGutter: true,
    tableMinWidth: tableWidth,
  }
}

function computeExpandLayout(
  tableWidth: number,
  middleFields: TableField[],
  rows: Row[],
): ColumnLayout {
  const widths = fixedWidths()
  const flexFields: TableField[] = []
  let titleTotal = 0

  let addressJsonTotal = 0

  for (const field of middleFields) {
    if (isFixedDataColumn(field)) {
      widths[field.key] = FIXED_COL_WIDTH.addressJson
      addressJsonTotal += FIXED_COL_WIDTH.addressJson
    } else if (isTitleColumn(field)) {
      const w = estimateTitleWidth(field, rows)
      widths[field.key] = w
      titleTotal += w
    } else {
      flexFields.push(field)
    }
  }

  const narrow = flexFields.filter((f) => !isWideFlexColumn(f))
  const wide = flexFields.filter((f) => isWideFlexColumn(f))

  let budget = Math.max(0, tableWidth - FIXED_COL_TOTAL - titleTotal - addressJsonTotal)

  for (const field of narrow) {
    let w = Math.min(132, estimateTextWidth(field, rows, 72, 132))
    if (field.key === 'passwordHash') {
      w = Math.max(w, FIXED_COL_WIDTH.passwordHash)
    }
    widths[field.key] = w
    budget -= w
  }

  const wideMins = wide.map((f) => estimateFlexColumnWidth(f, rows))

  if (wide.length > 0) {
    distributeWideColumnBudget(wide, wideMins, Math.max(budget, wideMins.reduce((s, w) => s + w, 0)), widths)
  }

  let middleTotal = 0
  for (const field of middleFields) middleTotal += widths[field.key] ?? 0
  const tableMinWidth = Math.max(tableWidth, FIXED_COL_TOTAL + middleTotal)

  return { widths, hasGutter: false, tableMinWidth }
}

function computeColumnLayout(
  tableWidth: number,
  middleFields: TableField[],
  rows: Row[],
  layoutMode: TableLayoutMode,
): ColumnLayout {
  return layoutMode === 'compact'
    ? computeCompactLayout(tableWidth, middleFields, rows)
    : computeExpandLayout(tableWidth, middleFields, rows)
}

function columnLayoutsEqual(a: ColumnLayout, b: ColumnLayout): boolean {
  if (a.hasGutter !== b.hasGutter || a.tableMinWidth !== b.tableMinWidth) return false
  const aKeys = Object.keys(a.widths)
  const bKeys = Object.keys(b.widths)
  if (aKeys.length !== bKeys.length) return false
  for (const key of aKeys) {
    if (a.widths[key] !== b.widths[key]) return false
  }
  return true
}

function useTableColumnLayout(
  tableWrapRef: RefObject<HTMLDivElement | null>,
  middleFields: TableField[],
  rows: Row[],
  layoutMode: TableLayoutMode,
): ColumnLayout {
  const [layout, setLayout] = useState<ColumnLayout>(() =>
    computeColumnLayout(1200, middleFields, rows, layoutMode),
  )

  const recompute = useCallback(() => {
    const wrap = tableWrapRef.current
    if (!wrap) return
    const next = computeColumnLayout(wrap.clientWidth, middleFields, rows, layoutMode)
    setLayout((prev) => (columnLayoutsEqual(prev, next) ? prev : next))
  }, [middleFields, rows, layoutMode])

  useEffect(() => {
    recompute()
    const wrap = tableWrapRef.current
    if (!wrap) return
    const observer = new ResizeObserver(() => recompute())
    observer.observe(wrap)
    return () => observer.disconnect()
  }, [recompute])

  return layout
}

function stretchColClass(field: TableField): string {
  if (field.key === 'id') return 'col-id-fixed'
  if (field.key === 'addressJson') return 'col-address-json-fixed'
  if (field.key === 'passwordHash') return 'col-password-hash'
  if (field.key === 'description' || field.key === 'content') return 'col-description-min'
  if (field.key === 'updatedAt' || field.key === 'lastLoginAt') return 'col-updated-at'
  if (field.key === 'createdAt') return 'col-datetime'
  if (isTitleColumn(field)) return 'col-title'
  return 'col-flex'
}

function bodyCellClassName(field: TableField, colWidths: Record<string, number>, rows: Row[]): string {
  const parts = [stretchColClass(field)]
  if (
    field.key === 'id' ||
    field.key === 'isActive' ||
    field.type === 'uuid' ||
    field.type === 'fk' ||
    field.type === 'datetime'
  ) {
    parts.push('cell-mono')
  }
  if (field.type === 'datetime') parts.push('cell-datetime')
  if (field.key === 'updatedAt' || field.key === 'lastLoginAt') parts.push('cell-updated-at')
  if (field.key === 'addressJson') parts.push('cell-address-json')
  if (field.key === 'imageUrl' || field.key === 'passwordHash') parts.push('cell-collapsed')
  const width = colWidths[field.key]
  if (
    width !== undefined &&
    !isTitleColumn(field) &&
    stretchColClass(field) === 'col-flex' &&
    width + 4 >= estimateFlexColumnWidth(field, rows)
  ) {
    parts.push('col-flex-expanded')
  }
  return parts.join(' ')
}

function headerCellClassName(field: TableField): string {
  const parts = [stretchColClass(field)]
  if (field.key === 'updatedAt' || field.key === 'lastLoginAt') parts.push('cell-updated-at')
  if (field.key === 'passwordHash') parts.push('cell-header-full')
  return parts.join(' ')
}

type SortDir = 'asc' | 'desc'

type SortState = {
  key: string
  dir: SortDir
}

function getSortValue(value: unknown, field: TableField): string | number | boolean | null {
  if (value === null || value === undefined || value === '') return null
  if (field.type === 'checkbox') return Boolean(value)
  if (field.type === 'number') {
    const n = Number(value)
    return Number.isNaN(n) ? null : n
  }
  if (field.type === 'datetime') {
    const t = new Date(String(value)).getTime()
    return Number.isNaN(t) ? null : t
  }
  return String(value).toLocaleLowerCase('uk')
}

function compareRows(a: Row, b: Row, field: TableField, dir: SortDir): number {
  const va = getSortValue(a[field.key], field)
  const vb = getSortValue(b[field.key], field)
  const mult = dir === 'asc' ? 1 : -1

  if (va === null && vb === null) return 0
  if (va === null) return 1
  if (vb === null) return -1

  if (typeof va === 'number' && typeof vb === 'number') return mult * (va - vb)
  if (typeof va === 'boolean' && typeof vb === 'boolean') {
    return mult * (Number(va) - Number(vb))
  }
  return mult * String(va).localeCompare(String(vb), 'uk')
}

function sortIndicator(sort: SortState | null, fieldKey: string): string {
  if (sort?.key !== fieldKey) return '↕'
  return sort.dir === 'asc' ? '↑' : '↓'
}

function fkOptionLabel(item: Row, field: TableField): string {
  const primary = field.fkLabelKey ? String(item[field.fkLabelKey] ?? '').trim() : ''
  const secondary = field.fkLabelKey2 ? String(item[field.fkLabelKey2] ?? '').trim() : ''
  if (primary && secondary) return `${primary} (${secondary})`
  if (primary) return primary
  return String(item.id)
}

export default function EntityCrudPanel({ table }: Props) {
  const { user } = useAuth()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRow, setSelectedRow] = useState<Row | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const formFields = useMemo(
    () => table.fields.filter((f) => f.form !== false),
    [table],
  )
  const [form, setForm] = useState(() => emptyForm(formFields))
  const [saving, setSaving] = useState(false)
  const [fkOptions, setFkOptions] = useState<Record<string, Row[]>>({})
  const [fkLoading, setFkLoading] = useState(false)
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false)
  const [bulkSelectedIds, setBulkSelectedIds] = useState<Set<string>>(() => new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [sort, setSort] = useState<SortState | null>(null)
  const [scheduleEnabled, setScheduleEnabled] = useState(false)
  const [scheduleDays, setScheduleDays] = useState<ScheduleFormDay[]>(() => emptyScheduleForm())

  const listFields = useMemo(() => table.fields.filter((f) => f.list), [table.fields])
  const { middle: middleListFields, tail: tailListFields } = useMemo(
    () => splitListFields(listFields),
    [listFields],
  )
  const tableWrapRef = useRef<HTMLDivElement>(null)
  const layoutMode = table.layoutMode ?? 'expand'
  const { widths: colWidths, hasGutter, tableMinWidth } = useTableColumnLayout(
    tableWrapRef,
    middleListFields,
    rows,
    layoutMode,
  )
  const canDeleteRow = useCallback(
    (row: Row) => {
      if (table.id !== 'admins') return true
      if (!user) return false
      if (row.id === user.id) return false
      return row.role !== SUPER_ADMIN_ROLE
    },
    [table.id, user],
  )

  const deletableRows = useMemo(
    () => rows.filter(canDeleteRow),
    [rows, canDeleteRow],
  )

  const sortedRows = useMemo(() => {
    if (!sort) return rows
    const field = listFields.find((f) => f.key === sort.key)
    if (!field) return rows
    return [...rows].sort((a, b) => compareRows(a, b, field, sort.dir))
  }, [rows, sort, listFields])

  const toggleSort = (key: string) => {
    setSort((prev) => {
      if (prev?.key === key) return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
      return { key, dir: 'asc' }
    })
  }

  const fkResources = useMemo(
    () => [
      ...new Set(
        formFields
          .filter((f) => f.type === 'fk' && f.fkResource)
          .map((f) => f.fkResource as string),
      ),
    ],
    [formFields],
  )

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await adminList<Row>(table.resource)
      setRows(data)
    } catch (e) {
      setError(e instanceof AdminApiError ? e.message : 'Не вдалося завантажити дані')
    } finally {
      setLoading(false)
    }
  }, [table.resource])

  useEffect(() => {
    void load()
    setSelectedRow(null)
    setFormOpen(false)
    setEditingId(null)
    setForm(emptyForm(formFields))
    setFkOptions({})
    setBulkDeleteMode(false)
    setBulkSelectedIds(new Set())
    setSort(null)
    setScheduleEnabled(false)
    setScheduleDays(emptyScheduleForm())
  }, [table, load, formFields])

  useEffect(() => {
    if (!formOpen || fkResources.length === 0) {
      setFkOptions({})
      setFkLoading(false)
      return
    }

    let cancelled = false
    setFkLoading(true)
    void (async () => {
      try {
        const entries = await Promise.all(
          fkResources.map(async (resource) => {
            const data = await adminList<Row>(resource)
            return [resource, data] as const
          }),
        )
        if (!cancelled) setFkOptions(Object.fromEntries(entries))
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof AdminApiError ? e.message : 'Не вдалося завантажити списки')
        }
      } finally {
        if (!cancelled) setFkLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [formOpen, fkResources])

  const openCreate = () => {
    setSelectedRow(null)
    setEditingId(null)
    setForm(emptyForm(formFields))
    setScheduleEnabled(false)
    setScheduleDays(emptyScheduleForm())
    setFormOpen(true)
  }

  const openEdit = (row: Row) => {
    setSelectedRow(null)
    setEditingId(row.id)
    setForm(rowToForm(row, formFields))
    const schedule = rowToScheduleForm(row)
    setScheduleEnabled(schedule.enabled)
    setScheduleDays(schedule.days)
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditingId(null)
    setForm(emptyForm(formFields))
    setScheduleEnabled(false)
    setScheduleDays(emptyScheduleForm())
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      let payload = formToPayload(form, formFields, editingId !== null)
      if (table.id === 'admins') {
        const plainPassword = form.password?.trim()
        if (plainPassword) payload = { ...payload, passwordHash: plainPassword }
        const rest = { ...payload }
        delete rest.password
        payload = rest
      }
      if (table.id === 'locations') {
        const schedulePayload = scheduleToPayload(scheduleEnabled, scheduleDays)
        if (schedulePayload === null) {
          setError('Розклад потрібно заповнити для всіх 7 днів або залишити порожнім.')
          setSaving(false)
          return
        }
        payload = { ...payload, schedule: schedulePayload }
      }
      if (editingId) {
        await adminUpdate(table.resource, editingId, payload)
      } else {
        await adminCreate(table.resource, payload)
      }
      closeForm()
      await load()
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : 'Помилка збереження')
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async (id: string) => {
    const row = rows.find((r) => r.id === id)
    if (row && !canDeleteRow(row)) {
      setError(
        row.id === user?.id
          ? 'Неможливо видалити власний обліковий запис.'
          : 'Обліковий запис super_admin не можна видалити.',
      )
      return
    }
    if (!window.confirm('Видалити запис?')) return
    setError(null)
    try {
      await adminDelete(table.resource, id)
      if (selectedRow?.id === id) setSelectedRow(null)
      if (editingId === id) closeForm()
      await load()
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : 'Помилка видалення')
    }
  }

  const startBulkDelete = () => {
    setBulkDeleteMode(true)
    setBulkSelectedIds(new Set())
    setSelectedRow(null)
    setFormOpen(false)
    setEditingId(null)
    setForm(emptyForm(formFields))
    setScheduleEnabled(false)
    setScheduleDays(emptyScheduleForm())
  }

  const cancelBulkDelete = () => {
    setBulkDeleteMode(false)
    setBulkSelectedIds(new Set())
  }

  const toggleBulkSelect = (id: string) => {
    setBulkSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleBulkSelectAll = () => {
    setBulkSelectedIds((prev) =>
      prev.size === deletableRows.length
        ? new Set()
        : new Set(deletableRows.map((row) => row.id)),
    )
  }

  const confirmBulkDelete = async () => {
    const ids = [...bulkSelectedIds].filter((id) => {
      const row = rows.find((r) => r.id === id)
      return row && canDeleteRow(row)
    })
    if (ids.length === 0) return
    if (!window.confirm(`Видалити ${ids.length} запис(ів)?`)) return
    setBulkDeleting(true)
    setError(null)
    try {
      await Promise.all(ids.map((id) => adminDelete(table.resource, id)))
      cancelBulkDelete()
      await load()
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : 'Помилка видалення')
    } finally {
      setBulkDeleting(false)
    }
  }

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const updateScheduleDay = (
    dayOfWeek: number,
    patch: Partial<Omit<ScheduleFormDay, 'dayOfWeek'>>,
  ) => {
    setScheduleDays((prev) =>
      prev.map((day) =>
        day.dayOfWeek === dayOfWeek
          ? {
              ...day,
              ...patch,
              openingAt: patch.isClosed ? '' : patch.openingAt ?? day.openingAt,
              closingAt: patch.isClosed ? '' : patch.closingAt ?? day.closingAt,
            }
          : day,
      ),
    )
  }

  return (
    <section className="panel">
      <div className="toolbar">
        <h2>{table.label}</h2>
        <div className="toolbar-actions">
          {bulkDeleteMode ? (
            <>
              <button type="button" className="btn" onClick={cancelBulkDelete} disabled={bulkDeleting}>
                Скасувати
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={bulkSelectedIds.size === 0 || bulkDeleting}
                onClick={() => void confirmBulkDelete()}
              >
                {bulkDeleting
                  ? 'Видалення…'
                  : `Видалити вибрані (${bulkSelectedIds.size})`}
              </button>
            </>
          ) : (
            <>
              <button type="button" className="btn btn-danger" onClick={startBulkDelete}>
                Видалити
              </button>
              <button type="button" className="btn btn-primary" onClick={openCreate}>
                Додати
              </button>
            </>
          )}
        </div>
      </div>

      {error ? <div className="status error">{error}</div> : null}

      {loading ? (
        <div className="status">Завантаження…</div>
      ) : rows.length === 0 ? (
        <div className="status">Записів немає</div>
      ) : (
        <div
          ref={tableWrapRef}
          className={`table-wrap${bulkDeleteMode ? ' table-wrap-delete-mode' : ''}`}
        >
          <table className="table-stretch" style={{ minWidth: tableMinWidth }}>
            <colgroup>
              {bulkDeleteMode ? <col className="col-select" style={{ width: 44 }} /> : null}
              {middleListFields.map((f) => (
                <col
                  key={f.key}
                  className={stretchColClass(f)}
                  style={colWidths[f.key] ? { width: colWidths[f.key] } : undefined}
                />
              ))}
              {hasGutter ? <col className="col-gutter" /> : null}
              {tailListFields.map((f) => (
                <col
                  key={f.key}
                  className={stretchColClass(f)}
                  style={colWidths[f.key] ? { width: colWidths[f.key] } : undefined}
                />
              ))}
            </colgroup>
            <thead>
              <tr>
                {bulkDeleteMode ? (
                  <th className="col-select">
                    <input
                      type="checkbox"
                      aria-label="Вибрати всі"
                      checked={
                        deletableRows.length > 0 &&
                        bulkSelectedIds.size === deletableRows.length
                      }
                      disabled={deletableRows.length === 0}
                      onChange={toggleBulkSelectAll}
                    />
                  </th>
                ) : null}
                {middleListFields.map((f) => (
                  <th
                    key={f.key}
                    className={`${headerCellClassName(f)} th-sortable${sort?.key === f.key ? ' th-sort-active' : ''}`}
                    onClick={() => toggleSort(f.key)}
                    aria-sort={
                      sort?.key === f.key
                        ? sort.dir === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                  >
                    <span className="th-sort-inner">
                      <span className="cell-inner">{f.label}</span>
                      <span className="th-sort-indicator" aria-hidden="true">
                        {sortIndicator(sort, f.key)}
                      </span>
                    </span>
                  </th>
                ))}
                {hasGutter ? <th className="col-gutter" aria-hidden="true" /> : null}
                {tailListFields.map((f) => (
                  <th
                    key={f.key}
                    className={`${headerCellClassName(f)} th-sortable${sort?.key === f.key ? ' th-sort-active' : ''}`}
                    onClick={() => toggleSort(f.key)}
                    aria-sort={
                      sort?.key === f.key
                        ? sort.dir === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                  >
                    <span className="th-sort-inner">
                      <span className="cell-inner">{f.label}</span>
                      <span className="th-sort-indicator" aria-hidden="true">
                        {sortIndicator(sort, f.key)}
                      </span>
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row) => {
                const bulkSelected = bulkSelectedIds.has(row.id)
                const rowDeletable = canDeleteRow(row)
                return (
                <tr
                  key={row.id}
                  className={`table-row-clickable${
                    bulkDeleteMode
                      ? bulkSelected
                        ? ' table-row-bulk-selected'
                        : !rowDeletable
                          ? ' table-row-bulk-disabled'
                          : ''
                      : selectedRow?.id === row.id
                        ? ' table-row-selected'
                        : ''
                  }`}
                  onClick={() => {
                    if (bulkDeleteMode) {
                      if (rowDeletable) toggleBulkSelect(row.id)
                      return
                    }
                    setSelectedRow(row)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      if (bulkDeleteMode) {
                        if (rowDeletable) toggleBulkSelect(row.id)
                      } else setSelectedRow(row)
                    }
                  }}
                  tabIndex={0}
                  aria-label={bulkDeleteMode ? 'Вибрати запис' : 'Відкрити деталі запису'}
                >
                  {bulkDeleteMode ? (
                    <td
                      className="col-select"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        aria-label="Вибрати запис"
                        checked={bulkSelected}
                        disabled={!rowDeletable}
                        onChange={() => toggleBulkSelect(row.id)}
                      />
                    </td>
                  ) : null}
                  {middleListFields.map((f) => {
                    const cellClass = bodyCellClassName(f, colWidths, rows)
                    return (
                      <td
                        key={f.key}
                        className={cellClass}
                        title={
                          cellClass.includes('col-flex-expanded') || isTitleColumn(f)
                            ? undefined
                            : String(row[f.key] ?? '')
                        }
                      >
                        <span className="cell-inner">{formatCell(row[f.key], f)}</span>
                      </td>
                    )
                  })}
                  {hasGutter ? <td className="col-gutter" aria-hidden="true" /> : null}
                  {tailListFields.map((f) => (
                    <td
                      key={f.key}
                      className={bodyCellClassName(f, colWidths, rows)}
                      title={String(row[f.key] ?? '')}
                    >
                      <span className="cell-inner">{formatCell(row[f.key], f)}</span>
                    </td>
                  ))}
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      )}

      {selectedRow ? (
        <EntityDetailModal
          table={table}
          row={selectedRow}
          onClose={() => setSelectedRow(null)}
          onEdit={() => openEdit(selectedRow)}
          onDelete={() => void onDelete(selectedRow.id)}
          canDelete={canDeleteRow(selectedRow)}
        />
      ) : null}

      {formOpen ? (
        <form className="form-panel" onSubmit={(e) => void onSubmit(e)}>
          <h3>{editingId ? 'Редагування' : 'Новий запис'}</h3>
          <div className="form-grid">
            {formFields.map((field) => (
              <div
                key={field.key}
                className={`form-field${field.type === 'checkbox' ? ' checkbox-field' : ''}`}
              >
                {field.type === 'checkbox' ? (
                  <>
                    <input
                      id={field.key}
                      type="checkbox"
                      checked={form[field.key] === 'true'}
                      onChange={(e) =>
                        updateField(field.key, e.target.checked ? 'true' : 'false')
                      }
                    />
                    <label htmlFor={field.key}>{field.label}</label>
                  </>
                ) : (
                  <>
                    <label htmlFor={field.key}>
                      {field.label}
                      {field.required ? ' *' : ''}
                    </label>
                    {field.type === 'fk' ? (
                      <select
                        id={field.key}
                        value={form[field.key]}
                        onChange={(e) => updateField(field.key, e.target.value)}
                        required={field.required && !editingId}
                        disabled={fkLoading}
                      >
                        <option value="">{fkLoading ? 'Завантаження…' : '—'}</option>
                        {(fkOptions[field.fkResource ?? ''] ?? []).map((item) => (
                          <option key={item.id} value={item.id}>
                            {fkOptionLabel(item, field)}
                          </option>
                        ))}
                      </select>
                    ) : field.type === 'enum' ? (
                      <select
                        id={field.key}
                        value={form[field.key]}
                        onChange={(e) => updateField(field.key, e.target.value)}
                        required={field.required && !editingId}
                      >
                        {!field.required || editingId ? <option value="">—</option> : null}
                        {(field.enumOptions ?? []).map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : field.type === 'textarea' ? (
                      <textarea
                        id={field.key}
                        value={form[field.key]}
                        onChange={(e) => updateField(field.key, e.target.value)}
                        required={field.required && !editingId}
                      />
                    ) : (
                      <input
                        id={field.key}
                        type={
                          field.type === 'number'
                            ? 'number'
                            : field.type === 'time'
                              ? 'time'
                            : field.type === 'password'
                              ? 'password'
                              : 'text'
                        }
                        autoComplete={field.type === 'password' ? 'new-password' : undefined}
                        step={field.type === 'number' ? 'any' : undefined}
                        value={form[field.key]}
                        onChange={(e) => updateField(field.key, e.target.value)}
                        required={field.required && !editingId}
                      />
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
          {table.id === 'locations' ? (
            <section className="schedule-editor">
              <label className="schedule-toggle">
                <input
                  type="checkbox"
                  checked={scheduleEnabled}
                  onChange={(e) => {
                    setScheduleEnabled(e.target.checked)
                    if (!e.target.checked) setScheduleDays(emptyScheduleForm())
                  }}
                />
                <span>Додати розклад</span>
              </label>
              {scheduleEnabled ? (
                <div className="schedule-grid" aria-label="Розклад локації">
                  {WEEK_DAYS.map((weekDay) => {
                    const day = scheduleDays.find((item) => item.dayOfWeek === weekDay.value)
                    if (!day) return null
                    return (
                      <div className="schedule-row" key={weekDay.value}>
                        <div className="schedule-day-name">{weekDay.label}</div>
                        <label className="schedule-closed">
                          <input
                            type="checkbox"
                            checked={day.isClosed}
                            onChange={(e) =>
                              updateScheduleDay(weekDay.value, {
                                isClosed: e.target.checked,
                              })
                            }
                          />
                          Закрито
                        </label>
                        <div className="schedule-time-field">
                          <span>Відкриття</span>
                          <input
                            type="time"
                            value={day.openingAt}
                            disabled={day.isClosed}
                            required={scheduleEnabled && !day.isClosed}
                            onChange={(e) =>
                              updateScheduleDay(weekDay.value, {
                                openingAt: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="schedule-time-field">
                          <span>Закриття</span>
                          <input
                            type="time"
                            value={day.closingAt}
                            disabled={day.isClosed}
                            required={scheduleEnabled && !day.isClosed}
                            onChange={(e) =>
                              updateScheduleDay(weekDay.value, {
                                closingAt: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : null}
            </section>
          ) : null}
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Збереження…' : 'Зберегти'}
            </button>
            <button type="button" className="btn" onClick={closeForm} disabled={saving}>
              Скасувати
            </button>
          </div>
        </form>
      ) : null}
    </section>
  )
}
