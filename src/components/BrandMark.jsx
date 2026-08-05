import { motion, useReducedMotion } from 'framer-motion'

// The StackTask mark: three tumbling isometric boxes — one coral, two blue.
//
// Inline SVG rather than a static asset so a SINGLE component serves both
// themes (the outline reads from --brand-ink) and so each cube can animate
// independently. This is the motion language the stickers borrow from.

// one cube drawn on its own centre: top face, then left and right faces
function Cube({ fill }) {
  return (
    <>
      <path d="M0 -52 L52 -26 L0 0 L-52 -26 Z" fill={fill} stroke="var(--brand-ink)" strokeWidth="10" strokeLinejoin="round" />
      <path d="M-52 -26 L0 0 L0 52 L-52 26 Z" fill={fill} stroke="var(--brand-ink)" strokeWidth="10" strokeLinejoin="round" />
      <path d="M52 -26 L52 26 L0 52 L0 0 Z" fill={fill} stroke="var(--brand-ink)" strokeWidth="10" strokeLinejoin="round" />
    </>
  )
}

const CUBES = [
  { x: 150, y: 66, s: 0.72, fill: 'var(--coral)', rest: 6, spin: 172, drift: 9 },
  { x: 68, y: 132, s: 0.80, fill: 'var(--blue)', rest: -7, spin: -158, drift: -10 },
  { x: 108, y: 206, s: 0.74, fill: 'var(--blue)', rest: 5, spin: 196, drift: 7 },
]

export default function BrandMark({ size = 30, animate = true, tumbling = false, className = '', style }) {
  const prefersReduced = useReducedMotion()
  const still = prefersReduced || !animate

  return (
    <svg
      viewBox="0 0 230 280"
      width={size}
      height={size * (280 / 230)}
      className={className}
      style={style}
      role="img"
      aria-label="StackTask"
    >
      {CUBES.map((c, i) => (
        <motion.g
          key={i}
          // fill-box keeps each cube rotating about its OWN centre rather than
          // the shared viewBox origin
          style={{ transformBox: 'fill-box', transformOrigin: 'center', originX: '50%', originY: '50%' }}
          initial={false}
          animate={
            still
              ? { rotate: c.rest, x: 0, y: 0 }
              : tumbling
              ? { rotate: c.rest + c.spin, x: c.drift, y: -12 }
              : { rotate: c.rest, x: 0, y: 0 }
          }
          transition={
            still
              ? { duration: 0 }
              : { type: 'spring', stiffness: 210, damping: 13, mass: 0.9, delay: i * 0.045 }
          }
        >
          <g transform={`translate(${c.x} ${c.y}) scale(${c.s})`}>
            <Cube fill={c.fill} />
          </g>
        </motion.g>
      ))}
    </svg>
  )
}
