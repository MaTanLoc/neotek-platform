export const TIME_ZONE = 'Asia/Ho_Chi_Minh'
export const START_MINUTE = 8 * 60
export const END_MINUTE = 18 * 60

export function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function todayInTimezone(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now)
  const value = (type) => Number(parts.find((part) => part.type === type).value)
  return new Date(value('year'), value('month') - 1, value('day'), 12)
}

export function addDays(date, days) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function startOfWeek(date) {
  return addDays(date, -((date.getDay() + 6) % 7))
}

export function monthDays(date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1, 12)
  return Array.from({ length: 42 }, (_, index) => addDays(startOfWeek(first), index))
}

export function changeMonth(date, offset) {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1, 12)
}

export function timeLabel(minutes) {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

export function timeMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export function rangeAvailable(range, events, startMinute = START_MINUTE, endMinute = END_MINUTE) {
  return Number.isFinite(range.startMinutes) && Number.isFinite(range.endMinutes) &&
    range.startMinutes >= startMinute && range.endMinutes <= endMinute && range.endMinutes > range.startMinutes &&
    !events.some((event) => event.date === range.date && range.startMinutes < event.endMinutes && range.endMinutes > event.startMinutes)
}

export function minuteAtPosition(clientY, top, height, includeEnd = false, startMinute = START_MINUTE, endMinute = END_MINUTE) {
  const minutes = startMinute + Math.floor((clientY - top) / height * (endMinute - startMinute) / 30) * 30
  return Math.max(startMinute, Math.min(includeEnd ? endMinute : endMinute - 30, minutes))
}

export function dragSelection(date, anchor, cursor, events) {
  let startMinutes = Math.min(anchor, cursor)
  let endMinutes = cursor > anchor ? cursor : anchor + 30
  // Stop at the first busy boundary; dragging can never jump through a busy period.
  for (const event of events.filter((event) => event.date === date)) {
    if (cursor >= anchor && event.startMinutes >= anchor) endMinutes = Math.min(endMinutes, event.startMinutes)
    if (cursor < anchor && event.endMinutes <= anchor) startMinutes = Math.max(startMinutes, event.endMinutes)
  }
  return { date, startMinutes, endMinutes }
}

export function formatDate(date, language, options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) {
  return new Intl.DateTimeFormat(language === 'en' ? 'en-GB' : 'vi-VN', options).format(date)
}

export function parseDate(key) {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, month - 1, day, 12)
}
