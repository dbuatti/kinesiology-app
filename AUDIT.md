# Session-page design audit — `/appointments/:id`

Census findings (Quick Assess tab, before fixes): 138 buttons · 228 bordered
elements nested up to 4 deep · 112 text nodes at 9px · 11 distinct font sizes ·
5,047px of scroll in one subtab.

## Batches

### Batch A — Readability ✅
- [x] Font-size floor: all 9/9.5/10px body text raised to 11–13px (CheckItem
      names 13px, stim lines 12px, nuclei/meta 11px, muscle rows 12–13px)
- [x] Eyebrow diet: uppercase-tracked labels only on true section headers;
      track headers, status words and group chips now sentence case
- [x] Status words `INHIBITED` → `Inhibited` etc.

### Batch B — De-nesting & density ✅
- [x] Quick Assess rebuilt as two columns (reflexes · cranial nerves +
      intrinsic) — active from `md` up
- [x] 3-track grid no longer renders as three cramped slivers (stacked)
- [x] Nerve rows de-boxed to plain rows with hairline dividers
- [x] Option 1: cranial-nerve stim lines collapsed by default (Quick Assess +
      dedicated Cranial Nerves tab); auto-expand when the nerve is marked
      inhibited; expand on click
- [x] Sharpened Rhombergs / Frontal Lobe / Righting Reflexes uplifted to the
      Fakuda pattern (segmented status control, refined metrics, compact
      observations, tinted protocol panels)
- [x] Embed: findings list no longer a nested 300px scroller

### Batch C — Layout & chrome ✅
- [x] Client rail docks only ≥1100px (slide-over below), How-to icon-only
- [x] Toggle/control heights unified (`h-7`/`h-8`, `rounded-lg`)
- [x] Phase stepper, reminders and progress line on one indigo accent
- [x] CheckItem rows: soft tints, rounded-lg, no solid green fills

### Green sweep — app-wide ✅
- [x] Token level: `--primary`, `--success`, `--chart-emerald`, `--ring` now
      deep indigo (was teal #0D9488) — light + dark
- [x] Literal `emerald-*` / `teal-*` classes across 96 files → primary tints
      (ordered mapping incl. dark variants, ring/border/shadow/gradient forms)
- [x] Broken double-opacity classes (`primary/40/30`, `primary/20/50` etc.)
      from the sweep repaired
- [x] In-session surfaces: Doc view payment chip, corrections manual (step
      dots, done rows, organ pulse, Yes/No, notes), ClinicalCheatSheet,
      PrimitiveReflexModal, JointActionTableModal/Printable, ProtocolLogSheet
      pulse states
- [x] Business workspace aura (zones.ts) green wash → violet; dot indigo
- [x] Kept intentionally: TCM Wood element dot (ProtocolLogSheet), organ
      colours in vagus/tcm data, mechano plane cards (domain data)
- [x] Browser pixel sweep — verified 0 green pixels on /appointments/:id (live
      studio) and /appointments/demo (local dev) via Chrome extension
      (2026-11-24). Confirmed 0 emerald/green computed colors on both.
- [x] App-wide green sweep via in-house browser (authenticated): 0 green pixels
      on / (Today), /clients (People), and /appointments/:id. All three pages
      clean.
- [x] Font-size floor pass (app-wide): 9px → 11px (12 files), 9.5px → 11px,
      8.5px → 10px, 10.5px → 11px. Remaining sub-10px text is 7/8px in
      printables/badges only.

### Direction audit — afferent / efferent ✅
- [x] Added `--afferent` / `--efferent` tokens (afferent = deep indigo,
      efferent = existing chart-purple hue) plus `PATHWAY_DIRECTION` helpers in
      `src/lib/pathway-direction.ts`; documented in `DESIGN.md`
- [x] Direction is carried by circled `ArrowDownCircle` / `ArrowUpCircle`
      icons — plain `↓` / `↑` remain inhibited / hypertonic status glyphs
- [x] Raw direction colours in pathway data, reflex pills/modal, correction
      dock/manual, document view, session report, logs, brain-zone references,
      Heart Wall tool/protocol and F.n theory now resolve through the tokens
- [x] Clinical status colours remain untouched: rose = inhibited, amber =
      hypertonic, primary/success = clear/complete
- [x] Align priority is a single explicit three-state control:
      None → Priority → Primary priority. One primary per session; replacing
      it demotes the old primary to Priority rather than clearing it.
- [x] Right-click pathway menu (`PathwayRow` / `ReflexQuickRow`) now uses the
      same direction tokens/icons in its Afferent / Efferent submenus and the
      same three-state priority radio control. Priority row glow moved off
      amber (status colour) onto primary indigo.
- [x] Priority tiers now have two distinct colours: Priority = indigo
      (`--primary`), Primary priority = gold (`--priority-gold`,
      `--priority-gold-strong`). Gold is deliberately a hue away from amber
      (hypertonic) and rose (inhibited). Applied in Align (v2/v3/document),
      assessment cards, correction dock, reflex pills/modal and context menus.

### Pre-existing `any` lint errors (not yet done)
- [ ] AppointmentV2Page (7), PreliminaryPhaseV3 (~13), CorrectPhaseV3,
      EmbedPhaseV3, AlignPhaseV3, SharpenedRhombergsTest etc. — mechanical
      `catch (error: any)` / `{} as any` cleanups

### Remaining candidates
- [ ] Align / Correct / Embed / Ease: deeper density pass if wanted
- [ ] Doc view and Grid view styling pass
- [ ] Progress tab: dark "Case Strategy" card
