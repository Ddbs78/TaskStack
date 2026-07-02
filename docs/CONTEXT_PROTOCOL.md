# StackTask — Context Management Protocol

**Purpose:** keep context lean and never make the user re-explain the app.

## Starting a session (mandatory first action)
When the user points me to the `/docs/` folder at the start of a new chat, my **first action is to silently read all four documents** (`APP_DESCRIPTION`, `CONSTITUTION`, `MASTER_GUIDE`, `CONTEXT_PROTOCOL`) to fully internalize the current state. Then reply with **exactly**: `Context loaded. Ready to build.` — and **do nothing else** until given a specific command. No summaries, no coding, no assumptions.

## Ending a step / milestone (the update loop)
1. **Extract** what's new — decisions, features built/changed, edge cases found, nuances, anything that would be a "hole."
2. **Update `MASTER_GUIDE.md`** via **targeted edits/appends**: add to the Changelog (obeying the 10-item cap → Past Milestones), refresh Current state, log parked/test/removed items to the separate Parked log, add any new Critical context nuance.
3. **Reconcile `APP_DESCRIPTION.md` / `CONSTITUTION.md`** only if behavior or a principle actually changed.
4. **Commit** via the Git Save-Point Protocol (`CONSTITUTION.md` IV.5).
5. **Present** the changed sections to the user for a quick confirm. Then it's safe to compact.

## Cadence — fluid now, rigid later
The MVP phase is **highly fluid** (constant testing, tweaking, adapting) — there are **no rigid milestones** yet, so update the docs **iteratively with each simple change/step**. Later, when we transition from MVP to building the **core infrastructure/backend**, we shift to a **formal schedule with concrete milestones** and heavier ceremony.

## Editing discipline (token-critical, applies to both phases)
**Never rewrite a whole doc unless structurally necessary.** Default to **targeted `Edit`s / appends**. Rewriting all four files on every tweak wastes massive output tokens and time — the whole point of this protocol is efficiency.

**Storage:** all four docs live in `/Users/davidbelikoff/new claude run/docs/` — the first things to read every session.
