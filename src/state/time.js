// Day math + a live "now" hook. No external date lib — keep it tiny.
import { useEffect, useRef, useState } from 'react'

export const DAY_START_HOUR = 6 // timeline visually spans 6:00 -> 24:00
export const DAY_END_HOUR = 24

export function startOfDay(d = new Date()) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export function addDays(d, n) {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

// Local YYYY-MM-DD key (never use toISOString — that shifts by timezone).
export function dateKey(d = new Date()) {
  const x = new Date(d)
  const y = x.getFullYear()
  const m = String(x.getMonth() + 1).padStart(2, '0')
  const day = String(x.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function keyToDate(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function daysBetween(aKey, bKey) {
  const a = keyToDate(aKey)
  const b = keyToDate(bKey)
  return Math.round((startOfDay(b) - startOfDay(a)) / 86400000)
}

export function todayKey() {
  return dateKey(new Date())
}

const WEEKDAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTH = ['January','February','March','April','May','June','July','August','September','October','November','December']

export function formatHeader(d) {
  return `${WEEKDAY[d.getDay()]}, ${MONTH[d.getMonth()]} ${d.getDate()}`
}

export function formatShort(d) {
  return { wd: WEEKDAY[d.getDay()].slice(0, 3), day: d.getDate(), mon: MONTH[d.getMonth()].slice(0, 3) }
}

// "Today" / "Tomorrow" / "Yesterday" / weekday — used to prefix task labels
// (e.g. "Today Anytime", "Tomorrow 10am–10pm").
export function relativeDayLabel(key, today = todayKey()) {
  const diff = daysBetween(today, key)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  return WEEKDAY[keyToDate(key).getDay()]
}

// "10am-10pm" style range from 24h numbers
export function fmtTime(minutes) {
  if (minutes == null) return ''
  let h = Math.floor(minutes / 60)
  const m = minutes % 60
  const ap = h >= 12 ? 'pm' : 'am'
  h = h % 12
  if (h === 0) h = 12
  return m === 0 ? `${h}${ap}` : `${h}:${String(m).padStart(2, '0')}${ap}`
}

export function fmtRange(start, end) {
  if (start == null) return 'Anytime'
  if (end == null) return fmtTime(start)
  return `${fmtTime(start)}–${fmtTime(end)}`
}

// Fraction (0..1) of the way through the full 24h day (12am→12am).
// The now-line uses this to position itself horizontally across a day column.
export function nowFraction(now = new Date()) {
  const mins = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60
  return Math.min(1, Math.max(0, mins / 1440))
}

// Fraction (0..1) across the day for an arbitrary minutes-from-midnight value.
export function fracOf(mins) {
  return Math.min(1, Math.max(0, mins / 1440))
}

// Live clock. Re-renders every `interval` ms; also fires on tab focus.
export function useNow(interval = 30000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), interval)
    const onFocus = () => setNow(new Date())
    window.addEventListener('focus', onFocus)
    return () => {
      clearInterval(id)
      window.removeEventListener('focus', onFocus)
    }
  }, [interval])
  return now
}

// Smooth (rAF) fraction for the gliding now-line position only.
export function useSmoothNowFraction() {
  const [frac, setFrac] = useState(() => nowFraction())
  const raf = useRef(0)
  useEffect(() => {
    let mounted = true
    const tick = () => {
      if (!mounted) return
      setFrac(nowFraction())
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => {
      mounted = false
      cancelAnimationFrame(raf.current)
    }
  }, [])
  return frac
}

// Tailwind-ish breakpoint hook. Returns true when viewport < `px`.
export function useIsMobile(px = 640) {
  const [m, setM] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < px : false))
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${px - 1}px)`)
    const on = () => setM(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [px])
  return m
}

// Calls cb() the moment local midnight rolls over (for re-deriving overdue).
export function useMidnightTick(cb) {
  const saved = useRef(cb)
  saved.current = cb
  useEffect(() => {
    let timeout
    const schedule = () => {
      const now = new Date()
      const next = startOfDay(addDays(now, 1))
      timeout = setTimeout(() => {
        saved.current?.()
        schedule()
      }, next - now + 500)
    }
    schedule()
    return () => clearTimeout(timeout)
  }, [])
}
