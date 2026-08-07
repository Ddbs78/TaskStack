import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import TaskCard from './TaskCard'
import TimedBar from './TimedBar'
import { addDays, dateKey, startOfDay, todayKey, daysBetween, formatHeader, useIsMobile, nowFraction, fmtTime } from '../state/time'
import { dayBands, packLanes, OVERDUE_VISIBLE } from '../state/bands'
import Sticker from './stickers/Sticker'
import { pickWaiting } from './stickers/art'
import OverduePile from './OverduePile'
import CompletedSection from './CompletedSection'

const PAST = 45
const FUT = 45
const LABELS = ['12a', '3a', '6a', '9a', '12p', '3p', '6p', '9p']

export default function Timeline({ store, now, onEdit, actions }) {
  const today = todayKey()
  const mobile = useIsMobile()
  const variant = store.settings.taskStyle || 'filled'
  const elapsedStyle = store.settings.elapsedStyle || (store.settings.overdueTint === false ? 'off' : 'tint')
  const tintEnabled = elapsedStyle !== 'off'
  const scrollerRef = useRef(null)
  const nowBarRef = useRef(null)
  const nowTravelRef = useRef(null)
  const [dayWidth, setDayWidth] = useState(360)
  const [dayFlip, setDayFlip] = useState(0) // increments when the clock crosses midnight

  const onToggle = actions?.complete || store.toggleTask
  const onDelete = actions?.remove || store.deleteTask
  const onUncomplete = actions?.uncomplete || store.toggleTask
  const onBump = actions?.bump
  const calm = !!store.settings.reduceMotion

  const baseKey = dateKey(startOfDay(now))
  const days = useMemo(() => {
    const base = startOfDay(now)
    return Array.from({ length: PAST + FUT + 1 }, (_, i) => addDays(base, i - PAST))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseKey])

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
    const drift = daysBetween(baseKey, todayKey())
    const col = PAST + drift
    el.scrollLeft = mobile ? col * dayWidth : (col - 1) * dayWidth
  }, [dayWidth, mobile, baseKey, dayFlip])

  // The now-line is positioned IMPERATIVELY by a rAF loop writing style.left
  // directly — no CSS transition, so it's exact on the very first frame and can
  // never "crawl" from a stale position to the right one (the old load-time
  // jump). Per-frame DOM write, zero React re-renders, per the render-loop rule.
  useEffect(() => {
    let raf = 0
    let lastFrac = nowFraction()
    // Column PAST is `baseKey`, which can lag reality by a day the instant the
    // clock rolls over. Measuring the drift every frame means the line is always
    // over the TRUE current day even if the columns haven't rebuilt yet.
    let drift = daysBetween(baseKey, todayKey())
    const loop = () => {
      const el = nowTravelRef.current
      const f = nowFraction()
      if (f < lastFrac - 0.5) {
        // wrapped past midnight: re-measure the day and mark the new page
        drift = daysBetween(baseKey, todayKey())
        setDayFlip((n) => n + 1)
      }
      lastFrac = f
      if (el) el.style.left = ((PAST + drift) * dayWidth + f * dayWidth) + 'px'
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [dayWidth, baseKey])

  // hover-glow the now-line without blocking clicks: the line is pointer-events:none;
  // we toggle the glow by cursor proximity to its current screen x.
  const onTimelineMove = (e) => {
    const el = nowBarRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const near = Math.abs(e.clientX - (r.left + r.width / 2)) < 9
    el.classList.toggle('glow', near)
  }

  const contentWidth = (PAST + FUT + 1) * dayWidth
  const nowContentX = PAST * dayWidth + nowFraction(now) * dayWidth
  const nowMin = now.getHours() * 60 + now.getMinutes()

  const gridBg = {
    backgroundImage:
      `repeating-linear-gradient(to right, var(--grid-line) 0, var(--grid-line) 1px, transparent 1px, transparent ${dayWidth / 8}px),` +
      `repeating-linear-gradient(to right, var(--grid-boundary) 0, var(--grid-boundary) 1px, transparent 1px, transparent ${dayWidth}px)`,
  }

  return (
    <div className="relative h-full">
      <div
        ref={scrollerRef}
        onMouseMove={onTimelineMove}
        className="no-scrollbar h-full overflow-x-auto overflow-y-hidden"
        style={{ scrollSnapType: mobile ? 'x mandatory' : 'none' }}
      >
        <div className="relative h-full" style={{ width: contentWidth, ...gridBg }}>
          {/* now-line travels across today's column (pointer-events:none → clicks pass through).
              `left` is written imperatively each frame by the rAF above — no transition. */}
          <div ref={nowTravelRef} className="nowline-travel" style={{ left: nowContentX }}>
            <div className="nowline-pill">{fmtTime(now.getHours() * 60 + now.getMinutes())}</div>
            <div ref={nowBarRef} className="nowline-bar" />
            {/* fresh-page flourish: the line pulses as it wraps into a new day */}
            {dayFlip > 0 && <div key={dayFlip} className="nowline-flip" />}
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
                nowMin={nowMin}
                tintEnabled={tintEnabled}
                elapsedStyle={elapsedStyle}
                variant={variant}
                calm={calm}
                onEdit={onEdit}
                onToggle={onToggle}
                onDelete={onDelete}
                onUncomplete={onUncomplete}
                onBump={onBump}
              />
            ))}
          </div>
        </div>
      </div>

      <MarkerAxis dayWidth={dayWidth} scrollerRef={scrollerRef} />
    </div>
  )
}

