import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import BrandMark from '../BrandMark'
import Icon from '../Icon'
import Spotlight, { TravelCue } from './Spotlight'
import {
  DEMO_FLAG,
  TARGETS,
  ringIsTooBig,
  scrollIntoViewAndSettle,
  travelDirection,
} from './targets'
import { MemphisBridge, PileArt, NowLineArt, CaptureArt, ViewsArt, ModePreview } from './art'
import { addDays, dateKey } from '../../state/time'

// First-run walkthrough — approach C (hybrid). Cards 1, 2 and 7 are full-bleed
// narrative; 3–6 hand off to a spotlight on the real UI.
//
// Deliberately rendered in PROFESSIONAL styling regardless of the current mode:
// the app opens professional and the user does not choose until card 7, so the
// intro must not pre-empt that choice. Nothing here uses the craft-layer classes
// (.inked / .marker-rule / .pencil) or the display font.

const NARROW = 640

const STEPS = [
  {
    key: 'welcome',
    kind: 'card',
    title: 'Welcome to TaskStack',
    body: 'A task manager built around time instead of lists. Ninety seconds and you’ll know the whole thing.',
  },
  {
    key: 'purpose',
    kind: 'card',
    title: 'Tasks belong where they actually happen',
    body: 'A list flattens everything into one anxious column. TaskStack lays your day out on a timeline, walks a live line across it, and never lets anything unfinished quietly disappear.',
    why: 'Two faces, one app — the calm one by default, the hand-made one whenever you want it. You pick at the end.',
  },
  {
    key: 'pile',
    kind: 'spot',
    target: 'pile',
    title: 'The pile has a lid',
    body: 'Only three overdue tasks ever show. The rest wait behind a counter, and one tap moves the whole lot to tomorrow.',
    why: 'Why: a little visible debt is salience, a lot is shutdown. Piles don’t create urgency, they create initiation paralysis — so the pile is capped at three, and finishing gets its own visual channel as a counterweight.',
    Art: PileArt,
  },
  {
    key: 'nowline',
    kind: 'spot',
    target: 'nowline',
    title: 'A red line walks across your day',
    body: 'It moves in real time. Timed tasks sit where they happen; all-day tasks ride the full-width band at the top, tagged “all day”.',
    why: 'Why: “later” is nearly invisible to a brain that discounts the future steeply. Making time a moving object you can watch is the point of the whole layout.',
    Art: NowLineArt,
  },
  {
    key: 'input',
    kind: 'spot',
    target: 'input',
    title: 'Type it. Press enter. Done.',
    body: 'The bar at the bottom is the entire capture flow. “Dentist Friday at 3” lands on Friday at 3 — no form, no fields, no second screen.',
    why: 'Why: the moment you have to think about where a task goes, it doesn’t get written down.',
    Art: CaptureArt,
  },
  {
    key: 'views',
    kind: 'spot',
    target: 'views',
    title: 'Three ways to look',
    body: 'Daily for right now, weekly for the shape of the week, monthly for what’s coming. They drill into each other.',
    why: 'Why: noticing a week is overloaded before it arrives is exactly what a short time horizon makes hard.',
    Art: ViewsArt,
  },
  {
    key: 'setup',
    kind: 'card',
    title: 'Make it yours',
    body: 'Two faces, same app. You can switch any time in Settings.',
  },
]

const OVERDUE_TITLES = ['Return the library books', 'Book the dentist', 'Reply to Sam', 'Renew the parking permit']

// A brand-new user has an empty timeline, which would strand cards 3–5 — the
// exact cards carrying the thesis — on nothing. So the intro seeds its own set
// for its own duration and takes it away again. Flagged, never merged into real
// data, and appended (never replacing) so a replaying user loses nothing.
function makeDemoTasks(nowMin) {
  const today = new Date()
  const at = (d) => dateKey(addDays(today, d))
  const base = {
    start: null, end: null, anytime: true, done: false, completedAt: null,
    recurrence: null, urgency: null, urgencyOff: false, sortIndex: null,
    [DEMO_FLAG]: true,
  }
  // wide enough that the bar carries its own title at 3-day zoom — a 40px
  // sliver would teach nothing on the card that is about timed placement
  const start = Math.max(0, Math.min(1140, nowMin - 150))
  return [
    { ...base, id: 'intro-demo-1', title: OVERDUE_TITLES[0], date: at(-3), createdAt: Date.now() - 9000 },
    { ...base, id: 'intro-demo-2', title: OVERDUE_TITLES[1], date: at(-2), createdAt: Date.now() - 8000 },
    { ...base, id: 'intro-demo-3', title: OVERDUE_TITLES[2], date: at(-1), createdAt: Date.now() - 7000 },
    { ...base, id: 'intro-demo-4', title: OVERDUE_TITLES[3], date: at(-1), createdAt: Date.now() - 6000 },
    { ...base, id: 'intro-demo-5', title: 'Draft the proposal', date: at(0), createdAt: Date.now() - 5000 },
    {
      ...base, id: 'intro-demo-6', title: 'Design review', date: at(0),
      start, end: Math.min(1440, start + 420), anytime: false, createdAt: Date.now() - 4000,
    },
  ]
}

