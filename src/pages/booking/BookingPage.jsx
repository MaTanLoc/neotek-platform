import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft01Icon, ArrowRight01Icon, Calendar03Icon, Clock01Icon, Globe02Icon } from '@hugeicons/core-free-icons'
import { useTranslation } from 'react-i18next'
import { NeotekNavbar } from '../../components/layout/NeotekNavbar/NeotekNavbar'
import { NeotekFooter } from '../../components/layout/NeotekFooter/NeotekFooter'
import { NeotekContainer } from '../../components/common/NeotekContainer/NeotekContainer'
import { NeotekButton } from '../../components/common/NeotekButton/NeotekButton'
import { getLocalizedPath } from '../../i18n'
import MiniCalendar from './MiniCalendar'
import MonthCalendar from './MonthCalendar'
import WeekCalendar from './WeekCalendar'
import BookingDialog from './BookingDialog'
import useBookingFlow, { holdSlot } from './useBookingFlow'
import { customerApi } from '../../services/customer/customerApi'
import { authError } from '../../customer/customerCopy'
import { addDays, changeMonth, dateKey, formatDate, monthDays, parseDate, rangeAvailable, startOfWeek, TIME_ZONE, todayInTimezone } from './bookingUtils'
import './BookingPage.css'

const views = ['month', 'week', 'workWeek']

