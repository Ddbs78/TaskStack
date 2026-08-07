import { AnimatePresence, motion } from 'framer-motion'

// Slide-up toast with a 5s depleting progress bar and an Undo action (§1.15).
export default function UndoToast({ toast, onUndo, onDismiss }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 480, damping: 32 }}
          className="pointer-events-none fixed inset-x-0 z-50 flex justify-center px-4"
          style={{ bottom: 112 }}
        >
          <div
            className="pointer-events-auto relative flex items-center gap-3 overflow-hidden rounded-[var(--radius-card)] py-2.5 pl-4 pr-2 shadow-2xl"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--hairline)' }}
          >
            <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
              {toast.message}
            </span>
            <button
              onClick={() => onUndo(toast)}
              className="rounded-full px-3 py-1.5 text-sm font-bold"
              style={{ background: 'var(--blue-strong)', color: '#fff' }}
            >
              Undo
            </button>
            {/* depleting progress bar */}
            <div
              className="absolute bottom-0 left-0 h-[3px] w-full origin-left"
              style={{
                background: 'var(--blue-strong)',
                animation: 'toastDeplete 5s linear forwards',
              }}
              onAnimationEnd={() => onDismiss(toast)}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
