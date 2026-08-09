import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { PartyBean, HappyStar } from './stickers/art'

// The counterweight to the overdue pile.
//
// The app has to reward finishing more loudly than it punishes falling behind —
// otherwise debt is the only thing on screen with visual weight, which is the
// exact failure mode the capped stack exists to fix.
//
// Two tiers:
//   'one'  — ~1.2s corner toast, never blocks, shows live remaining count
//   'zero' — the rare inbox-zero cinematic (impact-frame language)
//
// VIDEO SWAP: when breakthrough.mp4 lands in src/assets/cinematic/, drop it into
// <ZeroCinematic> in place of the <ImpactFrame> layer — the dim/skip/restore
// choreography around it stays exactly the same.
const CONFETTI = ['#B9A7F0', '#7FD8A8', '#F5D06B', '#8FC7F5', '#F58FA8', '#e58a67']

function SkipButton({ onSkip, delay = 0.4 }) {
  return (
    <motion.button
      onClick={onSkip}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.3 }}
      className="pointer-events-auto absolute right-4 top-4 z-10 rounded-full px-3 py-1.5 text-[11px] font-bold backdrop-blur"
      style={{
        background: 'rgba(255,255,255,.14)',
        border: '1px solid rgba(255,255,255,.3)',
        color: '#fff',
      }}
    >
      skip ›
    </motion.button>
  )
}

// ---- inbox zero: anime impact frame -----------------------------------------
function ZeroCinematic({ onSkip, still }) {
  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-[90] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* the world dims — recedes, never a hard cut */}
      <motion.div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(circle at 50% 52%, rgba(20,18,14,.86), rgba(8,8,10,.96))' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      />

      {!still && (
        <>
          {/* conic speed lines burst outward */}
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                'repeating-conic-gradient(from 0deg at 50% 52%, rgba(255,248,238,.22) 0deg 1.4deg, transparent 1.4deg 7deg)',
              maskImage: 'radial-gradient(circle at 50% 52%, transparent 8%, #000 42%)',
              WebkitMaskImage: 'radial-gradient(circle at 50% 52%, transparent 8%, #000 42%)',
            }}
            initial={{ opacity: 0, scale: 0.35, rotate: -6 }}
            animate={{ opacity: [0, 0.95, 0.5, 0], scale: [0.35, 1.5, 1.9], rotate: 6 }}
            transition={{ duration: 1.9, delay: 0.35, times: [0, 0.25, 0.6, 1], ease: 'easeOut' }}
          />
          {/* golden core ignites */}
          <motion.div
            className="absolute left-1/2 top-[52%] h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: '#F5D06B', filter: 'blur(6px)' }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.35, 0.9, 3.4], opacity: [0, 1, 0.9, 0] }}
            transition={{ duration: 1.7, delay: 0.45, times: [0, 0.18, 0.32, 1], ease: 'easeOut' }}
          />
          {/* diagonal light sweep */}
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(105deg, transparent 32%, rgba(255,248,238,.34) 48%, transparent 62%)',
            }}
            initial={{ x: '-60%', opacity: 0 }}
            animate={{ x: '60%', opacity: [0, 1, 0] }}
            transition={{ duration: 1.1, delay: 0.85, ease: 'easeInOut' }}
          />
          {/* confetti */}
          {CONFETTI.map((c, i) => {
            const a = (i / CONFETTI.length) * Math.PI * 2
            return (
              <motion.span
                key={i}
                className="absolute left-1/2 top-[52%] rounded-[2px]"
                style={{ width: 11, height: 11, background: c }}
                initial={{ x: 0, y: 0, opacity: 0, rotate: 0 }}
                animate={{
                  x: Math.cos(a) * 260,
                  y: Math.sin(a) * 200 + 150,
                  opacity: [0, 1, 1, 0],
                  rotate: 260 + i * 44,
                }}
                transition={{ duration: 2.1, delay: 0.9 + i * 0.045, ease: [0.15, 0.6, 0.4, 1] }}
              />
            )
          })}
        </>
      )}

      {/* the payoff */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center"
        initial={still ? { opacity: 0 } : { scale: 0.35, opacity: 0, rotate: -7 }}
        animate={
          still
            ? { opacity: 1 }
            : { scale: [0.35, 1.16, 0.97, 1], opacity: 1, rotate: [-7, 2, -1, 0] }
        }
        transition={
          still
            ? { duration: 0.3, delay: 0.3 }
            : { duration: 0.85, delay: 1.0, times: [0, 0.34, 0.62, 1], ease: [0.2, 1.4, 0.4, 1] }
        }
      >
        <div className="mb-2">
          <HappyStar size={120} />
        </div>
        <div
          className="font-display text-[clamp(34px,7vw,74px)] font-extrabold leading-none"
          style={{
            color: '#fff',
            WebkitTextStroke: '5px #14141a',
            paintOrder: 'stroke fill',
            textShadow: '0 6px 30px rgba(245,208,107,.7)',
            letterSpacing: '.5px',
          }}
        >
          ALL CLEAR
        </div>
        <div
          className="mt-2 text-[11px] font-bold"
          style={{ color: '#ffe9a8', letterSpacing: '5px' }}
        >
          NOTHING LURKING
        </div>
      </motion.div>

      <SkipButton onSkip={onSkip} />
    </motion.div>
  )
}

