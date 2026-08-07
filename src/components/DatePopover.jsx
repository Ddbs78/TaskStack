import { useState } from 'react'
import { motion } from 'framer-motion'
import Icon from './Icon'
import { addDays, dateKey, startOfDay, todayKey } from '../state/time'

// Replaces the native <input type="date"> picker.
//
// showPicker() anchors the OS widget to its input, and ours lives in a bar
// docked to the bottom of the viewport — so the native calendar opened downward
// and got clipped off-screen. This opens upward, is fully inside our layout, and
// matches the app's inked/hand-drawn language instead of an OS chrome popup.
const WD = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export default function DatePopover({ value, onChange, onClose }) {
  const today = todayKey()
  const sel = value || today
  const [cursor, setCursor] = useState(() => {
    const d = new Date(sel + 'T00:00:00')
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  const first = startOfDay(cursor)
  const gridStart = addDays(first, -first.getDay())
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))

  const shift = (n) => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + n, 1))

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 460, damping: 32 }}
      className="st-nodrag absolute bottom-[calc(100%+14px)] left-1/2 z-50 w-[248px] -translate-x-1/2 rounded-2xl p-3"
      style={{ background: 'var(--surface-2)', border: '2px solid var(--ink)', boxShadow: '3px 4px 0 var(--ink-shadow)' }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-2 flex items-center justify-between">
        <button onClick={() => shift(-1)} aria-label="Previous month" className="grid h-6 w-6 place-items-center rounded-full" style={{ color: 'var(--text-soft)' }}>
          <Icon name="chevronRight" size={14} style={{ transform: 'rotate(180deg)' }} />
        </button>
        <span className="font-display text-[13px] font-bold" style={{ color: 'var(--text)' }}>
          {cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </span>
        <button onClick={() => shift(1)} aria-label="Next month" className="grid h-6 w-6 place-items-center rounded-full" style={{ color: 'var(--text-soft)' }}>
          <Icon name="chevronRight" size={14} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {WD.map((d, i) => (
          <div key={i} className="pb-1 text-center text-[9px] font-bold" style={{ color: 'var(--text-faint)' }}>{d}</div>
        ))}
        {cells.map((d) => {
          const k = dateKey(d)
          const inMonth = d.getMonth() === cursor.getMonth()
          const isToday = k === today
          const isSel = k === sel
          return (
            <button
              key={k}
              onClick={() => { onChange(k); onClose() }}
              className="grid h-[26px] place-items-center rounded-lg text-[11px] font-bold"
              style={{
                background: isSel ? 'var(--task-blue-bg)' : 'transparent',
                color: isSel ? 'var(--task-blue-text)' : isToday ? 'var(--coral-strong)' : 'var(--text-soft)',
                opacity: inMonth ? 1 : 0.32,
                border: isToday && !isSel ? '1.5px solid var(--coral-strong)' : '1.5px solid transparent',
              }}
            >
              {d.getDate()}
            </button>
          )
        })}
      </div>

      <div className="mt-2 flex gap-1.5 border-t pt-2" style={{ borderColor: 'var(--hairline)' }}>
        {[['Today', 0], ['Tomorrow', 1], ['Next week', 7]].map(([label, n]) => (
          <button
            key={label}
            onClick={() => { onChange(dateKey(addDays(new Date(), n))); onClose() }}
            className="flex-1 rounded-full py-1 text-[10px] font-bold"
            style={{ background: 'var(--surface)', color: 'var(--text-soft)' }}
          >
            {label}
          </button>
        ))}
      </div>
    </motion.div>
  )
}
