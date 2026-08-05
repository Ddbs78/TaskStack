import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from './state/store'
import { useNow, useMidnightTick } from './state/time'
import Timeline from './components/Timeline'
import Week from './components/views/Week'
import Month from './components/views/Month'
import InputBar from './components/InputBar'
import AssistantPanel from './components/AssistantPanel'
import SettingsModal from './components/SettingsModal'
import TaskEditor from './components/TaskEditor'
import UndoToast from './components/UndoToast'
import Icon from './components/Icon'
import { isOverdue } from './state/rollover'
import { todayKey, dateKey, addDays } from './state/time'

export default function App() {
  const store = useStore()
  const now = useNow(30000)
  const [view, setView] = useState('three')
  const [bump, setBump] = useState(0) // forces re-derive at midnight
  const [showSettings, setShowSettings] = useState(false)
  const [showAssistant, setShowAssistant] = useState(false)
  const [editing, setEditing] = useState(null)
  const [toast, setToast] = useState(null)

  useMidnightTick(() => setBump((b) => b + 1))

  const showToast = (message, undo) => setToast({ id: Date.now(), message, undo })

  // Completion / deletion go through here so they can raise an Undo toast (§1.15)
  const actions = {
    complete: (id) => {
      store.toggleTask(id)
      showToast('Task completed', () => store.toggleTask(id))
    },
    remove: (id) => {
      const t = store.tasks.find((x) => x.id === id)
      store.deleteTask(id)
      showToast('Task deleted', () => t && store.restoreTask(t))
    },
    uncomplete: (id) => store.toggleTask(id), // from Completed section — no toast
    // escape valve on the capped overdue pile: shove the hidden overflow to
    // tomorrow in one tap. Always undoable — it must never feel like a one-way door.
    bump: (ids) => {
      if (!ids?.length) return
      const before = store.tasks.filter((t) => ids.includes(t.id)).map((t) => ({ id: t.id, date: t.date }))
      store.bulkPatch(ids, { date: dateKey(addDays(new Date(), 1)) })
      showToast(
        `bumped ${ids.length} to tomorrow`,
        () => before.forEach(({ id, date }) => store.updateTask(id, { date }))
      )
    },
  }

  // reflect reduce-motion preference on the root for CSS hooks
  useEffect(() => {
    document.documentElement.style.setProperty('--motion', store.settings.reduceMotion ? '0' : '1')
  }, [store.settings.reduceMotion])

  const overdueCount = store.tasks.filter((t) => isOverdue(t, todayKey())).length

  const ViewComp = { three: Timeline, week: Week, month: Month }[view]

  return (
    <div className="flex h-full flex-col" key={bump}>
      {/* top bar */}
      <header className="flex shrink-0 items-center justify-between px-4 pt-[max(14px,env(safe-area-inset-top))] sm:px-8">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-2xl font-semibold tracking-[-0.02em]" style={{ color: 'var(--text)' }}>StackTask</span>
          <span className="hidden text-xs sm:inline" style={{ color: 'var(--text-faint)' }}>what needs doing</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowAssistant(true)}
            className="grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-[var(--surface-2)]"
            style={{ color: 'var(--text-soft)' }}
            title="Ask StackTask"
          ><Icon name="sparkles" size={20} /></button>
          <button
            onClick={() => setShowSettings(true)}
            className="relative grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-[var(--surface-2)]"
            style={{ color: 'var(--text-soft)' }}
            title="Notifications & settings"
          >
            <Icon name="bell" size={20} />
            {overdueCount > 0 && (
              <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-bold text-white" style={{ background: 'var(--coral-strong)' }}>{overdueCount}</span>
            )}
          </button>
        </div>
      </header>

      {/* views */}
      <main className="relative flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            className="no-scrollbar h-full overflow-y-auto"
          >
            <ViewComp store={store} now={now} onEdit={setEditing} actions={actions} />
          </motion.div>
        </AnimatePresence>
      </main>

      <UndoToast
        toast={toast}
        onUndo={(t) => { t.undo?.(); setToast(null) }}
        onDismiss={(t) => setToast((cur) => (cur && cur.id === t.id ? null : cur))}
      />

      <InputBar
        onAdd={store.addTask}
        view={view}
        setView={setView}
        onOpenSettings={() => setShowSettings(true)}
        onOpenAssistant={() => setShowAssistant(true)}
        defaultRecurrence={store.settings.recurringDefault}
      />

      <AssistantPanel open={showAssistant} onClose={() => setShowAssistant(false)} store={store} />
      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} store={store} />
      {editing && <TaskEditor task={editing} onClose={() => setEditing(null)} store={store} />}
    </div>
  )
}