// ---- everyday completion: corner toast ---------------------------------------
// `stacked` lifts this clear of the undo toast, which occupies the same dock.
// professional: a restrained green check + plain progress line. No bean, no
// bounce — the same Apple-Pay check language as the checkbox burst.
function ProCheckToast({ done, left, still, stacked }) {
  return (
    <motion.div
      className="pointer-events-none fixed left-1/2 z-[60] -translate-x-1/2"
      style={{ bottom: stacked ? 186 : 112 }}
      initial={still ? { opacity: 0 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: still ? 0.16 : 0.24, ease: [0.22, 0.61, 0.36, 1] }}
    >
      <div
        className="flex items-center gap-2.5 rounded-xl px-4 py-2.5"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--hairline)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="11" fill="var(--success)" />
          <path d="M6.8 12.4 L10.4 16 L17.2 8.4" fill="none" stroke="#06281c" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-[13px] font-semibold tabular-nums" style={{ color: 'var(--text)' }}>
          {left > 0 ? `Done · ${done} of ${done + left}` : `Done · all ${done} today`}
        </span>
      </div>
    </motion.div>
  )
}

function OneToast({ done, left, onSkip, still, stacked, personalized }) {
  if (!personalized) return <ProCheckToast done={done} left={left} still={still} stacked={stacked} />
  return (
    <motion.div
      className="pointer-events-none fixed left-1/2 z-[60] -translate-x-1/2"
      style={{ bottom: stacked ? 186 : 112 }}
      initial={still ? { opacity: 0 } : { opacity: 0, scale: 0.5, y: 16 }}
      animate={
        still
          ? { opacity: 1 }
          : { opacity: 1, scale: [0.5, 1.14, 0.97, 1], y: [16, -3, 0, 0] }
      }
      exit={{ opacity: 0, scale: 0.95, y: -8 }}
      transition={still ? { duration: 0.18 } : { duration: 0.55, times: [0, 0.3, 0.55, 1], ease: [0.2, 1.5, 0.4, 1] }}
    >
      <div
        className="flex items-center gap-3 rounded-2xl px-4 py-2.5 pl-2.5"
        style={{
          background: 'var(--surface-2)',
          border: '2px solid var(--brand-ink)',
          boxShadow: '3px 4px 0 rgba(0,0,0,.35)',
        }}
      >
        <PartyBean size={46} />
        <div>
          <div className="font-display text-[15px] font-bold" style={{ color: 'var(--text)' }}>
            {left > 0 ? `${done} down, ${left} to go` : `${done} down — that's the lot`}
          </div>
          <div className="text-[11px]" style={{ color: 'var(--text-soft)' }}>
            {left > 0 ? 'keep rolling →' : 'the big one’s coming…'}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function Celebration({ event, onDone, calm = false, undoVisible = false, personalized = false }) {
  const prefersReduced = useReducedMotion()
  const still = calm || prefersReduced
  const zero = event?.type === 'zero'
  const [skipped, setSkipped] = useState(false)

  useEffect(() => {
    if (!event) return
    setSkipped(false)
    const t = setTimeout(onDone, zero ? (still ? 1400 : 3200) : 1350)
    return () => clearTimeout(t)
  }, [event, zero, still, onDone])

  const skip = () => {
    setSkipped(true)
    onDone()
  }

  return (
    <AnimatePresence>
      {event && !skipped && (
        zero ? (
          personalized
            ? <ZeroCinematic key={event.id} onSkip={skip} still={still} />
            : <ProZero key={event.id} onSkip={skip} still={still} />
        ) : (
          <OneToast key={event.id} done={event.done} left={event.left} onSkip={skip} still={still} stacked={undoVisible} personalized={personalized} />
        )
      )}
    </AnimatePresence>
  )
}

// Professional inbox-zero: no cinematic — a single Apple-Pay-style green check
// that draws itself, with a quiet line. Tap anywhere to dismiss.
function ProZero({ onSkip, still }) {
  return (
    <motion.div
      className="fixed inset-0 z-[70] grid place-items-center"
      style={{ background: 'color-mix(in srgb, var(--bg) 78%, transparent)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onSkip}
    >
      <motion.div
        className="flex flex-col items-center gap-3"
        initial={still ? { opacity: 0 } : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: [0.22, 0.61, 0.36, 1] }}
      >
        <svg width="72" height="72" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="11" fill="var(--success)" />
          <motion.path
            d="M6.5 12.4 L10.4 16 L17.4 8"
            fill="none" stroke="#06281c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
            initial={still ? { pathLength: 1 } : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: still ? 0 : 0.4, ease: 'easeOut', delay: still ? 0 : 0.1 }}
          />
        </svg>
        <div className="text-center">
          <div className="text-[17px] font-bold" style={{ color: 'var(--text)' }}>All clear for today</div>
          <div className="text-[13px]" style={{ color: 'var(--text-soft)' }}>Nothing due or overdue</div>
        </div>
      </motion.div>
    </motion.div>
  )
}