export default function Onboarding({ open, store, onFinish }) {
  const [step, setStep] = useState(0)
  const [resolved, setResolved] = useState(null)
  const [phase, setPhase] = useState('card') // card | resolving | travelling | spot | fallback
  const [travel, setTravel] = useState(null)
  const [nonce, setNonce] = useState(0) // bumped on resize to re-run resolution
  const tasksRef = useRef(store.tasks)
  tasksRef.current = store.tasks
  const calloutRef = useRef(null)
  const retriesRef = useRef(0)

  // clamp so an out-of-range step can never read `undefined.kind` and blank the app
  const stepIdx = Math.min(Math.max(0, step), STEPS.length - 1)
  const s = STEPS[stepIdx]
  const calm = !!store.settings.reduceMotion
  const last = stepIdx === STEPS.length - 1

  // --- demo task lifecycle -------------------------------------------------

  // A reload part-way through the intro would otherwise leave demo tasks in the
  // user's real data. Sweep on mount when we are NOT about to seed.
  useEffect(() => {
    if (open) return
    const t = tasksRef.current
    if (t.some((x) => x[DEMO_FLAG])) {
      store._dispatch({ type: 'replaceAll', tasks: t.filter((x) => !x[DEMO_FLAG]) })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!open) return
    const now = new Date()
    const real = tasksRef.current.filter((t) => !t[DEMO_FLAG])
    store._dispatch({
      type: 'replaceAll',
      tasks: [...real, ...makeDemoTasks(now.getHours() * 60 + now.getMinutes())],
    })
    return () => {
      store._dispatch({
        type: 'replaceAll',
        tasks: tasksRef.current.filter((t) => !t[DEMO_FLAG]),
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => { if (open) setStep(0) }, [open])

  // --- step resolution -----------------------------------------------------

  const toFallback = useCallback(() => { setResolved(null); setPhase('fallback') }, [])

  // Reset the re-open budget per STEP, not per resolution attempt — resetting it
  // inside the resolution effect made the orphan retry loop unbounded, because
  // every retry re-ran that effect and zeroed its own counter.
  useEffect(() => { retriesRef.current = 0 }, [step])

  useEffect(() => {
    if (!open) return undefined
    const spec = s.kind === 'spot' ? TARGETS[s.target] : null
    if (!spec) { setResolved(null); setPhase('card'); setTravel(null); return undefined }

    let cancelled = false
    setPhase('resolving')
    setResolved(null)
    setTravel(null) // never inherit the previous step's chevron direction

    ;(async () => {
      if (spec.prepare) {
        const ok = await spec.prepare()
        if (cancelled) return
        if (!ok) return toFallback()
      }
      const t = await spec.resolve({ overdueTitles: OVERDUE_TITLES })
      if (cancelled) return
      if (!t) return toFallback()

      const dir = travelDirection(t.node)
      if (dir) { setTravel(dir); setPhase('travelling') }
      await scrollIntoViewAndSettle(t.node)
      if (cancelled) return
      setTravel(null)

      // At 375px a ring around something this large is a modal wearing a ring.
      if (ringIsTooBig(t.getRect())) return toFallback()
      setResolved(t)
      setPhase('spot')
    })()

    return () => {
      cancelled = true
      spec.teardown?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, step, nonce])

  // Re-resolve on resize: the breakpoint may have changed which elements exist,
  // and the 60%-of-viewport verdict has to be recomputed.
  useEffect(() => {
    if (!open) return undefined
    let t = 0
    const onResize = () => { clearTimeout(t); t = setTimeout(() => setNonce((n) => n + 1), 180) }
    window.addEventListener('resize', onResize)
    return () => { clearTimeout(t); window.removeEventListener('resize', onResize) }
  }, [open])

  // The orphan case: the ring's element vanished under it (menu dismissed, bar
  // minimised). Try to put it back twice, then degrade gracefully to a card.
  const onLost = useCallback(() => {
    if (retriesRef.current >= 2) return toFallback()
    retriesRef.current += 1
    setNonce((n) => n + 1)
  }, [toFallback])

  // --- callout placement ---------------------------------------------------

  useLayoutEffect(() => {
    const el = calloutRef.current
    if (!el || phase !== 'spot' || !resolved) return undefined
    // first placement of a step jumps (no transition) so the callout can't slide
    // in from the top-left corner before it's positioned; re-places (scroll /
    // resize) then glide.
    let first = true
    const place = () => {
      const r = resolved.getRect()
      const vw = window.innerWidth
      const vh = window.innerHeight
      if (vw < NARROW) {
        // dock as a sheet in the half the target is NOT in, so the two can
        // never collide and neither gets pushed off the safe area
        const lower = r.top + r.height / 2 > vh / 2
        Object.assign(el.style, {
          left: '12px', right: '12px', width: 'auto',
          top: lower ? 'max(12px, env(safe-area-inset-top))' : 'auto',
          bottom: lower ? 'auto' : 'max(12px, env(safe-area-inset-bottom))',
        })
        return
      }
      const w = 380
      const h = el.offsetHeight
      const G = 20
      Object.assign(el.style, {
        right: 'auto', bottom: 'auto', width: `${w}px`,
        transition: first ? 'none' : 'left .3s cubic-bezier(.22,.61,.36,1), top .3s cubic-bezier(.22,.61,.36,1)',
      })
      const clampX = (x) => Math.max(16, Math.min(vw - w - 16, x))
      const clampY = (y) => Math.max(16, Math.min(vh - h - 16, y))
      const spaceRight = vw - (r.left + r.width)
      const spaceLeft = r.left
      const spaceBelow = vh - (r.top + r.height)
      const spaceAbove = r.top
      let left, top
      // Side first, then above/below — and CRUCIALLY never centre-on-target, so
      // the callout can't sit on top of the very thing it's pointing at (the
      // now-line was getting covered). Each branch clears the target rect.
      if (spaceRight >= w + G) { left = r.left + r.width + G; top = clampY(r.top + r.height / 2 - h / 2) }
      else if (spaceLeft >= w + G) { left = r.left - w - G; top = clampY(r.top + r.height / 2 - h / 2) }
      else if (spaceBelow >= h + G) { top = r.top + r.height + G; left = clampX(r.left + r.width / 2 - w / 2) }
      else if (spaceAbove >= h + G) { top = r.top - h - G; left = clampX(r.left + r.width / 2 - w / 2) }
      else {
        // nothing fully clears — dock to the viewport edge on the roomiest side,
        // which still reveals most of the target rather than covering its centre
        const m = Math.max(spaceRight, spaceLeft, spaceBelow, spaceAbove)
        if (m === spaceRight) { left = vw - w - 16; top = clampY(r.top) }
        else if (m === spaceLeft) { left = 16; top = clampY(r.top) }
        else if (m === spaceBelow) { top = vh - h - 16; left = clampX(r.left) }
        else { top = 16; left = clampX(r.left) }
      }
      el.style.left = `${Math.round(clampX(left))}px`
      el.style.top = `${Math.round(clampY(top))}px`
      if (first) {
        // now that it's positioned, reveal it (fade only — no positional slide)
        requestAnimationFrame(() => {
          el.style.transition = 'opacity .2s ease'
          el.style.opacity = '1'
          // enable position glide for later re-places (scroll/resize)
          requestAnimationFrame(() => {
            el.style.transition = 'left .3s cubic-bezier(.22,.61,.36,1), top .3s cubic-bezier(.22,.61,.36,1), opacity .2s ease'
          })
        })
      }
      first = false
    }
    place()
    const ro = new ResizeObserver(place)
    ro.observe(el)
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [phase, resolved, step])

  // --- exits ---------------------------------------------------------------

  const finish = () => {
    // Skip writes the flag too — otherwise skipping only postpones the interruption.
    store.setSettings({ onboarded: true })
    onFinish()
  }
  const next = () => (last ? finish() : setStep((i) => i + 1))

  if (!open) return null

  const asCard = s.kind === 'card' || phase === 'fallback' || phase === 'resolving' || phase === 'travelling'
  const showArt = s.kind === 'card' || phase === 'fallback'

  const panel = (
    // keyed by step so each card's content fades/rises in instead of hard-cutting
    <motion.div
      key={step}
      initial={calm ? { opacity: 0 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: calm ? 0.16 : 0.28, ease: [0.22, 0.61, 0.36, 1] }}
    >
      <Rail index={step} total={STEPS.length} />
      <h2 style={T.h2}>{s.title}</h2>
      <p style={T.body}>{s.body}</p>
      {s.why && <p style={T.why}>{s.why}</p>}

      {showArt && s.key === 'welcome' && <WelcomeArt calm={calm} />}
      {showArt && s.key === 'purpose' && (
        <div style={{ margin: '14px 0 2px', borderRadius: 12, overflow: 'hidden' }}>
          <MemphisBridge />
        </div>
      )}
      {showArt && s.key === 'setup' && <SetupArt store={store} />}
      {showArt && s.Art && (
        <div style={{ margin: '14px 0 2px' }}><s.Art /></div>
      )}

      <Foot index={step} total={STEPS.length} last={last} onSkip={finish} onNext={next} />
    </motion.div>
  )

  return (
    <>
      {/* Blocks the app underneath. The spotlight lights an element up; it does
          not hand it over — a stray click during the walkthrough could delete a
          demo task or switch views out from under the next step. */}
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 90, background: asCard ? 'rgba(12,12,16,0.66)' : 'transparent' }}
        aria-hidden="true"
      />

      {phase === 'spot' && <Spotlight resolved={resolved} calm={calm} onLost={onLost} />}
      {phase === 'travelling' && <TravelCue direction={travel} />}

      {asCard ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Introduction"
          data-intro-phase={phase}
          style={{
            position: 'fixed', inset: 0, zIndex: 92, display: 'grid', placeItems: 'center',
            padding: 'max(16px, env(safe-area-inset-top)) 16px max(16px, env(safe-area-inset-bottom))',
            pointerEvents: 'none',
          }}
        >
          <div style={{ ...T.panel, width: 'min(560px, 100%)', maxHeight: '100%', pointerEvents: 'auto' }}>
            {panel}
          </div>
        </div>
      ) : (
        <div
          ref={calloutRef}
          role="dialog"
          aria-modal="true"
          aria-label="Introduction"
          data-intro-phase={phase}
          // starts invisible; the placement effect fades it in AT its final
          // position, so it never slides across the screen from a default corner
          style={{ ...T.panel, position: 'fixed', zIndex: 92, maxHeight: 'calc(100vh - 32px)', opacity: 0 }}
        >
          {panel}
        </div>
      )}
    </>
  )
}

/* ---------------------------------------------------------------- chrome -- */

function Rail({ index, total }) {
  return (
    <div style={{ display: 'flex', gap: 4, marginBottom: 14 }} aria-hidden="true">
      {Array.from({ length: total }, (_, k) => (
        <span
          key={k}
          style={{
            flex: '1 1 0', height: 3, borderRadius: 2,
            background: k < index ? 'var(--coral)' : k === index ? 'var(--coral-strong)' : 'var(--surface-2)',
            transition: 'background .25s ease',
          }}
        />
      ))}
    </div>
  )
}

function Foot({ index, total, last, onSkip, onNext }) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 10, flexWrap: 'wrap', marginTop: 16, paddingTop: 13,
        borderTop: '1px solid var(--hairline)',
      }}
    >
      <button onClick={onSkip} style={T.skip}>Skip introduction</button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
        <span style={{ font: '600 11.5px var(--font-sans)', color: 'var(--text-faint)', whiteSpace: 'nowrap' }}>
          {index + 1} of {total}
        </span>
        <button onClick={onNext} style={T.next}>
          {last ? 'Get started' : 'Next'}
          {!last && <Icon name="chevronRight" size={15} stroke={2.4} />}
        </button>
      </div>
    </div>
  )
}

