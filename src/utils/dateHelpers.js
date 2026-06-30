/**
 * Date utility helpers — reused from Attendance-tracker
 */

export const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
export const MONTHS_FULL  = ['January','February','March','April','May','June','July','August','September','October','November','December']

export function todayKey() {
  const n = new Date()
  return dateKey(n.getFullYear(), n.getMonth() + 1, n.getDate())
}

export function dateKey(y, m, d) {
  return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`
}

export function daysInMonth(y, m) {
  return new Date(y, m, 0).getDate()
}

export function isToday(key) {
  return key === todayKey()
}

export function formatDateFull(dateKeyStr) {
  if (!dateKeyStr) return ''
  const [y, m, d] = dateKeyStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

export function formatDateShort(dateKeyStr) {
  if (!dateKeyStr) return ''
  const [y, m, d] = dateKeyStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
}

/** Shift a YYYY-MM-DD string by +/-1 day */
export function shiftDay(dateKeyStr, delta) {
  const [y, m, d] = dateKeyStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + delta)
  return dateKey(dt.getFullYear(), dt.getMonth() + 1, dt.getDate())
}

/** Returns true if dateKeyStr is strictly in the future */
export function isFutureDate(dateKeyStr) {
  return dateKeyStr > todayKey()
}

/**
 * Monday-based first cell offset for a calendar grid.
 * Returns 0 for Monday, 1 for Tuesday, … 6 for Sunday.
 */
export function firstCellOffset(y, m) {
  const dow = new Date(y, m - 1, 1).getDay() // 0=Sun … 6=Sat
  return dow === 0 ? 6 : dow - 1
}
