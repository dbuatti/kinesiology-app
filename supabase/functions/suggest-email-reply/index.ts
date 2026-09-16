// @ts-nocheck
// One-shot Gemini draft of a reply to a client email thread — for the
// practitioner to review/edit in ClientEmailThread.tsx before sending. Never
// sends anything itself; mirrors analyze-client-style's single-call shape
// (no tool use needed).
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireUser } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const authErr = await requireUser(req, corsHeaders);
  if (authErr) return authErr;

  try {
    const { client_id, client_name, thread_messages, goal } = await req.json();

    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) throw new Error("GEMINI_API_KEY is missing.");

    let styleSummary = "";
    let sessionNotesBlock = "";
    if (client_id) {
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
      const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
      const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
      const [{ data: profile }, { data: sessions }] = await Promise.all([
        supabase.from("client_ai_profiles").select("style_summary").eq("client_id", client_id).maybeSingle(),
        supabase.from("appointments")
          .select("date, goal, notes, next_session_note")
          .eq("client_id", client_id)
          .eq("status", "Completed")
          .order("date", { ascending: false })
          .limit(3),
      ]);
      styleSummary = profile?.style_summary || "";
      if (sessions?.length) {
        sessionNotesBlock = sessions.map((s: any) => {
          const d = new Date(s.date).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
          const bits = [s.goal && `goal: ${s.goal}`, s.notes && `notes: ${s.notes}`, s.next_session_note && `for next time: ${s.next_session_note}`].filter(Boolean);
          return `- ${d}: ${bits.join(" | ") || "(no notes recorded)"}`;
        }).join("\n").slice(0, 2000);
      }
    }

    // Keep only the last handful of messages — enough context, not the whole history.
    const recent = (thread_messages || []).slice(-8);
    const transcript = recent.length
      ? recent.map((m: any) => `[${m.direction === "inbound" ? (client_name || "Client") : "Daniele"}]: ${(m.body || "").slice(0, 1200)}`).join("\n\n")
      : "(no prior messages — this will be a fresh email, not a reply)";

    const prompt = `You are drafting an email reply on behalf of Daniele, a solo kinesiology/voice-lesson practitioner, to his client ${client_name || "the client"}.

RECENT CONVERSATION:
${transcript}

${sessionNotesBlock ? `RECENT SESSION HISTORY (from Daniele's own clinical notes — use this to sound like someone who actually knows this client, e.g. referencing real progress or what was flagged for next time, not generic pleasantries):\n${sessionNotesBlock}\n` : ""}
${styleSummary ? `HOW THIS CLIENT TYPICALLY COMMUNICATES:\n${styleSummary}\n` : ""}
${goal ? `WHAT DANIELE WANTS THIS REPLY TO ACHIEVE: ${goal}\n` : ""}

Write a short reply body in plain, everyday English — the way a real person types an email to someone they know, not marketing copy. Concretely:
- No corporate/generic filler ("I'm really looking forward to working with you on your goals", "please don't hesitate to reach out", "I hope this email finds you well").
- Short sentences. Say the actual thing you mean, plainly.
- If there's real session history above, ground the reply in it (a specific detail, not a vague "great session last time").
- If there's nothing specific to say (no thread, no session history), keep it brief and concrete rather than padding it out with enthusiasm.
- Do NOT include a greeting ("Hi X,") or a sign-off ("All the best, Daniele") — those are added automatically by the email template, so start directly with the message content.
- Do not invent specific dates/times/prices unless they already appeared in the conversation or session notes above.

Also suggest a short subject line (only needed if this reads as a fresh email rather than a reply — otherwise reuse the natural "Re: ..." subject implied by the conversation, or leave it blank).

Return ONLY a JSON object: {"subject": "...", "body": "..."} — body may contain \\n for paragraph breaks. No markdown, no preamble.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.5, response_mime_type: "application/json" },
        }),
      },
    );
    const resData = await response.json();
    if (!response.ok) throw new Error(resData?.error?.message || "Gemini error");

    let resultText = (resData.candidates?.[0]?.content?.parts?.[0]?.text || "").trim();
    resultText = resultText.replace(/```json\n?/, "").replace(/```\n?/, "").trim();
    if (!resultText) throw new Error("Gemini returned an empty draft.");

    const parsed = JSON.parse(resultText);
    if (!parsed.body) throw new Error("Gemini's draft was missing a body.");

    return new Response(JSON.stringify({ subject: parsed.subject || "", body: parsed.body }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[suggest-email-reply] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
