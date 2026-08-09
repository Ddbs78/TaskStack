// Task + settings state. Reducer + localStorage. No Redux, no context lib.
import { useCallback, useEffect, useReducer } from 'react'
import { addDays, dateKey } from './time'

const TASKS_KEY = 'flow.tasks.v1'
const SETTINGS_KEY = 'flow.settings.v1'

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36)

// --- seed data mirrors Untitled_Artwork.png, anchored to "today" -----------
function seedTasks() {
  const today = new Date()
  return [
    { id: uid(), title: 'Get groceries', date: dateKey(addDays(today, -2)), start: null, end: null, anytime: true, done: false, completedAt: null, recurrence: null, createdAt: Date.now() - 5000 },
    { id: uid(), title: 'Meetup With Friend', date: dateKey(addDays(today, -1)), start: null, end: null, anytime: true, done: false, completedAt: null, recurrence: null, createdAt: Date.now() - 4000 },
    { id: uid(), title: 'Meetup With Friend', date: dateKey(today), start: 600, end: 1320, anytime: false, done: false, completedAt: null, recurrence: null, createdAt: Date.now() - 3000 },
    { id: uid(), title: 'Do Hw', date: dateKey(today), start: null, end: null, anytime: true, done: false, completedAt: null, recurrence: null, createdAt: Date.now() - 2000 },
    { id: uid(), title: 'Work On Resume', date: dateKey(addDays(today, 1)), start: null, end: null, anytime: true, done: false, completedAt: null, recurrence: null, createdAt: Date.now() - 1000 },
  ]
}

function loadTasks() {
  try {
    const raw = localStorage.getItem(TASKS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  const seeded = seedTasks()
  return seeded
}

export const DEFAULT_SETTINGS = {
  // The app's visual personality. Professional is the DEFAULT face — a new
  // user lands here. Personalized is the opt-in hand-made layer.
  // One component tree drives both; see index.css `[data-mode]`.
  mode: 'professional', // professional | personalized
  onboarded: false, // first-run intro plays once, then never again unless replayed
  theme: 'dark',
  taskStyle: 'filled', // filled | tinted — solid blocks vs translucent tints
  overdueTint: true, // legacy on/off flag, kept so existing saved settings keep working
  elapsedStyle: 'tint', // off | tint | hatch — how elapsed time reads on today's tasks
  notifications: false,
  reduceMotion: false,
  celebrations: true, // completion celebrations (toast / inbox-zero moment)
  aiKey: '',
  aiModel: 'claude-haiku-4-5',
  weekAutoSize: true, // week segments size to their content; off = six equal segments
  recurringDefault: 'none', // none | daily | weekdays | weekly
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {}
  return { ...DEFAULT_SETTINGS }
}

function reducer(state, action) {
  switch (action.type) {
    case 'add': {
      const t = {
        id: uid(),
        title: action.title.trim(),
        date: action.date,
        start: action.start ?? null,
        end: action.end ?? null,
        anytime: action.start == null,
        done: false,
        completedAt: null,
        recurrence: action.recurrence ?? null,
        // null = unranked. Never coerce to 0 — "unranked" and "not urgent at
        // all" are different states and sort differently (see state/bands.js).
        urgency: action.urgency ?? null,
        urgencyOff: action.urgencyOff ?? false,
        sortIndex: null, // set only when the user hand-arranges a day
        createdAt: Date.now(),
      }
      return { ...state, tasks: [...state.tasks, t] }
    }
    case 'update':
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === action.id ? { ...t, ...action.patch } : t)),
      }
    case 'toggle':
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.id
            ? { ...t, done: !t.done, completedAt: !t.done ? Date.now() : null }
            : t
        ),
      }
    case 'delete':
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.id) }
    case 'bulkPatch': {
      const ids = new Set(action.ids)
      return {
        ...state,
        tasks: state.tasks.map((t) => (ids.has(t.id) ? { ...t, ...action.patch } : t)),
      }
    }
    case 'restore':
      // re-insert a previously deleted task (undo), keeping its id
      return state.tasks.some((t) => t.id === action.task.id)
        ? state
        : { ...state, tasks: [...state.tasks, action.task] }
    case 'replaceAll':
      return { ...state, tasks: action.tasks }
    case 'settings':
      return { ...state, settings: { ...state.settings, ...action.patch } }
    default:
      return state
  }
}

export function useStore() {
  const [state, dispatch] = useReducer(reducer, null, () => ({
    tasks: loadTasks(),
    settings: loadSettings(),
  }))

  useEffect(() => {
    localStorage.setItem(TASKS_KEY, JSON.stringify(state.tasks))
  }, [state.tasks])

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings))
    document.documentElement.setAttribute('data-theme', state.settings.theme)
    // data-mode drives the whole craft layer from CSS — see index.css. Doing it
    // here (rather than per-component) is what keeps professional mode the
    // ABSENCE of the hand-made layer instead of a second set of components.
    document.documentElement.setAttribute('data-mode', state.settings.mode || 'professional')
  }, [state.settings])

  const api = {
    tasks: state.tasks,
    settings: state.settings,
    addTask: useCallback((p) => dispatch({ type: 'add', ...p }), []),
    updateTask: useCallback((id, patch) => dispatch({ type: 'update', id, patch }), []),
    toggleTask: useCallback((id) => dispatch({ type: 'toggle', id }), []),
    deleteTask: useCallback((id) => dispatch({ type: 'delete', id }), []),
    restoreTask: useCallback((task) => dispatch({ type: 'restore', task }), []),
    bulkPatch: useCallback((ids, patch) => dispatch({ type: 'bulkPatch', ids, patch }), []),
    setSettings: useCallback((patch) => dispatch({ type: 'settings', patch }), []),
    _dispatch: dispatch,
  }
  return api
}
