import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Icon from './Icon'
import { DoneStamp } from './Doodle'
import { TearEdge } from './stickers/art'

// Collapsible "Completed (n)" disclosure, salvaged from the retired DayColumn
// so Timeline / Week / Month all show finished work the same way.
export default function CompletedSection({ tasks, onUncomplete, compact = false }) {
  const [open, setOpen] = useState(false)
  if (!tasks.length) return null

  return (
    <div className="relative mt-1">
      {/* #2 — the drawer tears off the column instead of ending on a rule */}
      <TearEdge />
      <button
        onClick={() => setOpen((v) => !v)}
        className="completed-head flex w-full items-center gap-1.5 px-1 py-1 text-[13px] font-semibold"
        style={{ color: 'var(--text-faint)' }}
      >
        <Icon
          name="chevronRight"
          size={15}
          style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }}
        />
        Completed ({tasks.length})
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex flex-col gap-2 overflow-hidden pt-1"
          >
            {tasks.map((t) => (
              <div
                key={t.id}
                className={`completed-row flex items-center gap-3 rounded-[var(--radius-card)] px-4 ${compact ? 'py-2' : 'py-3'}`}
                style={{ background: 'var(--completed-bg)', opacity: 0.75 }}
              >
                <button
                  aria-label={`Uncomplete ${t.title}`}
                  onClick={() => onUncomplete(t.id)}
                  className="completed-tick grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full"
                >
                  <Icon name="check" size={12} stroke={2.4} />
                </button>
                <span
                  className={`flex-1 truncate ${compact ? 'text-[13px]' : 'text-[15px]'} font-medium line-through`}
                  style={{ color: 'var(--text-faint)' }}
                >
                  {t.title}
                </span>
                <span className="craft-only shrink-0"><DoneStamp width={compact ? 56 : 68} /></span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
