/**
 * localStorage helpers — safe wrappers that never throw
 * (Same pattern as Attendance-tracker)
 */

export function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (_) {
    // Storage quota exceeded — silently ignore
  }
}

export function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw !== null ? JSON.parse(raw) : fallback
  } catch (_) {
    return fallback
  }
}

export function exportAllData(state) {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    foodLog: state.foodLog.entries,
    goals: state.goals,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `calorie-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}
