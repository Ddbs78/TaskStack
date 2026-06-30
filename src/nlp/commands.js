// Local command matcher for the assistant. Returns a structured action + reply,
// or null if nothing matched (caller may then fall back to the Claude API).
import { addDays, dateKey, fmtRange, todayKey, daysBetween } from '../state/time'
import { isOverdue, overdueDays, displayDateKey } from '../state/rollover'

const list = (tasks) =>
  tasks.length
    ? tasks.map((t) => `• ${t.title}${t.anytime ? '' : ' (' + fmtRange(t.start, t.end) + ')'}`).join('\n')
    : '—'

export function runCommand(input, tasks) {
  const q = input.trim().toLowerCase()
  if (!q) return null
  const today = todayKey()
  const active = tasks.filter((t) => !t.done)

  // --- ACTIONS FIRST (they contain verbs that would also match queries) ----

  // Move all of today's tasks to tomorrow.
  if (/move.*(today|todays|today's).*(tomorrow|tmrw)/.test(q)) {
    const ids = active.filter((t) => displayDateKey(t, today) === today).map((t) => t.id)
    const target = dateKey(addDays(new Date(), 1))
    return {
      action: { type: 'bulkPatch', ids, patch: { date: target } },
      reply: ids.length ? `Moved ${ids.length} task${ids.length > 1 ? 's' : ''} to tomorrow.` : 'Nothing on today to move.',
    }
  }

  // Move / reschedule / pull overdue to today.
  if (/(move|reschedule|pull|bring).*(over\s?due)/.test(q)) {
    const ids = active.filter((t) => isOverdue(t, today)).map((t) => t.id)
    return {
      action: { type: 'bulkPatch', ids, patch: { date: today } },
      reply: ids.length ? `Pulled ${ids.length} overdue task${ids.length > 1 ? 's' : ''} to today.` : 'Nothing overdue.',
    }
  }

  // Clear / complete everything today.
  if (/(clear|complete|finish|done with).*(today)/.test(q)) {
    const ids = active.filter((t) => displayDateKey(t, today) === today).map((t) => t.id)
    return {
      action: { type: 'completeMany', ids },
      reply: ids.length ? `Completed ${ids.length} task${ids.length > 1 ? 's' : ''}.` : 'Today is already clear.',
    }
  }

  // --- QUERIES --------------------------------------------------------------

  // What's overdue?
  if (/(over\s?due|late|missed|behind)/.test(q)) {
    const od = active
      .filter((t) => isOverdue(t, today))
      .sort((a, b) => overdueDays(b, today) - overdueDays(a, today))
    return {
      reply: od.length
        ? `You have ${od.length} overdue:\n` +
          od.map((t) => `• ${t.title} — ${overdueDays(t, today)}d overdue`).join('\n')
        : 'Nothing overdue.',
    }
  }

  // What's coming up / today / tomorrow / this week?
  if (/(coming up|upcoming|what.*(do|have)|schedule|agenda|today|tomorrow|this week)/.test(q)) {
    if (/this week/.test(q)) {
      const within = active.filter((t) => {
        const d = daysBetween(today, displayDateKey(t, today))
        return d >= 0 && d <= 6
      })
      return { reply: `Next 7 days:\n${list(within)}` }
    }
    if (/tomorrow/.test(q)) {
      const k = dateKey(addDays(new Date(), 1))
      return { reply: `Tomorrow:\n${list(active.filter((t) => t.date === k))}` }
    }
    const todays = active.filter((t) => displayDateKey(t, today) === today)
    return { reply: `Today:\n${list(todays)}` }
  }

  return null
}
