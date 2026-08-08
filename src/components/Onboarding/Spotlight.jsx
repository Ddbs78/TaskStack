import { useEffect, useRef } from 'react'
import Icon from '../Icon'

// The ring. One fixed element, positioned by a rAF loop writing transform /
// width / height DIRECTLY — never through setState, and with no CSS transition
// on its geometry (a transition on a measured, layout-driven property is what
// turned the now-line into a 30-second crawl, CLAUDE.md §5).
//
// The step-to-step move is tweened by us inside the same loop, so it is smooth
// without ever handing a layout value to the transition engine.
export default function Spotlight({ resolved, calm, onLost }) {
  const ringRef = useRef(null)
  const prevRect = useRef(null)
  const lostRef = useRef(onLost)
  lostRef.current = onLost

  useEffect(() => {
    const ring = ringRef.current
    if (!resolved || !ring) return
    let raf = 0
    let missed = 0
    const t0 = performance.now()
    const dur = calm ? 0 : 260
    const from = prevRect.current

    const write = (r) => {
      ring.style.transform = `translate3d(${Math.round(r.left)}px, ${Math.round(r.top)}px, 0)`
      ring.style.width = `${Math.max(0, Math.round(r.width))}px`
      ring.style.height = `${Math.max(0, Math.round(r.height))}px`
    }

    const loop = () => {
      raf = requestAnimationFrame(loop)
      const alive = resolved.node?.isConnected
      const to = alive ? resolved.getRect() : null
      if (!to || !to.width) {
        // a few bad frames are normal mid-layout; a sustained absence is a real
        // orphan (the user's menu closed, the bar minimised, a view switched)
        if (++missed > 8) {
          cancelAnimationFrame(raf)
          lostRef.current?.()
        }
        return
      }
      missed = 0
      const k = from && dur ? Math.min(1, (performance.now() - t0) / dur) : 1
      if (k < 1) {
        const e = 1 - Math.pow(1 - k, 3)
        write({
          left: from.left + (to.left - from.left) * e,
          top: from.top + (to.top - from.top) * e,
          width: from.width + (to.width - from.width) * e,
          height: from.height + (to.height - from.height) * e,
        })
      } else {
        write(to)
      }
      prevRect.current = to
    }
    // paint once synchronously so the ring is never a 0×0 box at the origin for
    // a frame — and so it is correct even before rAF resumes in a hidden tab
    const first = resolved.node?.isConnected ? resolved.getRect() : null
    if (first?.width) write(from ? { ...first, ...(dur ? from : first) } : first)
    loop()
    return () => cancelAnimationFrame(raf)
  }, [resolved, calm])

  return (
    <div
      ref={ringRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: 0,
        height: 0,
        borderRadius: 12,
        pointerEvents: 'none',
        zIndex: 91,
        willChange: 'transform, width, height',
        boxShadow:
          '0 0 0 2px var(--blue-strong), 0 0 0 6px color-mix(in srgb, var(--blue-strong) 22%, transparent), 0 0 0 100vmax rgba(12,12,16,0.66)',
      }}
    />
  )
}

// Shown only while a target is being scrolled into view, so the eye follows the
// travel instead of losing the thread.
export function TravelCue({ direction }) {
  if (!direction) return null
  const rot = { up: -90, down: 90, left: 180, right: 0 }[direction] ?? 90
  return (
    <div
      style={{
        position: 'fixed',
        left: '50%',
        top: 'max(18px, env(safe-area-inset-top))',
        transform: 'translateX(-50%)',
        zIndex: 93,
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        padding: '7px 14px',
        borderRadius: 999,
        background: 'var(--surface)',
        border: '1px solid var(--hairline)',
        boxShadow: '0 10px 30px -12px rgba(0,0,0,0.5)',
        font: '600 12px/1 var(--font-sans)',
        color: 'var(--text-soft)',
        pointerEvents: 'none',
        maxWidth: 'calc(100vw - 32px)',
      }}
    >
      <span style={{ display: 'inline-flex', color: 'var(--blue-strong)', transform: `rotate(${rot}deg)` }}>
        <Icon name="chevronRight" size={15} stroke={2.4} />
      </span>
      Bringing it into view
    </div>
  )
}
