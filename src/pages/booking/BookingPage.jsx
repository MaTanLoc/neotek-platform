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
import { getMockBusyEvents } from './bookingData'
import { addDays, changeMonth, formatDate, monthDays, parseDate, rangeAvailable, startOfWeek, TIME_ZONE, todayInTimezone } from './bookingUtils'
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
  const [confirmedEvents, setConfirmedEvents] = useState([])
  const [feedback, setFeedback] = useState('')
  const returnFocusRef = useRef(null)
  const monday = startOfWeek(currentDate)
  const days = isMobile ? [selectedDate] : Array.from({ length: viewMode === 'workWeek' ? 5 : 7 }, (_, index) => addDays(monday, index))
  const mockEvents = viewMode === 'month' ? monthDays(currentDate).filter((_, index) => index % 7 === 0).flatMap(getMockBusyEvents) : getMockBusyEvents(currentDate)
  const events = [...mockEvents, ...confirmedEvents]
  const language = i18n.language

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)')
    const update = () => setIsMobile(media.matches)
    media.addEventListener('change', update)
    const timer = window.setInterval(() => setToday(todayInTimezone()), 60000)
    return () => { media.removeEventListener('change', update); window.clearInterval(timer) }
  }, [])

  const clearSelection = () => { setDialogOpen(false); setSelectedSlot(null); setSubmitState('idle') }
  const closeDialog = () => {
    setDialogOpen(false)
    if (submitState === 'success') { setSelectedSlot(null); setSubmitState('idle') }
  }
  const navigateDate = (date, nextView = viewMode) => {
    setCurrentDate(date)
    setSelectedDate(date)
    setMonth(date)
    clearSelection()
    setFeedback('')
    setViewMode(nextView === 'workWeek' && (date.getDay() === 0 || date.getDay() === 6) ? 'week' : nextView)
  }
  const navigatePeriod = (offset) => navigateDate(viewMode === 'month' ? changeMonth(currentDate, offset) : addDays(selectedDate, offset * (isMobile ? 1 : 7)))
  const changeView = (view) => {
    setViewMode(view)
    clearSelection()
    setFeedback('')
    if (view === 'workWeek' && (selectedDate.getDay() === 0 || selectedDate.getDay() === 6)) setSelectedDate(monday)
  }
  const selectSlot = (range, source, openDialog = true) => {
    if (!rangeAvailable(range, events)) { setFeedback('conflict'); return }
    if (source) returnFocusRef.current = source
    setSelectedDate(parseDate(range.date))
    setSelectedSlot(range)
    setDuration(range.endMinutes - range.startMinutes)
    setSubmitState('idle')
    setDialogOpen(openDialog)
    setFeedback('')
  }
  const changeDuration = (value) => {
    setDuration(value)
    if (selectedSlot) {
      const range = { ...selectedSlot, endMinutes: selectedSlot.startMinutes + value }
      if (!rangeAvailable(range, events)) { clearSelection(); setFeedback('durationConflict'); return }
      setSelectedSlot(range)
    }
    setFeedback('')
  }
  const submitBooking = () => {
    if (!selectedSlot || !rangeAvailable(selectedSlot, events)) { clearSelection(); setFeedback('conflict'); return }
    setConfirmedEvents((current) => [...current, { ...selectedSlot, type: 'busy' }])
    setSubmitState('success')
  }
  const navUnit = viewMode === 'month' ? 'Month' : isMobile ? 'Day' : 'Week'
  const rangeTitle = viewMode === 'month' ? formatDate(currentDate, language, { month: 'long', year: 'numeric' }) : isMobile ? formatDate(selectedDate, language, { day: 'numeric', month: 'long', year: 'numeric' }) : `${formatDate(monday, language, { day: 'numeric', month: 'short' })} – ${formatDate(addDays(monday, days.length - 1), language, { day: 'numeric', month: 'short', year: 'numeric' })}`

  return (
    <div className="neotek-site-shell booking-page">
      {createPortal(<NeotekNavbar />, document.body)}
      <main className="booking-main">
        <NeotekContainer><header className="booking-header"><p className="neotek-eyebrow">{t('booking.eyebrow')}</p><h1>{t('booking.title')}</h1><p>{t('booking.description')}</p></header></NeotekContainer>
        <div className="booking-page__workspace">
          <div className="booking-workspace">
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
            <div className="booking-workspace__body">
              <aside className="booking-sidebar" aria-label={t('booking.preferences')}>
                <details className="booking-sidebar__calendar" open={!isMobile}>
                  <summary><HugeiconsIcon icon={Calendar03Icon} size={18} color="currentColor" strokeWidth={1.6} aria-hidden="true" />{t('booking.chooseDate')}</summary>
                  <MiniCalendar {...{ month, currentDate, selectedDate, today, t, language }} onMonthChange={setMonth} onSelect={navigateDate} />
                </details>
                <fieldset className="booking-duration"><legend><HugeiconsIcon icon={Clock01Icon} size={16} color="currentColor" strokeWidth={1.6} aria-hidden="true" />{t('booking.duration')}</legend>
                  <div>{[30, 45, 60].map((value) => <label key={value} className={duration === value ? 'is-selected' : ''}><input type="radio" name="duration" value={value} checked={duration === value} onChange={() => changeDuration(value)} /><span>{t('booking.minutes', { count: value })}</span></label>)}</div>
                  {![30, 45, 60].includes(duration) && <p className="booking-duration__custom">{t('booking.customDuration', { count: duration })}</p>}
                </fieldset>
                <div className="booking-timezone"><HugeiconsIcon icon={Globe02Icon} size={16} color="currentColor" strokeWidth={1.6} aria-hidden="true" /><div><strong>{t('booking.timezone')}</strong><span>{TIME_ZONE}</span><span>{t('booking.gmt')}</span></div></div>
                <div className="booking-legend"><span><i className="booking-legend__available" />{t('booking.available')}</span><span><i className="booking-legend__busy" />{t('booking.busy')}</span></div>
                <p className="booking-sidebar__notice">{t('booking.mockAvailability')}</p>
              </aside>
              <div className="booking-calendar-area" id="booking-view-panel" role="tabpanel" aria-labelledby={`booking-tab-${viewMode}`} tabIndex={0}>
                <p className="booking-calendar-help">{t(viewMode === 'month' ? 'booking.monthInstructions' : 'booking.instructions')}</p>
                {viewMode === 'month' ? <MonthCalendar {...{ currentDate, selectedDate, today, events, t, language }} onSelect={(date) => navigateDate(date, 'workWeek')} /> : <WeekCalendar {...{ days, today, events, selectedSlot, duration, t, language }} onSelect={selectSlot} />}
                <p className={`booking-feedback${feedback ? ' has-error' : ''}`} role="status">{feedback ? t(`booking.${feedback}`) : t(viewMode === 'month' ? 'booking.monthKeyboardHelp' : 'booking.keyboardHelp')}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <NeotekFooter showCta={false} demoHref={getLocalizedPath('/booking', language)} />
      {selectedSlot && <BookingDialog {...{ submitState, returnFocusRef, t, language }} open={dialogOpen} slot={selectedSlot} onSubmit={submitBooking} onClose={closeDialog} onBookAnother={clearSelection} homePath={getLocalizedPath('/', language)} />}
    </div>
  )
}
