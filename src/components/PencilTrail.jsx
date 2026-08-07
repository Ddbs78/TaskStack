import { useEffect, useRef } from 'react'

// The pencil's graphite trail.
//
// A native `cursor:` image is a static bitmap — it cannot leave marks or react
// to movement. So the pencil glyph itself stays a real CSS cursor (zero lag,
// tilts on :active via a second image) and the *trail* is drawn here on a
// canvas that sits above the UI but ignores pointer events entirely.
//
// It deliberately draws NOTHING while you're over a control with its own
// cursor — resize edges, the move border, text fields — so the drawing
// metaphor never competes with an affordance that's telling you what it does.
const SKIP = '.cursor-ew, .cursor-ns, .cursor-move-4, .cursor-moving, input, textarea, [contenteditable]'

export default function PencilTrail({ enabled = true }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!enabled) return
    // pointer-fine only: a trail makes no sense on touch, and on coarse
    // pointers there's no hover state to trail behind.
    if (!window.matchMedia('(pointer: fine)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let dpr = Math.min(2, window.devicePixelRatio || 1)

    const size = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1)
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = window.innerWidth + 'px'
      canvas.style.height = window.innerHeight + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    size()
    window.addEventListener('resize', size)

    // points carry their own life so the stroke fades from the tail forward
    let pts = []
    let last = null
    let suppressed = false
    let raf = 0

    const onMove = (e) => {
      const el = document.elementFromPoint(e.clientX, e.clientY)
      suppressed = !el || !!el.closest?.(SKIP) || !el.closest?.('.pencil')
      if (suppressed) { last = null; return }
      const p = { x: e.clientX, y: e.clientY, life: 1 }
      // only record real movement, so resting the pointer doesn't pile up dots
      if (!last || Math.hypot(p.x - last.x, p.y - last.y) > 2.5) {
        pts.push(p)
        last = p
        if (pts.length > 46) pts.shift()
      }
    }
    window.addEventListener('pointermove', onMove, { passive: true })

    const ink = () =>
      getComputedStyle(document.documentElement).getPropertyValue('--pencil-ink').trim() || '#F5C542'

    const loop = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      const colour = ink()
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i]
        const t = i / pts.length          // newer segments are stronger
        ctx.globalAlpha = Math.max(0, a.life) * t * 0.5
        ctx.strokeStyle = colour
        ctx.lineWidth = 1.1 + t * 2.2
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()
      }
      ctx.globalAlpha = 1
      // decay + drop dead points
      for (const p of pts) p.life -= 0.045
      if (pts.length && pts[0].life <= 0) pts.shift()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', size)
      window.removeEventListener('pointermove', onMove)
    }
  }, [enabled])

  if (!enabled) return null
  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[70]"
      style={{ mixBlendMode: 'var(--pencil-blend, screen)' }}
    />
  )
}
