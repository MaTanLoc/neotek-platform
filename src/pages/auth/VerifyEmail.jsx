import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AuthLayout from './AuthLayout'
import { useCustomer } from '../../customer/context'
import { authError, customerCopy, safeReturn } from '../../customer/customerCopy'
import { customerApi } from '../../services/customer/customerApi'

export default function VerifyEmail() {
  const { i18n } = useTranslation(), lang = i18n.language === 'en' ? 'en' : 'vi', copy = customerCopy[lang], prefix = lang === 'en' ? '/en' : ''
  const [params] = useSearchParams(), { customer, restore } = useCustomer()
  const target = safeReturn(params.get('returnTo'), lang)
  const token = useRef(new URLSearchParams(window.location.hash.slice(1)).get('token'))
  const [state, setState] = useState(customer?.emailVerifiedAt ? 'verified' : 'pending')
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [cooldown, setCooldown] = useState(0)
  useEffect(() => { if (!cooldown) return; const timer = setTimeout(() => setCooldown(0), Math.max(0, cooldown - Date.now())); return () => clearTimeout(timer) }, [cooldown])
  const verify = async () => {
    setBusy(true); setError('')
    try { await customerApi.verify(token.current); window.history.replaceState(null, '', window.location.pathname + window.location.search); token.current = null; setState('verified'); await restore().catch(() => {}) }
    catch { setState('invalid') }
    finally { setBusy(false) }
  }
  const resend = async () => {
    setBusy(true); setError('')
    try { await customerApi.resend(lang); setState('resent'); setCooldown(Date.now() + 60000) }
    catch (err) { setError(authError(err, copy)) } finally { setBusy(false) }
  }
  return <AuthLayout title={copy.verify}>
    <p role="status">{customer?.emailVerifiedAt || state === 'verified' ? copy.verified : copy[state]}</p>
    {error && <p role="alert">{error}</p>}
    {token.current && state !== 'verified' && <button className="auth-submit" disabled={busy} onClick={verify}>{busy ? copy.loading : copy.verify}</button>}
    {customer && !customer.emailVerifiedAt && state !== 'verified' && <button className="auth-submit" disabled={busy || cooldown > Date.now()} onClick={resend}>{cooldown > Date.now() ? copy.resent : copy.resend}</button>}
    {!customer && <p><Link to={`${prefix}/login?returnTo=${encodeURIComponent(target)}`}>{copy.login}</Link></p>}
    {(customer?.emailVerifiedAt || state === 'verified') && <Link className="auth-submit" to={target}>{copy.continue}</Link>}
    <p><Link to={target}>{copy.back}</Link></p>
  </AuthLayout>
}
