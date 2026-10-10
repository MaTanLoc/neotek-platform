import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CalendarDays, ChevronLeft, ChevronRight, Mail, Search, RefreshCw } from 'lucide-react'
import { adminApi } from '../../services/admin/adminApi'
import { useAuth } from '../auth/useAuth'
import { SelectField } from '../editors/shared/SelectField'
import { statusLabel } from '../../customer/customerCopy'
import { useConfirm } from '../app/ConfirmProvider'
import './bookings-manager.css'
import { GoogleCalendarConnection } from './GoogleCalendarConnection'

const statuses = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']
const text = {
  vi: { title:'Quản lý lịch hẹn', intro:'Tiếp nhận yêu cầu tư vấn, cập nhật trạng thái và theo dõi trao đổi.', search:'Tìm kiếm', searchHint:'Tên, email, công ty…', status:'Trạng thái', all:'Tất cả trạng thái', from:'Từ ngày', to:'Đến trước ngày', filter:'Áp dụng', reset:'Xóa bộ lọc', list:'Danh sách lịch hẹn', count:'lịch hẹn', empty:'Không có lịch hẹn phù hợp.', select:'Chọn lịch hẹn để xem chi tiết', selectHint:'Thông tin khách hàng, lịch sử và ghi chú sẽ hiển thị tại đây.', loading:'Đang tải…', loadingDetail:'Đang tải chi tiết…', retry:'Tải lại', restricted:'Chỉ quản trị viên được phép quản lý lịch hẹn.', loadError:'Không thể tải lịch hẹn. Vui lòng thử lại.', detailError:'Không thể tải chi tiết lịch hẹn.', conflict:'Lịch hẹn đã thay đổi hoặc không đủ điều kiện chuyển trạng thái. Vui lòng tải lại.', saveError:'Không thể lưu thay đổi. Vui lòng thử lại.', contact:'Thông tin khách hàng', name:'Họ và tên', email:'Email', phone:'Điện thoại', company:'Công ty', message:'Lời nhắn', schedule:'Thời gian tư vấn', duration:'phút', transition:'Cập nhật trạng thái', reason:'Lý do hủy', reasonHint:'Bắt buộc khi hủy lịch hẹn', reasonError:'Vui lòng nhập lý do hủy lịch hẹn.', update:'Lưu trạng thái', history:'Lịch sử hoạt động', created:'Tạo yêu cầu', notes:'Ghi chú nội bộ', noNotes:'Chưa có ghi chú.', addNote:'Thêm ghi chú', saveNote:'Lưu ghi chú', mail:'Thông báo email', noMail:'Chưa có thông báo.', mailError:'Có lỗi gửi email', previous:'Trước', next:'Tiếp', detail:'Chi tiết lịch hẹn' },
  en: { title:'Booking management', intro:'Review consultation requests, update appointments and track communication.', search:'Search', searchHint:'Name, email, company…', status:'Status', all:'All statuses', from:'From date', to:'Before date', filter:'Apply filters', reset:'Clear filters', list:'Appointments', count:'appointments', empty:'No matching appointments.', select:'Select an appointment', selectHint:'Customer details, activity and internal notes will appear here.', loading:'Loading…', loadingDetail:'Loading details…', retry:'Reload', restricted:'Only administrators can manage appointments.', loadError:'Unable to load appointments. Please try again.', detailError:'Unable to load appointment details.', conflict:'This appointment has changed or cannot transition. Please reload.', saveError:'Unable to save changes. Please try again.', contact:'Customer information', name:'Full name', email:'Email', phone:'Phone', company:'Company', message:'Message', schedule:'Consultation time', duration:'minutes', transition:'Update status', reason:'Cancellation reason', reasonHint:'Required when cancelling an appointment', reasonError:'Enter a cancellation reason.', update:'Save status', history:'Activity history', created:'Request created', notes:'Internal notes', noNotes:'No notes yet.', addNote:'Add a note', saveNote:'Save note', mail:'Email notifications', noMail:'No notifications yet.', mailError:'Email delivery error', previous:'Previous', next:'Next', detail:'Appointment details' },
}
const mailLabels = { BOOKING_CREATED_CUSTOMER:['Tiếp nhận yêu cầu · Khách hàng','Request received · Customer'], BOOKING_CREATED_ADMIN:['Yêu cầu mới · Quản trị viên','New request · Administrator'], BOOKING_CONFIRMED_CUSTOMER:['Xác nhận lịch hẹn','Appointment confirmed'], BOOKING_CANCELLED_CUSTOMER:['Hủy lịch hẹn','Appointment cancelled'] }
const mailStatus = { PENDING:['Chờ gửi','Pending'], PROCESSING:['Đang gửi','Processing'], SENT:['Đã gửi','Sent'], FAILED:['Gửi thất bại','Failed'], REVOKED:['Đã thu hồi','Revoked'] }

