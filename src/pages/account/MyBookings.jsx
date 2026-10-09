import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AuthLayout from '../auth/AuthLayout'
import { useCustomer } from '../../customer/context'
import { authError, customerCopy, statusLabel } from '../../customer/customerCopy'
import { customerApi } from '../../services/customer/customerApi'
import './my-bookings.css'

export default function MyBookings() {
  const { i18n } = useTranslation(), lang = i18n.language === 'en' ? 'en' : 'vi', copy = customerCopy[lang], prefix = lang === 'en' ? '/en' : ''
  const { customer, status, logout, restore } = useCustomer()
  const [result, setResult] = useState(null), [error, setError] = useState(''), [page, setPage] = useState(1), [tab, setTab] = useState('upcoming'), [refresh, setRefresh] = useState(0)
  useEffect(() => {
    let active = true
    if (!customer) return
    setResult(null)
    customerApi.bookings(page, tab).then(data => { if (active) { setResult(data); setError('') } }).catch(err => { if (active) setError(authError(err, copy)); if (err.status === 401) restore().catch(() => {}) })
    return () => { active = false }
  }, [customer, page, tab, refresh, copy, restore])
  if (status === 'loading') return <AuthLayout title={copy.bookings}><p>{copy.loading}</p></AuthLayout>
  if (!customer) return <AuthLayout title={copy.bookings}>{status === 'error' ? <button onClick={() => restore().catch(() => {})}>{copy.retry}</button> : <Link to={`${prefix}/login?returnTo=${encodeURIComponent(`${prefix}/account/bookings`)}`}>{copy.login}</Link>}</AuthLayout>
  const date = value => new Date(value).toLocaleString(lang === 'en' ? 'en-GB' : 'vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
  const items = result?.items ?? []
  return <AuthLayout title={copy.bookings}>
    <nav className="customer-actions"><Link to={`${prefix}/booking`}>{copy.continue}</Link><button onClick={() => logout().catch(err => setError(authError(err, copy)))}>{copy.logout}</button></nav>
    <div className="customer-actions">{['upcoming', 'past'].map(value => <button key={value} aria-pressed={tab === value} onClick={() => { setTab(value); setPage(1) }}>{copy[value]}</button>)}</div>
    {error && <p role="alert">{error} <button onClick={() => setRefresh(n => n + 1)}>{copy.retry}</button></p>}
    {!result && !error && <p>{copy.loading}</p>}
    {result && !items.length && <p>{copy.empty}</p>}
    {items.map(b => <article className="customer-booking-card" key={b.id}><h2>{b.solution}</h2><p>{statusLabel(b.status, lang)}</p><p>{date(b.requestedStartAt)} – {date(b.requestedEndAt)}</p><p>{(new Date(b.requestedEndAt) - new Date(b.requestedStartAt)) / 60000} {lang === 'en' ? 'minutes' : 'phút'} · {b.timezone}</p><p>{b.contactName} · {b.contactCompany}</p><p>{copy.meeting}</p></article>)}
    {result && <div className="customer-actions"><button disabled={page === 1} onClick={() => setPage(p => p - 1)}>{copy.previous}</button><span>{page} / {Math.max(1, Math.ceil(result.total / 25))}</span><button disabled={page * 25 >= result.total} onClick={() => setPage(p => p + 1)}>{copy.next}</button></div>}
  </AuthLayout>
}
