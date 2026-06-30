import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Icon from './Icon'
import { ask } from '../ai/assistant'

const SUGGESTIONS = ["What's overdue?", 'What do I have today?', "Move today's tasks to tomorrow"]

export default function AssistantPanel({ open, onClose, store }) {
  const [log, setLog] = useState([
    { role: 'flow', text: 'Hey — ask me what’s coming up, or tell me to move things around.' },
  ])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [log, open])

  const send = async (msg) => {
    const text = (msg ?? input).trim()
    if (!text || busy) return
    setInput('')
    setLog((l) => [...l, { role: 'user', text }])
    setBusy(true)
    const { reply, actions } = await ask(text, store.tasks, store.settings)
    // apply structured actions to the store
    for (const a of actions) {
      if (a.type === 'add') store.addTask({ title: a.title, date: a.date, start: a.start, end: a.end })
      else if (a.type === 'bulkPatch') store.bulkPatch(a.ids, a.patch)
      else if (a.type === 'completeMany') a.ids.forEach((id) => store.toggleTask(id))
      else if (a.type === 'deleteMany') a.ids.forEach((id) => store.deleteTask(id))
    }
    setLog((l) => [...l, { role: 'flow', text: reply }])
    setBusy(false)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[80vh] w-full max-w-xl flex-col rounded-t-[28px] p-4 pb-[max(16px,env(safe-area-inset-bottom))] shadow-2xl"
            style={{ background: 'var(--surface)', border: '1px solid var(--hairline)' }}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display flex items-center gap-2 text-xl" style={{ color: 'var(--text)' }}><Icon name="sparkles" size={18} /> Ask StackTask</h2>
              <button onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-full" style={{ color: 'var(--text-faint)' }}><Icon name="x" size={18} /></button>
            </div>

            <div className="no-scrollbar flex-1 space-y-2 overflow-y-auto pb-2">
              {log.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className="max-w-[80%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-[15px]"
                    style={{
                      background: m.role === 'user' ? 'var(--blue-strong)' : 'var(--surface-2)',
                      color: m.role === 'user' ? '#fff' : 'var(--text)',
                    }}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {busy && <div className="px-2 text-sm" style={{ color: 'var(--text-faint)' }}>thinking…</div>}
              <div ref={endRef} />
            </div>

            <div className="mb-2 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)} className="rounded-full px-3 py-1.5 text-xs font-semibold" style={{ background: 'var(--surface-2)', color: 'var(--text-soft)' }}>{s}</button>
              ))}
            </div>

            <div className="flex items-center gap-2 rounded-full px-2 py-1.5" style={{ background: 'var(--surface-2)' }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder="Tell StackTask what to do…"
                className="min-w-0 flex-1 bg-transparent px-3 py-1.5 outline-none"
                style={{ color: 'var(--text)' }}
              />
              <button onClick={() => send()} disabled={busy} aria-label="Send" className="grid h-9 w-9 place-items-center rounded-full" style={{ background: 'var(--blue-strong)', color: '#fff' }}><Icon name="arrowUp" size={18} stroke={2.2} /></button>
            </div>
            {!store.settings.aiKey && (
              <p className="mt-2 px-2 text-[11px]" style={{ color: 'var(--text-faint)' }}>
                Running on the built-in engine. Add a Claude key in Settings for free-form requests.
              </p>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
