# Site Architecture — Current State & Proposal

## Current (5 modes, overlapping)

### Clinical
Dashboard | Schedule | Calendar | Clients | Oversight

### Practice Lab
Dashboard | Morning Program | Journal | **The Lab** (Identity Map + Worksheets) | Resources | Self Practice

### Knowledge
Dashboard | Clinical Reference (Resources) | PEACE Framework | Procedures | Quiz | Quick Calibrate

### Voice Studio
Dashboard | Voice Clients | Book Lesson | Studio Calendar

### Business
Dashboard | Overview | Client Audit | Marketing Engine

**Problems:**
- Practice Lab and Knowledge split practitioner development across two modes — tools, identity work, refs, and worksheets are scattered
- Worksheets are duplicated (in LabPage tabs AND full-page routes AND now ResourcesPage)
- "The Lab" is a tab container hiding Identity Map + Worksheets behind a click
- No clear home for worksheets vs clinical reference vs practitioner tools

---

## Implemented: 4 workspaces

### ① Clinical (client sessions)
Dashboard → Schedule → Calendar → Clients → Oversight

### ② Growth (practitioner dev — merged Lab + Knowledge)
Dashboard → Morning Program → Journal → **Identity Work** → **Reference** → **Worksheets** → Self Practice

| Nav item | Points to | Content |
|---|---|---|
| Morning Program | `/morning-program` | Daily ritual |
| Journal | `/practice/journal` | Practitioner reflections |
| Identity Work | `/lab` (Identity Map tab) | Identity Shifting, Alignment, Limiting Beliefs, Fractals |
| Reference | `/resources` | Clinical Reference Hub + PEACE Framework, Procedures, Quiz, Calibrate |
| Worksheets | `/resources` (Worksheets category) | 6 worksheets in card grid |
| Self Practice | `/practice/self` | Self-practice tools |

### ③ Studio (voice)
Dashboard → Clients → Book Lesson → Calendar

### ④ Business
Dashboard → Overview → Client Audit → Marketing Engine

---

**Changes made:**
1. ✅ Added `growth` mode to `AppMode` type
2. ✅ Created `GROWTH_NAV_ITEMS` — flat nav merging Lab + Knowledge content
3. ✅ Updated workspace switcher: **Practice Lab** + **Knowledge** → **Growth**
4. ✅ `SpaceHeader` wired to handle `growth` mode in nav, colors, icons, mobile menu
5. ✅ Old `lab` and `library` mode values still work for users with stale localStorage (graceful fallback)
6. ✅ Worksheets listed directly in ResourcesPage under a "Worksheets" category
7. ✅ Psychology Hub tools now filter `fetchPastSessions` by `client_id`

**Not yet done (open for discussion):**
- Flattening "Identity Map" tab into its own route so it's a direct nav target
- Moving sandbox routes (`/sandbox/identity-shifting`, etc.) to cleaner paths
- Removing `LabPage` tab structure in favor of standalone pages