function DayCol({ date, dayWidth, mobile, isToday, store, today, nowMin, tintEnabled, elapsedStyle, variant, calm, onEdit, onToggle, onDelete, onUncomplete, onBump }) {
  const key = dateKey(date)
  const { overdue, timed, anytime, completed } = dayBands(store.tasks, key, today)
  // ONE lane system: untimed work is a bar spanning the whole day, so it stacks
  // alongside timed work instead of living in a separate band. The overdue cap
  // still applies — full-span bars would otherwise swallow the column.
  const shownOverdue = overdue.slice(0, OVERDUE_VISIBLE)
  const hiddenOverdue = overdue.slice(OVERDUE_VISIBLE)
  const bars = [...shownOverdue, ...anytime, ...timed]
  const { rows, laneCount } = packLanes(bars, dayWidth)
  const { Art, rest } = pickWaiting(key)

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

      <div className="no-scrollbar slot-fade relative flex-1 overflow-y-auto pb-24">
        <div className="flex flex-col gap-3">
          {bars.length > 0 && (
            <div className="relative" style={{ height: laneCount * 56 - 12 }}>
              <AnimatePresence initial={false}>
                {rows.map(({ task, lane }) => (
                  <TimedBar key={task.id} task={task} dayWidth={dayWidth} lane={lane} variant={variant}
                    nowMin={nowMin} tintEnabled={tintEnabled} elapsedStyle={elapsedStyle} today={today}
                    onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} onResize={store.updateTask} />
                ))}
              </AnimatePresence>
            </div>
          )}

          {hiddenOverdue.length > 0 && (
            <div className="flex flex-col items-start gap-1 pl-1">
              <Sticker Art={Art} rest={rest} size={64} calm={calm}
                title={`${hiddenOverdue.length} still lurking`}
                onClick={() => onBump?.(hiddenOverdue.map((t) => t.id))}>
                <span className="text-[13px] font-bold" style={{ color: 'var(--text-soft)' }}>
                  {hiddenOverdue.length} still lurking
                </span>
              </Sticker>
              <button onClick={() => onBump?.(hiddenOverdue.map((t) => t.id))}
                className="ml-1 rounded-full px-2 py-1 text-[12px] font-bold"
                style={{ color: 'var(--text-faint)' }}>
                bump &apos;em to tomorrow
              </button>
            </div>
          )}

          <CompletedSection tasks={completed} onUncomplete={onUncomplete} compact />
        </div>
      </div>
    </div>
  )
}

