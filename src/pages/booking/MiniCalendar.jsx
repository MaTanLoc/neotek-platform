import { useRef } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { addDays, changeMonth, dateKey, formatDate, monthDays, startOfWeek } from './bookingUtils'

export default function MiniCalendar({ month, onMonthChange, currentDate, selectedDate, today, onSelect, t, language }) {
  const tableRef = useRef(null)
  const days = monthDays(month)
  const weekdays = Array.from({ length: 7 }, (_, index) => addDays(startOfWeek(today), index))
  const weekStart = dateKey(startOfWeek(currentDate))
  const weekEnd = dateKey(addDays(startOfWeek(currentDate), 6))
  return (
    <div className="booking-mini">
      <div className="booking-mini__heading">
        <strong>{formatDate(month, language, { month: 'long', year: 'numeric' })}</strong>
        <button type="button" className="booking-icon-button" aria-label={t('booking.previousMonth')} onClick={() => onMonthChange(changeMonth(month, -1))}><HugeiconsIcon icon={ArrowLeft01Icon} size={16} color="currentColor" strokeWidth={1.6} /></button>
        <button type="button" className="booking-icon-button" aria-label={t('booking.nextMonth')} onClick={() => onMonthChange(changeMonth(month, 1))}><HugeiconsIcon icon={ArrowRight01Icon} size={16} color="currentColor" strokeWidth={1.6} /></button>
      </div>
      <table ref={tableRef} className="booking-mini__table" role="grid" aria-label={t('booking.chooseDate')}>
        <thead><tr>{weekdays.map((day) => <th scope="col" key={dateKey(day)}>{formatDate(day, language, { weekday: 'narrow' })}</th>)}</tr></thead>
        <tbody>{Array.from({ length: 6 }, (_, row) => (
          <tr key={row}>{days.slice(row * 7, row * 7 + 7).map((day) => {
            const key = dateKey(day)
            return <td key={key} aria-selected={key === dateKey(selectedDate)} className={`${key >= weekStart && key <= weekEnd ? 'is-current-week' : ''}${key === weekStart ? ' is-week-start' : ''}${key === weekEnd ? ' is-week-end' : ''}`}><button type="button"
              className={`booking-mini__date${day.getMonth() !== month.getMonth() ? ' is-muted' : ''}${key === dateKey(selectedDate) ? ' is-selected' : ''}${key === dateKey(today) ? ' is-today' : ''}`}
              aria-label={formatDate(day, language)} aria-current={key === dateKey(today) ? 'date' : undefined}
              data-date={key} onKeyDown={(event) => {
                const offset = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key]
                if (offset === undefined) return
                event.preventDefault()
                const nextDate = addDays(day, offset)
                onSelect(nextDate)
                requestAnimationFrame(() => tableRef.current?.querySelector(`[data-date="${dateKey(nextDate)}"]`)?.focus({ preventScroll: true }))
              }}
              onClick={() => onSelect(day)}>{day.getDate()}</button></td>
          })}</tr>
        ))}</tbody>
      </table>
    </div>
  )
}
