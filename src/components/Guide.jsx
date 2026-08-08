import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import Icon from './Icon'
import BrandMark from './BrandMark'
import Sticker from './stickers/Sticker'
import { SleepyBlob, Snail, CatLoaf, Ghost, PartyBean, HappyStar } from './stickers/art'
import { ScrawlArrow } from './Doodle'

// The interactive guide — one component tree, two personalities.
//
// PERSONALIZED: a scrolly journey. A dashed path runs down the left and the
// real BrandMark rolls along it as you scroll, settling on a checkpoint at each
// chapter. Every chapter shows a LIVE miniature of the real mechanic (never a
// screenshot), so the guide can't drift out of date.
//
// PROFESSIONAL (default): the same chapters and the same miniatures, laid out
// as product documentation — a sticky numbered contents rail, hairline panels,
// uniform type. Not the personalized guide with the decoration deleted: a
// different, deliberate layout for the same content.
//
// Mode comes from `data-mode` on <html> (written by state/store.js), so this
// file never needs the settings object threaded through App.

// ---- cube-on-path geometry --------------------------------------------------
// The rail is drawn 1 SVG user unit = 1 CSS px (width/height match the viewBox),
// so getPointAtLength() output can be written straight into a px transform.
const RAIL_W = 60
const MARK_H = 20
const MARK_W = MARK_H * (1084.04 / 618.97) // the mark's true aspect, from mark.clean.svg
const CHAPTER_OFFSET = 40 // matches the scroll-to offset used by the chapter jumps

// A smooth alternating S, with a vertical tangent at every node so the mark
// always leaves and arrives upright.
function railD(h) {
  const cx = RAIL_W / 2
  const a = RAIL_W / 2 - MARK_W / 2 - 1 // widest wander that keeps the mark inside the rail
  const top = MARK_H / 2 + 2
  const bot = Math.max(top + 40, h - MARK_H / 2 - 2)
  const span = bot - top
  const N = 3
  let d = `M${cx} ${top}`
  for (let i = 0; i < N; i++) {
    const y0 = top + (span * i) / N
    const y1 = top + (span * (i + 1)) / N
    const s = i % 2 === 0 ? -1 : 1
    d += ` C ${cx + s * a} ${y0 + (y1 - y0) * 0.35}, ${cx + s * a} ${y0 + (y1 - y0) * 0.65}, ${cx} ${y1}`
  }
  return d
}

// Dwell, then a decelerating arrival — the mark visibly settles on a checkpoint
// rather than sliding through it at a constant rate.
function settle(t) {
  const u = Math.min(1, Math.max(0, (t - 0.1) / 0.78))
  return u * u * (3 - 2 * u)
}

