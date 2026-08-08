import { forwardRef, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import Icon from './Icon'
import MarkerRule from './MarkerRule'
import { createPortal } from 'react-dom'
import { fmtRange, fmtTime, relativeDayLabel, todayKey } from '../state/time'
import { overdueDays, elapsedFraction } from '../state/rollover'
import { flashComplete, PencilUnderline, ScratchCheck } from './stickers/art'

const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
const snap15 = (m) => Math.round(m / 15) * 15

// Evaporating-pop exit + squeeze-in entrance. Professional keeps the state
// change legible but drops the pop and the spring's overshoot.
const variants = {
  initial: { opacity: 0, scale: 0.8, y: 8, filter: 'blur(6px)' },
  animate: { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' },
  exit: {
    opacity: 0,
    scale: 1.12,
    filter: 'blur(8px)',
    transition: { duration: 0.32, ease: [0.4, 0, 0.2, 1] },
  },
}
const proVariants = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, transition: { duration: 0.2 } },
}
const SPRING = { type: 'spring', stiffness: 520, damping: 34, mass: 0.7 }
const EASED = { duration: 0.24, ease: [0.22, 0.61, 0.36, 1] }

const TaskCard = forwardRef(function TaskCard(
  { task, onToggle, onDelete, onEdit, onResize, variant = 'filled', today = todayKey(), nowMin = 0, tintEnabled = true, elapsedStyle = 'tint', personalized = true },
  ref
) {
  const hatch = elapsedStyle === 'hatch'
  const od = overdueDays(task, today)
  const overdue = od > 0
  const tinted = variant === 'tinted'
  const hue = overdue ? 'coral' : 'blue'
  // elapsed (left-of-line) two-tone tint for present TODAY tasks (if enabled)
  const elapsed = overdue || !tintEnabled ? 0 : elapsedFraction(task, nowMin, today)
  const fillBg = tinted
    ? `color-mix(in srgb, var(--task-coral-tint-bg) ${elapsed * 100}%, var(--task-blue-tint-bg))`
    : `color-mix(in srgb, var(--task-coral-bg) ${elapsed * 100}%, var(--task-blue-bg))`
  const labelColor = overdue
    ? 'var(--coral-strong)'
    : elapsed > 0
    ? `color-mix(in srgb, var(--coral-strong) ${elapsed * 100}%, var(--blue-strong))`
    : 'var(--blue-strong)'
  // Same declaration, two readings — see the .task-surface block in index.css.
  const cardStyle = {
    '--rail': hue === 'coral' ? 'var(--coral)' : 'var(--blue)',
    background: tinted ? `var(--bar-bg, var(--task-${hue}-tint-bg))` : `var(--bar-bg, var(--task-${hue}-bg))`,
    color: tinted ? `var(--bar-fg, var(--task-${hue}-tint-text))` : `var(--bar-fg, var(--task-${hue}-text))`,
  }
  const [pressing, setPressing] = useState(false)
  const timer = useRef(null)
  const startPt = useRef(null)
  const moved = useRef(false)

  // Gentle, non-judgmental overdue wording (§3.1); day-relative prefix otherwise.
  const label = overdue
    ? `${od} day${od > 1 ? 's' : ''} ago`
    : `${relativeDayLabel(task.date, today)} ${task.anytime ? 'Anytime' : fmtRange(task.start, task.end)}`

  // ---- long-press (mobile) delete -----------------------------------------
  const beginPress = (e) => {
    if (e.pointerType === 'mouse') return // desktop uses dbl/right click
    moved.current = false
    startPt.current = { x: e.clientX, y: e.clientY }
    setPressing(true)
    timer.current = setTimeout(() => {
      setPressing(false)
      if (!moved.current) {
        if (navigator.vibrate) navigator.vibrate(18)
        onDelete(task.id)
      }
    }, 450)
  }
  const movePress = (e) => {
    if (!startPt.current) return
    const dx = Math.abs(e.clientX - startPt.current.x)
    const dy = Math.abs(e.clientY - startPt.current.y)
    if (dx > 10 || dy > 10) {
      moved.current = true
      cancelPress()
    }
  }
  const cancelPress = () => {
    clearTimeout(timer.current)
    setPressing(false)
    startPt.current = null
  }

  // ---- drag-to-schedule on full-day cards -----------------------------------
  // A full-width anytime card already *is* the whole day, so narrowing it from
  // either edge reads naturally as "this runs from here to here". Dragging
  // converts the task to timed; from then on it renders as a TimedBar and uses
  // that component's resize. Imperative during the drag, commit on release.
  const boxRef = useRef(null)
  const [tip, setTip] = useState(null)

  const onEdgeDown = (edge) => (e) => {
    if (!onResize || !task.anytime || e.button === 2) return
    e.preventDefault(); e.stopPropagation()
    cancelPress()
    const box = boxRef.current
    const r0 = box.getBoundingClientRect()
    const perPx = 1440 / r0.width          // the card spans the full day column
    const startX = e.clientX
    let next = { start: 0, end: 1440 }
    box.style.transition = 'none'
    setTip({ x: e.clientX, y: r0.top - 10 })

    const move = (ev) => {
      const dx = (ev.clientX - startX) * perPx
      if (edge === 'start') next.start = clamp(snap15(dx), 0, next.end - 15)
      else next.end = clamp(1440 + snap15(dx), next.start + 15, 1440)
      box.style.marginLeft = `${(next.start / 1440) * 100}%`
      box.style.width = `${((next.end - next.start) / 1440) * 100}%`
      setTip({ x: ev.clientX, y: r0.top - 10, label: `${fmtTime(next.start)} – ${fmtTime(next.end)}` })
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      box.style.transition = ''
      box.style.marginLeft = ''
      box.style.width = ''
      setTip(null)
      if (next.start !== 0 || next.end !== 1440) {
        onResize(task.id, { start: next.start, end: next.end, anytime: false })
      }
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const canSchedule = !!onResize && task.anytime
  const renderEdge = (edge) => (
    <div
      key={`e-${edge}`}
      onPointerDown={onEdgeDown(edge)}
      className={`cursor-ew absolute inset-y-0 z-[3] ${edge === 'start' ? 'left-0' : 'right-0'}`}
      style={{ width: 10, touchAction: 'none' }}
      aria-label={`Schedule ${edge}`}
    />
  )

  return (
    <motion.div
      ref={ref}
      layout
      variants={personalized ? variants : proVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={personalized ? SPRING : EASED}
      whileTap={{ scale: 0.985 }}
      className="select-none"
      style={{ touchAction: 'pan-y' }}
    >
      {label && (
        <div className="ml-1 mb-1">
          <div className="text-[12px] font-semibold tracking-wide" style={{ color: labelColor }}>
            {label}
          </div>
          <MarkerRule color={labelColor} seed={task.id?.length || 0} opacity={0.42} />
        </div>
      )}

      <div
        ref={boxRef}
        onContextMenu={(e) => { e.preventDefault(); onDelete(task.id) }}
        onDoubleClick={() => onDelete(task.id)}
        onPointerDown={beginPress}
        onPointerMove={movePress}
        onPointerUp={cancelPress}
        onPointerLeave={cancelPress}
        className="inked task-surface group relative flex items-center gap-3 overflow-hidden rounded-[var(--radius-card)] px-4"
        style={{
          ...cardStyle,
          height: 'var(--card-h)',
          outline: pressing ? '2px solid var(--now-line)' : undefined,
          outlineOffset: pressing ? '2px' : undefined,
          transform: pressing ? 'scale(0.97)' : undefined,
          transition: 'transform 0.45s var(--ease-spring)',
        }}
      >
        {canSchedule && renderEdge('start')}
        {canSchedule && renderEdge('end')}

        {/* elapsed portion, left of the now-line. 'hatch' draws a hand-drawn
            diagonal rule instead of a solid block — reads as marked-off rather
            than half-rendered. */}
        {elapsed > 0 && (
          <div
            className="elapsed-fill pointer-events-none absolute inset-y-0 left-0 z-0"
            style={
              hatch
                ? {
                    width: `${elapsed * 100}%`,
                    backgroundImage:
                      'repeating-linear-gradient(115deg, color-mix(in srgb, var(--task-coral-text) 30%, transparent) 0 2px, transparent 2px 7px)',
                  }
                : { width: `${elapsed * 100}%`, background: `var(--bar-elapsed, ${fillBg})` }
            }
          />
        )}

        {/* checkbox — #1 scratchy hand-drawn box in personalized, clean circle otherwise */}
        <button
          aria-label={`Complete ${task.title}`}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); flashComplete(e.currentTarget, { personalized }); onToggle(task.id) }}
          className={`bar-check relative z-[1] grid h-[22px] w-[22px] shrink-0 place-items-center transition-transform active:scale-90 ${personalized ? '' : 'rounded-full border-2'}`}
        >
          {personalized ? (
            <ScratchCheck done={task.done} size={22} />
          ) : (
            <motion.span
              initial={false}
              animate={{ scale: task.done ? 1 : 0 }}
              className="block h-[11px] w-[11px] rounded-full"
              style={{ background: 'currentColor' }}
            />
          )}
        </button>

        {tinted && (
          <span
            className="relative z-[1] -ml-1 h-[7px] w-[7px] shrink-0 rounded-full"
            style={{ background: `var(--task-${hue}-bg)` }}
          />
        )}

        <button
          onClick={(e) => { e.stopPropagation(); onEdit?.(task) }}
          onPointerDown={(e) => e.stopPropagation()}
          className="relative z-[1] min-w-0 flex-1 overflow-hidden text-left text-[16px] font-semibold leading-tight tracking-[-0.01em]"
        >
          {/* the title shrink-wraps so #6's underline can span exactly its width */}
          <span className="tl-text relative inline-block max-w-full translate-y-0 whitespace-nowrap align-bottom">
            {task.title}
            <PencilUnderline />
          </span>
        </button>

        {task.recurrence && task.recurrence !== 'none' && (
          <Icon name="repeat" size={15} stroke={2} className="opacity-70" />
        )}
      </div>

      {tip && tip.label && createPortal(
        <div
          className="pointer-events-none fixed z-[70] -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-xl px-3 text-[12px] font-semibold tabular-nums"
          style={{ left: tip.x, top: tip.y, height: 26, lineHeight: '26px',
                   background: 'var(--surface-2)', color: 'var(--text)', border: 'var(--ink-w) solid var(--ink)' }}
        >
          {tip.label}
        </div>,
        document.body
      )}
    </motion.div>
  )
})

export default TaskCard
