// Pure helpers that DERIVE overdue / today placement without mutating storage.
import { daysBetween, todayKey } from './time'

// A task is overdue if it's not done and its date is strictly before today.
export function overdueDays(task, today = todayKey()) {
  if (task.done) return 0
  const diff = daysBetween(task.date, today)
  return diff > 0 ? diff : 0
}

export function isOverdue(task, today = todayKey()) {
  return overdueDays(task, today) > 0
}

// The day-column a task should VISUALLY appear in: overdue tasks float up to today.
export function displayDateKey(task, today = todayKey()) {
  return isOverdue(task, today) ? today : task.date
}

// Sort within a day: overdue (top, by most overdue) -> timed (by start) -> anytime.
export function sortForDay(tasks, today = todayKey()) {
  return [...tasks].sort((a, b) => {
    const ao = overdueDays(a, today)
    const bo = overdueDays(b, today)
    if (ao !== bo) return bo - ao // more overdue first
    if (ao > 0 || bo > 0) return 0
    const at = a.anytime ? Infinity : a.start ?? Infinity
    const bt = b.anytime ? Infinity : b.start ?? Infinity
    if (at !== bt) return at - bt
    return a.createdAt - b.createdAt
  })
}

// Group derived task lists keyed by their DISPLAY day.
export function bucketByDisplayDay(tasks, dayKeys, today = todayKey()) {
  const buckets = Object.fromEntries(dayKeys.map((k) => [k, []]))
  for (const t of tasks) {
    if (t.done) continue
    const k = displayDateKey(t, today)
    if (k in buckets) buckets[k].push(t)
  }
  for (const k of dayKeys) buckets[k] = sortForDay(buckets[k], today)
  return buckets
}
