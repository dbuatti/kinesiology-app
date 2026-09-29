// Onboarding profile built from a first-conversation transcript
// (edge function `voice-transcript-profile`). Used by New student.

export interface TranscriptProfile {
  name: string;
  email: string;
  phone: string;
  practice: "voice" | "piano";
  summary: string;
  background: string;
  level: string;
  voice_notes: string;
  goals: string[];
  challenges: string[];
  motivation: string;
  life_context: string;
  logistics: string;
  first_lesson: string[];
  follow_ups: string[];
  quotes: string[];
}

/** The text sections of a profile, in reading order. Empty ones are skipped. */
export function profileSections(p: TranscriptProfile): { label: string; text?: string; items?: string[] }[] {
  return [
    { label: "Who they are", text: p.summary },
    { label: "Goals", items: p.goals },
    { label: "Challenges", items: p.challenges },
    { label: "Motivation", text: p.motivation },
    { label: "Musical background", text: [p.level && `Level: ${p.level}.`, p.background].filter(Boolean).join(" ") },
    { label: p.practice === "piano" ? "Playing & repertoire" : "Voice & repertoire", text: p.voice_notes },
    { label: "Life context", text: p.life_context },
    { label: "Lesson logistics", text: p.logistics },
    { label: "First lessons", items: p.first_lesson },
    { label: "Follow up", items: p.follow_ups },
    { label: "In their words", items: p.quotes.map((q) => `“${q}”`) },
  ].filter((s) => (s.items ? s.items.length > 0 : !!s.text));
}

/** Plain-text profile for the student's notes (People record and Notion). */
export function formatProfileNotes(p: TranscriptProfile, date = new Date()): string {
  const day = date.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
  const body = profileSections(p).map((s) =>
    s.items ? `${s.label}:\n${s.items.map((i) => `• ${i}`).join("\n")}` : `${s.label}: ${s.text}`,
  );
  return [`Onboarding profile — first conversation, ${day}`, ...body].join("\n\n");
}