// ---- little hand-drawn brain, for the psychology chapters (personalized) ----
function Brain({ size = 64, pulse = false }) {
  return (
    <svg viewBox="0 0 80 76" width={size} height={size * 0.95} aria-hidden="true">
      <g>
        <path
          d="M30 8c-8 0-14 5-14 11-6 2-9 8-6 13-4 4-3 12 3 14 0 7 6 11 12 9 2 4 8 6 12 2V8z"
          fill="#F58FA8" stroke="#3B2630" strokeWidth="2.6" strokeLinejoin="round"
        />
        <path
          d="M50 8c8 0 14 5 14 11 6 2 9 8 6 13 4 4 3 12-3 14 0 7-6 11-12 9-2 4-8 6-12 2V8z"
          fill="#F58FA8" stroke="#3B2630" strokeWidth="2.6" strokeLinejoin="round"
        />
        <path d="M40 14v48" stroke="#3B2630" strokeWidth="2.4" />
        <path d="M26 24c5 2 6 8 2 11M54 24c-5 2-6 8-2 11M28 44c6 0 8 5 6 9M52 44c-6 0-8 5-6 9"
              fill="none" stroke="#3B2630" strokeWidth="2" strokeLinecap="round" opacity=".75" />
      </g>
      {pulse && (
        <motion.circle
          cx="40" cy="38" r="30" fill="none" stroke="#F58FA8" strokeWidth="2"
          initial={{ opacity: 0.6, scale: 0.8 }}
          animate={{ opacity: 0, scale: 1.5 }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
          style={{ transformOrigin: '40px 38px' }}
        />
      )}
    </svg>
  )
}

// ---- professional stand-ins for the two craft-layer figures -----------------
// The capped-overdue overflow is a literal stack of paper notes, not a
// character (CLAUDE.md §1). Leaf node — safe to branch on.
function NoteStack({ size = 34 }) {
  return (
    <svg width={size} height={size * 0.82} viewBox="0 0 34 28" fill="none" aria-hidden="true">
      <g stroke="var(--hairline)" strokeWidth="1.2">
        <rect x="3.5" y="14.5" width="27" height="10" rx="2" fill="var(--surface-2)" transform="rotate(-3 17 19)" />
        <rect x="4.5" y="9.5" width="25" height="10" rx="2" fill="var(--surface)" transform="rotate(2 17 14)" />
        <rect x="4" y="4" width="26" height="11" rx="2" fill="var(--surface)" />
      </g>
      <path d="M8.5 8h13M8.5 11.4h8" stroke="var(--text-faint)" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

// The approved quiet reward: an Apple-Pay-style circle + check drawing itself
// in. CSS stroke-dashoffset, not Framer — correct on first paint.
function ProCheck({ show }) {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
      <circle
        cx="13" cy="13" r="11" stroke="var(--success)" strokeWidth="2"
        style={{
          strokeDasharray: 69.2,
          strokeDashoffset: show ? 0 : 69.2,
          transform: 'rotate(-90deg)', transformOrigin: '13px 13px',
          transition: 'stroke-dashoffset .34s cubic-bezier(.22,.61,.36,1)',
        }}
      />
      <path
        d="M7.6 13.3l3.7 3.7 7.1-7.4" stroke="var(--success)" strokeWidth="2.2"
        strokeLinecap="round" strokeLinejoin="round"
        style={{
          strokeDasharray: 16,
          strokeDashoffset: show ? 0 : 16,
          transition: 'stroke-dashoffset .24s ease-out .24s',
        }}
      />
    </svg>
  )
}

// ---- live miniatures --------------------------------------------------------
// Every mini takes `craft` and `motion` so the same demo serves both modes.
// These are leaf nodes; the branching stops here.
const panel = (craft) => ({
  background: 'var(--bg-soft)',
  border: craft ? '2px solid var(--ink)' : '1px solid var(--hairline)',
  borderRadius: craft ? 10 : 8,
})

function MiniTimeline({ play, craft, motionOn }) {
  return (
    <div
      className="relative h-[68px] overflow-hidden"
      style={{
        ...panel(craft),
        // gridlines are a craft-layer signature — professional refuses them
        backgroundImage: craft
          ? 'repeating-linear-gradient(to right, var(--grid-line) 0, var(--grid-line) 1px, transparent 1px, transparent 12.5%)'
          : 'none',
      }}
    >
      <div
        className="absolute left-[6%] top-[10px]"
        style={{ width: '30%', height: craft ? 22 : 18, borderRadius: craft ? 6 : 4, background: 'var(--task-blue-bg)', border: craft ? '2px solid var(--ink)' : 'none' }}
      />
      <div
        className="absolute left-[46%] top-[38px]"
        style={{ width: '24%', height: craft ? 22 : 18, borderRadius: craft ? 6 : 4, background: 'var(--task-blue-bg)', border: craft ? '2px solid var(--ink)' : 'none' }}
      />
      <motion.div
        className="absolute top-0 bottom-0"
        style={{ width: craft ? 2 : 1.5, background: 'var(--now-line)' }}
        initial={{ left: '8%' }}
        animate={play && motionOn ? { left: ['8%', '88%'] } : { left: '45%' }}
        transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  )
}

function MiniPile({ play, craft, motionOn }) {
  const enter = craft
    ? { type: 'spring', stiffness: 420, damping: 26 }
    : { duration: 0.22, ease: [0.22, 0.61, 0.36, 1] }
  return (
    <div className="flex flex-col gap-1.5">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          style={{
            height: craft ? 19 : 16,
            borderRadius: craft ? 7 : 4,
            background: craft ? 'var(--task-coral-bg)' : 'var(--task-coral-tint-bg)',
            border: craft ? '2px solid var(--ink)' : '1px solid var(--task-coral-tint-border)',
            borderLeft: craft ? '2px solid var(--ink)' : '3px solid var(--coral)',
          }}
          initial={{ opacity: 0, x: -14 }}
          animate={play ? { opacity: 1, x: 0 } : { opacity: 0.35, x: craft ? -6 : 0 }}
          transition={{ ...enter, delay: motionOn ? i * 0.12 : 0 }}
        />
      ))}
      <motion.div
        className="flex items-center gap-2 pt-0.5"
        initial={{ opacity: 0, scale: craft ? 0.6 : 1 }}
        animate={play ? { opacity: 1, scale: 1 } : { opacity: 0, scale: craft ? 0.6 : 1 }}
        transition={{ ...enter, delay: motionOn ? 0.5 : 0 }}
      >
        {craft ? <SleepyBlob size={40} /> : <NoteStack size={34} />}
        <span
          className={craft ? 'text-[11px] font-bold' : 'text-[12px]'}
          style={{ color: 'var(--text-soft)' }}
        >
          {craft ? '7 still lurking' : '7 more overdue'}
        </span>
      </motion.div>
    </div>
  )
}

