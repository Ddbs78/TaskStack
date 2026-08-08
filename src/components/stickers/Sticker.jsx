import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { PaperNoteStack } from './art'

// Motion wrapper shared by every sticker. The art is dumb SVG; all the life
// lives here so the characters move as one family.
//
// When motion is calmed (OS preference OR Settings → Reduce motion) the sticker
// still sits at its rest angle — it just stops moving. It never disappears,
// because the character IS the affordance.
//
// MODE FORK — the one the mode contract explicitly allows. Professional has no
// sticker characters, and the capped-overdue overflow is genuinely different
// CONTENT there (a stack of paper notes), not the same content restyled. Doing
// the swap here means every call site stays identical: Timeline, Week and Month
// all just render <Sticker> and get whichever affordance the mode calls for.
//
//   `paper` — the overflow count. Present = this sticker is a capped pile, so
//   professional renders the note stack. Absent (e.g. Month's empty state) =
//   decorative, so professional renders nothing at all.
export default function Sticker({
  Art,
  rest = 0,
  size,
  calm = false,
  onClick,
  title,
  children,
  className = '',
  style,
  personalized = true,
  paper = null,
  paperLabel,
  paperWidth = 128,
  paperHeight = 40,
}) {
  const prefersReduced = useReducedMotion()
  const still = calm || prefersReduced
  const [hovered, setHovered] = useState(false)

  if (!personalized) {
    if (paper == null) return null
    return (
      <PaperNoteStack
        count={paper}
        label={paperLabel}
        calm={still}
        width={paperWidth}
        height={paperHeight}
        onClick={onClick}
        title={title}
      />
    )
  }

  const variants = still
    ? {
        initial: { opacity: 0, rotate: rest },
        animate: { opacity: 1, rotate: rest, transition: { duration: 0.18 } },
        exit: { opacity: 0, transition: { duration: 0.15 } },
      }
    : {
        // squash-and-stretch pop, counter-rotating into the rest angle.
        // NOTE: a keyframe ARRAY cannot run on `type: 'spring'` — Framer stalls
        // mid-flight if you try. Scale gets an explicit tween; rotate gets the spring.
        initial: { opacity: 0, scale: 0, rotate: rest - 18 },
        animate: {
          opacity: 1,
          scale: [0, 1.15, 0.95, 1],
          rotate: rest,
          transition: {
            scale: { duration: 0.5, times: [0, 0.45, 0.75, 1], ease: 'easeOut' },
            rotate: { type: 'spring', stiffness: 420, damping: 18, mass: 0.8 },
            opacity: { duration: 0.2 },
          },
        },
        // peels off toward the top-right when the pile clears
        exit: {
          opacity: 0,
          scale: 0.85,
          rotate: rest + 18,
          x: 26,
          y: -18,
          transition: { duration: 0.42, ease: [0.4, 0, 0.2, 1] },
        },
      }

  const Wrapper = onClick ? motion.button : motion.div

  return (
    <Wrapper
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      onClick={onClick}
      title={title}
      aria-label={title}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={still ? undefined : { scale: 1.04, rotate: rest + 5 }}
      whileTap={still ? undefined : { scale: 0.94, rotate: rest - 3 }}
      className={`inline-flex select-none items-center gap-2 ${className}`}
      style={{ transformOrigin: 'center bottom', ...style }}
    >
      {/* barely-there breathing so it reads as alive, not stamped on */}
      <motion.span
        className="relative inline-flex"
        animate={still ? undefined : { rotate: [0, 1.5, 0, -1.5, 0] }}
        transition={still ? undefined : { duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* #3 washi tape — only on the capped pile, so the character reads as
            taped to the timeline rather than floating over it. */}
        {paper != null && <span className="washi" aria-hidden="true" />}
        <Art size={size} hovered={hovered} />
      </motion.span>
      {children}
    </Wrapper>
  )
}
