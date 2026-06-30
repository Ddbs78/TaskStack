import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import TaskCard from './TaskCard'
import TimedBar from './TimedBar'
import { addDays, dateKey, startOfDay, todayKey, formatHeader, useIsMobile, nowFraction, fmtTime } from '../state/time'
import { isOverdue, displayDateKey, overdueDays } from '../state/rollover'

const PAST = 45
const FUT = 45
const LABELS = ['12a', '3a', '6a', '9a', '12p', '3p', '6p', '9p']

// greedy lane packing so overlapping timed tasks stack vertically
function packLanes(timed) {
  const sorted = [...timed].sort((a, b) => (a.start ?? 0) - (b.start ?? 0))
  const laneEnds = []
  const out = []
  for (const t of sorted) {
    const s = t.start ?? 0
    const e = t.end != null && t.end > s ? t.end : s + 30
    let lane = laneEnds.findIndex((end) => end <= s)
    if (lane === -1) { lane = laneEnds.length; laneEnds.push(e) }
    else laneEnds[lane] = e
    out.push({ task: t, lane })
  }
  return { rows: out, laneCount: Math.max(1, laneEnds.length) }
}

export default function Timeline({ store, now, onEdit, actions }) {
  const today = todayKey()
  const mobile = useIsMobile()
  const variant = store.settings.taskStyle || 'filled'
  const scrollerRef = useRef(null)
  const [dayWidth, setDayWidth] = useState(360)
  const [scrollLeft, setScrollLeft] = useState(0)
  const centered = useRef(false)

  const onToggle = actions?.complete || store.toggleTask
  const onDelete = actions?.remove || store.deleteTask

  const days = useMemo(() => {
    const base = startOfDay(now)
    return Array.from({ length: PAST + FUT + 1 }, (_, i) => addDays(base, i - PAST))
  }, [now])

  // measure day width (3 visible on desktop, 1 on mobile)
  useLayoutEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const measure = () => {
      const w = el.clientWidth
      setDayWidth(mobile ? w : Math.round(w / 3))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [mobile])

  // center today on first layout / width change
  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const target = mobile ? PAST * dayWidth : (PAST - 1) * dayWidth
    el.scrollLeft = target
    setScrollLeft(target)
    centered.current = true
  }, [dayWidth, mobile])

  // track horizontal scroll (throttled via rAF) for the flowing marker axis
  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => { raf = 0; setScrollLeft(el.scrollLeft) })
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => { el.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf) }
  }, [])

  const contentWidth = (PAST + FUT + 1) * dayWidth
  const nowContentX = PAST * dayWidth + nowFraction(now) * dayWidth

  const gridBg = {
    backgroundImage:
      `repeating-linear-gradient(to right, var(--grid-line) 0, var(--grid-line) 1px, transparent 1px, transparent ${dayWidth / 8}px),` +
      `repeating-linear-gradient(to right, var(--grid-boundary) 0, var(--grid-boundary) 1px, transparent 1px, transparent ${dayWidth}px)`,
  }

  return (
    <div className="relative h-full">
      <div
        ref={scrollerRef}
        className="no-scrollbar h-full overflow-x-auto overflow-y-hidden"
        style={{ scrollSnapType: mobile ? 'x mandatory' : 'none' }}
      >
        <div className="relative h-full" style={{ width: contentWidth, ...gridBg }}>
          {/* now-line travels across today's column */}
          <div className="nowline-travel" style={{ left: nowContentX, transition: 'left 30s linear' }}>
            <div className="nowline-pill">{fmtTime(now.getHours() * 60 + now.getMinutes())}</div>
            <div className="nowline-hit" />
            <div className="nowline-bar" />
          </div>

          <div className="flex h-full">
            {days.map((d, i) => (
              <DayCol
                key={dateKey(d)}
                date={d}
                dayWidth={dayWidth}
                mobile={mobile}
                isToday={dateKey(d) === today}
                store={store}
                today={today}
                variant={variant}
                onEdit={onEdit}
                onToggle={onToggle}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      </div>

      <MarkerAxis dayWidth={dayWidth} scrollLeft={scrollLeft} />
    </div>
  )
}

function DayCol({ date, dayWidth, mobile, isToday, store, today, variant, onEdit, onToggle, onDelete }) {
  const key = dateKey(date)
  const active = store.tasks.filter((t) => !t.done && displayDateKey(t, today) === key)
  const completed = store.tasks.filter((t) => t.done && t.date === key).sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))
  const overdue = active.filter((t) => isOverdue(t, today)).sort((a, b) => overdueDays(b, today) - overdueDays(a, today))
  const timed = active.filter((t) => !isOverdue(t, today) && t.start != null)
  const anytime = active.filter((t) => !isOverdue(t, today) && t.start == null)
  const { rows, laneCount } = packLanes(timed)

  return (
    <div
      className="relative flex h-full flex-col"
      style={{ width: dayWidth, scrollSnapAlign: mobile ? 'center' : 'none' }}
    >
      <div
        className="font-display mb-2 px-2 pt-1 text-center text-[clamp(14px,2vw,24px)]"
        style={{ color: isToday ? 'var(--text)' : 'var(--text-faint)', fontWeight: isToday ? 600 : 500 }}
      >
        {formatHeader(date)}
      </div>

      <div className="no-scrollbar slot-fade relative flex-1 overflow-y-auto px-1.5 pb-24">
        <div className="flex flex-col gap-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {overdue.map((t) => (
              <TaskCard key={t.id} task={t} today={today} variant={variant} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} />
            ))}
          </AnimatePresence>

          {timed.length > 0 && (
            <div className="relative" style={{ height: laneCount * 34 }}>
              <AnimatePresence initial={false}>
                {rows.map(({ task, lane }) => (
                  <TimedBar key={task.id} task={task} dayWidth={dayWidth} lane={lane} variant={variant}
                    onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} />
                ))}
              </AnimatePresence>
            </div>
          )}

          <AnimatePresence mode="popLayout" initial={false}>
            {anytime.map((t) => (
              <TaskCard key={t.id} task={t} today={today} variant={variant} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} />
            ))}
          </AnimatePresence>

          {completed.map((t) => (
            <div key={t.id} className="flex items-center gap-3 rounded-[var(--radius-card)] px-4 py-2.5" style={{ background: 'var(--completed-bg)', opacity: 0.7 }}>
              <button aria-label={`Uncomplete ${t.title}`} onClick={() => store.toggleTask(t.id)}
                className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full" style={{ background: 'var(--success)', color: '#06352a' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.2 4.2L19 7" /></svg>
              </button>
              <span className="flex-1 truncate text-[14px] font-medium line-through" style={{ color: 'var(--text-faint)' }}>{t.title}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Fixed bottom axis: 3-hour tick labels aligned to the gridlines, lifting up and
// over the chat bar wherever it sits.
function MarkerAxis({ dayWidth, scrollLeft }) {
  const ref = useRef(null)
  const tickW = dayWidth / 8
  const marks = []
  if (ref.current) {
    const W = ref.current.clientWidth
    const bar = document.querySelector('.js-chatbar')
    const oRect = ref.current.getBoundingClientRect()
    let barL = Infinity, barR = -Infinity, barTop = 0
    if (bar) {
      const b = bar.getBoundingClientRect()
      barL = b.left - oRect.left
      barR = b.right - oRect.left
      barTop = b.top - oRect.top
    }
    const ramp = 44
    const lift = (x) => {
      if (x < barL - ramp || x > barR + ramp) return 0
      if (x > barL && x < barR) return 1
      if (x <= barL) return (x - (barL - ramp)) / ramp
      return (barR + ramp - x) / ramp
    }
    const baseY = oRect.height - 18
    const start = Math.floor(scrollLeft / tickW)
    for (let i = start; ; i++) {
      const x = i * tickW - scrollLeft
      if (x > W + tickW) break
      if (x < -tickW) continue
      const t = Math.max(0, Math.min(1, lift(x)))
      const liftY = barTop - 22
      const y = t > 0 ? baseY - t * (baseY - liftY) : baseY
      const isBoundary = ((i % 8) + 8) % 8 === 0
      marks.push(
        <div key={i} className="pointer-events-none absolute top-0 left-0 text-center"
          style={{ transform: `translate(${x}px, ${y}px) translateX(-50%)`, willChange: 'transform' }}>
          <div className="mx-auto h-[5px] w-px" style={{ background: 'var(--tick)' }} />
          <div className="mt-1 text-[10px] tabular-nums" style={{ color: isBoundary ? 'var(--text-soft)' : 'var(--text-faint)' }}>
            {LABELS[((i % 8) + 8) % 8]}
          </div>
        </div>
      )
    }
  }
  return <div ref={ref} className="pointer-events-none absolute inset-x-0 bottom-0 h-7" aria-hidden="true">{marks}</div>
}
