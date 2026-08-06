# TaskStack — _what needs doing_

A minimalist, friction-free task manager built around a **living timeline**. 
Taskstack wasn't made to offer a new alternative to the thousands of task platforms 
that exist but rather tailor it to be optimal for individuals who struggle with ADHD 
and Procrastination. Our Ethos is that every detail within this platform is intentional
and backed by research. Wether its the visual effect of seeing overdue tasks "stacking up", 
or the Moving timeline to target temporal discounting, every detail, no matter the size, 
is served to help those who feel like there is no solution for task management.
A now-line glides through the day, and anything you miss rolls forward and restacks 
in coral at the top of today. Warm, organic, personalized aesthetic. Local-first — 
everything stays on device.

The visual layer follows the design spec in `implementation_plan.md` (§6 Animation,
§7 Design System): SF Pro Rounded typography, the spec color tokens (warm charcoal
`#1A1A1E` / off-white `#FAFAF8`, coral `#F4845F`), 16px friendly card radius, gentle
"2 days ago" overdue wording, day-relative labels ("Today 10am–10pm", "Tomorrow
Anytime"), a collapsible **Completed** section per day, and a 5-second **Undo toast**.

The timeline now-line is a thin Apple-red bar that **travels horizontally across
today's column in real time** (left = 12am, right = next 12am) carrying a live time
pill, with a soft halo on hover — so you can see how much of the day is left. Each day
shows **8 vertical gridlines at 3-hour marks** with subtle tick markers
(`12a…9p`) above the input bar; the 12am day-dividers are drawn in a lighter gray.
Task blocks come in two styles — **Filled** (bold color) or **Tinted** (soft) —
switchable in Settings → Appearance. All UI glyphs are clean stroke-based SVG icons
(`src/components/Icon.jsx`), no emoji.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
```

Build for production with `npm run build` (output in `dist/`).

## Stack
- **React 18 + Vite** — fast dev/build, no framework bloat
- **Tailwind CSS v4** — utilities; design tokens live in `src/index.css`
- **Framer Motion** — `layout` + `AnimatePresence` power the squeeze-in / evaporate
- **@anthropic-ai/sdk** — optional Claude upgrade for the assistant (bring your own key)

## How it works

- **Auto-rollover & overdue** are *derived, never stored* (`src/state/rollover.js`).
  A task whose date is before today is rendered at the top of today in coral with
  "N days overdue!". Storage is never mutated by rollover, so nothing double-moves
  or gets lost. Re-derived on load and at local midnight (`useMidnightTick`).
- **Ordering per day:** overdue → timed (by start) → anytime.
- **NLP entry** (`src/nlp/parse.js`): type _"Dentist tomorrow at 3"_ or
  _"Meetup Friday 10am-10pm"_ — date/time parse instantly, locally, with preview chips.
- **Assistant** (`src/ai/assistant.js`): local command engine first
  (_"what's overdue"_, _"move today's tasks to tomorrow"_, _"add …"_), offline and
  instant. Add a Claude API key in Settings to unlock free-form requests; it returns
  structured actions applied to the task store.
- **Persistence:** `localStorage` (`flow.tasks.v1`, `flow.settings.v1`).

## Views
- **3-Day** (default) — yesterday · today · tomorrow with the gliding now-line.
  On phones it becomes one full-width swipeable day with a "now" progress bar.
- **Week** — 7 columns on desktop; horizontal snap strip on mobile.
- **Month** — task bars on desktop; density dots + tap-to-expand day drawer on mobile.

Switch views from the **⋯** menu in the bottom action bar.

## Gestures
- **Check the circle** → complete (evaporate pop)
- **Tap a card** → edit (title / date / time)
- **Delete:** long-press on mobile · right-click or double-click on desktop

## Settings
Light/Dark, reduce-motion, default recurrence, local notifications (Notification API),
Claude key + model picker. Cross-device sync and home-screen widgets are stubbed
(labeled "Soon").

## Project layout
```
src/
  state/    store.js (reducer + localStorage)  time.js (clock/day math)  rollover.js (derive overdue)
  nlp/      parse.js (date/time)  commands.js (local command engine)
  ai/       assistant.js (local-first, Claude fallback)
  components/  TaskCard, NowLine, DayColumn, InputBar, TimePopover,
               AssistantPanel, SettingsModal, TaskEditor, views/{ThreeDay,Week,Month}
```
