import { useState } from 'react'
import EntityCrudPanel from './components/EntityCrudPanel'
import { ADMIN_TABLES } from './config/tables'
import './App.css'

export default function AdminPanel() {
  const [activeId, setActiveId] = useState(ADMIN_TABLES[0].id)
  const activeTable = ADMIN_TABLES.find((t) => t.id === activeId) ?? ADMIN_TABLES[0]

  return (
    <div className="admin">
      <header className="admin-header">
        <h1>UniMap Admin</h1>
        <p>Керування даними (адмін панель)</p>
      </header>

      <div className="admin-workspace">
        <nav className="tabs" aria-label="Таблиці">
          {ADMIN_TABLES.map((table) => (
            <button
              key={table.id}
              type="button"
              className={`tab${table.id === activeId ? ' active' : ''}`}
              onClick={() => setActiveId(table.id)}
            >
              {table.label}
            </button>
          ))}
        </nav>

        <EntityCrudPanel key={activeTable.id} table={activeTable} />
      </div>
    </div>
  )
}
