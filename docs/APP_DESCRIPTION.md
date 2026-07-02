# StackTask — App Description & Implementation Plan

## 1. What StackTask is
A **minimalist, timeline-based task manager** built around a **living, moving timeline**. The entire ethos is **speed, friction-free entry, and visual delight** — the opposite of bloated tools like Notion, ClickUp, or Google Calendar. Tasks "squeeze in" when added and "evaporate" when done; a red now-line glides across the day in real time; anything unfinished rolls forward and never disappears. It should feel **alive, warm, and hand-made (Claude/Anthropic) yet clean, modern, and effortless (Apple)**.

- **Stack:** React 18 + Vite + Tailwind CSS v4 + Framer Motion. Local-first (`localStorage`). Optional Claude API key powers the assistant; a local rule engine handles NLP + commands offline.
- **Platforms:** responsive web — flawless on desktop (Mac) and iPhone. (Future: real desktop/mobile app downloads.)

## 2. The core visual metaphor — the timeline
- **Continuous, infinite 3-day window.** Days render flush (no gaps) so gridlines and the now-line flow seamlessly from one day into the next. The user can scroll **endlessly into the past and future** (past = completed history, future = upcoming) without switching views.
- **9 vertical lines per day** at 3-hour marks (the two 12am edges are shared between adjacent days and drawn in a **lighter gray** as day-dividers). Subtle **ticks + labels** (`12a · 3a · 6a · 9a · 12p · 3p · 6p · 9p`) sit along the bottom.
- **The now-line** is a thin **Apple-red (`#FF453A`)** vertical bar that **travels horizontally across today's column in real time** (left edge = 12am, right edge = next 12am), carrying a **live time pill**. It sits on the exact current time on load (no animation-in). It's `pointer-events:none` (clicks pass through to tasks) and shows a **soft glow only on cursor hover** (proximity-detected). It never shows a resize cursor.
- **Flowing markers:** as you scroll (or move the chat bar), the bottom time markers **lift up and glide above the chat bar** wherever it sits, then **spring/rubber-band back** to their baseline row once clear — driven by a continuous rAF that reads the bar's live rect. A low "ceiling" (~1.5 bar-heights) means markers stop chasing the bar if it's lifted high.

## 3. Tasks
- **Types:** *anytime* (full-width row), *timed* (a calendar-style bar occupying only its hours), *overdue* (coral, stacked on top of today).
- **Per-day order:** overdue (coral, top) → timed (positioned on their hours, lane-packed) → anytime (full-width, bottom) → completed (collapsible).
- **Timed tasks** are sized to their span; labels trim to fit, then show a **chevron-in-a-chip** that opens the editor; too-small bars show only the chip. **Hovering a small timed bar opens a task-tinted, frosted "peek blob"** (portaled so it never clips) with the title, time range, notes, a **checkbox**, and a **"time left" clock** ("6.5 hrs left" → "30 mins left" → "0 days overdue"). It opens to the roomier side.
- **Two task styles** (Settings → Appearance → *Task style*): **Filled** (bold coral/blue blocks, the signature look) or **Tinted** (soft translucent blocks with a color dot). Both ship.
- **Overdue wording is gentle** ("2 days ago", not "2 DAYS OVERDUE!!"). Labels are **day-relative** ("Today Anytime", "Today 10am–10pm", "Tomorrow Anytime").
- **Elapsed two-tone tint** (Settings toggle *Elapsed tint*, on by default): the portion of a today-task **to the left of the now-line tints blue→coral in proportion to time elapsed**; the right stays blue; the time label tints in step. When a timed task's end fully passes → it flips to **coral "0 days overdue"** in place, and only jumps to the overdue stack at the next **midnight** (spring re-center + tasks stack up).
- **Interactions:** checkbox completes (evaporate pop) → lands in a per-day collapsible **Completed** section; **5-second Undo toast** after complete/delete; tap a task to edit; delete = long-press (mobile) / right-click or double-click (desktop).

## 4. Task creation & the chat bar
- A floating **"What Needs Doing…" bar**, docked bottom-center by default, with a subtle shadow.
- **Draggable anywhere** (even over tasks) — grab the border (custom slim four-arrow **move cursor**), drag via imperative transform (no lag), and it **magnetically snaps home** near the dock. (Width/height **resize was intentionally removed** — minimize/expand already covers size, and resize created overflow/edge-case holes.)
- **Minimize/expand** via a `−`/`+` bubble on the top-left; minimized = just input + a small blue plus.
- Controls: **Today / Tmrw** pills, a compact **MM/DD** date button (opens native picker), a **clock** button that opens the **iOS-style time picker** (an "Anytime" switch + From/To with AM·PM tap-steppers) **anchored to point at the clock**, and a **⋯** menu (view switch + Ask StackTask + Settings).
- **NLP on entry:** typing "Dentist Friday at 3" or "Gym 5-6pm" parses date/time instantly (local, offline) and positions the task correctly.

