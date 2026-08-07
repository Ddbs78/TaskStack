import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import Icon from './Icon'
import BrandMark from './BrandMark'
import Sticker from './stickers/Sticker'
import { SleepyBlob, Snail, CatLoaf, Ghost, PartyBean, HappyStar } from './stickers/art'
import { ScrawlArrow } from './Doodle'

// The interactive guide.
//
// A scrolly journey rather than a slideshow: a hand-drawn path runs down the
// left and the logo cubes roll along it as you scroll. Every chapter shows a
// LIVE miniature of the real mechanic (not a screenshot), so the guide can't
// drift out of date, and carries the research note behind it.

// ---- little hand-drawn brain, for the psychology chapters -------------------
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

// ---- live miniatures --------------------------------------------------------
function MiniTimeline({ play }) {
  return (
    <div
      className="relative h-[68px] overflow-hidden rounded-[10px]"
      style={{
        background: 'var(--bg-soft)', border: '2px solid var(--ink)',
        backgroundImage: 'repeating-linear-gradient(to right, var(--grid-line) 0, var(--grid-line) 1px, transparent 1px, transparent 12.5%)',
      }}
    >
      <div className="absolute left-[6%] top-[10px] h-[22px] rounded-[6px]" style={{ width: '30%', background: 'var(--task-blue-bg)', border: '2px solid var(--ink)' }} />
      <div className="absolute left-[46%] top-[38px] h-[22px] rounded-[6px]" style={{ width: '24%', background: 'var(--task-blue-bg)', border: '2px solid var(--ink)' }} />
      <motion.div
        className="absolute top-0 bottom-0"
        style={{ width: 2, background: 'var(--now-line)' }}
        initial={{ left: '8%' }}
        animate={play ? { left: ['8%', '88%'] } : { left: '8%' }}
        transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  )
}

function MiniPile({ play }) {
  return (
    <div className="flex flex-col gap-1.5">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="h-[19px] rounded-[7px]"
          style={{ background: 'var(--task-coral-bg)', border: '2px solid var(--ink)' }}
          initial={{ opacity: 0, x: -14 }}
          animate={play ? { opacity: 1, x: 0 } : { opacity: 0.35, x: -6 }}
          transition={{ delay: i * 0.12, type: 'spring', stiffness: 420, damping: 26 }}
        />
      ))}
      <motion.div
        className="flex items-center gap-2 pt-0.5"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={play ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.6 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 380, damping: 20 }}
      >
        <SleepyBlob size={40} />
        <span className="text-[11px] font-bold" style={{ color: 'var(--text-soft)' }}>7 still lurking</span>
      </motion.div>
    </div>
  )
}

function MiniUrgency({ play }) {
  const RAMP = ['#F8D3BE', '#F6C6A8', '#F4B492', '#F4A47B', '#F4936B', '#F4845F', '#EE7550', '#E56742', '#DA5732', '#CC4A28']
  const H = [10, 11, 12, 14, 16, 18, 20, 22, 24, 26]
  return (
    <div className="flex items-end gap-1" style={{ height: 28 }}>
      {H.map((h, i) => (
        <motion.span
          key={i}
          className="flex-1 rounded"
          style={{ background: RAMP[i], border: `1px solid ${RAMP[i]}` }}
          initial={{ height: 6, opacity: 0.18 }}
          animate={play ? { height: h, opacity: i < 7 ? 1 : 0.22 } : { height: 6, opacity: 0.18 }}
          transition={{ delay: i * 0.045, type: 'spring', stiffness: 460, damping: 24 }}
        />
      ))}
    </div>
  )
}

function MiniFinish({ play, onPop }) {
  const [popped, setPopped] = useState(false)
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => { setPopped(true); onPop?.(); setTimeout(() => setPopped(false), 1400) }}
        className="flex items-center gap-2 rounded-[10px] px-3 py-2"
        style={{ background: 'var(--task-blue-bg)', border: '2px solid var(--ink)', boxShadow: '2px 2.5px 0 var(--ink-shadow)' }}
      >
        <span className="grid h-[15px] w-[15px] place-items-center rounded-full border-[1.5px]" style={{ borderColor: 'var(--task-blue-text)' }}>
          {popped && <span className="h-2 w-2 rounded-full" style={{ background: 'var(--task-blue-text)' }} />}
        </span>
        <span className="text-[12px] font-bold" style={{ color: 'var(--task-blue-text)' }}>tick me</span>
      </button>
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
    </div>
  )
}

function MiniViews({ play }) {
  return (
    <div className="flex items-center gap-2">
      {['3-Day', 'Week', 'Month'].map((v, i) => (
        <motion.span
          key={v}
          className="rounded-[9px] px-2.5 py-1.5 text-[11px] font-bold"
          style={{ background: 'var(--surface-2)', border: '2px solid var(--ink)', color: 'var(--text)' }}
          initial={{ opacity: 0, y: 8 }}
          animate={play ? { opacity: 1, y: 0 } : { opacity: 0.3, y: 4 }}
          transition={{ delay: i * 0.12, type: 'spring', stiffness: 420, damping: 24 }}
        >
          {v}
        </motion.span>
      ))}
      <ScrawlArrow width={54} />
    </div>
  )
}

