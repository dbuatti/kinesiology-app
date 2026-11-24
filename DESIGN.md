# DESIGN.md — Resonance Kinesiology CRM

**Read this file before touching any UI. Never invent colors, font sizes, radii,
shadows, or spacing outside these tokens. If a needed value doesn't exist here,
add it here first, then use it.**

Stack: React 19 · TypeScript · Vite · Tailwind · shadcn/ui (Radix) · lucide-react.
One accent, cool-neutral surfaces, editorial serif display type. Calm clinical
premium — Linear's restraint, not dashboard slop.

---

## 1. Principles

1. **One indigo accent.** Indigo is the only brand color. Semantic colors exist
   only for clinical status (rose = inhibited, amber = hypertonic) and money
   (amber = due). Green is banned — "clear/paid/complete" use the indigo
   accent, never emerald.
2. **Flat, full-bleed, single-scroll.** One scroll region per page
   (`#main-scroll-container`). Never nest an `overflow-y-auto` pane for lists
   or forms; internal scroll is only for real chat panes and side rails.
3. **Borders separate regions, not decoration.** A sidebar-vs-content split
   earns a border; a section in normal page flow usually gets spacing + a
   heading instead of a boxed card.
4. **Content uses the width it's given.** Watch for compounding padding
   (page padding + card padding + grid padding). Prefer stacking full-width
   over columns unless there's real room.
5. **Sentence case everywhere** — labels, buttons, tabs, headings. No ALL CAPS
   except tiny `uppercase tracking-[0.14em+]` eyebrows at 10px.
6. **Icons from lucide only**, 11–16px, stroke 1.75–2.5. No emoji in UI.
7. **No AI slop:** no purple gradients, no gradient CTA buttons, no stock
   three-card rows, no glassmorphism beyond the topbar backdrop-blur, no
   random shadows.

---

## 2. Color tokens (single source: `src/globals.css`)

Use `hsl(var(--token))` via Tailwind classes (`bg-primary`, `text-muted-foreground`…).
Never hardcode hex in components.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--primary` | `243 58% 42%` ≈ `#332DA9` | `243 80% 68%` ≈ `#736CEF` | Buttons, links, active states, ticks, "clear/paid/complete" |
| `--primary-hover` | `243 58% 36%` | `243 80% 60%` | Hover on solid primary |
| `--primary-strong` | `243 58% 34%` | `243 80% 68%` | Colored text on tinted bg |
| `--destructive` | `356 72% 52%` ≈ `#DD2C38` | `356 72% 60%` | Inhibited, destructive actions |
| `--warning` | `32 88% 44%` ≈ `#D3770D` | `32 88% 50%` | Hypertonic, payment due |
| `--background` | `203 39% 98%` | `203 39% 6%` | Page canvas |
| `--card` | (near-white) | `203 39% 8%` | Cards, popovers |
| `--muted` | `210 20% 96%` | `210 15% 15%` | Tinted panels (`bg-muted/50`+), chips |
| `--muted-foreground` | `210 10% 45%` | `210 10% 65%` | Secondary text |
| `--border` | `214 32% 89%` | `214 32% 18%` | Hairlines; often at `/30…/70` |
| `--brand` | `#172B5F` | — | Public website navy only, never in-app |
| `--status-cleared` | `142 71% 45%` (green) | `142 71% 55%` | **Deliberate exception** — cleared/corrected findings only (via `cleared` Tailwind color). Green is otherwise banned; this token exists solely for the cleared/corrected state in the client log. |

### Status language (fixed mapping — do not remix)

| Meaning | Glyph | Treatment |
|---|---|---|
| Inhibited / danger | `↓` | `bg-rose-500/[0.06] border-rose-500/25 text-rose-700 dark:text-rose-300` |
| Hypertonic / warning | `↑` | `bg-amber-500/[0.08] border-amber-500/25 text-amber-700 dark:text-amber-300` |
| Clear · Cleared · Paid · Completed | `✓` | `bg-primary/10 text-primary-strong dark:text-primary` (+ `border-primary/30`) |
| Neutral / unset | — | `bg-muted text-muted-foreground` |

