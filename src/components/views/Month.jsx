import { useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import TaskCard from '../TaskCard'
import CompletedSection from '../CompletedSection'
import Sticker from '../stickers/Sticker'
import { pickWaiting } from '../stickers/art'
import Icon from '../Icon'
import { addDays, dateKey, startOfDay, todayKey, keyToDate, fracOf } from '../../state/time'
import { dayBands } from '../../state/bands'

const WD = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

// Month can't express time-of-day positionally in a 42-cell grid, so it
// expresses it as SHAPE: every cell carries a tiny 24h strip with a tick at
// each task's start. Same left→right time metaphor as the Daily view, scaled
// down — you read "my Tuesdays are packed in the morning" at a glance.
function MicroTimeline({ tasks, isToday, nowMin }) {
  const timed = tasks.filter((t) => t.start != null)
  if (!timed.length && !isToday) return <div style={{ height: 4 }} />
  return (
    <div className="relative w-full rounded-full" style={{ height: 4, background: 'var(--grid-line)' }}>
      {timed.map((t) => (
        <span
          key={t.id}
          className="absolute top-0 rounded-full"
          style={{
            left: `${fracOf(t.start) * 100}%`,
            width: 3,
            height: 4,
            background: t.done ? 'var(--success)' : 'var(--task-blue-bg)',
          }}
        />
      ))}
      {isToday && (
        <span
          className="absolute -top-0.5"
          style={{ left: `${fracOf(nowMin) * 100}%`, width: 1.5, height: 7, background: 'var(--now-line)' }}
        />
      )}
    </div>
  )
}

export default function Month({ store, now, onEdit, actions, onDrill }) {
  const today = todayKey()
  const variant = store.settings.taskStyle || 'filled'
  const tintEnabled = store.settings.overdueTint !== false
  const calm = !!store.settings.reduceMotion
  const personalized = store.settings.mode === 'personalized'
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const [selected, setSelected] = useState(today)
  const [offset, setOffset] = useState(0) // months from the current one

  const onToggle = actions?.complete || store.toggleTask
  const onDelete = actions?.remove || store.deleteTask
  const onUncomplete = actions?.uncomplete || store.toggleTask

  const view = new Date(now.getFullYear(), now.getMonth() + offset, 1)
  const first = startOfDay(view)
  const gridStart = addDays(first, -first.getDay())
  const cells = useMemo(() => Array.from({ length: 42 }, (_, i) => addDays(gridStart, i)), [gridStart.getTime()])
  const keys = cells.map(dateKey)

  const byDay = useMemo(() => {
    const out = {}
    for (const k of keys) out[k] = dayBands(store.tasks, k, today)
    return out
  }, [store.tasks, keys.join(), today])

  const monthName = view.toLocaleString(undefined, { month: 'long', year: 'numeric' })
  const sel = byDay[selected] || dayBands(store.tasks, selected, today)
  const selActive = [...sel.overdue, ...sel.timed, ...sel.anytime]
  const { Art, rest } = pickWaiting(selected)

  return (
    <div className="mx-auto h-full max-w-5xl px-3 pt-4 sm:px-8">
      <div className="mb-3 flex items-center justify-center gap-3">
        <NavBtn onClick={() => setOffset((o) => o - 1)} label="Previous month">
          <Icon name="chevronRight" size={16} style={{ transform: 'rotate(180deg)' }} />
        </NavBtn>
        <button
          onClick={() => { setOffset(0); setSelected(today) }}
          className="font-display text-2xl"
          style={{ color: 'var(--text)' }}
        >
          {monthName}
        </button>
        <NavBtn onClick={() => setOffset((o) => o + 1)} label="Next month">
          <Icon name="chevronRight" size={16} />
        </NavBtn>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {WD.map((d, i) => (
          <div key={i} className="pb-1 text-center text-[11px] font-bold" style={{ color: 'var(--text-faint)' }}>{d}</div>
        ))}

        {cells.map((d, i) => {
          const k = keys[i]
          const inMonth = d.getMonth() === view.getMonth()
          const isToday = k === today
          const isSel = k === selected
          const bands = byDay[k]
          const items = [...bands.overdue, ...bands.timed, ...bands.anytime]
          return (
            <button
              key={k}
              onClick={() => setSelected(k)}
              onDoubleClick={() => onDrill?.('week', k)}
              className="relative flex aspect-square flex-col gap-0.5 rounded-[var(--radius-card)] p-1 text-left transition-colors sm:p-1.5"
              style={{
                background: isSel ? 'var(--bg-soft)' : 'transparent',
                outline: isToday ? 'var(--ink-w) solid var(--coral-strong)' : 'none',
                opacity: inMonth ? 1 : 0.35,
              }}
            >
              <span className="text-[11px] font-bold sm:text-sm" style={{ color: isToday ? 'var(--coral-strong)' : 'var(--text-soft)' }}>
                {d.getDate()}
              </span>

              {/* desktop: mini bars; mobile: density dots */}
              <div className="mt-auto hidden flex-col gap-0.5 sm:flex">
                {items.slice(0, 2).map((t) => {
                  const od = bands.overdue.includes(t)
                  return (
                    <span
                      key={t.id}
                      className="truncate rounded px-1 text-[9px] font-semibold"
                      style={{
                        background: od ? 'var(--task-coral-bg)' : 'var(--task-blue-bg)',
                        color: od ? 'var(--task-coral-text)' : 'var(--task-blue-text)',
                      }}
                    >
                      {t.title}
                    </span>
                  )
                })}
                {items.length > 2 && (
                  <span className="px-1 text-[9px]" style={{ color: 'var(--text-faint)' }}>+{items.length - 2}</span>
                )}
              </div>
              <div className="mt-auto flex gap-0.5 sm:hidden">
                {items.slice(0, 3).map((t) => (
                  <span
                    key={t.id}
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: bands.overdue.includes(t) ? 'var(--task-coral-bg)' : 'var(--task-blue-bg)' }}
                  />
                ))}
              </div>

              <MicroTimeline tasks={items} isToday={isToday} nowMin={nowMin} />
            </button>
          )
        })}
      </div>

      {/* selected-day drawer */}
      <div className="mt-5 pb-28">
        <div className="mb-3 flex items-center gap-2">
          <h3 className="text-sm font-bold" style={{ color: 'var(--text-soft)' }}>
            {keyToDate(selected).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
          </h3>
          <button
            onClick={() => onDrill?.('week', selected)}
            className="rounded-full px-2.5 py-1 text-[11px] font-bold"
            style={{ background: 'var(--surface-2)', color: 'var(--text-soft)' }}
          >
            open this week ›
          </button>
          <button
            onClick={() => onDrill?.('three', selected)}
            className="rounded-full px-2.5 py-1 text-[11px] font-bold"
            style={{ background: 'var(--surface-2)', color: 'var(--text-soft)' }}
          >
            open this day ›
          </button>
        </div>
        <div className="flex flex-col gap-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {selActive.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                today={today}
                nowMin={nowMin}
                tintEnabled={tintEnabled}
                variant={variant}
                personalized={personalized}
                onToggle={onToggle}
                onDelete={onDelete}
                onEdit={onEdit}
              />
            ))}
          </AnimatePresence>

          {selActive.length === 0 && (
            <div className="flex flex-col items-center gap-1 py-6">
              {/* no `paper` — this is decorative, so professional renders nothing */}
              <Sticker Art={Art} rest={rest} size={76} calm={calm} personalized={personalized} />
              <span className="text-sm" style={{ color: 'var(--text-faint)' }}>
                {personalized ? 'nothing scheduled — enjoy it' : 'Nothing scheduled'}
              </span>
            </div>
          )}

          <CompletedSection tasks={sel.completed} onUncomplete={onUncomplete} />
        </div>
      </div>
    </div>
  )
}

function NavBtn({ onClick, label, children }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="grid h-8 w-8 place-items-center rounded-full transition-colors hover:bg-[var(--surface-2)]"
      style={{ color: 'var(--text-soft)' }}
    >
      {children}
    </button>
  )
}
