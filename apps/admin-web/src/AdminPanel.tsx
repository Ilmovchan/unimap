import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatAdminRoleLabel, isSuperAdmin } from './api/authApi'
import { useAuth } from './auth/AuthContext'
import EntityCrudPanel from './components/EntityCrudPanel'
import { getVisibleAdminTables } from './config/tables'
import './App.css'

export default function AdminPanel() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const tables = useMemo(
    () => getVisibleAdminTables(user?.role),
    [user?.role],
  )
  const [activeId, setActiveId] = useState(() => tables[0]?.id ?? 'locations')
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    if (!tables.some((t) => t.id === activeId) && tables[0]) {
      setActiveId(tables[0].id)
    }
  }, [tables, activeId])

  const activeTable = tables.find((t) => t.id === activeId) ?? tables[0]

  const onLogout = async () => {
    setLoggingOut(true)
    try {
      await logout()
      navigate('/', { replace: true })
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <div className="admin">
      <header className="admin-header">
        <div className="admin-header-row">
          <div>
            <h1>UniMap Admin</h1>
            <p>Керування даними (адмін панель)</p>
          </div>
          <div className="admin-header-actions">
            {user ? (
              <div className="admin-session">
                <span
                  className={`admin-role-badge${isSuperAdmin(user.role) ? ' admin-role-badge-super' : ''}`}
                >
                  {formatAdminRoleLabel(user.role)}
                </span>
                <span className="admin-user" title={user.email}>
                  {user.username || user.email}
                </span>
              </div>
            ) : null}
            <button
              type="button"
              className="btn"
              onClick={onLogout}
              disabled={loggingOut}
            >
              {loggingOut ? 'Вихід…' : 'Вийти'}
            </button>
          </div>
        </div>
      </header>

      <div className="admin-workspace">
        <nav className="tabs" aria-label="Таблиці">
          {tables.map((table) => (
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

        {activeTable ? (
          <EntityCrudPanel key={activeTable.id} table={activeTable} />
        ) : null}
      </div>
    </div>
  )
}
