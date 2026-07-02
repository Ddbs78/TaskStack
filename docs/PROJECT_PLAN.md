# StackTask — Refinement Round 3: Moveable Bar, Resizing, Red Line & UX

> This is the active plan. The original build plan is preserved below the divider for history.

## Context
The MVP works: continuous infinite timeline, timed-task positioning with the chip-arrow, collapsible + draggable chat bar, flowing markers above the bar, iOS time picker, clean icons. This round turns the rough edges into Apple/Anthropic-grade polish: a **fully resizable + magnetized + glitch-free** chat bar, a **marker-flow that reacts live** to bar edits (not just on scroll), **task-block resizing** (height with live reflow + duration with 15-min snapping), **red now-line** interaction/startup fixes, and small accessibility/peek affordances. North star unchanged: **responsive, seamless, simple, accessible.** Everything below is a *pre-build* plan — each item is tagged with whether it needs sample **renderings**, an **animation prototype**, or can be **built directly**, so the next step is producing tailored drafts for approval.

### Root causes found in the current code (so fixes target the real problem)
- **Frozen markers (pic 1):** `MarkerAxis` in [Timeline.jsx](new claude run/src/components/Timeline.jsx) recomputes marker x/lift **only when `scrollLeft` state changes**. Minimizing/moving/resizing the bar changes the bar rect but does not re-render the axis → markers keep the old bar's silhouette until you scroll. Fix = drive the axis from a **live bar-geometry source** (shared state + ResizeObserver/rAF), not scroll alone.
- **Now-line "flows up" on open:** the line's `left` has `transition: left 30s linear`; on mount `dayWidth` changes from its default (360) to the measured value, so the line animates from the wrong spot. Fix = no transition on the initial/layout positioning; only ease subsequent minute ticks.
- **Useless arrow on the red line:** `.nowline-hit` sets `cursor: ew-resize` and captures pointer events (can sit over tasks). Fix = line is `pointer-events:none` (clicks pass to tasks); detect hover-proximity for the glow at the timeline level.
- **Bar drag lag (pic 2 — "Anytime" pill + circle trailing):** dragging updates React `pos` state every `pointermove`, re-rendering all children → trailing. Fix = drag via a single CSS transform on the wrapper (rAF), commit to state only on release.
- **The "2 random bubbles" (pic 3):** the live preview `Chip`s (parsed date + time) rendered above the bar while typing.

## Fixes — articulated, with dependencies and draft needs