Rules: tinted backgrounds at **6–20% opacity** with matching text color. Solid
fills are reserved for the one solid primary button per view. Raw palette
classes (`emerald-*`, `green-*`) are banned; `scripts/gen-dark-palette.mjs`
remaps legacy light-palette classes for dark mode, but new code uses tokens.

### Correction direction (fixed mapping — do not remix)

Direction is **not** clinical status. Use `src/lib/pathway-direction.ts` and its
`PATHWAY_DIRECTION` classes rather than palette colours or the `↓`/`↑` status
glyphs.

| Meaning | Icon (lucide) | Treatment |
|---|---|---|
| Afferent (bottom-up) | `ArrowDownCircle` | `--afferent` (deep indigo), `--afferent-strong` on tints |
| Efferent (top-down) | `ArrowUpCircle` | `--efferent` (existing chart-purple hue), `--efferent-strong` on tints |

`--efferent` reuses the approved `--chart-purple` hue — it is a direction
token, not a new brand colour. Direction arrows are always the circled lucide
icons; plain `↓` and `↑` stay reserved for inhibited and hypertonic status.
`directionForProcess()` / `directionFromText()` resolve older log entries, so
mechanoreceptor, nociceptive and physiological read as afferent, while
cortical, subcortical, emotional, heart wall and limiting-belief processes read
as efferent. Unknown processes stay neutral.

### Priority tiers

Priority is a single three-state control: **None → Priority → Primary priority**.
Priority uses the indigo `--primary` token; Primary priority uses gold
(`--priority-gold` / `--priority-gold-strong`, exposed as `bg-gold` /
`text-gold-strong`). Gold is intentionally distinct from amber (hypertonic) and
rose (inhibited), which stay clinical status colours. One primary per session;
replacing it demotes the old primary to Priority.

### Charts (Recharts/SVG)

`hsl(var(--chart-primary))` indigo · `--chart-destructive` rose · `--chart-amber`
· `--chart-purple` · `--chart-piano` (kinesiology = primary, voice = destructive,
piano = piano). Never `--chart-emerald` for new work.

---

## 3. Typography

- **Inter** (with optical sizing) for all UI. Tracking `-0.01em` to `-0.02em`
  on 13px+ text.
- **Newsreader** (`font-serif`) for display: page titles, session dates, client
  names. Never for body text or buttons.

