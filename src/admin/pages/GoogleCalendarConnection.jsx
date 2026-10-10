import { useEffect, useState } from 'react'
import { adminApi } from '../../services/admin/adminApi'

export function GoogleCalendarConnection({ csrfToken, lang, clearAuth }) {
  const [state, setState] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState(false)
  const en = lang === 'en'
  useEffect(() => {
    let active = true
    adminApi.getGoogleCalendar().then(value => { if (active) setState(value) }).catch(err => { if (err.status === 401) clearAuth(); if (active) setError(true) })
    return () => { active = false }
  }, [clearAuth])
  return <section className="admin-calendar-connection" aria-label="Google Calendar">
    <h2>Google Calendar</h2>
    <p role="status">{state ? state.connected ? (en ? 'Connected' : 'Đã kết nối') : (en ? 'Not connected' : 'Chưa kết nối') : (en ? 'Checking connection…' : 'Đang kiểm tra kết nối…')}{state?.organizerEmail ? ` · ${state.organizerEmail}` : ''}</p>
    {state?.enabled && <button type="button" className="admin-button admin-button--secondary" disabled={busy || !csrfToken} onClick={async () => {
      if (busy) return
      setBusy(true); setError(false)
      try {
        const result = await adminApi.connectGoogleCalendar(csrfToken)
        const target = new URL(result.authorizationUrl)
        if (target.origin !== 'https://accounts.google.com' || target.pathname !== '/o/oauth2/v2/auth') throw new Error('Invalid authorization destination')
        window.location.assign(target.href)
      } catch (err) { if (err.status === 401) clearAuth(); setError(true); setBusy(false) }
    }}>{busy ? (en ? 'Connecting…' : 'Đang kết nối…') : state.connected ? (en ? 'Reconnect Google Calendar' : 'Kết nối lại Google Calendar') : (en ? 'Connect Google Calendar' : 'Kết nối Google Calendar')}</button>}
    {state && !state.enabled && <p className="admin-muted">{en ? 'Integration is disabled. You can enter a meeting URL manually.' : 'Tích hợp chưa được bật. Bạn vẫn có thể nhập liên kết cuộc họp thủ công.'}</p>}
    {error && <p role="alert">{en ? 'Google Calendar unavailable. You can enter a meeting URL manually.' : 'Google Calendar hiện không khả dụng. Bạn vẫn có thể nhập liên kết cuộc họp thủ công.'}</p>}
  </section>
}
