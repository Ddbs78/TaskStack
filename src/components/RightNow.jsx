import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Icon from './Icon'
import { fmtRange } from '../state/time'
import { rankOf } from '../state/bands'
import { isOverdue } from '../state/rollover'

// "Right Now" — the single highest-leverage feature for this audience.
//
// For ADHD brains the bottleneck is *starting*, and the load that blocks
// starting is deciding what to start. So this answers the question for you:
// one task, two choices, nothing else on screen. Every extra control here would
// re-introduce exactly the decision load it exists to remove.

// Candidate order: happening right now > overdue > next up today. Urgency
// breaks ties. Unranked tasks fall back to the neutral middle (see bands.js).
function candidates(tasks, today, nowMin) {
  const live = tasks.filter((t) => !t.done)
  const score = (t) => {
    let base
    if (t.start != null && t.date === today && nowMin >= t.start && nowMin <= (t.end ?? t.start + 30)) base = 3000
    else if (isOverdue(t, today)) base = 2000
    else if (t.date === today) base = 1000
    else return -1
    return base + rankOf(t) * 10 - (t.start != null ? Math.max(0, (t.start - nowMin) / 1440) : 0)
  }
  return live
    .map((t) => ({ t, s: score(t) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.t)
}

export default function RightNow({ open, onClose, tasks, today, nowMin, onComplete }) {
  const [skip, setSkip] = useState(0)
  const list = useMemo(() => candidates(tasks, today, nowMin), [tasks, today, nowMin])
  const task = list[skip % Math.max(1, list.length)]

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="rn-scrim"
            className="fixed inset-0 z-[70] backdrop-blur-[3px]"
            style={{ background: 'color-mix(in srgb, var(--bg) 72%, transparent)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
          />
          <motion.div
            key="rn-card"
            className="fixed left-1/2 top-1/2 z-[71] w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2"
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 440, damping: 32 }}
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <span className="text-[13px] font-semibold" style={{ color: 'var(--text-faint)' }}>right now</span>
              <button onClick={onClose} aria-label="Close" style={{ color: 'var(--text-faint)' }}>
                <Icon name="x" size={20} />
              </button>
            </div>

            {task ? (
              <>
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: 'spring', stiffness: 460, damping: 34 }}
                  className="rounded-[24px] p-5"
                  style={{
                    background: isOverdue(task, today) ? 'var(--task-coral-bg)' : 'var(--task-blue-bg)',
                    color: isOverdue(task, today) ? 'var(--task-coral-text)' : 'var(--task-blue-text)',
                    boxShadow: 'var(--shadow-card)',
                  }}
                >
                  <div className="font-display text-[26px] font-semibold leading-tight">{task.title}</div>
                  <div className="mt-1 text-[13px] opacity-75">
                    {task.start != null ? fmtRange(task.start, task.end) : 'anytime'}
                    {task.urgency != null && !task.urgencyOff ? ` · matters ${task.urgency}/10` : ''}
                  </div>
                </motion.div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setSkip((s) => s + 1)}
                    className="rounded-full px-4 py-3 text-[14px] font-semibold"
                    style={{ background: 'var(--surface-2)', color: 'var(--text-soft)' }}
                  >
                    not this one
                  </button>
                  <button
                    onClick={() => { onComplete(task.id); setSkip(0) }}
                    className="flex-1 rounded-full px-4 py-3 text-[14px] font-bold transition-transform active:scale-95"
                    style={{ background: 'var(--success)', color: '#06352a' }}
                  >
                    done
                  </button>
                </div>
              </>
            ) : (
              <div
                className="rounded-[24px] p-6 text-center"
                style={{ background: 'var(--surface)', border: '0.5px solid var(--hairline)' }}
              >
                <div className="font-display text-[20px]" style={{ color: 'var(--text)' }}>nothing needs you right now</div>
                <div className="mt-1 text-[13px]" style={{ color: 'var(--text-faint)' }}>genuinely. go do something else.</div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
