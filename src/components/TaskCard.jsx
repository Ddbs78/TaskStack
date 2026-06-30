import { forwardRef, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import Icon from './Icon'
import { fmtRange, relativeDayLabel, todayKey } from '../state/time'
import { overdueDays } from '../state/rollover'

// Evaporating-pop exit + squeeze-in entrance.
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

const TaskCard = forwardRef(function TaskCard(
  { task, onToggle, onDelete, onEdit, variant = 'filled', today = todayKey() },
  ref
) {
  const od = overdueDays(task, today)
  const overdue = od > 0
  const tinted = variant === 'tinted'
  const hue = overdue ? 'coral' : 'blue'
  const cardStyle = tinted
    ? {
        background: `var(--task-${hue}-tint-bg)`,
        color: `var(--task-${hue}-tint-text)`,
        border: `0.5px solid var(--task-${hue}-tint-border)`,
      }
    : {
        background: `var(--task-${hue}-bg)`,
        color: `var(--task-${hue}-text)`,
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

  return (
    <motion.div
      ref={ref}
      layout
      layoutId={task.id}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ type: 'spring', stiffness: 520, damping: 34, mass: 0.7 }}
      whileTap={{ scale: 0.985 }}
      className="select-none"
      style={{ touchAction: 'pan-y' }}
    >
      {label && (
        <div
          className="ml-1 mb-1 text-[12px] font-semibold tracking-wide"
          style={{ color: overdue ? 'var(--coral-strong)' : 'var(--blue-strong)' }}
        >
          {label}
        </div>
      )}

      <div
        onContextMenu={(e) => { e.preventDefault(); onDelete(task.id) }}
        onDoubleClick={() => onDelete(task.id)}
        onPointerDown={beginPress}
        onPointerMove={movePress}
        onPointerUp={cancelPress}
        onPointerLeave={cancelPress}
        className="group relative flex items-center gap-3 rounded-[var(--radius-card)] px-4 py-3.5"
        style={{
          ...cardStyle,
          boxShadow: tinted ? undefined : 'var(--shadow-card)',
          outline: pressing ? '2px solid var(--now-line)' : undefined,
          outlineOffset: pressing ? '2px' : undefined,
          transform: pressing ? 'scale(0.97)' : undefined,
          transition: 'transform 0.45s var(--ease-spring)',
        }}
      >
        {/* checkbox */}
        <button
          aria-label={`Complete ${task.title}`}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onToggle(task.id) }}
          className="grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full border-2 transition-transform active:scale-90"
          style={{ borderColor: 'currentColor' }}
        >
          <motion.span
            initial={false}
            animate={{ scale: task.done ? 1 : 0 }}
            className="block h-[11px] w-[11px] rounded-full"
            style={{ background: 'currentColor' }}
          />
        </button>

        {tinted && (
          <span
            className="-ml-1 h-[7px] w-[7px] shrink-0 rounded-full"
            style={{ background: `var(--task-${hue}-bg)` }}
          />
        )}

        <button
          onClick={(e) => { e.stopPropagation(); onEdit?.(task) }}
          onPointerDown={(e) => e.stopPropagation()}
          className="flex-1 text-left text-[16px] font-semibold leading-tight tracking-[-0.01em]"
        >
          {task.title}
        </button>

        {task.recurrence && task.recurrence !== 'none' && (
          <Icon name="repeat" size={15} stroke={2} className="opacity-70" />
        )}
      </div>
    </motion.div>
  )
})

export default TaskCard
