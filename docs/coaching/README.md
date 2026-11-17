# Coaching Toolkit — Psychology & Emotions

A live-coach knowledge base for the kinesiology app. Each technique is captured
in a consistent, app-ready shape so it can drive both this chat and, eventually,
in-app coaching logic.

> **Source of record:** the FNH Practitioner Reference page
> `https://fnhrefapp.com/psychology-emotions` (Mastery clinical reference,
> aligned to *Psych Alchemy · Practitioner Edition*, Part 3). Verbatim source
> extracts live in [`source/`](source/). This file is the working model — it
> reorganises that material for coaching use and links out to the raw scripts.

---

## Using the coach in an OpenCode chat

This toolkit isn't just reference material — it runs as a **generative coach**
you can talk to inside an OpenCode chat.

| What | Where | What it does |
|------|-------|--------------|
| **The brain** | [`coach-brain.md`](coach-brain.md) | The generative coaching system prompt — stance, method, safety, tone. Portable: the same text becomes the in-app coach later. |
| **The agent** | `.opencode/agents/coach.md` | A primary agent that loads the brain + your memory. Locked down: reads the knowledge, writes only to memory, no shell/web. |
| **`/coach`** | `.opencode/commands/coach.md` | Switches to the coach and opens a session where you left off. |
| **`/checkin`** | `.opencode/commands/checkin.md` | A quick daily check-in that references your open loops. |
| **Your memory** | [`memory/profile.md`](memory/profile.md) | The coach's continuity across sessions — read at start, written at end. Yours to read, edit, or delete. |

**To start a coaching session:** run `/coach` (or `/checkin`) in the TUI, or
switch the session's agent to `coach`. To go back to building, switch to the
`build` agent — the coach can't touch code.

### What "proactive" actually means here — the honest version

A chat is **turn-based**: the coach only speaks when you do, and it can't ping
you at 9pm or monitor you in the background. That's a property of *chat*, not
of the coach. So:

