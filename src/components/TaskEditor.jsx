import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import TimePopover from './TimePopover'
import Icon from './Icon'
import { addDays, dateKey } from '../state/time'

// Tap a task to edit title / date / time. Lightweight, single card.
export default function TaskEditor({ task, onClose, store }) {
  const [title, setTitle] = useState(task?.title ?? '')
  const [date, setDate] = useState(task?.date ?? dateKey(new Date()))
  const [time, setTime] = useState({ start: task?.start ?? null, end: task?.end ?? null })

  if (!task) return null
  const save = () => {
    store.updateTask(task.id, { title: title.trim() || task.title, date, start: time.start, end: time.end, anytime: time.start == null })
    onClose()
  }

  return (
    <AnimatePresence>
      <motion.div key="ed-overlay" className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div
        key="ed-modal"
        initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 440, damping: 32 }}
        className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,400px)] -translate-x-1/2 -translate-y-1/2 rounded-[28px] p-5 shadow-2xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--hairline)' }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl" style={{ color: 'var(--text)' }}>Edit task</h2>
          <button onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full" style={{ color: 'var(--text-faint)' }}><Icon name="x" size={20} /></button>
        </div>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && save()}
          className="font-display mb-4 w-full rounded-2xl px-4 py-3 text-xl outline-none"
          style={{ background: 'var(--surface-2)', color: 'var(--text)' }}
        />

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button onClick={() => setDate(dateKey(new Date()))} className="rounded-full px-3 py-1.5 text-sm font-bold" style={{ background: date === dateKey(new Date()) ? 'var(--blue-strong)' : 'var(--surface-2)', color: date === dateKey(new Date()) ? '#fff' : 'var(--text-soft)' }}>Today</button>
          <button onClick={() => setDate(dateKey(addDays(new Date(), 1)))} className="rounded-full px-3 py-1.5 text-sm font-bold" style={{ background: date === dateKey(addDays(new Date(), 1)) ? 'var(--blue-strong)' : 'var(--surface-2)', color: date === dateKey(addDays(new Date(), 1)) ? '#fff' : 'var(--text-soft)' }}>Tmrw</button>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-full px-3 py-1.5 text-sm" style={{ background: 'var(--surface-2)', color: 'var(--text)' }} />
        </div>

        <div className="mb-4 flex justify-center">
          <TimePopover start={time.start} end={time.end} onChange={setTime} onClose={() => {}} />
        </div>

        <div className="flex gap-2">
          <button onClick={() => { store.deleteTask(task.id); onClose() }} className="rounded-full px-4 py-2.5 text-sm font-bold" style={{ background: 'var(--surface-2)', color: 'var(--coral-strong)' }}>Delete</button>
          <button onClick={save} className="flex-1 rounded-full px-4 py-2.5 text-sm font-bold" style={{ background: 'var(--blue-strong)', color: '#fff' }}>Save</button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