function WelcomeArt({ calm }) {
  const [settled, setSettled] = useState(calm)
  useEffect(() => {
    if (calm) return undefined
    // reuse BrandMark's own cube transforms rather than redrawing the mark —
    // the cubes tumble in and settle. Nothing about the artwork changes.
    const t = setTimeout(() => setSettled(true), 60)
    return () => clearTimeout(t)
  }, [calm])
  return (
    <div style={{ display: 'grid', placeItems: 'center', padding: '26px 0 10px' }}>
      <BrandMark variant="wordmark" height={92} fit tumbling={!settled} />
    </div>
  )
}

function SetupArt({ store }) {
  const mode = store.settings.mode || 'professional'
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <ModeTile
          selected={mode === 'professional'}
          onClick={() => store.setSettings({ mode: 'professional' })}
          variant="professional"
          name="Professional"
          desc="Calm and uniform. Overflow becomes a stack of paper notes. Motion only where it means something."
        />
        <ModeTile
          selected={mode === 'personalized'}
          onClick={() => store.setSettings({ mode: 'personalized' })}
          variant="personalized"
          name="Personalized"
          desc="Ink outlines, paper grain, a pencil cursor and a cast of characters who hold your overdue pile."
        />
      </div>

      <Row
        label="Theme"
        hint="you can flip this later too"
        options={[['dark', 'Dark'], ['light', 'Light']]}
        value={store.settings.theme}
        onPick={(v) => store.setSettings({ theme: v })}
      />
      <Row
        label="Reduce motion"
        hint="calmer animations everywhere"
        options={[[false, 'Off'], [true, 'On']]}
        value={!!store.settings.reduceMotion}
        onPick={(v) => store.setSettings({ reduceMotion: v })}
      />
      <p style={{ ...T.why, marginTop: 12, borderLeft: 'none', paddingLeft: 0 }}>
        There’s a fuller guide waiting in Settings whenever you want it.
      </p>
    </div>
  )
}