- **Proactive *within* a session — yes.** It opens with a check-in (not "how
  can I help?"), references your open loops by name, notices patterns over
  time, and volunteers a process when it hears the layer — rather than waiting
  to be asked.
- **Proactive *across* days, out-of-band — no, not from a chat.** That needs a
  service: a scheduled job or the app itself calling the model and pushing to
  you. That's the app's job, and it will reuse this exact brain + memory + the
  `source/` knowledge so the two never drift.

The `/checkin` command is the bridge: make it a daily ritual and the
memory file gives it real continuity, so it behaves like a coach who remembers
you rather than a stranger each time.

---

## How to use this in a live coaching conversation

1. **Listen for the layer, not the topic.** Belief, identity, trauma-protection,
   and five-element pattern are *layers*, not subjects. The same presenting
   problem ("I can't switch off at night") can sit at any of them.
2. **Locate the current top domino.** Psychological work is not a shortcut past
   the hierarchy. Start with whatever is actually the present priority
   (survival reflexes, nociception, cranial/neuro, immune, organ, meridian) —
   then use the emotional/belief/identity process only when that layer tests as
   the current priority.
3. **Pick the process from the table below**, run its **Entry → Loop → Checks →
   Integrate** spine, and use the troubleshooting notes when it stalls.
4. **Stay inside scope.** Pattern recognition, psychoeducation, and
   self-coaching support only. See the scope boundary at the bottom.

---

## The process shelf

| # | Process | Use when (entry signal) | Goes to | Source |
|---|---------|--------------------------|---------|--------|
| — | **Standing pre-step** | *Every process, every time.* Cranial brake release before any belief work. | — | [source](source/psych-alchemy-processes.md) |
| 3.1 | **ALLOW** | Meeting stored charge at the felt-sense layer; the base self-practice. | — | [source](source/psych-alchemy-processes.md) |
| 3.2 | **Blockage Shifting** | Overwhelmed by many problems; can't find the core; mental loops. | → 3.3 / 3.4 | [source](source/psych-alchemy-processes.md) |
| 3.3 | **Belief Shifting** | A rule the nervous system holds as true ("I'm not safe"). | → 3.4 (if identity) | [source](source/psych-alchemy-processes.md) |
| 3.4 | **Identity Shifting** | A self-concept built around the rule ("I'm the one who copes"). | → 3.3 (belief underneath) | [source](source/psych-alchemy-processes.md) |
| 3.5 | **Trauma Shifting** | A memory replaying/triggering, running under a somatic response. | → 3.4 (identity in the moment) | [source](source/psych-alchemy-processes.md) |
| 3.6 | **Identity Alignment** | Installing a *desired* identity/state so a goal becomes available. | ← 3.3 / 3.4 first if limbic | [source](source/psych-alchemy-processes.md) |
| 3.7 | **Reality Shifting** | Moving toward a goal and clearing what the movement flushes up. | routes to 3.3 / 3.4 / 3.6 | [source](source/psych-alchemy-processes.md) |

### The routing logic (how the processes hand off)

```
Reality Shifting (3.7) — wrapper for any goal
  └─ identity statement tests NO → what's blocking?
       ├─ a belief   → Belief Shifting (3.3) → if identity surfaces → Identity Shifting (3.4)
       ├─ an identity → Identity Shifting (3.4) → if belief underneath → Belief Shifting (3.3)
       └─ won't hold at all (limbic/dorsal) → nervous-system work first, then 3.6

Blockage Shifting (3.2) — when the system is too noisy to find the object
  └─ resolves to a clean belief → 3.3 · or a clean identity → 3.4

Trauma Shifting (3.5) — a frozen/active memory
  └─ "what kind of person are you being in this moment?" → Identity loop (3.4 Phase 2)
```

**The belief ↔ identity test:** if "what kind of person believes [belief]?"
returns an answer → it's identity work first (3.4). Blank → it's belief work
(3.3). See the one-line decision note in the source.

---

## The one thing that runs underneath everything: ALLOW

Before any loop, the cranial brakes release in a fixed order — **neck → jaw →
eyes → relax the brain → attention to the trunk.** If the client can't get past
the jaw, they are not ready for the belief yet; stay here or go back to
nervous-system work.

- **A**ttention before analysis · **L**et go of tension · **L**ean into the felt
  sense · **O**bserve without changing · **W**elcome the sensation.
- **Integration ≠ clearing.** Met accurately, felt sense *moves* — toward
  resolution, deeper recognition, or correct relationship. Some things (real
  grief, mortality) aren't supposed to resolve.
- **Watch for:** *doing-mode collapse* (using it to get rid of feelings faster —
  suppression with better marketing) and *spiritual bypass* (profound reports,
  no somatic detail). Test: can they describe exactly where, what texture, what
  temperature, how it changed?

Full protocol: [source §3.1](source/psych-alchemy-processes.md).

---

## Pattern recognition layer — TCM five-element psyche patterns

Use the five-element framework to recognise the pattern in **voice, eyes, body,
and language.** Most clients are composites — distinguish constitution from the
element *currently stuck* before deciding where to enter the Shen or Ko cycle.
This is a clinical lens, not a personality test. (See data:
[`five-elements-cues.json`](source/five-elements-cues.json),
[`five-elements-full.json`](source/five-elements-full.json).)

| Element | Reaches for | Defends against | Core belief | Voice / body cue | Stuck expression |
|---------|-------------|-----------------|-------------|------------------|------------------|
| **Wood** (Liver/GB) | Acceptance | Rejection (anger, judgement, perfectionism, control) | "I am not good enough." | Sharp, fast, pointed; direct gaze; brow/shoulder/hip tension; *must/should/right* | Over-assertive/controlling **or** timid/victimised |
| **Fire** (Heart/SI) | Love | Hurt (control, blame, rapid shifts, self-abandonment) | "I am not loveable." | Quick, animated, warm; eyes/face lead; approval seeking | Dominant/controlling **or** submitting/doormat |
| **Earth** (Spleen/St) | Care | Worry (over-giving, absorption, resentment) | "I am not important." | Sing-song; speaks in "we"; scans for who needs help; middle heaviness | Smothering/controlling **or** clinging/self-neglecting |
| **Metal** (Lung/LI) | Worth and value | Grief (disconnection, performance, perfectionism, withdrawal) | "I am not worthy." | Breathy, measured, sighs; composed face; brief gaze then withdrawal; upper-trap tension | Image/performance **or** detached/floating |
| **Water** (Kidney/Bl) | Safety | Fear (over-control, withdrawal, hypervigilance, paralysis) | "I am not safe." | Low/gravelly; hooded or hyper-alert eyes; driven **or** withdrawn; low-back/knee | Over-driven **or** impotent/withdrawn |

### Primary limiting-belief prompts (Mastery screening)

Common candidates — state clearly and test *only* when the hierarchy points to
the belief layer:

> "I am alone" · "I am unsafe" · "I am bad" · "I am not good enough" ·
> "I am not worthy" · "I am unlovable" · "I am powerless / I have no control" ·
> "I am broken / something is wrong with me"

### Enquiry prompts (client's own words, never imposed)

- **Wood:** "What feels difficult to accept, imperfect, out of control, or not
  good enough right now?"
- **Fire:** "Where is connection, hurt, validation-seeking, or emotional
  reactivity showing up in the client's own account?"
- **Earth:** "Where is the client carrying too much for others, worrying, or
  struggling to receive care without guilt?"
- **Metal:** "What loss, value, attachment, performance pressure, or difficulty
  letting go is present in the client's own language?"
- **Water:** "Where does the client describe fear, safety-seeking, withdrawal,
  vigilance, or the need to control risk?"

---

## Body-map layer — GNM conflict themes (contested model, handle with care)

**Framing (must travel with the content):** German New Medicine / Germanic
Heilkunde is a *contested* model, not established medicine. It is included as
an **attributed map of a model**, never as a diagnostic claim. **Never infer a
hidden conflict from a diagnosis, symptom, body side, or muscle test; never
label new or worsening symptoms a "healing phase" in place of medical
assessment.** Full 30-tissue table with safety notes:
[`gnm-map.json`](source/gnm-map.json).

A compressed view of the conflict-theme layer (selected examples):

| Tissue / system | Level | Model conflict theme |
|---|---|---|
| Lung alveoli | Brainstem | Death fright / fear of dying |
| Stomach, small intestine, colon | Brainstem | Can't digest the morsel / can't eliminate something vile |
| Kidney collecting tubules | Brainstem | Existence, abandonment, "refugee" conflict |
| Dermis, breast glands, pleura/pericardium | Cerebellum | Attack on integrity / nest worry / attack against the chest |
| Bone, joints, striated muscle, tendons/ligaments | Cerebral medulla | Self-devaluation (region / performance / ability / movement) |
| Coronary, bronchial, territory linings, rectum/cervix | Cerebral cortex | Territorial loss / fear / anger / powerlessness |
| Epidermis, periosteum, motor/sensory control | Cerebral cortex | Separation, unwanted contact, unable to escape or hold on |
| Pancreatic islets | Cerebral cortex | Fear-disgust / resistance |

---

## Scope & referral boundary

This toolkit supports **pattern recognition, psychoeducation, and self-coaching
practice** within a coaching frame. It does not and must not:

- Diagnose mental illness, or replace psychiatric / psychological care.
- Authorise work beyond the practitioner's professional scope.
- Push traumatic recall or assign trauma self-work beyond the client's capacity.
- Use muscle testing *alone* as consent — use ongoing conscious consent.
- Pressure a client into irreversible or high-impact integration decisions.

**Refer or co-manage** when presentation, risk, or complexity requires it.
**Stop and regulate** if the client becomes overwhelmed, dissociates, goes
blank or drifts (dorsal shutdown is a hard stop, not a technique problem).

---

## Change log

- **2026-11-17** — Initial build. Extracted the full Psychology & Emotions page
  (7 Psych Alchemy processes + five-element psyche patterns + limiting-belief
  prompts + GNM conflict map + scope boundary) from the live FNH reference app
  bundle. Source extracts stored verbatim under `source/`.
- **2026-11-17** — Added the generative coach: `coach-brain.md` (portable
  system prompt), the `coach` OpenCode agent, `/coach` and `/checkin` commands,
  and the `memory/` continuity system (seeded with a first profile).
