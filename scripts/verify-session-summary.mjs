// scripts/verify-session-summary.mjs
// Runnable with: node scripts/verify-session-summary.mjs
// Reimplements the forbidden-term scanner against a sample client-facing draft
// and asserts it is clean, plus checks a deliberately bad draft is flagged.

const FORBIDDEN = [
  "muscle", "reflex", "cranial nerve", "meridian", "organ", "peak time",
  "priority score", "inhibited", "hypertonic", "normotonic", "switching",
  "dysfunctional", "integrated", "uncertain", "fakuda", "rhomberg", "cogs",
  "acupoint", "vagus", "diaphragm reset", "harmonic rocking", "t1 reset",
  "bolt", "coherence",
];

function scan(text) {
  const lower = (text || "").toLowerCase();
  const found = [];
  for (const term of FORBIDDEN) {
    const t = term.toLowerCase().trim();
    const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i");
    if (re.test(lower)) found.push(term);
  }
  return found;
}

const good = `Hi Reuben,

Thanks for coming in today. This session, we checked how your nervous system is running, and we helped your system settle and down-regulate.

You did really well today — proud of you.

Your homework:
- Keep noticing how stress and feelings show up, without needing to fix them
- Drink plenty of water over the next few days

A small win: your breath-hold went from 28s to 34s — a lovely improvement. Keep up the gentle practice.

See you Wednesday 18 November at 4:00 pm.

All the best,
Daniele`;

const bad = "Hi Reuben, your ATNR reflex was Active and your SCM muscle was inhibited. BOLT 28s.";

console.log("good draft forbidden terms:", scan(good));
console.log("bad draft forbidden terms:", scan(bad));

if (scan(good).length !== 0) { console.error("FAIL: good draft flagged"); process.exit(1); }
if (scan(bad).length === 0) { console.error("FAIL: bad draft not flagged"); process.exit(1); }
console.log("OK");
