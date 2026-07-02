# Parked features — designed/approved but deferred

Ideas we prototyped and liked but chose not to ship yet. Each has enough detail
(and, where noted, parked code) to pick up later.

## 1 · Click-anywhere-to-add (bare start)
**Status:** parked (prototyped + approved as a concept, deferred for discoverability reasons).

The app starts with **no visible chat bar**. A faint hint ("what needs doing…")
sits on the canvas. Clicking any empty space (not a task, not a control) springs
the **minimized** bar into existence at the click point with a soft scale/opacity
animation, focused and ready to type. Pressing Esc or clicking away dismisses it.

Why parked: it's delightful but hurts discoverability for new users, and it
overlaps with the docked bar. Revisit as an optional mode (Settings → "Start
empty") or for a future "focus/zen" layout. Prototype reference: the
`click_to_add_prototype` widget (spring-in from click point).

## 2 · Input preview chips
**Status:** parked code in `src/components/_parked/PreviewChips.jsx`.

The two pills (parsed date + parsed time) that floated above the input bar while
typing. Removed because they read as clutter. If we want a lighter touch later,
re-introduce as a single faint inline hint inside the bar (right-aligned, e.g.
"· Fri · 3:00 PM") shown only when NLP actually detects a date/time.
