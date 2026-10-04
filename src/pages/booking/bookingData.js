import { addDays, dateKey, startOfWeek } from './bookingUtils.js'

// Demonstration availability repeats relative to the displayed week.
// It does not represent a real consultant's calendar.
const busyPattern = [
  { day: 0, startMinutes: 570, endMinutes: 630 },
  { day: 0, startMinutes: 840, endMinutes: 900 },
  { day: 1, startMinutes: 660, endMinutes: 720 },
  { day: 2, startMinutes: 540, endMinutes: 600 },
  { day: 2, startMinutes: 900, endMinutes: 990 },
  { day: 3, startMinutes: 780, endMinutes: 870 },
  { day: 4, startMinutes: 600, endMinutes: 690 },
]

export function getMockBusyEvents(date) {
  const monday = startOfWeek(date)
  return busyPattern.map(({ day, ...event }) => ({ ...event, date: dateKey(addDays(monday, day)), type: 'busy' }))
}
