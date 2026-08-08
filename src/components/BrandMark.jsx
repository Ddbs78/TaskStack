import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import wordmarkDark from '../assets/brand/wordmark-white.clean.svg?raw'
import wordmarkLight from '../assets/brand/wordmark-black.clean.svg?raw'
import mark from '../assets/brand/mark.clean.svg?raw'

// The real TaskStack artwork, inlined as raw SVG so the three cubes stay
// individually addressable — the tumble easter egg animates them directly.
//
// The cube mark itself has no outline to recolor, so it is a SINGLE file used
// identically in both themes — the only thing that changes with theme is the
// wordmark's text colour (still baked into two exported files, since the
// colour is fill, not stroke, and swapping the whole file is simplest).
export default function BrandMark({
  variant = 'wordmark',   // 'wordmark' | 'mark'
  height = 30,
  tumbling = false,
  className = '',
  style,
}) {
  const prefersReduced = useReducedMotion()
  const hostRef = useRef(null)
  const [dark, setDark] = useState(
    () => (document.documentElement.getAttribute('data-theme') || 'dark') === 'dark'
  )

  // the wordmark's text fill still swaps with theme; the mark never does
  useEffect(() => {
    if (variant !== 'wordmark') return
    const el = document.documentElement
    const read = () => setDark((el.getAttribute('data-theme') || 'dark') === 'dark')
    read()
    const mo = new MutationObserver(read)
    mo.observe(el, { attributes: true, attributeFilter: ['data-theme'] })
    return () => mo.disconnect()
  }, [variant])

  const svg = variant === 'mark' ? mark : dark ? wordmarkDark : wordmarkLight

  // The exported viewBox has huge empty margins (content is ~68%×60% of it,
  // offset from the origin), so a given `height` renders the artwork ~40%
  // smaller than the box implies. Tighten the viewBox to the real content
  // bounds (measured at rest) plus padding for the tumble, so `height` maps to
  // the visible mark. Runs on mount and on theme/variant swap.
  useEffect(() => {
    const el = hostRef.current?.querySelector('svg')
    if (!el) return
    try {
      const b = el.getBBox()
      if (!b.width || !b.height) return
      // Minimal padding: the svg overflows visible (see index.css) so a tumbling
      // cube never clips even against a tight box — this lets `height` map to the
      // real artwork instead of the exported margins.
      const p = 6
      el.setAttribute('viewBox', `${b.x - p} ${b.y - p} ${b.width + p * 2} ${b.height + p * 2}`)
    } catch {}
  }, [svg])

  // Each cube's three faces are pre-grouped under class="cube" (see
  // src/assets/brand/README.md — the raw Illustrator export left all 9 face
  // polygons flat, so the cleanup step clusters them by position and wraps
  // each triplet). Tumble each group independently.
  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const cubes = [...host.querySelectorAll('.cube')]
    cubes.forEach((g, i) => {
      // rotate about each cube's own centre
      const b = g.getBBox()
      g.style.transformOrigin = `${b.x + b.width / 2}px ${b.y + b.height / 2}px`
      g.style.transformBox = 'view-box'
      g.style.transition = prefersReduced
        ? 'none'
        : `transform .85s cubic-bezier(.2,1.5,.35,1) ${i * 55}ms`
      g.style.transform =
        tumbling && !prefersReduced
          ? `rotate(${[190, -170, 205][i]}deg) translate(${[8, -9, 6][i]}px, -12px)`
          : 'rotate(0deg)'
    })
  }, [tumbling, prefersReduced, svg])

  return (
    <span
      ref={hostRef}
      className={`brandmark inline-block ${className}`}
      style={{ height, ...style }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