function MiniUrgency({ play, craft, motionOn }) {
  // the ramp is genuine signal (level), not flavour — it survives both modes
  const RAMP = ['#F8D3BE', '#F6C6A8', '#F4B492', '#F4A47B', '#F4936B', '#F4845F', '#EE7550', '#E56742', '#DA5732', '#CC4A28']
  const H = [10, 11, 12, 14, 16, 18, 20, 22, 24, 26]
  const enter = craft
    ? { type: 'spring', stiffness: 460, damping: 24 }
    : { duration: 0.24, ease: [0.22, 0.61, 0.36, 1] }
  return (
    <div className="flex items-end gap-2">
      <div className="flex flex-1 items-end gap-1" style={{ height: 28 }}>
        {H.map((h, i) => (
          <motion.span
            key={i}
            className="flex-1"
            style={{ background: RAMP[i], borderRadius: craft ? 4 : 2 }}
            initial={{ height: 6, opacity: 0.18 }}
            animate={play ? { height: h, opacity: i < 7 ? 1 : 0.22 } : { height: 6, opacity: 0.18 }}
            transition={{ ...enter, delay: motionOn ? i * 0.045 : 0 }}
          />
        ))}
      </div>
      {/* colour plus text, always */}
      <span className="tabular text-[11px] font-semibold" style={{ color: 'var(--text-soft)' }}>7 / 10</span>
    </div>
  )
}

function MiniFinish({ play, craft, onPop }) {
  const [popped, setPopped] = useState(false)
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => { setPopped(true); onPop?.(); setTimeout(() => setPopped(false), 1600) }}
        className="flex items-center gap-2 px-3 py-2"
        style={
          craft
            ? { background: 'var(--task-blue-bg)', border: '2px solid var(--ink)', boxShadow: '2px 2.5px 0 var(--ink-shadow)', borderRadius: 10 }
            : { background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 8 }
        }
      >
        <span
          className="grid h-[15px] w-[15px] place-items-center rounded-full border-[1.5px]"
          style={{ borderColor: craft ? 'var(--task-blue-text)' : 'var(--text-faint)' }}
        >
          {popped && <span className="h-2 w-2 rounded-full" style={{ background: craft ? 'var(--task-blue-text)' : 'var(--success)' }} />}
        </span>
        <span
          className={craft ? 'text-[12px] font-bold' : 'text-[12px] font-medium'}
          style={{ color: craft ? 'var(--task-blue-text)' : 'var(--text)' }}
        >
          {craft ? 'tick me' : 'Mark done'}
        </span>
      </button>

      {craft ? (
        <AnimatePresence>
          {popped && (
            <motion.div
              initial={{ opacity: 0, scale: 0.4, y: 8 }}
              animate={{ opacity: 1, scale: [0.4, 1.15, 1], y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-1.5"
            >
              <PartyBean size={38} />
              <span className="text-[12px] font-bold" style={{ color: 'var(--text)' }}>1 down!</span>
            </motion.div>
          )}
        </AnimatePresence>
      ) : (
        // Professional keeps completion feedback — one quiet reward, never none.
        // No opacity transition on the wrapper: ProCheck hides itself with a
        // full stroke-dashoffset, so the resting state is correct on first
        // paint and can't get stranded mid-transition.
        <div className="flex items-center gap-2">
          <ProCheck show={popped} />
          <span className="text-[12px]" style={{ color: popped ? 'var(--text-soft)' : 'transparent' }}>Done</span>
        </div>
      )}
    </div>
  )
}

function MiniViews({ play, craft, motionOn }) {
  const enter = craft
    ? { type: 'spring', stiffness: 420, damping: 24 }
    : { duration: 0.22, ease: [0.22, 0.61, 0.36, 1] }
  return (
    <div className="flex items-center gap-2">
      {['3-day', 'Week', 'Month'].map((v, i) => (
        <motion.span
          key={v}
          className={craft ? 'px-2.5 py-1.5 text-[11px] font-bold' : 'px-2.5 py-1.5 text-[11px] font-medium'}
          style={{
            background: 'var(--surface-2)',
            border: craft ? '2px solid var(--ink)' : '1px solid var(--hairline)',
            borderRadius: craft ? 9 : 6,
            color: 'var(--text)',
          }}
          initial={{ opacity: 0, y: 8 }}
          animate={play ? { opacity: 1, y: 0 } : { opacity: 0.3, y: craft ? 4 : 0 }}
          transition={{ ...enter, delay: motionOn ? i * 0.12 : 0 }}
        >
          {v}
        </motion.span>
      ))}
      {craft ? (
        <ScrawlArrow width={54} />
      ) : (
        <span style={{ color: 'var(--text-faint)' }}><Icon name="chevronRight" size={16} /></span>
      )}
    </div>
  )
}

