import { useRef } from 'react'

// Ten-segment urgency / importance control.
//
// Filled segments deepen in colour AND step up in height, so the level is
// legible before the number is read. Ramp stays inside the warm coral family —
// this is a weighting, not an alarm.
const RAMP = [
  '#F8D3BE', '#F6C6A8', '#F4B492', '#F4A47B', '#F4936B',
  '#F4845F', '#EE7550', '#E56742', '#DA5732', '#CC4A28',
]
const HEIGHTS = [12, 13, 14, 16, 18, 20, 22, 25, 27, 30]

const WORDS = [
  'whenever', 'whenever', 'whenever',
  'sometime', 'sometime',
  'soon-ish', 'soon-ish',
  "this one's real", "this one's real", 'drop everything',
]

export default function UrgencyBar({ value, off = false, onChange, onToggleOff, calm = false }) {
  const rowRef = useRef(null)
  const dragging = useRef(false)

  // Pointer position -> segment. Imperative during the drag: we only commit on
  // change, never per-frame, so scrubbing stays cheap.
  const segFromX = (clientX) => {
    const r = rowRef.current?.getBoundingClientRect()
    if (!r) return null
    const pct = (clientX - r.left) / r.width
    return Math.min(10, Math.max(1, Math.ceil(pct * 10)))
  }
  const apply = (clientX) => {
    const n = segFromX(clientX)
    if (n != null && n !== value) onChange(n)
  }

  const onDown = (e) => {
    if (off) return
    e.preventDefault()
    dragging.current = true
    apply(e.clientX)
    const move = (ev) => dragging.current && apply(ev.clientX)
    const up = () => {
      dragging.current = false
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const shown = off ? 0 : value ?? 0

  return (
    <div className="select-none">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-[12px]" style={{ color: 'var(--text-soft)' }}>how much does this matter?</span>
        <span
          className="text-[12px] font-semibold"
          style={{ color: off || !value ? 'var(--text-faint)' : RAMP[value - 1] }}
        >
          {off ? 'not ranked' : value ? `${value} · ${WORDS[value - 1]}` : 'unranked'}
        </span>
      </div>

      <div
        ref={rowRef}
        onPointerDown={onDown}
        role="slider"
        aria-label="Urgency"
        aria-valuemin={1}
        aria-valuemax={10}
        aria-valuenow={off ? undefined : value ?? undefined}
        aria-disabled={off}
        tabIndex={off ? -1 : 0}
        onKeyDown={(e) => {
          if (off) return
          if (e.key === 'ArrowRight' || e.key === 'ArrowUp') onChange(Math.min(10, (value ?? 0) + 1))
          if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') onChange(Math.max(1, (value ?? 1) - 1))
        }}
        className={`flex items-end gap-1 outline-none ${off ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        style={{ height: 30, opacity: off ? 0.4 : 1, transition: 'opacity .2s' }}
      >
        {/* CSS transitions, not Framer: the fill must never depend on the rAF
            loop, so it stays correct even when the tab is backgrounded. */}
        {HEIGHTS.map((h, i) => {
          const filled = i < shown
          return (
            <span
              key={i}
              className="flex-1 rounded"
              style={{
                height: h,
                background: filled ? RAMP[i] : 'var(--surface-2)',
                transform: filled && !calm ? 'translateY(-1px)' : 'none',
                transition: calm
                  ? 'background .12s linear'
                  : `background .22s ease-out ${filled ? i * 14 : 0}ms, transform .3s var(--ease-spring) ${filled ? i * 14 : 0}ms`,
              }}
            />
          )
        })}
      </div>

      <button
        type="button"
        onClick={() => onToggleOff(!off)}
        className="mt-3 flex w-full items-center gap-2 border-t pt-3 text-left"
        style={{ borderColor: 'var(--hairline)' }}
      >
        <span
          className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-md border-[1.5px]"
          style={{
            borderColor: off ? 'var(--coral-strong)' : 'var(--text-faint)',
            background: off ? 'var(--coral-strong)' : 'transparent',
          }}
        >
          {off && (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.5l4.2 4.2L19 7" />
            </svg>
          )}
        </span>
        <span className="text-[12px]" style={{ color: 'var(--text-soft)' }}>
          doesn&apos;t matter — it&apos;s happening anyway
        </span>
      </button>
    </div>
  )
}
