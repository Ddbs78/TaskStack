# StackTask — root context

**Read this file first, every session. It is the project's persistent memory and survives context compaction.**
Then read `docs/TODO.md` (what's live) and `docs/PLAN.md` (where it's going). Do not read `docs/PROJECT_PLAN.md` — archived and stale.

---

## 0. Directory Lock (user directive, highest priority)

Every file for this project — source, docs, assets, prototypes, scratch notes — lives inside
`/Users/davidbelikoff/new claude run/`. Never scatter into the home directory or elsewhere.
Standing exception: `~/.claude/launch.json`, which the preview harness reads from the session cwd.

---

## 1. What this is

StackTask is a minimalist, local-first, **timeline-based** task manager. A red now-line glides across an
infinite 3-day window in real time; tasks sit where they actually happen; nothing unfinished ever vanishes.
Built as a **portfolio screen-recording piece** — it has to prove a behavioural thesis, not just look nice.

**Ethos:** speed, friction-free entry, visual delight. The anti-Notion, anti-ClickUp, anti-Calendar.

### Two modes — architectural, not cosmetic (direction set 2026-08-08)

The app ships **two visual personalities driven by one setting**, because the hand-made aesthetic risks reading
as gimmicky to users who want a serious tool.

- **Professional — the default. The app opens in this.** Uniform system font, normal cursor, no ink outlines,
  no paper grain, no gridlines, no sticker characters (the capped overdue overflow becomes a **stack of paper
  notes**), motion pared to the functional minimum.
- **Personalized — opt-in from Settings.** The full craft layer: hand-drawn ink, pencil cursor + graphite
  trail, sticker characters, celebrations, easter eggs.

**Implement as one component tree driven by tokens and a mode flag — never two parallel implementations.**
The craft layer is already class/token-driven (`.inked`, `.marker-rule`, `.pencil`, `--ink`, `--paper-grain`),
so professional mode is largely the *absence* of those plus neutralised tokens. If a `mode === 'pro' ? <A/> : <B/>`
appears for anything bigger than a leaf node, the token approach was abandoned too early and the two modes
will drift.

**Professional is not a degraded fallback.** It is the default face of the product and must look deliberately
designed. "The real app with the fun turned off" is a failed design.

**The behavioural thesis survives both modes.** The overdue cap, the escape valve, and progress having its own
visual channel are the reason the product exists. Professional mode restyles them; it never removes them.

**The behavioural thesis (corrected — this correction is load-bearing):**
The app originally assumed seeing tasks stack up creates healthy urgency. The evidence says the opposite for
the ADHD/executive-dysfunction audience it targets. ADHD brains steeply discount the future, which *validates*
the moving now-line as a real intervention against time blindness. But accumulated visual debt reliably causes
**task-initiation paralysis**, not activation. The relationship is an inverted U: a little visible debt is
salience, a lot is shutdown. Hence: **overdue is capped at 3**, the overflow is held by a sticker character
with a one-tap escape valve, and progress gets its own visual channel as a counterweight. Never re-introduce
an uncapped, ever-intensifying pile — that is a shame engine pointed at the exact population it serves.

---

## 2. Stack — and what may not change

React 18 · Vite 6 · Tailwind CSS v4 (`@tailwindcss/postcss`, **no `tailwind.config.js`** — CSS-first via
`:root` custom properties in `src/index.css`) · Framer Motion 11 · localStorage · optional `@anthropic-ai/sdk`.

**Never install a new npm dependency without asking.** Everything is built from this stack plus native
browser APIs.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

---

## 3. Hard constraints (digest of `docs/CONSTITUTION.md` — read the full file before any architectural call)

1. **No new files, components, or folders without permission.** No new npm deps without asking.
2. **Targeted diffs only.** Never output a whole file unless the change is genuinely structural.
3. **Never use React state for continuous animation.** Timeline scroll, drag, resize, the now-line: imperative
   `requestAnimationFrame` + direct DOM mutation, commit to React state only on release. A `setState` mid-gesture
   re-renders, remounts the handle, and breaks pointer capture — this has caused real bugs here more than once.
