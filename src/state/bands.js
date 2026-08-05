// Shared task-partitioning + lane-packing used by ALL three views.
//
// Before this module the app had two divergent grouping implementations — the
// inline partition inside Timeline's DayCol and `bucketByDisplayDay` in
// rollover.js — which is why Week/Month silently had no completed section.
// Every view now derives its bands from here.
import { todayKey } from './time'
import { displayDateKey, isOverdue, overdueDays } from './rollover'

// keep in sync with TimedBar MIN_PX / the bar gap
export const BAR_MIN_PX = 42
export const BAR_GAP_PX = 6

// An unranked task sorts as if it were mid-scale, so tasks the user never
// bothered to rate interleave naturally instead of sinking to the bottom.
// NOTE: this is a SORT fallback only — `urgency: null` must still *display*
// as "not ranked" everywhere. Never render this number.
export const NEUTRAL_URGENCY = 5
export const rankOf = (t) => (t.urgency == null ? NEUTRAL_URGENCY : t.urgency)

// Greedy lane packing so timed tasks stack vertically. Uses each task's
// *effective* span (true span OR the min render width, whichever is wider) so
// short tasks inflated to the minimum don't visually overlap their neighbours.
export function packLanes(timed, dayWidth) {
  const minMin = dayWidth ? ((BAR_MIN_PX + BAR_GAP_PX) / dayWidth) * 1440 : 0
  const sorted = [...timed].sort((a, b) => (a.start ?? 0) - (b.start ?? 0))
  const laneEnds = []
  const out = []
  for (const t of sorted) {
    const s = t.start ?? 0
    const trueE = t.end != null && t.end > s ? t.end : s + 30
    const e = Math.max(trueE, s + minMin)
    let lane = laneEnds.findIndex((end) => end <= s)
    if (lane === -1) { lane = laneEnds.length; laneEnds.push(e) }
    else laneEnds[lane] = e
    out.push({ task: t, lane })
  }
  return { rows: out, laneCount: Math.max(1, laneEnds.length) }
}

// Overdue ordering: what matters most first, then what's been waiting longest.
export function sortOverdue(tasks, today = todayKey()) {
  return [...tasks].sort((a, b) => {
    const r = rankOf(b) - rankOf(a)
    if (r !== 0) return r
    return overdueDays(b, today) - overdueDays(a, today)
  })
}

// The four bands a day column renders, in visual order.
export function dayBands(tasks, key, today = todayKey()) {
  const active = tasks.filter((t) => !t.done && displayDateKey(t, today) === key)
  const completed = tasks
    .filter((t) => t.done && t.date === key)
    .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))
  const overdue = sortOverdue(active.filter((t) => isOverdue(t, today)), today)
  const timed = active.filter((t) => !isOverdue(t, today) && t.start != null)
  const anytime = active.filter((t) => !isOverdue(t, today) && t.start == null)
  return { overdue, timed, anytime, completed }
}

// How many overdue tasks a pile shows before the rest collapse into a sticker.
// The cap is the whole point: unbounded visual debt drives task-initiation
// paralysis in the population this app targets. See docs/CONSTITUTION.md.
export const OVERDUE_VISIBLE = 3
