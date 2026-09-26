# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # start dev server on http://localhost:8080
pnpm build        # production build (vite build only — does NOT typecheck)
pnpm typecheck    # tsc --noEmit over src; keep this at zero errors
pnpm lint         # eslint check
pnpm preview      # preview production build
```

There is no test suite. Because `vite build` strips types without checking them, run `pnpm typecheck` before pushing — type errors here have hidden real runtime bugs (undefined variables, dropped props).

### Edge function deploys

The Supabase CLI is installed via Homebrew at `/opt/homebrew/bin/supabase` (v2.115.0), already authenticated (`supabase login` was done — token lives outside the repo), and this project is linked (`Kinesiology App`, ref `xebtjnvfkroiplyzftas`). Restricted shells may not have `/opt/homebrew/bin` on PATH — call it by full path or `export PATH=/opt/homebrew/bin:$PATH` first. Do not reinstall Node/pnpm/supabase; they already exist.

```bash
export PATH=/opt/homebrew/bin:$PATH   # run first if /opt/homebrew/bin isn't on PATH
/opt/homebrew/bin/supabase functions deploy <function-name>   # deploy one edge function
/opt/homebrew/bin/supabase functions list                    # verify (status + version)
```

Deploying is the standing expectation (no need to ask the user) and the CLI is fully authenticated and project-linked — deploy, then confirm with `supabase functions list`. Subsequent deploys bump the version; new versions must be verified live.

GitHub Actions also deploys functions on push to main. Never put `SUPABASE_ACCESS_TOKEN` in a committed file.

## Architecture

**Resonance Kinesiology CRM** — a single-page React 19 + TypeScript + Vite app. It is a clinical practice management tool for a kinesiology practitioner: scheduling, client records, session documentation, and a library of clinical assessment tools.

### Provider stack (`src/App.tsx`)

```
QueryClientProvider → ThemeProvider → TooltipProvider → AuthProvider → ModeProvider → BrowserRouter
```

All routes are defined in `src/App.tsx` — do not split them into separate router files.

### Auth (`src/components/AuthProvider.tsx`)

Supabase auth. `session === undefined` = loading, `session === null` = logged out, `session = Session` = authenticated. Protected routes use `session ? <Page/> : <Navigate to="/login"/>` inline.

### Zones (`src/lib/zones.ts`, `src/components/ModeProvider.tsx`)

The app has three **zones** — kinds of work, not practices (kinesiology, voice and piano are one practice to the practitioner, so every zone shows all of them):

- **Practice** — Today (`/`), Calendar, Sessions, Lessons (`/voice`), People (`/clients`)
- **Business** — a focus zone for admin and client relationships: Inbox (`/inbox`), Follow-up (`/follow-up`), People, Assistant, Money (`/money`), Client audit (`/audit`), Calendar, Timetable, Marketing (`/marketing`)
- **Growth** — Morning Program, Journal, Practice Hub, Identity Work, Library, Worksheets

`src/lib/zones.ts` is the single source of truth for sidebar groups, the phone tab bar, the switcher, aura tints, breadcrumbs and the URL→zone rule (`zoneForPath`). Shared pages (`/assistant`, `/clients`, `/calendar`, `/settings`, `/availability`) keep whichever zone you were in. Edit zones there, never in Sidebar/MobileTabBar/MainLayout/SearchBar. The zone is stored as `AppMode` under `rk_app_mode` (old `clinical`/`voice` values normalise to `practice`); read it with `useAppMode()`.

Create dialogs (quick session, book session, book lesson, new client) live in `QuickActions` (top bar "+ New"); open them from anywhere with `window.dispatchEvent(new CustomEvent("rk:create", { detail: "quick" | "session" | "lesson" | "client" }))`. "Open the app on" (Today / Inbox / Calendar) is a per-device setting in `src/lib/start-page.ts`, applied once per browser session.

### Layouts

- `MainLayout` — authenticated shell. Contains sidebar navigation, sticky header stack (UpcomingMarquee → SessionTimer), background blur orbs, QuickActions FAB. Listens for `antigravity_fullscreen_change` window events.
- `AuthLayout` — bare wrapper for login/onboarding.
- Several pages render without either layout (print pages, `/notes-doc`) — they protect themselves with inline session checks.

**Important**: `MainLayout` wraps the `Outlet` with `key={location.pathname + location.search}` — changing the URL search params remounts the page. Multi-pane pages therefore drive pane/tab selection from internal `useState` initialised from the URL (deep links work as entry points) rather than live `useSearchParams`.

### Consolidated hubs

Several top-level nav items are multi-pane or tabbed hubs that wrap previously separate pages:

- `/library` — `LibraryPage.tsx` (UnifiedEditor two-pane tree: references, worksheets, practice tools). Old worksheet routes redirect to `/library?tab=<id>`.
- `/practice` — `PracticeHubPage.tsx` (UnifiedEditor two-pane: Self Practice, Procedures, Quiz, Quick Calibrate, Corrections). Old `/practice/*` routes redirect to `/practice?tool=<id>`.
- `/identity` — `IdentityWorkspacePage.tsx` (UnifiedEditor two-pane: Map, Shifting, Alignment, Limiting Beliefs, Fractals). Old `/lab`, `/identity-map`, etc. redirect to `/identity?tool=<id>`.
- `/money`, `/audit`, `/marketing` — `BusinessPage.tsx` with a `tools` prop narrowing its tabs (Money = Summary + Revenue). `/business`, `/business?tool=<id>` and old `/business/*` routes redirect to these.
- `/inbox`, `/follow-up` — `AssistantPage` with `initialTab`, rendered as focused pages (just that tool, no Assistant header/metrics/tabs). `/assistant` is the full Assistant (chat, follow-up, inbox, launch).
- `/clients` — `ClientsPage.tsx`, labelled **People** (internal Tabs: People, Clinical oversight). One list of kinesiology clients and voice/piano students, with a practice filter (`?practice=kinesiology|voice|piano`). `/oversight` redirects to `/clients?tool=oversight`.
- `/sessions` — `ClinicalHubPage.tsx`: real sessions first (new, up next, recent), then a "Practice & reference" section with the sandbox (`/practice/trial/*`, a practice client — nothing saved to a real record) and the corrections manual.

The unified editor primitive is `src/components/crm/UnifiedEditor.tsx` (`sections` with id/label/icon/group/render, `selectedId`/`onSelect`, left tree + right pane, mobile collapse).

**Pane extraction pattern**: full pages are exposed as both a named inner export and a default page wrapper, e.g. `export function ProceduresTool()` in `ProceduresPage.tsx` with `export default () => <AppLayout><ProceduresTool /></AppLayout>`. The hubs import the named inner export. Inner tools must NOT wrap themselves in `AppLayout` and must avoid URL-driven state that would remount the host page (see `SelfPracticeTool nested` prop for the internal-state pattern). Retired routes are kept as redirects so old links never break.

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
- `src/components/ui/` — shadcn/ui primitives, restyled to carry the design system (buttons, inputs, cards, tabs, menus, dialogs). Editing them is encouraged when a look should change app-wide — keep their props/APIs stable.
- `src/components/shared/` — generic utility components (ErrorBoundary, Breadcrumbs, ScrollToTop, BackToTop).
- `src/components/docs/` — Google Docs-style UI (DocsHeader, DocsToolbar, DocsRuler) used in the Practice Notes page.
- `src/components/worksheets/` — long-form printable worksheet components.

### Types (`src/types/crm.ts`)

`Client`, `Appointment`, `AppointmentWithClient`, `MuscleTestResult`, `CranialNerveTest`, `PrimitiveReflexTest`. The `Appointment` type is very wide — most clinical assessment fields are stored as nullable columns on the appointments table rather than in separate rows.

## Design tokens

The visual system (Sept 2026 redesign): cool-neutral surfaces + one indigo accent, Inter (optical sizing) for UI and Newsreader for page titles, tinted layered shadows, 10px base radius, ease-out-expo motion. Shared building blocks: `shared/PageHeader`, `shared/SectionCard`, `shared/HubTabs`, `layout/TopBar`, `layout/BrandMark`, `.eyebrow`, `.kbd`, `.spotlight`, `hooks/use-count-up`. Prefer sentence case for labels and controls; no gradient CTA buttons.


CSS variables are defined in `src/globals.css` and wired in `tailwind.config.ts`.

**Dark mode for raw palette classes.** Older components use light Tailwind palette classes (`bg-rose-50`, `border-indigo-200`, `from-emerald-50`, `text-violet-800`) without `dark:` variants. `scripts/gen-dark-palette.mjs` (run automatically by `pnpm build`) generates `src/styles/dark-palette.css`, which remaps every such class used in `src/` to a translucent tint / light text in dark mode. An explicit `dark:` variant always wins over it. Add `keep-light` to a subtree that must stay light (e.g. white print-preview sheets). Prefer tokens (`bg-muted`, `bg-primary/10`) in new code.

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

## Layout philosophy — flat, full-bleed, single-scroll

Default to how most modern web apps feel (Linear, Notion, Superhuman), not a dashboard of boxed-in widgets:

- **One scroll region per page.** A page should scroll via the outer `#main-scroll-container` (`MainLayout.tsx`), not grow its own nested `overflow-y-auto` pane for ordinary content. A fixed-height, internally-scrolling pane is only correct for something that behaves like a real chat UI (input anchored, history scrolls within it, e.g. `MessageList.tsx`/`AssistantPage.tsx`'s Chat tab) — a list, form, or table is not that, and should just flow in the page (see `FollowUpTab.tsx`, `LaunchCampaignTab.tsx`, `CommsInbox.tsx` for the corrected pattern).
- **Content uses the full width it's given, not a narrower box floating in more padding.** Watch for compounding padding — a page's own `p-4`/`p-6`, plus a card's own `p-3`/`p-4`, plus a grid splitting that further, adds up fast on a narrow viewport (a real bug: a mobile input ended up ~130px wide from three layers of padding plus a 2-column grid). Prefer stacking full-width over splitting into columns unless there's real room.
- **Borders and card chrome (`.panel`, `rounded-xl border`) are for separating genuinely distinct regions, not the default wrapper for every section.** A sidebar-vs-content split earns a border; a settings section sitting in normal page flow usually doesn't need its own boxed card — spacing (`space-y-6`) and a heading are often enough.
- This is a standing preference, not a one-off fix — apply it by default in new work, and flatten what you touch in old screens, without waiting to be asked each time.

## Voice Calendar Fallback (`UnifiedCalendarPage.tsx`)

Notion voice lessons and Cal.com voice_bookings are merged into `calendarItems` at `src/pages/UnifiedCalendarPage.tsx:405`. The logic:

1. **Primary** — Notion lessons (`voiceLessons`) are fetched via Supabase edge function. Each becomes a `CalendarItem` with local time (converted via `formatVoiceTime`/`voiceDateISO`).
2. **Fallback** — `voice_bookings` rows that lack a Notion lesson appear as fallback items. Dedup uses two layers:
   - `notionLessonIds` — if the voice_booking's `notion_lesson_id_1` or `notion_lesson_id_2` matches a fetched Notion lesson ID, skip it.
   - `matchedEmail` — if the voice_booking's email+date matches a Notion lesson's matched booking email+date, skip it.
3. **Filters** — fallback skips practitioner self-bookings (`student_email === session.user.email`), entries without a real student name, and cancelled bookings.
4. **Pricing** — uses `priceFor()` with event type key (`"5925021"` = 45min, `"1945081"` = 60min), detected via `voiceTimeDuration()`.
5. **Time display** — fallback entries with UTC times (e.g. `"5:15 AM UTC – 6:00 AM UTC"`) are converted to local time using the same `formatVoiceTime`/`voiceDateISO` helpers as Notion lessons.

**IMPORTANT**: When adding new dedup, always add a layer ON TOP of existing ones — never replace. Different voice_bookings have different columns populated (some have `notion_lesson_id_*`, others only have matching emails). The combination of both covers all cases.

## Database migrations

SQL migration files live at the repo root (`supabase_*.sql`). Apply them manually via the Supabase dashboard or CLI — there is no automated migration runner.
