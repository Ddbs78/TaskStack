# StackTask — Master State Guide & Context Log

> This is **my** primary reference for perfect context. Keep it **as detailed as possible** and **constantly updated every session** so I can accurately interpret the user's requests without re-asking. It is the single most important doc to internalize before doing anything. Update it via **targeted edits/appends** (never full rewrites — see `CONTEXT_PROTOCOL.md`).

## A. Project goals
Build **StackTask**: a fast, friction-free, visually delightful timeline task manager that feels like Apple + Anthropic built it. Local-first web MVP now; real downloadable desktop/mobile apps later. Primary emphasis throughout: **UX, visual design, and motion.**

## B. Current state (as of this bundle)
- **MVP is functional and running** (`npm run dev` → localhost:5173) at `/Users/davidbelikoff/new claude run/`.
- Working: continuous infinite timeline; moving now-line (exact-on-load, click-through, hover glow); 3h markers that flow above the chat bar with spring rebound + ceiling; timed-task positioning + chevron chip + hover **peek blob**; overdue **two-tone elapsed tint** + "0 days overdue" state (with a Settings toggle); filled/tinted task styles; draggable + magnetized + minimizable chat bar (resize removed); iOS time picker anchored to the clock; MM/DD date; NLP entry; local assistant + optional Claude; Week/Month views; light/dark; undo toast; completed sections; clean SVG icons (no emoji).
- **Open work:** duration resize (timed bars, 15-min snap + tooltip), task-height resize, dead-file cleanup (`ThreeDay.jsx`, `DayColumn.jsx`).

## C. Long-term vision (post-MVP roadmap)
1. Finish Pass 2 polish (duration/height resize) + full mobile pass + a11y/keyboard pass + refine Week/Month views.
2. **Backend + accounts + real cloud sync** (replace localStorage; the `Sync` setting is currently a stub).
3. **Real app downloads** — desktop (e.g. Tauri/Electron) and mobile (native or PWA/Capacitor), leaning on the existing responsive web core.
4. Deeper AI (scheduling suggestions, workload summaries, task decomposition), notifications/widgets, recurring-task generation, a "Completed this week" log, first-run onboarding/empty state.

## D. Changelog (max 10 most-recent/critical items)
> **Rule:** keep only the **10 most recent & critical** entries here. When an 11th is added, aggressively fold the oldest into a single running **"Past Milestones"** paragraph at the top. Git (see `CONSTITUTION.md` IV.5) is the real undo history — this log is just a scannable reference. *Past Milestones: (none yet — still within the first 10.)*
1. **MVP build (round 1):** scaffolded React/Vite/Tailwind/Framer; timeline + tasks + NLP + local/Claude assistant + Settings + 3 views + light/dark + localStorage. Named the app **StackTask**.
2. **Relocation:** consolidated the project into `/Users/davidbelikoff/new claude run/`; added `CLAUDE.md` + memory rule.
3. **Design-system pass (round 2):** SF Pro Rounded; spec color tokens; 16px radius; gentle "N days ago"; day-relative labels; collapsible Completed; 5s Undo toast.
4. **Vision round (round 3) — decisions locked:** now-line = Apple-style thin red + live pill + hover halo, **moving horizontally across the day**; markers = ticks+labels with lighter 12am dividers; task-style toggle filled/tinted; **all emoji → custom SVG icons**.
5. **Big build (round 3):** continuous **infinite** timeline; **timed-task positioning** + chevron chip; collapsible/draggable chat bar; **flowing markers above the bar**; iOS time picker.
6. **Pass-1 fixes:** live marker tracking via rAF (fixed frozen-marker bug); lower ceiling; now-line **exact start + click-through + hover glow**; magnetized imperative drag; **preview pills removed → parked**.
7. **Four chat-bar fixes:** wider date field; no text-selection while dragging; **rubber-band marker rebound** (spring); markers lifted off the screen bottom (taller axis).
8. **Pass 2a (later REVERTED):** chat-bar width/height resize + bracket cursors — removed at user request (redundant with minimize; caused control overflow at min width + odd off-dock resize).
9. **Pass 2d:** **overdue two-tone elapsed tint** (left-of-line blue→coral, label tints, aligns to now-line) + **"0 days overdue"** in-place state.
10. **Latest fixes:** removed bar resize (move-only); date shows **MM/DD**; time popover **anchored to the clock** (tail diff 0); **peek blob built** (tinted, checkbox, time-left clock); **blue-sliver fixed** (removed `px-1.5` so fills/timed-bars share the now-line coordinate space; verified 1px alignment); added **Settings → Elapsed tint** toggle; created this `/docs/` context bundle.

## E. Parked / Tests / Removed log (kept for possible future integration)
> A **separate** log (distinct from the main Changelog) for anything the user flagged as a **test**, or asked to **remove but preserve the idea/foundation**. Code/design for these lives in `_parked/` + `PARKED_FEATURES.md`. *If unsure whether something belongs here vs. the main Changelog, ask the user.*
- **Preview chips** — the two "Today"/"Anytime" pills above the input bar. Looked nice but weren't necessary for the MVP; removed at user request, foundation kept. (`_parked/PreviewChips.jsx`.)
- **Click-anywhere-to-add** — start with no bar; clicking empty space springs up the mini bar at that spot. Prototyped + liked; parked for future (discoverability trade-off).
- **Chat-bar free-resize (width/height)** — built then removed: redundant with minimize/expand and created control-overflow + off-dock edge cases. Kept the reasoning as a cautionary example of the "push back on complexity" rule.

## F. Critical context & nuances (do not lose)
- **Coordinate space rule:** the now-line, gridlines, markers, timed bars, and elapsed fills must all measure against the **full day-column width** (no horizontal padding on the task container). This is why `px-1.5` was removed — any future inset must be applied consistently to all of them or it re-creates the blue-sliver bug.
- **Marker axis is imperative:** `MarkerAxis` in `Timeline.jsx` runs a continuous rAF reading `scroller.scrollLeft` + the `.js-chatbar` rect each frame, with per-slot spring state for the rubber-band. Do NOT revert it to a scroll-only React-state model (that caused the frozen-marker bug).
- **Now-line:** `pointer-events:none` (so tasks stay clickable), glow via proximity mousemove, transition disabled on first ~700ms so it starts exactly on time.
- **Chat bar drag** is imperative on the wrapper (commit `pos` on release), magnetizes home within ~70–90px of dock; body `user-select:none` during drag.
- **`elapsedFraction` / `elapsedToday`** live in `rollover.js`; only today-tasks tint; the tint is gated by `settings.overdueTint`; the "0 days overdue" coral is **independent** of that toggle.
- **Parked:** click-anywhere-to-add and the preview chips (`_parked/`, `PARKED_FEATURES.md`).
- **Preview quirk:** the preview tool sometimes returns a downscaled/dim screenshot right after `location.reload()` — re-resize to force a clean capture; trust DOM-evals over a single odd frame.
- **Dates in the running app** use the real browser clock (not a fixed 2026 date); seed data is anchored relative to "today."
- `~/.claude/launch.json` must stay in home (preview tooling reads it there) — the only project-related file intentionally outside the folder.
