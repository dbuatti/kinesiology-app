// @ts-nocheck
// One-shot summariser: turns a pasted chat-log export with one client into a short
// "how this client communicates" brief the assistant can use when drafting replies
// and interpreting bookings for that client. No tool use needed here.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { requirePractitioner } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const authErr = await requirePractitioner(req, corsHeaders);
  if (authErr) return authErr;

  try {
    const { pasted_logs, channel, client_name } = await req.json();
    if (!pasted_logs || !pasted_logs.trim()) throw new Error("No chat log text provided.");

    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) throw new Error("GEMINI_API_KEY is missing.");

    // Client-side already truncates, but cap again defensively.
    const logs = pasted_logs.slice(-8000);

    const prompt = `You are helping a solo kinesiology/voice-lesson practitioner understand how one of their clients communicates about scheduling, so future replies and bookings can match that client's real style.

CLIENT: ${client_name || "Unknown"}
CHANNEL: ${channel || "mixed"}

RAW MESSAGE LOG (client's messages, possibly mixed with the practitioner's):
${logs}

Write a concise brief (4-6 short bullet points as plain sentences, no markdown headers) covering:
- How this client typically confirms a time (do they repeat the date back, or just say "sounds good"/"that's perfect" meaning "yes to whatever you last proposed"?)
- How they phrase availability constraints (e.g. "until 2pm", "health permitting", vague vs specific)
- How cancellations/reschedules tend to arrive (advance notice vs same-day, with what kind of reason)
- Tone (formal/casual, use of emoji, pet names like "hun"/"darling", terms of endearment)
- Anything else useful for replying in a way that will feel natural to them

Return ONLY the brief as plain text, no JSON, no markdown formatting, no preamble like "Here is the brief".`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3 },
        }),
      },
    );
    const resData = await response.json();
    if (!response.ok) throw new Error(resData?.error?.message || "Gemini error");

    const style_summary = (resData.candidates?.[0]?.content?.parts?.[0]?.text || "").trim();
    if (!style_summary) throw new Error("Gemini returned an empty summary.");

    return new Response(JSON.stringify({ style_summary }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[analyze-client-style] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