## 5. Views, assistant, settings
- **Views** (⋯ menu): **3-Day** (default, infinite scroll), **Week** (7 cols desktop / swipable strip mobile), **Month** (bar-grid desktop / dot-grid + tap-to-expand mobile).
- **Assistant** ("Ask StackTask"): local-first command engine ("what's overdue", "move today's tasks to tomorrow", "add …") with an optional Claude API upgrade (bring-your-own-key) returning structured actions.
- **Settings:** theme (light/dark, moon/sun icons), Task style (filled/tinted), Elapsed tint (on/off), Reduce motion, Recurring default, Notifications (local), AI key + model, Sync/Widgets (labeled stubs).

## 6. Design system (source of truth)
- **Typography:** `ui-rounded` / SF Pro Rounded for display (warm, Claude-like), system sans / Nunito for body. Sentence case. Two weights.
- **Color tokens** (CSS vars in `src/index.css`): dark bg `#1A1A1E` (warm charcoal, never black), surfaces `#242428`/`#2C2C30`, text `#F5F5F3`; light bg `#FAFAF8`. Accents: coral `#F4845F`, blue `#2F8BFF`/`#3B82F6`, now-line red `#FF453A`, success `#34D399`. Tinted-task + grid-boundary + tick tokens defined per theme.
- **Radius:** 16px cards, pill input bar. **Icons:** custom stroke-based SVG (`Icon.jsx`) — **no emoji anywhere**. Custom cursors (move + resize brackets) are theme-aware SVG data-URIs.

## 7. Architecture / file map (all under `src/`)
- `App.jsx` (shell, view router, undo toast host, actions), `main.jsx`, `index.css` (tokens, cursors, keyframes).
- `state/` — `store.js` (reducer + localStorage), `time.js` (clock/day math, `nowFraction`, `fracOf`), `rollover.js` (derive overdue, `elapsedFraction`, `elapsedToday`).
- `nlp/` — `parse.js`, `commands.js`. `ai/` — `assistant.js`.
- `components/` — `Timeline.jsx` (the infinite timeline + `MarkerAxis` + now-line; the heart), `TimedBar.jsx`, `TaskCard.jsx`, `InputBar.jsx`, `TimePopover.jsx`, `TaskEditor.jsx`, `AssistantPanel.jsx`, `SettingsModal.jsx`, `Icon.jsx`, `UndoToast.jsx`, `NowLine.jsx` (legacy helper).
- `components/views/` — `Week.jsx`, `Month.jsx`; `ThreeDay.jsx` + `DayColumn.jsx` are **legacy/unused** (replaced by `Timeline.jsx`) — candidates for cleanup.
- `components/_parked/PreviewChips.jsx` — parked, not imported.

## 8. Still to build (open work — much remains)
This MVP is far from finished. Immediate 3-day-view items:
- **Duration resize** — drag a timed bar's start/end ends; 15-min snap; live "+45 mins / +2 hrs 30 mins" tooltip **beside the handle** (bracket ↔ cursor already exists in CSS).
- **Task-height resize** — *before building this, rigorously map the mathematical consequences on the grid/lane layout (how a taller task reflows every neighbor, the timed-band height math, magnetize behavior). If it threatens the **Simplicity** or **Seamlessness** pillars, propose dropping it entirely — exactly as we did with chat-bar resize.*
- Cleanup: delete unused `ThreeDay.jsx`/`DayColumn.jsx`; refine minimized-bar spacing.

Broader remaining scope (beyond the 3-day window):
- **Refine the Week and Month views** to the same polish/motion bar as the 3-day timeline.
- **Tailor the whole MVP for the iPhone screen** (touch targets, gestures, single-day layout, popovers/peek positioning on narrow screens, safe-area).
- A11y/keyboard pass, first-run empty state, notifications/widgets, recurring generation.

Then, post-MVP (see `MASTER_GUIDE.md` → Long-term vision): **build the backend, validate the app's viability, and develop it into a real downloadable desktop + mobile application.**
