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
import type { AdminTable, TableField, TableLayoutMode } from '../config/tables'
import EntityDetailModal from './EntityDetailModal'

type Row = Record<string, unknown> & { id: string }

type Props = {
  table: AdminTable
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

    const raw = form[field.key]?.trim() ?? ''
    if (!raw && isEdit) continue
    if (!raw && !field.required) continue

    switch (field.type) {
      case 'number':
        payload[field.key] = raw === '' ? null : Number(raw)
        break
      default:
        payload[field.key] = raw
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
  if (field.key === 'addressJson') {
    const text = String(value).trim()
    if (!text) return '—'
    return text.length > 56 ? `${text.slice(0, 56)}…` : text
  }
  if (field.key === 'imageUrl' || field.key === 'passwordHash') {
    const text = String(value).trim()
    if (!text) return '—'
    const limit = field.key === 'passwordHash' ? 32 : 48
    return text.length > limit ? `${text.slice(0, limit)}…` : text
  }
  return String(value)
}

const FLEX_COL_MIN = 88
const ADDRESS_JSON_WIDTH = 260
const FIXED_COL_WIDTH = {
  id: 320,
  createdAt: 168,
  updatedAt: 184,
  addressJson: ADDRESS_JSON_WIDTH,
} as const
const FIXED_COL_TOTAL = FIXED_COL_WIDTH.id + FIXED_COL_WIDTH.createdAt + FIXED_COL_WIDTH.updatedAt

function isTitleColumn(field: TableField): boolean {
  return field.key === 'title' || field.key === 'titleUk'
}

function isWideFlexColumn(field: TableField): boolean {
  return field.type === 'textarea' || field.key === 'content' || field.key === 'description'
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
  return estimateTextWidth(field, rows, FLEX_COL_MIN, 960)
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
  }
}

function computeCompactLayout(
  tableWidth: number,
  middleFields: TableField[],
  rows: Row[],
): ColumnLayout {
  const widths = fixedWidths()
  let middleTotal = 0

  for (const field of middleFields) {
    const w = isTitleColumn(field)
      ? estimateTitleWidth(field, rows)
      : estimateTextWidth(field, rows, FLEX_COL_MIN, 200)
    widths[field.key] = w
    middleTotal += w
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
    const w = Math.min(132, estimateTextWidth(field, rows, 72, 132))
    widths[field.key] = w
    budget -= w
  }

  const wideMins = wide.map((f) => estimateFlexColumnWidth(f, rows))

  if (wide.length > 0) {
    distributeWideColumnBudget(wide, wideMins, budget, widths)
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
    setLayout(computeColumnLayout(wrap.clientWidth, middleFields, rows, layoutMode))
  }, [tableWrapRef, middleFields, rows, layoutMode])

  useEffect(() => {
    recompute()
    const wrap = tableWrapRef.current
    if (!wrap) return
    const observer = new ResizeObserver(() => recompute())
    observer.observe(wrap)
    return () => observer.disconnect()
  }, [recompute, tableWrapRef])

  return layout
}

function stretchColClass(field: TableField): string {
  if (field.key === 'id') return 'col-id-fixed'
  if (field.key === 'addressJson') return 'col-address-json-fixed'
  if (field.key === 'updatedAt') return 'col-updated-at'
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
  if (field.key === 'updatedAt') parts.push('cell-updated-at')
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
  if (field.key === 'updatedAt') parts.push('cell-updated-at')
  return parts.join(' ')
}

function fkOptionLabel(item: Row, field: TableField): string {
  const primary = field.fkLabelKey ? String(item[field.fkLabelKey] ?? '').trim() : ''
  const secondary = field.fkLabelKey2 ? String(item[field.fkLabelKey2] ?? '').trim() : ''
  if (primary && secondary) return `${primary} (${secondary})`
  if (primary) return primary
  return String(item.id)
}

export default function EntityCrudPanel({ table }: Props) {
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

  const listFields = table.fields.filter((f) => f.list)
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
    setFormOpen(true)
  }

  const openEdit = (row: Row) => {
    setSelectedRow(null)
    setEditingId(row.id)
    setForm(rowToForm(row, formFields))
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditingId(null)
    setForm(emptyForm(formFields))
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const payload = formToPayload(form, formFields, editingId !== null)
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
      prev.size === rows.length ? new Set() : new Set(rows.map((row) => row.id)),
    )
  }

  const confirmBulkDelete = async () => {
    if (bulkSelectedIds.size === 0) return
    if (!window.confirm(`Видалити ${bulkSelectedIds.size} запис(ів)?`)) return
    setBulkDeleting(true)
    setError(null)
    try {
      await Promise.all(
        [...bulkSelectedIds].map((id) => adminDelete(table.resource, id)),
      )
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
                      checked={rows.length > 0 && bulkSelectedIds.size === rows.length}
                      onChange={toggleBulkSelectAll}
                    />
                  </th>
                ) : null}
                {middleListFields.map((f) => (
                  <th key={f.key} className={headerCellClassName(f)}>
                    <span className="cell-inner">{f.label}</span>
                  </th>
                ))}
                {hasGutter ? <th className="col-gutter" aria-hidden="true" /> : null}
                {tailListFields.map((f) => (
                  <th key={f.key} className={headerCellClassName(f)}>
                    <span className="cell-inner">{f.label}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const bulkSelected = bulkSelectedIds.has(row.id)
                return (
                <tr
                  key={row.id}
                  className={`table-row-clickable${
                    bulkDeleteMode
                      ? bulkSelected
                        ? ' table-row-bulk-selected'
                        : ''
                      : selectedRow?.id === row.id
                        ? ' table-row-selected'
                        : ''
                  }`}
                  onClick={() => {
                    if (bulkDeleteMode) {
                      toggleBulkSelect(row.id)
                      return
                    }
                    setSelectedRow(row)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      if (bulkDeleteMode) toggleBulkSelect(row.id)
                      else setSelectedRow(row)
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
                        type={field.type === 'number' ? 'number' : 'text'}
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
