// PARKED (not currently used). The live "preview chips" that showed the parsed
// date + time as two pills above the input bar while typing. Removed per design
// (felt like clutter) but kept here in case we reintroduce an inline hint later.
//
// To re-enable: import { PreviewChips } and render it above the bar in InputBar,
// passing chipDate + effectiveTime, gated on `text.trim().length > 0`.
import { AnimatePresence, motion } from 'framer-motion'
import { fmtRange } from '../../state/time'

function Chip({ children, active }) {
  return (
    <span
      className="rounded-full px-3 py-1 text-xs font-bold"
      style={{ background: active ? 'var(--blue-strong)' : 'var(--surface-2)', color: active ? '#fff' : 'var(--text-soft)' }}
    >
      {children}
    </span>
  )
}

export function PreviewChips({ show, chipDate, effectiveTime, parsedTitle, rawText }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          className="mb-2 flex flex-wrap items-center gap-2 px-2"
        >
          <Chip active>{chipDate}</Chip>
          <Chip active={effectiveTime.start != null}>{fmtRange(effectiveTime.start, effectiveTime.end)}</Chip>
          {parsedTitle && parsedTitle !== rawText.trim() && (
            <span className="text-xs" style={{ color: 'var(--text-faint)' }}>→ “{parsedTitle}”</span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
