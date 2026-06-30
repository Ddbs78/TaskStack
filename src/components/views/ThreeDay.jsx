import { useEffect, useMemo, useRef } from 'react'
import DayColumn from '../DayColumn'
import { addDays, dateKey, startOfDay, todayKey, useIsMobile } from '../../state/time'
import { bucketByDisplayDay } from '../../state/rollover'

// Rolling window: yesterday · today · tomorrow.
// Desktop: three side-by-side full-height columns with the moving now-line.
// Mobile: one full-width day you swipe between (snap), starting on today.
export default function ThreeDay({ store, now, onEdit, actions }) {
  const today = todayKey()
  const mobile = useIsMobile()
  const variant = store.settings.taskStyle || 'filled'
  const base = startOfDay(now)
  const days = [addDays(base, -1), base, addDays(base, 1)]
  const dayKeys = days.map(dateKey)
  const scroller = useRef(null)

  const buckets = useMemo(
    () => bucketByDisplayDay(store.tasks, dayKeys, today),
    [store.tasks, dayKeys.join(), today]
  )

  // center on "today" when entering mobile mode
  useEffect(() => {
    if (mobile && scroller.current) {
      const el = scroller.current
      el.scrollTo({ left: el.clientWidth, behavior: 'instant' in window ? 'instant' : 'auto' })
    }
  }, [mobile])

  if (mobile) {
    return (
      <div ref={scroller} className="no-scrollbar flex h-full snap-x snap-mandatory overflow-x-auto">
        {days.map((d, i) => (
          <div key={dayKeys[i]} className="min-w-full snap-center px-4 pt-2">
            <DayColumn
              date={d}
              tasks={buckets[dayKeys[i]]}
              isToday={dayKeys[i] === today}
              store={store}
              onEdit={onEdit}
              actions={actions}
              now={now}
              variant={variant}
              today={today}
            />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="relative mx-auto h-full max-w-6xl px-3 pt-4 sm:px-8">
      <div className="flex h-full gap-2 sm:gap-6">
        {days.map((d, i) => (
          <DayColumn
            key={dayKeys[i]}
            date={d}
            tasks={buckets[dayKeys[i]]}
            isToday={dayKeys[i] === today}
            store={store}
            onEdit={onEdit}
            actions={actions}
            now={now}
            variant={variant}
            today={today}
          />
        ))}
      </div>
    </div>
  )
}
