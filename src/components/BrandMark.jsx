import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import wordmarkDark from '../assets/brand/wordmark-white.clean.svg?raw'
import wordmarkLight from '../assets/brand/wordmark-black.clean.svg?raw'
import markDark from '../assets/brand/favicon-white.clean.svg?raw'
import markLight from '../assets/brand/favicon-black.clean.svg?raw'

// The real TaskStack artwork, inlined as raw SVG so the three cubes stay
// individually addressable — the tumble easter egg animates them directly.
//
// Two source files per lockup (black-outline for light UI, white-outline for
// dark) because the outline colour is baked into the exported art; we swap the
// whole file on theme rather than trying to recolor strokes.
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

  // follow the app's theme attribute
  useEffect(() => {
    const el = document.documentElement
    const read = () => setDark((el.getAttribute('data-theme') || 'dark') === 'dark')
    read()
    const mo = new MutationObserver(read)
    mo.observe(el, { attributes: true, attributeFilter: ['data-theme'] })
    return () => mo.disconnect()
  }, [])

  const svg =
    variant === 'mark' ? (dark ? markDark : markLight) : dark ? wordmarkDark : wordmarkLight

  // The exported art groups each cube separately inside Layer_6, so the first
  // three <g> children of that layer ARE the cubes. Tumble them in place.
  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const layer = host.querySelector('#Layer_6') || host.querySelector('svg > g')
    if (!layer) return
    const cubes = [...layer.children].filter((n) => n.tagName === 'g').slice(0, 3)
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
