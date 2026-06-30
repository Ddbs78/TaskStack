import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import TimePopover from './TimePopover'
import Icon from './Icon'
import { parseInput } from '../nlp/parse'
import { addDays, dateKey, fmtRange, formatHeader, keyToDate } from '../state/time'

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
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)
  const barRef = useRef(null)
  const innerRef = useRef(null)
  const dragOff = useRef({ dx: 0, dy: 0 })

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

  const chipDate = useMemo(() => {
    const k = effectiveDate
    const today = dateKey(new Date())
    if (k === today) return 'Today'
    if (k === dateKey(addDays(new Date(), 1))) return 'Tomorrow'
    return formatHeader(keyToDate(k)).replace(/,.*/, (m) => m) // keep full
  }, [effectiveDate])

  const showChips = text.trim().length > 0

  // ---- drag from the bar's border (cursor becomes the move symbol) ----------
  const updateEdge = (e) => {
    if (dragging) return
    const r = barRef.current?.getBoundingClientRect()
    if (!r) return
    const near =
      e.clientX - r.left < EDGE || r.right - e.clientX < EDGE ||
      e.clientY - r.top < EDGE || r.bottom - e.clientY < EDGE
    setOnEdge(near)
  }
  const beginDrag = (e) => {
    if (!onEdge || e.button === 2) return
    const r = innerRef.current.getBoundingClientRect()
    dragOff.current = { dx: e.clientX - r.left, dy: e.clientY - r.top }
    setDragging(true)
    const move = (ev) => {
      const w = r.width, h = r.height
      const x = Math.min(window.innerWidth - w - 6, Math.max(6, ev.clientX - dragOff.current.dx))
      const y = Math.min(window.innerHeight - h - 6, Math.max(6, ev.clientY - dragOff.current.dy))
      setPos({ x, y })
    }
    const up = () => {
      setDragging(false)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const wrapStyle = pos
    ? { left: pos.x, top: pos.y }
    : { left: '50%', bottom: 'max(14px, env(safe-area-inset-bottom))', transform: 'translateX(-50%)' }
  const cursorClass = dragging ? 'cursor-moving' : onEdge ? 'cursor-move-4' : ''

  return (
    <div className="pointer-events-none fixed z-40 px-3" style={wrapStyle}>
      <div
        ref={innerRef}
        className="pointer-events-auto"
        style={{ width: minimized ? 'min(88vw, 23rem)' : 'min(92vw, 44rem)', transition: 'width 0.28s var(--ease-spring)' }}
      >
        {/* preview chips */}
        <AnimatePresence>
          {showChips && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="mb-2 flex flex-wrap items-center gap-2 px-2"
            >
              <Chip active>{chipDate}</Chip>
              <Chip active={effectiveTime.start != null}>{fmtRange(effectiveTime.start, effectiveTime.end)}</Chip>
              {parsed.title && parsed.title !== text.trim() && (
                <span className="text-xs" style={{ color: 'var(--text-faint)' }}>→ “{parsed.title}”</span>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* time popover */}
        <AnimatePresence>
          {showTime && !minimized && (
            <div className="mb-3 flex justify-end pr-6">
              <TimePopover
                start={effectiveTime.start}
                end={effectiveTime.end}
                onChange={(t) => setTime(t)}
                onClose={() => setShowTime(false)}
              />
            </div>
          )}
        </AnimatePresence>

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
            onPointerDown={beginDrag}
            className={`js-chatbar flex items-center gap-1 rounded-[28px] px-3 py-2.5 backdrop-blur ${cursorClass}`}
            style={{ background: 'color-mix(in srgb, var(--surface) 94%, transparent)', border: '0.5px solid var(--hairline)', boxShadow: '0 14px 38px -12px rgba(0,0,0,0.55)' }}
          >
            <input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="What Needs Doing…"
              className="font-display min-w-0 flex-1 bg-transparent px-3 text-[clamp(18px,2.6vw,28px)] outline-none placeholder:opacity-50"
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
                <label className="hidden sm:block">
                  <span className="sr-only">Custom date</span>
                  <input
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => setDateOverride(e.target.value)}
                    className="w-[34px] cursor-pointer rounded-full bg-transparent text-center text-sm"
                    style={{ color: 'var(--text-soft)' }}
                  />
                </label>
                <IconBtn onClick={() => setShowTime((v) => !v)} active={showTime || effectiveTime.start != null} title="Set time"><Icon name="clock" size={19} /></IconBtn>
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

function Chip({ children, active }) {
  return (
    <span
      className="rounded-full px-3 py-1 text-xs font-bold"
      style={{ background: active ? 'var(--blue-strong)' : 'var(--surface-2)', color: active ? '#fff' : 'var(--text-soft)' }}
    >
      {children}
    </span>
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
