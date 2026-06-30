import { useMemo } from 'react'
import { AnimatePresence } from 'framer-motion'
import TaskCard from '../TaskCard'
import { addDays, dateKey, formatShort, startOfDay, todayKey } from '../../state/time'
import { bucketByDisplayDay } from '../../state/rollover'

// Desktop: 7 columns. Mobile: horizontal swipable day strip (snap).
export default function Week({ store, now, onEdit, actions }) {
  const today = todayKey()
  const variant = store.settings.taskStyle || 'filled'
  const start = startOfDay(now)
  // start the week on the current day so "today" is first and overdue lands here
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i))
  const keys = days.map(dateKey)
  const buckets = useMemo(() => bucketByDisplayDay(store.tasks, keys, today), [store.tasks, keys.join(), today])

  return (
    <div className="mx-auto h-full max-w-7xl px-3 pt-6 sm:px-8">
      <div className="no-scrollbar flex h-full snap-x snap-mandatory gap-3 overflow-x-auto md:grid md:grid-cols-7 md:overflow-visible">
        {days.map((d, i) => {
          const isToday = keys[i] === today
          const s = formatShort(d)
          return (
            <div key={keys[i]} className="flex min-w-[78vw] snap-center flex-col sm:min-w-[60vw] md:min-w-0">
              <div className="mb-3 text-center">
                <div className="text-xs font-bold uppercase" style={{ color: isToday ? 'var(--coral-strong)' : 'var(--text-faint)' }}>{s.wd}</div>
                <div className="font-display text-2xl" style={{ color: isToday ? 'var(--text)' : 'var(--text-soft)' }}>{s.day}</div>
              </div>
              <div className="flex flex-col gap-3 rounded-3xl p-2.5 pb-28" style={{ background: isToday ? 'var(--bg-soft)' : 'transparent' }}>
                <AnimatePresence mode="popLayout" initial={false}>
                  {buckets[keys[i]].map((t) => (
                    <TaskCard key={t.id} task={t} today={today} variant={variant} onToggle={actions?.complete || store.toggleTask} onDelete={actions?.remove || store.deleteTask} onEdit={onEdit} />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
