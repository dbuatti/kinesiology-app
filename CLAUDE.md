# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # start dev server on http://localhost:8080
pnpm build        # production build (tsc + vite build)
pnpm lint         # eslint check
pnpm preview      # preview production build
```

There is no test suite.

## Architecture

**Resonance Kinesiology CRM** — a single-page React 19 + TypeScript + Vite app. It is a clinical practice management tool for a kinesiology practitioner: scheduling, client records, session documentation, and a library of clinical assessment tools.

### Provider stack (`src/App.tsx`)

```
QueryClientProvider → ThemeProvider → TooltipProvider → AuthProvider → ModeProvider → BrowserRouter
```

All routes are defined in `src/App.tsx` — do not split them into separate router files.

### Auth (`src/components/AuthProvider.tsx`)

Supabase auth. `session === undefined` = loading, `session === null` = logged out, `session = Session` = authenticated. Protected routes use `session ? <Page/> : <Navigate to="/login"/>` inline.

### App modes (`src/components/ModeProvider.tsx`)

`AppMode = 'clinical' | 'lab' | 'library'` — persisted in `localStorage` under key `antigravity_app_mode`. The mode changes header background orb colours and can gate UI sections. Access via `useAppMode()`.

### Layouts

- `MainLayout` — authenticated shell. Contains sticky header stack (UpcomingMarquee → SessionTimer → SpaceHeader), background blur orbs, QuickActions FAB. Listens for `antigravity_fullscreen_change` window events.
- `AuthLayout` — bare wrapper for login/onboarding.
- Several pages render without either layout (print pages, `/notes-doc`) — they protect themselves with inline session checks.

### Session page (`/appointments/:id`)

The most complex page. Uses `useAppointment` hook for Supabase fetch + history. Keyboard shortcuts (only active on this route): `Alt+F` fullscreen, `Alt+D` document view. Contains a tab system switching between clinical assessment components (CranialNerveAssessment, PrimitiveReflexAssessment, MuscleAssessment, BrainZoneAssessment, etc.).

### Data layer

- **Supabase** (`src/integrations/supabase/client.ts`) — all live data. Tables: `clients`, `appointments`, and related assessment tables.
- **React Query** — wraps Supabase calls for caching in list/schedule views.
- **`src/data/store.ts`** — mock `Client[]` and `Appointment[]` used in demo/offline scenarios only.
- **`src/data/*.ts`** — large static domain data files (muscle anatomy, TCM channels, Luscher colours, quiz questions, mechano lessons). These are domain knowledge constants, not app state.

### ClinicalRegistry (`src/logic/registry.ts`)

Singleton that maps any finding (muscle name, nerve name, reflex) to its brainstem nuclei, meridian channel, and peak time. The single source of clinical truth that cross-references `muscle-info-data`, `tcm-channel-data`, and `brainstem-logic`.

### Component directories

- `src/components/crm/` — all domain components (100+). Clinical tools, assessments, reference modals, timers.
- `src/components/ui/` — shadcn/ui primitives. **Do not edit these.** Create new wrapper components if customisation is needed.
- `src/components/shared/` — generic utility components (ErrorBoundary, Breadcrumbs, ScrollToTop, BackToTop).
- `src/components/docs/` — Google Docs-style UI (DocsHeader, DocsToolbar, DocsRuler) used in the Practice Notes page.
- `src/components/worksheets/` — long-form printable worksheet components.

### Types (`src/types/crm.ts`)

`Client`, `Appointment`, `AppointmentWithClient`, `MuscleTestResult`, `CranialNerveTest`, `PrimitiveReflexTest`. The `Appointment` type is very wide — most clinical assessment fields are stored as nullable columns on the appointments table rather than in separate rows.

## Design tokens

CSS variables are defined in `src/globals.css` and wired in `tailwind.config.ts`.

| Purpose | Token |
|---|---|
| UI primary / buttons | `hsl(var(--primary))` via `bg-primary` |
| UI destructive | `hsl(var(--destructive))` via `bg-destructive` |
| Chart indigo accent | `hsl(var(--chart-primary))` — use in Recharts `stroke`/`stopColor` |
| Chart rose accent | `hsl(var(--chart-destructive))` — use in Recharts `stroke`/`stopColor` |
| Chart emerald accent | `hsl(var(--chart-emerald))` |
| Google Docs-style page bg | `hsl(var(--docs-surface))` |
| Google Docs-style toolbar | `hsl(var(--docs-toolbar))` |

SVG/Recharts attributes support CSS variables: `stroke="hsl(var(--chart-primary))"` works in modern browsers.

Do not hardcode `#4f46e5`, `#e11d48`, `#10b981`, or `#F9FBFD` — use the tokens above. Static domain colour data in `luscher-data.ts` and `tcm-channel-data.ts` is intentionally hardcoded (it represents the actual colour values of the Luscher and TCM systems).

## Database migrations

SQL migration files live at the repo root (`supabase_*.sql`). Apply them manually via the Supabase dashboard or CLI — there is no automated migration runner.
