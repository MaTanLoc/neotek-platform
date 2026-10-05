import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { AdminApiError } from '../../services/admin/adminApi'

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
        ? requestError.message
        : 'Invalid email or password.')
    } finally { setPending(false) }
  }

  return (
    <main className="admin-login">
      <form className="admin-card admin-login__card" onSubmit={submit}>
        <p className="admin-kicker">Neotek Admin / CMS</p>
        <h1>Sign in</h1>
        <p className="admin-muted">Use your admin account to manage website content.</p>
        {error && <div className="admin-alert admin-alert--error" role="alert">{error}</div>}
        <label>Email<input type="email" autoComplete="username" required value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} /></label>
        <label>Password<input type="password" autoComplete="current-password" required value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} /></label>
        <button className="admin-button admin-button--primary" disabled={pending}>{pending ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </main>
  )
}
