# TODO — live work

Read at the start of every session, right after `CLAUDE.md`. Keep it current; it is the handoff.
Last updated: **2026-08-07**, at commit `097fe9b`.

---

## ⏸ Blocked on the user

- [ ] **Verify the animation *feel* in a real browser.** The preview freezes `document.timeline`, so every
      motion piece below is verified structurally/geometrically but NOT for feel: the Apple-Pay completion
      check, sticker entrances, the now-line glide, the scratch-check tick draw-on, onboarding card
      transitions, and the guide's cube settle. These need the user's eyes.

## 🐞 Found during verification (2026-08-08) — not yet addressed

- [ ] **Time popover doesn't dismiss on outside-click or Escape.** Open the "set time" popover in the input
      bar, then click elsewhere / press Escape — it stays open. Pre-existing (`TimePopover.jsx` /
      `InputBar.jsx`), not from this session's work. Low severity but worth a click-outside handler.

## ✅ Build complete + verified (2026-08-08)

The full green-lit scope is built, and each piece was exercised live in the browser (structure/geometry;
motion feel excepted per the blocker above):
- **Mode foundation** — professional default, personalized opt-in, one token-driven tree. Flip verified both ways.
- **Professional "Console" B** — verified rendering in 3-day, both themes, 375px (no h-overflow).
- **Six hand-drawn details** — scratch checkbox, torn edge, washi, corner fold, day swash, pencil underline;
  underline now spans true text width (verified ul width == text width, 44–160px). Personalized-only confirmed.
- **Solid/Translucent** task-block setting surfaced.
- **Onboarding (approach C)** — all 7 cards walked; Memphis art fixed; spotlight mitigations all fire
  (seeded demo tasks make cards 3–5 real, scroll-into-view on card 4, menu auto-open on card 6); plays once;
  **demo tasks confirmed cleaned up (demoLeaked: [])**; mode selection persists; orange-corner selection.
- **Adaptive guide** — professional + personalized; cube rolls down the real path on scroll (verified moving);
  'right now' chapter demo fixed.
- **Logo** — enlarged to 54px; real BrandMark used on onboarding card 1 and guide; click-home works.
- **Header transition** — gridlines fade in under the header instead of hard-cutting.
- **Week** — "all-day" gutter label added.

## 🟢 Approved and in build (2026-08-08 green light)

**Mode:** Professional **B "Console"** approved (30px bar / 38px lane, hairline + 2px status rail, sticky day
headers with counts, alternating column wash instead of gridlines, tabular numerals). **The 6px bar radius
deviation from Constitution §9 is explicitly approved** as part of choosing B.
**Plus:** `taskStyle` surfaced in Settings as **Solid / Translucent** (the flag already existed as
`filled | tinted`; it just wasn't exposed).

**All six hand-drawn details approved** (personalized only): scratchy checkbox · torn-paper Completed edge ·
washi tape on stickers · page-corner fold · handwritten day-header swash · pencil underline on hover.

**Onboarding: approach C (hybrid).** Cards 1/2/7 narrative, 3–6 spotlight-on-real-UI. 7 cards, **segmented
rail** progress, plays once then only via Settings → Replay the intro. Card 2 art = Memphis hybrid leaning
(b), with the ponytail-as-crescent and detached-feet anatomy fixed. Final card: checkmark either uncut or
deliberately overlapped by the orange corner (user liked the accidental version).
**Spotlight mitigations are mandatory**, not optional: scroll-into-view-and-settle · programmatic menu open
with orphan recovery · **seeded demo tasks so cards 3–5 aren't empty on a genuine first run** · a >60%-of-
viewport rule at 375px that falls back to a card.

**Guide:** adaptive per mode, both flowing smoothly, cube fixed to roll along the real path on scroll.

**Logo (hard requirement, repeated by the user in caps):** the mark is **pixel-identical everywhere** — every
mode, the intro sequence, both guides, the header. Only the *wordmark's* text fill changes with light/dark.
Always render via `BrandMark`; never redraw or approximate it. Clicking the header logo returns to the
default 3-day view (done, `ed3f194`).
- [ ] **Design call: elapsed tint on all-day bars.** Late in the day an all-day bar reads ~99% coral, which
      conflates "the day is nearly over" with "this is overdue" — two very different messages in the same colour.
      Proposed options: cap the tint at ~70%, or split the language (hatch for untimed, tint for timed).
      *Still unanswered — carried forward.*

---

## 🎯 The current arc — dual mode + first-run onboarding — ✅ BUILT (see "Build complete" above)

Direction change: the hand-made aesthetic risks reading as gimmicky, so it becomes **opt-in** and a
**professional mode becomes the default**. See `CLAUDE.md` §1 for the architectural contract.

**Settled by the user 2026-08-08 (second pass) — do not re-open:**
- **Professional mode B ("Console") approved** over A ("Ledger"). Includes the 6px-radius deviation from
  Constitution §9 — user approved B as shown, which carries that deviation.
- **All six hand-drawn personalized details approved** — build them.
- **Onboarding progress indicator: segmented rail** (not dots).
- **Guide.jsx cube-on-path bug: proceed with the fix** (technique already validated in the mockup).
- **Logo/brand overhaul: DONE this session.** New 3D-cube artwork (no bulky outline) wired end to end —
  see the dedicated section below.

**Settled by the user 2026-08-08 (first pass) — do not re-open:**
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

## ✅ Logo/brand overhaul (done 2026-08-08)

User replaced the source art in `src/assets/brand/` with a new 3D-cube style (gradient-shaded, no bulky
outline) and required it be **pixel-identical everywhere** — header, both modes, both guides, onboarding.

- Raw Illustrator exports were ~1.3MB each with the usual bloat (dozens of hidden `_copy` layers, two
  embedded raster previews, `aipgf` metadata). Found the single actually-visible top-level group per file
  (everything else was `display:none`), traced its real gradient/clipPath dependencies through `xlink:href`
  chains, and rebuilt minimal `.clean.svg` files — 1.3MB → 5-8KB. Verified pixel-identical by isolated
  render, twice, after an initial cleaning pass silently dropped gradient fills (fills live in CSS classes,
  not inline `url()` — the first extraction script scanned the wrong place, see `src/assets/brand/README.md`).
- **The mark is now a single file, no theme split** — it has no outline, so nothing needs recoloring.
  Only the wordmark's text fill still swaps black/white per theme.
- The raw export left all 9 face polygons (3 cubes × 3 faces) flat, ungrouped — the old tumble easter egg
  depended on `#Layer_6`'s "first three `<g>` children" and would have silently degraded to rotating the
  whole mark as one rigid block. Re-clustered the 9 polygons into 3 `<g class="cube">` groups by spatial
  centroid (k-means); `BrandMark.jsx` now queries `.cube` directly instead of any Illustrator layer id, so
  it survives the next re-export. Verified: 3 independent transforms fire on hover, reset on leave.
- `public/favicon.svg` regenerated from the same cleaned mark.
- **New:** clicking the header logo now always returns to the 3-day view (`setView('three')`,
  `setFocusDay(null)`), on top of the existing tap-5-times easter egg.
- Verified live: header wordmark, hover-tumble, click-to-home from Week view, light + dark theme, Guide's
  `variant="mark"` usage, zero real console/network errors (confirmed via direct `curl`, since the preview's
  own console carried stale entries from before a required server restart — Vite's dep cache needed clearing
  after the file rename).
- Not yet done: the onboarding and mode-comparison **mockups** were built against the old logo and haven't
  been regenerated — cosmetic only, not blocking, but don't mistake them for current when reviewing.

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
