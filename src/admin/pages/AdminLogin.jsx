import {useState} from 'react'
import {useLocation, useNavigate} from 'react-router-dom'
import {useAuth} from '../auth/useAuth'
import {AdminApiError} from '../../services/admin/adminApi'

export function AdminLogin() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    setPending(true); setError('')
    try {
      await login(form.email, form.password)
      navigate(location.state?.from || '/admin/pages', { replace: true })
    } catch (requestError) {
      setError(requestError instanceof AdminApiError && requestError.status === 429
        ? 'Bạn đã thử đăng nhập quá nhiều lần. Vui lòng chờ rồi thử lại.'
        : 'Email hoặc mật khẩu không đúng.')
    } finally { setPending(false) }
  }

  return (
    <main className="admin-login">
      <form className="admin-card admin-login__card" onSubmit={submit}>
        <img className="admin-brand-logo" src="/assets/logo/logo_306x98.png" alt="Neotek" /><p className="admin-kicker">Neotek Admin / CMS</p>
        <h1>Đăng nhập</h1>
        <p className="admin-muted">Đăng nhập để quản lý nội dung website Neotek.</p>
        {error && <div className="admin-alert admin-alert--error" role="alert">{error}</div>}
        <label>Email<input type="email" autoComplete="username" required value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} /></label>
        <label>Mật khẩu<input type="password" autoComplete="current-password" required value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} /></label>
        <button className="admin-button admin-button--primary" disabled={pending}>{pending ? 'Đang đăng nhập…' : 'Đăng nhập'}</button>
      </form>
    </main>
  )
}