function ModeTile({ selected, onClick, variant, name, desc }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      style={{
        flex: '1 1 210px', minWidth: 0, textAlign: 'left', padding: 10, borderRadius: 12,
        background: 'var(--surface)', position: 'relative', overflow: 'hidden',
        border: `1.5px solid ${selected ? 'var(--coral)' : 'var(--hairline)'}`,
        boxShadow: selected ? '0 0 0 3px var(--task-coral-tint-bg)' : 'none',
        transition: 'border-color .18s, box-shadow .18s',
      }}
    >
      {/* selection = a single clear orange check, fully visible (no corner wedge) */}
      {selected && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: 999,
            display: 'grid', placeItems: 'center', zIndex: 2,
            background: 'var(--coral)', color: '#fff',
            boxShadow: '0 1px 4px rgba(0,0,0,.28)',
          }}
        >
          <Icon name="check" size={13} stroke={3.2} />
        </span>
      )}
      <span style={{ display: 'block', marginBottom: 8, position: 'relative' }}>
        <ModePreview variant={variant} />
      </span>
      <span style={{ display: 'block', font: '700 12.5px var(--font-sans)', color: 'var(--text)' }}>{name}</span>
      <span style={{ display: 'block', marginTop: 4, font: '400 10.5px/1.5 var(--font-sans)', color: 'var(--text-soft)' }}>
        {desc}
      </span>
    </button>
  )
}

