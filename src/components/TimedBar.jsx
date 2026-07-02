import { forwardRef, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import Icon from './Icon'
import { fracOf, fmtRange } from '../state/time'
import { elapsedFraction, elapsedToday } from '../state/rollover'

// A timed task rendered as a calendar-style bar occupying only its hours.
// Label trims to fit; when it can't, a chevron chip opens the edit panel; when
// too narrow for any text, only the chip shows. Hovering a small bar opens a
// task-tinted peek blob (portaled → never clipped) with the details + a checkbox.
const variants = {
  initial: { opacity: 0, scale: 0.85, filter: 'blur(5px)' },
  animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 1.1, filter: 'blur(6px)', transition: { duration: 0.28 } },
}

const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
const snap15 = (m) => Math.round(m / 15) * 15
function durLabel(mins) {
  const h = Math.floor(mins / 60)
  const m = Math.round(mins % 60)
  if (h && m) return `${h} hr ${m} min`
  if (h) return `${h} hr${h > 1 ? 's' : ''}`
  return `${m} min`
}

function timeLeftLabel(end, nowMin, passed) {
  if (passed) return 'ended'
  const m = Math.max(0, Math.round(end - nowMin))
  if (m >= 60) {
    const h = m / 60
    return `${h % 1 ? h.toFixed(1) : h} hrs left`
  }
  return `${m} min${m === 1 ? '' : 's'} left`
}