4. **Prototype before building.** Render or describe the mockup, let the user choose. Recommend, don't survey.
5. **Git Save-Point Protocol.** After every verified pass: `git add . && git commit` with a standardized
   `[Feature]` / `[Fix]` / `[Docs]` / `[Revert]` message. Undo means `git log` + `git revert` — never rewrite
   from memory.
6. **Park, don't delete.** Unused-but-designed code goes to `src/components/_parked/` and is logged in
   `PARKED_FEATURES.md`.
7. **Test to the extremes before calling anything done:** min/max width, empty state, midnight crossover,
   1-minute and 23-hour tasks, light **and** dark, 375px. Then trace second-order consequences and verify each.
8. **Color plus text, always.** Overdue is warm coral *and* the words "N days ago" — never color alone,
   never red.
9. Custom stroke SVG icons, never emoji. Sentence case. Two font weights. 16px radii. Warm charcoal, never
   pure black.

---

## 4. Architecture map

```
src/
  main.jsx                 React root
  App.jsx        (222)     shell: view switching, all overlay state, undo/celebration action wrappers
  index.css      (299)     design tokens, themes, craft layer, cursor layer

  state/
    store.js     (139)     task+settings reducer → localStorage (keys: flow.tasks.v1 / flow.settings.v1)
    time.js      (159)     date-key math, formatting, live-clock hooks
    bands.js      (97)     SHARED partitioning, urgency ranking, lane packing — all three views use this
    rollover.js   (64)     pure derivations: overdue / elapsed / display-day placement

  nlp/parse.js   (105)     local NL parser ("Dentist Friday at 3")
  nlp/commands.js (80)     offline command matcher
  ai/assistant.js (119)    local commands first, then Anthropic SDK with an apply_actions tool schema

  components/
    Guide.jsx      (432)   scrolly onboarding with LIVE miniatures of each mechanic
    Timeline.jsx   (351)   the 3-day view — day columns, now-line, lane layout  ← the heart
    InputBar.jsx   (332)   bottom docked entry bar
    TimedBar.jsx   (326)   draggable/resizable bar, 15-min snap, delta pill — handles timed AND all-day
    TaskCard.jsx   (255)   untimed card
    Celebration.jsx (224)  completion toast tier + rare inbox-zero cinematic
    …plus SettingsModal, UrgencyBar, RightNow, AssistantPanel, TimePopover, PencilTrail, DatePopover,
      Icon, TaskEditor, BrandMark, CompletedSection, ErrorBoundary, UndoToast, Doodle, MarkerRule
    views/Week.jsx  (416)  six 4-hour segments, accordion — total height never changes
    views/Month.jsx (220)  42 cells, each with a micro 24h strip
    stickers/       art.jsx (164) + Sticker.jsx (86) — six die-cut characters
```

**`state/bands.js` is the single source of truth for layout grouping.** All three views consume
`dayBands()` and `packLanes()`. Do not reimplement partitioning in a view.

---

## 5. Critical nuances — the gotcha list

These are all real bugs that were hit and fixed here. Re-breaking them is the main regression risk.

- **`AnimatePresence mode="wait"` is banned at the view-switch level.** It waits for the outgoing view's exit;
  a nested sticker presence mid-exit never reports completion and the whole app goes blank in Safari with **no
  console error**. Use a plain keyed crossfade. `ErrorBoundary` keys off `view` so switching clears an error.
- **Coordinate-space rule.** Now-line, gridlines, markers, bars and fills all measure against the **full day-column
  width**. Mixing spaces produced the historical blue-sliver bug.
- **CSS transitions over Framer `animate` for anything positional.** It must be correct on first paint, and it
  must survive a backgrounded tab where the rAF clock stops.
- **Never apply a CSS transition to a layout-driven property.** `transition: left 30s linear` on the now-line
  turned every re-layout into a 30-second crawl.
- **The now-line rAF must self-correct.** It measures drift against `todayKey()` each frame; without that it
  froze on the previous day after midnight.
- **A handle defined inside render is a new component every render.** `setState` mid-drag remounts it and kills
  pointer capture. Return an *element* from a function, not a component.
