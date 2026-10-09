import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCustomer } from '../../customer/context'
import { authError, customerCopy } from '../../customer/customerCopy'
import { customerApi } from '../../services/customer/customerApi'
import { timeLabel } from './bookingUtils'

const storageKey = 'neotek-booking-intent'
const clearIntent = () => { try { sessionStorage.removeItem(storageKey) } catch { /* Browser storage is optional. */ } }
export const slotInterval = slot => ({ requestedStartAt: new Date(`${slot.date}T${timeLabel(slot.startMinutes)}:00+07:00`).toISOString(), requestedEndAt: new Date(`${slot.date}T${timeLabel(slot.endMinutes)}:00+07:00`).toISOString() })
export function holdSlot(hold) {
  const start = new Date(new Date(hold.requestedStartAt).getTime() + 7 * 3600000), end = new Date(new Date(hold.requestedEndAt).getTime() + 7 * 3600000)
  return { date: start.toISOString().slice(0, 10), startMinutes: start.getUTCHours() * 60 + start.getUTCMinutes(), endMinutes: end.getUTCHours() * 60 + end.getUTCMinutes() }
}
export default function useBookingFlow(language) {
  const lang = language === 'en' ? 'en' : 'vi', copy = customerCopy[lang], prefix = lang === 'en' ? '/en' : ''
  const { customer, status, restore, logout } = useCustomer(), navigate = useNavigate()
  const [hold, setHold] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState(''), [options, setOptions] = useState(null), [moduleKey, setModuleKey] = useState(''), [revision, setRevision] = useState(0)
  const [clock, setClock] = useState(Date.now()), serverOffset = useRef(0), holdRef = useRef(null), requestKeys = useRef(new Map()), finalizeKey = useRef(crypto.randomUUID()), pending = useRef(false)
  holdRef.current = hold
  const [restored, setRestored] = useState(null)
  const [restoreRevision, setRestoreRevision] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now() + serverOffset.current), 1000)
    return () => clearInterval(timer)
  }, [])
  useEffect(() => () => {
    // SPA navigation can release best-effort. Refresh never renews a hold.
    if (holdRef.current) customerApi.release(holdRef.current.id, true).catch(() => {})
  }, [])
  useEffect(() => {
    let active = true
    customerApi.options().then(value => { if (active) { setOptions(value); setError('') } }).catch(err => { if (active) setError(authError(err, copy)) })
    return () => { active = false }
  }, [copy, revision])
  useEffect(() => {
    if (status !== 'ready') return
    let active = true
    const load = async () => {
      let current = null
      if (customer) {
        const result = await customerApi.currentHold()
        serverOffset.current = new Date(result.serverNow).getTime() - Date.now()
        if (!active) return
        current = result.hold; setClock(Date.now() + serverOffset.current); setHold(current)
      } else setHold(null)
      let intent = null
      try { intent = JSON.parse(sessionStorage.getItem(storageKey)); if (Date.now() - intent?.savedAt > 86400000) intent = null } catch { /* Intent is optional. */ }
      if (!active) return
      if (intent?.slot && /^\d{4}-\d{2}-\d{2}$/.test(intent.slot.date) && Number.isFinite(new Date(`${intent.slot.date}T00:00:00+07:00`).getTime()) && Number.isFinite(intent.slot.startMinutes) && Number.isFinite(intent.slot.endMinutes) && intent.slot.startMinutes >= 0 && intent.slot.endMinutes <= 1440 && intent.slot.endMinutes > intent.slot.startMinutes && typeof intent.moduleKey === 'string' && intent.moduleKey.length <= 120) { setRestored({ ...intent, currentHold: current }); setModuleKey(intent.moduleKey) }
      else if (current) { setRestored({ slot: holdSlot(current), currentHold: current }); setModuleKey(current.moduleKey) }
    }
    load().catch(err => { if (active) setError(authError(err, copy)) })
    return () => { active = false }
  }, [customer, status, copy, restoreRevision])
  const seconds = hold ? Math.max(0, Math.ceil((new Date(hold.expiresAt).getTime() - clock) / 1000)) : 0
  const saveIntent = useCallback((slot, key, started = false) => { try { sessionStorage.setItem(storageKey, JSON.stringify({ slot, moduleKey: key, started, savedAt: Date.now() })) } catch { /* Server hold does not depend on browser storage. */ } }, [])
  const acquire = async slot => {
    if (pending.current || !slot) return false
    setError('')
    if (!moduleKey) { setError(copy.choose); return false }
    saveIntent(slot, moduleKey, true)
    if (status === 'error') { setError(copy.unavailable); return false }
    if (!customer) { navigate(`${prefix}/login?returnTo=${encodeURIComponent(`${prefix}/booking`)}`); return false }
    if (!customer.emailVerifiedAt) { navigate(`${prefix}/verify-email?returnTo=${encodeURIComponent(`${prefix}/booking`)}`); return false }
    pending.current = true; setBusy(true)
    try {
      if (hold && seconds <= 0) requestKeys.current.clear()
      const body = { ...slotInterval(slot), moduleKey }, signature = JSON.stringify(body)
      if (!requestKeys.current.has(signature)) requestKeys.current.set(signature, crypto.randomUUID())
      const result = await customerApi.acquire({ ...body, idempotencyKey: requestKeys.current.get(signature) })
      setClock(Date.now() + serverOffset.current); setHold(result); finalizeKey.current = crypto.randomUUID(); setRevision(n => n + 1); saveIntent(slot, moduleKey, false); return true
    } catch (err) {
      if (err.status && err.status < 500) requestKeys.current.clear()
      if (err.status === 401) { await restore().catch(() => {}); navigate(`${prefix}/login?returnTo=${encodeURIComponent(`${prefix}/booking`)}`) }
      else if (err.message === 'EMAIL_VERIFICATION_REQUIRED') navigate(`${prefix}/verify-email`)
      setError(err.status === 409 ? copy.conflict : authError(err, copy)); return false
    } finally { pending.current = false; setBusy(false) }
  }
  const release = async () => {
    if (pending.current) return false
    pending.current = true; setBusy(true)
    try {
      if (hold) await customerApi.release(hold.id)
      setHold(null); setError(''); requestKeys.current.clear(); clearIntent(); setRevision(n => n + 1); return true
    } catch (err) { setError(err.status === 401 ? copy.credentials : copy.releaseError); return false }
    finally { pending.current = false; setBusy(false) }
  }
  const finalize = async form => {
    if (pending.current || !hold || seconds <= 0) { setError(copy.expired); return false }
    pending.current = true; setBusy(true); setError('')
    try {
      await customerApi.finalize({ holdId: hold.id, contactName: form.name, contactPhone: form.phone, contactCompany: form.company, customerMessage: form.message, locale: lang, idempotencyKey: finalizeKey.current })
      setHold(null); clearIntent(); setRevision(n => n + 1); return true
    } catch (err) { const expired = ['HOLD_EXPIRED', 'HOLD_NOT_ACTIVE'].includes(err.message); if (expired) { setHold(null); requestKeys.current.clear() } setError(expired ? copy.expired : authError(err, copy)); return false }
    finally { pending.current = false; setBusy(false) }
  }
  return { customer, status, logout, options, moduleKey, setModuleKey, hold, seconds, busy, error, setError, acquire, release, finalize, revision, restored, saveIntent, copy, retry: () => { setRevision(n => n + 1); setRestoreRevision(n => n + 1); restore().catch(() => {}) } }
}