### 1 · Chat bar: corner-move + edge-resize + magnetize  — 🎨 rendering + 🎬 animation
Make the bar a true floating object with two interaction zones (mirrors task-block behavior):
- **Corners → MOVE** (custom four-arrow cursor, style A already approved). Move is restricted to the 4 corner zones, not the whole border.
- **Edges → RESIZE:** left/right = width, top/bottom = height, each with its own custom resize cursor (↔ / ↕). Width *and* height resizable.
- **Magnetize to default dock:** default = bottom-center. While dragging, when the bar's bottom-middle anchor enters a ~40px zone around the dock, it **eases** (magnetizes, not hard-snaps) toward docked; releasing inside the zone settles docked (`pos=null`). Height magnetizes back to default height the same way.
- **Smoothness:** transform-based drag/resize via rAF; commit to state on release (kills the pic-2 trailing).
- Dependencies: consumes the custom cursors (#5); resize integrates with marker-flow (#2) which must react live; magnetize logic shared with task height (#3).
- Draft needs: 🎨 show the corner-move vs edge-resize hot-zones + the resize cursors in context; 🎬 prototype the magnetize-ease and resize feel.

### 2 · Marker-flow: live responsiveness + height ceiling  — 🎬 animation
- **Live recompute:** axis updates the instant bar geometry changes (minimize/expand, move, resize) with **no scroll required** (pic-1 fix). Source the bar rect from a live observer, not `scrollLeft`.
- **Height ceiling:** the lift only applies within a max band above the screen bottom. If the bar is moved up and **its top crosses the ceiling**, markers stop chasing it and **snap back to their baseline row** (markers never float high up the page).
- Dependencies: bound to #1's geometry source of truth.
- Draft needs: 🎬 prototype (a) instant re-shape on minimize, (b) the ceiling snap-back when the bar goes high.

### 3 · Task blocks: height resize with live reflow + magnetize  — 🎬 animation (+ honesty flag)
- Uniform default height; user can drag a task's top/bottom edge to grow/shrink it (visual only). Height **magnetizes** back to default when released near it.
- **Live neighbor reflow:** tasks above/below shift in real time *during* the drag — never a glitchy jump-to-final on release. (Framer `layout` gives most of this; spacing must update continuously.)
- Dependencies: vertical resize cursor (#5); magnetize shared with #1.
- Draft needs: 🎬 prototype the live reflow + magnetize. **Honest flag:** task-*height* resize is the least conventional ask (height usually follows content) — I'll prototype it but recommend a constrained range and we decide if it earns its keep.

### 4 · Timed-task duration resize, 15-min snapping + delta tooltip  — 🎨 rendering + 🎬 animation
- Drag a timed bar's left/right end (↔) to change start/end, **snapping to 15-min increments**.
- **Live delta tooltip** by the handle: "+15 mins", "−45 mins", "+2 hrs 30 mins". Custom ↔ handle glyph.
- Re-lanes live if the new span overlaps neighbors; updates `start`/`end` on release.
- Dependencies: [TimedBar.jsx](new claude run/src/components/TimedBar.jsx) only; uses #5's ↔ cursor + lane-packing in [Timeline.jsx](new claude run/src/components/Timeline.jsx).
- Draft needs: 🎨 the ↔ handle + the delta tooltip pill; 🎬 the snap + live tooltip feel.

### 5 · Custom cursor / handle symbol set  — 🎨 rendering
- One cohesive set matching the approved move cursor: **horizontal resize ↔**, **vertical resize ↕**, plus matching on-element handles. Crisp SVG data-URI cursors + handle icons in [Icon.jsx](new claude run/src/components/Icon.jsx) / [index.css](new claude run/src/index.css).
- Draft needs: 🎨 show ↔ and ↕ options to sit alongside the move glyph.

### 6 · Red now-line: hover-glow, click-through, exact start  — 🔧 build + 🎬 quick review
- **Hover glow** on the line (glow may extend above a task) but **clicks pass through** to the task beneath; remove the fake `ew-resize` arrow. Implement via `pointer-events:none` line + timeline-level proximity hover for the glow.
- **Exact start:** line sits on the precise current time at load — no "flow up." Disable transition on initial/layout positioning; only ease minute ticks.
- Draft needs: 🎬 quick glow review; rest is a direct fix.

### 7 · Tiny-task hover peek blob  — 🎨 rendering
- Hovering a very small timed bar opens a **translucent detail blob** (title, time range, notes) so tiny bars are readable without opening the editor (complements the chip-arrow which opens the full editor).
- Draft needs: 🎨 the peek-blob style.

### 8 · Remove / rework the preview chips (pic 3)  — 🎨 small rendering
- The two pills above the bar while typing read as clutter. Options: (a) remove; (b) one faint inline hint inside the bar, right-aligned (e.g. "· Tue · 3–6pm"); (c) show only when NLP actually detects a date/time. Recommend (c)+(b).
- Draft needs: 🎨 inline-hint vs removed.

### 9 · [TEST] Overdue shading as the line passes a task  — 🎬 prototype
- The part of a task **left of the now-line** tints toward coral (elapsed/overdue portion); right stays blue — a live two-tone fill tracking the line.
- Draft needs: 🎬 prototype; honest note on legibility + perf before committing.

### 10 · [TEST] No-bar start / click-anywhere-to-add  — 🎬 prototype
- App starts with **no visible bar**; a hint ("what needs doing") shows; clicking empty space opens the **minimized** bar at the click point with a sleek animation, focused for instant typing.
- Draft needs: 🎬 prototype + decide whether it replaces or coexists with the docked bar (discoverability trade-off).

## Dependency map (how these interlock)
- #1 resize ⇒ pulls in #5 cursors, and #2 marker-flow must read #1's live geometry.
- #1 move ⇒ restricted to corners *because* edges are now resize.
- #3 task height ⇒ shares the magnetize util with #1; requires live sibling reflow.
- #4 duration ⇒ shares #5 ↔ cursor + re-runs lane packing.
- #6 line glow ⇒ must not regress task click targets (the reason for `pointer-events:none`).
- A new shared **bar-geometry** value (lifted to [App.jsx](new claude run/src/App.jsx) or a tiny context) is the linchpin for #1 ⇄ #2.

## Critical files
- [InputBar.jsx](new claude run/src/components/InputBar.jsx) — corner-move/edge-resize/magnetize, transform-drag, remove/rework chips.
- [Timeline.jsx](new claude run/src/components/Timeline.jsx) — `MarkerAxis` live geometry + height ceiling; now-line `pointer-events`/glow/exact-start; lane re-pack for duration resize.
- [TimedBar.jsx](new claude run/src/components/TimedBar.jsx) — duration resize + delta tooltip + tiny-task hover blob.
- [Icon.jsx](new claude run/src/components/Icon.jsx) + [index.css](new claude run/src/index.css) — custom ↔/↕ cursors + handles, glow keyframe.
- [App.jsx](new claude run/src/App.jsx) — host shared bar-geometry; possibly new `useResizable`/`useDraggable` hooks + a `ResizeHandle` component.

## Verification (once built)
Run `npm run dev`; in the preview confirm each: minimize bar → markers reshape **instantly** (no scroll); drag bar toward dock → magnetizes; drag bar up past ceiling → markers snap to baseline; resize bar width/height with the ↔/↕ cursors; resize a timed task → "+15 mins" tooltip + 15-min snap + neighbors re-lane; drag a task's height → siblings reflow live, magnetize on release; reload → now-line already on exact time, no flow-up; hover line → glow, and a task under it is still clickable; hover a tiny task → peek blob; chips reworked. Re-check mobile + reduced-motion.

## Draft checklist to produce next (for your approval before building)
🎨 Renderings: (1) corner-move/edge-resize zones + cursors, (4) ↔ handle + "+15 mins" tooltip, (5) ↔/↕ cursor set, (7) tiny-task peek blob, (8) inline hint vs removed chips.
🎬 Animation prototypes: (1) magnetize-ease, (2) live marker re-shape + ceiling snap-back, (3) task height live reflow, (4) duration snap + tooltip, (6) line glow, (9) overdue two-tone fill, (10) click-anywhere-to-add open.

## UX findings & recommendations (user-shoes pass — for your consideration)
- **Add a task <15s:** anytime tasks are fast (type + Enter). *Timed* entry is slower if you use the clock popover; NLP "3-6pm" inline is the fast path — keep promoting it, keep popover steppers quick, consider presets (morning/afternoon/evening).
- **Review completed work:** today has a "Completed (N)" collapsible and past days show completed when scrolled to — but there's no "what did I finish this week" glance. Recommend a lightweight Completed log/filter (consider).
- **First-run empty state:** a blank day + line is unwelcoming. Recommend an inviting empty state ("Add your first task") for onboarding.
- **Gesture discoverability:** move/resize/long-press-delete/right-click-delete/chip-arrow aren't discoverable. Recommend hover-revealed handles + a one-time hint + keyboard support (Enter/Esc/arrows).
- **Touch targets:** edge-resize and corner-move are hard on touch — recommend long-press-to-enter-move/resize mode + bigger targets on mobile.
- **Performance:** ±45-day render + per-frame marker recompute + drag must use transforms + rAF batching to hold 60fps (avoid React state per pointermove).
- **Accessibility:** custom cursors/drag need keyboard + ARIA fallbacks; keep reduced-motion honored (already present); overdue uses coral + "N days ago" text (good — not color-only).
- **Honest "maybe leave it" calls:** task **height** resize (#3) is the weakest value/complexity trade — prototype, then decide. **No-bar start** (#10) is delightful but risks discoverability — prototype before committing. Duration resize (#4), live marker-flow (#2), and the red-line fixes (#6) are clear wins.

---

# Flow — Minimalist Task Manager / Calendar

## Context
The user wants a mobile-responsive web app for a minimalist task manager built around a **live, moving vertical timeline** (per `Untitled_Artwork.png`). The ethos is speed, friction-free entry, and visual delight — the opposite of Notion/ClickUp/Google Calendar. It must feel alive: tasks "squeeze in" when added and "evaporate" when completed, the now-line glides forward in real time, and overdue tasks restack at the top in coral. This is a **greenfield build** in a fresh directory (home dir contains no related web code; `FlowApp` is an unrelated Swift package).

Decisions locked with the user:
- **Stack:** React + Vite + Tailwind CSS + Framer Motion.
- **AI:** Hybrid — local deterministic engine for parsing & common commands (offline, no key); optional Claude API key in Settings upgrades the assistant to free-form natural language.
- **Scope:** Local-first MVP. `localStorage` persistence. Settings fully built; Light/Dark, recurring, and local (Notification API) notifications functional; cloud sync + push are clearly-labeled stubs.

Resolved design defaults (from Pre-Flight Check): overdue and timed tasks are independent records; rollover/overdue is computed **lazily** on load + at local-midnight tick (no server); intra-day order is Overdue → Timed (by start) → Anytime; recurring occurrences are independent instances; mobile month = dot-grid, mobile week = swipable day strip; mobile delete = long-press (450ms, cancel on >10px move), desktop = right-click/double-click.

## Project Location & Setup
- Create the app at `/Users/davidbelikoff/FlowWeb/` (new dir; avoids clashing with the Swift `FlowApp`).
- Scaffold: Vite React app, then add `tailwindcss @tailwindcss/postcss`, `framer-motion`, `@anthropic-ai/sdk`.
- Verify dev server runs (`npm run dev`) before deep feature work.

## Architecture

```
FlowWeb/
  index.html
  src/
    main.jsx
    App.jsx                  # layout shell, view router, theme provider
    state/
      store.js               # task CRUD + reducer; localStorage persistence (custom hook, no Redux)
      time.js                # now-tick (rAF/interval), midnight detection, day math
      rollover.js            # lazy overdue/rollover derivation (pure functions)
    nlp/
      parse.js               # local date/time parser ("Friday at 3", "tomorrow", "10am-10pm")
      commands.js            # local command matcher ("what's overdue", "move today to tomorrow")
    ai/
      assistant.js           # routes to local engine; falls back to Claude SDK if key present
    components/
      Timeline.jsx           # day columns + moving NowLine
      DayColumn.jsx
      TaskCard.jsx           # coral/blue states, checkbox, layout animation, long-press/right-click delete
      NowLine.jsx            # the gliding vertical line (current time)
      InputBar.jsx           # "What Needs Doing..." + Today/Tmrw/Custom + "..." menu
      TimePopover.jsx        # Anytime / From–To popup (matches mockup bubble)
      AssistantPanel.jsx     # conversational command box
      SettingsModal.jsx      # theme, recurring, notifications, AI provider, sync/widgets
      views/{ThreeDay,Week,Month}.jsx
  tailwind / index.css       # design tokens (coral, electric blue, warm dark bg, organic radii, friendly font)
```

### Data model (one task)
```
{ id, title, date (YYYY-MM-DD), start|null, end|null, anytime:bool,
  done:bool, completedAt|null, recurrence|null, createdAt }
```
Overdue is **derived**, never stored: if `!done && date < today`, render in today's column with coral styling + "N days overdue!". Storage is never mutated by rollover, preventing double-moves.

## Implementation Steps
1. **Scaffold + design tokens.** Vite/React/Tailwind/Framer Motion. Define theme tokens in `index.css` (CSS vars for light/dark): warm near-black bg, coral `#E08A6B`-ish, electric blue `#1E90FF`-ish, rounded-organic cards, friendly font (Fraunces/Quicksand-style display + clean sans). Theme toggled via `data-theme` on `<html>`.
2. **Store + persistence.** `useTasks()` hook: add/update/toggle/delete, `localStorage` sync, seed with mockup sample data on first run.
3. **Time engine.** `time.js` exposes current time (updates ~every 30s for label, smooth rAF for line position) + midnight tick to re-derive overdue.
4. **Timeline + NowLine.** 3-day rolling columns (yesterday/today/tomorrow). NowLine = absolutely-positioned vertical bar whose x maps to "now" within today's column, animated continuously. Day headers like mockup.
5. **TaskCard + micro-interactions.** Framer Motion `layout` + `AnimatePresence`: new cards spring in while siblings reflow ("squeeze in"); completion/delete plays an "evaporate pop" (scale+blur+fade) via exit variants. Checkbox completes; long-press (mobile) / right-click & double-click (desktop) delete.
6. **Sorting/stacking.** Per day: Overdue (coral, top) → Timed (by start) → Anytime, per Pre-Flight Check.
7. **InputBar + TimePopover.** Bottom bar "What Needs Doing…" with Today / Tmrw / Custom Date + "…" (view switch). Default new task = Anytime; TimePopover bubble (matches mockup) sets From/To. Typing runs `nlp/parse.js` live so "Dentist Friday at 3" pre-fills date/time with an inline confirm chip.
8. **Views.** ThreeDay (default). Week: desktop columns / mobile swipable day strip. Month: desktop bar-grid / mobile dot-grid (≤3 density dots + overdue marker, tap-to-expand). All behind the "…" menu.
9. **Assistant.** `AssistantPanel` → `ai/assistant.js`: try `nlp/commands.js` first (handles "what's coming up", "what's overdue", "move all of today's tasks to tomorrow" by directly mutating store). If no local match AND a Claude key is set, call Claude via `@anthropic-ai/sdk` (`dangerouslyAllowBrowser`, user's own key from Settings) with a tool/JSON schema that returns a structured action applied to the store. Default model: `claude-haiku-4-5` (fast/cheap), with `claude-sonnet-4-6` / `claude-opus-4-8` selectable in Settings.
10. **Settings modal.** Light/Dark toggle (functional), Recurring config (functional, drives `recurrence`), Notifications + bell icon (functional via browser Notification API), AI Model/Provider (key field + model picker, functional), Sync + Widgets (styled stubs labeled "coming soon"). Lightweight, single scrollable panel.
11. **Responsive pass + a11y.** Verify 375px iPhone and wide desktop; safe-area insets, prefers-reduced-motion fallback for the animations, keyboard focus on input bar.

## Key References / Reuse
- Animations: Framer Motion `layout`, `AnimatePresence`, `motion` variants — no custom animation lib.
- AI: `@anthropic-ai/sdk` browser client with structured-output (tool) call; model IDs `claude-haiku-4-5` (default), `claude-sonnet-4-6`, `claude-opus-4-8`.
- No backend, no router lib (simple in-state view switch), no state lib (reducer + hook).

## Verification
- `npm run dev`, open in browser; confirm: now-line glides; seed data matches mockup (coral overdue stack + blue timed/anytime).
- Add "Dentist Friday at 3" → parses to Fri date + 3pm, squeeze-in animation plays.
- Check a task → evaporate pop, removed from view; reload → persisted.
- Long-press (responsive/mobile emulation) and right-click/double-click (desktop) → delete with animation.
- Backdate a task in storage → appears as "N days overdue!" coral at top of today.
- Assistant: "what's overdue" lists them; "move all of today's tasks to tomorrow" re-dates them (verify offline with no key). With a key set, a free-form phrase routes to Claude and applies the returned action.
- Resize to 375px: 3-day spaced cleanly; Week = swipable strip; Month = dot-grid. Toggle Light/Dark.
- Capture screenshots (desktop + mobile width) to confirm fidelity to `Untitled_Artwork.png`.

## Notes / Out of scope for v1
- Real cross-device sync, accounts, and service-worker push are stubbed in Settings (clearly labeled).
- `Untitled_Artwork.png` was referenced in the prompt but not attached to the working dir; build follows the in-prompt rendering. If you have the file, drop it in and I'll match colors/proportions precisely.
