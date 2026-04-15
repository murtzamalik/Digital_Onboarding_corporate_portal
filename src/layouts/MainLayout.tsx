import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { clearPortalAccessToken } from '../auth/token'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'layout__nav-link layout__nav-link--active' : 'layout__nav-link'

export function MainLayout() {
  const navigate = useNavigate()

  function signOut() {
    clearPortalAccessToken()
    navigate('/login', { replace: true })
  }

  return (
    <div className="layout">
      <header className="layout__header">
        <span className="layout__brand">Corporate Portal</span>
        <nav className="layout__nav" aria-label="Main">
          <NavLink to="/dashboard" className={navLinkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/batches" className={navLinkClass}>
            Batches
          </NavLink>
          <NavLink to="/reports" className={navLinkClass}>
            Reports
          </NavLink>
          <NavLink to="/notifications" className={navLinkClass}>
            Notifications
          </NavLink>
          <NavLink to="/users" className={navLinkClass}>
            Users
          </NavLink>
          <button type="button" className="layout__nav-link" onClick={signOut}>
            Sign out
          </button>
        </nav>
      </header>
      <main className="layout__main">
        <Outlet />
      </main>
    </div>
  )
}
