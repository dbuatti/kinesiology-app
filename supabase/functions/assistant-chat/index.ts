// @ts-nocheck
// Conversational scheduling assistant. Orchestrates Gemini function-calling against
// Supabase (client/appointment data) and Cal.com (live availability). Can draft an
// email for the practitioner to review, but NEVER sends one itself — the only tool
// with email-shaped output (draft_email_reply) just returns its args to the caller.
// The real send lives in a separate function (send-assistant-email) triggered only
// by an explicit button click in the frontend, after this function's turn is done.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireUser } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GEMINI_MODEL = "gemini-2.5-flash";
const MAX_TOOL_ROUNDS = 6;

const functionDeclarations = [
  {
    name: "get_client_context",
    description: "Fetch a client's profile, recent appointments, journal notes, and (if trained) their AI communication-style summary.",
    parameters: {
      type: "OBJECT",
      properties: { client_id: { type: "STRING" } },
      required: ["client_id"],
    },
  },
  {
    name: "get_available_slots",
    description: "Get open Cal.com booking slots in a date range for the practitioner's event type.",
    parameters: {
      type: "OBJECT",
      properties: {
        start: { type: "STRING", description: "ISO date, e.g. 2026-09-15" },
        end: { type: "STRING", description: "ISO date, e.g. 2026-09-22" },
        event_type_id: { type: "NUMBER", description: "Cal.com event type id. Omit to use the default." },
      },
      required: ["start", "end"],
    },
  },
  {
    name: "get_past_booking_patterns",
    description: "Analyse a client's historical appointments to find preferred days/times and cancellation behaviour.",
    parameters: {
      type: "OBJECT",
      properties: { client_id: { type: "STRING" } },
      required: ["client_id"],
    },
  },
  {
    name: "draft_email_reply",
    description: "Produce a DRAFT email for the practitioner to review before sending. This does NOT send anything — it only returns draft text for human approval. Always use this instead of claiming you've sent an email.",
    parameters: {
      type: "OBJECT",
      properties: {
        to: { type: "STRING" },
        subject: { type: "STRING" },
        body: { type: "STRING" },
        client_id: { type: "STRING" },
        appointment_id: { type: "STRING" },
      },
      required: ["to", "subject", "body"],
    },
  },
  {
    name: "search_inbox",
    description: "Search the practice's Gmail inbox (read-only) using Gmail search syntax, e.g. \"from:anita@example.com\" or \"subject:lesson\". Returns matching messages with sender, subject, date, and a snippet.",
    parameters: {
      type: "OBJECT",
      properties: { query: { type: "STRING", description: "Gmail search query, e.g. 'from:anitalaterra02@gmail.com newer_than:14d'" } },
      required: ["query"],
    },
  },
];

function melbourneNow() {
  return new Date().toLocaleString("en-AU", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Australia/Melbourne",
  });
}

function fmtMelbourne(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", timeZone: "Australia/Melbourne" });
  const time = d.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Australia/Melbourne" });
  return `${date} at ${time}`;
}

async function callGemini(geminiKey: string, contents: any[], systemInstruction: string) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: systemInstruction }] },
        tools: [{ functionDeclarations }],
        generationConfig: { temperature: 0.4 },
      }),
    },
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || "Gemini API error");
  return data;
}

async function runGetClientContext(supabase: any, userId: string, clientId: string) {
  const { data: client, error: clientErr } = await supabase
    .from("clients")
    .select("id, name, email, phone, standard_rate, journal, preferred_time, availability_notes")
    .eq("id", clientId).eq("user_id", userId).maybeSingle();
  if (clientErr || !client) return { error: "Client not found." };

  const { data: appointments } = await supabase
    .from("appointments")
    .select("date, status, name, notes")
    .eq("client_id", clientId).eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(10);

  const { data: profile } = await supabase
    .from("client_ai_profiles")
    .select("style_summary, channel")
    .eq("client_id", clientId).maybeSingle();

  return {
    client: { name: client.name, email: client.email, phone: client.phone, standard_rate: client.standard_rate, preferred_time: client.preferred_time, availability_notes: client.availability_notes },
    recent_appointments: (appointments || []).map((a: any) => ({ date: fmtMelbourne(a.date), status: a.status })),
    communication_style: profile?.style_summary || null,
    communication_channel: profile?.channel || null,
  };
}

