import { AnimatePresence, motion } from 'framer-motion'
import Icon from './Icon'

const MODELS = [
  { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5 · fastest' },
  { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6 · balanced' },
  { id: 'claude-opus-4-8', label: 'Claude Opus 4.8 · smartest' },
]
const RECUR = [
  { id: 'none', label: 'None' },
  { id: 'daily', label: 'Daily' },
  { id: 'weekdays', label: 'Weekdays' },
  { id: 'weekly', label: 'Weekly' },
]

export default function SettingsModal({ open, onClose, store }) {
  const { settings, setSettings } = store

  const requestNotifications = async (on) => {
    if (!on) return setSettings({ notifications: false })
    if (!('Notification' in window)) return alert('Notifications are not supported in this browser.')
    const perm = await Notification.requestPermission()
    setSettings({ notifications: perm === 'granted' })
    if (perm === 'granted') new Notification('StackTask', { body: 'Notifications are on' })
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className="no-scrollbar fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[min(92vw,440px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[28px] p-6 shadow-2xl"
            style={{ background: 'var(--surface)', border: '1px solid var(--hairline)' }}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-2xl" style={{ color: 'var(--text)' }}>Settings</h2>
              <button onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full" style={{ color: 'var(--text-faint)' }}><Icon name="x" size={20} /></button>
            </div>

            <Section title="Appearance">
              <Row label="Theme">
                <Segmented
                  value={settings.theme}
                  options={[
                    { id: 'dark', label: <span className="flex items-center gap-1.5"><Icon name="moon" size={14} /> Dark</span> },
                    { id: 'light', label: <span className="flex items-center gap-1.5"><Icon name="sun" size={14} /> Light</span> },
                  ]}
                  onChange={(v) => setSettings({ theme: v })}
                />
              </Row>
              <Row label="Task style" hint="Bold blocks or soft tints">
                <Segmented
                  value={settings.taskStyle}
                  options={[{ id: 'filled', label: 'Filled' }, { id: 'tinted', label: 'Tinted' }]}
                  onChange={(v) => setSettings({ taskStyle: v })}
                />
              </Row>
              <Row label="Elapsed time" hint="How today's tasks show time passing">
                <Segmented
                  value={settings.elapsedStyle || (settings.overdueTint === false ? 'off' : 'tint')}
                  options={[
                    { id: 'off', label: 'Off' },
                    { id: 'tint', label: 'Tint' },
                    { id: 'hatch', label: 'Hatch' },
                  ]}
                  onChange={(v) => setSettings({ elapsedStyle: v, overdueTint: v !== 'off' })}
                />
              </Row>
              <Row label="Week segments" hint="Size to content, or six equal blocks">
                <Segmented
                  value={settings.weekAutoSize === false ? 'uniform' : 'auto'}
                  options={[{ id: 'auto', label: 'Auto' }, { id: 'uniform', label: 'Equal' }]}
                  onChange={(v) => setSettings({ weekAutoSize: v === 'auto' })}
                />
              </Row>
              <Row label="Reduce motion" hint="Calmer animations">
                <Toggle on={settings.reduceMotion} onChange={(v) => setSettings({ reduceMotion: v })} />
              </Row>
            </Section>

            <Section title="Recurring tasks" hint="Default repeat applied to new tasks">
              <Segmented value={settings.recurringDefault} options={RECUR} onChange={(v) => setSettings({ recurringDefault: v })} />
            </Section>

            <Section title="Notifications">
              <Row label={<span className="flex items-center gap-1.5"><Icon name="bell" size={15} /> Reminders</span>} hint="Local browser notifications">
                <Toggle on={settings.notifications} onChange={requestNotifications} />
              </Row>
            </Section>

            <Section title="AI assistant">
              <label className="mb-1 block text-xs" style={{ color: 'var(--text-soft)' }}>Claude API key (stored locally only)</label>
              <input
                type="password"
                value={settings.aiKey}
                onChange={(e) => setSettings({ aiKey: e.target.value })}
                placeholder="sk-ant-…"
                className="mb-3 w-full rounded-xl px-3 py-2 text-sm outline-none"
                style={{ background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--hairline)' }}
              />
              <label className="mb-1 block text-xs" style={{ color: 'var(--text-soft)' }}>Model</label>
              <select
                value={settings.aiModel}
                onChange={(e) => setSettings({ aiModel: e.target.value })}
                className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                style={{ background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--hairline)' }}
              >
                {MODELS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
            </Section>

            <Section title="Sync & widgets">
              <Row label="iCloud / device sync" hint="Coming soon"><Badge>Soon</Badge></Row>
              <Row label="Home-screen widget" hint="Coming soon"><Badge>Soon</Badge></Row>
            </Section>

            <p className="mt-2 text-center text-[11px]" style={{ color: 'var(--text-faint)' }}>StackTask · everything stays on this device</p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function Section({ title, hint, children }) {
  return (
    <div className="mb-6">
      <div className="mb-2.5">
        <h3 className="text-sm font-extrabold uppercase tracking-wide" style={{ color: 'var(--text-soft)' }}>{title}</h3>
        {hint && <p className="text-xs" style={{ color: 'var(--text-faint)' }}>{hint}</p>}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}
function Row({ label, hint, children }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div><div className="text-[15px] font-semibold" style={{ color: 'var(--text)' }}>{label}</div>{hint && <div className="text-xs" style={{ color: 'var(--text-faint)' }}>{hint}</div>}</div>
      {children}
    </div>
  )
}
function Toggle({ on, onChange }) {
  return (
    <button onClick={() => onChange(!on)} className="relative h-7 w-12 shrink-0 rounded-full transition-colors" style={{ background: on ? 'var(--blue-strong)' : 'var(--surface-2)' }}>
      <motion.span layout transition={{ type: 'spring', stiffness: 600, damping: 32 }} className="absolute top-1 h-5 w-5 rounded-full bg-white shadow" style={{ left: on ? 26 : 4 }} />
    </button>
  )
}
function Segmented({ value, options, onChange }) {
  return (
    <div className="flex gap-1 rounded-full p-1" style={{ background: 'var(--surface-2)' }}>
      {options.map((o) => (
        <button key={o.id} onClick={() => onChange(o.id)} className="rounded-full px-3 py-1.5 text-sm font-semibold transition-colors" style={{ background: value === o.id ? 'var(--blue-strong)' : 'transparent', color: value === o.id ? '#fff' : 'var(--text-soft)' }}>{o.label}</button>
      ))}
    </div>
  )
}
function Badge({ children }) {
  return <span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: 'var(--surface-2)', color: 'var(--text-faint)' }}>{children}</span>
}
