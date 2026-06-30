import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import TaskCard from './TaskCard'
import NowLine from './NowLine'
import Icon from './Icon'
import { formatHeader, todayKey, dateKey } from '../state/time'

// 8 marks per day at 3-hour increments. 12am is the day boundary (lighter).
const MARKS = [
  { p: 0, l: '12a', boundary: true },
  { p: 12.5, l: '3a' },
  { p: 25, l: '6a' },
  { p: 37.5, l: '9a' },
  { p: 50, l: '12p' },
  { p: 62.5, l: '3p' },
  { p: 75, l: '6p' },
  { p: 87.5, l: '9p' },
]

function DayGrid() {
  return (
    <div className="pointer-events-none absolute inset-0">
      {MARKS.map((m) => (
        <div
          key={m.p}
          className="absolute top-0 bottom-0 w-px"
          style={{ left: `${m.p}%`, background: m.boundary ? 'var(--grid-boundary)' : 'var(--grid-line)' }}
        />
      ))}
      <div className="absolute top-0 bottom-0 w-px" style={{ left: '100%', marginLeft: -1, background: 'var(--grid-boundary)' }} />
    </div>
  )
}

function TimeAxis() {
  return (
    <div className="relative h-7 shrink-0">
      {MARKS.map((m) => (
        <div key={m.p} className="absolute top-0" style={{ left: `${m.p}%`, transform: 'translateX(-50%)' }}>
          <div className="mx-auto h-[5px] w-px" style={{ background: 'var(--tick)' }} />
          <div
            className="mt-1 text-center text-[10px] tabular-nums"
            style={{ color: m.boundary ? 'var(--text-soft)' : 'var(--text-faint)' }}
          >
            {m.l}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function DayColumn({ date, tasks, isToday, store, onEdit, actions, now, variant = 'filled', today = todayKey() }) {
  const key = dateKey(date)
  const [showCompleted, setShowCompleted] = useState(false)
  const completed = store.tasks
    .filter((t) => t.done && t.date === key)
    .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))

  const onToggle = actions?.complete || store.toggleTask
  const onDelete = actions?.remove || store.deleteTask

  return (
    <div className="relative flex h-full min-w-0 flex-1 flex-col">
      <div
        className="font-display mb-3 px-2 text-center text-[clamp(15px,2.2vw,26px)] tracking-[0.01em]"
        style={{ color: isToday ? 'var(--text)' : 'var(--text-faint)', fontWeight: isToday ? 600 : 500 }}
      >
        {formatHeader(date)}
      </div>

      <div className="relative flex-1 overflow-hidden">
        <DayGrid />
        {isToday && <NowLine now={now} />}

        <div className="no-scrollbar slot-fade absolute inset-0 overflow-y-auto">
          <div className="flex flex-col gap-4 px-1.5 pt-7 pb-10">
            <AnimatePresence mode="popLayout" initial={false}>
              {tasks.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  today={today}
                  variant={variant}
                  onToggle={onToggle}
                  onDelete={onDelete}
                  onEdit={onEdit}
                />
              ))}
            </AnimatePresence>

            {tasks.length === 0 && completed.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-6 text-center text-sm"
                style={{ color: 'var(--text-faint)' }}
              >
                {isToday ? 'Nothing more today' : ' '}
              </motion.div>
            )}

            {completed.length > 0 && (
              <div className="mt-1">
                <button
                  onClick={() => setShowCompleted((v) => !v)}
                  className="flex w-full items-center gap-1.5 px-1 py-1 text-[13px] font-semibold"
                  style={{ color: 'var(--text-faint)' }}
                >
                  <Icon
                    name="chevronRight"
                    size={15}
                    style={{ transform: showCompleted ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }}
                  />
                  Completed ({completed.length})
                </button>
                <AnimatePresence initial={false}>
                  {showCompleted && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="flex flex-col gap-2 overflow-hidden pt-1"
                    >
                      {completed.map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center gap-3 rounded-[var(--radius-card)] px-4 py-3"
                          style={{ background: 'var(--completed-bg)', opacity: 0.75 }}
                        >
                          <button
                            aria-label={`Uncomplete ${t.title}`}
                            onClick={() => (actions?.uncomplete || store.toggleTask)(t.id)}
                            className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full"
                            style={{ background: 'var(--success)', color: '#06352a' }}
                          >
                            <Icon name="check" size={12} stroke={2.4} />
                          </button>
                          <span className="flex-1 text-[15px] font-medium line-through" style={{ color: 'var(--text-faint)' }}>
                            {t.title}
                          </span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>

      <TimeAxis />
    </div>
  )
}
