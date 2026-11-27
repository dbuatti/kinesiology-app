# AGENTS.md

## Coach agent

The `coach` agent moved to the global config on 27 Nov 2026 so it is available from any folder:

```
~/.config/opencode/agents/coach.md
```

Its brain and memory stay here: `docs/coaching/coach-brain.md` and `docs/coaching/memory/`. The agent reads them by absolute path.

## UI work — read DESIGN.md first

Before modifying any UI (pages, components, styles), read **`DESIGN.md`** at the
repo root. Never invent new colors, font sizes, border radii, shadows, or
spacing outside its tokens. The accent is **deep indigo** — green (`emerald-*`,
`green-*`, teal) is banned in app UI.

General project guidance lives in `CLAUDE.md` (architecture, commands,
conventions) — read it alongside DESIGN.md.

## Verification loop

After UI changes: run `pnpm typecheck`, open the changed page in the browser
(dev server `pnpm dev`, port 8080), confirm it renders at desktop and narrow
widths with no console errors, and check the result against DESIGN.md's
pre-commit checklist before calling it done.