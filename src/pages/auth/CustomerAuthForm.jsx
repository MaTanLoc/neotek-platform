import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AuthLayout from './AuthLayout'
import { useCustomer } from '../../customer/context'
import { authError, customerCopy, safeReturn } from '../../customer/customerCopy'
import { customerApi } from '../../services/customer/customerApi'
import { recoveryCopy } from '../../customer/recoveryCopy'

export default function CustomerAuthForm({ register = false }) {
  const { i18n } = useTranslation()
  const lang = i18n.language === 'en' ? 'en' : 'vi', copy = customerCopy[lang], prefix = lang === 'en' ? '/en' : ''
  const [params] = useSearchParams(), navigate = useNavigate(), { login } = useCustomer()
  const target = safeReturn(params.get('returnTo'), lang)
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [done, setDone] = useState(false)
  const [show, setShow] = useState(false)
  const submit = async event => {
    event.preventDefault()
    if (busy) return
    const data = Object.fromEntries(new FormData(event.currentTarget))
    if (register && data.password !== data.confirm) { setError(copy.mismatch); return }
    setBusy(true); setError('')
    try {
      if (register) { await customerApi.register({ email: data.email, name: data.name, password: data.password, locale: lang }); setDone(true) }
      else { const customer = await login({ email: data.email, password: data.password }); navigate(customer.emailVerifiedAt ? target : `${prefix}/verify-email?returnTo=${encodeURIComponent(target)}`, { replace: true }) }
    } catch (err) { setError(authError(err, copy)) }
    finally { setBusy(false) }
  }
  const query = `?returnTo=${encodeURIComponent(target)}`
  return <AuthLayout mode={register ? 'register' : 'login'} title={register ? copy.register : copy.login}>
    {done ? <div role="status"><p>{copy.sent}</p><Link className="auth-submit" to={`${prefix}/login${query}`}>{copy.login}</Link></div> : <form className="auth-form" onSubmit={submit}>
      {error && <p role="alert">{error}</p>}
      {register && <label className="auth-field">{copy.name}<input className="auth-input" name="name" required maxLength={120} autoComplete="name" /></label>}
      <label className="auth-field">{copy.email}<input className="auth-input" name="email" type="email" required maxLength={254} autoComplete="email" /></label>
      <label className="auth-field">{copy.password}<input className="auth-input" name="password" type={show ? 'text' : 'password'} required minLength={12} maxLength={256} autoComplete={register ? 'new-password' : 'current-password'} /></label>
      <label><input type="checkbox" checked={show} onChange={e => setShow(e.target.checked)} /> {lang === 'en' ? 'Show password' : 'Hiện mật khẩu'}</label>
      {register && <label className="auth-field">{copy.confirm}<input className="auth-input" name="confirm" type={show ? 'text' : 'password'} required minLength={12} maxLength={256} autoComplete="new-password" /></label>}
      <button className="auth-submit" disabled={busy}>{busy ? copy.loading : register ? copy.register : copy.login}</button>
      <p className="auth-switch"><Link to={`${prefix}/${register ? 'login' : 'register'}${query}`}>{register ? copy.login : copy.register}</Link></p>
      {!register && <p className="auth-switch"><Link to={`${prefix}/forgot-password`}>{recoveryCopy[lang].forgot}</Link></p>}
      <Link to={target}>{copy.back}</Link>
    </form>}
  </AuthLayout>
}
