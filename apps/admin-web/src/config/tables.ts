export type FieldType =
  | 'text'
  | 'number'
  | 'textarea'
  | 'checkbox'
  | 'uuid'
  | 'datetime'
  | 'fk'
  | 'enum'

export type EnumOption = {
  value: string
  label: string
}

export type TableField = {
  key: string
  label: string
  type: FieldType
  required?: boolean
  wide?: boolean
  list?: boolean
  /** false = only in table, not in create/edit form */
  form?: boolean
  /** Admin resource for fk select options */
  fkResource?: string
  fkLabelKey?: string
  fkLabelKey2?: string
  enumOptions?: EnumOption[]
}

export type TableLayoutMode = 'expand' | 'compact'

export type AdminTable = {
  id: string
  resource: string
  label: string
  fields: TableField[]
  /** compact: min-width cols + gutter before created_at */
  layoutMode?: TableLayoutMode
}

export const ADMIN_TABLES: AdminTable[] = [
  {
    id: 'locations',
    resource: 'locations',
    label: 'Локації',
    fields: [
      { key: 'id', label: 'ID', type: 'text', list: true, form: false },
      { key: 'title', label: 'Title', type: 'text', required: true, list: true },
      {
        key: 'locationTypeTitle',
        label: 'location_type',
        type: 'text',
        list: true,
        form: false,
      },
      {
        key: 'locationTypeId',
        label: 'location_type',
        type: 'fk',
        fkResource: 'location-types',
        fkLabelKey: 'titleUk',
        fkLabelKey2: 'code',
        required: true,
        form: true,
      },
      { key: 'latitude', label: 'latitude', type: 'number', required: true, list: true },
      { key: 'longitude', label: 'longitude', type: 'number', required: true, list: true },
      { key: 'description', label: 'Description', type: 'textarea', list: true, wide: true },
      { key: 'imageUrl', label: 'image_url', type: 'text', list: true },
      { key: 'addressJson', label: 'addressJson', type: 'textarea', list: true, wide: true },
      { key: 'createdAt', label: 'created_at', type: 'datetime', list: true, form: false },
      { key: 'updatedAt', label: 'updated_at', type: 'datetime', list: true, form: false },
    ],
  },
  {
    id: 'university-objects',
    resource: 'university-objects',
    label: 'Об’єкти',
    fields: [
      { key: 'id', label: 'ID', type: 'text', list: true, form: false },
      {
        key: 'locationTitle',
        label: 'location',
        type: 'text',
        list: true,
        form: false,
      },
      {
        key: 'objectTypeTitleUk',
        label: 'object_type',
        type: 'text',
        list: true,
        form: false,
      },
      {
        key: 'locationId',
        label: 'location',
        type: 'fk',
        fkResource: 'locations',
        fkLabelKey: 'title',
        required: true,
        form: true,
      },
      {
        key: 'objectTypeId',
        label: 'object_type',
        type: 'fk',
        fkResource: 'university-object-types',
        fkLabelKey: 'titleUk',
        fkLabelKey2: 'code',
        required: true,
        form: true,
      },
      { key: 'title', label: 'title', type: 'text', required: true, form: true },
      { key: 'description', label: 'description', type: 'textarea', list: true, wide: true },
      { key: 'createdAt', label: 'created_at', type: 'datetime', list: true, form: false },
      { key: 'updatedAt', label: 'updated_at', type: 'datetime', list: true, form: false },
    ],
  },
  {
    id: 'news',
    resource: 'news',
    label: 'Новини',
    fields: [
      { key: 'id', label: 'ID', type: 'text', list: true, form: false },
      { key: 'title', label: 'Title', type: 'text', required: true, list: true },
      { key: 'content', label: 'Content', type: 'textarea', required: true, list: true, wide: true },
      { key: 'isActive', label: 'is_active', type: 'checkbox', list: true },
      { key: 'createdAt', label: 'created_at', type: 'datetime', list: true, form: false },
      { key: 'updatedAt', label: 'updated_at', type: 'datetime', list: true, form: false },
    ],
  },
  {
    id: 'location-types',
    resource: 'location-types',
    label: 'Типи локацій',
    layoutMode: 'compact',
    fields: [
      { key: 'id', label: 'ID', type: 'text', list: true, form: false },
      { key: 'titleUk', label: 'title_uk', type: 'text', required: true, list: true },
      { key: 'code', label: 'code', type: 'text', required: true, list: true },
      { key: 'markerKey', label: 'marker_key', type: 'text', list: true },
      { key: 'createdAt', label: 'created_at', type: 'datetime', list: true, form: false },
      { key: 'updatedAt', label: 'updated_at', type: 'datetime', list: true, form: false },
    ],
  },
  {
    id: 'university-object-types',
    resource: 'university-object-types',
    label: 'Типи об’єктів',
    layoutMode: 'compact',
    fields: [
      { key: 'id', label: 'ID', type: 'text', list: true, form: false },
      { key: 'titleUk', label: 'title_uk', type: 'text', required: true, list: true },
      { key: 'code', label: 'code', type: 'text', required: true, list: true },
      { key: 'createdAt', label: 'created_at', type: 'datetime', list: true, form: false },
      { key: 'updatedAt', label: 'updated_at', type: 'datetime', list: true, form: false },
    ],
  },
]
