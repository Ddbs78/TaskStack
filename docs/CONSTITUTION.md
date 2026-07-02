# StackTask — The Project Constitution

> Non-negotiable principles. Re-read before every change. If a proposed edit violates one of these, stop and reconcile it first.

## I. The Four Pillars
1. **Responsiveness.** Every interaction feels instant and 60fps. No jank, no per-frame React re-renders during gestures (use imperative transforms + rAF, commit to state on release). Flawless on Mac and iPhone; layouts adapt intentionally, never "shrink to break."
2. **Seamlessness.** Motion is continuous and physical — springs, magnetism, rubber-band, glide. Nothing "snaps" robotically. State changes (minimize, scroll, midnight, resize) reflect **live**, without needing a second action to "catch up."
3. **Simplicity.** The default screen is calm and uncluttered. 90% of use is "add a task fast." Hide complexity behind progressive disclosure (⋯ menu, popovers, peek blobs). Remove features that don't earn their weight (we removed bar-resize for this reason). One clear primary action per surface.
4. **Accessibility & Reliability.** It never loses data (tasks roll forward, never vanish). It works offline. It respects reduced-motion, keyboard, focus, and color-plus-text (overdue = coral **and** "N days ago" text, never color alone). It degrades gracefully and never shows raw errors.

## II. Design Aesthetic — study these continuously
The look is a deliberate blend and **must be actively studied and reapplied to every UI/UX decision**:
- **Apple** (iOS, Settings, Apple Pay, Calendar, Reminders): clean surfaces, precise spacing, restrained color, tactile controls, frosted materials, physical animation, disclosure chevrons, native-feeling pickers/toggles.
- **Anthropic / Claude:** warm, personal, hand-made character — friendly rounded type, the coral/clay warmth, an inviting rather than corporate tone, generous whitespace.
- **Notion:** friction-free content entry, quiet chrome, fast keyboard-first flows, elegant empty states, "it gets out of your way."
- **Concrete rules:** warm charcoal (never pure black); coral is the soul color; sentence case; two font weights; custom stroke SVG icons (never emoji); 16px friendly radii; subtle shadows for depth; motion with intent, never decoration.

## III. Rigorous Testing Protocol (mandatory)
Every proposed feature or edit must be **exhaustively tested conceptually AND in the live preview before it's called done.**
1. **Stretch it to its limits.** Ask: what happens at the extremes? (min/max width, tiny/huge tasks, empty state, the very first/last day, midnight crossover, the bar dragged to a corner, a 1-minute task, a 23-hour task, light + dark, mobile 375px.)
2. **Trace second-order consequences.** Every change ripples. Before shipping, list what else this touches — layout neighbors, the now-line/gridline/marker coordinate space, overflow/clipping, z-index/pointer-events, the other task style, other views, scroll, existing gestures — and verify each. (The bar-resize overflow and the blue-sliver misalignment were second-order holes; they must be caught pre-emptively now.)
3. **Act like a real user.** Actually perform the flow end-to-end in the preview (add a task in <15s, view completed, drag, hover, resize, toggle). Screenshots/DOM-evals to prove it, not assume it.
4. **Surface holes immediately.** If a test reveals an edge case or conflict, **name it and propose the fix in the same breath** — never quietly leave it for the user to discover. Honesty over polish.
5. **Push back on complexity.** If a requested feature introduces cascading complexity, creates deep edge cases, or threatens the **Simplicity** pillar, you must **push back before writing brittle code.** Highlight the structural risks up front and propose a simpler, minimalist alternative (exactly like realizing minimize/expand was better than a free-resize chat bar). The right move is often the smaller one.
6. **Prototype/test before you change.** Never make a change blind. Prototype or test it first (renderings, animation previews, or a live-preview run) so the user can **verify the change actually improves the project / addresses the issue the way they intended** before it's cemented.

## IV. Process & Collaboration Principles
1. **Render/prototype before you build.** For any visual or motion decision, produce sample renderings / animation prototypes and get the user's pick **before** implementing. The user chooses; I recommend.
2. **Build in tested passes.** Ship coherent, verified slices rather than a big untested pile. Report honestly what's verified vs. what still needs iteration.
3. **The `new_claude_run` Directory Lock.** All development, files, and assets for this MVP must be created and kept **strictly within `/Users/davidbelikoff/new claude run/`**. Do not create, move, or modify files outside this directory unless explicitly instructed. **Exception:** if confining a specific file/config to this folder would cause a technical roadblock (e.g. tooling that must read from elsewhere), **stop, explain the roadblock, and get explicit approval before placing anything outside** `new_claude_run`. (Known standing exception already approved: `~/.claude/launch.json` for the preview tool.)
4. **Protect the imperative render loop (60fps at all costs).** **Never** use React state for continuous timeline animations, scroll tracking, drag, or resize gestures — it triggers massive re-render lag. Always use `requestAnimationFrame` + **direct DOM mutation** for these micro-interactions, and commit to React state only on release/settle. (This is why `MarkerAxis` and the chat-bar drag are imperative.)
5. **The Git-Driven Save-Point Protocol.** Version control lives in Git inside `new_claude_run`, **not** in bloated markdown undo-logs or my context memory. At the end of every successful feature pass / bug fix / approved milestone, automatically run `git add . && git commit` with a **scannable, standardized message** (e.g. `[Feature] Added peek blob`, `[Fix] Aligned elapsed fill to now-line`, `[Revert] Removed chat-bar resize`). If the user says "undo / revert / go back," **do not rewrite code from memory** — use `git log` to find the exact commit and run `git revert`/`git reset`. This pushes the memory burden onto disk and keeps tokens optimized.
6. **Park, don't delete, good ideas.** Deferred/test/removed features keep their code + design in `_parked/` + `PARKED_FEATURES.md` and are logged in the separate Parked log (see `MASTER_GUIDE.md`).
7. **The user's vision is the spec.** The hand-drawn mockup + stated goals win over generic conventions. When in doubt, ask with options.
8. **Never make the user re-explain the app.** Maintain the four `/docs/` files as the durable source of truth per the Context Protocol.
9. **Strict Architecture & Code-Diff Lock.** Do **not** create new files, components, or folders without explicit permission — stick strictly to the architecture mapped in the Implementation Plan. **Never install new npm dependencies without asking first**; rely solely on the existing stack (React + Vite + Tailwind v4 + Framer Motion + optional `@anthropic-ai/sdk`) and **native browser APIs**. When providing code updates for the app, **never output an entire file unless structurally necessary** — use **targeted code diffs** showing exactly where new code replaces old, to save tokens and prevent accidental overwrites.

## V. Product Doctrine (the "why")
- **Tasks never punish.** No red-alarm shame; overdue is warm coral that says "let's handle this."
- **Time is the organizing principle**, felt viscerally through the moving line — not a static list.
- **Speed is a feature.** If adding a task takes more than a few seconds, that's a bug.
- **Delight is not decoration.** The squeeze-in, evaporate, glide, and magnetism are core to the product's identity, not extras — but they must never cost responsiveness or clarity.