export default function BookingPage() {
  const { t, i18n } = useTranslation()
  const [today, setToday] = useState(todayInTimezone)
  const [currentDate, setCurrentDate] = useState(today)
  const [selectedDate, setSelectedDate] = useState(today)
  const [month, setMonth] = useState(today)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [duration, setDuration] = useState(30)
  const [viewMode, setViewMode] = useState('workWeek')
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 767px)').matches)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitState, setSubmitState] = useState('idle')
  const flow = useBookingFlow(i18n.language)
  const [availability, setAvailability] = useState(null)
  const [availabilityError, setAvailabilityError] = useState('')
  const [mine, setMine] = useState({ customerId:null, items:[] })
  const [feedback, setFeedback] = useState('')
  const returnFocusRef = useRef(null)
  const resumedIntent = useRef(null)
  const monday = startOfWeek(currentDate)
  const days = isMobile ? [selectedDate] : Array.from({ length: viewMode === 'workWeek' ? 5 : 7 }, (_, index) => addDays(monday, index))
  const language = i18n.language
  const firstDate = viewMode === 'month' ? monthDays(currentDate)[0] : days[0]
  const lastDate = viewMode === 'month' ? addDays(firstDate, 42) : addDays(days.at(-1), 1)
  const from = new Date(dateKey(firstDate) + 'T00:00:00+07:00').toISOString()
  const to = new Date(dateKey(lastDate) + 'T00:00:00+07:00').toISOString()
  const events = []
  const policy = flow.options?.policy
  const own = flow.hold && flow.seconds > 0 ? flow.hold : null
  const ownBookings = mine.customerId === flow.customer?.customerId ? mine.items.filter(b => b.status !== 'CANCELLED').map(b => ({ ...holdSlot(b), id:b.id, solution:b.solution, status:b.status })) : []
  useEffect(() => {
    const customerId = flow.customer?.customerId, controller = new AbortController()
    if (!customerId) return
    const load = async () => {
      const items = []
      let page = 1, result
      do {
        result = await customerApi.bookings(page++, null, { from, to }, controller.signal)
        items.push(...result.items)
      } while (items.length < result.total && result.items.length && page <= 10000)
      if (!controller.signal.aborted) setMine({ customerId, items })
    }
    const refresh = () => load().catch(error => { if (error.name !== 'AbortError') setMine({ customerId, items:[] }) })
    refresh()
    const timer = setInterval(refresh, 30000)
    return () => { controller.abort(); clearInterval(timer) }
  }, [flow.customer?.customerId, from, to, flow.revision])
  useEffect(() => { if (policy && !selectedSlot && !policy.durations.includes(duration)) setDuration(policy.durations[0]) }, [policy, selectedSlot, duration])
  for (const day of viewMode === 'month' ? monthDays(currentDate) : days) {
    const key = dateKey(day)
    const dayStart = new Date(key + 'T00:00:00+07:00').getTime()
    const addBusy = (start, end) => { start = Math.max(policy?.startMinute ?? 480, start); end = Math.min(policy?.endMinute ?? 1080, end); if (end > start) events.push({ date: key, startMinutes: start, endMinutes: end, type: 'busy' }) }
    if (!policy || !policy.workingDays.includes(day.getDay())) { addBusy(0, 1440); continue }
    addBusy(0, policy.startMinute); addBusy(policy.endMinute, 1440)
    const serverNow = new Date(availability?.serverNow ?? Date.now()).getTime()
    addBusy(0, Math.min(1440, (serverNow + policy.leadMinutes * 60000 - dayStart) / 60000))
    addBusy(Math.max(0, (serverNow + policy.horizonDays * 86400000 - dayStart) / 60000), 1440)
    for (const period of availability?.busy ?? []) {
      let parts = [[new Date(period.start).getTime(), new Date(period.end).getTime()]]
      if (own) {
        const os = new Date(own.requestedStartAt).getTime() - policy.bufferBefore * 60000, oe = new Date(own.requestedEndAt).getTime() + policy.bufferAfter * 60000
        parts = parts.flatMap(([start, end]) => end <= os || start >= oe ? [[start, end]] : [[start, Math.min(end, os)], [Math.max(start, oe), end]])
      }
      for (const [start, end] of parts) addBusy(Math.max(0, (start - dayStart) / 60000), Math.min(1440, (end - dayStart) / 60000))
    }
  }
  useEffect(() => {
    const controller = new AbortController()
    setAvailability(null); setAvailabilityError('')
    const load = () => customerApi.availability(from, to, duration, controller.signal).then(result => { setAvailability(result); setAvailabilityError('') }).catch(error => { if (error.name !== 'AbortError') setAvailabilityError(authError(error, flow.copy)) })
    load()
    const timer = setInterval(load, 30000)
    return () => { controller.abort(); clearInterval(timer) }
  }, [from, to, duration, flow.revision, flow.copy])
  useEffect(() => {
    const intent = flow.restored
    if (!intent?.slot) return
    const date = parseDate(intent.slot.date)
    setSelectedSlot(intent.slot); setSelectedDate(date); setCurrentDate(date); setMonth(date)
    setDuration(intent.slot.endMinutes - intent.slot.startMinutes); setDialogOpen(true)
  }, [flow.restored])

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)')
    const update = () => setIsMobile(media.matches)
    media.addEventListener('change', update)
    const timer = window.setInterval(() => setToday(todayInTimezone()), 60000)
    return () => { media.removeEventListener('change', update); window.clearInterval(timer) }
  }, [])

  const clearSelection = async () => {
    if (!await flow.release()) return false
    setDialogOpen(false); setSelectedSlot(null); setSubmitState('idle'); return true
  }
  const closeDialog = async () => {
    if (flow.busy) return
    if (await clearSelection()) setDialogOpen(false)
  }
  const navigateDate = async (date, nextView = viewMode) => {
    if (dialogOpen && !await clearSelection()) return
    setCurrentDate(date)
    setSelectedDate(date)
    setMonth(date)
    setSelectedSlot(null); setSubmitState('idle')
    setFeedback('')
    setViewMode(nextView === 'workWeek' && (date.getDay() === 0 || date.getDay() === 6) ? 'week' : nextView)
  }
  const navigatePeriod = (offset) => navigateDate(viewMode === 'month' ? changeMonth(currentDate, offset) : addDays(isMobile ? selectedDate : monday, offset * (isMobile ? 1 : 7)))
  const changeView = async (view) => {
    if (dialogOpen && !await clearSelection()) return
    setViewMode(view)
    setDialogOpen(false); setSelectedSlot(null); setSubmitState('idle')
    setFeedback('')
    if (view === 'workWeek' && (selectedDate.getDay() === 0 || selectedDate.getDay() === 6)) setSelectedDate(monday)
  }
  const selectSlot = (range, source, openDialog = true) => {
    if (!availability || !rangeAvailable(range, events, policy?.startMinute, policy?.endMinute)) { setFeedback('conflict'); return }
    if (source) returnFocusRef.current = source
    setSelectedDate(parseDate(range.date))
    setSelectedSlot(range)
    setDuration(range.endMinutes - range.startMinutes)
    flow.saveIntent(range, flow.moduleKey)
    setSubmitState('idle')
    setDialogOpen(openDialog)
    setFeedback('')
  }
  const changeDuration = (value) => {
    setDuration(value)
    if (selectedSlot) {
      const range = { ...selectedSlot, endMinutes: selectedSlot.startMinutes + value }
      if (!rangeAvailable(range, events, policy?.startMinute, policy?.endMinute)) { setFeedback('durationConflict'); return }
      setSelectedSlot(range)
    }
    setFeedback('')
  }
  const submitBooking = async (form, validate) => {
    const activeHold = matchesHold && flow.seconds > 0 ? flow.hold : await acquire()
    if (!activeHold || !validate()) return
    if (await flow.finalize(form, activeHold)) setSubmitState('success')
  }
  const acquire = async () => {
    if (!selectedSlot || !flow.options?.policy.durations.includes(selectedSlot.endMinutes - selectedSlot.startMinutes)) { flow.setError(language === 'en' ? 'Choose a supported duration.' : 'Vui lòng chọn thời lượng được hỗ trợ.'); return }
    return flow.acquire(selectedSlot)
  }
  const matchesHold = flow.hold && selectedSlot && flow.hold.moduleKey === flow.moduleKey && JSON.stringify(holdSlot(flow.hold)) === JSON.stringify(selectedSlot)
  useEffect(() => {
    const intent = flow.restored
    if (!intent?.started || !flow.customer?.emailVerifiedAt || !flow.options || !selectedSlot || !flow.moduleKey || resumedIntent.current === intent) return
    resumedIntent.current = intent
    if (!matchesHold) flow.acquire(intent.slot)
  }, [flow, selectedSlot, matchesHold])
  const navUnit = viewMode === 'month' ? 'Month' : isMobile ? 'Day' : 'Week'
  const rangeTitle = viewMode === 'month' ? formatDate(currentDate, language, { month: 'long', year: 'numeric' }) : isMobile ? formatDate(selectedDate, language, { day: 'numeric', month: 'long', year: 'numeric' }) : `${formatDate(monday, language, { day: 'numeric', month: 'short' })} – ${formatDate(addDays(monday, days.length - 1), language, { day: 'numeric', month: 'short', year: 'numeric' })}`

  return (
    <div className="neotek-site-shell booking-page">
      {createPortal(<NeotekNavbar beforeCustomerLogout={async () => !flow.busy && await clearSelection()} />, document.body)}
      <main className="booking-main">
        <NeotekContainer><header className="booking-header"><p className="neotek-eyebrow">{t('booking.eyebrow')}</p><h1>{t('booking.title')}</h1><p>{t('booking.description')}</p></header></NeotekContainer>
        <div className="booking-page__workspace">
          <div className="booking-workspace">
            <div className="booking-workspace__body">
              <aside className="booking-sidebar" aria-label={t('booking.preferences')}>
                <details className="booking-sidebar__calendar" open={!isMobile}>
                  <summary><HugeiconsIcon icon={Calendar03Icon} size={18} color="currentColor" strokeWidth={1.6} aria-hidden="true" />{t('booking.chooseDate')}</summary>
                  <MiniCalendar {...{ month, currentDate, selectedDate, today, t, language }} onMonthChange={setMonth} onSelect={navigateDate} />
                </details>
                <fieldset className="booking-duration"><legend><HugeiconsIcon icon={Clock01Icon} size={16} color="currentColor" strokeWidth={1.6} aria-hidden="true" />{t('booking.duration')}</legend>
                  <div>{(policy?.durations ?? [30, 45, 60]).map((value) => <label key={value} className={duration === value ? 'is-selected' : ''}><input type="radio" name="duration" value={value} checked={duration === value} onChange={() => changeDuration(value)} /><span>{value} {language === 'en' ? 'min' : 'phút'}</span></label>)}</div>
                  {![30, 45, 60].includes(duration) && <p className="booking-duration__custom">{t('booking.customDuration', { count: duration })}</p>}
                </fieldset>
                <section className="booking-sidebar__legend" aria-label={language === 'en' ? 'Calendar legend' : 'Chú thích lịch'}>
                  <h2>{language === 'en' ? 'Calendar legend' : 'Chú thích lịch'}</h2>
                  <div className="booking-legend">
                    <span><i className="booking-legend__available" />{t('booking.available')}</span>
                    <span><i className="booking-legend__busy" />{language === 'en' ? 'Booked / unavailable' : 'Đã đặt / không khả dụng'}</span>
                    <span><i className="booking-legend__selected" />{t('booking.selected')}</span>
                    <span><i className="booking-legend__held" />{language === 'en' ? 'Your active hold' : 'Chỗ đang giữ của bạn'}</span>
                  </div>
                  <p className="booking-timezone"><HugeiconsIcon icon={Globe02Icon} size={14} color="currentColor" strokeWidth={1.6} aria-hidden="true" />{TIME_ZONE} · GMT+7</p>
                </section>
              </aside>
              <div className="booking-calendar-area" id="booking-view-panel" role="tabpanel" aria-labelledby={`booking-tab-${viewMode}`} tabIndex={0}>
                <div className="booking-toolbar">
              <div className="booking-toolbar__navigation">
                <NeotekButton variant="secondary" onClick={() => navigateDate(todayInTimezone())}>{t('booking.today')}</NeotekButton>
                <button type="button" className="booking-icon-button" aria-label={t(`booking.previous${navUnit}`)} onClick={() => navigatePeriod(-1)}><HugeiconsIcon icon={ArrowLeft01Icon} size={20} color="currentColor" strokeWidth={1.6} /></button>
                <button type="button" className="booking-icon-button" aria-label={t(`booking.next${navUnit}`)} onClick={() => navigatePeriod(1)}><HugeiconsIcon icon={ArrowRight01Icon} size={20} color="currentColor" strokeWidth={1.6} /></button>
                <h2 aria-live="polite">{rangeTitle}</h2>
              </div>
              <div className="booking-view-tabs" role="tablist" aria-label={t('booking.view')}>
                {views.map((view, index) => <button type="button" role="tab" key={view} id={`booking-tab-${view}`} aria-selected={viewMode === view} aria-controls="booking-view-panel" tabIndex={viewMode === view ? 0 : -1} className={`booking-view-tab${viewMode === view ? ' is-active' : ''}`} onClick={() => changeView(view)} onKeyDown={(event) => {
                  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
                  event.preventDefault()
                  const next = event.key === 'Home' ? 0 : event.key === 'End' ? views.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + views.length) % views.length
                  const target = event.currentTarget.parentElement.querySelectorAll('[role="tab"]')[next]
                  target.focus()
                  changeView(views[next])
                }}>{t(`booking.${view}`)}</button>)}
              </div>
            </div>
                {(flow.error || availabilityError) && <p className="booking-calendar-status" role="alert">{flow.error || availabilityError} <button type="button" onClick={flow.retry}>{flow.copy.retry}</button></p>}
                {!availability && !availabilityError && <p className="booking-calendar-status" role="status">{flow.copy.loading}</p>}
                {flow.hold && !dialogOpen && <button className="booking-resume-hold" type="button" onClick={() => { const range = holdSlot(flow.hold); setSelectedSlot(range); setSelectedDate(parseDate(range.date)); setCurrentDate(parseDate(range.date)); setDialogOpen(true) }}>{flow.copy.hold} {Math.floor(flow.seconds / 60)}:{String(flow.seconds % 60).padStart(2, '0')}</button>}
                <p className="booking-calendar-help">{t(viewMode === 'month' ? 'booking.monthInstructions' : 'booking.instructions')}</p>
                {viewMode === 'month' ? <MonthCalendar {...{ currentDate, selectedDate, today, events, ownBookings, t, language }} onSelect={(date) => navigateDate(date, 'workWeek')} /> : <WeekCalendar {...{ days, today, events, ownBookings, selectedSlot, duration, t, language }} heldSlot={own ? holdSlot(own) : null} startMinute={policy?.startMinute} endMinute={policy?.endMinute} onSelect={selectSlot} />}
                <p className={`booking-feedback${feedback ? ' has-error' : ''}`} role="status">{feedback ? t(`booking.${feedback}`) : t(viewMode === 'month' ? 'booking.monthKeyboardHelp' : 'booking.keyboardHelp')}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <NeotekFooter showCta={false} demoHref={getLocalizedPath('/booking', language)} />
      {selectedSlot && <BookingDialog {...{ submitState, returnFocusRef, t, language }} flow={flow} matchesHold={matchesHold} onChangeTime={() => setDialogOpen(false)} open={dialogOpen} slot={selectedSlot} onSubmit={submitBooking} onClose={closeDialog} onBookAnother={clearSelection} homePath={getLocalizedPath('/', language)} />}
    </div>
  )
}
