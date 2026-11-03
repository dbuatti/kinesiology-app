// src/lib/session-summary-forbidden.ts
//
// Client-facing safety scan for the session summary email. The draft must never
// contain clinical identifiers. `scanForbiddenTerms` returns the list of terms
// found (empty = clean). Used by the generator's tests and by the UI to warn
// before the practitioner sends.

export const FORBIDDEN_TERMS: string[] = [
  // muscle / reflex / nerve identifiers
  "muscle", "reflex", "cranial nerve", "meridian", "organ", "peak time",
  "priority score", "inhibited", "hypertonic", "normotonic", "switching",
  "dysfunctional", "integrated", "uncertain",
  // anatomical / clinical shorthand commonly leaked
  "fakuda", "rhomberg", "cogs", "acupoint", "lymphatic suture", "vagus",
  "diaphragm reset", "harmonic rocking", "t1 reset",
  // scoring jargon
  "bolt", "coherence",
];

// Whole-word-ish match (case-insensitive). Multi-word terms matched as phrases.
export function scanForbiddenTerms(text: string): string[] {
  const lower = (text || "").toLowerCase();
  const found: string[] = [];
  for (const term of FORBIDDEN_TERMS) {
    const t = term.toLowerCase().trim();
    if (!t) continue;
    // word boundary on both ends where possible
    const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i");
    if (re.test(lower)) found.push(term);
  }
  return found;
}
