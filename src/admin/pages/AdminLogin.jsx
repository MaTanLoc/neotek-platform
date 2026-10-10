import {useState} from 'react'
import {useLocation, useNavigate} from 'react-router-dom'
import {useAuth} from '../auth/useAuth'
import {AdminApiError} from '../../services/admin/adminApi'
import { useInlineValidation } from '../../components/forms/useInlineValidation'
import { fieldValidators } from '../../components/forms/fieldValidation'
import { FieldError } from '../../components/forms/FieldError'

export function AdminLogin() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const rules = fieldValidators('vi')
  const validation = useInlineValidation(values => ({ email: rules.email(values.email), password: rules.required(values.password) }))

  const submit = async (event) => {
    event.preventDefault()
    if (pending || !validation.validate(event.currentTarget)) return
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
      <form className="admin-card admin-login__card" noValidate {...validation.events} onSubmit={submit}>
        <img className="admin-brand-logo" src="/assets/logo/logo_306x98.png" alt="Neotek" /><p className="admin-kicker">Neotek Admin / CMS</p>
        <h1>Đăng nhập</h1>
        <p className="admin-muted">Đăng nhập để quản lý nội dung website Neotek.</p>
        {error && <div className="admin-alert admin-alert--error" role="alert">{error}</div>}
        <label>Email<input name="email" type="email" autoComplete="username" required value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} {...validation.field('email')} /><FieldError validation={validation} name="email" /></label>
        <label>Mật khẩu<input name="password" type="password" autoComplete="current-password" required value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} {...validation.field('password')} /><FieldError validation={validation} name="password" /></label>
        <button type="submit" className="admin-button admin-button--primary" disabled={pending}>{pending ? 'Đang đăng nhập…' : 'Đăng nhập'}</button>
      </form>
    </main>
  )
}
