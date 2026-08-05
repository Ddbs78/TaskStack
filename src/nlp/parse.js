// Tiny deterministic natural-language parser for task entry.
// "Dentist Friday at 3" -> { title: 'Dentist', date: <fri>, start: 900, end: null }
// "Meetup tomorrow 10am-10pm" -> range. Always runs locally, instantly.
import { addDays, dateKey } from '../state/time'

const WEEKDAYS = {
  sunday: 0, sun: 0, monday: 1, mon: 1, tuesday: 2, tue: 2, tues: 2,
  wednesday: 3, wed: 3, thursday: 4, thu: 4, thurs: 4, friday: 5, fri: 5,
  saturday: 6, sat: 6,
}

function nextWeekday(target, from = new Date()) {
  const d = new Date(from)
  let diff = (target - d.getDay() + 7) % 7
  if (diff === 0) diff = 7 // "monday" means the upcoming one, not today
  return addDays(d, diff)
}

// returns minutes-from-midnight for a clock token, or null
function clockToMinutes(hStr, mStr, ap) {
  let h = parseInt(hStr, 10)
  const m = mStr ? parseInt(mStr, 10) : 0
  if (h < 0 || h > 23 || m > 59) return null
  if (ap) {
    const isPm = /p/i.test(ap)
    if (h === 12) h = isPm ? 12 : 0
    else if (isPm) h += 12
  }
  return h * 60 + m
}

export function parseInput(raw, now = new Date()) {
  let text = ' ' + raw + ' '
  let date = null
  let start = null
  let end = null
  const matched = [] // ranges [s,e) in `text` to strip from title

  const strip = (m) => matched.push([m.index, m.index + m[0].length])

  // --- DATE -----------------------------------------------------------------
  let m
  if ((m = /\b(today|tonight)\b/i.exec(text))) { date = dateKey(now); strip(m) }
  else if ((m = /\b(tomorrow|tmrw|tmr)\b/i.exec(text))) { date = dateKey(addDays(now, 1)); strip(m) }
  else if ((m = /\byesterday\b/i.exec(text))) { date = dateKey(addDays(now, -1)); strip(m) }
  else if ((m = /\bin (\d{1,3}) (day|days|week|weeks)\b/i.exec(text))) {
    const n = parseInt(m[1], 10) * (/week/i.test(m[2]) ? 7 : 1)
    date = dateKey(addDays(now, n)); strip(m)
  } else if ((m = /\b(next\s+)?(sunday|sun|monday|mon|tuesday|tues|tue|wednesday|wed|thursday|thurs|thu|friday|fri|saturday|sat)\b/i.exec(text))) {
    const wd = WEEKDAYS[m[2].toLowerCase()]
    date = dateKey(nextWeekday(wd, now)); strip(m)
  }

  // --- TIME RANGE  "10am-10pm" / "10-11am" / "3 to 5pm" ---------------------
  const rangeRe = /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:-|–|to|until)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i
  if ((m = rangeRe.exec(text))) {
    let ap1 = m[3]
    const ap2 = m[6]
    if (!ap1 && ap2) ap1 = ap2 // "10-11am" -> both am
    const s = clockToMinutes(m[1], m[2], ap1)
    const e = clockToMinutes(m[4], m[5], ap2 || ap1)
    if (s != null && e != null) { start = s; end = e; strip(m) }
  }

  // --- SINGLE TIME  "at 3" / "3pm" / "at 14:30" ----------------------------
  if (start == null) {
    const atRe = /\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i
    const atRe24 = /\bat\s+(\d{1,2})(?::(\d{2}))?\b/i
    if ((m = atRe.exec(text))) { start = clockToMinutes(m[1], m[2], m[3]); strip(m) }
    else if ((m = atRe24.exec(text))) {
      let s = clockToMinutes(m[1], m[2], null)
      // bare "at 3" with no am/pm: assume daytime (3 -> 15:00 if < 7)
      if (s != null && parseInt(m[1], 10) < 7 && !m[2]) s += 720
      start = s; strip(m)
    }
  }

  // --- build cleaned title ---------------------------------------------------
  matched.sort((a, b) => b[0] - a[0])
  for (const [s, e] of matched) text = text.slice(0, s) + ' ' + text.slice(e)

  // --- urgency cues ----------------------------------------------------------
  // Lets the fast path rank without an extra tap. Deliberately conservative:
  // only unmistakable words. Runs AFTER the matched-index removal above —
  // stripping earlier would shift the indices still held in `matched`.
  let urgency = null
  const urgentRe = /\s*(!{2,}|\b(urgent|asap|critical)\b)/i
  const mildRe = /\s*\b(whenever|someday|no rush)\b/i
  let um
  if ((um = urgentRe.exec(text))) { urgency = 9; text = text.slice(0, um.index) + ' ' + text.slice(um.index + um[0].length) }
  else if ((um = mildRe.exec(text))) { urgency = 2; text = text.slice(0, um.index) + ' ' + text.slice(um.index + um[0].length) }

  let title = text.replace(/\b(at|on|by|this)\b\s*$/i, '').replace(/\s+/g, ' ').trim()
  title = title.replace(/[\s,]+$/, '').replace(/^[\s,]+/, '')

  return {
    title,
    date: date || dateKey(now),
    start,
    end,
    detectedDate: !!date,
    detectedTime: start != null,
    urgency,
  }
}