const TimedBar = forwardRef(function TimedBar({ task, dayWidth, lane, variant = 'filled', nowMin = 0, tintEnabled = true, onToggle, onDelete, onEdit, onResize }, ref) {
  // timed calendar bar with hover peek + drag-to-resize ends
  const start = task.start ?? 0
  const end = task.end != null && task.end > start ? task.end : start + 30
  const left = fracOf(start) * 100
  const width = Math.max(2.2, (fracOf(end) - fracOf(start)) * 100)
  const px = Math.max(26, (width / 100) * dayWidth)
  const tinted = variant === 'tinted'

  const passed = elapsedToday(task, nowMin) // fully elapsed today → "0 days overdue"
  const elapsed = passed ? 1 : tintEnabled ? elapsedFraction(task, nowMin) : 0
  const hue = passed ? 'coral' : 'blue'
  const fillBg = tinted
    ? `color-mix(in srgb, var(--task-coral-tint-bg) ${elapsed * 100}%, var(--task-blue-tint-bg))`
    : `color-mix(in srgb, var(--task-coral-bg) ${elapsed * 100}%, var(--task-blue-bg))`

  const showCheckbox = px > 48
  const showText = px > 96
  const tiny = px <= 48
  const canPeek = px < 118 // small bars can't show full info → peek on hover
  const style = tinted
    ? { background: `var(--task-${hue}-tint-bg)`, color: `var(--task-${hue}-tint-text)`, border: `0.5px solid var(--task-${hue}-tint-border)` }
    : { background: `var(--task-${hue}-bg)`, color: `var(--task-${hue}-text)` }

  // ---- hover peek (portaled, fixed → escapes the scroll clip) ----------------
  const [peek, setPeek] = useState(null)
  const closeTimer = useRef(null)
  const openPeek = (e) => {
    if (!canPeek || draggingRef.current) return
    clearTimeout(closeTimer.current)
    const r = e.currentTarget.getBoundingClientRect()
    const W = 196
    const openRight = r.right + W + 14 < window.innerWidth
    setPeek({
      left: openRight ? r.right + 8 : r.left - W - 8,
      top: Math.min(window.innerHeight - 130, Math.max(8, r.top - 6)),
      w: W,
    })
  }
  const scheduleClose = () => { if (!draggingRef.current) closeTimer.current = setTimeout(() => setPeek(null), 120) }
  const keepOpen = () => clearTimeout(closeTimer.current)

  // ---- duration resize (drag either end; 15-min snap; live tooltip) -----------
  // Imperative during the gesture — we mutate the bar's left/width and the tooltip
  // directly each frame (no per-frame React state), and commit start/end only on
  // release. Only shown on bars wide enough to grab without fighting the controls.
  const localRef = useRef(null)
  const setRefs = (node) => {
    localRef.current = node
    if (typeof ref === 'function') ref(node)
    else if (ref) ref.current = node
  }
  const draggingRef = useRef(false)
  const [dragging, setDragging] = useState(null) // {top} while resizing → renders the tooltip
  const tipRef = useRef(null)
  const canResize = !!onResize && px > 60

  const onHandleDown = (edge) => (e) => {
    if (!onResize) return
    e.preventDefault(); e.stopPropagation()
    try { e.currentTarget.setPointerCapture?.(e.pointerId) } catch {}
    clearTimeout(closeTimer.current); setPeek(null)
    draggingRef.current = true
    const node = localRef.current
    const prevTransition = node.style.transition
    node.style.transition = 'none'
    const barTop = node.getBoundingClientRect().top
    const startX = e.clientX
    const origStart = start, origEnd = end
    const minPerPx = 1440 / dayWidth
    let next = { start: origStart, end: origEnd }
    setDragging({ top: barTop, x: startX })

    const move = (ev) => {
      const dx = (ev.clientX - startX) * minPerPx
      if (edge === 'start') next.start = clamp(origStart + dx, 0, origEnd - 15)
      else next.end = clamp(origEnd + dx, origStart + 15, 1440)
      node.style.left = `${fracOf(next.start) * 100}%`
      node.style.width = `${(fracOf(next.end) - fracOf(next.start)) * 100}%`
      if (tipRef.current) {
        tipRef.current.style.left = `${ev.clientX}px`
        tipRef.current.textContent = durLabel(next.end - next.start)
      }
    }
    const up = () => {
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up)
      draggingRef.current = false
      node.style.transition = prevTransition
      const s = snap15(next.start), en = Math.max(s + 15, snap15(next.end))
      setDragging(null)
      if (s !== origStart || en !== origEnd) onResize(task.id, { start: s, end: en })
      else { node.style.left = ''; node.style.width = '' } // no change → let React styles reassert
    }
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up)
  }

  // element-returning helper (NOT a component defined in render — that would remount
  // the handle DOM on every re-render and break the in-flight drag / pointer capture)
  const renderHandle = (edge) => (
    <div
      key={`h-${edge}`}
      onPointerDown={onHandleDown(edge)}
      onMouseEnter={keepOpen}
      className={`cursor-ew absolute inset-y-0 z-[3] flex w-[11px] items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 ${edge === 'start' ? 'left-0' : 'right-0'}`}
      style={{ touchAction: 'none' }}
      aria-label={`Resize ${edge}`}
    >
      <span className="h-[13px] w-[3px] rounded-full" style={{ background: 'color-mix(in srgb, currentColor 55%, transparent)' }} />
    </div>
  )

  return (
    <>
      <motion.div
        ref={setRefs}
        layout={!dragging}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ type: 'spring', stiffness: 480, damping: 32 }}
        onContextMenu={(e) => { e.preventDefault(); onDelete(task.id) }}
        onDoubleClick={() => onDelete(task.id)}
        onMouseEnter={openPeek}
        onMouseLeave={scheduleClose}
        className={`group absolute flex items-center overflow-hidden rounded-[11px] ${tiny ? 'justify-center px-0 gap-0' : 'gap-1.5 px-1.5'}`}
        style={{ ...style, left: `${left}%`, width: `${width}%`, minWidth: 26, top: lane * 34, height: 30, boxShadow: tinted ? undefined : 'var(--shadow-card)' }}
      >
        {canResize && renderHandle('start')}
        {canResize && renderHandle('end')}
        {elapsed > 0 && !passed && (
          <div className="pointer-events-none absolute inset-y-0 left-0 z-0" style={{ width: `${elapsed * 100}%`, background: fillBg }} />
        )}
        {showCheckbox && (
          <button
            aria-label={`Complete ${task.title}`}
            onClick={(e) => { e.stopPropagation(); onToggle(task.id) }}
            className="relative z-[1] grid h-[15px] w-[15px] shrink-0 place-items-center rounded-full border-[1.5px]"
            style={{ borderColor: 'currentColor' }}
          >
            {task.done && <span className="h-2 w-2 rounded-full" style={{ background: 'currentColor' }} />}
          </button>
        )}
        {showText && <span className="relative z-[1] flex-1 truncate text-[12px] font-semibold">{task.title}</span>}
        <button
          onClick={(e) => { e.stopPropagation(); onEdit?.(task) }}
          aria-label="Open details"
          className="relative z-[1] grid h-[18px] w-[18px] shrink-0 place-items-center rounded-md"
          style={{ background: 'color-mix(in srgb, currentColor 18%, transparent)' }}
        >
          <Icon name="chevronRight" size={12} stroke={2.1} />
        </button>
      </motion.div>

      {dragging && createPortal(
        <div
          ref={tipRef}
          className="fixed z-[70] -translate-x-1/2 -translate-y-full rounded-lg px-2 py-1 text-[11px] font-semibold tabular-nums shadow-lg"
          style={{ left: dragging.x, top: dragging.top - 8, background: 'var(--surface-2)', color: 'var(--text)', border: '0.5px solid var(--hairline)' }}
        >
          {durLabel(end - start)}
        </div>,
        document.body
      )}

      {peek && createPortal(
        <div
          onMouseEnter={keepOpen}
          onMouseLeave={scheduleClose}
          className="fixed z-[60] rounded-2xl p-3 shadow-2xl backdrop-blur-md"
          style={{
            left: peek.left, top: peek.top, width: peek.w,
            background: `color-mix(in srgb, var(--task-${hue}-bg) 30%, var(--surface))`,
            border: `0.5px solid var(--task-${hue}-tint-border)`,
          }}
        >
          <div className="mb-1 flex items-start gap-2">
            <button
              aria-label={`Complete ${task.title}`}
              onClick={() => onToggle(task.id)}
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