// ---- chapters ---------------------------------------------------------------
const CHAPTERS = [
  {
    id: 'time', title: 'time is the spine', Art: Ghost,
    blurb: 'A red line walks across your day in real time. Tasks sit where they actually happen.',
    why: 'ADHD brains discount the future steeply — "not now" is nearly invisible. Making time a moving object you can watch attacks time blindness head-on.',
    Demo: MiniTimeline,
  },
  {
    id: 'pile', title: 'the pile has a lid', Art: SleepyBlob,
    blurb: 'Only three overdue tasks show. A character holds the rest, and one tap bumps them to tomorrow.',
    why: 'Unbounded visual debt causes task-initiation paralysis, not urgency. A little is salience; a lot is shutdown. This is the app’s founding assumption, corrected.',
    Demo: MiniPile,
  },
  {
    id: 'urgency', title: 'say what matters', Art: Snail,
    blurb: 'Rate a task 1–10. The bars deepen and grow, so you read the level before the number.',
    why: 'Deciding what to do first is itself executive work. Rating once, up front, means the app can answer "what now?" later instead of you.',
    Demo: MiniUrgency,
  },
  {
    id: 'now', title: 'right now', Art: CatLoaf,
    blurb: 'One task. Two choices: done, or not this one. Everything else dims away.',
    why: 'The bottleneck is starting, and the load that blocks starting is choosing. Every extra control here would re-add the very thing it removes.',
    Demo: MiniViews,
  },
  {
    id: 'finish', title: 'finishing gets loud', Art: PartyBean,
    blurb: 'Tick the box — the real celebration fires, right here.',
    why: 'If debt is the only thing with visual weight, the app only ever speaks when you’re behind. Finishing has to be the louder signal.',
    Demo: MiniFinish,
  },
  {
    id: 'views', title: 'three ways to look', Art: HappyStar,
    blurb: 'Day, week and month drill into each other. Click a month cell to open that week; a week header to open that day.',
    why: 'Zooming out is how you notice a week is overloaded before it arrives — planning ahead is exactly what a short time-horizon makes hard.',
    Demo: MiniViews,
  },
]

