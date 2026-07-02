# StackTask — project root

**This folder (`/Users/davidbelikoff/new claude run/`) is the single home for everything related to this project.**

Rule (user directive, high priority): create ALL project files — source, components, docs, assets, configs, prototypes, notes — inside this folder. Never scatter project files into the home directory, `~/.claude/`, or anywhere else. Anything generated for StackTask goes here.

## Stack
React + Vite + Tailwind CSS v4 + Framer Motion. Local-first (localStorage), optional Claude API key for the assistant.

## Run
```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

## Layout
- `src/` — app code (`components/`, `state/`, `nlp/`, `ai/`)
- `src/components/_parked/` — designed-but-unused code kept for future use
- `docs/` — project plan and design docs (`PROJECT_PLAN.md`)
- `PARKED_FEATURES.md` — approved ideas deferred for later (e.g. click-to-add)
- `README.md` — overview + design-system notes

## Notes
- The preview/dev launch config also exists at `~/.claude/launch.json` because the Claude preview tooling reads it from the session's working directory (home). That's harness infrastructure, not project source — leave it there; the project's own copy is in `.claude/launch.json`.
