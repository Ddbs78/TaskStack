import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

// minutes-from-midnight <-> {h:1-12, m, ap:'AM'|'PM'}
function toParts(mins) {
  if (mins == null) return { h: 9, m: 0, ap: 'AM' }
  const ap = mins >= 720 ? 'PM' : 'AM'
  let h = Math.floor(mins / 60) % 12
  if (h === 0) h = 12
  return { h, m: mins % 60, ap }
}
function toMins({ h, m, ap }) {
  let h24 = h % 12
  if (ap === 'PM') h24 += 12
  return h24 * 60 + m
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1)
const MINS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]

// a tiny tap-to-cycle number control (reliable, no native select quirks)
function Spin({ options, value, fmt, onChange }) {
  const idx = Math.max(0, options.indexOf(value))
  const step = (d) => onChange(options[(idx + d + options.length) % options.length])
  return (
    <div className="flex items-center">
      <button onClick={() => step(-1)} className="px-1 text-[12px]" style={{ color: 'var(--text-faint)' }} aria-label="decrease">‹</button>
      <span className="min-w-[20px] text-center text-[15px] tabular-nums" style={{ color: 'var(--text)' }}>{fmt(value)}</span>
      <button onClick={() => step(1)} className="px-1 text-[12px]" style={{ color: 'var(--text-faint)' }} aria-label="increase">›</button>
    </div>
  )
}

function Chip({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[13px]" style={{ color: 'var(--text-soft)' }}>{label}</span>
      <div className="flex items-center gap-0.5 rounded-xl px-1.5 py-1" style={{ background: 'var(--surface)', border: '0.5px solid var(--hairline)' }}>
        <Spin options={HOURS} value={value.h} fmt={(v) => v} onChange={(h) => onChange({ ...value, h })} />
        <span style={{ color: 'var(--text-faint)' }}>:</span>
        <Spin options={MINS} value={value.m} fmt={(v) => String(v).padStart(2, '0')} onChange={(m) => onChange({ ...value, m })} />
        <div className="ml-1 flex overflow-hidden rounded-lg" style={{ background: 'var(--surface-2)' }}>
          {['AM', 'PM'].map((ap) => (
            <button
              key={ap}
              onClick={() => onChange({ ...value, ap })}
              className="px-2 py-1 text-[11px] font-bold"
              style={{ background: value.ap === ap ? 'var(--blue-strong)' : 'transparent', color: value.ap === ap ? '#fff' : 'var(--text-soft)' }}
            >
              {ap}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// iOS-style: an "Anytime" switch, then From / To chips with AM·PM.
export default function TimePopover({ start, end, onChange, onClose }) {
  const [anytime, setAnytime] = useState(start == null)
  const [from, setFrom] = useState(() => toParts(start ?? 540))
  const [to, setTo] = useState(() => toParts(end ?? (start != null ? start + 60 : 600)))
  const ref = useRef(null)

  // Dismiss on outside-click or Escape — the popover previously ignored onClose
  // entirely, so it could only be closed by toggling the clock again.
  useEffect(() => {
    if (!onClose) return undefined
    const onDown = (e) => {
      // ignore the clock trigger, or clicking it to close would immediately reopen
      if (e.target.closest?.('[data-time-trigger]')) return
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    // defer so the click that opened it doesn't immediately close it
    const id = setTimeout(() => {
      document.addEventListener('pointerdown', onDown, true)
      document.addEventListener('keydown', onKey)
    }, 0)
    return () => {
      clearTimeout(id)
      document.removeEventListener('pointerdown', onDown, true)
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const emit = (a, f, t) => {
    if (a) onChange({ start: null, end: null })
    else onChange({ start: toMins(f), end: toMins(t) })
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 10, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 480, damping: 30 }}
      className="relative w-[262px] rounded-[var(--radius-blob)] p-4 shadow-2xl"
      style={{ background: 'var(--surface-2)', border: '0.5px solid var(--hairline)' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[15px] font-semibold" style={{ color: 'var(--text)' }}>Anytime</span>
        <button
          onClick={() => { const a = !anytime; setAnytime(a); emit(a, from, to) }}
          className="relative h-6 w-11 shrink-0 rounded-full transition-colors"
          style={{ background: anytime ? 'var(--blue-strong)' : 'var(--surface)' }}
          aria-label="Toggle anytime"
        >
          <motion.span layout transition={{ type: 'spring', stiffness: 600, damping: 32 }}
            className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow" style={{ left: anytime ? 22 : 2 }} />
        </button>
      </div>

      <div style={{ opacity: anytime ? 0.4 : 1, pointerEvents: anytime ? 'none' : 'auto' }}>
        <div className="my-2.5 h-px" style={{ background: 'var(--hairline)' }} />
        <div className="flex flex-col gap-2.5">
          <Chip label="From" value={from} onChange={(f) => { setFrom(f); emit(false, f, to) }} />
          <Chip label="To" value={to} onChange={(t) => { setTo(t); emit(false, from, t) }} />
        </div>
      </div>

      <div className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45"
        style={{ background: 'var(--surface-2)', borderRight: '0.5px solid var(--hairline)', borderBottom: '0.5px solid var(--hairline)' }} />
    </motion.div>
  )
}
