// @ts-nocheck
// Reads a first-conversation transcript with a prospective voice/piano student
// and returns a structured onboarding profile. Read-only: nothing is saved here —
// the New student page prefills its form from the result and voice-onboard saves.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { requirePractitioner } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GEMINI_MODEL = "gemini-2.5-flash";
const MAX_TRANSCRIPT_CHARS = 200_000;

const str = (v) => (typeof v === "string" ? v.trim() : "");
const list = (v) => (Array.isArray(v) ? v.map(str).filter(Boolean) : []);

serve(async (req) => {
  const functionName = "voice-transcript-profile";
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authErr = await requirePractitioner(req, corsHeaders);
    if (authErr) return authErr;

    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) throw new Error("GEMINI_API_KEY is missing.");

    const { transcript } = await req.json();
    const text = str(transcript).slice(0, MAX_TRANSCRIPT_CHARS);
    if (text.length < 40) throw new Error("Paste the conversation transcript first.");

    const prompt = `You are helping a voice and piano teacher onboard a new student after their first conversation (a discovery call or trial chat). The teacher is the practitioner in the transcript; the other speaker is the prospective student (or a parent speaking for a child).

Transcript:
"""
${text}
"""

Extract only what the transcript actually says — never invent details. Use "" or [] when something isn't mentioned. Write in plain, warm, practical English from the teacher's point of view, and refer to the student by first name.

Return ONLY a JSON object with these keys:
- "name": the student's full name if said, else first name, else ""
- "email": email address if said, else ""
- "phone": phone number if said, else ""
- "practice": "voice" or "piano" — which the student wants lessons in (default "voice")
- "summary": 2–4 sentences on who this person is and why they're reaching out now
- "background": their musical history — training, choirs, bands, shows, instruments, how long they've sung/played
- "level": one of "beginner", "some experience", "intermediate", "advanced", "professional", or "" if unclear
- "voice_notes": voice type, range, styles/genres, repertoire, songs they mentioned
- "goals": array of concrete goals (e.g. "Audition for a musical in March", "Sing confidently at a friend's wedding")
- "challenges": array of difficulties, fears or pain points they described (technical, physical, confidence, past experiences)
- "motivation": what's driving them, in their words where possible
- "life_context": relevant life details — age/life stage, work, schedule, health or vocal-health notes, anything that affects lessons
- "logistics": lesson preferences — in person or online, length, frequency, days/times, budget or price discussed, start date
- "first_lesson": array of 3–5 specific suggestions for what to focus on in the first lessons
- "follow_ups": array of things the teacher promised to do or still needs to find out
- "quotes": array of up to 3 short verbatim lines from the student that capture them`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, response_mime_type: "application/json" },
        }),
      },
    );
    const data = await response.json();
    if (!response.ok) {
      console.error(`[${functionName}] Gemini error:`, JSON.stringify(data));
      throw new Error(data.error?.message || "The AI couldn't read the transcript.");
    }

    let raw = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "{}";
    if (raw.includes("```")) raw = raw.replace(/```json\n?/, "").replace(/```\n?/, "").trim();
    const p = JSON.parse(raw);

    const profile = {
      name: str(p.name),
      email: str(p.email).toLowerCase(),
      phone: str(p.phone),
      practice: p.practice === "piano" ? "piano" : "voice",
      summary: str(p.summary),
      background: str(p.background),
      level: str(p.level),
      voice_notes: str(p.voice_notes),
      goals: list(p.goals),
      challenges: list(p.challenges),
      motivation: str(p.motivation),
      life_context: str(p.life_context),
      logistics: str(p.logistics),
      first_lesson: list(p.first_lesson),
      follow_ups: list(p.follow_ups),
      quotes: list(p.quotes).slice(0, 3),
    };
    console.log(`[${functionName}] Profile extracted (${profile.goals.length} goals)`);

    return new Response(JSON.stringify({ success: true, profile }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`[${functionName}] Error:`, error.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