async function runGetAvailableSlots(start: string, end: string, eventTypeId: number | undefined) {
  const CALCOM_KEY = Deno.env.get("CALCOM_API_KEY");
  if (!CALCOM_KEY) return { error: "Cal.com is not configured." };
  const headers = { Authorization: `Bearer ${CALCOM_KEY}`, "cal-api-version": "2024-09-04", "Content-Type": "application/json" };
  const url = new URL("https://api.cal.com/v2/slots");
  url.searchParams.set("start", start);
  url.searchParams.set("end", end);
  url.searchParams.set("eventTypeId", String(eventTypeId || "4279898"));
  url.searchParams.set("timeZone", "Australia/Melbourne");

  const res = await fetch(url.toString(), { method: "GET", headers });
  const data = await res.json();
  if (!res.ok) return { error: data?.error?.message || "Cal.com slots error." };

  const raw = data?.data?.slots || data?.data || {};
  const slots: Record<string, string[]> = {};
  for (const [date, entries] of Object.entries<any>(raw)) {
    slots[date] = (entries || []).map((e: any) => {
      const iso = typeof e === "string" ? e : (e?.start || e?.time);
      return fmtMelbourne(iso);
    });
  }
  return { slots };
}

async function runSearchInbox(supabaseUrl: string, serviceKey: string, query: string) {
  const res = await fetch(`${supabaseUrl}/functions/v1/gmail-search-inbox`, {
    method: "POST",
    headers: { Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, maxResults: 8 }),
  });
  const data = await res.json();
  if (!res.ok) return { error: data?.error || "Inbox search failed." };
  return data;
}

