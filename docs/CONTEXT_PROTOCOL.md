# StackTask — Context Management Protocol

**Purpose:** keep context lean and never make the user re-explain the app.

## Starting a session (mandatory first action)
**Read in this order, silently:**
1. `CLAUDE.md` at the project root — the persistent root context. Auto-loaded, but read it deliberately.
2. `docs/TODO.md` — what is live, blocked, and next.
3. `docs/PLAN.md` — current direction and phase status.
4. `docs/CONSTITUTION.md` — the binding rules, in full.
5. `docs/MASTER_GUIDE.md` and `docs/APP_DESCRIPTION.md` — **only if** the task needs changelog history or product narrative. Skip them otherwise; they are the largest files and most of their content is already distilled into `CLAUDE.md`.

Do **not** read `docs/_archive/PROJECT_PLAN.md` — stale, wrong app name, wrong paths, deleted files.

Then reply with **exactly**: `Context loaded. Ready to build.` — and **do nothing else** until given a specific command. No summaries, no coding, no assumptions.

## Delegation (context discipline)
The main thread is a **manager**. Delegate to subagents: broad searches, multi-file audits, inventories, verification sweeps, "read these N files and tell me X." Always ask a subagent for a **conclusion under a stated word count**, never for file contents. Keep in the main thread only the edits, the design decisions, and anything needing the user's taste.

Before any compaction, flush durable findings into `CLAUDE.md` or `docs/TODO.md` first — then the summary can be thin, because the real memory is on disk.

## Ending a step / milestone (the update loop)
1. **Extract** what's new — decisions, features built/changed, edge cases found, nuances, anything that would be a "hole."
2. **Update `docs/TODO.md`** — move items between blocked/next/landed. This is the highest-value doc edit; do it every time.
3. **Update `MASTER_GUIDE.md`** via **targeted edits/appends**: add to the Changelog (obeying the 10-item cap → Past Milestones), refresh Current state, log parked/test/removed items to the separate Parked log.
4. **Add any new gotcha to `CLAUDE.md` §5.** If a bug was subtle enough to cost real time, it belongs in the root context, not buried in the changelog — §5 is what stops it being re-broken.
5. **Reconcile `PLAN.md` / `APP_DESCRIPTION.md` / `CONSTITUTION.md`** only if direction, behavior, or a principle actually changed.
6. **Commit** via the Git Save-Point Protocol (`CONSTITUTION.md` IV.5).
7. **Present** the changed sections to the user for a quick confirm. Then it's safe to compact.

## Cadence — fluid now, rigid later
The MVP phase is **highly fluid** (constant testing, tweaking, adapting) — there are **no rigid milestones** yet, so update the docs **iteratively with each simple change/step**. Later, when we transition from MVP to building the **core infrastructure/backend**, we shift to a **formal schedule with concrete milestones** and heavier ceremony.

## Editing discipline (token-critical, applies to both phases)
**Never rewrite a whole doc unless structurally necessary.** Default to **targeted `Edit`s / appends**. Rewriting all four files on every tweak wastes massive output tokens and time — the whole point of this protocol is efficiency.

**Storage:** all four docs live in `/Users/davidbelikoff/new claude run/docs/` — the first things to read every session.
