// Target resolution + scroll settling for the walkthrough's spotlight steps.
//
// Everything here is deliberately imperative and DOM-level: the ring tracks a
// LIVE element, so it must never round-trip through React state per the
// render-loop rule (CLAUDE.md §5). React only ever learns "a target resolved" /
// "a target was lost" — never a per-frame position.
//
// This module also owns the mitigations the hybrid approach costs us:
//   · scroll a target into view and wait for the scroll to SETTLE before ringing
//   · open a closed menu to reach the item inside it, and survive it closing
//   · give every target an ordered list of resolvers plus an absent-target null,
//     so a concurrent edit to Timeline/InputBar degrades to a card, never to a
//     ring pointing at nothing.

export const DEMO_FLAG = '__introDemo'

// --- geometry --------------------------------------------------------------

export function padRect(r, px, py = px) {
  return {
    left: r.left - px,
    top: r.top - py,
    width: r.width + px * 2,
    height: r.height + py * 2,
  }
}

function unionRects(list) {
  const left = Math.min(...list.map((r) => r.left))
  const top = Math.min(...list.map((r) => r.top))
  const right = Math.max(...list.map((r) => r.right))
  const bottom = Math.max(...list.map((r) => r.bottom))
  return { left, top, right, bottom, width: right - left, height: bottom - top }
}

// Keep a ring inside the scroller that owns it, so it can never spill past the
// edge of a column the user cannot see the rest of.
function clampTo(r, container) {
  const c = container.getBoundingClientRect()
  const left = Math.max(r.left, c.left)
  const top = Math.max(r.top, c.top)
  const right = Math.min(r.left + r.width, c.right)
  const bottom = Math.min(r.top + r.height, c.bottom)
  return { left, top, width: Math.max(0, right - left), height: Math.max(0, bottom - top) }
}

// A ring bigger than this share of the viewport is a modal wearing a ring —
// the step falls back to a plain card instead. This is the 375px escape hatch.
export const MAX_RING_SHARE = 0.6

export function ringIsTooBig(rect) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  if (!vw || !vh) return false
  return (rect.width * rect.height) / (vw * vh) > MAX_RING_SHARE
}

// --- scroll settling -------------------------------------------------------

