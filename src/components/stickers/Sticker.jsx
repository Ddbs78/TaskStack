import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

// Motion wrapper shared by every sticker. The art is dumb SVG; all the life
// lives here so the characters move as one family.
//
// When motion is calmed (OS preference OR Settings → Reduce motion) the sticker
// still sits at its rest angle — it just stops moving. It never disappears,
// because the character IS the affordance.
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
}) {
  const prefersReduced = useReducedMotion()
  const still = calm || prefersReduced
  const [hovered, setHovered] = useState(false)

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
        className="inline-flex"
        animate={still ? undefined : { rotate: [0, 1.5, 0, -1.5, 0] }}
        transition={still ? undefined : { duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Art size={size} hovered={hovered} />
      </motion.span>
      {children}
    </Wrapper>
  )
}
