import { useEffect, useState } from 'react'
import { adminApi } from '../../services/admin/adminApi'
import { useAuth } from '../auth/useAuth'
import { statusLabel } from '../../customer/customerCopy'

const actions = { PENDING: ['CONFIRMED', 'CANCELLED'], CONFIRMED: ['COMPLETED', 'CANCELLED', 'NO_SHOW'] }
const statuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']
const mailLabels = { BOOKING_CREATED_CUSTOMER: 'Tiếp nhận yêu cầu · Khách hàng', BOOKING_CREATED_ADMIN: 'Yêu cầu mới · Quản trị viên', BOOKING_CONFIRMED_CUSTOMER: 'Xác nhận lịch hẹn', BOOKING_CANCELLED_CUSTOMER: 'Hủy lịch hẹn' }
const date = value => new Date(value).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
export function BookingsManager() {
  const { user, csrfToken, clearAuth } = useAuth()
  const [query, setQuery] = useState({ page: 1 }), [result, setResult] = useState(null), [detail, setDetail] = useState(null), [error, setError] = useState(''), [busy, setBusy] = useState(false), [revision, setRevision] = useState(0)
  const [loadingDetail, setLoadingDetail] = useState(false)
  useEffect(() => {
    let active = true
    if (user?.role !== 'ADMIN') return
    setResult(null)
    adminApi.listBookings(query).then(data => { if (active) { setResult(data); setError('') } }).catch(err => { if (err.status === 401) clearAuth(); if (active) setError('Không thể tải lịch hẹn. Vui lòng thử lại.') })
    return () => { active = false }
  }, [query, revision, user, clearAuth])
  if (user?.role !== 'ADMIN') return <p role="alert">Chỉ quản trị viên được phép quản lý lịch hẹn.</p>
  const read = async id => { setLoadingDetail(true); setDetail(null); try { setDetail(await adminApi.getBooking(id)) } catch (err) { if (err.status === 401) clearAuth(); setError('Không thể tải chi tiết lịch hẹn.') } finally { setLoadingDetail(false) } }
  const mutate = async (work, form) => {
    if (busy) return
    setBusy(true); setError('')
    try { await work(); form?.reset(); await read(detail.id); setRevision(n => n + 1) }
    catch (err) { if (err.status === 401) clearAuth(); setError(err.status === 409 ? 'Lịch hẹn đã thay đổi hoặc không đủ điều kiện chuyển trạng thái. Vui lòng tải lại.' : 'Không thể lưu thay đổi. Vui lòng thử lại.') }
    finally { setBusy(false) }
  }
  return <section className="admin-bookings"><div className="admin-page-heading"><div><p className="admin-kicker">NeoTek</p><h1>Quản lý lịch hẹn</h1></div></div>
    <form className="admin-booking-filters" onSubmit={event => {
      event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget)), next = { page: 1 }
      for (const [key, value] of Object.entries(data)) if (value) next[key] = ['from', 'to'].includes(key) ? new Date(`${value}T00:00:00+07:00`).toISOString() : value
      setQuery(next); setDetail(null)
    }}>
      <label>Tìm kiếm<input name="search" maxLength={120} placeholder="Tên, email, công ty…" /></label>
      <label>Trạng thái<select name="status"><option value="">Tất cả</option>{statuses.map(s => <option key={s} value={s}>{statusLabel(s, 'vi')}</option>)}</select></label>
      <label>Từ ngày<input type="date" name="from" /></label><label>Đến trước ngày<input type="date" name="to" /></label>
      <button className="admin-button" disabled={busy}>Lọc lịch hẹn</button>
    </form>
    {error && <p className="admin-alert admin-alert--error" role="alert">{error} <button onClick={() => setRevision(n => n + 1)}>Tải lại</button></p>}
    {!result && !error && <p>Đang tải…</p>}
    <div className="admin-booking-columns"><div>
      {result?.items.length === 0 && <p>Không có lịch hẹn phù hợp.</p>}
      {result?.items.map(b => <button className="admin-booking-row" disabled={busy || loadingDetail} key={b.id} onClick={() => read(b.id)} aria-pressed={detail?.id === b.id}><strong>{b.contactName} · {b.contactCompany}</strong><span>{b.solution}</span><span>{date(b.requestedStartAt)}</span><span>{statusLabel(b.status, 'vi')}</span></button>)}
      {result && <div className="admin-booking-pagination"><button disabled={query.page === 1 || busy} onClick={() => setQuery(q => ({ ...q, page: q.page - 1 }))}>Trước</button><span>{query.page} / {Math.max(1, Math.ceil(result.total / 25))}</span><button disabled={query.page * 25 >= result.total || busy} onClick={() => setQuery(q => ({ ...q, page: q.page + 1 }))}>Tiếp</button></div>}
    </div>
    {loadingDetail && <p>Đang tải chi tiết…</p>}
    {detail && <article className="admin-booking-detail"><h2>{detail.solution}</h2><p>{statusLabel(detail.status, 'vi')}</p><p>{date(detail.requestedStartAt)} – {date(detail.requestedEndAt)} · {detail.timezone}</p><dl><dt>Khách hàng</dt><dd>{detail.contactName}</dd><dt>Email</dt><dd>{detail.contactEmail}</dd><dt>Điện thoại</dt><dd>{detail.contactPhone}</dd><dt>Công ty</dt><dd>{detail.contactCompany}</dd><dt>Lời nhắn</dt><dd>{detail.customerMessage || '—'}</dd></dl>
      {actions[detail.status] && <form onSubmit={event => { event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget)); if (data.toStatus === 'CANCELLED' && !data.reason.trim()) { setError('Vui lòng nhập lý do hủy lịch hẹn.'); return } mutate(() => adminApi.transitionBooking(detail.id, { toStatus: data.toStatus, expectedVersion: detail.version, ...(data.reason.trim() ? { reason: data.reason.trim() } : {}) }, csrfToken)) }}>
        <label>Chuyển trạng thái<select name="toStatus" required>{actions[detail.status].map(s => <option value={s} key={s}>{statusLabel(s, 'vi')}</option>)}</select></label>
        <label>Lý do (bắt buộc khi hủy)<textarea name="reason" maxLength={1000} /></label><button className="admin-button" disabled={busy}>Cập nhật trạng thái</button>
      </form>}
      <h3>Lịch sử</h3><ol>{detail.events.map(e => <li key={e.id}>{date(e.createdAt)} · {e.type === 'CREATED' ? 'Tạo yêu cầu' : statusLabel(e.toStatus, 'vi')}{e.reason && <p>{e.reason}</p>}</li>)}</ol>
      <h3>Ghi chú nội bộ</h3>{detail.notes.map(n => <p key={n.id}>{date(n.createdAt)} · {n.text}</p>)}
      <h3>Gửi email</h3>{detail.notifications?.map(n => <p key={n.id}>{mailLabels[n.template] || 'Thông báo lịch hẹn'} · {({ PENDING: 'Chờ gửi', PROCESSING: 'Đang gửi', SENT: 'Đã gửi', FAILED: 'Gửi thất bại', REVOKED: 'Đã thu hồi' })[n.status]} · {n.attempts}/5{n.lastErrorCode ? ' · Có lỗi gửi email' : ''}</p>)}
      <form onSubmit={event => { event.preventDefault(); const form = event.currentTarget, text = new FormData(form).get('text'); mutate(() => adminApi.addBookingNote(detail.id, text, csrfToken), form) }}><label>Thêm ghi chú<textarea name="text" required maxLength={2000} /></label><button className="admin-button" disabled={busy}>Lưu ghi chú</button></form>
    </article>}
    </div>
  </section>
}
