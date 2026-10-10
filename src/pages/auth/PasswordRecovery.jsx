import { useRef, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AuthLayout from './AuthLayout'
import { customerApi } from '../../services/customer/customerApi'
import { authError, customerCopy } from '../../customer/customerCopy'
import { recoveryCopy } from '../../customer/recoveryCopy'
import { useCustomer } from '../../customer/context'
import { useInlineValidation } from '../../components/forms/useInlineValidation'
import { fieldValidators } from '../../components/forms/fieldValidation'
import { FieldError } from '../../components/forms/FieldError'
import { useRuntimeToken } from '../../customer/useRuntimeToken'

export default function PasswordRecovery({ reset = false }) {
  const location = useLocation()
  return <RecoveryForm key={`${reset}:${location.hash}`} reset={reset} />
}

function RecoveryForm({ reset }) {
  const { i18n } = useTranslation(), lang = i18n.language === 'en' ? 'en' : 'vi'
  const copy = customerCopy[lang], recovery = recoveryCopy[lang], prefix = lang === 'en' ? '/en' : ''
  const { customer, status, restore } = useCustomer()
  const token = useRuntimeToken()
  const [state, setState] = useState(reset && !/^[A-Za-z0-9_-]{43}$/.test(token.current || '') ? 'invalid' : 'form')
  const [busy, setBusy] = useState(false), [error, setError] = useState('')
  const pending = useRef(false)
  const rules = fieldValidators(lang)
  const validation = useInlineValidation(values => reset ? { password: rules.password(values.password), confirmPassword: rules.confirm(values.confirmPassword, values.password) } : { email: rules.email(values.email) })
  const submit = async event => {
    event.preventDefault()
    if (pending.current) return
    const data = Object.fromEntries(new FormData(event.currentTarget))
    if (!validation.validate(event.currentTarget)) return
    pending.current = true; setBusy(true); setError('')
    try {
      if (reset) {
        await customerApi.resetPassword({ token: token.current, password: data.password, confirmPassword: data.confirmPassword })
        token.current = null
        setState('success')
        await restore().catch(() => {})
      } else { await customerApi.forgotPassword({ email: data.email, locale: lang }); setState('sent') }
    } catch (err) {
      if (reset && err.message === 'INVALID_PASSWORD_RESET_TOKEN') setState('invalid')
      else setError(authError(err, copy))
    } finally { pending.current = false; setBusy(false) }
  }
  if (!reset && status === 'loading') return <AuthLayout title={recovery.forgot}><p role="status">{copy.loading}</p></AuthLayout>
  if (!reset && customer) return <Navigate replace to={`${prefix}/account/bookings`} />
  return <AuthLayout title={reset ? recovery.reset : recovery.forgot}>
    {error && <p role="alert">{error}</p>}
    {state === 'form' ? <form className="auth-form" noValidate {...validation.events} onSubmit={submit}>
      {!reset && <><p>{recovery.intro}</p><label className="auth-field">{copy.email}<input className="auth-input" name="email" type="email" autoComplete="email" required maxLength={254} disabled={busy} {...validation.field('email')} /><FieldError validation={validation} name="email" /></label></>}
      {reset && <><label className="auth-field">{recovery.newPassword}<input className="auth-input" name="password" type="password" autoComplete="new-password" required minLength={12} maxLength={256} disabled={busy} {...validation.field('password')} /><FieldError validation={validation} name="password" /></label><label className="auth-field">{copy.confirm}<input className="auth-input" name="confirmPassword" type="password" autoComplete="new-password" required minLength={12} maxLength={256} disabled={busy} {...validation.field('confirmPassword')} /><FieldError validation={validation} name="confirmPassword" /></label></>}
      <button className="auth-submit" disabled={busy}>{busy ? copy.loading : reset ? recovery.save : recovery.send}</button>
    </form> : <p role={state === 'invalid' ? 'alert' : 'status'}>{recovery[state]}</p>}
    {state === 'invalid' && <p><Link to={`${prefix}/forgot-password`}>{recovery.request}</Link></p>}
    <p className="auth-switch"><Link to={`${prefix}/login`}>{copy.login}</Link></p>
  </AuthLayout>
}
