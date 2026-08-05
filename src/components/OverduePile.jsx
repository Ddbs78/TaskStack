import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import TaskCard from './TaskCard'
import Sticker from './stickers/Sticker'
import { pickWaiting } from './stickers/art'
import { OVERDUE_VISIBLE } from '../state/bands'

// The overdue band, capped.
//
// WHY THIS EXISTS: the app's original thesis was that letting tasks stack up
// creates urgency. For the ADHD / executive-dysfunction audience it targets,
// unbounded visual debt reliably produces task-initiation paralysis instead —
// everything reads urgent, so nothing does, and each rollover adds emotional
// weight rather than motivation. So we show a healthy dose and let a character
// hold the rest, with a one-tap way out. See docs/CONSTITUTION.md.
export default function OverduePile({
  tasks,
  dayKey = '',
  today,
  nowMin,
  tintEnabled,
  variant,
  calm = false,
  onToggle,
  onDelete,
  onEdit,
  onBump,
}) {
  const [open, setOpen] = useState(false)
  if (!tasks.length) return null

  const visible = open ? tasks : tasks.slice(0, OVERDUE_VISIBLE)
  const hidden = tasks.slice(OVERDUE_VISIBLE)
  const { Art, rest, label } = pickWaiting(dayKey)

  return (
    <div className="flex flex-col gap-3">
      <AnimatePresence mode="popLayout" initial={false}>
        {visible.map((t) => (
          <TaskCard
            key={t.id}
            task={t}
            today={today}
            nowMin={nowMin}
            tintEnabled={tintEnabled}
            variant={variant}
            onToggle={onToggle}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {hidden.length > 0 && (
          <motion.div
            key="pile"
            layout
            className="flex flex-col items-start gap-1.5 pl-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Sticker
              Art={Art}
              rest={rest}
              size={72}
              calm={calm}
              onClick={() => setOpen((v) => !v)}
              title={open ? 'tuck them back' : `${hidden.length} still lurking — okay, show me`}
              className="-ml-1"
            >
              <span className="text-[13px] font-semibold" style={{ color: 'var(--text-soft)' }}>
                {open ? 'tuck them back' : `${hidden.length} still ${label === 'napping' ? 'napping' : 'lurking'}`}
              </span>
            </Sticker>

            {onBump && (
              <button
                onClick={() => onBump(hidden.map((t) => t.id))}
                className="ml-1 rounded-full px-2 py-1 text-[12px] font-semibold transition-colors hover:bg-[var(--surface-2)]"
                style={{ color: 'var(--text-faint)' }}
              >
                bump &apos;em to tomorrow
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