function Row({ label, hint, options, value, onPick }) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14,
        marginTop: 11, paddingTop: 10, borderTop: '1px solid var(--hairline)',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ font: '700 11.5px var(--font-sans)', color: 'var(--text)' }}>{label}</div>
        <div style={{ font: '400 10px var(--font-sans)', color: 'var(--text-faint)' }}>{hint}</div>
      </div>
      <div style={{ display: 'flex', gap: 2, padding: 2, borderRadius: 8, background: 'var(--surface-2)', flexShrink: 0 }}>
        {options.map(([v, lbl]) => (
          <button
            key={String(v)}
            onClick={() => onPick(v)}
            style={{
              padding: '4px 11px', borderRadius: 6,
              font: '700 11px var(--font-sans)',
              background: value === v ? 'var(--surface)' : 'transparent',
              color: value === v ? 'var(--text)' : 'var(--text-soft)',
            }}
          >
            {lbl}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- tokens -- */
// Local styles only — this component must not reach into index.css, which is
// owned elsewhere right now.

const T = {
  panel: {
    background: 'var(--surface)',
    border: '1px solid var(--hairline)',
    borderRadius: 16,
    padding: '16px 18px',
    boxShadow: '0 24px 60px -20px rgba(0,0,0,0.55)',
    fontFamily: 'var(--font-sans)',
    overflowY: 'auto',
    overscrollBehavior: 'contain',
  },
  h2: {
    font: '700 clamp(17px, 2.4vw, 21px)/1.25 var(--font-sans)',
    color: 'var(--text)',
    margin: '0 0 7px',
    overflowWrap: 'anywhere',
  },
  body: {
    font: '400 13.5px/1.6 var(--font-sans)',
    color: 'var(--text-soft)',
    margin: 0,
    overflowWrap: 'anywhere',
  },
  why: {
    font: '400 12px/1.6 var(--font-sans)',
    color: 'var(--text-faint)',
    margin: '10px 0 0',
    paddingLeft: 10,
    borderLeft: '2px solid var(--hairline)',
    overflowWrap: 'anywhere',
  },
  skip: {
    font: '600 12px var(--font-sans)',
    color: 'var(--text-faint)',
    padding: '7px 2px',
    textDecoration: 'underline',
    textUnderlineOffset: 3,
    whiteSpace: 'nowrap',
  },
  next: {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    font: '700 13px var(--font-sans)', color: '#fff',
    background: 'var(--blue-strong)', padding: '9px 16px', borderRadius: 10,
    whiteSpace: 'nowrap',
  },
}