// Fixed bottom axis: 3-hour tick labels aligned to the gridlines. A continuous
// rAF reads the live scroll position AND the chat bar's current rect every frame,
// so markers track the bar instantly on minimize/move/resize (no scroll needed)
// and lift over it — but only while the bar sits within a low band near the bottom
// (the "ceiling"); lifted past it, markers snap back to their baseline row.
const CEIL_FROM_BOTTOM = 84 // ~1.5 bar-heights
const RAMP = 44
const POOL = 32

function MarkerAxis({ dayWidth, scrollerRef }) {
  const axisRef = useRef(null)
  const pool = useRef([])
  // spring lift state keyed by ABSOLUTE tick index (not pool slot) so a tick's
  // lift stays continuous as it scrolls past the bar — keying by slot made the
  // whole row's lift jump by one tick every time the scroll window shifted.
  const springMap = useRef(new Map())
  const tickW = dayWidth / 8

  useEffect(() => {
    const axis = axisRef.current
    const scroller = scrollerRef.current
    if (!axis || !scroller || !tickW) return
    let raf = 0
    const K = 0.16, DAMP = 0.74 // spring → gentle rubber-band rebound to baseline
    const loop = () => {
      const W = axis.clientWidth
      const H = axis.clientHeight
      const o = axis.getBoundingClientRect()
      const sl = scroller.scrollLeft
      const bar = document.querySelector('.js-chatbar')
      let barL = Infinity, barR = -Infinity, barTop = 0, active = false
      if (bar) {
        const b = bar.getBoundingClientRect()
        barL = b.left - o.left
        barR = b.right - o.left
        barTop = b.top - o.top
        active = o.bottom - b.bottom < CEIL_FROM_BOTTOM
      }
      const baseY = H - 32
      const liftY = barTop - 22
      const map = springMap.current
      const firstIdx = Math.floor(sl / tickW) - 1
      let p = 0
      for (let idx = firstIdx; p < pool.current.length; idx++) {
        const x = idx * tickW - sl
        if (x > W + tickW) break
        const el = pool.current[p]
        if (!el) { p++; continue }
        let s = map.get(idx)
        if (!s) { s = { cur: 0, vel: 0 }; map.set(idx, s) }
        const offscreen = x < -tickW
        let target = 0
        if (active && !offscreen) {
          if (x > barL && x < barR) target = 1
          else if (x >= barL - RAMP && x <= barL) target = (x - (barL - RAMP)) / RAMP
          else if (x >= barR && x <= barR + RAMP) target = (barR + RAMP - x) / RAMP
        }
        if (target < 0) target = 0
        if (target > 1) target = 1
        // spring toward the target lift (rebounds instead of snapping)
        s.vel += (target - s.cur) * K
        s.vel *= DAMP
        s.cur += s.vel
        if (s.cur < 0) { s.cur = 0; s.vel = 0 }
        if (s.cur > 1.12) s.cur = 1.12
        el.style.opacity = offscreen ? '0' : '1'
        el.style.transform = `translate(${x}px, ${baseY - s.cur * (baseY - liftY)}px) translateX(-50%)`
        const m = ((idx % 8) + 8) % 8
        const lab = el.firstElementChild.nextElementSibling
        lab.textContent = LABELS[m]
        lab.style.color = m === 0 ? 'var(--text-soft)' : 'var(--text-faint)'
        p++
      }
      for (; p < pool.current.length; p++) { const el = pool.current[p]; if (el) el.style.opacity = '0' }
      // prune springs for ticks far outside the visible window
      if (map.size > 160) for (const key of map.keys()) if (key < firstIdx - 40 || key > firstIdx + 120) map.delete(key)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [tickW, scrollerRef])

  return (
    <div ref={axisRef} className="pointer-events-none absolute inset-x-0 bottom-0 h-11" aria-hidden="true">
      {Array.from({ length: POOL }).map((_, i) => (
        <div key={i} ref={(el) => (pool.current[i] = el)} className="absolute top-0 left-0 text-center" style={{ willChange: 'transform', opacity: 0 }}>
          <div className="mx-auto h-[5px] w-px" style={{ background: 'var(--tick)' }} />
          <div className="mt-1 text-[10px] tabular-nums" />
        </div>
      ))}
    </div>
  )
}