// Scroll `node` into view, then resolve only once its box has stopped moving.
// A ring drawn mid-scroll lands on empty canvas, which is the single most
// obvious way this pattern looks broken.
export function scrollIntoViewAndSettle(node, { timeout = 1500 } = {}) {
  return new Promise((resolve) => {
    if (!node || !node.isConnected) return resolve(false)
    try {
      node.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' })
    } catch {
      node.scrollIntoView()
    }
    const t0 = performance.now()
    let last = null
    let still = 0
    let raf = 0
    let done = false
    const finish = (v) => {
      if (done) return
      done = true
      cancelAnimationFrame(raf)
      clearTimeout(bail)
      resolve(v)
    }
    // rAF stops in a backgrounded tab, which would strand the whole step on
    // "resolving" forever. A timer the browser still services is the floor.
    const bail = setTimeout(() => finish(true), timeout)
    const tick = () => {
      if (!node.isConnected) return finish(false)
      const r = node.getBoundingClientRect()
      const same =
        last &&
        Math.abs(r.left - last.left) < 0.5 &&
        Math.abs(r.top - last.top) < 0.5 &&
        Math.abs(r.width - last.width) < 0.5
      still = same ? still + 1 : 0
      last = r
      // five identical frames, or we give up and ring wherever it ended up
      if (still >= 5 || performance.now() - t0 > timeout) return finish(true)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
  })
}

// Which way the target sits relative to the viewport centre, for the travelling
// chevron cue. Null once it is already comfortably on screen.
export function travelDirection(node) {
  if (!node || !node.isConnected) return null
  const r = node.getBoundingClientRect()
  const offY = r.bottom < 0 ? 'up' : r.top > window.innerHeight ? 'down' : null
  const offX = r.right < 0 ? 'left' : r.left > window.innerWidth ? 'right' : null
  return offY || offX
}

// Two frames, or 120ms — whichever lands first. Same reason as above: a
// backgrounded tab must not be able to wedge the sequence.
const raf2 = () =>
  new Promise((r) => {
    let done = false
    const go = () => { if (!done) { done = true; r() } }
    requestAnimationFrame(() => requestAnimationFrame(go))
    setTimeout(go, 120)
  })

// --- target resolution -----------------------------------------------------

const app = () => document.querySelector('main') || document.body

// Deepest text-bearing node matching any phrase, climbed to a sane block.
function blockWithText(patterns) {
  const host = app()
  const hit = [...host.querySelectorAll('span, button, div, p')].find(
    (el) => el.childElementCount === 0 && patterns.some((p) => p.test(el.textContent || ''))
  )
  if (!hit) return null
  // climb to the wrapper that holds the whole overflow affordance, not one line
  let block = hit
  for (let i = 0; i < 3 && block.parentElement && block.parentElement !== host; i++) {
    const p = block.parentElement
    if (p.getBoundingClientRect().height > 220) break
    block = p
  }
  return block
}

// The three visible overdue bars, found by the demo titles we seeded. Used when
// the overflow affordance itself is missing (fewer than four overdue).
function barsByTitle(titles) {
  const nodes = [...app().querySelectorAll('.inked-sm')].filter((el) =>
    titles.some((t) => (el.textContent || '').includes(t))
  )
  return nodes.length ? nodes : null
}

// The view menu behind the "···" button. Its buttons are direct children of the
// popover, so the "3-Day" entry identifies the panel without a fragile class.
function viewMenuPanel() {
  const btn = [...document.querySelectorAll('button')].find((b) =>
    /^3-Day/.test((b.textContent || '').trim())
  )
  return btn?.parentElement || null
}

function openViewMenu() {
  if (viewMenuPanel()) return true
  const more = document.querySelector('button[title="More"]')
  if (!more) return false
  more.click()
  return true
}

function closeViewMenu() {
  if (!viewMenuPanel()) return
  document.querySelector('button[title="More"]')?.click()
}

// Each spec: how to make the target reachable, how to find it, and how to know
// it is still there. `resolve` returns { node, getRect } or null.
export const TARGETS = {
  pile: {
    // The lesson is "three show, the rest wait behind a counter", so the ring
    // has to hold BOTH — the capped bars and the overflow affordance. Ringing
    // the counter alone puts a box round mostly empty canvas.
    async resolve(ctx) {
      const overflow = blockWithText([/still lurking/i, /more overdue/i, /\bbump\b/i])
      const col = overflow?.closest('.slot-fade')
      if (overflow && col) {
        const parts = [...col.querySelectorAll('.inked-sm')].slice(0, 3).concat(overflow)
        return {
          node: parts[0],
          getRect: () => {
            const live = parts.filter((p) => p.isConnected).map((p) => p.getBoundingClientRect())
            if (!live.length) return { left: 0, top: 0, width: 0, height: 0 }
            return clampTo(padRect(unionRects(live), 8, 6), col)
          },
        }
      }
      if (overflow) {
        return { node: overflow, getRect: () => padRect(overflow.getBoundingClientRect(), 10, 8) }
      }
      // fewer than four overdue: no counter exists, so ring the bars themselves
      const bars = barsByTitle(ctx.overdueTitles || [])
      if (bars) {
        return {
          node: bars[0],
          getRect: () =>
            padRect(unionRects(bars.filter((b) => b.isConnected).map((b) => b.getBoundingClientRect())), 8, 6),
        }
      }
      return null
    },
  },

  nowline: {
    async resolve() {
      const el = document.querySelector('.nowline-travel')
      if (!el) return null
      // the line itself is hairline-thin; ring a readable column around it
      return {
        node: el,
        getRect: () => {
          // the line spans the whole scroll content, which is taller than the
          // viewport — clamp so the ring closes instead of running off-screen
          const r = el.getBoundingClientRect()
          const cx = r.left + r.width / 2
          const top = Math.max(r.top + 4, 8)
          const bottom = Math.min(r.bottom - 4, window.innerHeight - 8)
          return { left: cx - 30, top, width: 60, height: Math.max(80, bottom - top) }
        },
      }
    },
  },

  input: {
    async resolve() {
      const el = document.querySelector('.js-chatbar')
      if (!el) return null
      return { node: el, getRect: () => padRect(el.getBoundingClientRect(), 8) }
    },
  },

  views: {
    // The fragile one: we open the menu ourselves, so we also have to notice it
    // going away and put it back — or give up and become a card.
    async prepare() {
      if (!openViewMenu()) return false
      await raf2()
      await raf2()
      return !!viewMenuPanel()
    },
    teardown() {
      closeViewMenu()
    },
    async resolve() {
      const panel = viewMenuPanel()
      if (!panel) return null
      return { node: panel, getRect: () => padRect(panel.getBoundingClientRect(), 8) }
    },
  },
}
