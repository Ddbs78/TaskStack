import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Sticker from '../stickers/Sticker'
import { pickWaiting } from '../stickers/art'
import CompletedSection from '../CompletedSection'
import Icon from '../Icon'
import { addDays, dateKey, daysBetween, formatShort, startOfDay, todayKey, fmtTime, fmtRange, useIsMobile } from '../../state/time'
import { dayBands, OVERDUE_VISIBLE } from '../../state/bands'
import { elapsedFraction, elapsedToday } from '../../state/rollover'
import { flashComplete } from '../stickers/art'

// Six 4-hour segments cover the whole day with no scrolling. Tapping one opens
// it to hourly detail while its neighbours fold up, so total height never
// changes — an accordion, not a scroll.
const SEG_MIN = 240
const SEGS = [0, 1, 2, 3, 4, 5]
const BODY_H = 400

// A segment's share of the body. Auto-size gives empty stretches (the 12a–6a
// dead zone) a thin band and lets busy ones breathe; uniform splits evenly.
function segmentHeights({ counts, expanded, autoSize }) {
  let w
  if (expanded != null) {
    w = SEGS.map((i) => (i === expanded ? 5.2 : 0.62))
  } else if (autoSize) {
    w = SEGS.map((i) => 0.55 + Math.min(counts[i], 4) * 0.62)
  } else {
    w = SEGS.map(() => 1)
  }
  const sum = w.reduce((a, b) => a + b, 0)
  return w.map((x) => (x / sum) * BODY_H)
}

// minute -> y, honouring whatever heights the segments currently have
function makeScale(heights) {
  const tops = []
  let acc = 0
  for (const h of heights) { tops.push(acc); acc += h }
  return (min) => {
    const i = Math.min(SEGS.length - 1, Math.max(0, Math.floor(min / SEG_MIN)))
    return tops[i] + ((min - i * SEG_MIN) / SEG_MIN) * heights[i]
  }
}

