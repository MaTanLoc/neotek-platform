import { useEffect, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { DragDropVerticalIcon } from '@hugeicons/core-free-icons'
import { dateKey, dragSelection, END_MINUTE, formatDate, minuteAtPosition, rangeAvailable, START_MINUTE, timeLabel } from './bookingUtils'

function DayColumn({ day, today, events, selectedSlot, duration, onSelect, t, language }) {
  const [cursor, setCursor] = useState(START_MINUTE)
  const [preview, setPreview] = useState(null)
  const columnRef = useRef(null)
  const dragRef = useRef(null)
  const frameRef = useRef(null)
  const key = dateKey(day)
  const selected = selectedSlot?.date === key
  const visibleRange = preview || (selected ? selectedSlot : null)
  const position = (range) => ({ top: `${(range.startMinutes - START_MINUTE) / (END_MINUTE - START_MINUTE) * 100}%`, height: `${(range.endMinutes - range.startMinutes) / (END_MINUTE - START_MINUTE) * 100}%` })

  useEffect(() => () => {
    cancelAnimationFrame(frameRef.current)
    const drag = dragRef.current
    if (drag?.target.hasPointerCapture(drag.pointerId)) drag.target.releasePointerCapture(drag.pointerId)
  }, [])

  useEffect(() => {
    if (document.activeElement !== columnRef.current || dragRef.current) return
    const scrollArea = columnRef.current.closest('.booking-calendar__scroll')
    const headerHeight = scrollArea.querySelector('.booking-calendar__corner').offsetHeight
    const rowHeight = columnRef.current.offsetHeight / 20
    const top = headerHeight + (cursor - START_MINUTE) / 30 * rowHeight
    if (top < scrollArea.scrollTop + headerHeight) scrollArea.scrollTop = top - headerHeight
    else if (top + rowHeight > scrollArea.scrollTop + scrollArea.clientHeight) scrollArea.scrollTop = top + rowHeight - scrollArea.clientHeight
  }, [cursor])

  const pointerMinute = (clientY, includeEnd = false) => {
    const bounds = columnRef.current.getBoundingClientRect()
    return minuteAtPosition(clientY, bounds.top, bounds.height, includeEnd)
  }
  const updatePreview = (clientY) => {
    const drag = dragRef.current
    if (!drag) return
    const minute = pointerMinute(clientY, drag.mode === 'select')
    let range
    if (drag.mode === 'move') {
      const length = drag.original.endMinutes - drag.original.startMinutes
      const startMinutes = Math.max(START_MINUTE, Math.min(END_MINUTE - length, drag.original.startMinutes + minute - drag.anchor))
      range = { date: key, startMinutes, endMinutes: startMinutes + length }
    } else range = dragSelection(key, drag.anchor, minute, events)
    drag.range = range
    setPreview((current) => current?.startMinutes === range.startMinutes && current?.endMinutes === range.endMinutes ? current : range)
  }
  const autoScroll = () => {
    const drag = dragRef.current
    if (!drag) return
    const scrollArea = columnRef.current.closest('.booking-calendar__scroll')
    const bounds = scrollArea.getBoundingClientRect()
    const headerHeight = scrollArea.querySelector('.booking-calendar__corner').offsetHeight
    const previousTop = scrollArea.scrollTop
    if (drag.moved && drag.clientY > bounds.bottom - 24) scrollArea.scrollTop += 8
    else if (drag.moved && drag.clientY < bounds.top + headerHeight + 24) scrollArea.scrollTop -= 8
    if (scrollArea.scrollTop !== previousTop) updatePreview(drag.clientY)
    frameRef.current = requestAnimationFrame(autoScroll)
  }
  const startDrag = (event, mode) => {
    if (!event.isPrimary || event.button !== 0) return
    const anchor = pointerMinute(event.clientY)
    if (mode === 'select' && !rangeAvailable({ date: key, startMinutes: anchor, endMinutes: anchor + 30 }, events)) return
    event.preventDefault()
    event.currentTarget.focus({ preventScroll: true })
    event.currentTarget.setPointerCapture(event.pointerId)
    const range = mode === 'move' ? selectedSlot : { date: key, startMinutes: anchor, endMinutes: anchor + duration }
    dragRef.current = { pointerId: event.pointerId, target: event.currentTarget, mode, anchor, original: selectedSlot, range, moved: false, startY: event.clientY, clientY: event.clientY }
    setCursor(anchor)
    setPreview(range)
    frameRef.current = requestAnimationFrame(autoScroll)
  }
  const moveDrag = (event) => {
    const drag = dragRef.current
    if (!drag) {
      if (event.pointerType === 'mouse') setCursor(pointerMinute(event.clientY))
      return
    }
    if (event.pointerId !== drag.pointerId) return
    drag.clientY = event.clientY
    drag.moved ||= Math.abs(event.clientY - drag.startY) > 5
    if (drag.moved) updatePreview(event.clientY)
  }
  const finishDrag = (event, cancelled = false) => {
    const drag = dragRef.current
    if (!drag || event.pointerId !== drag.pointerId) return
    cancelAnimationFrame(frameRef.current)
    dragRef.current = null
    setPreview(null)
    if (drag.target.hasPointerCapture(event.pointerId)) drag.target.releasePointerCapture(event.pointerId)
    if (!cancelled) onSelect(drag.range, drag.target)
  }
  const pointerHandlers = {
    onPointerMove: moveDrag,
    onPointerUp: (event) => finishDrag(event),
    onPointerCancel: (event) => finishDrag(event, true),
    onLostPointerCapture: (event) => finishDrag(event, true),
  }
  const handleKeyDown = (event) => {
    if (['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
      event.preventDefault()
      setCursor((value) => event.key === 'Home' ? START_MINUTE : event.key === 'End' ? END_MINUTE - 30 : Math.max(START_MINUTE, Math.min(END_MINUTE - 30, value + (event.key === 'ArrowDown' ? 30 : -30))))
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect({ date: key, startMinutes: cursor, endMinutes: cursor + duration }, columnRef.current)
    } else if (event.key === 'Escape' && dragRef.current) {
      event.preventDefault()
      finishDrag({ pointerId: dragRef.current.pointerId }, true)
    }
  }

  return (
    <div className={`booking-day${key === dateKey(today) ? ' is-today' : ''}${preview ? ' is-dragging' : ''}`}>
      <button type="button" ref={columnRef} className="booking-day__surface"
        aria-label={t('booking.dayInstructions', { date: formatDate(day, language), time: timeLabel(cursor) })}
        onPointerDown={(event) => startDrag(event, 'select')} {...pointerHandlers} onKeyDown={handleKeyDown}
        onClick={(event) => { if (event.detail === 0) onSelect({ date: key, startMinutes: cursor, endMinutes: cursor + duration }, columnRef.current) }}>
        <span className="booking-day__cursor" style={position({ startMinutes: cursor, endMinutes: cursor + 30 })} aria-hidden="true">{timeLabel(cursor)}</span>
      </button>
      {events.map((event) => <div key={`${event.startMinutes}-${event.endMinutes}`} className="booking-event booking-event--busy" aria-disabled="true" style={position(event)}>
        <span>{t('booking.busy')}</span><small>{timeLabel(event.startMinutes)} – {timeLabel(event.endMinutes)}</small>
      </div>)}
      {visibleRange && <button type="button"
        className={`booking-event booking-event--selected${preview ? ' is-preview' : ''}${preview && !rangeAvailable(preview, events) ? ' is-conflict' : ''}`}
        style={position(visibleRange)} aria-label={t('booking.moveSelection', { start: timeLabel(visibleRange.startMinutes), end: timeLabel(visibleRange.endMinutes) })}
        onPointerDown={(event) => startDrag(event, 'move')} {...pointerHandlers}
        onClick={(event) => { if (event.detail === 0 && selectedSlot) onSelect(selectedSlot, event.currentTarget) }}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && dragRef.current) { event.preventDefault(); finishDrag({ pointerId: dragRef.current.pointerId }, true); return }
          if (!selectedSlot || !['ArrowUp', 'ArrowDown'].includes(event.key)) return
          event.preventDefault()
          const offset = event.key === 'ArrowDown' ? 30 : -30
          onSelect({ ...selectedSlot, startMinutes: selectedSlot.startMinutes + offset, endMinutes: selectedSlot.endMinutes + offset }, event.currentTarget, false)
        }}>
        <span>{t('booking.selected')}</span><small>{timeLabel(visibleRange.startMinutes)} – {timeLabel(visibleRange.endMinutes)}</small>
        <HugeiconsIcon icon={DragDropVerticalIcon} className="booking-event__handle" size={16} color="currentColor" strokeWidth={1.6} aria-hidden="true" />
      </button>}
      <span className="neotek-visually-hidden" aria-live="polite">{preview ? `${timeLabel(preview.startMinutes)} – ${timeLabel(preview.endMinutes)}` : timeLabel(cursor)}</span>
    </div>
  )
}

export default function WeekCalendar({ days, today, events, selectedSlot, duration, onSelect, t, language }) {
  return (
    <section className={`booking-calendar booking-calendar--${days.length}-days`} aria-label={t('booking.calendar')}>
      <div className="booking-calendar__scroll" tabIndex={0} aria-label={t('booking.timeline')}>
        <div className="booking-calendar__grid">
          <div className="booking-calendar__corner">{t('booking.gmt')}</div>
          {days.map((day) => <div className={`booking-calendar__day-heading${dateKey(day) === dateKey(today) ? ' is-today' : ''}`} key={dateKey(day)}>
            <span>{formatDate(day, language, { weekday: 'short' })}</span><strong>{day.getDate()}</strong>
          </div>)}
          <div className="booking-time-axis" aria-hidden="true">{Array.from({ length: 11 }, (_, index) => <span key={index} style={{ top: `${index * 10}%` }}>{timeLabel(START_MINUTE + index * 60)}</span>)}</div>
          {days.map((day) => <DayColumn key={dateKey(day)} {...{ day, today, duration, selectedSlot, onSelect, t, language }} events={events.filter((event) => event.date === dateKey(day))} />)}
        </div>
      </div>
    </section>
  )
}
