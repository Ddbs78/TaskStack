# TODO — live work

Read at the start of every session, right after `CLAUDE.md`. Keep it current; it is the handoff.
Last updated: **2026-08-07**, at commit `097fe9b`.

---

## ⏸ Blocked on the user

- [ ] **Approve the three mockups in flight:** professional-vs-personalized UI comparison · onboarding flow
      (3 presentation approaches + both Memphis styles) · adaptive help guide. Nothing gets built until these
      are picked.
- [ ] **Design call: elapsed tint on all-day bars.** Late in the day an all-day bar reads ~99% coral, which
      conflates "the day is nearly over" with "this is overdue" — two very different messages in the same colour.
      Proposed options: cap the tint at ~70%, or split the language (hatch for untimed, tint for timed).
      *Still unanswered — carried forward.*

---

## 🎯 The current arc — dual mode + first-run onboarding (set 2026-08-08)

Direction change: the hand-made aesthetic risks reading as gimmicky, so it becomes **opt-in** and a
**professional mode becomes the default**. See `CLAUDE.md` §1 for the architectural contract.

**Settled by the user 2026-08-08 — do not re-open:**
- Professional motion = **functional + one quiet reward**. Completion feedback is an **Apple-Pay-style green
  checkmark** (circle + check drawing itself in, quick, understated). Professional cannot drop completion
  feedback entirely — "reward finishing louder than you punish falling behind" is the thesis counterweight.
- Onboarding length: **medium, ~6–8 cards.** Plays **once on first launch only**, replayable from Settings.
- Corporate Memphis: **mock both** literal and refined; user picks from the rendering.
- **Both modes get equal polish** — the portfolio recording's narrative order is undecided, so neither is secondary.
- **The logo is the one element identical in both modes.** It never changes.

- [ ] **Professional mode** — Settings toggle. Uniform font, normal cursor, no ink outlines/paper grain/
      gridlines/hand-drawn rules, sticker characters replaced by the approved **paper note stack** (at rest →
      hover fans out → cleared sweeps away), no sticker or celebration animation.
      One component tree + tokens, never two implementations. Default on first open.
- [ ] **First-run intro/setup sequence** — welcome + logo animation → purpose card with Memphis graphics →
      feature cards covering each mechanic **and its ADHD reasoning**, the 3 views, and task creation →
      mode selection → get started. Next + Skip Introduction on every card. Presentation approach
      (modal cards vs. satellite/spotlight on real UI vs. hybrid) **being mocked — pick before building.**
- [ ] **`Guide.jsx` professional face** — the existing 6-chapter guide needs a professional variant.
- [ ] **`Guide.jsx` defect (personalized):** the logo cube is supposed to roll down the dashed path as you
      scroll and currently doesn't. Known bug, not a redesign.
- [ ] **The six approved hand-drawn details** (personalized mode only) — scratchy checkbox · torn-paper
      Completed edge · washi tape on stickers · page-corner fold · handwritten day header swash · pencil
      underline on hover. **Approved, build them.**

## ▶ Next up (unblocked, ready to start)

- [ ] **`OverduePile.jsx` is a grep-verified orphan** (94 lines, imported nowhere; the capped pile is rendered
      inline in `Timeline.jsx` and `Week.jsx`). Park it to `_parked/` per Constitution IV.6, or delete with
      permission. Do not leave it as a silent orphan.
- [ ] **Verify the old product name is fully gone.** `store.js` still persists to `flow.tasks.v1` /
      `flow.settings.v1` (fine — migrating the keys would drop existing user data). But confirm no
      *user-visible* "Flow" string remains: check `SettingsModal.jsx`, `ai/assistant.js`, and the `role: 'flow'`
      literal in `AssistantPanel.jsx`.
- [ ] **iPhone / 375px pass.** Constitution I names Mac + iPhone; the narrow breakpoint has not had a
      dedicated sweep since Week and Month were rebuilt.
- [ ] **Task-height resize** (vertical span). Deferred repeatedly — map the grid math *before* touching it,
      since bar height is currently fixed at `BAR_H = 44` / `LANE = 56` and lane packing assumes it.

---

## 🎬 Waiting on external work

- [ ] **`breakthrough.mp4` swap-in** for the inbox-zero cinematic. The user is producing the video externally.
      `Celebration.jsx` → `ZeroCinematic` is already structured for the swap; the full spec is in
      `src/assets/cinematic/ANIMATION_BRIEF.md`. The 27 concept PNGs in that folder are reference for the
      external tool, **not** imported by any source file.
- [ ] **The portfolio screen recording itself** — the reason the whole polish arc exists.

---

## ✅ Recently landed (newest first — full history in `MASTER_GUIDE.md`)

| commit | what |
|---|---|
| `097fe9b` | Pencil cursor stopped overriding every designated glyph, + 5 audit findings |
| `4763457` | Drag-to-reorder, personalization pack, interactive guide |
| `282553d` | Pencil cursor + drill-down navigation between views |
| `5877e13` | Midnight rollover: now-line no longer freezes on the previous day |
| `9005b4a` | All-day and timed tasks unified into one lane system (option A) |
| `56023c6` | Date picker, toast collision, inbox-zero trigger, chat-bar jump |

**The five findings from the last deep audit are all fixed:** `packLanes` was re-sorting away manual drag order ·
`focusDay` was never cleared · the pencil trail's `screen` blend was invisible on the light theme ·
the guide's resume-scroll was a `saved * 0.0001` no-op · a dead `OverduePile` import.

---

## 🧊 Parked (do not build without a fresh decision)

See `PARKED_FEATURES.md`. Notably: click-anywhere-to-add · chat-bar edge-resize (was built, then reverted) ·
`_parked/PreviewChips.jsx`.