function BookingStatus({ status, lang }) { return <span className={`admin-booking-status admin-booking-status--${status}`}>{statusLabel(status, lang)}</span> }

function StatusForm({ detail, lang, copy, busy, onSave, onError, onGenerate }) {
  const [meetingUrl, setMeetingUrl] = useState(detail.meetingUrl || ''), [cancelling, setCancelling] = useState(false)
  const confirm = useConfirm(), en = lang === 'en', pending = detail.status === 'PENDING', active = pending || detail.status === 'CONFIRMED'
  const validMeet = /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/.test(meetingUrl.trim())
  const cancelText = en ? 'Cancel appointment' : 'Hủy lịch', completeText = en ? 'Mark completed' : 'Đánh dấu hoàn thành'
  return <form className="admin-booking-transition" onSubmit={async event => {
    event.preventDefault()
    if (busy || !active) return
    const toStatus = cancelling ? 'CANCELLED' : pending ? 'CONFIRMED' : 'COMPLETED'
    const reason = new FormData(event.currentTarget).get('reason')?.trim()
    if (toStatus === 'CANCELLED' && !reason) { onError(copy.reasonError); return }
    if (toStatus === 'CONFIRMED' && !validMeet) { onError(en ? 'Enter a valid Google Meet URL.' : 'Vui lòng nhập liên kết Google Meet hợp lệ.'); return }
    if (toStatus === 'CANCELLED' && !await confirm(reason, cancelText)) return
    onSave({ toStatus, expectedVersion:detail.version, ...(reason ? { reason } : {}), ...(toStatus === 'CONFIRMED' ? { meetingUrl:meetingUrl.trim() } : {}) })
  }}>
    <h3>Google Meet</h3>
    {pending && !detail.meetingUrl && <button type="button" data-action="generate-meet" className="admin-button admin-button--secondary" disabled={busy || cancelling || !!meetingUrl.trim()} onClick={onGenerate}>{busy ? (en ? 'Creating…' : 'Đang tạo…') : (en ? 'Create Google Meet' : 'Tạo Google Meet')}</button>}
    {detail.meetingUrl && <p role="status">{en ? 'Meeting URL saved. Review before confirming.' : 'Đã lưu liên kết cuộc họp. Vui lòng kiểm tra trước khi xác nhận.'} <a href={detail.meetingUrl} target="_blank" rel="noopener noreferrer">{en ? 'Open meeting' : 'Mở cuộc họp'}</a></p>}
    {pending ? <label><span>{en ? 'Meeting URL' : 'Liên kết cuộc họp'}</span><input name="meetingUrl" type="url" value={meetingUrl} onChange={event => setMeetingUrl(event.target.value)} disabled={busy || cancelling} placeholder="https://meet.google.com/xxx-xxxx-xxx" maxLength={200} aria-describedby="admin-booking-meet-hint" /><small id="admin-booking-meet-hint" className="admin-muted">{en ? 'Required to confirm. Read-only after confirmation.' : 'Bắt buộc để xác nhận. Chỉ đọc sau khi xác nhận.'}</small></label> : detail.meetingUrl ? <a href={detail.meetingUrl} target="_blank" rel="noopener noreferrer">{detail.meetingUrl}</a> : <p className="admin-muted">{en ? 'Meeting link is not available.' : 'Chưa có liên kết cuộc họp.'}</p>}
    {!active && <p className="admin-muted">{en ? 'This appointment is closed. Its status cannot be changed.' : 'Lịch hẹn đã kết thúc xử lý, không thể đổi trạng thái.'}</p>}
    {active && (cancelling ? <>
      <label><span>{copy.reason}</span><textarea name="reason" rows={2} maxLength={1000} disabled={busy} required placeholder={copy.reasonHint} /></label>
      <div className="admin-booking-workflow-actions"><button className="admin-button" data-action="cancel" disabled={busy}>{cancelText}</button><button type="button" className="admin-button admin-button--secondary" disabled={busy} onClick={() => setCancelling(false)}>{en ? 'Back' : 'Quay lại'}</button></div>
    </> : <div className="admin-booking-workflow-actions"><button type="button" className="admin-button admin-button--secondary" data-action="start-cancel" disabled={busy} onClick={() => setCancelling(true)}>{cancelText}</button><button className="admin-button" data-action={pending ? 'confirm' : 'complete'} disabled={busy || (pending ? !validMeet : new Date(detail.requestedEndAt) > new Date())}>{pending ? (en ? 'Confirm appointment' : 'Xác nhận lịch') : completeText}</button></div>)}
    {detail.status === 'CONFIRMED' && new Date(detail.requestedEndAt) > new Date() && <small className="admin-muted">{en ? 'Completion is available after the appointment ends.' : 'Có thể đánh dấu hoàn thành sau giờ kết thúc cuộc hẹn.'}</small>}
  </form>
}

