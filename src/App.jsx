import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
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
import ErrorBoundary from './components/ErrorBoundary'
import BrandMark from './components/BrandMark'
import Celebration from './components/Celebration'
import RightNow from './components/RightNow'
import Guide from './components/Guide'
import Onboarding from './components/Onboarding/Onboarding'
import PencilTrail from './components/PencilTrail'
import Icon from './components/Icon'
import { isOverdue } from './state/rollover'
import { todayKey, dateKey, addDays } from './state/time'

export default function App() {
  const store = useStore()
  const [now, setNow] = useNow(30000)
  const [view, setView] = useState('three')
  const [focusDay, setFocusDay] = useState(null) // day a drill-down landed on
  const [bump, setBump] = useState(0) // forces re-derive at midnight
  const [showSettings, setShowSettings] = useState(false)
  const [showAssistant, setShowAssistant] = useState(false)
  const [editing, setEditing] = useState(null)
  const [toast, setToast] = useState(null)
  const [celebration, setCelebration] = useState(null)
  const [showRightNow, setShowRightNow] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  // settings load synchronously from localStorage, so the first render already
  // knows whether the intro is owed. Skipping counts as done — see Onboarding.
  const [showIntro, setShowIntro] = useState(() => !store.settings.onboarded)
  const [logoTumble, setLogoTumble] = useState(false)
  const [logoLoose, setLogoLoose] = useState(false)
  const tapRef = useRef(0)
  const tapTimer = useRef(null)

  // Refresh the clock AND bump. Bumping alone remounted the tree while `now`
  // was still yesterday's Date (useNow polls every 30s), so the timeline rebuilt
  // its columns around the wrong day and the now-line parked at the start of
  // yesterday — the Safari midnight freeze.
  useMidnightTick(() => { setNow(new Date()); setBump((b) => b + 1) })

  const showToast = (message, undo) => setToast({ id: Date.now(), message, undo })

  // Completion / deletion go through here so they can raise an Undo toast (§1.15)
  const actions = {
    complete: (id) => {
      const today = todayKey()
      // Inbox zero = nothing left that is due today or already overdue. Checked
      // BEFORE the toggle. The old test (was-overdue AND no overdue left) fired
      // mid-session whenever you cleared an overdue item while other work
      // remained, and never fired at all if nothing had gone overdue.
      const stillDue = store.tasks.filter(
        (x) => x.id !== id && !x.done && (x.date <= today)
      ).length
      const doneToday = store.tasks.filter((x) => x.done && x.date === today).length + 1
      const left = store.tasks.filter((x) => x.id !== id && !x.done).length
      store.toggleTask(id)
      setCelebration({
        id: Date.now(),
        type: stillDue === 0 ? 'zero' : 'one',
        done: doneToday,
        left,
      })
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

  // The whole hand-made layer hangs off this one flag. Professional is default.
  const personalized = store.settings.mode === 'personalized'

  const overdueCount = store.tasks.filter((t) => isOverdue(t, todayKey())).length

  const ViewComp = { three: Timeline, week: Week, month: Month }[view]

  return (
    <div className="flex h-full flex-col" key={bump}>
      {/* top bar */}
      <header className="flex shrink-0 items-center justify-between px-4 pt-[max(14px,env(safe-area-inset-top))] sm:px-8">
        {/* items-center, not items-baseline — baseline alignment misbehaves with SVG */}
        <button
          className="flex items-center gap-2"
          onMouseEnter={() => setLogoTumble(true)}
          onMouseLeave={() => setLogoTumble(false)}
          onClick={() => {
            // primary function: always return home to the default 3-day view
            setFocusDay(null)
            setView('three')
            // easter egg: keep tapping and the cubes break loose
            const n = tapRef.current + 1
            tapRef.current = n
            clearTimeout(tapTimer.current)
            tapTimer.current = setTimeout(() => { tapRef.current = 0 }, 900)
            if (n >= 5) { tapRef.current = 0; setLogoLoose(true); setTimeout(() => setLogoLoose(false), 2600) }
          }}
          aria-label="StackTask — go to today"
        >
          <BrandMark variant="wordmark" height={42} tumbling={logoTumble || logoLoose} />
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowRightNow(true)}
            className="mr-1 rounded-full px-3 py-2 text-[13px] font-bold transition-colors"
            style={{ background: 'var(--surface-2)', color: 'var(--text)' }}
            title="What should I do right now?"
          >
            right now
          </button>
          <button
            onClick={() => setShowGuide(true)}
            className="grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-[var(--surface-2)]"
            style={{ color: 'var(--text-soft)' }}
            title="How this works"
          ><Icon name="help" size={20} /></button>
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

      {/* views — NO `mode="wait"`: waiting on the outgoing view's exit deadlocks
          in Safari when it has a nested AnimatePresence mid-exit (e.g. a sticker
          you just interacted with), leaving the whole app blank. A plain keyed
          crossfade mounts the incoming view immediately. The ErrorBoundary keys
          off `view`, so switching views also clears any error. */}
      <main className={`relative flex-1 overflow-hidden ${personalized ? 'pencil' : ''}`}>
        <ErrorBoundary resetKey={view}>
          <motion.div
            key={view}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="no-scrollbar h-full overflow-y-auto"
          >
            <ViewComp
              store={store}
              now={now}
              onEdit={setEditing}
              actions={actions}
              focusDay={focusDay}
              onDrill={(nextView, dayKey) => { setFocusDay(dayKey); setView(nextView) }}
            />
          </motion.div>
        </ErrorBoundary>
      </main>

      <UndoToast
        toast={toast}
        onUndo={(t) => { t.undo?.(); setToast(null) }}
        onDismiss={(t) => setToast((cur) => (cur && cur.id === t.id ? null : cur))}
      />

      <Celebration
        event={celebration}
        calm={!!store.settings.reduceMotion}
        undoVisible={!!toast}
        onDone={() => setCelebration(null)}
      />

      {/* the graphite trail is part of the pencil metaphor — personalized only */}
      <PencilTrail enabled={personalized && !store.settings.reduceMotion} />

      <Guide open={showGuide} onClose={() => setShowGuide(false)} />

      <RightNow
        open={showRightNow}
        onClose={() => setShowRightNow(false)}
        tasks={store.tasks}
        today={todayKey()}
        nowMin={now.getHours() * 60 + now.getMinutes()}
        onComplete={actions.complete}
      />

      <InputBar
        onAdd={store.addTask}
        view={view}
        setView={(v) => { setFocusDay(null); setView(v) }}
        onOpenSettings={() => setShowSettings(true)}
        onOpenGuide={() => setShowGuide(true)}
        onOpenAssistant={() => setShowAssistant(true)}
        defaultRecurrence={store.settings.recurringDefault}
      />

      <AssistantPanel open={showAssistant} onClose={() => setShowAssistant(false)} store={store} />
      <SettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        store={store}
        onOpenGuide={() => setShowGuide(true)}
        onReplayIntro={() => setShowIntro(true)}
      />

      <Onboarding open={showIntro} store={store} onFinish={() => setShowIntro(false)} />
      {editing && <TaskEditor task={editing} onClose={() => setEditing(null)} store={store} />}
    </div>
  )
}
