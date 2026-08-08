import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import TaskCard from './TaskCard'
import TimedBar from './TimedBar'
import { addDays, dateKey, startOfDay, todayKey, daysBetween, formatHeader, formatShort, useIsMobile, nowFraction, fmtTime } from '../state/time'
import { dayBands, packLanes, OVERDUE_VISIBLE, applyManualOrder, hasManualOrder } from '../state/bands'
import Sticker from './stickers/Sticker'
import { pickWaiting, CornerFold } from './stickers/art'
import MarkerRule from './MarkerRule'
import { EmptyDayDoodle } from './Doodle'
import CompletedSection from './CompletedSection'

const PAST = 45
const FUT = 45
const LABELS = ['12a', '3a', '6a', '9a', '12p', '3p', '6p', '9p']

export default function Timeline({ store, now, onEdit, actions, focusDay }) {
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
  const personalized = store.settings.mode === 'personalized'

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
    // a drill-down from Week/Month centres that day instead of today
    const target = focusDay || todayKey()
    const col = PAST + daysBetween(baseKey, target)
    el.scrollLeft = mobile ? col * dayWidth : (col - 1) * dayWidth
  }, [dayWidth, mobile, baseKey, dayFlip, focusDay])

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

  // Painted from --timeline-grid / --timeline-boundary, NOT --grid-line: the
  // mode layer sets both to transparent in professional (Console refuses
  // gridlines) while --grid-line itself must stay live for Week's segment rules
  // and Month's micro-strip track.
  const gridBg = {
    backgroundImage:
      `repeating-linear-gradient(to right, var(--timeline-grid) 0, var(--timeline-grid) 1px, transparent 1px, transparent ${dayWidth / 8}px),` +
      `repeating-linear-gradient(to right, var(--timeline-boundary) 0, var(--timeline-boundary) 1px, transparent 1px, transparent ${dayWidth}px)`,
  }

  return (
    <div className="relative h-full">
      <div
        ref={scrollerRef}
        onMouseMove={onTimelineMove}
        className="no-scrollbar h-full overflow-x-auto overflow-y-hidden"
        style={{ scrollSnapType: mobile ? 'x mandatory' : 'none' }}
      >
        <div className="relative h-full" style={{ width: contentWidth }}>
          {/* Gridlines live on their own layer, masked to fade in over the top
              ~76px, so they don't hard-cut right under the app header — they
              ease in beneath the day headings instead. */}
          <div className="timeline-gridlayer" style={gridBg} aria-hidden="true" />
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
                personalized={personalized}
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

function DayCol({ date, dayWidth, mobile, isToday, store, today, nowMin, tintEnabled, elapsedStyle, variant, calm, personalized, onEdit, onToggle, onDelete, onUncomplete, onBump }) {
  const key = dateKey(date)
  const { overdue, timed, anytime, completed } = dayBands(store.tasks, key, today)
  // ONE lane system: untimed work is a bar spanning the whole day, so it stacks
  // alongside timed work instead of living in a separate band. The overdue cap
  // still applies — full-span bars would otherwise swallow the column.
  const shownOverdue = overdue.slice(0, OVERDUE_VISIBLE)
  const hiddenOverdue = overdue.slice(OVERDUE_VISIBLE)
  const bars = applyManualOrder([...shownOverdue, ...anytime, ...timed])
  const { rows, laneCount } = packLanes(bars, dayWidth)
  const { Art, rest } = pickWaiting(key)
  const manual = hasManualOrder(bars)

  // Reorder writes an explicit sortIndex for the whole column, so the new order
  // survives a reload and the reset chip has something concrete to clear.
  const reorder = (id, lanesMoved) => {
    const cur = bars.findIndex((t) => t.id === id)
    if (cur < 0) return
    const next = Math.max(0, Math.min(bars.length - 1, cur + lanesMoved))
    if (next === cur) return
    const arr = [...bars]
    const [moved] = arr.splice(cur, 1)
    arr.splice(next, 0, moved)
    arr.forEach((t, i) => store.updateTask(t.id, { sortIndex: i }))
  }
  const resetOrder = () => bars.forEach((t) => store.updateTask(t.id, { sortIndex: null }))

  // #4 — the page-corner fold marks "there's more below". Written straight onto
  // the DOM node (a class toggle, no state) so it costs nothing per column and
  // can't trigger a render mid-scroll. 91 columns exist; only a handful are ever
  // scrollable at once.
  const scrollRef = useRef(null)
  const syncMore = () => {
    const el = scrollRef.current
    if (!el) return
    const more = el.scrollHeight - el.clientHeight - el.scrollTop > 6
    el.parentElement?.classList.toggle('has-more', more)
  }
  useLayoutEffect(syncMore, [bars.length, completed.length, laneCount, dayWidth])

  const short = formatShort(date)
  const count = bars.length + hiddenOverdue.length

  return (
    <div
      className={`day-wash relative flex h-full flex-col${isToday ? ' is-today' : ''}`}
      style={{ width: dayWidth, scrollSnapAlign: mobile ? 'center' : 'none' }}
    >
      {/* One header, four spans. Personalized shows the hand-set name (plus a
          marker swash under today); professional shows weekday · date · live
          count. Which pair is visible is decided in index.css, not here. */}
      <div className="day-head mb-2 px-2 pt-1">
        <div className="day-head-row">
          <span className="dh-dow">{short.wd}</span>
          <span
            className="dh-name font-display text-[clamp(14px,2vw,24px)]"
            style={{ color: isToday ? 'var(--text)' : 'var(--text-faint)', fontWeight: isToday ? 600 : 500 }}
          >
            {formatHeader(date)}
          </span>
          <span className="dh-num tabular">{short.day}</span>
          {count > 0 && <span className="dh-count tabular">{count}</span>}
        </div>

        {/* #5 — today's header gets a marker swash; other days stay plain, which
            is what makes the swash mean "today" at all. */}
        {isToday && (
          <span className="craft-only mx-auto block w-[70%]">
            <MarkerRule color="var(--coral)" seed={2} opacity={0.75} />
          </span>
        )}

        {manual && (
          <button
            onClick={resetOrder}
            className="mx-auto mt-1 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold"
            style={{ background: 'var(--surface-2)', color: 'var(--text-soft)', border: 'var(--ink-w) solid var(--ink)' }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#F5D06B" strokeWidth="2.6" strokeLinecap="round">
              <path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" />
            </svg>
            back to ranked order
          </button>
        )}
      </div>

      <div ref={scrollRef} onScroll={syncMore} className="no-scrollbar slot-fade relative flex-1 overflow-y-auto pb-24">
        <div className="flex flex-col gap-3">
          {bars.length > 0 && (
            // Height comes from the same vars the bars are painted with, so the
            // container can never disagree with the lane rhythm inside it.
            <div className="relative" style={{ height: `calc(${laneCount} * var(--lane-h) - (var(--lane-h) - var(--bar-h)))` }}>
              <AnimatePresence initial={false}>
                {rows.map(({ task, lane }) => (
                  <TimedBar key={task.id} task={task} dayWidth={dayWidth} lane={lane} variant={variant}
                    nowMin={nowMin} tintEnabled={tintEnabled} elapsedStyle={elapsedStyle} today={today}
                    personalized={personalized}
                    onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} onResize={store.updateTask} onReorder={reorder} />
                ))}
              </AnimatePresence>
            </div>
          )}

          {hiddenOverdue.length > 0 && (
            <div className="flex flex-col items-start gap-1 pl-1">
              <Sticker Art={Art} rest={rest} size={64} calm={calm}
                personalized={personalized}
                paper={hiddenOverdue.length}
                paperLabel={`${hiddenOverdue.length} more overdue`}
                paperWidth={Math.min(168, dayWidth - 32)}
                title={personalized ? `${hiddenOverdue.length} still lurking` : `${hiddenOverdue.length} more overdue`}
                onClick={() => onBump?.(hiddenOverdue.map((t) => t.id))}>
                <span className="text-[13px] font-bold" style={{ color: 'var(--text-soft)' }}>
                  {hiddenOverdue.length} still lurking
                </span>
              </Sticker>
              <button onClick={() => onBump?.(hiddenOverdue.map((t) => t.id))}
                className="ml-1 rounded-full px-2 py-1 text-[12px] font-bold"
                style={{ color: 'var(--text-faint)' }}>
                {personalized ? "bump 'em to tomorrow" : 'Move to tomorrow'}
              </button>
            </div>
          )}

          {bars.length === 0 && completed.length === 0 && (isToday || date > new Date()) && (
            <div className="mt-6 flex flex-col items-center gap-1 opacity-70">
              <span className="craft-only"><EmptyDayDoodle width={110} /></span>
              <span className="text-[12px]" style={{ color: 'var(--text-faint)' }}>
                {isToday ? 'Nothing more today' : 'Clear'}
              </span>
            </div>
          )}

          <CompletedSection tasks={completed} onUncomplete={onUncomplete} compact />
        </div>
      </div>

      {/* sibling of the scroller, not a child: absolute-inside-a-scroller pins
          to the bottom of the CONTENT, which is exactly where "more below"
          isn't. `has-more` is toggled on this column by syncMore. */}
      <CornerFold />
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
