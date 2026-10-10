import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Tabs } from 'radix-ui'
import { HugeiconsIcon } from '@hugeicons/react'
import { Calendar03Icon, Clock01Icon, Video01Icon } from '@hugeicons/core-free-icons'
import { NeotekNavbar } from '../../components/layout/NeotekNavbar/NeotekNavbar'
import { NeotekFooter } from '../../components/layout/NeotekFooter/NeotekFooter'
import { NeotekContainer } from '../../components/common/NeotekContainer/NeotekContainer'
import { NeotekButton } from '../../components/common/NeotekButton/NeotekButton'
import { useCustomer } from '../../customer/context'
import { authError, customerCopy, statusLabel } from '../../customer/customerCopy'
import { customerApi } from '../../services/customer/customerApi'
import './my-bookings.css'

export default function MyBookings() {
  const { i18n } = useTranslation(), lang = i18n.language === 'en' ? 'en' : 'vi', en = lang === 'en', copy = customerCopy[lang], prefix = en ? '/en' : ''
  const { customer, status, restore } = useCustomer()
  const [result, setResult] = useState(null), [error, setError] = useState(''), [page, setPage] = useState(1), [tab, setTab] = useState('upcoming'), [refresh, setRefresh] = useState(0)
  useEffect(() => {
    let active = true
    if (!customer) return
    setResult(null); setError('')
    customerApi.bookings(page, tab).then(data => { if (active) setResult(data) }).catch(err => { if (active) setError(authError(err, copy)); if (err.status === 401) restore().catch(() => {}) })
    return () => { active = false }
  }, [customer, page, tab, refresh, copy, restore])
  const date = (value, options) => new Date(value).toLocaleString(en ? 'en-GB' : 'vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', ...options })
  const items = result?.items ?? []
  return <div className="neotek-site-shell customer-bookings-page">
    {createPortal(<NeotekNavbar />, document.body)}
    <main className="customer-bookings-main"><NeotekContainer>
      <header className="customer-bookings-header">
        <div><p className="neotek-eyebrow">{en ? 'Your NeoTek account' : 'Tài khoản NeoTek'}</p><h1>{copy.bookings}</h1><p>{en ? 'Your consultations, schedules and appointment updates.' : 'Theo dõi lịch tư vấn và cập nhật từ đội ngũ NeoTek.'}</p></div>
        <NeotekButton href={`${prefix}/booking`}>{en ? 'Book a consultation' : 'Đặt lịch tư vấn'}</NeotekButton>
      </header>
      {!customer ? <div className="customer-bookings-state" role={status === 'error' ? 'alert' : 'status'}>
        <HugeiconsIcon icon={Calendar03Icon} size={32} aria-hidden="true" />
        {status === 'loading' ? <p>{copy.loading}</p> : status === 'error' ? <><p>{copy.unavailable}</p><NeotekButton variant="secondary" onClick={() => restore().catch(() => {})}>{copy.retry}</NeotekButton></> : <><p>{en ? 'Sign in to view your consultations.' : 'Đăng nhập để xem các lịch tư vấn của bạn.'}</p><Link className="neotek-button neotek-button--primary" to={`${prefix}/login?returnTo=${encodeURIComponent(`${prefix}/account/bookings`)}`}>{copy.login}</Link></>}
      </div> : <Tabs.Root value={tab} onValueChange={value => { setTab(value); setPage(1) }} className="customer-bookings-panel">
        <div className="customer-bookings-toolbar"><Tabs.List className="customer-bookings-tabs" aria-label={en ? 'Appointment period' : 'Thời gian lịch hẹn'}>{['upcoming', 'past'].map(value => <Tabs.Trigger key={value} value={value}>{copy[value]}</Tabs.Trigger>)}</Tabs.List><span>{customer.name || customer.email}</span></div>
        <Tabs.Content value={tab} className="customer-bookings-content">
          {error && <div className="customer-bookings-state" role="alert"><p>{error}</p><NeotekButton variant="secondary" onClick={() => setRefresh(n => n + 1)}>{copy.retry}</NeotekButton></div>}
          {!result && !error && <p className="customer-bookings-state" role="status">{copy.loading}</p>}
          {result && !items.length && <div className="customer-bookings-state"><HugeiconsIcon icon={Calendar03Icon} size={32} aria-hidden="true" /><h2>{copy.empty}</h2><p>{en ? 'Choose a time that works for you to discuss your business needs.' : 'Chọn thời gian phù hợp để trao đổi nhu cầu của doanh nghiệp.'}</p><NeotekButton variant="secondary" href={`${prefix}/booking`}>{copy.continue}</NeotekButton></div>}
          <div className="customer-bookings-list">{items.map(b => <article className="customer-booking-card" key={b.id}>
            <div className="customer-booking-date" aria-hidden="true"><strong>{date(b.requestedStartAt, { day: '2-digit' })}</strong><span>{date(b.requestedStartAt, { month: 'short', year: 'numeric' })}</span></div>
            <div className="customer-booking-info">
              <div className="customer-booking-heading"><h2>{b.solution}</h2><span className={`customer-booking-status customer-booking-status--${b.status}`}>{statusLabel(b.status, lang)}</span></div>
              <p className="customer-booking-time"><HugeiconsIcon icon={Calendar03Icon} size={16} aria-hidden="true" />{date(b.requestedStartAt, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p className="customer-booking-time"><HugeiconsIcon icon={Clock01Icon} size={16} aria-hidden="true" />{date(b.requestedStartAt, { hour: '2-digit', minute: '2-digit' })} – {date(b.requestedEndAt, { hour: '2-digit', minute: '2-digit' })}<span>· {(new Date(b.requestedEndAt) - new Date(b.requestedStartAt)) / 60000} {en ? 'minutes' : 'phút'} · {b.timezone}</span></p>
              <p className="customer-booking-contact">{b.contactName} · {b.contactCompany}</p>
              <p className="customer-booking-meeting"><HugeiconsIcon icon={Video01Icon} size={16} aria-hidden="true" />{b.status === 'CONFIRMED' && /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/.test(b.meetingUrl || '') ? <span>Google Meet · <a href={b.meetingUrl} target="_blank" rel="noopener noreferrer">{en ? 'Join meeting' : 'Tham gia cuộc họp'}</a></span> : b.status === 'PENDING' ? (en ? 'Waiting for NeoTek to confirm your appointment' : 'Chờ NeoTek xác nhận lịch hẹn') : copy.meeting}</p>
            </div>
          </article>)}</div>
          {result && result.total > 0 && <nav className="customer-bookings-pagination" aria-label={en ? 'Bookings pagination' : 'Phân trang lịch hẹn'}><span>{en ? `${result.total} appointments` : `${result.total} lịch hẹn`}</span><div><NeotekButton variant="secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>{copy.previous}</NeotekButton><span>{page} / {Math.max(1, Math.ceil(result.total / 25))}</span><NeotekButton variant="secondary" disabled={page * 25 >= result.total} onClick={() => setPage(p => p + 1)}>{copy.next}</NeotekButton></div></nav>}
        </Tabs.Content>
      </Tabs.Root>}
    </NeotekContainer></main>
    <NeotekFooter showCta={false} demoHref={`${prefix}/booking`} />
  </div>
}
