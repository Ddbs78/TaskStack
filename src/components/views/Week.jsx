import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Sticker from '../stickers/Sticker'
import { pickWaiting } from '../stickers/art'
import CompletedSection from '../CompletedSection'
import Icon from '../Icon'
import { addDays, dateKey, formatShort, startOfDay, todayKey, fracOf, fmtTime, fmtRange, useIsMobile } from '../../state/time'
import { dayBands, packLanes, OVERDUE_VISIBLE } from '../../state/bands'
import { elapsedFraction, elapsedToday } from '../../state/rollover'

const DAY_H = 660 // px for a full 24h column
const HOURS = [0, 3, 6, 9, 12, 15, 18, 21]

// Week = 7 vertical day columns, time running top→bottom.
//
// The Daily view runs time left→right; here it runs down. To keep the app's
// signature object intact the now-line stays ONE continuous horizontal rule
// across the whole grid — full strength inside today's column, ghosted either
// side — rather than a mark that only exists inside one cell.
export default function Week({ store, now, onEdit, actions }) {
  const today = todayKey()
  const mobile = useIsMobile()
  const variant = store.settings.taskStyle || 'filled'
  const tintEnabled = store.settings.overdueTint !== false
  const calm = !!store.settings.reduceMotion
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const bodyRef = useRef(null)

  const [offset, setOffset] = useState(0) // weeks from the current one
  const onToggle = actions?.complete || store.toggleTask
  const onDelete = actions?.remove || store.deleteTask
  const onUncomplete = actions?.uncomplete || store.toggleTask

  // below md we show a 3-day window rather than crushing 7 columns into ~40px
  const span = mobile ? 3 : 7
  const days = useMemo(() => {
    const base = addDays(startOfDay(now), offset * span)
    return Array.from({ length: span }, (_, i) => addDays(base, i))
  }, [now, offset, span])
  const keys = days.map(dateKey)

  // bring the current hour into view on mount
  useEffect(() => {
    const el = bodyRef.current
    if (el) el.scrollTop = Math.max(0, fracOf(nowMin) * DAY_H - el.clientHeight * 0.4)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const todayIdx = keys.indexOf(today)

  return (
    <div className="mx-auto flex h-full max-w-7xl flex-col px-3 pt-4 sm:px-6">
      {/* week nav */}
      <div className="mb-2 flex shrink-0 items-center justify-center gap-3">
        <NavBtn onClick={() => setOffset((o) => o - 1)} label="Previous"><Icon name="chevronRight" size={16} style={{ transform: 'rotate(180deg)' }} /></NavBtn>
        <button
          onClick={() => setOffset(0)}
          className="font-display text-[15px] font-semibold"
          style={{ color: offset === 0 ? 'var(--text)' : 'var(--text-soft)' }}
        >
          {offset === 0 ? 'this week' : days[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </button>
        <NavBtn onClick={() => setOffset((o) => o + 1)} label="Next"><Icon name="chevronRight" size={16} /></NavBtn>
      </div>

      {/* day headers + all-day band */}
      <div className="flex shrink-0">
        <div className="w-10 shrink-0 sm:w-12" />
        <div className="grid flex-1" style={{ gridTemplateColumns: `repeat(${span}, minmax(0, 1fr))`, gap: 4 }}>
          {days.map((d, i) => {
            const isToday = keys[i] === today
            const s = formatShort(d)
            const { overdue, anytime } = dayBands(store.tasks, keys[i], today)
            const shownOverdue = overdue.slice(0, OVERDUE_VISIBLE)
            const hiddenOverdue = overdue.slice(OVERDUE_VISIBLE)
            const { Art, rest } = pickWaiting(keys[i])
            return (
              <div key={keys[i]} className="min-w-0">
                <div className="pb-1 text-center">
                  <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color: isToday ? 'var(--coral-strong)' : 'var(--text-faint)' }}>{s.wd}</div>
                  <div className="font-display text-[17px]" style={{ color: isToday ? 'var(--text)' : 'var(--text-soft)' }}>{s.day}</div>
                </div>

                <div className="flex min-h-[26px] flex-col gap-1 pb-1.5">
                  {shownOverdue.map((t) => (
                    <Chip key={t.id} task={t} hue="coral" variant={variant} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />
                  ))}
                  <AnimatePresence>
                    {hiddenOverdue.length > 0 && (
                      <Sticker
                        key="pile"
                        Art={Art}
                        rest={rest}
                        size={42}
                        calm={calm}
                        title={`${hiddenOverdue.length} still lurking`}
                        onClick={() => actions?.bump?.(hiddenOverdue.map((t) => t.id))}
                        className="justify-center"
                      >
                        <span className="text-[10px] font-semibold" style={{ color: 'var(--text-faint)' }}>+{hiddenOverdue.length}</span>
                      </Sticker>
                    )}
                  </AnimatePresence>
                  {anytime.map((t) => (
                    <Chip key={t.id} task={t} hue="blue" variant={variant} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* scrollable 24h body */}
      <div ref={bodyRef} className="no-scrollbar relative flex-1 overflow-y-auto pb-28">
        <div className="relative flex" style={{ height: DAY_H }}>
          {/* hour gutter */}
          <div className="relative w-10 shrink-0 sm:w-12">
            {HOURS.map((h) => (
              <span
                key={h}
                className="absolute right-1.5 -translate-y-1/2 text-[10px] tabular-nums"
                style={{ top: fracOf(h * 60) * DAY_H, color: 'var(--text-faint)' }}
              >
                {fmtTime(h * 60)}
              </span>
            ))}
          </div>

          {/* columns */}
          <div
            className="relative grid flex-1"
            style={{
              gridTemplateColumns: `repeat(${span}, minmax(0, 1fr))`,
              gap: 4,
              backgroundImage: `repeating-linear-gradient(to bottom, var(--grid-line) 0, var(--grid-line) 1px, transparent 1px, transparent ${DAY_H / 8}px)`,
            }}
          >
            {days.map((d, i) => (
              <DayColumn
                key={keys[i]}
                dayKey={keys[i]}
                isToday={keys[i] === today}
                store={store}
                today={today}
                nowMin={nowMin}
                tintEnabled={tintEnabled}
                variant={variant}
                onToggle={onToggle}
                onDelete={onDelete}
                onEdit={onEdit}
                onUncomplete={onUncomplete}
              />
            ))}

            {/* one continuous now-line; only the segment over today is full strength */}
            <div
              className="pointer-events-none absolute inset-x-0 z-20"
              style={{ top: fracOf(nowMin) * DAY_H }}
            >
              <div style={{ height: 1.5, background: 'var(--now-line)', opacity: 0.22 }} />
              {todayIdx >= 0 && (
                <div
                  className="absolute"
                  style={{
                    top: 0,
                    height: 1.5,
                    background: 'var(--now-line)',
                    left: `calc(${(todayIdx / span) * 100}% )`,
                    width: `calc(${(1 / span) * 100}% - 4px)`,
                    boxShadow: '0 0 8px 1px var(--now-glow)',
                  }}
                >
                  <span className="nowline-pill" style={{ top: -9 }}>{fmtTime(nowMin)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DayColumn({ dayKey, isToday, store, today, nowMin, tintEnabled, variant, onToggle, onDelete, onEdit, onUncomplete }) {
  const { timed, completed } = dayBands(store.tasks, dayKey, today)
  const { rows, laneCount } = packLanes(timed, 0) // 0 → no min-width inflation; lanes split the column horizontally

  return (
    <div className="relative min-w-0" style={{ background: isToday ? 'var(--bg-soft)' : 'transparent' }}>
      {rows.map(({ task, lane }) => {
        const start = task.start ?? 0
        const end = task.end != null && task.end > start ? task.end : start + 30
        const top = fracOf(start) * DAY_H
        const h = Math.max(22, (fracOf(end) - fracOf(start)) * DAY_H)
        const passed = elapsedToday(task, nowMin, today)
        const elapsed = passed ? 1 : tintEnabled ? elapsedFraction(task, nowMin, today) : 0
        const hue = passed ? 'coral' : 'blue'
        const tinted = variant === 'tinted'
        const strong = task.urgency != null && !task.urgencyOff && task.urgency >= 8
        return (
          <button
            key={task.id}
            onClick={() => onEdit?.(task)}
            onContextMenu={(e) => { e.preventDefault(); onDelete(task.id) }}
            title={`${task.title} · ${fmtRange(task.start, task.end)}`}
            className="absolute overflow-hidden rounded-[9px] px-1.5 text-left"
            style={{
              top,
              height: h,
              left: `${(lane / laneCount) * 100}%`,
              width: `calc(${(1 / laneCount) * 100}% - 2px)`,
              background: tinted ? `var(--task-${hue}-tint-bg)` : `var(--task-${hue}-bg)`,
              color: tinted ? `var(--task-${hue}-tint-text)` : `var(--task-${hue}-text)`,
              border: strong ? '1.5px solid var(--coral-strong)' : tinted ? `0.5px solid var(--task-${hue}-tint-border)` : 'none',
            }}
          >
            {/* elapsed two-tone fill, vertical here since time runs downward */}
            {elapsed > 0 && !passed && (
              <span
                className="pointer-events-none absolute inset-x-0 top-0 z-0"
                style={{
                  height: `${elapsed * 100}%`,
                  background: tinted
                    ? 'var(--task-coral-tint-bg)'
                    : 'color-mix(in srgb, var(--task-coral-bg) 70%, transparent)',
                }}
              />
            )}
            <span className="relative z-[1] block truncate pt-0.5 text-[11px] font-semibold leading-tight">{task.title}</span>
            {h > 34 && <span className="relative z-[1] block truncate text-[10px] opacity-70">{fmtTime(task.start)}</span>}
          </button>
        )
      })}

      {completed.length > 0 && (
        <div className="absolute inset-x-0 px-0.5" style={{ top: DAY_H - 4 }}>
          <CompletedSection tasks={completed} onUncomplete={onUncomplete} compact />
        </div>
      )}
    </div>
  )
}

function Chip({ task, hue, variant, onToggle, onEdit, onDelete }) {
  const tinted = variant === 'tinted'
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      onContextMenu={(e) => { e.preventDefault(); onDelete(task.id) }}
      className="flex items-center gap-1 rounded-lg px-1.5 py-1"
      style={{
        background: tinted ? `var(--task-${hue}-tint-bg)` : `var(--task-${hue}-bg)`,
        color: tinted ? `var(--task-${hue}-tint-text)` : `var(--task-${hue}-text)`,
      }}
    >
      <button
        aria-label={`Complete ${task.title}`}
        onClick={(e) => { e.stopPropagation(); onToggle(task.id) }}
        className="grid h-[11px] w-[11px] shrink-0 place-items-center rounded-full border-[1.5px]"
        style={{ borderColor: 'currentColor' }}
      />
      <button onClick={() => onEdit?.(task)} className="min-w-0 flex-1 truncate text-left text-[10px] font-semibold">
        {task.title}
      </button>
    </motion.div>
  )
}

function NavBtn({ onClick, label, children }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="grid h-7 w-7 place-items-center rounded-full transition-colors hover:bg-[var(--surface-2)]"
      style={{ color: 'var(--text-soft)' }}
    >
      {children}
    </button>
  )
}
