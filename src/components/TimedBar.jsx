import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import Icon from './Icon'
import { fracOf, fmtRange } from '../state/time'

// A timed task rendered as a calendar-style bar occupying only its hours.
// Label trims to fit; when it can't, a chevron chip opens the edit panel;
// when too narrow for any text, only the chip shows.
const variants = {
  initial: { opacity: 0, scale: 0.85, filter: 'blur(5px)' },
  animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 1.1, filter: 'blur(6px)', transition: { duration: 0.28 } },
}

const TimedBar = forwardRef(function TimedBar({ task, dayWidth, lane, variant = 'filled', onToggle, onDelete, onEdit }, ref) {
  const start = task.start ?? 0
  const end = task.end != null && task.end > start ? task.end : start + 30
  const left = fracOf(start) * 100
  const width = Math.max(2.2, (fracOf(end) - fracOf(start)) * 100)
  const px = Math.max(26, (width / 100) * dayWidth)
  const tinted = variant === 'tinted'

  const showCheckbox = px > 48
  const showText = px > 96
  const tiny = px <= 48 // only room for the open-details chip
  const style = tinted
    ? { background: 'var(--task-blue-tint-bg)', color: 'var(--task-blue-tint-text)', border: '0.5px solid var(--task-blue-tint-border)' }
    : { background: 'var(--task-blue-bg)', color: 'var(--task-blue-text)' }

  return (
    <motion.div
      ref={ref}
      layout
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ type: 'spring', stiffness: 480, damping: 32 }}
      onContextMenu={(e) => { e.preventDefault(); onDelete(task.id) }}
      onDoubleClick={() => onDelete(task.id)}
      className={`absolute flex items-center overflow-hidden rounded-[11px] ${tiny ? 'justify-center px-0 gap-0' : 'gap-1.5 px-1.5'}`}
      style={{ ...style, left: `${left}%`, width: `${width}%`, minWidth: 26, top: lane * 34, height: 30, boxShadow: tinted ? undefined : 'var(--shadow-card)' }}
      title={`${task.title} · ${fmtRange(task.start, task.end)}`}
    >
      {showCheckbox && (
        <button
          aria-label={`Complete ${task.title}`}
          onClick={(e) => { e.stopPropagation(); onToggle(task.id) }}
          className="grid h-[15px] w-[15px] shrink-0 place-items-center rounded-full border-[1.5px]"
          style={{ borderColor: 'currentColor' }}
        >
          {task.done && <span className="h-2 w-2 rounded-full" style={{ background: 'currentColor' }} />}
        </button>
      )}

      {showText && <span className="flex-1 truncate text-[12px] font-semibold">{task.title}</span>}

      <button
        onClick={(e) => { e.stopPropagation(); onEdit?.(task) }}
        aria-label="Open details"
        className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-md"
        style={{ background: 'color-mix(in srgb, currentColor 18%, transparent)' }}
      >
        <Icon name="chevronRight" size={12} stroke={2.1} />
      </button>
    </motion.div>
  )
})

export default TimedBar