export default function Week({ store, now, onEdit, actions, focusDay, onDrill }) {
  const today = todayKey()
  const mobile = useIsMobile()
  const variant = store.settings.taskStyle || 'filled'
  const elapsedStyle = store.settings.elapsedStyle || (store.settings.overdueTint === false ? 'off' : 'tint')
  const tintEnabled = elapsedStyle !== 'off'
  const calm = !!store.settings.reduceMotion
  const personalized = store.settings.mode === 'personalized'
  const autoSize = store.settings.weekAutoSize !== false
  const nowMin = now.getHours() * 60 + now.getMinutes()

  // a drill-down from Month lands here: start on the week containing focusDay
  const [offset, setOffset] = useState(() => {
    if (!focusDay) return 0
    const diff = Math.floor(daysBetween(dateKey(startOfDay(now)), focusDay) / (7))
    return diff
  })
  const [expanded, setExpanded] = useState(null)

  const onToggle = actions?.complete || store.toggleTask
  const onDelete = actions?.remove || store.deleteTask
  const onUncomplete = actions?.uncomplete || store.toggleTask

  const span = mobile ? 3 : 7
  const days = useMemo(() => {
    const base = addDays(startOfDay(now), offset * span)
    return Array.from({ length: span }, (_, i) => addDays(base, i))
  }, [now, offset, span])
  const keys = days.map(dateKey)
  const todayIdx = keys.indexOf(today)

  const bands = useMemo(
    () => keys.map((k) => dayBands(store.tasks, k, today)),
    [store.tasks, keys.join(), today]
  )

  // busiest day drives segment sizing so all columns share one time scale
  const counts = useMemo(() => {
    const c = SEGS.map(() => 0)
    bands.forEach((b) => b.timed.forEach((t) => {
      const i = Math.min(5, Math.floor((t.start ?? 0) / SEG_MIN))
      c[i] += 1
    }))
    return c
  }, [bands])

  const heights = segmentHeights({ counts, expanded, autoSize })
  const yOf = makeScale(heights)

  return (
    <div className="mx-auto flex h-full max-w-7xl flex-col px-3 pb-28 pt-4 sm:px-6">
      <div className="mb-2 flex shrink-0 items-center justify-center gap-3">
        <NavBtn onClick={() => setOffset((o) => o - 1)} label="Previous">
          <Icon name="chevronRight" size={16} style={{ transform: 'rotate(180deg)' }} />
        </NavBtn>
        <button
          onClick={() => { setOffset(0); setExpanded(null) }}
          className="font-display text-[15px] font-semibold"
          style={{ color: offset === 0 ? 'var(--text)' : 'var(--text-soft)' }}
        >
          {offset === 0 ? 'this week' : days[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </button>
        <NavBtn onClick={() => setOffset((o) => o + 1)} label="Next">
          <Icon name="chevronRight" size={16} />
        </NavBtn>
        {expanded != null && (
          <button
            onClick={() => setExpanded(null)}
            className="ml-2 rounded-full px-2.5 py-1 text-[11px] font-bold"
            style={{ background: 'var(--surface-2)', color: 'var(--text-soft)' }}
          >
            collapse
          </button>
        )}
      </div>

      {/* headers + docked unscheduled band. The gutter labels this top strip as
          the all-day / unscheduled row, so its role reads at a glance. */}
      <div className="flex shrink-0">
        <div className="flex w-10 shrink-0 items-end justify-end pb-1 pr-1.5 sm:w-12">
          <span className="text-[9px] font-bold uppercase leading-none tracking-wide" style={{ color: 'var(--text-faint)' }}>all-day</span>
        </div>
        <div className="grid flex-1" style={{ gridTemplateColumns: `repeat(${span}, minmax(0,1fr))`, gap: 5 }}>
          {days.map((d, i) => {
            const isToday = keys[i] === today
            const s = formatShort(d)
            const b = bands[i]
            return (
              <div key={keys[i]} className="min-w-0">
                <button
                  onClick={() => onDrill?.('three', keys[i])}
                  className="w-full pb-1 text-center"
                  title="open this day"
                >
                  <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color: isToday ? 'var(--coral-strong)' : 'var(--text-faint)' }}>{s.wd}</div>
                  <div className="font-display text-[17px]" style={{ color: isToday ? 'var(--text)' : 'var(--text-soft)' }}>{s.day}</div>
                </button>
                {/* On days other than today, unscheduled work docks here, fused
                    to the top of the grid. Today's floats to the now-line instead. */}
                {!isToday && (
                  <DockedUnscheduled
                    bands={b}
                    dayKey={keys[i]}
                    calm={calm}
                    personalized={personalized}
                    variant={variant}
                    onToggle={onToggle}
                    onEdit={onEdit}
                    onBump={actions?.bump}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* the segmented body */}
      <div className="relative mt-1 flex flex-1">
        <div className="relative w-10 shrink-0 sm:w-12">
          {SEGS.map((i) => (
            <button
              key={i}
              onClick={() => setExpanded(expanded === i ? null : i)}
              className="absolute right-1.5 text-[10px] tabular-nums"
              style={{ top: yOf(i * SEG_MIN) - 1, color: expanded === i ? 'var(--text)' : 'var(--text-faint)' }}
              title={expanded === i ? 'collapse' : 'expand to hourly'}
            >
              {fmtTime(i * SEG_MIN)}
            </button>
          ))}
        </div>

        <div className="relative grid flex-1" style={{ gridTemplateColumns: `repeat(${span}, minmax(0,1fr))`, gap: 5, height: BODY_H }}>
          {/* segment rules + the expanded segment's hourly detail */}
          {SEGS.map((i) => (
            <div
              key={`seg${i}`}
              className="pointer-events-none absolute inset-x-0"
              style={{
                top: yOf(i * SEG_MIN),
                height: heights[i],
                transition: calm ? 'none' : 'top .42s var(--ease-spring), height .42s var(--ease-spring)',
                borderTop: '1px solid var(--grid-line)',
                background: expanded === i ? 'color-mix(in srgb, var(--text) 3%, transparent)' : 'transparent',
                backgroundImage:
                  expanded === i
                    ? `repeating-linear-gradient(to bottom, var(--grid-line) 0, var(--grid-line) 1px, transparent 1px, transparent ${heights[i] / 4}px)`
                    : 'none',
              }}
            />
          ))}

          {days.map((d, i) => (
            <DayColumn
              key={keys[i]}
              bands={bands[i]}
              dayKey={keys[i]}
              isToday={keys[i] === today}
              yOf={yOf}
              nowMin={nowMin}
              today={today}
              tintEnabled={tintEnabled}
              elapsedStyle={elapsedStyle}
              variant={variant}
              calm={calm}
              personalized={personalized}
              onToggle={onToggle}
              onDelete={onDelete}
              onEdit={onEdit}
              onUncomplete={onUncomplete}
              onBump={actions?.bump}
            />
          ))}

          {/* ONE continuous now-line across the whole grid — full strength over
              today, ghosted either side, so the signature object survives the
              axis change from the daily view. */}
          <div className="pointer-events-none absolute inset-x-0 z-20" style={{ top: yOf(nowMin) }}>
            <div style={{ height: 1.5, background: 'var(--now-line)', opacity: 0.2 }} />
            {todayIdx >= 0 && (
              <div
                className="absolute top-0"
                style={{
                  height: 1.5,
                  background: 'var(--now-line)',
                  left: `calc((100% - ${(span - 1) * 5}px) / ${span} * ${todayIdx} + ${todayIdx * 5}px)`,
                  width: `calc((100% - ${(span - 1) * 5}px) / ${span})`,
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
  )
}

// ---- one day column ---------------------------------------------------------
function DayColumn({ bands, dayKey, isToday, yOf, nowMin, today, tintEnabled, elapsedStyle, variant, calm, personalized, onToggle, onDelete, onEdit, onUncomplete, onBump }) {
  const { overdue, timed, anytime, completed } = bands
  const unscheduled = [...overdue, ...anytime]

  // Today's unscheduled work rides the now-line. Timed blocks always win their
  // slot — their position carries information unscheduled tasks don't have — so
  // the pile dodges: full width, then narrowed beside, then collapsed to a tag.
  const blocking = isToday
    ? timed.filter((t) => {
        const s = t.start ?? 0
        const e = t.end != null && t.end > s ? t.end : s + 30
        return nowMin >= s - 30 && nowMin <= e + 30
      }).length
    : 0
  const floatMode = blocking === 0 ? 'full' : blocking === 1 ? 'dodge' : 'tag'
  const { Art, rest } = pickWaiting(dayKey)

  return (
    <div className="relative min-w-0" style={{ background: isToday ? 'var(--bg-soft)' : 'transparent', borderRadius: 8 }}>
      {timed.map((task) => {
        const s = task.start ?? 0
        const e = task.end != null && task.end > s ? task.end : s + 30
        const top = yOf(s)
        const h = Math.max(20, yOf(e) - top)
        const passed = elapsedToday(task, nowMin, today)
        const elapsed = passed ? 1 : tintEnabled ? elapsedFraction(task, nowMin, today) : 0
        const hue = passed ? 'coral' : 'blue'
        const tinted = variant === 'tinted'
        const strong = task.urgency != null && !task.urgencyOff && task.urgency >= 8
        return (
          <button
            key={task.id}
            onClick={() => onEdit?.(task)}
            onContextMenu={(ev) => { ev.preventDefault(); onDelete(task.id) }}
            title={`${task.title} · ${fmtRange(task.start, task.end)}`}
            className="inked-sm task-surface absolute overflow-hidden px-1.5 text-left"
            style={{
              top, height: h, left: 2, right: 2,
              borderRadius: 'var(--radius-bar)',
              transition: calm ? 'none' : 'top .42s var(--ease-spring), height .42s var(--ease-spring)',
              '--rail': hue === 'coral' ? 'var(--coral)' : 'var(--blue)',
              background: tinted ? `var(--bar-bg, var(--task-${hue}-tint-bg))` : `var(--bar-bg, var(--task-${hue}-bg))`,
              color: tinted ? `var(--bar-fg, var(--task-${hue}-tint-text))` : `var(--bar-fg, var(--task-${hue}-text))`,
              outline: strong ? 'var(--ink-w) solid var(--coral-strong)' : 'none',
            }}
          >
            {elapsed > 0 && !passed && (
              <span
                className="elapsed-fill elapsed-y pointer-events-none absolute inset-x-0 top-0 z-0"
                style={
                  elapsedStyle === 'hatch'
                    ? { height: `${elapsed * 100}%`, backgroundImage: 'repeating-linear-gradient(115deg, color-mix(in srgb, currentColor 30%, transparent) 0 2px, transparent 2px 7px)' }
                    : { height: `${elapsed * 100}%`, background: 'var(--bar-elapsed, color-mix(in srgb, var(--task-coral-bg) 65%, transparent))' }
                }
              />
            )}
            <span className="relative z-[1] block truncate pt-0.5 text-[11px] font-bold leading-tight">{task.title}</span>
            {h > 34 && <span className="relative z-[1] block truncate text-[10px] opacity-70">{fmtTime(task.start)}</span>}
          </button>
        )
      })}

      {/* today's floating unscheduled pile */}
      {isToday && unscheduled.length > 0 && (
        <div
          className="absolute z-[15]"
          style={{
            top: yOf(nowMin) + 4,
            transition: calm ? 'none' : 'top .42s var(--ease-spring)',
            ...(floatMode === 'full' ? { left: 2, right: 2 }
              : floatMode === 'dodge' ? { left: '54%', right: 2 }
              : { right: 1, width: 'auto' }),
          }}
        >
          {floatMode === 'tag' ? (
            <Sticker
              Art={Art} rest={rest} size={30} calm={calm}
              personalized={personalized}
              paper={unscheduled.length}
              paperLabel={`${unscheduled.length}`}
              paperWidth={40} paperHeight={22}
              title={`${unscheduled.length} unscheduled`}
              onClick={() => onEdit?.(unscheduled[0])}
              className="rounded-full px-1.5 py-0.5"
              style={{ background: 'var(--surface-2)', border: 'var(--ink-w) solid var(--ink)' }}
            >
              <span className="text-[9px] font-bold" style={{ color: 'var(--coral-strong)' }}>{unscheduled.length}</span>
            </Sticker>
          ) : (
            <div className="flex flex-col gap-1">
              {unscheduled.slice(0, floatMode === 'dodge' ? 1 : 2).map((t) => (
                <MiniChip key={t.id} task={t} overdue={overdue.includes(t)} variant={variant} personalized={personalized} onToggle={onToggle} onEdit={onEdit} />
              ))}
              {unscheduled.length > (floatMode === 'dodge' ? 1 : 2) && (
                <button
                  onClick={() => onBump?.(unscheduled.slice(floatMode === 'dodge' ? 1 : 2).map((t) => t.id))}
                  className="rounded-md px-1 py-0.5 text-left text-[9px] font-bold"
                  style={{ background: 'color-mix(in srgb, var(--coral) 22%, transparent)', color: 'var(--coral-strong)', border: '1.5px dashed var(--coral-strong)' }}
                >
                  +{unscheduled.length - (floatMode === 'dodge' ? 1 : 2)} waiting
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {completed.length > 0 && (
        <div className="absolute inset-x-0" style={{ top: BODY_H - 2 }}>
          <CompletedSection tasks={completed} onUncomplete={onUncomplete} compact />
        </div>
      )}
    </div>
  )
}

// ---- docked unscheduled band (non-today columns) -----------------------------
function DockedUnscheduled({ bands, dayKey, calm, personalized, variant, onToggle, onEdit, onBump }) {
  const items = [...bands.overdue, ...bands.anytime]
  if (!items.length) return <div style={{ height: 6 }} />
  const shown = items.slice(0, OVERDUE_VISIBLE)
  const hidden = items.slice(OVERDUE_VISIBLE)
  const { Art, rest } = pickWaiting(dayKey)
  return (
    <div
      className="mb-0.5 flex flex-col gap-1 p-1"
      style={{ background: 'color-mix(in srgb, var(--text) 4%, transparent)', border: 'var(--ink-w) solid var(--ink)', borderBottom: 'none', borderRadius: '8px 8px 2px 2px' }}
    >
      {shown.map((t) => (
        <MiniChip key={t.id} task={t} overdue={bands.overdue.includes(t)} variant={variant} personalized={personalized} onToggle={onToggle} onEdit={onEdit} />
      ))}
      <AnimatePresence>
        {hidden.length > 0 && (
          <Sticker
            key="pile" Art={Art} rest={rest} size={28} calm={calm}
            personalized={personalized}
            paper={hidden.length}
            paperLabel={`+${hidden.length}`}
            paperWidth={52} paperHeight={24}
            title={personalized
              ? `${hidden.length} still lurking — bump to tomorrow`
              : `${hidden.length} more overdue — move to tomorrow`}
            onClick={() => onBump?.(hidden.map((t) => t.id))}
            className="justify-center"
          >
            <span className="text-[9px] font-bold" style={{ color: 'var(--text-faint)' }}>+{hidden.length}</span>
          </Sticker>
        )}
      </AnimatePresence>
    </div>
  )
}

function MiniChip({ task, overdue, variant, personalized = true, onToggle, onEdit }) {
  const tinted = variant === 'tinted'
  const hue = overdue ? 'coral' : 'blue'
  return (
    <div
      className="inked-sm task-surface relative flex items-center gap-1 rounded-md px-1 py-0.5"
      style={{
        '--rail': hue === 'coral' ? 'var(--coral)' : 'var(--blue)',
        background: tinted ? `var(--bar-bg, var(--task-${hue}-tint-bg))` : `var(--bar-bg, var(--task-${hue}-bg))`,
        color: tinted ? `var(--bar-fg, var(--task-${hue}-tint-text))` : `var(--bar-fg, var(--task-${hue}-text))`,
      }}
    >
      <button
        aria-label={`Complete ${task.title}`}
        onClick={(e) => { e.stopPropagation(); flashComplete(e.currentTarget, { personalized }); onToggle(task.id) }}
        className="bar-check grid h-[10px] w-[10px] shrink-0 place-items-center rounded-full border-[1.5px]"
      />
      <button onClick={() => onEdit?.(task)} className="min-w-0 flex-1 truncate text-left text-[10px] font-bold">
        {task.title}
      </button>
    </div>
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