// The "right now" chapter's own demo: one task in focus, two choices, everything
// else dimmed — the actual mechanic, not the view switcher (which `views` shows).
function MiniRightNow({ play, craft, motionOn }) {
  const enter = craft
    ? { type: 'spring', stiffness: 420, damping: 22 }
    : { duration: 0.22, ease: [0.22, 0.61, 0.36, 1] }
  return (
    <div className="flex flex-col gap-2">
      {/* the one surfaced task */}
      <motion.div
        className="flex items-center gap-2 px-3 py-2"
        style={{
          background: 'var(--task-blue-bg)', color: 'var(--task-blue-text)',
          border: craft ? '2px solid var(--ink)' : '1px solid var(--hairline)',
          borderRadius: craft ? 12 : 8,
          boxShadow: craft ? '2px 2.5px 0 var(--ink-shadow)' : 'none',
        }}
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={play ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0.4, y: 4, scale: 1 }}
        transition={enter}
      >
        <span className="grid h-[15px] w-[15px] place-items-center rounded-full border-[1.5px]" style={{ borderColor: 'currentColor' }} />
        <span className="text-[12px] font-bold">Email the landlord</span>
      </motion.div>
      {/* the only two actions */}
      <div className="flex items-center gap-2">
        {['done', 'not this one'].map((a, i) => (
          <motion.span
            key={a}
            className="px-2.5 py-1 text-[11px] font-semibold"
            style={{
              background: i === 0 ? 'var(--success)' : 'var(--surface-2)',
              color: i === 0 ? '#06281c' : 'var(--text-soft)',
              border: craft ? '2px solid var(--ink)' : '1px solid var(--hairline)',
              borderRadius: craft ? 9 : 6,
            }}
            initial={{ opacity: 0, y: 6 }}
            animate={play ? { opacity: 1, y: 0 } : { opacity: 0.3, y: 0 }}
            transition={{ ...enter, delay: motionOn ? 0.1 + i * 0.1 : 0 }}
          >
            {a}
          </motion.span>
        ))}
      </div>
    </div>
  )
}

// ---- chapters ---------------------------------------------------------------
// One content model. `title`/`blurb` carry the personalized voice (gently
// teasing); `proTitle`/`proBlurb` the professional one (plain and calm).
// Neither is ever scolding. `why` — the ADHD reasoning — is shared: it is the
// reason the product exists and survives both modes verbatim.
const CHAPTERS = [
  {
    id: 'time', title: 'time is the spine', proTitle: 'Time is the spine', Art: Ghost,
    blurb: 'A red line walks across your day in real time. Tasks sit where they actually happen.',
    why: 'ADHD brains discount the future steeply — "not now" is nearly invisible. Making time a moving object you can watch attacks time blindness head-on.',
    Demo: MiniTimeline,
  },
  {
    id: 'pile', title: 'the pile has a lid', proTitle: 'Overdue is capped at three', Art: SleepyBlob,
    blurb: 'Only three overdue tasks show. A character holds the rest, and one tap bumps them to tomorrow.',
    proBlurb: 'Only three overdue tasks show. The rest are held on a stack, and one action moves them to tomorrow.',
    why: 'Unbounded visual debt causes task-initiation paralysis, not urgency. A little is salience; a lot is shutdown. This is the app’s founding assumption, corrected.',
    Demo: MiniPile,
  },
  {
    id: 'urgency', title: 'say what matters', proTitle: 'Rank once, decide later', Art: Snail,
    blurb: 'Rate a task 1–10. The bars deepen and grow, so you read the level before the number.',
    why: 'Deciding what to do first is itself executive work. Rating once, up front, means the app can answer "what now?" later instead of you.',
    Demo: MiniUrgency,
  },
  {
    id: 'now', title: 'right now', proTitle: 'One task at a time', Art: CatLoaf,
    blurb: 'One task. Two choices: done, or not this one. Everything else dims away.',
    why: 'The bottleneck is starting, and the load that blocks starting is choosing. Every extra control here would re-add the very thing it removes.',
    Demo: MiniRightNow,
  },
  {
    id: 'finish', title: 'finishing gets loud', proTitle: 'Finishing is acknowledged', Art: PartyBean,
    blurb: 'Tick the box — the real celebration fires, right here.',
    proBlurb: 'Mark a task done — the same completion feedback you get in the app fires right here.',
    why: 'If debt is the only thing with visual weight, the app only ever speaks when you’re behind. Finishing has to be the louder signal.',
    Demo: MiniFinish,
  },
  {
    id: 'views', title: 'three ways to look', proTitle: 'Three views', Art: HappyStar,
    blurb: 'Day, week and month drill into each other. Click a month cell to open that week; a week header to open that day.',
    why: 'Zooming out is how you notice a week is overloaded before it arrives — planning ahead is exactly what a short time-horizon makes hard.',
    Demo: MiniViews,
  },
]

