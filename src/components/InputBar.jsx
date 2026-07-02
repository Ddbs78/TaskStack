import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import TimePopover from './TimePopover'
import Icon from './Icon'
import { parseInput } from '../nlp/parse'
import { addDays, dateKey } from '../state/time'

const VIEWS = [
  { id: 'three', label: '3-Day' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
]

const EDGE = 16

export default function InputBar({ onAdd, view, setView, onOpenSettings, onOpenAssistant, defaultRecurrence }) {
  const [text, setText] = useState('')
  const [dateOverride, setDateOverride] = useState(null) // explicit date key from chips
  const [time, setTime] = useState({ start: null, end: null })
  const [showTime, setShowTime] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [pos, setPos] = useState(null) // {x,y} once dragged; null = docked bottom-center
  const [onEdge, setOnEdge] = useState(false)
  const draggingRef = useRef(false) // ref, not state → the drag never triggers a re-render
  const inputRef = useRef(null)
  const dateRef = useRef(null)
  const barRef = useRef(null)
  const innerRef = useRef(null)

  const parsed = useMemo(() => parseInput(text), [text])
  const effectiveDate = dateOverride || (parsed.detectedDate ? parsed.date : dateKey(new Date()))
  const effectiveTime = time.start != null ? time : { start: parsed.start, end: parsed.end }

  const submit = () => {
    const title = parsed.title.trim()
    if (!title) return
    onAdd({
      title,
      date: effectiveDate,
      start: effectiveTime.start,
      end: effectiveTime.end,
      recurrence: defaultRecurrence !== 'none' ? defaultRecurrence : null,
    })
    setText('')
    setDateOverride(null)
    setTime({ start: null, end: null })
    setShowTime(false)
    inputRef.current?.focus()
  }

  // ---- move the bar by grabbing its border (no resize — minimize/expand covers
  // size). Imperative during drag (no per-frame re-render → no child lag); commits
  // to state on release; magnetizes home near the bottom-center dock. -----------
  const updateEdge = (e) => {
    if (draggingRef.current) return
    // never start a move from an interactive control (buttons, input, and their
    // popovers like the time picker, which live *above* the bar in the DOM).
    if (e.target?.closest?.('button, input, [role="button"], .st-nodrag')) { setOnEdge(false); return }
    const r = barRef.current?.getBoundingClientRect()
    if (!r) return
    // must be *inside* the bar rect, then within EDGE of a border — otherwise a
    // point above the bar (e.g. an open popover) falsely reads as "near the top edge".
    const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom
    const near = inside && (
      e.clientX - r.left < EDGE || r.right - e.clientX < EDGE ||
      e.clientY - r.top < EDGE || r.bottom - e.clientY < EDGE
    )
    setOnEdge(near)
  }

  const onBarPointerDown = (e) => {
    if (!onEdge || e.button === 2) return
    if (e.target?.closest?.('button, input, [role="button"], .st-nodrag')) return
    e.preventDefault()
    const inner = innerRef.current
    const wrap = inner.parentElement
    const r = inner.getBoundingClientRect()
    const w = r.width, h = r.height
    const offx = e.clientX - r.left, offy = e.clientY - r.top
    const dockLeft = window.innerWidth / 2 - w / 2
    const dockTop = window.innerHeight - 16 - h
    const startX = e.clientX, startY = e.clientY
    const THRESH = 5 // don't detach until it's a real drag → a plain press never moves the bar
    let pinned = false, last = null

    const pin = () => {
      // pin to the current on-screen spot BEFORE clearing the docked transform/bottom
      // (otherwise it flashes to left:50%/top:0 — the old top-right-corner teleport).
      const wr = wrap.getBoundingClientRect()
      wrap.style.transition = 'none'; wrap.style.transform = 'none'; wrap.style.bottom = 'auto'
      wrap.style.left = wr.left + 'px'; wrap.style.top = wr.top + 'px'
      document.body.style.userSelect = 'none'
      barRef.current?.classList.add('cursor-moving')
      draggingRef.current = true
      pinned = true
    }
    const move = (ev) => {
      if (!pinned) {
        if (Math.abs(ev.clientX - startX) < THRESH && Math.abs(ev.clientY - startY) < THRESH) return
        pin()
      }
      let x = Math.min(window.innerWidth - w - 6, Math.max(6, ev.clientX - offx))
      let y = Math.min(window.innerHeight - h - 6, Math.max(6, ev.clientY - offy))
      const dist = Math.hypot(x - dockLeft, y - dockTop)
      if (dist < 90) { const pull = (1 - dist / 90) * 0.7; x += (dockLeft - x) * pull; y += (dockTop - y) * pull }
      wrap.style.left = x + 'px'; wrap.style.top = y + 'px'
      last = { x, y, dist }
    }
    const up = () => {
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up)
      draggingRef.current = false
      document.body.style.userSelect = ''
      barRef.current?.classList.remove('cursor-moving')
      if (!pinned) return // never crossed the threshold → a plain press, bar stays docked
      if (!last || last.dist < 70) {
        // clear the imperative styles so React's docked style fully re-applies
        wrap.style.left = ''; wrap.style.top = ''; wrap.style.bottom = ''
        wrap.style.transform = ''; wrap.style.transition = ''
        setPos(null)
      } else {
        wrap.style.transition = ''
        setPos({ x: last.x, y: last.y })
      }
    }
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up)
  }

  const innerWidth = minimized ? 'min(88vw, 23rem)' : 'min(92vw, 44rem)'
  const wrapStyle = pos
    ? { left: pos.x, top: pos.y }
    : { left: '50%', bottom: 'max(14px, env(safe-area-inset-bottom))', transform: 'translateX(-50%)' }
  const cursorClass = onEdge ? 'cursor-move-4' : '' // drag cursor toggled imperatively

  return (
    <div className="pointer-events-none fixed z-40" style={wrapStyle}>
      <div
        ref={innerRef}
        className="pointer-events-auto"
        style={{ width: innerWidth, transition: 'width 0.28s var(--ease-spring)' }}
      >
        {/* view menu */}
        <AnimatePresence>
          {showMenu && !minimized && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              className="mb-3 ml-auto w-44 overflow-hidden rounded-2xl p-1.5 shadow-2xl"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--hairline)' }}
            >
              {VIEWS.map((v) => (
                <button
                  key={v.id}
                  onClick={() => { setView(v.id); setShowMenu(false) }}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold"
                  style={{ background: view === v.id ? 'var(--surface)' : 'transparent', color: 'var(--text)' }}
                >
                  {v.label} {view === v.id && <span style={{ color: 'var(--blue-strong)' }}>•</span>}
                </button>
              ))}
              <div className="my-1 h-px" style={{ background: 'var(--hairline)' }} />
              <button onClick={() => { onOpenAssistant(); setShowMenu(false) }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold" style={{ color: 'var(--text)' }}><Icon name="sparkles" size={16} /> Ask StackTask</button>
              <button onClick={() => { onOpenSettings(); setShowMenu(false) }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold" style={{ color: 'var(--text)' }}><Icon name="gear" size={16} /> Settings</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* the bar */}
        <div className="relative">
          <button
            onClick={() => setMinimized((m) => !m)}
            className="absolute -top-2 left-5 z-10 grid h-6 w-6 place-items-center rounded-full transition-transform active:scale-90"
            style={{ background: 'var(--surface-2)', border: '0.5px solid var(--hairline)', color: 'var(--text-soft)' }}
            aria-label={minimized ? 'Expand bar' : 'Minimize bar'}
          >
            <Icon name={minimized ? 'plus' : 'minus'} size={13} stroke={2.6} />
          </button>

          <div
            ref={barRef}
            onPointerMove={updateEdge}
            onPointerLeave={() => setOnEdge(false)}
            onPointerDown={onBarPointerDown}
            className={`js-chatbar relative flex select-none items-center gap-1 rounded-[28px] px-3 py-2.5 backdrop-blur ${cursorClass}`}
            style={{ background: 'color-mix(in srgb, var(--surface) 94%, transparent)', border: '0.5px solid var(--hairline)', boxShadow: '0 14px 38px -12px rgba(0,0,0,0.55)' }}
          >
            <input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="What Needs Doing…"
              className="font-display min-w-0 flex-1 select-text bg-transparent px-3 text-[clamp(18px,2.6vw,28px)] outline-none placeholder:opacity-50"
              style={{ color: 'var(--text)' }}
            />

            {minimized ? (
              <button
                onClick={submit}
                disabled={!parsed.title.trim()}
                aria-label="Add task"
                className="grid h-9 w-9 place-items-center rounded-full transition-transform active:scale-90 disabled:opacity-30"
                style={{ background: 'var(--blue-strong)', color: '#fff' }}
              >
                <Icon name="plus" size={18} stroke={2.2} />
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <PillBtn onClick={() => setDateOverride(dateKey(new Date()))} active={effectiveDate === dateKey(new Date())}>Today</PillBtn>
                <PillBtn onClick={() => setDateOverride(dateKey(addDays(new Date(), 1)))} active={effectiveDate === dateKey(addDays(new Date(), 1))}>Tmrw</PillBtn>
                <div className="relative hidden sm:block">
                  <button
                    type="button"
                    onClick={() => { const el = dateRef.current; if (el?.showPicker) el.showPicker(); else el?.focus() }}
                    className="rounded-full px-1.5 py-1 text-sm tabular-nums"
                    style={{ color: 'var(--text-soft)' }}
                  >
                    {effectiveDate.slice(5, 7)}/{effectiveDate.slice(8, 10)}
                  </button>
                  <input
                    ref={dateRef}
                    type="date"
                    aria-label="Custom date"
                    tabIndex={-1}
                    value={effectiveDate}
                    onChange={(e) => setDateOverride(e.target.value)}
                    className="pointer-events-none absolute bottom-0 left-1/2 h-0 w-0 opacity-0"
                  />
                </div>
                <div className="relative">
                  <IconBtn onClick={() => setShowTime((v) => !v)} active={showTime || effectiveTime.start != null} title="Set time"><Icon name="clock" size={19} /></IconBtn>
                  <AnimatePresence>
                    {showTime && (
                      <div className="absolute bottom-[calc(100%+14px)] left-1/2 z-50 -translate-x-1/2">
                        <TimePopover
                          start={effectiveTime.start}
                          end={effectiveTime.end}
                          onChange={(t) => setTime(t)}
                          onClose={() => setShowTime(false)}
                        />
                      </div>
                    )}
                  </AnimatePresence>
                </div>
                <IconBtn onClick={() => setShowMenu((v) => !v)} active={showMenu} title="More"><Icon name="dots" size={19} /></IconBtn>
                <button
                  onClick={submit}
                  disabled={!parsed.title.trim()}
                  aria-label="Add task"
                  className="ml-1 grid h-10 w-10 place-items-center rounded-full transition-transform active:scale-90 disabled:opacity-30"
                  style={{ background: 'var(--blue-strong)', color: '#fff' }}
                >
                  <Icon name="plus" size={20} stroke={2.2} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function PillBtn({ children, onClick, active }) {
  return (
    <button
      onClick={onClick}
      className="rounded-full px-2.5 py-1.5 text-sm font-bold transition-colors"
      style={{ background: active ? 'var(--surface-2)' : 'transparent', color: active ? 'var(--text)' : 'var(--text-soft)' }}
    >
      {children}
    </button>
  )
}
function IconBtn({ children, onClick, active, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="grid h-9 w-9 place-items-center rounded-full text-base transition-colors"
      style={{ background: active ? 'var(--surface-2)' : 'transparent', color: 'var(--text-soft)' }}
    >
      {children}
    </button>
  )
}
