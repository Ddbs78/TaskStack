import { useEffect } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { PartyBean, HappyStar } from './stickers/art'

// The counterweight to the overdue pile.
//
// The app has to reward finishing more loudly than it punishes falling behind —
// otherwise debt is the only thing on screen with visual weight, which is the
// exact failure mode the capped stack exists to fix. So completion gets its own
// crafted moment, and clearing the LAST overdue task gets a rare one.
const CONFETTI = ['#B9A7F0', '#7FD8A8', '#F5D06B', '#8FC7F5', '#F58FA8', '#F4845F']

export default function Celebration({ event, onDone, calm = false }) {
  const prefersReduced = useReducedMotion()
  const still = calm || prefersReduced
  const zero = event?.type === 'zero'

  useEffect(() => {
    if (!event) return
    const t = setTimeout(onDone, zero ? 2200 : 1300)
    return () => clearTimeout(t)
  }, [event, zero, onDone])

  return (
    <AnimatePresence>
      {event && (
        <motion.div
          key={event.id}
          className="pointer-events-none fixed inset-0 z-[80] grid place-items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <div className="relative grid place-items-center">
            {/* confetti — only for the rare inbox-zero moment */}
            {zero && !still && CONFETTI.map((c, i) => {
              const angle = (i / CONFETTI.length) * Math.PI * 2
              return (
                <motion.span
                  key={i}
                  className="absolute rounded-[2px]"
                  style={{ width: 9, height: 9, background: c }}
                  initial={{ x: 0, y: 0, opacity: 0, rotate: 0 }}
                  animate={{
                    x: Math.cos(angle) * 130,
                    y: Math.sin(angle) * 110 + 40,
                    opacity: [0, 1, 1, 0],
                    rotate: 220 + i * 40,
                  }}
                  transition={{ duration: 1.5, ease: [0.15, 0.6, 0.4, 1], delay: 0.06 + i * 0.03 }}
                />
              )
            })}

            <motion.div
              initial={still ? { opacity: 0 } : { scale: 0, rotate: -22, opacity: 0 }}
              animate={
                still
                  ? { opacity: 1 }
                  : {
                      scale: [0, 1.2, 0.94, 1],
                      rotate: zero ? [-22, 8, -3, 0] : [-16, 6, 0],
                      opacity: 1,
                    }
              }
              exit={still ? { opacity: 0 } : { scale: 0.8, opacity: 0, y: -24 }}
              transition={
                still
                  ? { duration: 0.2 }
                  : { duration: zero ? 0.75 : 0.55, times: zero ? [0, 0.4, 0.7, 1] : [0, 0.5, 1], ease: 'easeOut' }
              }
              className="flex flex-col items-center gap-1"
            >
              {zero ? <HappyStar size={130} /> : <PartyBean size={104} />}
              <span
                className="font-display rounded-full px-3 py-1 text-[15px] font-semibold"
                style={{ background: 'var(--surface-2)', color: 'var(--text)', border: '0.5px solid var(--hairline)' }}
              >
                {zero ? 'nothing lurking — nice' : 'one down'}
              </span>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
