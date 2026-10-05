import { Navigate, Route, Routes, useLocation, useNavigate, Link } from 'react-router-dom'
import { useAuth } from './auth/useAuth'
import { AdminLogin } from './pages/AdminLogin'
import { PagesList } from './pages/PagesList'
import { PageEditor } from './pages/PageEditor'
import './admin.css'

function Protected({ children }) {
  const { status } = useAuth()
  const location = useLocation()
  if (status === 'loading') return <div className="admin-loading">Loading admin session…</div>
  if (status !== 'authenticated') return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  return children
}

function LoginRoute() {
  const { status } = useAuth()
  return status === 'authenticated' ? <Navigate to="/admin/pages" replace /> : <AdminLogin />
}

function Shell({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  return (
    <div className="admin-shell">
      <header className="admin-header">
        <Link to="/admin/pages" className="admin-brand">Neotek <span>Admin / CMS</span></Link>
        <div className="admin-user">
          <span>{user?.email}</span><strong>{user?.role}</strong>
          <button className="admin-button admin-button--ghost" onClick={async () => { await logout(); navigate('/admin/login', { replace: true }) }}>Log out</button>
        </div>
      </header>
      <div className="admin-body">
        <aside className="admin-sidebar"><Link to="/admin/pages">Pages</Link></aside>
        <main className="admin-main">{children}</main>
      </div>
    </div>
  )
}

export function AdminApp() {
  return (
    <Routes>
      <Route path="login" element={<LoginRoute />} />
      <Route path="pages" element={<Protected><Shell><PagesList /></Shell></Protected>} />
      <Route path="pages/:slug" element={<Protected><Shell><PageEditor /></Shell></Protected>} />
      <Route index element={<Navigate to="pages" replace />} />
      <Route path="*" element={<Navigate to="pages" replace />} />
    </Routes>
  )
}