export default function Guide({ open, onClose }) {
  const prefersReduced = useReducedMotion()
  const scrollRef = useRef(null)
  const [active, setActive] = useState(0)

  // Mode + the reduceMotion setting, read off the document rather than threaded
  // through props. store.js writes localStorage and THEN sets data-mode, so by
  // the time this observer fires the saved settings are already current — which
  // makes one observer enough to keep both values live.
  const [mode, setMode] = useState(
    () => document.documentElement.getAttribute('data-mode') || 'professional'
  )
  const [reduceMotionSetting, setReduceMotionSetting] = useState(false)
  useEffect(() => {
    const el = document.documentElement
    const read = () => {
      setMode(el.getAttribute('data-mode') || 'professional')
      try {
        setReduceMotionSetting(
          !!JSON.parse(localStorage.getItem('flow.settings.v1') || '{}').reduceMotion
        )
      } catch { /* corrupt settings — fall back to motion on */ }
    }
    read()
    const mo = new MutationObserver(read)
    mo.observe(el, { attributes: true, attributeFilter: ['data-mode', 'data-theme'] })
    return () => mo.disconnect()
  }, [])

  const craft = mode === 'personalized'
  const motionOn = !prefersReduced && !reduceMotionSetting
  // read inside the rAF without re-binding the scroll/resize listeners
  const motionOnRef = useRef(motionOn)
  motionOnRef.current = motionOn

  // ---- imperative scroll layer ---------------------------------------------
  // Nothing continuous goes through React state: the progress fill, the rolling
  // mark and the lit checkpoints are all direct DOM writes on a single rAF.
  // `active` is discrete, so it stays in state but only commits on a change.
  const railFillRef = useRef(null)
  const pathRef = useRef(null)
  const cubeRef = useRef(null)
  const dotRefs = useRef([])
  const nodesRef = useRef([]) // chapter elements, cached so the rAF never queries the DOM
  const stopsRef = useRef([0, 0])
  const pathLenRef = useRef(0)
  const activeRef = useRef(0)
  const rafRef = useRef(0)
  const [railH, setRailH] = useState(420)

  const place = () => {
    const el = scrollRef.current
    if (!el) return
    const max = Math.max(0, el.scrollHeight - el.clientHeight)
    const top = el.scrollTop
    const p = max > 0 ? top / max : 0

    if (railFillRef.current) railFillRef.current.style.width = `${(p * 100).toFixed(2)}%`

    // the mark: a pure function of scrollTop, sampled off the real path
    const path = pathRef.current
    const cube = cubeRef.current
    const stops = stopsRef.current
    const len = pathLenRef.current
    if (path && cube && len > 0 && stops.length > 1) {
      let k = 0
      while (k < stops.length - 2 && top >= stops[k + 1]) k++
      const span = stops[k + 1] - stops[k]
      const t = span > 0 ? (top - stops[k]) / span : 1
      const frac = (k + settle(Math.min(1, Math.max(0, t)))) / (stops.length - 1)
      const d = frac * len
      const pt = path.getPointAtLength(d)
      // Genuine roll: one turn per circumference. Translate FIRST, rotate
      // second — the pivot is then the mark's own centre unconditionally, so
      // transform-box (a WebKit hazard, CLAUDE.md §5) never enters the picture.
      // Under reduced motion the mark still tracks the path (it is a position
      // indicator, and losing it would lose information) but stops spinning —
      // the spin is the decorative, vestibular part.
      const deg = motionOnRef.current ? (360 * d) / (Math.PI * MARK_H) : 0
      cube.style.transform =
        `translate(${(pt.x - MARK_W / 2).toFixed(2)}px, ${(pt.y - MARK_H / 2).toFixed(2)}px) rotate(${deg.toFixed(2)}deg)`
      // checkpoints light as they are passed
      for (let i = 0; i < CHAPTERS.length; i++) {
        const dot = dotRefs.current[i]
        if (!dot) continue
        const lit = top >= stops[i + 1] - 1
        dot.setAttribute('fill', lit ? 'var(--coral)' : 'var(--bg)')
        dot.setAttribute('r', lit ? '4.2' : '3')
      }
    }

    // nearest chapter above the reading line
    const mid = top + el.clientHeight * 0.4
    let best = 0
    for (let i = 0; i < CHAPTERS.length; i++) {
      const node = nodesRef.current[i]
      if (node && node.offsetTop <= mid) best = i
    }
    if (best !== activeRef.current) {
      activeRef.current = best
      setActive(best)
    }
  }

  const onScroll = () => {
    if (rafRef.current) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0
      place()
    })
  }

  // Measure the real geometry: chapter offsetTop for the checkpoints, and the
  // path's own length for the roll. NOTE: offsetTop only lines up with
  // scrollTop because the scroll container carries `relative` — removing that
  // class silently breaks both the checkpoints and active-chapter detection.
  const measure = () => {
    const el = scrollRef.current
    if (!el) return
    setRailH(el.clientHeight)
    const max = Math.max(0, el.scrollHeight - el.clientHeight)
    const s = [0]
    CHAPTERS.forEach((c, i) => {
      const node = el.querySelector(`#gch-${c.id}`)
      nodesRef.current[i] = node
      const v = node ? Math.min(max, Math.max(0, node.offsetTop - CHAPTER_OFFSET)) : 0
      s.push(Math.max(v, s[s.length - 1]))
    })
    s.push(Math.max(max, s[s.length - 1]))
    stopsRef.current = s

    const path = pathRef.current
    if (path) {
      pathLenRef.current = path.getTotalLength()
      // park each checkpoint dot on its own point along the path
      for (let i = 0; i < CHAPTERS.length; i++) {
        const dot = dotRefs.current[i]
        if (!dot) continue
        const pt = path.getPointAtLength((pathLenRef.current * (i + 1)) / (s.length - 1))
        dot.setAttribute('cx', pt.x.toFixed(2))
        dot.setAttribute('cy', pt.y.toFixed(2))
      }
    }
    place()
  }

  // Re-measure on open, on mode change (the two layouts differ in height) and
  // on any resize of the content.
  useLayoutEffect(() => {
    if (!open) return
    const el = scrollRef.current
    if (!el) return
    measure()
    const ro = new ResizeObserver(() => measure())
    ro.observe(el)
    const inner = el.firstElementChild
    if (inner) ro.observe(inner)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, railH])

  // remember where they left off
  useEffect(() => {
    if (!open) return
    const saved = Number(localStorage.getItem('flow.guide.chapter') || 0)
    setActive(saved)
    activeRef.current = saved
    if (!saved) return
    requestAnimationFrame(() => {
      const el = scrollRef.current
      const node = el?.querySelector(`#gch-${CHAPTERS[saved]?.id}`)
      if (node) { el.scrollTop = Math.max(0, node.offsetTop - CHAPTER_OFFSET); place() }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (open) localStorage.setItem('flow.guide.chapter', String(active))
  }, [active, open])

  const jumpTo = (id) => {
    const el = scrollRef.current
    const node = el?.querySelector(`#gch-${id}`)
    if (node) el.scrollTo({ top: node.offsetTop - CHAPTER_OFFSET, behavior: motionOn ? 'smooth' : 'auto' })
  }

  const enterTr = craft
    ? { type: 'spring', stiffness: 300, damping: 28 }
    : { duration: 0.26, ease: [0.22, 0.61, 0.36, 1] }
  const enterFrom = craft ? { opacity: 0, y: 22 } : { opacity: 0, y: 6 }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[95]"
            style={{ background: 'var(--bg)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: craft ? 0.3 : 0.2 }}
          />
          <motion.div
            className="fixed inset-0 z-[96] flex flex-col"
            initial={{ opacity: 0, y: craft ? 24 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: craft ? 24 : 8 }}
            transition={craft ? { type: 'spring', stiffness: 320, damping: 34 } : { duration: 0.22, ease: [0.22, 0.61, 0.36, 1] }}
          >
            {/* header */}
            <div
              className="flex shrink-0 items-center justify-between px-5 pt-[max(14px,env(safe-area-inset-top))] pb-3"
              style={craft ? undefined : { borderBottom: '1px solid var(--hairline)' }}
            >
              <div className="flex min-w-0 items-center gap-3">
                <BrandMark variant="mark" height={craft ? 30 : 24} />
                <span
                  className={craft ? 'font-display text-[17px] font-bold' : 'truncate text-[15px] font-semibold'}
                  style={{ color: 'var(--text)' }}
                >
                  {craft ? 'how this works' : 'How this works'}
                </span>
              </div>
              <button
                onClick={onClose}
                className={craft ? 'shrink-0 rounded-full px-3 py-1.5 text-[12px] font-bold' : 'flex shrink-0 items-center gap-1.5 px-2.5 py-1.5 text-[12px] font-medium'}
                style={
                  craft
                    ? { background: 'var(--surface-2)', color: 'var(--text-soft)', border: '2px solid var(--ink)' }
                    : { background: 'transparent', color: 'var(--text-soft)', border: '1px solid var(--hairline)', borderRadius: 'var(--radius-surface, 8px)' }
                }
              >
                {craft ? 'skip the tour ›' : <><Icon name="x" size={14} /> Close</>}
              </button>
            </div>

            {/* progress rail — width written directly, never via state */}
            <div
              className="mx-5 shrink-0 overflow-hidden"
              style={{ height: craft ? 3 : 2, borderRadius: 99, background: craft ? 'var(--surface-2)' : 'var(--hairline)' }}
            >
              <div
                ref={railFillRef}
                className="h-full"
                style={{ width: '0%', borderRadius: 99, background: 'var(--coral)' }}
              />
            </div>

            {/* journey. `relative` is load-bearing: chapter offsetTop is measured
                against this box. Do not remove it. */}
            <div ref={scrollRef} onScroll={onScroll} className="no-scrollbar relative flex-1 overflow-y-auto">
              <div className={`mx-auto flex ${craft ? 'max-w-2xl gap-3' : 'max-w-3xl gap-7'} px-5 pb-32 pt-6`}>

                {craft ? (
                  /* the drawn path + the real mark rolling along it */
                  <div className="shrink-0" style={{ width: RAIL_W }}>
                    <div className="sticky top-0" style={{ height: railH, width: RAIL_W }}>
                      <svg
                        className="absolute inset-0"
                        width={RAIL_W} height={railH} viewBox={`0 0 ${RAIL_W} ${railH}`}
                        aria-hidden="true"
                      >
                        <path
                          ref={pathRef}
                          d={railD(railH)}
                          fill="none" stroke="var(--coral)" strokeWidth="2.6" strokeLinecap="round"
                          strokeDasharray="1 9" opacity=".6"
                        />
                        {CHAPTERS.map((c, i) => (
                          <circle
                            key={c.id}
                            ref={(n) => { dotRefs.current[i] = n }}
                            cx="-99" cy="-99" r="3"
                            fill="var(--bg)" stroke="var(--coral)" strokeWidth="2"
                            style={{ transition: 'fill .25s ease, r .25s var(--ease-spring)' }}
                          />
                        ))}
                      </svg>
                      <div
                        ref={cubeRef}
                        aria-hidden="true"
                        style={{
                          position: 'absolute', left: 0, top: 0,
                          width: MARK_W, height: MARK_H,
                          display: 'block', lineHeight: 0,
                          willChange: 'transform',
                          transform: `translate(${RAIL_W / 2 - MARK_W / 2}px, 0px)`,
                        }}
                      >
                        <BrandMark variant="mark" height={MARK_H} />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* professional: a sticky numbered contents rail */
                  <nav className="hidden shrink-0 md:block" style={{ width: 184 }}>
                    <div className="sticky top-0 pt-1">
                      <div
                        className="mb-3 text-[10px] font-semibold uppercase"
                        style={{ color: 'var(--text-faint)', letterSpacing: '.09em' }}
                      >
                        Contents
                      </div>
                      <ul className="flex flex-col">
                        {CHAPTERS.map((c, i) => {
                          const on = i === active
                          return (
                            <li key={c.id}>
                              <button
                                onClick={() => jumpTo(c.id)}
                                className="flex w-full items-baseline gap-2.5 py-1.5 pl-3 pr-2 text-left text-[12.5px]"
                                style={{
                                  borderLeft: `2px solid ${on ? 'var(--coral)' : 'var(--hairline)'}`,
                                  color: on ? 'var(--text)' : 'var(--text-soft)',
                                  fontWeight: on ? 600 : 400,
                                  transition: 'color .18s ease, border-color .18s ease',
                                }}
                              >
                                <span className="tabular text-[11px]" style={{ color: 'var(--text-faint)' }}>
                                  {String(i + 1).padStart(2, '0')}
                                </span>
                                <span className="min-w-0 flex-1">{c.proTitle || c.title}</span>
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  </nav>
                )}

                <div className="min-w-0 flex-1">
                  {/* opening */}
                  <motion.div
                    initial={enterFrom} animate={{ opacity: 1, y: 0 }}
                    transition={{ ...enterTr, delay: craft ? 0.15 : 0.05 }}
                    className={craft ? 'mb-10' : 'mb-9'}
                  >
                    {craft ? (
                      <div className="mb-3 flex items-center gap-3">
                        <Brain size={62} pulse={motionOn} />
                        <div>
                          <div className="font-display text-[22px] font-extrabold leading-tight" style={{ color: 'var(--text)' }}>
                            built for brains that lose track of time
                          </div>
                          <div className="mt-1 text-[13px]" style={{ color: 'var(--text-soft)' }}>
                            Every choice here is aimed at one thing: making it easier to start.
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div
                          className="mb-2 text-[10px] font-semibold uppercase"
                          style={{ color: 'var(--coral)', letterSpacing: '.09em' }}
                        >
                          Introduction
                        </div>
                        <h1 className="text-[24px] font-semibold leading-tight" style={{ color: 'var(--text)' }}>
                          Built for brains that lose track of time
                        </h1>
                        <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed" style={{ color: 'var(--text-soft)' }}>
                          Every choice here is aimed at one thing: making it easier to start.
                          Six mechanics, and the reasoning behind each.
                        </p>
                        <div className="mt-6" style={{ height: 1, background: 'var(--hairline)' }} />
                      </div>
                    )}
                  </motion.div>

                  {CHAPTERS.map((c, i) => {
                    const isActive = i === active
                    return (
                      <div key={c.id} id={`gch-${c.id}`} className={craft ? 'mb-12' : 'mb-10'}>
                        <motion.div
                          initial={enterFrom}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: false, amount: 0.35 }}
                          transition={enterTr}
                        >
                          {craft ? (
                            <div className="mb-2 flex items-center gap-2.5">
                              <motion.span
                                animate={isActive && motionOn ? { rotate: [0, -6, 4, 0], y: [0, -3, 0] } : {}}
                                transition={{ duration: 1.6, repeat: isActive ? Infinity : 0, repeatDelay: 1.4 }}
                                className="inline-flex"
                              >
                                <c.Art size={44} />
                              </motion.span>
                              <div className="font-display text-[18px] font-extrabold" style={{ color: 'var(--text)' }}>
                                {c.title}
                              </div>
                            </div>
                          ) : (
                            <div className="mb-1.5 flex items-baseline gap-2.5">
                              <span className="tabular text-[11px] font-semibold" style={{ color: 'var(--text-faint)' }}>
                                {String(i + 1).padStart(2, '0')}
                              </span>
                              <h2 className="text-[17px] font-semibold" style={{ color: 'var(--text)' }}>
                                {c.proTitle || c.title}
                              </h2>
                            </div>
                          )}

                          <p
                            className={craft ? 'mb-3 text-[13px] leading-relaxed' : 'mb-4 max-w-xl text-[13.5px] leading-relaxed'}
                            style={{ color: 'var(--text-soft)' }}
                          >
                            {(!craft && c.proBlurb) || c.blurb}
                          </p>

                          {craft ? (
                            <div className="mb-3">
                              <c.Demo play={isActive} craft motionOn={motionOn} />
                            </div>
                          ) : (
                            <div
                              className="mb-4 max-w-xl overflow-hidden"
                              style={{ border: '1px solid var(--hairline)', borderRadius: 'var(--radius-surface, 10px)', background: 'var(--surface)' }}
                            >
                              <div
                                className="px-3 py-1.5 text-[10px] font-semibold uppercase"
                                style={{ color: 'var(--text-faint)', letterSpacing: '.08em', borderBottom: '1px solid var(--hairline)' }}
                              >
                                Live example
                              </div>
                              <div className="p-3">
                                <c.Demo play={isActive} craft={false} motionOn={motionOn} />
                              </div>
                            </div>
                          )}

                          {craft ? (
                            <div
                              className="pl-3 text-[12px] leading-relaxed"
                              style={{ borderLeft: '3px solid var(--coral)', color: 'var(--task-coral-tint-text)' }}
                            >
                              {c.why}
                            </div>
                          ) : (
                            <div className="max-w-xl pl-3" style={{ borderLeft: '2px solid var(--hairline)' }}>
                              <div
                                className="mb-1 text-[10px] font-semibold uppercase"
                                style={{ color: 'var(--text-faint)', letterSpacing: '.08em' }}
                              >
                                Why it works this way
                              </div>
                              <p className="text-[12.5px] leading-relaxed" style={{ color: 'var(--text-soft)' }}>
                                {c.why}
                              </p>
                            </div>
                          )}
                        </motion.div>
                      </div>
                    )
                  })}

                  {/* closing */}
                  <motion.div
                    initial={enterFrom}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.4 }}
                    transition={enterTr}
                    className={craft ? 'flex flex-col items-center gap-3 pt-4 text-center' : 'pt-2'}
                  >
                    {craft ? (
                      <>
                        <Sticker Art={HappyStar} rest={5} size={92} calm={!motionOn} />
                        <div className="font-display text-[20px] font-extrabold" style={{ color: 'var(--text)' }}>
                          that's the whole thing
                        </div>
                        <p className="max-w-sm text-[13px]" style={{ color: 'var(--text-soft)' }}>
                          Nothing here is decoration. Every animation marks a moment worth noticing,
                          and every restraint exists because more would have made it harder to begin.
                        </p>
                        <button
                          onClick={onClose}
                          className="mt-1 rounded-full px-5 py-2.5 text-[13px] font-extrabold"
                          style={{ background: 'var(--task-blue-bg)', color: 'var(--task-blue-text)', border: '2px solid var(--ink)', boxShadow: '2px 3px 0 var(--ink-shadow)' }}
                        >
                          start using it
                        </button>
                      </>
                    ) : (
                      <>
                        <div style={{ height: 1, background: 'var(--hairline)' }} />
                        <h2 className="mt-6 text-[17px] font-semibold" style={{ color: 'var(--text)' }}>
                          That's the whole thing
                        </h2>
                        <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed" style={{ color: 'var(--text-soft)' }}>
                          Nothing here is decoration. Every restraint exists because more would have
                          made it harder to begin.
                        </p>
                        <button
                          onClick={onClose}
                          className="mt-5 px-4 py-2 text-[13px] font-semibold"
                          style={{ background: 'var(--task-blue-bg)', color: 'var(--task-blue-text)', borderRadius: 'var(--radius-surface, 10px)', border: 'none' }}
                        >
                          Start using it
                        </button>
                      </>
                    )}
                  </motion.div>
                </div>
              </div>
            </div>

            {/* footer */}
            <div
              className="flex shrink-0 items-center justify-between gap-3 px-5 py-3"
              style={{ borderTop: craft ? '2px solid var(--ink)' : '1px solid var(--hairline)' }}
            >
              <span className="min-w-0 truncate text-[11px]" style={{ color: 'var(--text-faint)' }}>
                {craft
                  ? `chapter ${Math.min(active + 1, CHAPTERS.length)} of ${CHAPTERS.length} · scroll to continue`
                  : `Section ${Math.min(active + 1, CHAPTERS.length)} of ${CHAPTERS.length}`}
              </span>
              <div className={craft ? 'flex shrink-0 gap-1.5' : 'flex shrink-0 gap-1'}>
                {CHAPTERS.map((c, i) => (
                  <button
                    key={c.id}
                    aria-label={`Go to ${c.proTitle || c.title}`}
                    onClick={() => jumpTo(c.id)}
                    className="transition-all"
                    style={
                      craft
                        ? { height: 8, width: i === active ? 20 : 8, borderRadius: 99, background: i === active ? 'var(--coral)' : 'var(--surface-2)' }
                        : { height: 3, width: 22, borderRadius: 2, background: i <= active ? 'var(--coral)' : 'var(--hairline)' }
                    }
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