- **Framer keyframe arrays + `type: 'spring'` stall.** Use per-property transitions.
- **Shared `layoutId` is a WebKit hazard.** Avoid across view boundaries.
- **`cursor: inherit` takes the PARENT's cursor.** Scoping a custom cursor to the canvas requires re-declaring
  every designated cursor (`ew-resize`, `ns-resize`, `move`, `text`) *after* the pencil block at higher
  specificity. A native `cursor:` is a static bitmap — it cannot tilt or trail; tilt needs a second cursor
  image, trail needs a separate canvas layer (`PencilTrail.jsx`).
- **`packLanes` must respect manual order.** Re-sorting by start time silently discards a drag the user just made.
- **Safari:** `toLocaleString('default')` → use `undefined`. Avoid `transformBox: fill-box`.
- **Harness limitation:** the preview pane freezes `document.timeline` at 0, so Framer animations do not advance
  there. Verify structure and data via DOM evals and production builds; **motion itself can only be verified by
  the user.** Say so rather than claiming verified.
- **Illustrator SVG exports** carry embedded PNG previews, `i:aipgf` private data, `display:none` layers and
  invisible font-dependent `<text>`. Strip them — 1.3MB became 5–8KB. **Fills live in CSS classes
  (`.stN { fill: url(#gradN) }`), not inline `url()` attributes** — a defs-cleaner that only scans element
  attributes will silently drop gradients, and unresolved fills render as *nothing*. Scan the `<style>` block too.
- **`Guide.jsx`'s chapter `offsetTop` only resolves because its scroll container carries `relative`.** Removing
  that class silently breaks both the cube checkpoints and active-chapter detection, with no error.
- **A page whose content is entirely JS-rendered looks blank outside the project folder.** The preview harness
  only executes JS for files served from inside the project — `public/_proto/` works, the scratchpad does not.
  Mockups with no static fallback must live in the project to be viewable.

---

## 6. Working protocol — this session and onward

**The main thread is a manager, not a worker.** Default to delegating to subagents and keeping only conclusions.

- **Delegate:** any broad search, any multi-file audit, any "read these N files and tell me X", any verification
  sweep, any inventory. Ask the subagent for a *conclusion under N words*, never for file dumps.
- **Two dedicated agents live in `.claude/agents/`:**
  - **`design-smith`** — every visual/interaction change. Defaults to MOCKUP mode (renders 2–4 distinct options
    to a file for approval); switches to BUILD once the user greenlights one. Carries the aesthetic direction,
    including the standing "sanitized is a failure mode" rule.
  - **`bug-hound`** — run after **every** build pass, and on any "it's glitchy" report. Sweeps §5 below as a
    regression checklist, verifies findings against real code, fixes what it confirms. It does **not** commit —
    the main thread reviews and commits, so a bad automatic fix never becomes a save point.
  - Both start cold and are instructed to read this file first. If a rule changes here, they inherit it.
- **Keep in the main thread:** the actual edits, the design decisions, and anything requiring the user's taste.
- **After each verified pass:** update `docs/TODO.md`, append to the changelog in `docs/MASTER_GUIDE.md`
  (targeted edit — never rewrite the file), and git commit.
- **No pull requests.** Solo developer — commit and push straight to `main`. Don't branch, don't open PRs.
- **Before a compaction:** flush anything durable into this file or `docs/TODO.md` first, so the summary can be thin.
- **Report honestly.** Verified vs. not-verified, stated plainly. If the preview can't prove motion, say so.

---

## 7. Doc map

| file | what it's for | churn |
|---|---|---|
| `CLAUDE.md` (this) | root context, auto-read every session | edit when architecture or a hard rule changes |
| `docs/TODO.md` | live work: doing / next / blocked / awaiting user | edit constantly |
| `docs/PLAN.md` | current direction and phase status | edit per phase |
| `docs/CONSTITUTION.md` | the binding rules, in full | rarely — it is the spec |
| `docs/MASTER_GUIDE.md` | changelog (10-item cap) + nuances bible | append per pass, targeted edits |
| `docs/APP_DESCRIPTION.md` | product narrative | rarely |
| `docs/CONTEXT_PROTOCOL.md` | session-start ritual + reply format | rarely |
| `PARKED_FEATURES.md` | approved-but-deferred ideas | when parking something |
| `docs/_archive/PROJECT_PLAN.md` | **stale.** Names the app "Flow", wrong paths, deleted files. Historical only |