async function runGetPastBookingPatterns(supabase: any, userId: string, clientId: string) {
  const { data: appointments, error } = await supabase
    .from("appointments")
    .select("date, status")
    .eq("client_id", clientId).eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(50);
  if (error) return { error: "Could not load appointment history." };
  if (!appointments || appointments.length === 0) return { note: "No appointment history for this client yet." };

  const dayCounts: Record<string, number> = {};
  const hourBuckets: Record<string, number> = {};
  let cancelled = 0;
  for (const a of appointments) {
    const d = new Date(a.date);
    const day = d.toLocaleDateString("en-AU", { weekday: "long", timeZone: "Australia/Melbourne" });
    const hour = Number(d.toLocaleTimeString("en-AU", { hour: "numeric", hour12: false, timeZone: "Australia/Melbourne" }));
    const bucket = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
    dayCounts[day] = (dayCounts[day] || 0) + 1;
    hourBuckets[bucket] = (hourBuckets[bucket] || 0) + 1;
    if (a.status === "Cancelled" || a.status === "No Show") cancelled += 1;
  }

  return {
    total_appointments: appointments.length,
    by_day_of_week: dayCounts,
    by_time_of_day: hourBuckets,
    cancellation_rate: `${Math.round((cancelled / appointments.length) * 100)}%`,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authErr = await requireUser(req, corsHeaders);
  if (authErr) return authErr;

  try {
    const { conversation_id, client_id, message } = await req.json();
    if (!message) throw new Error("Missing message.");

    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) throw new Error("GEMINI_API_KEY is missing.");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    // Identify the calling user from their own JWT (requireUser only tells us they're
    // allowed through, not who they are).
    const authHeader = req.headers.get("Authorization") || "";
    const authedClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await authedClient.auth.getUser();
    if (!user) throw new Error("Could not identify the calling user.");
    const userId = user.id;

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Load or create the conversation.
    let conversationId = conversation_id;
    if (conversationId) {
      await supabase.from("assistant_conversations")
        .update({ updated_at: new Date().toISOString(), ...(client_id !== undefined ? { client_id: client_id || null } : {}) })
        .eq("id", conversationId).eq("user_id", userId);
    } else {
      const { data: convo, error: convoErr } = await supabase
        .from("assistant_conversations")
        .insert({ user_id: userId, client_id: client_id || null, title: message.slice(0, 60) })
        .select("id").single();
      if (convoErr) throw new Error(convoErr.message);
      conversationId = convo.id;
    }

    // Prior turns (user/model text only — tool-call minutiae isn't replayed to keep
    // token growth linear rather than quadratic as a conversation gets long).
    const { data: priorRows } = await supabase
      .from("assistant_messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .in("role", ["user", "model"])
      .order("created_at", { ascending: true })
      .limit(40);

    const contents = (priorRows || []).map((r: any) => ({ role: r.role, parts: [{ text: r.content || "" }] }));
    contents.push({ role: "user", parts: [{ text: message }] });

    const systemInstruction = `You are the scheduling assistant inside Daniele's kinesiology/voice-lesson practice CRM. Current time: ${melbourneNow()} (Australia/Melbourne).
Clients communicate messily — vague times ("until 2pm", "health permitting"), same-day cancellations, and ambiguous confirmations ("that's perfect" meaning "yes to the last time you proposed"). Interpret them charitably but flag genuine ambiguity rather than guessing.
Use the available tools to ground your answers in real data — never invent appointment times, client details, or slot availability.
${client_id ? `This conversation is focused on one specific client (client_id: ${client_id}). Call get_client_context first to load their history and communication style, and match their tone when drafting anything.` : "This is a general conversation, not focused on one client."}
You can draft an email for review via draft_email_reply, but you can never send one yourself — always say the draft is ready for review, never that it has been sent.
You can search the inbox read-only via search_inbox (Gmail search syntax) to check for replies or past correspondence — you cannot send, modify, or delete anything through it.`;

    const toolTrace: any[] = [];
    let pendingDraft = null;
    let finalText = "";

    for (let i = 0; i < MAX_TOOL_ROUNDS; i++) {
      const resp = await callGemini(geminiKey, contents, systemInstruction);
      const candidate = resp?.candidates?.[0];
      const part = candidate?.content?.parts?.[0];
      if (!part) {
        finalText = "I couldn't generate a response just then — could you try rephrasing?";
        break;
      }

      if (part.functionCall) {
        const { name, args } = part.functionCall;
        let result: any;
        if (name === "draft_email_reply") {
          pendingDraft = { to: args.to, subject: args.subject, body: args.body, client_id: args.client_id || client_id || null, appointment_id: args.appointment_id || null };
          result = { status: "drafted", note: "Draft created for human review. It has not been sent." };
        } else if (name === "search_inbox") {
          result = await runSearchInbox(SUPABASE_URL, SERVICE_KEY, args.query);
        } else if (name === "get_client_context") {
          result = await runGetClientContext(supabase, userId, args.client_id);
        } else if (name === "get_available_slots") {
          result = await runGetAvailableSlots(args.start, args.end, args.event_type_id);
        } else if (name === "get_past_booking_patterns") {
          result = await runGetPastBookingPatterns(supabase, userId, args.client_id);
        } else {
          result = { error: `Unknown tool: ${name}` };
        }
        toolTrace.push({ name, args, result });
        contents.push({ role: "model", parts: [{ functionCall: { name, args } }] });
        contents.push({ role: "function", parts: [{ functionResponse: { name, response: result } }] });
        continue;
      }

      finalText = part.text || "";
      break;
    }

    if (!finalText) finalText = "I ran out of steps trying to answer that — could you narrow the question down?";

    await supabase.from("assistant_messages").insert([
      { conversation_id: conversationId, role: "user", content: message },
      { conversation_id: conversationId, role: "model", content: finalText, tool_calls: toolTrace.length ? toolTrace : null, draft_email: pendingDraft },
    ]);

    return new Response(JSON.stringify({ conversation_id: conversationId, reply: finalText, draft_email: pendingDraft }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[assistant-chat] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
