import { forwardRef, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import Icon from './Icon'
import { fracOf, fmtRange } from '../state/time'
import { elapsedFraction, elapsedToday, overdueDays } from '../state/rollover'
import { spanOf, BAR_MIN_PX } from '../state/bands'
import { flashComplete, PencilUnderline } from './stickers/art'

const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
const snap15 = (m) => Math.round(m / 15) * 15

// signed, single-line "+2 hrs 30 mins" / "−45 mins" for the resize pill
function deltaLabel(mins) {
  const sign = mins > 0 ? '+' : mins < 0 ? '−' : ''
  const a = Math.abs(mins)
  const h = Math.floor(a / 60), m = a % 60
  const hs = h ? `${h} hr${h === 1 ? '' : 's'}` : ''
  const ms = m || !h ? `${m} min${m === 1 ? '' : 's'}` : ''
  return `${sign}${[hs, ms].filter(Boolean).join(' ')}`
}

// measure a title at the bar's font so the tier thresholds are exact, not guessed
let _mctx
function measureTitle(t) {
  if (!_mctx) { _mctx = document.createElement('canvas').getContext('2d'); _mctx.font = '500 14px system-ui, sans-serif' }
  return _mctx.measureText(t).width
}

function timeLeftLabel(end, nowMin, passed) {
  if (passed) return 'ended'
  const m = Math.max(0, Math.round(end - nowMin))
  if (m >= 60) { const h = m / 60; return `${h % 1 ? h.toFixed(1) : h} hrs left` }
  return `${m} min${m === 1 ? '' : 's'} left`
}

// Two motion configs, not two components. Professional keeps the state change
// legible (a bar appearing/leaving still has to read) but strips the blur-pop
// and the spring's overshoot — ease-out only, per the mode contract.
const variants = {
  initial: { opacity: 0, scale: 0.85, filter: 'blur(5px)' },
  animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 1.1, filter: 'blur(6px)', transition: { duration: 0.28 } },
}
const proVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: { duration: 0.18 } },
}
const SPRING = { type: 'spring', stiffness: 480, damping: 32 }
const EASED = { duration: 0.22, ease: [0.22, 0.61, 0.36, 1] }

// Vertical geometry is MODE-DRIVEN and lives in CSS: --bar-h / --lane-h
// (44/56 personalized, 30/38 professional). Nothing here hardcodes a height —
// the bar's `height` and `top` are calc()s over those vars, so the lane rhythm
// can never drift from the height actually painted. The only JS read is a
// single getComputedStyle at the start of a reorder drag (see onGripDown).
const LANE_FALLBACK = 56  // only used if --lane-h is somehow unreadable mid-gesture
const PADX = 10
const CIRCLE = 16         // checkbox box used for the width tiers below. CSS may
                          // paint it smaller (--cb is 14px in professional); the
                          // tiers then have MORE room than they budgeted for,
                          // which is safe — it can never clip.
const CHEV = 20
const GAP = 6
const EDGE = 9            // resize hit-zone at each end (< PADX so it never overlaps controls)
const MIN_PX = BAR_MIN_PX // min render width. Shared with packLanes so the lane
                          // packer and the renderer can never disagree about how
                          // wide a short task actually is.