export default function Guide({ open, onClose }) {
  const prefersReduced = useReducedMotion()
  const scrollRef = useRef(null)
  const [active, setActive] = useState(0)
  const [progress, setProgress] = useState(0)

  // remember where they left off
  useEffect(() => {
    if (!open) return
    const saved = Number(localStorage.getItem('flow.guide.chapter') || 0)
    setActive(saved)
    if (!saved) return
    // scroll to the remembered chapter's actual offset (the previous version
    // multiplied the index by 0.0001, which never moved anything)
    requestAnimationFrame(() => {
      const el = scrollRef.current
      const node = el?.querySelector(`#gch-${CHAPTERS[saved]?.id}`)
      if (node) el.scrollTop = Math.max(0, node.offsetTop - 40)
    })
  }, [open])

  useEffect(() => {
    if (open) localStorage.setItem('flow.guide.chapter', String(active))
  }, [active, open])

  const onScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const max = el.scrollHeight - el.clientHeight
    const p = max > 0 ? el.scrollTop / max : 0
    setProgress(p)
    // which chapter is nearest the middle of the viewport?
    const mid = el.scrollTop + el.clientHeight * 0.4
    let best = 0
    CHAPTERS.forEach((c, i) => {
      const node = el.querySelector(`#gch-${c.id}`)
      if (node && node.offsetTop <= mid) best = i
    })
    setActive(best)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[95]"
            style={{ background: 'var(--bg)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
          <motion.div
            className="fixed inset-0 z-[96] flex flex-col"
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
          >
            {/* header */}
            <div className="flex shrink-0 items-center justify-between px-5 pt-[max(14px,env(safe-area-inset-top))] pb-3">
              <div className="flex items-center gap-3">
                <BrandMark variant="mark" height={30} />
                <span className="font-display text-[17px] font-bold" style={{ color: 'var(--text)' }}>
                  how this works
                </span>
              </div>
              <button
                onClick={onClose}
                className="rounded-full px-3 py-1.5 text-[12px] font-bold"
                style={{ background: 'var(--surface-2)', color: 'var(--text-soft)', border: '2px solid var(--ink)' }}
              >
                skip the tour ›
              </button>
            </div>

            {/* progress rail */}
            <div className="mx-5 h-[3px] shrink-0 overflow-hidden rounded-full" style={{ background: 'var(--surface-2)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'var(--coral)' }}
                animate={{ width: `${Math.round(progress * 100)}%` }}
                transition={{ type: 'spring', stiffness: 240, damping: 30 }}
              />
            </div>

            {/* journey */}
            <div ref={scrollRef} onScroll={onScroll} className="no-scrollbar relative flex-1 overflow-y-auto">
              <div className="mx-auto flex max-w-2xl gap-4 px-5 pb-32 pt-6">
                {/* the drawn path + rolling cubes */}
                <div className="relative w-[46px] shrink-0">
                  <svg className="sticky top-0" width="46" height="420" viewBox="0 0 46 420" aria-hidden="true">
                    <path
                      d="M23 6 C10 60, 36 110, 23 165 S 10 260, 23 315 S 36 380, 23 414"
                      fill="none" stroke="var(--coral)" strokeWidth="2.6" strokeLinecap="round"
                      strokeDasharray="1 9" opacity=".6"
                    />
                    <motion.g
                      animate={prefersReduced ? {} : { y: progress * 360, rotate: progress * 540 }}
                      transition={{ type: 'spring', stiffness: 120, damping: 22 }}
                      style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                    >
                      <g transform="translate(23 26)">
                        <path d="M0 -11 L11 -5.5 L0 0 L-11 -5.5Z" fill="var(--coral)" stroke="var(--ink)" strokeWidth="2.4" strokeLinejoin="round" />
                        <path d="M-11 -5.5 L0 0 L0 11 L-11 5.5Z" fill="var(--coral)" stroke="var(--ink)" strokeWidth="2.4" strokeLinejoin="round" />
                        <path d="M11 -5.5 L11 5.5 L0 11 L0 0Z" fill="var(--coral-strong)" stroke="var(--ink)" strokeWidth="2.4" strokeLinejoin="round" />
                      </g>
                    </motion.g>
                  </svg>
                </div>

                <div className="min-w-0 flex-1">
                  {/* opening */}
                  <motion.div
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 28 }}
                    className="mb-10"
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <Brain size={62} pulse={!prefersReduced} />
                      <div>
                        <div className="font-display text-[22px] font-extrabold leading-tight" style={{ color: 'var(--text)' }}>
                          built for brains that lose track of time
                        </div>
                        <div className="mt-1 text-[13px]" style={{ color: 'var(--text-soft)' }}>
                          Every choice here is aimed at one thing: making it easier to start.
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {CHAPTERS.map((c, i) => {
                    const isActive = i === active
                    return (
                      <div key={c.id} id={`gch-${c.id}`} className="mb-12">
                        <motion.div
                          initial={{ opacity: 0, y: 22 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: false, amount: 0.35 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                        >
                          <div className="mb-2 flex items-center gap-2.5">
                            <motion.span
                              animate={isActive && !prefersReduced ? { rotate: [0, -6, 4, 0], y: [0, -3, 0] } : {}}
                              transition={{ duration: 1.6, repeat: isActive ? Infinity : 0, repeatDelay: 1.4 }}
                              className="inline-flex"
                            >
                              <c.Art size={44} />
                            </motion.span>
                            <div className="font-display text-[18px] font-extrabold" style={{ color: 'var(--text)' }}>
                              {c.title}
                            </div>
                          </div>

                          <p className="mb-3 text-[13px] leading-relaxed" style={{ color: 'var(--text-soft)' }}>
                            {c.blurb}
                          </p>

                          <div className="mb-3">
                            <c.Demo play={isActive} />
                          </div>

                          <div
                            className="pl-3 text-[12px] leading-relaxed"
                            style={{ borderLeft: '3px solid var(--coral)', color: 'var(--task-coral-tint-text)' }}
                          >
                            {c.why}
                          </div>
                        </motion.div>
                      </div>
                    )
                  })}

                  {/* closing */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.4 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                    className="flex flex-col items-center gap-3 pt-4 text-center"
                  >
                    <Sticker Art={HappyStar} rest={5} size={92} calm={prefersReduced} />
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
                  </motion.div>
                </div>
              </div>
            </div>

            {/* footer */}
            <div
              className="flex shrink-0 items-center justify-between px-5 py-3"
              style={{ borderTop: '2px solid var(--ink)' }}
            >
              <span className="text-[11px]" style={{ color: 'var(--text-faint)' }}>
                chapter {Math.min(active + 1, CHAPTERS.length)} of {CHAPTERS.length} · scroll to continue
              </span>
              <div className="flex gap-1.5">
                {CHAPTERS.map((c, i) => (
                  <button
                    key={c.id}
                    aria-label={`Go to ${c.title}`}
                    onClick={() => {
                      const el = scrollRef.current
                      const node = el?.querySelector(`#gch-${c.id}`)
                      if (node) el.scrollTo({ top: node.offsetTop - 40, behavior: prefersReduced ? 'auto' : 'smooth' })
                    }}
                    className="h-2 rounded-full transition-all"
                    style={{ width: i === active ? 20 : 8, background: i === active ? 'var(--coral)' : 'var(--surface-2)' }}
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
