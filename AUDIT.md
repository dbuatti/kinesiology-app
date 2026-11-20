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
- [ ] Browser pixel sweep pending — in-app browser was disconnected; verify
      on next reconnect (last sweep measured 0 green pixels)

### Pre-existing `any` lint errors (not yet done)
- [ ] AppointmentV2Page (7), PreliminaryPhaseV3 (~13), CorrectPhaseV3,
      EmbedPhaseV3, AlignPhaseV3, SharpenedRhombergsTest etc. — mechanical
      `catch (error: any)` / `{} as any` cleanups

### Remaining candidates
- [ ] Align / Correct / Embed / Ease: deeper density pass if wanted
- [ ] Doc view and Grid view styling pass
- [ ] Progress tab: dark "Case Strategy" card