// A timed task rendered as a calendar bar occupying only its hours. Width tiers
// (measured): circle+chevron → circle+clipped title+chevron → circle+full title.
// Ends are drag-resizable (cursor swaps to ⟷ on the border; 15-min snap; signed
// delta pill). Small bars open a task-tinted peek blob on hover.
const TimedBar = forwardRef(function TimedBar({ task, dayWidth, lane, variant = 'filled', nowMin = 0, tintEnabled = true, onToggle, onDelete, onEdit, onResize, onReorder, elapsedStyle = 'tint', today, personalized = true }, ref) {
  const hatch = elapsedStyle === 'hatch'
  const [start, end] = spanOf(task)
  const allDay = task.start == null           // untimed -> spans the whole day
  const od = overdueDays(task, today)
  // right-side tag: the overdue age, or ALL DAY. Replaces the label line that
  // used to sit above each card, so untimed and timed read as one system.
  const tag = od > 0 ? `${od} DAY${od > 1 ? 'S' : ''} AGO` : allDay ? 'ALL DAY' : null
  const left = fracOf(start) * 100
  const widthPct = (fracOf(end) - fracOf(start)) * 100
  const timePx = (widthPct / 100) * dayWidth
  const renderPx = Math.max(MIN_PX, timePx)
  const tinted = variant === 'tinted'

  const passed = elapsedToday(task, nowMin) // fully elapsed today → "0 days overdue"
  const elapsed = passed ? 1 : tintEnabled ? elapsedFraction(task, nowMin) : 0
  const hue = passed || od > 0 ? 'coral' : 'blue'
  const fillBg = tinted
    ? `color-mix(in srgb, var(--task-coral-tint-bg) ${elapsed * 100}%, var(--task-blue-tint-bg))`
    : `color-mix(in srgb, var(--task-coral-bg) ${elapsed * 100}%, var(--task-blue-bg))`

  // ---- content tiers by measured width ---------------------------------------
  const titleW = measureTitle(task.title)
  const fitsFull = renderPx >= PADX * 2 + CIRCLE + GAP + titleW + 8 // slack so it never clips
  const showCircle = fitsFull || renderPx >= PADX * 2 + CIRCLE + GAP + CHEV
  const showText = fitsFull || renderPx >= PADX * 2 + CIRCLE + GAP + 26 + GAP + CHEV
  const showChevron = !fitsFull // chevron only when there's detail you can't see
  const canPeek = !fitsFull
  // Both readings come out of the same declaration. --bar-bg / --bar-fg are
  // undefined in personalized, so the fallback (the hue-carrying body) wins;
  // the professional mode layer defines them, so the quiet hairline surface
  // wins there and --rail carries the identity instead. No mode branch here.
  const style = {
    '--rail': hue === 'coral' ? 'var(--coral)' : 'var(--blue)',
    background: tinted ? `var(--bar-bg, var(--task-${hue}-tint-bg))` : `var(--bar-bg, var(--task-${hue}-bg))`,
    color: tinted ? `var(--bar-fg, var(--task-${hue}-tint-text))` : `var(--bar-fg, var(--task-${hue}-text))`,
  }

  const draggingRef = useRef(false)

  // ---- hover peek (portaled, fixed → escapes the scroll clip) -----------------
  const [peek, setPeek] = useState(null)
  const closeTimer = useRef(null)
  const openPeek = (e) => {
    if (!canPeek || draggingRef.current) return
    clearTimeout(closeTimer.current)
    const r = e.currentTarget.getBoundingClientRect()
    const W = 200
    const openRight = r.right + W + 16 < window.innerWidth // else the task hugs the day's end → open left
    setPeek({ left: openRight ? r.right + 10 : r.left - W - 10, top: clamp(r.top - 6, 8, window.innerHeight - 150), w: W })
  }
  const scheduleClose = () => { if (!draggingRef.current) closeTimer.current = setTimeout(() => setPeek(null), 120) }
  const keepOpen = () => clearTimeout(closeTimer.current)

  // ---- duration resize (imperative; 15-min snap; live signed delta pill) ------
  const localRef = useRef(null)
  const setRefs = (node) => { localRef.current = node; if (typeof ref === 'function') ref(node); else if (ref) ref.current = node }
  const [dragging, setDragging] = useState(null) // {top, side, x} → renders the pill
  const tipRef = useRef(null)

  const onEdgeDown = (edge) => (e) => {
    if (!onResize || e.button === 2) return
    e.preventDefault(); e.stopPropagation()
    try { e.currentTarget.setPointerCapture?.(e.pointerId) } catch {}
    clearTimeout(closeTimer.current); setPeek(null)
    draggingRef.current = true
    const node = localRef.current
    const prevT = node.style.transition
    node.style.transition = 'none'
    const rect0 = node.getBoundingClientRect()
    const startX = e.clientX
    const origStart = start, origEnd = end
    const minPerPx = 1440 / dayWidth
    let next = { start: origStart, end: origEnd }
    setDragging({ top: rect0.top + rect0.height / 2, side: edge, x: edge === 'end' ? rect0.right : rect0.left })

    const move = (ev) => {
      const dx = (ev.clientX - startX) * minPerPx
      if (edge === 'start') next.start = clamp(snap15(origStart + dx), 0, origEnd - 15)
      else next.end = clamp(snap15(origEnd + dx), origStart + 15, 1440)
      node.style.left = `${fracOf(next.start) * 100}%`
      node.style.width = `${(fracOf(next.end) - fracOf(next.start)) * 100}%`
      const r = node.getBoundingClientRect()
      const ex = edge === 'end' ? r.right : r.left
      if (tipRef.current) {
        tipRef.current.style.left = `${ex + (edge === 'end' ? 12 : -12)}px`
        tipRef.current.textContent = deltaLabel((next.end - next.start) - (origEnd - origStart))
      }
    }
    const up = () => {
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up)
      draggingRef.current = false
      node.style.transition = prevT
      const s = clamp(snap15(next.start), 0, 1440), en = clamp(Math.max(s + 15, snap15(next.end)), 0, 1440)
      setDragging(null)
      if (s !== origStart || en !== origEnd) onResize(task.id, { start: s, end: en, anytime: false })
      else { node.style.left = ''; node.style.width = '' }
    }
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up)
  }

  // ---- drag to reorder (vertical, via the grip) -------------------------------
  // Horizontal edges already mean "resize", so reordering gets its own grip and
  // its own axis. Imperative during the drag; commits a lane swap on release.
  const onGripDown = (e) => {
    if (!onReorder || e.button === 2) return
    e.preventDefault(); e.stopPropagation()
    clearTimeout(closeTimer.current); setPeek(null)
    draggingRef.current = true
    const node = localRef.current
    const startY = e.clientY
    const prevT = node.style.transition
    const prevZ = node.style.zIndex
    node.style.transition = 'none'
    node.style.zIndex = '30'
    // ONE read of the mode geometry, at gesture start — never per frame.
    const cs = getComputedStyle(node)
    const laneH = parseFloat(cs.getPropertyValue('--lane-h')) || LANE_FALLBACK
    const tilt = parseFloat(cs.getPropertyValue('--drag-tilt'))
    const tiltAmt = Number.isFinite(tilt) ? tilt : 1
    node.style.boxShadow = cs.getPropertyValue('--drag-shadow').trim() || '5px 8px 0 var(--ink-shadow)'
    let lanesMoved = 0
    const move = (ev) => {
      const dy = ev.clientY - startY
      lanesMoved = Math.round(dy / laneH)
      const deg = tiltAmt * Math.max(-2.5, Math.min(2.5, dy / 40))
      node.style.transform = `translateY(${dy}px) rotate(${deg}deg) scale(${1 + tiltAmt * 0.03})`
    }
    const up = () => {
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up)
      draggingRef.current = false
      node.style.transition = prevT
      node.style.zIndex = prevZ
      node.style.transform = ''
      node.style.boxShadow = ''
      if (lanesMoved !== 0) onReorder(task.id, lanesMoved)
    }
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up)
  }

  const renderGrip = () => (
    <span
      onPointerDown={onGripDown}
      className="relative z-[3] flex shrink-0 cursor-ns flex-col gap-[2px] opacity-0 transition-opacity group-hover:opacity-60"
      style={{ touchAction: 'none' }}
      aria-label="Reorder"
      role="button"
    >
      <span style={{ width: 10, height: 1.6, background: 'currentColor' }} />
      <span style={{ width: 10, height: 1.6, background: 'currentColor' }} />
      <span style={{ width: 10, height: 1.6, background: 'currentColor' }} />
    </span>
  )

  // element-returning helper (NOT a component — that would remount mid-drag)
  const renderEdge = (edge) => (
    <div
      key={`e-${edge}`}
      onPointerDown={onEdgeDown(edge)}
      onMouseEnter={keepOpen}
      className={`cursor-ew absolute inset-y-0 z-[4] ${edge === 'start' ? 'left-0' : 'right-0'}`}
      style={{ width: EDGE, touchAction: 'none' }}
      aria-label={`Resize ${edge}`}
    />
  )

  return (
    <>
      <motion.div
        ref={setRefs}
        layout={!dragging}
        variants={personalized ? variants : proVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={personalized ? SPRING : EASED}
        onContextMenu={(e) => { e.preventDefault(); onDelete(task.id) }}
        onDoubleClick={() => onDelete(task.id)}
        onMouseEnter={openPeek}
        onMouseLeave={scheduleClose}
        className={`inked-sm task-surface group absolute flex items-center overflow-hidden ${showText ? 'justify-start' : 'justify-center'}`}
        style={{
          ...style,
          left: `${left}%`,
          width: `${widthPct}%`,
          minWidth: MIN_PX,
          borderRadius: 'var(--radius-bar)',
          top: `calc(${lane} * var(--lane-h))`,
          height: 'var(--bar-h)',
          paddingLeft: PADX,
          paddingRight: PADX,
          gap: GAP,
          boxShadow: tinted ? undefined : 'var(--bar-shadow, var(--shadow-card))',
        }}
      >
        {onResize && renderEdge('start')}
        {onResize && renderEdge('end')}

        {elapsed > 0 && !passed && (
          <div
            className="elapsed-fill pointer-events-none absolute inset-y-0 left-0 z-0"
            style={
              hatch
                ? { width: `${elapsed * 100}%`,
                    backgroundImage: 'repeating-linear-gradient(115deg, color-mix(in srgb, currentColor 32%, transparent) 0 2px, transparent 2px 7px)' }
                : { width: `${elapsed * 100}%`, background: `var(--bar-elapsed, ${fillBg})` }
            }
          />
        )}

        {onReorder && showText && renderGrip()}

        {showCircle && (
          <button
            aria-label={`Complete ${task.title}`}
            onClick={(e) => { e.stopPropagation(); flashComplete(e.currentTarget, { personalized }); onToggle(task.id) }}
            onPointerDown={(e) => e.stopPropagation()}
            className="bar-check relative z-[2] grid shrink-0 place-items-center rounded-full border-[1.5px]"
            style={{ width: 'var(--cb)', height: 'var(--cb)' }}
          >
            {task.done && <span className="rounded-full" style={{ width: 8, height: 8, background: 'currentColor' }} />}
          </button>
        )}

        {showText && <span className="bar-title relative z-[2] flex-1 truncate text-[14px] font-medium">{task.title}</span>}

        {tag && showText && (
          <span
            className="bar-tag tabular relative z-[2] ml-auto shrink-0 text-[9px] font-extrabold tracking-wide"
            style={{ opacity: 0.6 }}
          >
            {tag}
          </span>
        )}

        {/* #6 — a pencil line sketches under the title on hover (personalized) */}
        {showText && <PencilUnderline />}

        {showChevron && (
          <button
            onClick={(e) => { e.stopPropagation(); onEdit?.(task) }}
            onPointerDown={(e) => e.stopPropagation()}
            aria-label="Open details"
            className="relative z-[2] grid shrink-0 place-items-center rounded-md"
            style={{ width: CHEV, height: CHEV, background: 'color-mix(in srgb, currentColor 18%, transparent)' }}
          >
            <Icon name="chevronRight" size={12} stroke={2.1} />
          </button>
        )}
      </motion.div>

      {dragging && createPortal(
        <div
          ref={tipRef}
          className={`fixed z-[70] -translate-y-1/2 whitespace-nowrap px-3 text-[12px] font-medium tabular-nums ${dragging.side === 'start' ? '-translate-x-full' : ''}`}
          style={{ left: dragging.x + (dragging.side === 'end' ? 12 : -12), top: dragging.top, height: 26, lineHeight: '26px', borderRadius: 'var(--radius-surface)', background: 'var(--surface-2)', color: 'var(--text)', border: '0.5px solid var(--hairline)', boxShadow: 'var(--shadow-card)' }}
        >
          {deltaLabel(0)}
        </div>,
        document.body
      )}

      {peek && createPortal(
        <div
          onMouseEnter={keepOpen}
          onMouseLeave={scheduleClose}
          className="fixed z-[60] p-3 shadow-2xl backdrop-blur-md"
          style={{
            left: peek.left, top: peek.top, width: peek.w,
            borderRadius: 'var(--radius-surface)',
            background: `color-mix(in srgb, var(--task-${hue}-bg) 22%, var(--surface))`,
            border: `0.5px solid var(--task-${hue}-tint-border)`,
          }}
        >
          <div className="mb-1 flex items-start gap-2">
            <button
              aria-label={`Complete ${task.title}`}
              onClick={(e) => { flashComplete(e.currentTarget, { personalized }); onToggle(task.id) }}
              className="mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border-2"
              style={{ borderColor: `var(--task-${hue}-bg)` }}
            >
              {task.done && <span className="h-[9px] w-[9px] rounded-full" style={{ background: `var(--task-${hue}-bg)` }} />}
            </button>
            <span className="text-[14px] font-semibold leading-tight" style={{ color: 'var(--text)' }}>{task.title}</span>
          </div>
          <div className="pl-[26px] text-[12px]" style={{ color: 'var(--text-soft)' }}>{fmtRange(task.start, task.end)}</div>
          {task.notes && <div className="mt-1 pl-[26px] text-[12px]" style={{ color: 'var(--text-faint)' }}>{task.notes}</div>}
          <div className="mt-2 flex items-center gap-1.5 pl-[26px] text-[11px] font-semibold" style={{ color: passed ? 'var(--coral-strong)' : 'var(--text-soft)' }}>
            <Icon name="clock" size={13} stroke={1.9} />
            {passed ? '0 days overdue' : timeLeftLabel(end, nowMin, passed)}
          </div>
        </div>,
        document.body
      )}
    </>
  )
})

export default TimedBar
