import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import TaskCard from '../TaskCard'
import { addDays, dateKey, startOfDay, todayKey, keyToDate } from '../../state/time'
import { bucketByDisplayDay, displayDateKey } from '../../state/rollover'

const WD = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export default function Month({ store, now, onEdit, actions }) {
  const today = todayKey()
  const variant = store.settings.taskStyle || 'filled'
  const [selected, setSelected] = useState(today)

  const first = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1))
  const lead = first.getDay()
  const gridStart = addDays(first, -lead)
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
  const keys = cells.map(dateKey)
  const buckets = useMemo(() => bucketByDisplayDay(store.tasks, keys, today), [store.tasks, keys.join(), today])

  const monthName = now.toLocaleString('default', { month: 'long', year: 'numeric' })
  const selectedTasks = buckets[selected] || []

  return (
    <div className="mx-auto h-full max-w-5xl px-3 pt-6 sm:px-8">
      <h2 className="font-display mb-4 text-center text-2xl" style={{ color: 'var(--text)' }}>{monthName}</h2>

      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {WD.map((d, i) => (
          <div key={i} className="pb-1 text-center text-[11px] font-bold" style={{ color: 'var(--text-faint)' }}>{d}</div>
        ))}
        {cells.map((d, i) => {
          const k = keys[i]
          const inMonth = d.getMonth() === now.getMonth()
          const isToday = k === today
          const isSel = k === selected
          const items = buckets[k]
          const overdue = items.some((t) => displayDateKey(t, today) === today && t.date < today && k === today)
          return (
            <button
              key={k}
              onClick={() => setSelected(k)}
              className="relative flex aspect-square flex-col rounded-2xl p-1 text-left transition-colors sm:p-1.5"
              style={{
                background: isSel ? 'var(--bg-soft)' : 'transparent',
                outline: isToday ? '2px solid var(--coral-strong)' : 'none',
                opacity: inMonth ? 1 : 0.35,
              }}
            >
              <span className="text-[11px] font-bold sm:text-sm" style={{ color: isToday ? 'var(--coral-strong)' : 'var(--text-soft)' }}>{d.getDate()}</span>

              {/* desktop: mini bars; mobile: density dots */}
              <div className="mt-auto hidden flex-col gap-0.5 sm:flex">
                {items.slice(0, 3).map((t) => (
                  <span key={t.id} className="truncate rounded px-1 text-[9px] font-semibold" style={{ background: t.date < today && !t.done ? 'var(--task-coral-bg)' : 'var(--task-blue-bg)', color: '#fff' }}>{t.title}</span>
                ))}
                {items.length > 3 && <span className="px-1 text-[9px]" style={{ color: 'var(--text-faint)' }}>+{items.length - 3}</span>}
              </div>
              <div className="mt-auto flex gap-0.5 sm:hidden">
                {items.slice(0, 3).map((t) => (
                  <span key={t.id} className="h-1.5 w-1.5 rounded-full" style={{ background: t.date < today && !t.done ? 'var(--task-coral-bg)' : 'var(--task-blue-bg)' }} />
                ))}
              </div>
            </button>
          )
        })}
      </div>

      {/* selected-day drawer */}
      <div className="mt-5 pb-28">
        <h3 className="mb-3 text-sm font-bold" style={{ color: 'var(--text-soft)' }}>
          {keyToDate(selected).toLocaleDateString('default', { weekday: 'long', month: 'short', day: 'numeric' })}
        </h3>
        <div className="flex flex-col gap-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {selectedTasks.map((t) => (
              <TaskCard key={t.id} task={t} today={today} variant={variant} onToggle={actions?.complete || store.toggleTask} onDelete={actions?.remove || store.deleteTask} onEdit={onEdit} />
            ))}
          </AnimatePresence>
          {selectedTasks.length === 0 && <p className="text-sm" style={{ color: 'var(--text-faint)' }}>Nothing scheduled.</p>}
        </div>
      </div>
    </div>
  )
}