export function BookingsManager() {
  const { user, csrfToken, clearAuth } = useAuth()
  const { i18n } = useTranslation(), lang = i18n.language === 'en' ? 'en' : 'vi', copy = text[lang], index = lang === 'en' ? 1 : 0
  const [query, setQuery] = useState({ page:1 }), [result, setResult] = useState(null), [detail, setDetail] = useState(null), [error, setError] = useState(''), [busy, setBusy] = useState(false), [revision, setRevision] = useState(0)
  const [loadingDetail, setLoadingDetail] = useState(false), [selectedId, setSelectedId] = useState(null), [filterStatus, setFilterStatus] = useState('')
  const detailRequest = useRef(0), detailRef = useRef(null), pending = useRef(false)
  useEffect(() => {
    let active = true
    if (user?.role !== 'ADMIN') return
    setResult(null)
    adminApi.listBookings(query).then(data => { if (active) { setResult(data); setError('') } }).catch(err => { if (err.status === 401) clearAuth(); if (active) setError(copy.loadError) })
    return () => { active = false }
  }, [query, revision, user, clearAuth, copy])
  useEffect(() => () => { detailRequest.current++ }, [])
  useEffect(() => {
    if (!detail || !window.matchMedia('(max-width:820px)').matches || !detailRef.current) return
    const panel = detailRef.current, main = panel.closest('.admin-main')
    panel.focus({ preventScroll:true })
    // Scroll only the CMS content region; hidden shell ancestors must not move its header.
    if (main) main.scrollTop += panel.getBoundingClientRect().top - main.getBoundingClientRect().top
  }, [detail])
  if (user?.role !== 'ADMIN') return <p role="alert">{copy.restricted}</p>
  const date = (value, options) => new Date(value).toLocaleString(lang === 'en' ? 'en-GB' : 'vi-VN', { timeZone:'Asia/Ho_Chi_Minh', ...options })
  const read = async id => {
    const request = ++detailRequest.current
    setSelectedId(id); setLoadingDetail(true); setDetail(null); setError('')
    try { const data = await adminApi.getBooking(id); if (request === detailRequest.current) setDetail(data) }
    catch (err) { if (err.status === 401) clearAuth(); if (request === detailRequest.current) setError(copy.detailError) }
    finally { if (request === detailRequest.current) setLoadingDetail(false) }
  }
  const mutate = async (work, form) => {
    if (pending.current) return
    pending.current = true; setBusy(true); setError('')
    try { await work(); form?.reset(); await read(detail.id); setRevision(n => n + 1) }
    catch (err) { if (err.status === 401) clearAuth(); setError(err.status === 409 ? copy.conflict : copy.saveError) }
    finally { pending.current = false; setBusy(false) }
  }
  const resetDetail = () => { detailRequest.current++; setDetail(null); setSelectedId(null); setLoadingDetail(false) }
  return <section className="admin-bookings">
    <header className="admin-page-heading"><div><p className="admin-kicker">NeoTek · {lang === 'en' ? 'Consultations' : 'Lịch tư vấn'}</p><h1>{copy.title}</h1><p className="admin-muted">{copy.intro}</p></div><button className="admin-button admin-button--secondary" disabled={busy || loadingDetail} onClick={() => { setRevision(n => n + 1); if (selectedId) read(selectedId) }}><RefreshCw size={15} aria-hidden="true" />{copy.retry}</button></header>
    <GoogleCalendarConnection {...{ csrfToken, lang, clearAuth }} />
    <form className="admin-booking-filters" onSubmit={event => {
      event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget)), next = { page:1 }
      if (filterStatus) next.status = filterStatus
      for (const [key, value] of Object.entries(data)) if (value.trim()) next[key] = ['from', 'to'].includes(key) ? new Date(`${value}T00:00:00+07:00`).toISOString() : value.trim()
      setQuery(next); resetDetail()
    }} onReset={() => { setFilterStatus(''); setQuery({ page:1 }); resetDetail() }}>
      <label className="admin-booking-search"><span>{copy.search}</span><span className="admin-booking-search-input"><Search size={16} aria-hidden="true" /><input name="search" maxLength={120} placeholder={copy.searchHint} disabled={busy} /></span></label>
      <label><span>{copy.status}</span><SelectField value={filterStatus} label={copy.status} onChange={setFilterStatus} options={[[ '', copy.all ], ...statuses.map(s => [s, statusLabel(s, lang)])]} disabled={busy} /></label>
      <label><span>{copy.from}</span><input type="date" name="from" disabled={busy} /></label><label><span>{copy.to}</span><input type="date" name="to" disabled={busy} /></label>
      <div className="admin-booking-filter-actions"><button className="admin-button" disabled={busy}>{copy.filter}</button><button type="reset" className="admin-button admin-button--secondary" disabled={busy}>{copy.reset}</button></div>
    </form>
    {error && <div className="admin-alert admin-alert--error" role="alert">{error} <button type="button" disabled={busy} onClick={() => { setRevision(n => n + 1); if (selectedId) read(selectedId) }}>{copy.retry}</button></div>}
    <div className="admin-booking-columns">
      <section className="admin-booking-list" aria-label={copy.list} aria-busy={!result && !error}>
        <div className="admin-booking-panel-heading"><h2>{copy.list}</h2><span>{result ? `${result.total} ${copy.count}` : '—'}</span></div>
        {!result && !error && <p className="admin-booking-placeholder" role="status">{copy.loading}</p>}
        {result?.items.length === 0 && <p className="admin-booking-placeholder">{copy.empty}</p>}
        {result?.items.map(b => <button type="button" className="admin-booking-row" disabled={busy || loadingDetail} key={b.id} onClick={() => read(b.id)} aria-pressed={selectedId === b.id}>
          <span className="admin-booking-row__top"><strong>{b.contactName}</strong><BookingStatus status={b.status} lang={lang} /></span><span className="admin-booking-row__company">{b.contactCompany}</span><span className="admin-booking-row__solution">{b.solution}</span><span className="admin-booking-row__time"><CalendarDays size={14} aria-hidden="true" />{date(b.requestedStartAt, { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })}</span>
        </button>)}
        {result && <nav className="admin-booking-pagination" aria-label={copy.list}><button className="admin-button admin-button--secondary" aria-label={copy.previous} disabled={query.page === 1 || busy} onClick={() => { setQuery(q => ({ ...q, page:q.page - 1 })); resetDetail() }}><ChevronLeft size={16} /></button><span>{query.page} / {Math.max(1, Math.ceil(result.total / 25))}</span><button className="admin-button admin-button--secondary" aria-label={copy.next} disabled={query.page * 25 >= result.total || busy} onClick={() => { setQuery(q => ({ ...q, page:q.page + 1 })); resetDetail() }}><ChevronRight size={16} /></button></nav>}
      </section>
      <div className="admin-booking-detail-area">
        {!detail && <div className="admin-booking-empty" role="status"><CalendarDays size={32} aria-hidden="true" /><h2>{loadingDetail ? copy.loadingDetail : copy.select}</h2>{!loadingDetail && <p>{copy.selectHint}</p>}</div>}
        {detail && <article className="admin-booking-detail" ref={detailRef} tabIndex={-1} aria-label={copy.detail}>
          <header className="admin-booking-detail__header"><div><p className="admin-kicker">{copy.detail}</p><h2>{detail.solution}</h2></div><BookingStatus status={detail.status} lang={lang} /></header>
          <section className="admin-booking-schedule"><h3>{copy.schedule}</h3><strong>{date(detail.requestedStartAt, { weekday:'long', day:'numeric', month:'long', year:'numeric' })}</strong><p>{date(detail.requestedStartAt, { hour:'2-digit', minute:'2-digit' })} – {date(detail.requestedEndAt, { hour:'2-digit', minute:'2-digit' })}<span> · {(new Date(detail.requestedEndAt) - new Date(detail.requestedStartAt)) / 60000} {copy.duration} · {detail.timezone}</span></p></section>
          <section className="admin-booking-section"><h3>{copy.contact}</h3><dl>{[['name', detail.contactName], ['email', detail.contactEmail], ['phone', detail.contactPhone], ['company', detail.contactCompany]].map(([key, value]) => <div key={key}><dt>{copy[key]}</dt><dd>{value}</dd></div>)}</dl><div className="admin-booking-message"><h4>{copy.message}</h4><p>{detail.customerMessage || '—'}</p></div></section>
          <StatusForm key={`${detail.id}:${detail.version}:${detail.meetingUrl || ''}`} {...{ detail, lang, copy, busy }} onGenerate={() => mutate(() => adminApi.createGoogleMeet(detail.id, csrfToken))} onError={setError} onSave={data => mutate(() => adminApi.transitionBooking(detail.id, data, csrfToken))} />
          <section className="admin-booking-section"><h3>{copy.history}</h3><ol className="admin-booking-timeline">{detail.events.map(e => <li key={e.id}><time>{date(e.createdAt)}</time><strong>{e.type === 'CREATED' ? copy.created : statusLabel(e.toStatus, lang)}</strong>{e.reason && <p>{e.reason}</p>}</li>)}</ol></section>
          <section className="admin-booking-section"><h3>{copy.notes}</h3>{!detail.notes.length && <p className="admin-muted">{copy.noNotes}</p>}<div className="admin-booking-notes">{detail.notes.map(n => <div key={n.id}><time>{date(n.createdAt)}</time><p>{n.text}</p></div>)}</div><form className="admin-booking-note-form" onSubmit={event => { event.preventDefault(); const form = event.currentTarget, note = new FormData(form).get('text'); mutate(() => adminApi.addBookingNote(detail.id, note, csrfToken), form) }}><label><span>{copy.addNote}</span><textarea name="text" rows={2} required maxLength={2000} disabled={busy} /></label><button className="admin-button admin-button--secondary" disabled={busy}>{busy ? copy.loading : copy.saveNote}</button></form></section>
          <section className="admin-booking-section"><h3><Mail size={16} aria-hidden="true" />{copy.mail}</h3>{!detail.notifications?.length && <p className="admin-muted">{copy.noMail}</p>}<ul className="admin-booking-mail">{detail.notifications?.map(n => <li key={n.id}><span>{mailLabels[n.template]?.[index] || copy.mail}</span><small>{mailStatus[n.status]?.[index] || n.status} · {n.attempts}/5{n.lastErrorCode ? ` · ${copy.mailError}` : ''}</small></li>)}</ul></section>
        </article>}
      </div>
    </div>
  </section>
}
