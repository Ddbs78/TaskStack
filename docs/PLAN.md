# PLAN — direction and phase status

Companion to `docs/TODO.md` (what's live now). This file is the *why* and the *where next*.
Supersedes `docs/_archive/PROJECT_PLAN.md`, which is stale — it still names the app "Flow", points at
`/Users/davidbelikoff/FlowWeb/`, and lists files that were deleted.

---

## The goal

A portfolio screen recording of an app that **visibly answers "what do I do right now?"**, rewards finishing
more loudly than it punishes falling behind, feels hand-made rather than generated, and reads as one product
across the 3-Day, Week and Month views.

Everything below serves that. If a feature doesn't show up on camera or doesn't serve the thesis, it's parked.

---

## Phase status

### ✅ Phase 0 — Shared foundations
`state/bands.js` extracted as the single grouping/lane-packing source for all three views. `CompletedSection`
salvaged and shared. The dead `ThreeDay → DayColumn → NowLine` chain deleted.

### ✅ Phase 1 — The ADHD behavioural thesis
- Overdue capped at **3 visible**, overflow held by a sticker character.
- Escape valve: one tap bumps the hidden overflow to tomorrow, always undoable.
- Six die-cut hand-drawn sticker characters, deliberately off-palette so they stay colourful in both themes,
  with entrance / idle / hover / exit motion. Stable per-day assignment so it reads as a character who showed
  up, not a shuffle.
- **Urgency 1–10** control with a coral ramp and an opt-out for fixed commitments; `urgency: null` means
  unranked and must never be treated as 0. Present in the expanded input bar and the editor; quick capture
  stays quick and creates `null`.
- **Right Now** — surfaces exactly one task, two actions only (done / not this one). No sub-menus; every extra
  control re-introduces the decision load that is the actual bottleneck.
- Completion fires an immediate crafted moment; progress got its own visual channel.

### ✅ Phase 2 — Branding
Real logo artwork inlined (Illustrator exports stripped 690KB → 2–5KB), theme-swapping outline, per-cube
tumble on hover and a tap easter egg. Favicon set, manifest, brand colours matched exactly to the logo
(`--coral: #e58a67`, `--blue: #4b89f7`).

### ✅ Phase 3 — View cohesion
Week rebuilt as a six-segment accordion whose total height never changes. Month gained a micro 24h strip per
cell. Drill-down wired: Month → Week → Day. All-day and timed tasks unified into one lane system with a
right-side tag (option A).

### ✅ Phase 4 — Craft layer
Inked surfaces with hard offset shadows, wobbly marker rules, paper grain, hand-drawn doodles, the yellow
pencil cursor with a canvas graphite trail, and the scrolly interactive guide with live miniatures.

### ◐ Phase 5 — Polish and proof (current)
The remaining hand-drawn iterations (awaiting the user's pick), the all-day tint decision, the 375px pass, and
the `breakthrough.mp4` swap. Then a final regression sweep across every gotcha in `CLAUDE.md` §5 before the
recording.

---

## Standing sequencing rule

The user's stated order, which holds unless they say otherwise:

> **bugs first → then features → then a bug rescan to verify after the new features.**

The rescan is not optional. New features have repeatedly reopened old bugs in this codebase, which is exactly
why the gotcha list in `CLAUDE.md` §5 exists.

---

## Design principles that keep getting re-litigated — settle them here

- **Capped, never uncapped.** Any proposal that lets overdue accumulate visibly without a ceiling is rejected
  by the thesis, not by taste.
- **Witty, not sanitized.** The reference points the user gave are Tesla's hidden easter eggs and Google
  doodles — "graffiti tagging a building but cuter." Hand-drawn, off-palette, personal. A clean generic button
  is a failure mode here, not a safe default.
- **One lane system.** All-day and timed tasks share it. Resist re-splitting them.
- **Motion is load-bearing.** Stickers and celebrations without motion read as pasted-on clip art. But every
  bit of it is gated behind `prefers-reduced-motion` **and** `settings.reduceMotion`.
