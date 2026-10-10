import { useRef } from 'react'
import { addDays, dateKey, formatDate, monthDays, startOfWeek, timeLabel } from './bookingUtils'
import { statusLabel } from '../../customer/customerCopy'

export default function MonthCalendar({ currentDate, selectedDate, today, events, ownBookings = [], onSelect, t, language }) {
  const days = monthDays(currentDate)
  const gridRef = useRef(null)
  const weekdays = Array.from({ length: 7 }, (_, index) => addDays(startOfWeek(today), index))

  return (
    <section className="booking-month" aria-label={t('booking.monthCalendar')}>
      <div className="booking-month__scroll">
        <div className="booking-month__grid" ref={gridRef}>
          {weekdays.map((day) => <div className="booking-month__weekday" key={dateKey(day)}>{formatDate(day, language, { weekday: 'short' })}</div>)}
          {days.map((day) => {
            const key = dateKey(day)
            const dayEvents = [...ownBookings.filter(b => b.date === key), ...events.filter(event => event.date === key)]
            return <button type="button" key={key} data-date={key}
              className={`booking-month__day${day.getMonth() !== currentDate.getMonth() ? ' is-muted' : ''}${key === dateKey(today) ? ' is-today' : ''}${key === dateKey(selectedDate) ? ' is-selected' : ''}`}
              aria-label={t('booking.monthDayInstructions', { date: formatDate(day, language), count: dayEvents.length })}
              aria-pressed={key === dateKey(selectedDate)} aria-current={key === dateKey(today) ? 'date' : undefined}
              onClick={() => onSelect(day)} onKeyDown={(event) => {
                const offset = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key]
                if (offset === undefined) return
                event.preventDefault()
                gridRef.current?.querySelector(`[data-date="${dateKey(addDays(day, offset))}"]`)?.focus()
              }}>
              <span className="booking-month__date">{day.getDate()}</span>
              <span className="booking-month__events">{dayEvents.slice(0, 2).map(event => <span key={event.id || `${event.startMinutes}-${event.endMinutes}`} className={`booking-month__event${event.id ? ' booking-month__event--own' : ''}`} title={event.id ? `${event.solution} · ${statusLabel(event.status, language)}` : undefined}>{timeLabel(event.startMinutes)} – {timeLabel(event.endMinutes)} · {event.id ? `${event.solution} · ${statusLabel(event.status, language)}` : t('booking.busy')}</span>)}</span>
              {dayEvents.length > 2 && <span className="booking-month__more">{t('booking.moreEvents', { count: dayEvents.length - 2 })}</span>}
              {dayEvents.length > 0 && <span className="booking-month__mobile-count">{dayEvents.length}</span>}
            </button>
          })}
        </div>
      </div>
    </section>
  )
}