Scale (use these, don't improvise):

| Use | Class |
|---|---|
| Eyebrow label | `text-[10px] font-semibold uppercase tracking-[0.14em–0.18em] text-muted-foreground/60–70` |
| Meta / small | `text-[11px] text-muted-foreground` |
| Body / list item | `text-[13px] leading-relaxed` |
| Emphasis body | `text-[15px]` |
| Card title | `text-[13px] font-semibold tracking-tight` |
| Timeline date (serif) | `font-serif text-[18px] font-medium tracking-[-0.01em]` |
| Page title (serif) | `font-serif text-[26px] font-medium tracking-[-0.02em]` |

Body copy never smaller than 10px. Numbers/tabular data get `tabular-nums`.

---

## 4. Spacing & radius

- **4px base scale.** Use Tailwind steps: `0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10`.
  Arbitrary values (`p-[13px]`) are a smell.
- Section rhythm: `space-y-5`–`space-y-8` between sections; `mt-2` label→content.
- Page padding: `px-4 sm:px-6 lg:px-8` + `py-6 lg:py-8`.

Radius:

| Token | Use |
|---|---|
| `rounded-md` (6) | Checkboxes, tiny toggles |
| `rounded-lg` (8) | Inputs, buttons (compact), list rows |
| `rounded-xl` (12) | Buttons (standard), panels, icon tiles |
| `rounded-2xl` (16) | Insights/summary panels, overlays |
| `rounded-3xl` (24) | Hero panels, bubbly chips |
| `rounded-full` | Pills, avatars, segmented controls |

---

## 5. Elevation

- `shadow-xs` on chips and segmented controls.
- Tinted, layered shadows only for true overlays (`shadow-2xl` on dialogs).
- `shadow-md shadow-primary/25` max on the single active step.
- No colored glows on ordinary elements.

---

## 6. Components

- **Buttons:** `h-8` compact / `h-9` standard, `rounded-lg` or `rounded-xl`,
  `text-[12–13px] font-medium`. One solid `bg-primary` per view; everything
  else `variant="outline"` / ghost. Pill toggles `rounded-full` with
  `border-border bg-muted/40` idle → primary tint active.
- **Inputs:** `h-8`–`h-9 rounded-lg border-border bg-background`, labels as
  10px eyebrows.
- **Badges/pills:** tinted bg + colored text (see status table). No solid
  colored badges except solid primary button.
- **Cards:** `rounded-xl border border-border/60 bg-card` only for genuinely
  distinct regions. Summary panels may use `rounded-2xl/3xl bg-muted` tinted
  backgrounds without borders.
- **Segmented controls:** container `rounded-xl bg-muted/60 p-1`, items
  `rounded-lg h-8 text-[12px] font-semibold`, active = `bg-card shadow-xs`
  (+ tinted text when semantic).
- **No tables for history/logs** — use timelines (left rule + 7px dot,
  `ring-4 ring-background`) or wrapped chip grids.
- **Side rails:** client rail `w-[320px] border-l`, sticky `h-[100dvh]`;
  collapsible. Corrections dock per its own spec (left drag handle,
  `top-[59px]`).

### Session page chrome (established pattern — keep consistent)

Row 1 (`h-[42px]`): back · view tabs (left) — initials avatar · timer pills
`3m/6m/9m` · Notes · Manual · How-to · More (right). Row 2: PEACE stepper
(circles: active `h-9 bg-primary`, done `h-8 bg-primary/10 text-primary`,
todo `border-border bg-card`) + Phrenic/Lymph pills + `Corr n / 3–6` + Next.
Client rail on the right holds identity, this-session vitals, statistics,
fundamentals, history.

---

## 7. Motion

`ease-out-expo`, 200–500ms. Entrances: `animate-in fade-in slide-in-from-bottom-4 duration-500`. Progress fills `transition-all duration-500–700`. No bounce, no spring, no parallax. Motion signals state change only.

---

## 8. Accessibility

- Text contrast ≥ 4.5:1 (muted-foreground on background passes; never put
  `text-white` on tints below 40% opacity).
- Focus: `focus-visible:ring-[3px] focus-visible:ring-ring/25`.
- Every icon-only button gets `title` + `aria-label`.
- Primary rail/panel identities are links to the client profile.

---

## 9. Pre-commit checklist (UI work)

- [ ] No new colors, hexes, or palette classes outside §2
- [ ] Afferent/efferent surfaces use `PATHWAY_DIRECTION`, never status colours
      (including right-click pathway menus)
- [ ] Priority is one three-state control — None / Priority / Primary priority —
      including right-click pathway menus. Priority = indigo, Primary priority =
      gold (`--priority-gold`); amber is hypertonic and rose is inhibited.
- [ ] No green anywhere (search `emerald`, `green-`, `success` before push —
      `success` token exists but resolves to indigo)
- [ ] One solid primary button per view
- [ ] Sentence case; eyebrows ≤ 10px uppercase
- [ ] Single scroll region; no nested list scrollers
- [ ] Wrapping, not truncation, in narrow grids (`break-words` > `truncate`)
- [ ] Tabular data `tabular-nums`; dates via `date-fns` format strings
- [ ] Verified at ~1440px and ~768px in the browser before done