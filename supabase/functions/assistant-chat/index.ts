// @ts-nocheck
// Conversational scheduling assistant. Orchestrates Gemini function-calling against
// Supabase (client/appointment data) and Cal.com (live availability). Can draft an
// email for the practitioner to review, but NEVER sends one itself — the only tool
// with email-shaped output (draft_email_reply) just returns its args to the caller.
// The real send lives in a separate function (send-assistant-email) triggered only
// by an explicit button click in the frontend, after this function's turn is done.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requirePractitioner } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GEMINI_MODEL = "gemini-2.5-flash";
const MAX_TOOL_ROUNDS = 6;

// --- Ported from src/utils/timetable-scheduler.ts (kept in sync manually — pure
// logic, no browser deps) so availability the assistant is told in chat parses
// into the exact same structured windows the Timetable Simulator's auto-drafter
// reads from `timetable_client_availability`, not just a human-readable note. ---
const DAY_WORDS: Record<string, number> = {
  sun: 0, sunday: 0, mon: 1, monday: 1, tue: 2, tues: 2, tuesday: 2,
  wed: 3, weds: 3, wednesday: 3, thu: 4, thur: 4, thurs: 4, thursday: 4,
  fri: 5, friday: 5, sat: 6, saturday: 6,
};
const DAY_ORDER = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const TIME_RE = "\\d{1,2}(?:[:.]\\d{2})?\\s*(?:a\\.?m\\.?|p\\.?m\\.?)?";

function parseClock(tok: string): string | null {
  const m = tok.trim().toLowerCase().match(/^(\d{1,2})(?:[:.](\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?$/);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  const ap = m[3]?.replace(/\./g, "");
  if (ap === "pm" && h !== 12) h += 12;
  if (ap === "am" && h === 12) h = 0;
  if (!ap && h <= 7) h += 12;
  if (h > 23 || min > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

function parseAvailabilityText(text: string): { days: number[]; from: string | null; to: string | null }[] {
  const windows: { days: number[]; from: string | null; to: string | null }[] = [];
  const clauses = text.toLowerCase().replace(/\bx+\s*$/i, "").split(/\bor\b|,|;|\band\b|\n|\//);

  for (const raw of clauses) {
    let s = ` ${raw.trim()} `;
    if (!s.trim()) continue;
    let from: string | null = null;
    let to: string | null = null;

    const range = s.match(new RegExp(`(${TIME_RE})\\s*(?:-|–|to)\\s*(${TIME_RE})`, "i"));
    if (range && parseClock(range[1]) && parseClock(range[2])) {
      from = parseClock(range[1]); to = parseClock(range[2]); s = s.replace(range[0], " ");
    } else {
      const FILLER = "(?:about|around|approx\\.?|roughly)?\\s*";
      const fromM = s.match(new RegExp(`(?:from|after)\\s+${FILLER}(${TIME_RE})`, "i")) ||
        s.match(new RegExp(`(${TIME_RE})\\s*(?:onwards?|\\+)`, "i"));
      if (fromM) { from = parseClock(fromM[fromM.length - 1]); s = s.replace(fromM[0], " "); }
      const toM = s.match(new RegExp(`(?:until|before|til|till|by)\\s+${FILLER}(${TIME_RE})`, "i"));
      if (toM) { to = parseClock(toM[toM.length - 1]); s = s.replace(toM[0], " "); }
    }

    if (from == null && to == null) {
      const bare = s.match(/\b(\d{1,2}(?:[:.]\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)|\d{1,2}[:.]\d{2})\b/i);
      if (bare && parseClock(bare[1])) { from = parseClock(bare[1]); s = s.replace(bare[0], " "); }
    }

    let days: number[] = [];
    if (/weekday/.test(s)) days = [1, 2, 3, 4, 5];
    else if (/weekend/.test(s)) days = [0, 6];
    else {
      const dr = s.match(/(sun|mon|tue|tues|wed|weds|thu|thur|thurs|fri|sat)[a-z]*\s*(?:-|to|thru|through)\s*(sun|mon|tue|tues|wed|weds|thu|thur|thurs|fri|sat)[a-z]*/);
      if (dr && DAY_WORDS[dr[1]] != null && DAY_WORDS[dr[2]] != null) {
        let a = DAY_WORDS[dr[1]], b = DAY_WORDS[dr[2]];
        for (let i = 0; i < 7; i++) { days.push(a); if (a === b) break; a = (a + 1) % 7; }
      } else {
        const found = new Set<number>();
        for (const word of DAY_ORDER) {
          if (new RegExp(`\\b${word.slice(0, 3)}[a-z]*\\b`).test(s)) found.add(DAY_WORDS[word]);
        }
        days = [...found].sort();
      }
    }

    if (days.length === 0 && from == null && to == null && !/any\s*(?:day|time)|every\s*day|daily/.test(s)) continue;
    windows.push({ days, from, to });
  }
  return windows;
}

// --- Ported from src/lib/clientStatus.ts (kept in sync manually — same
// convention as parseAvailabilityText above) so get_clients_needing_attention
// uses the exact same lead/active/at_risk/lapsed logic as the frontend's
// NeedsAttentionWidget/ClientTableView, instead of a second, divergent
// definition of "who needs follow-up". ---
const AT_RISK_AFTER_DAYS = 90;
const LAPSED_AFTER_DAYS = 240;
const QUICK_WIN_CANCELLATION_WINDOW_DAYS = 30;

function computeClientLifecycleStatus(appointments: { date: string; status: string }[], hasFutureBooking: boolean) {
  if (!appointments || appointments.length === 0) {
    return { status: "lead", reason: "Never booked a session", daysSinceLast: null, isQuickWin: false };
  }
  if (hasFutureBooking) {
    return { status: "active", reason: "Has a session booked ahead", daysSinceLast: null, isQuickWin: false };
  }
  const now = new Date();
  const sorted = [...appointments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const mostRecent = sorted[0];
  const daysSinceMostRecent = Math.round((now.getTime() - new Date(mostRecent.date).getTime()) / (1000 * 60 * 60 * 24));

  const realSessions = sorted.filter((a) => a.status !== "Cancelled" && a.status !== "cancelled");

  if (mostRecent.status === "Cancelled" || mostRecent.status === "cancelled") {
    return {
      status: "at_risk",
      reason: `Cancelled their last session (${daysSinceMostRecent}d ago) and hasn't rebooked`,
      daysSinceLast: daysSinceMostRecent,
      // A recent cancellation from an otherwise-real client (2+ prior real
      // sessions) is a much easier re-engagement than someone genuinely gone
      // quiet — surfaced separately so the model can prioritize/frame these
      // as low-effort wins instead of treating every at_risk case the same.
      isQuickWin: realSessions.length > 0 && daysSinceMostRecent <= QUICK_WIN_CANCELLATION_WINDOW_DAYS,
    };
  }

  if (realSessions.length === 0) return { status: "lead", reason: "Never completed a session", daysSinceLast: null, isQuickWin: false };
  const daysSinceLast = Math.round((now.getTime() - new Date(realSessions[0].date).getTime()) / (1000 * 60 * 60 * 24));

  if (daysSinceLast <= AT_RISK_AFTER_DAYS) return { status: "active", reason: "Seen recently, nothing booked ahead yet", daysSinceLast, isQuickWin: false };
  if (daysSinceLast <= LAPSED_AFTER_DAYS) return { status: "at_risk", reason: `Gone quiet — ${daysSinceLast}d since last session, nothing booked`, daysSinceLast, isQuickWin: false };
  return { status: "lapsed", reason: "Was active, hasn't returned in over 8 months", daysSinceLast, isQuickWin: false };
}

const functionDeclarations = [
  {
    name: "get_client_context",
    description: "Fetch a KINESIOLOGY/FNH client's profile (including current rate vs their target/ladder rate), recent appointments, journal notes, and (if trained) their AI communication-style summary. For voice/piano/singing lesson students, use search_voice_client instead — they live in a separate system.",
    parameters: {
      type: "OBJECT",
      properties: { client_id: { type: "STRING" } },
      required: ["client_id"],
    },
  },
  {
    name: "search_voice_client",
    description: "Search for a Voice Studio (piano/voice lesson) student by name or email, and fetch their recent lesson booking history. Voice students are NOT in the kinesiology clients table — use this instead of get_client_context for anything voice/lesson related.",
    parameters: {
      type: "OBJECT",
      properties: { query: { type: "STRING", description: "Student name or email to search for, e.g. 'Nikki' or 'nicolelrot@gmail.com'" } },
      required: ["query"],
    },
  },
  {
    name: "get_active_clients",
    description: "List kinesiology clients actively seen in the recent period (has a session in the window and/or a future booking), each with their session count, last session date, and current rate vs target rate. Use this to understand who's currently engaged in the practice.",
    parameters: {
      type: "OBJECT",
      properties: { months: { type: "NUMBER", description: "How many months back counts as 'active'. Defaults to 3." } },
    },
  },
  {
    name: "get_revenue_opportunities",
    description: "Find active kinesiology clients currently priced below their target/ladder rate, ranked by estimated near-term revenue gain if they were moved to their target rate. Use this to answer 'which clients would immediately mean more revenue'.",
    parameters: {
      type: "OBJECT",
      properties: { months: { type: "NUMBER", description: "Activity window in months used to judge 'active' and to weight the estimate. Defaults to 3." } },
    },
  },
  {
    name: "get_practice_schedule_overview",
    description: "Analyse recent appointments and voice lessons across the WHOLE practice (not one client) to show which days/times are busiest vs quietest — use this to recommend good times to schedule new or needs-attention clients.",
    parameters: {
      type: "OBJECT",
      properties: { weeks: { type: "NUMBER", description: "How many recent weeks to analyse. Defaults to 8." } },
    },
  },
  {
    name: "get_anchor_candidates",
    description: "Find 'anchor' clients/students — a long, consistent booking history (4+ sessions, low cancellation rate, same day-and-time most of the time) AND recently active — across BOTH kinesiology and voice, split into: open_anchors (strong pattern, seen recently, nothing booked yet — secure these first, same slot), lapsed_anchors (the SAME strong pattern but haven't been seen in a while — real anchors gone quiet, needs a warm re-engagement check-in, NOT a same-slot assumption), already_secured_anchors (strong pattern, already has a future booking, no action needed), and needs_conversion_support (shorter or less consistent history, still worth booking but lower priority than either anchor bucket). Use this for 'help me fill my week' / 'who should I prioritise' / anchor-mode conversations.",
    parameters: { type: "OBJECT", properties: {} },
  },
  {
    name: "get_available_slots",
    description: "Get open Cal.com booking slots in a date range for the practitioner's event type. Pass client_id (kinesiology) OR voice_student_email (voice) whenever you're finding a slot FOR a specific person (not just checking general availability) — the result then ranks/annotates a `suggested` shortlist by that person's own historical day/time pattern (plus availability_notes for kinesiology), so you're not guessing which of the (often dozens of) open slots they'd actually want. This works identically for both — voice students are NOT second-class here.",
    parameters: {
      type: "OBJECT",
      properties: {
        start: { type: "STRING", description: "ISO date, e.g. 2026-09-15" },
        end: { type: "STRING", description: "ISO date, e.g. 2026-09-22" },
        event_type_id: { type: "NUMBER", description: "Cal.com event type id. Omit to use the default." },
        client_id: { type: "STRING", description: "Kinesiology client id — when provided, ranks slots by this client's availability_notes + booking history instead of returning an unranked list." },
        voice_student_email: { type: "STRING", description: "Voice student email — when provided (instead of client_id), ranks slots by this student's booking history the same way client_id does for kinesiology." },
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
    name: "propose_booking",
    description: "Propose booking a specific real, available slot (from get_available_slots) for a client OR a voice student — both work identically now. This does NOT create the booking — it only returns a proposal for human review and confirmation, and also appears pencilled into the Timetable Simulator. Always call get_available_slots first to confirm the exact time is genuinely free before proposing it; never invent a time. Provide client_id for kinesiology, or voice_student_email for voice — not both.",
    parameters: {
      type: "OBJECT",
      properties: {
        client_id: { type: "STRING", description: "Kinesiology client id. Provide this OR voice_student_email." },
        voice_student_email: { type: "STRING", description: "Voice student email. Provide this OR client_id." },
        client_name: { type: "STRING", description: "The client or voice student's display name." },
        start_iso: { type: "STRING", description: "Exact ISO datetime of the slot, taken verbatim from a prior get_available_slots result." },
        event_type_id: { type: "NUMBER", description: "Cal.com event type id. Omit to use the default (kinesiology default if client_id is set, voice default if voice_student_email is set)." },
        notes: { type: "STRING", description: "Optional short note about why this slot / session." },
      },
      required: ["client_name", "start_iso"],
    },
  },
  {
    name: "update_client_availability",
    description: "Save or update what you've learned about a client or voice student's availability (e.g. \"only Tuesday evenings now\", \"not Wednesdays\") so future scheduling remembers it — works for both arms equally. Pass client_id for kinesiology, or voice_student_email for voice. Use this whenever the practitioner tells you something new about when someone can/can't do sessions — this is a low-stakes internal note, not client-facing, so save it directly rather than asking permission first.",
    parameters: {
      type: "OBJECT",
      properties: {
        client_id: { type: "STRING", description: "Kinesiology client id. Provide this OR voice_student_email, not both." },
        voice_student_email: { type: "STRING", description: "Voice student email. Provide this OR client_id, not both." },
        availability_notes: { type: "STRING", description: "The full, updated availability note — replace the old note with the complete new text, don't just append a fragment." },
      },
      required: ["availability_notes"],
    },
  },
  {
    name: "draft_email_reply",
    description: "Produce a DRAFT email for the practitioner to review before sending. This does NOT send anything — it only returns draft text for human approval. Always use this instead of claiming you've sent an email. The body must be PLAIN TEXT exactly as a person would type it into an email — no markdown at all (no **bold**, no bullet *asterisks*, no # headings); use a plain '-' or nothing for a list. Daniele is a single practitioner writing personally to someone he knows, not a business — write in first person singular ('I', never 'we'/'our team') and keep it sounding like him, not like marketing copy.",
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
  {
    name: "get_clients_needing_attention",
    description: "List kinesiology clients and voice students who need follow-up right now — status 'at_risk' (cancelled their last session and hasn't rebooked, or gone quiet 90-240 days) or 'lapsed' (quiet 240+ days), each with a plain-English reason, is_quick_win (true when it's a recent cancellation — within 30 days — from an otherwise real/consistent client, sorted first: these are the lowest-effort rebooks, not someone drifting away), and whether they were already emailed recently (recently_contacted). This is the SAME data the Needs Follow-Up widget on the Assistant page shows. Use this for 'who's slipping through the cracks' / 'who needs a check-in' / 'who's an easy win' — and always check recently_contacted before suggesting a fresh outreach to someone.",
    parameters: { type: "OBJECT", properties: {} },
  },
];

// Belt-and-suspenders for the system prompt's "no markdown" instruction —
// Gemini still occasionally slips into **bold**/bullet-asterisk/heading
// syntax out of habit (real complaint: literal "**" showing up in a launch
// campaign draft). Strips it deterministically so a drafted email always
// reads as plain text, regardless of whether the model followed the prompt.
function stripMarkdown(text: string): string {
  if (!text) return text;
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/(?<!\w)\*(\S(?:.*?\S)?)\*(?!\w)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[*]\s+/gm, "- ");
}

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
  if (!res.ok) {
    const message = data?.error?.message || `Gemini API error (status ${res.status})`;
    // Tag 429/503 explicitly even when the body text doesn't literally say
    // "quota" — isRetryableModelError()/the frontend's quota check both key
    // off this, and a mis-tagged error would silently skip the key-rotation
    // and OpenRouter fallback below.
    throw new Error(res.status === 429 || res.status === 503 ? `RESOURCE_EXHAUSTED: ${message}` : message);
  }
  return data;
}

function isRetryableModelError(message: string): boolean {
  return /RESOURCE_EXHAUSTED|quota|rate limit|overloaded|UNAVAILABLE|503|429/i.test(message || "");
}

// --- OpenRouter fallback: only reached once every Gemini key above is
// exhausted on a retryable (quota/5xx) error. Translates the Gemini-shaped
// `contents`/functionDeclarations this file already builds into OpenAI's
// chat-completions + tools format, and translates the response back into the
// same { candidates: [{ content: { parts: [...] } }] } shape callGemini
// returns, so the main tool loop below doesn't need to know which provider
// actually served a given round. Model choice is a live-verification item,
// not a fixed guarantee — free models on OpenRouter get deprecated/repriced
// without much notice (an earlier choice here, meta-llama/llama-3.3-70b-
// instruct:free, was pulled from the free tier entirely — confirmed live via
// real production logs on 2026-09-21: "This model is unavailable for free.").
// A SINGLE free model is also its own single point of failure even when it's
// not dead: qwen/qwen3.8-27b:free returned a real 429 live on 2026-09-22 —
// "temporarily rate-limited upstream" — because OpenRouter's free models
// share ONE capacity pool across every user of that model, independent of
// our own usage; it recovers on its own but isn't something we control.
// A short list tried in sequence (like the Gemini key rotation above) means
// one model's shared pool being saturated doesn't take the whole fallback
// down with it. Re-checked against OpenRouter's own /api/v1/models on
// 2026-09-22, filtering price=0 AND "tools" in supported_parameters — if
// these start failing too, re-run that query rather than guessing:
//   curl -s https://openrouter.ai/api/v1/models | python3 -c "import json,sys; d=json.load(sys.stdin); [print(m['id']) for m in d['data'] if float(m['pricing']['prompt'] or 1)==0 and 'tools' in (m.get('supported_parameters') or [])]"
const OPENROUTER_FALLBACK_MODELS = ["qwen/qwen3.8-27b:free", "google/gemma-4-31b-it:free", "nvidia/nemotron-3-super-120b-a12b:free"];

function geminiTypeToJsonSchema(p: any): any {
  const TYPE_MAP: Record<string, string> = { OBJECT: "object", STRING: "string", NUMBER: "number", BOOLEAN: "boolean", ARRAY: "array" };
  const out: any = { type: TYPE_MAP[p?.type] || "string" };
  if (p?.description) out.description = p.description;
  if (out.type === "object") {
    out.properties = {};
    for (const [k, v] of Object.entries<any>(p?.properties || {})) out.properties[k] = geminiTypeToJsonSchema(v);
    if (p?.required) out.required = p.required;
  }
  if (out.type === "array" && p?.items) out.items = geminiTypeToJsonSchema(p.items);
  return out;
}

// contents is always built here as sequential (model:functionCall) then
// (function:functionResponse) pairs with nothing interleaved, so a single
// incrementing counter — bumped on each functionCall and reused verbatim for
// the very next functionResponse — is enough to keep OpenAI's required
// assistant.tool_calls[].id / tool.tool_call_id pairing consistent, with no
// need to persist ids anywhere Gemini's own shape has no room for.
function contentsToOpenAIMessages(contents: any[], systemInstruction: string) {
  const messages: any[] = [{ role: "system", content: systemInstruction }];
  let pendingCallId: string | null = null;
  let callCounter = 0;
  for (const c of contents) {
    const part = c.parts?.[0];
    if (!part) continue;
    if (part.functionCall) {
      callCounter += 1;
      pendingCallId = `call_${callCounter}`;
      messages.push({
        role: "assistant", content: null,
        tool_calls: [{ id: pendingCallId, type: "function", function: { name: part.functionCall.name, arguments: JSON.stringify(part.functionCall.args || {}) } }],
      });
    } else if (part.functionResponse) {
      messages.push({ role: "tool", tool_call_id: pendingCallId || `call_${callCounter}`, content: JSON.stringify(part.functionResponse.response || {}) });
    } else {
      messages.push({ role: c.role === "model" ? "assistant" : "user", content: part.text || "" });
    }
  }
  return messages;
}

function openRouterToGeminiShape(data: any) {
  const msg = data?.choices?.[0]?.message;
  if (!msg) return { candidates: [] };
  const toolCall = msg.tool_calls?.[0];
  if (toolCall) {
    let args: any = {};
    try { args = JSON.parse(toolCall.function?.arguments || "{}"); } catch { /* leave empty on malformed args */ }
    return { candidates: [{ content: { parts: [{ functionCall: { name: toolCall.function?.name, args } }] } }] };
  }
  return { candidates: [{ content: { parts: [{ text: msg.content || "" }] } }] };
}

async function callOpenRouter(openRouterKey: string, contents: any[], systemInstruction: string) {
  const messages = contentsToOpenAIMessages(contents, systemInstruction);
  const tools = functionDeclarations.map((fd) => ({ type: "function", function: { name: fd.name, description: fd.description, parameters: geminiTypeToJsonSchema(fd.parameters) } }));

  let lastErr: Error | null = null;
  for (const model of OPENROUTER_FALLBACK_MODELS) {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${openRouterKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, tools, tool_choice: "auto", temperature: 0.4 }),
    });
    const data = await res.json();
    if (res.ok) return openRouterToGeminiShape(data);
    // "Provider returned error" (OpenRouter's own generic wrapper message)
    // used to give zero insight into what actually failed underneath —
    // include the raw error body so a real failure is diagnosable from the
    // frontend's own error message without needing dashboard log access.
    lastErr = new Error(`OpenRouter ${res.status} (${model}): ${JSON.stringify(data?.error || data)}`);
    console.error("[assistant-chat] OPENROUTER_MODEL_FAILED (trying next if any):", lastErr.message);
  }
  throw lastErr || new Error("All OpenRouter fallback models failed.");
}

// Tries each configured Gemini key in turn (only continuing past a key on a
// classified retryable/quota error — a genuine bad-request error fails fast
// rather than burning through every key for nothing), then falls back to
// OpenRouter only once every Gemini key is exhausted.
async function callModel(geminiKeys: string[], openRouterKey: string | undefined, contents: any[], systemInstruction: string): Promise<{ data: any; servedBy: string }> {
  let lastErr: Error | null = null;
  for (const key of geminiKeys) {
    try {
      const data = await callGemini(key, contents, systemInstruction);
      return { data, servedBy: "gemini" };
    } catch (err: any) {
      lastErr = err;
      if (!isRetryableModelError(err.message)) throw err;
      console.error("[assistant-chat] GEMINI_KEY_FAILED (retryable, trying next key if any):", err.message);
    }
  }
  if (openRouterKey) {
    console.error("[assistant-chat] GEMINI_ALL_KEYS_EXHAUSTED — falling back to OpenRouter:", lastErr?.message);
    try {
      const data = await callOpenRouter(openRouterKey, contents, systemInstruction);
      return { data, servedBy: "openrouter-fallback" };
    } catch (err: any) {
      console.error("[assistant-chat] OPENROUTER_FALLBACK_FAILED:", err.message);
      // Previously threw `lastErr` (the Gemini error) here, which masked a
      // real OpenRouter failure behind Gemini's — impossible to tell, from
      // what the practitioner saw, whether the fallback was ever even
      // attempted. Surface both so a real failure is diagnosable next time.
      throw new Error(`Gemini exhausted (${lastErr?.message || "unknown"}) and OpenRouter fallback also failed: ${err.message}`);
    }
  }
  throw lastErr || new Error("No model available.");
}

function monthsSince(iso: string | null | undefined) {
  if (!iso) return null;
  const then = new Date(iso);
  const now = new Date();
  return (now.getFullYear() - then.getFullYear()) * 12 + (now.getMonth() - then.getMonth());
}

// The Timetable Simulator's own availability editor (`saveClientPrefs` in
// TimetablePage.tsx) writes ONLY to `timetable_client_availability`, never
// back to `clients.availability_notes` — so availability entered directly in
// the Simulator used to be invisible here. This reads it back so either place
// teaching a client's availability reaches the other.
async function fetchTimetableAvailability(supabase: any, clientKey: string) {
  const { data } = await supabase
    .from("timetable_client_availability")
    .select("windows, note")
    .eq("client_key", clientKey)
    .maybeSingle();
  return { windows: (data?.windows || []) as any[], note: data?.note || null };
}

async function runGetClientContext(supabase: any, userId: string, clientId: string) {
  const { data: client, error: clientErr } = await supabase
    .from("clients")
    .select("id, name, email, phone, standard_rate, target_rate, rate_updated_at, journal, preferred_time, availability_notes")
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

  const timetablePrefs = await fetchTimetableAvailability(supabase, `fnh:${clientId}`);

  const standardRate = client.standard_rate ?? 0;
  const targetRate = client.target_rate ?? standardRate;

  return {
    client: {
      name: client.name, email: client.email, phone: client.phone,
      preferred_time: client.preferred_time,
      availability_notes: client.availability_notes,
      // Set directly in the Timetable Simulator's own availability editor —
      // may exist even when availability_notes (taught via chat) is empty.
      timetable_simulator_availability_note: timetablePrefs.note,
      timetable_simulator_availability_windows: timetablePrefs.windows.length ? timetablePrefs.windows : null,
    },
    rate: {
      current_rate: standardRate,
      target_ladder_rate: targetRate,
      gap_to_target: Math.max(0, targetRate - standardRate),
      months_since_rate_reviewed: monthsSince(client.rate_updated_at),
      note: targetRate > standardRate
        ? "This client is below their target/ladder rate — a rate increase conversation could be due."
        : "This client is already at (or above) their target rate.",
    },
    recent_appointments: (appointments || []).map((a: any) => ({ date: fmtMelbourne(a.date), status: a.status })),
    communication_style: profile?.style_summary || null,
    communication_channel: profile?.channel || null,
  };
}

async function runUpdateClientAvailability(supabase: any, userId: string, clientId: string | undefined, voiceStudentEmail: string | undefined, availabilityNotes: string) {
  if (!clientId && !voiceStudentEmail) return { error: "Need either client_id or voice_student_email." };

  // Kinesiology clients have a `clients` row to update directly; voice students
  // don't (they live in Notion), so their note only lives in the Simulator's
  // own availability store — still readable back via search_voice_client.
  if (clientId) {
    const { error } = await supabase
      .from("clients")
      .update({ availability_notes: availabilityNotes })
      .eq("id", clientId).eq("user_id", userId);
    if (error) return { error: "Could not save that — client not found." };
  }

  // Also feed the Timetable Simulator's structured availability store, so what's
  // taught here actually shapes its auto-drafter, not just a note only this
  // assistant reads. Same client_key convention the simulator itself uses for
  // kinesiology ("fnh:<id>"); voice uses its own "voice:<email>" key.
  const windows = parseAvailabilityText(availabilityNotes);
  const clientKey = clientId ? `fnh:${clientId}` : `voice:${voiceStudentEmail}`;
  await supabase.from("timetable_client_availability").upsert(
    { user_id: userId, client_key: clientKey, windows, note: availabilityNotes, updated_at: new Date().toISOString() },
    { onConflict: "user_id,client_key" },
  );

  return {
    status: "saved",
    note: `Availability note updated: "${availabilityNotes}"`,
    parsed_windows: windows.length ? windows : null,
    windows_note: windows.length
      ? "This was also parsed into structured availability windows for the Timetable Simulator's auto-drafter."
      : `Couldn't confidently parse specific days/times from that — the Timetable Simulator will still treat this ${clientId ? "client" : "student"} as fully open. Ask the practitioner to phrase it like 'Tuesdays after 5pm' if precision matters.`,
  };
}

async function runProposeBooking(supabase: any, userId: string, args: any) {
  // Writes into the SAME booking_proposals table the Timetable Simulator's
  // fortnight view reads (useBookingProposals hook) — a slot proposed here
  // shows up there too as pencilled-in, and vice versa, instead of the
  // assistant running its own disconnected shadow booking system. The table
  // (and useBookingProposals' confirmProposal) already distinguishes "fnh" vs
  // "voice" kind — this just needs to populate it correctly for both.
  const isVoice = !!args.voice_student_email;
  const startISO = args.start_iso;
  const endISO = new Date(new Date(startISO).getTime() + 60 * 60000).toISOString();
  const { data, error } = await supabase
    .from("booking_proposals")
    .insert({
      user_id: userId,
      kind: isVoice ? "voice" : "fnh",
      client_id: isVoice ? null : args.client_id,
      student_name: args.client_name,
      student_email: isVoice ? args.voice_student_email : null,
      event_type_id: args.event_type_id ? String(args.event_type_id) : null,
      slot_start: startISO,
      slot_end: endISO,
      status: "proposed",
      reason: args.notes || null,
    })
    .select("id")
    .single();

  const pendingBooking = {
    client_id: isVoice ? null : args.client_id,
    voice_student_email: isVoice ? args.voice_student_email : null,
    client_name: args.client_name, start_iso: startISO,
    event_type_id: args.event_type_id || null, notes: args.notes || null,
    proposal_id: error ? null : data.id,
  };
  const result = error
    ? { status: "proposed", note: "Booking proposed for human review (not yet saved to the shared timetable — it will still work, just won't show in the Timetable Simulator until confirmed)." }
    : { status: "proposed", note: "Booking proposed for human review. It has not been created yet, and now also appears pencilled-in on the Timetable Simulator." };
  return { pendingBooking, result };
}

function melbourneDayIndex(d: Date): number {
  const name = d.toLocaleDateString("en-AU", { weekday: "long", timeZone: "Australia/Melbourne" }).toLowerCase();
  return DAY_WORDS[name] ?? -1;
}
function melbourneHour(d: Date): number {
  return Number(d.toLocaleTimeString("en-AU", { hour: "numeric", hour12: false, timeZone: "Australia/Melbourne" }));
}
function melbourneHHMM(d: Date): string {
  return d.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Australia/Melbourne" });
}

// Progressively widens the search window when the requested range comes back
// empty (e.g. the calendar is fully booked for the next 2 weeks) instead of
// returning an empty result — ported from the same 14/45/90-day widening
// ClientEmailThread.tsx's "Suggest times" chips already use, so get_available_slots
// (used by both AI Chat drafts and booking flows) gets the same real, non-empty
// results the Email Thread pane does, rather than looking comparatively broken.
const WIDENING_STEPS_DAYS = [45, 90];

async function fetchCalcomSlots(calcomKey: string, start: string, endISO: string, eventTypeId: number | undefined) {
  const headers = { Authorization: `Bearer ${calcomKey}`, "cal-api-version": "2024-09-04", "Content-Type": "application/json" };
  const url = new URL("https://api.cal.com/v2/slots");
  url.searchParams.set("start", start);
  url.searchParams.set("end", endISO);
  url.searchParams.set("eventTypeId", String(eventTypeId || "4279898"));
  url.searchParams.set("timeZone", "Australia/Melbourne");

  const res = await fetch(url.toString(), { method: "GET", headers });
  const data = await res.json();
  if (!res.ok) return { error: data?.error?.message || "Cal.com slots error." };

  const raw = data?.data?.slots || data?.data || {};
  const slots: Record<string, string[]> = {};
  const flatIsos: string[] = [];
  for (const [date, entries] of Object.entries<any>(raw)) {
    const isos = (entries || []).map((e: any) => (typeof e === "string" ? e : (e?.start || e?.time))).filter(Boolean);
    slots[date] = isos.map(fmtMelbourne);
    flatIsos.push(...isos);
  }
  return { slots, flatIsos };
}

async function runGetAvailableSlots(supabase: any, supabaseUrl: string, serviceKey: string, userId: string, start: string, end: string, eventTypeId: number | undefined, clientId?: string, voiceStudentEmail?: string) {
  const CALCOM_KEY = Deno.env.get("CALCOM_API_KEY");
  if (!CALCOM_KEY) return { error: "Cal.com is not configured." };

  let widenedNote: string | null = null;
  let { slots, flatIsos, error } = await fetchCalcomSlots(CALCOM_KEY, start, end, eventTypeId);
  if (error) return { error };

  const startDate = new Date(start);
  for (const widenDays of WIDENING_STEPS_DAYS) {
    if ((flatIsos as string[]).length > 0) break;
    const widerEnd = new Date(startDate.getTime() + widenDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const wider = await fetchCalcomSlots(CALCOM_KEY, start, widerEnd, eventTypeId);
    if (!wider.error && wider.flatIsos.length > 0) {
      slots = wider.slots; flatIsos = wider.flatIsos;
      widenedNote = `The originally requested range had nothing open, so this was automatically widened to ${widenDays} days out to find real availability.`;
    }
  }

  if ((!clientId && !voiceStudentEmail) || flatIsos.length === 0) return { slots, note: widenedNote };

  // Rank candidates by this client's own known preferences instead of leaving
  // "which of these dozens of slots would they actually want" to the model's
  // own guesswork across two separate tool outputs. Kinesiology and voice pull
  // from different tables, but both reduce to the same day/bucket frequency
  // shape so the scoring below is shared regardless of which one this is.
  let windows: any[] = [];
  const dayFreq: Record<number, number> = {};
  const bucketFreq: Record<string, number> = {};

  if (clientId) {
    const [{ data: clientRow }, { data: pastAppointments }, timetablePrefs] = await Promise.all([
      supabase.from("clients").select("availability_notes").eq("id", clientId).eq("user_id", userId).maybeSingle(),
      supabase.from("appointments").select("date").eq("client_id", clientId).eq("user_id", userId).eq("status", "Completed").order("date", { ascending: false }).limit(30),
      fetchTimetableAvailability(supabase, `fnh:${clientId}`),
    ]);
    // Merge both sources — availability taught via chat (free text, parsed
    // here) and availability set directly in the Timetable Simulator (already
    // structured windows) — so a client's real availability is respected
    // regardless of which surface it was entered through.
    windows = [
      ...(clientRow?.availability_notes ? parseAvailabilityText(clientRow.availability_notes) : []),
      ...timetablePrefs.windows,
    ];
    for (const a of pastAppointments || []) {
      const d = new Date(a.date);
      const day = melbourneDayIndex(d);
      const hour = melbourneHour(d);
      const bucket = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
      if (day >= 0) dayFreq[day] = (dayFreq[day] || 0) + 1;
      bucketFreq[bucket] = (bucketFreq[bucket] || 0) + 1;
    }
  } else if (voiceStudentEmail) {
    const now = new Date();
    const [allVoiceRows, timetablePrefs] = await Promise.all([
      fetchNormalizedVoiceBookings(supabase, supabaseUrl, serviceKey, ", lesson_time"),
      fetchTimetableAvailability(supabase, `voice:${voiceStudentEmail}`),
    ]);
    windows = timetablePrefs.windows;
    const emailLower = voiceStudentEmail.toLowerCase().trim();
    const pastLessons = allVoiceRows.filter((b: any) => b.student_email === emailLower && b.status !== "cancelled").slice(0, 30);
    for (const b of pastLessons) {
      const d = new Date(b.lesson_date);
      if (isNaN(d.getTime()) || d > now) continue;
      const slot = meetingSlotFromVoiceText(b.lesson_date, b.lesson_time);
      if (!slot) continue;
      const day = DAY_ORDER.indexOf(slot.day.toLowerCase());
      if (day >= 0) dayFreq[day] = (dayFreq[day] || 0) + 1;
      if (slot.hourLabel !== "unknown") {
        const hour = Number(slot.hourLabel.split(":")[0]);
        const bucket = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
        bucketFreq[bucket] = (bucketFreq[bucket] || 0) + 1;
      }
    }
  }
  const topDayEntry = Object.entries(dayFreq).sort((a, b) => b[1] - a[1])[0];
  const topDay = topDayEntry ? Number(topDayEntry[0]) : null;
  const topBucket = Object.entries(bucketFreq).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  const inWindow = (d: Date): boolean | null => {
    if (windows.length === 0) return null;
    const day = melbourneDayIndex(d);
    const hhmm = melbourneHHMM(d);
    return windows.some((w: any) => {
      if (!w.days.includes(day)) return false;
      if (w.from && hhmm < w.from) return false;
      if (w.to && hhmm > w.to) return false;
      return true;
    });
  };

  const scored = flatIsos.map((iso) => {
    const d = new Date(iso);
    const day = melbourneDayIndex(d);
    const hour = melbourneHour(d);
    const bucket = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
    const windowMatch = inWindow(d);
    let score = 0;
    const reasons: string[] = [];
    if (windowMatch === true) { score += 10; reasons.push("matches their stated availability"); }
    if (windowMatch === false) { score -= 5; }
    if (topDay !== null && day === topDay) { score += 3; reasons.push(`usually books ${DAY_ORDER[topDay]}s`); }
    if (topBucket && bucket === topBucket) { score += 2; reasons.push(`usually books in the ${topBucket}`); }
    return { iso, d, score, reasons, windowMatch };
  });

  // An explicit "only Tuesdays after 5pm" note should exclude non-matches from
  // the shortlist entirely, not just rank them lower — but only once we've
  // confirmed at least one real slot actually satisfies it.
  const hasHardMatches = windows.length > 0 && scored.some((s) => s.windowMatch === true);
  const pool = hasHardMatches ? scored.filter((s) => s.windowMatch === true) : scored;

  const suggested = pool
    .sort((a, b) => b.score - a.score || a.d.getTime() - b.d.getTime())
    .slice(0, 5)
    .map((s) => ({
      iso: s.iso,
      label: fmtMelbourne(s.iso),
      reason: s.reasons.length ? s.reasons.join(", ") : "next available",
    }));

  return { slots, suggested, note: widenedNote };
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

// Ported from src/lib/voiceBookings.ts (kept in sync manually, same convention
// as parseAvailabilityText/computeClientLifecycleStatus above) — every
// voice_bookings query in this file should go through this instead of
// filtering `.not("student_email", "is", null)` directly. Real bug found
// live: Nicole Rotenstein (a genuinely consistent student) has 2 real PAID
// completed lessons with student_email NULL in this table (an older data
// gap) and only her 1 CANCELLED lesson has the email populated — the naive
// filter silently dropped her real history, making her look "at risk" with
// zero real sessions. This backfills a missing email from another row with
// the same student_name before grouping, so all of a student's rows merge
// into one real history regardless of which rows have the email populated.
//
// Also merges in Notion-only lessons (via the voice-lessons function) — a
// second real bug found live: Bella (3 real piano lessons) has ZERO
// voice_bookings rows at all, since her lessons were only ever logged in
// Notion, never booked through Cal.com. voice_bookings alone made her
// invisible to every tool built on this function. notion_lesson_id_1/2 on a
// voice_bookings row means that Cal.com booking already represents a Notion
// lesson — skip that Notion id so it isn't double-counted.
async function fetchNormalizedVoiceBookings(supabase: any, supabaseUrl: string, serviceKey: string, extraSelect = "") {
  const [bookingsRes, notionRes] = await Promise.all([
    supabase
      .from("voice_bookings")
      .select(`student_name, student_email, lesson_date, status, notion_lesson_id_1, notion_lesson_id_2${extraSelect}`)
      .order("lesson_date", { ascending: false }),
    fetch(`${supabaseUrl}/functions/v1/voice-lessons`, {
      method: "POST",
      headers: { Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
      body: "{}",
    }).then((r) => r.json()).catch(() => ({ lessons: [] })),
  ]);
  const rows = (bookingsRes.data || []) as any[];
  const notionLessons = ((notionRes?.lessons || []) as any[]).filter((l) => l.date);

  const nameToEmail = new Map<string, string>();
  for (const row of rows) {
    const name = (row.student_name || "").trim().toLowerCase();
    const email = (row.student_email || "").trim().toLowerCase();
    if (name && email && !nameToEmail.has(name)) nameToEmail.set(name, email);
  }
  for (const l of notionLessons) {
    const name = (l.studentName || "").trim().toLowerCase();
    const email = (l.studentEmail || "").trim().toLowerCase();
    if (name && email && !nameToEmail.has(name)) nameToEmail.set(name, email);
  }

  const normalized: any[] = [];
  for (const row of rows) {
    const name = (row.student_name || "").trim();
    const nameKey = name.toLowerCase();
    const email = (row.student_email || "").trim().toLowerCase() || nameToEmail.get(nameKey) || "";
    if (!email) continue;
    normalized.push({ ...row, student_name: name || email, student_email: email });
  }

  const linkedNotionIds = new Set<string>();
  for (const row of rows) {
    if (row.notion_lesson_id_1) linkedNotionIds.add(row.notion_lesson_id_1);
    if (row.notion_lesson_id_2) linkedNotionIds.add(row.notion_lesson_id_2);
  }
  for (const l of notionLessons) {
    if (linkedNotionIds.has(l.id)) continue;
    const name = (l.studentName || "").trim();
    const nameKey = name.toLowerCase();
    const email = (l.studentEmail || "").trim().toLowerCase() || nameToEmail.get(nameKey) || "";
    if (!email) continue;
    // Notion's Lessons DB only ever logs a lesson that actually happened —
    // there's no cancelled/scheduled state to read, so "completed" is correct.
    normalized.push({ student_name: name || email, student_email: email, lesson_date: l.date, status: "completed", lesson_time: null, cost: l.cost ?? null, discipline: l.discipline ?? null });
  }

  return normalized.sort((a, b) => new Date(b.lesson_date).getTime() - new Date(a.lesson_date).getTime());
}

async function runSearchVoiceClient(supabaseUrl: string, serviceKey: string, supabase: any, userId: string, query: string) {
  const res = await fetch(`${supabaseUrl}/functions/v1/voice-clients`, {
    method: "POST",
    headers: { Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
    body: "{}",
  });
  const data = await res.json();
  if (!res.ok || !data.success) return { error: "Could not load voice students." };

  const q = query.toLowerCase();
  const matches = (data.students || []).filter((s: any) =>
    (s.name || "").toLowerCase().includes(q) || (s.email || "").toLowerCase().includes(q),
  );
  if (matches.length === 0) return { note: `No voice student found matching "${query}".` };
  if (matches.length > 1) {
    return { multiple_matches: matches.slice(0, 8).map((s: any) => ({ name: s.name, email: s.email })), note: "Multiple students matched — ask which one, or search again with their full name or email." };
  }

  const student = matches[0];
  const studentEmail = (student.email || "").toLowerCase().trim();
  const [allVoiceRows, { data: simulatorEntry }] = await Promise.all([
    fetchNormalizedVoiceBookings(supabase, supabaseUrl, serviceKey, ", lesson_time, cost, discipline"),
    supabase.from("timetable_client_availability")
      .select("note, windows, updated_at")
      .eq("user_id", userId).eq("client_key", `voice:${studentEmail}`)
      .maybeSingle(),
  ]);
  // Matches by the normalized (backfilled) email — same fix as the anchor/
  // needs-attention aggregations above: some of a student's real lesson rows
  // can have student_email NULL in this table, which a direct .ilike() query
  // by email would silently miss entirely.
  const bookings = allVoiceRows.filter((b: any) => b.student_email === studentEmail).slice(0, 20);

  // Same day/time pattern detection used for anchors — a voice student's "usual
  // slot" shouldn't require a separate anchor-mode call to see; it's the same
  // question every time someone looks them up, kinesiology or voice alike.
  const now = new Date();
  const slotCounts = new Map<string, { count: number; day: string; hourLabel: string }>();
  let completedCount = 0;
  for (const b of bookings || []) {
    if (b.status === "cancelled") continue;
    const d = new Date(b.lesson_date);
    if (isNaN(d.getTime()) || d > now) continue;
    completedCount += 1;
    const slot = meetingSlotFromVoiceText(b.lesson_date, b.lesson_time);
    if (!slot) continue;
    const s = slotCounts.get(slot.key) || { count: 0, day: slot.day, hourLabel: slot.hourLabel };
    s.count += 1;
    slotCounts.set(slot.key, s);
  }
  let bestSlot: { count: number; day: string; hourLabel: string } | null = null;
  for (const s of slotCounts.values()) if (!bestSlot || s.count > bestSlot.count) bestSlot = s;
  const slotShare = bestSlot && completedCount > 0 ? bestSlot.count / completedCount : 0;

  return {
    student: { name: student.name, email: student.email, phone: student.phone, discipline: student.discipline, tags: student.tags, notes: student.notes, last_communication: student.lastCommunication, latest_lesson_date: student.latestDate },
    recent_lessons: (bookings || []).map((b: any) => ({ date: b.lesson_date, time: b.lesson_time, cost: b.cost, status: b.status })),
    likely_usual_slot: bestSlot && slotShare >= 0.4 && bestSlot.hourLabel !== "unknown" ? `${bestSlot.day} ${bestSlot.hourLabel}` : null,
    usual_slot_confidence: bestSlot ? `${Math.round(slotShare * 100)}% of their last ${completedCount} completed lessons` : null,
    timetable_simulator_note: simulatorEntry?.note || null,
    note: "Voice lesson pricing is a flat per-service rate (see event_pricing), not per-student — there is no individual rate ladder for voice students. likely_usual_slot is computed the same way as a kinesiology client's pattern — use get_available_slots with voice_student_email to check whether that exact slot is actually free before proposing it. timetable_simulator_note is whatever Daniele has previously told update_client_availability about this student, if anything.",
  };
}

async function computeActiveClientsWithRates(supabase: any, userId: string, months: number) {
  const now = new Date();
  const cutoff = new Date(now); cutoff.setMonth(cutoff.getMonth() - months);

  const { data: appointments, error } = await supabase
    .from("appointments")
    .select("client_id, date, status, clients(id, name, standard_rate, target_rate, rate_updated_at)")
    .eq("user_id", userId)
    .neq("status", "Cancelled")
    .order("date", { ascending: false });
  if (error || !appointments) return [];

  const now2 = now;
  type Agg = { name: string; standardRate: number; targetRate: number; rateUpdatedAt: string | null; lastDate: string; sessionsInWindow: number; hasFuture: boolean };
  const byClient = new Map<string, Agg>();

  for (const a of appointments as any[]) {
    if (!a.client_id || !a.clients) continue;
    const d = new Date(a.date);
    const existing = byClient.get(a.client_id);
    const isFuture = d > now2 && a.status === "Scheduled";
    const inWindow = d <= now2 && d >= cutoff;
    if (!existing) {
      byClient.set(a.client_id, {
        name: a.clients.name, standardRate: a.clients.standard_rate ?? 0, targetRate: a.clients.target_rate ?? a.clients.standard_rate ?? 0,
        rateUpdatedAt: a.clients.rate_updated_at, lastDate: a.date, sessionsInWindow: inWindow ? 1 : 0, hasFuture: isFuture,
      });
    } else {
      if (d > new Date(existing.lastDate)) existing.lastDate = a.date;
      if (inWindow) existing.sessionsInWindow += 1;
      if (isFuture) existing.hasFuture = true;
    }
  }

  const results = [];
  for (const [clientId, agg] of byClient.entries()) {
    const lastPast = new Date(agg.lastDate) <= now2 ? agg.lastDate : null;
    const isActive = agg.hasFuture || agg.sessionsInWindow > 0;
    if (!isActive) continue;
    results.push({
      client_id: clientId,
      name: agg.name,
      sessions_in_window: agg.sessionsInWindow,
      last_session_date: lastPast ? fmtMelbourne(lastPast) : "upcoming only",
      has_future_booking: agg.hasFuture,
      current_rate: agg.standardRate,
      target_ladder_rate: agg.targetRate,
      rate_gap: Math.max(0, agg.targetRate - agg.standardRate),
      months_since_rate_reviewed: monthsSince(agg.rateUpdatedAt),
    });
  }
  return results;
}

async function runGetActiveClients(supabase: any, userId: string, months: number) {
  const active = await computeActiveClientsWithRates(supabase, userId, months);
  return {
    window_months: months,
    active_client_count: active.length,
    clients: active.sort((a, b) => b.sessions_in_window - a.sessions_in_window).slice(0, 30),
  };
}

async function runGetRevenueOpportunities(supabase: any, userId: string, months: number) {
  const active = await computeActiveClientsWithRates(supabase, userId, months);
  const opportunities = active
    .filter((c: any) => c.rate_gap > 0)
    .map((c: any) => ({
      ...c,
      // Proxy for "immediate" impact: what they'd have earned extra on their ACTUAL
      // recent sessions if already at target rate — grounded in real recent activity,
      // not a speculative full-year projection.
      estimated_gain_over_window: c.rate_gap * Math.max(c.sessions_in_window, c.has_future_booking ? 1 : 0),
    }))
    .sort((a: any, b: any) => b.estimated_gain_over_window - a.estimated_gain_over_window);

  return {
    window_months: months,
    opportunity_count: opportunities.length,
    top_opportunities: opportunities.slice(0, 15),
    note: "Ranked by rate_gap × recent session count — active clients already below their target rate, where a rate conversation has the most immediate revenue effect.",
  };
}

async function runGetPracticeScheduleOverview(supabase: any, userId: string, weeks: number) {
  const now = new Date();
  const cutoff = new Date(now); cutoff.setDate(cutoff.getDate() - weeks * 7);
  const cutoffISO = cutoff.toISOString();

  const { data: appts } = await supabase
    .from("appointments")
    .select("date, status")
    .eq("user_id", userId)
    .neq("status", "Cancelled")
    .gte("date", cutoffISO)
    .lte("date", now.toISOString());

  const { data: lessons } = await supabase
    .from("voice_bookings")
    .select("lesson_date, lesson_time, status")
    .neq("status", "cancelled")
    .gte("lesson_date", cutoffISO.slice(0, 10))
    .lte("lesson_date", now.toISOString().slice(0, 10));

  const dayCounts: Record<string, number> = {};
  const timeCounts: Record<string, number> = {};
  const bucketOf = (hour: number) => (hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening");

  for (const a of appts || []) {
    const d = new Date(a.date);
    const day = d.toLocaleDateString("en-AU", { weekday: "long", timeZone: "Australia/Melbourne" });
    const hour = Number(d.toLocaleTimeString("en-AU", { hour: "numeric", hour12: false, timeZone: "Australia/Melbourne" }));
    dayCounts[day] = (dayCounts[day] || 0) + 1;
    timeCounts[bucketOf(hour)] = (timeCounts[bucketOf(hour)] || 0) + 1;
  }
  for (const l of lessons || []) {
    if (!l.lesson_date) continue;
    const d = new Date(`${l.lesson_date}T${(l.lesson_time || "12:00").replace(/[^\d:]/g, "") || "12:00"}:00`);
    const day = isNaN(d.getTime()) ? null : d.toLocaleDateString("en-AU", { weekday: "long", timeZone: "Australia/Melbourne" });
    if (day) dayCounts[day] = (dayCounts[day] || 0) + 1;
  }

  return {
    weeks_analysed: weeks,
    kinesiology_sessions: (appts || []).length,
    voice_lessons: (lessons || []).length,
    by_day_of_week: dayCounts,
    by_time_of_day_kinesiology: timeCounts,
    note: "Days/times with lower counts here are relatively quiet — good candidates to offer needs-attention or new clients. Voice lesson times aren't reliably bucketed by hour (source data is text), only by day.",
  };
}

// Kinesiology `appointments.date` is a real timestamptz — convert properly via
// the Melbourne timezone rather than parsing it as a bare wall-clock string.
function meetingSlotFromTimestamp(iso: string): { day: string; hourLabel: string; key: string } {
  const d = new Date(iso);
  const day = d.toLocaleDateString("en-AU", { weekday: "long", timeZone: "Australia/Melbourne" });
  const hour = Number(d.toLocaleTimeString("en-AU", { hour: "numeric", hour12: false, timeZone: "Australia/Melbourne" }));
  const minute = Number(d.toLocaleTimeString("en-AU", { minute: "numeric", timeZone: "Australia/Melbourne" }));
  const bucketMinute = minute >= 15 && minute < 45 ? 30 : 0;
  const bucketHour = minute >= 45 ? (hour + 1) % 24 : hour;
  const hourLabel = `${String(bucketHour).padStart(2, "0")}:${String(bucketMinute).padStart(2, "0")}`;
  return { day, hourLabel, key: `${day}-${hourLabel}` };
}

// Same morning/afternoon/evening convention already used by get_available_slots'
// ranking logic — kept consistent so "usual pattern" means the same thing
// everywhere in this file.
function dayTimeBucketFromTimestamp(iso: string): { day: string; bucket: string; key: string } {
  const d = new Date(iso);
  const day = d.toLocaleDateString("en-AU", { weekday: "long", timeZone: "Australia/Melbourne" });
  const hour = Number(d.toLocaleTimeString("en-AU", { hour: "numeric", hour12: false, timeZone: "Australia/Melbourne" }));
  const bucket = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  return { day, bucket, key: `${day}-${bucket}` };
}

// Voice `lesson_date`/`lesson_time` are unstructured text, not a real timestamp
// (see CLAUDE.md's Voice Calendar Fallback note) — day-of-week from the date
// part alone is timezone-safe; the time is a best-effort regex, not exact.
function meetingSlotFromVoiceText(dateOnly: string, timeText: string | null): { day: string; hourLabel: string; key: string } | null {
  const d = new Date(`${dateOnly}T00:00:00Z`);
  if (isNaN(d.getTime())) return null;
  const day = d.toLocaleDateString("en-AU", { weekday: "long", timeZone: "UTC" });
  const match = (timeText || "").match(/(\d{1,2}):(\d{2})/);
  if (!match) return { day, hourLabel: "unknown", key: `${day}-unknown` };
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  if (/pm/i.test(timeText || "") && hour < 12) hour += 12;
  if (/am/i.test(timeText || "") && hour === 12) hour = 0;
  const bucketMinute = minute >= 15 && minute < 45 ? 30 : 0;
  const bucketHour = minute >= 45 ? (hour + 1) % 24 : hour;
  const hourLabel = `${String(bucketHour).padStart(2, "0")}:${String(bucketMinute).padStart(2, "0")}`;
  return { day, hourLabel, key: `${day}-${hourLabel}` };
}

interface AnchorAgg {
  kind: "kinesiology" | "voice";
  id: string; // client_id, or a "voice:<email>" pseudo-id
  name: string;
  email: string | null;
  availabilityNotes: string | null;
  completed: number;
  cancelled: number;
  hasFuture: boolean;
  lastDate: string;
  firstDate: string;
  slotCounts: Map<string, { count: number; day: string; hourLabel: string }>;
  // Coarser day + morning/afternoon/evening bucket, tracked alongside the exact
  // half-hour slot — a client who consistently books "Wednesday afternoon" at
  // varying exact times would otherwise get misreported by whichever single
  // exact time happened to repeat most (even a rare one-off), since splitting
  // their real pattern across several different exact buckets dilutes each
  // one's count individually. See finalizeAnchor for how these are compared.
  bucketCounts: Map<string, { count: number; day: string; bucket: string }>;
}

// A strong day/time pattern from months ago doesn't mean the client is still
// engaged — someone last seen 4 months ago shouldn't outrank someone seen last
// week just because their old pattern was slightly more consistent. Anything
// seen within this window counts as "still warm" for anchor purposes.
const ANCHOR_RECENCY_WINDOW_DAYS = 60;

function finalizeAnchor(a: AnchorAgg) {
  const total = a.completed + a.cancelled;
  const cancellationRate = total > 0 ? a.cancelled / total : 0;
  let bestSlot: { count: number; day: string; hourLabel: string } | null = null;
  for (const s of a.slotCounts.values()) if (!bestSlot || s.count > bestSlot.count) bestSlot = s;
  const slotShare = bestSlot && a.completed > 0 ? bestSlot.count / a.completed : 0;

  let bestBucket: { count: number; day: string; bucket: string } | null = null;
  for (const b of a.bucketCounts.values()) if (!bestBucket || b.count > bestBucket.count) bestBucket = b;
  const bucketShare = bestBucket && a.completed > 0 ? bestBucket.count / a.completed : 0;

  // Real bug found live: a client who consistently books "Wednesday afternoon"
  // at varying exact times was reported as "Wednesday 10:00am" because a single
  // rare exact-time booking happened to repeat more than any other single exact
  // time, even though it represented a small minority of their real sessions.
  // Prefer the coarser day+time-of-day description whenever it's meaningfully
  // more representative of their actual pattern than the single best exact slot.
  const useBucket = bestBucket && bucketShare >= slotShare + 0.15;
  const bestConsistency = useBucket ? bucketShare : slotShare;

  const tenureDays = Math.round((new Date(a.lastDate).getTime() - new Date(a.firstDate).getTime()) / (1000 * 60 * 60 * 24));
  const daysSinceLast = Math.round((Date.now() - new Date(a.lastDate).getTime()) / (1000 * 60 * 60 * 24));
  const isAnchorPattern = a.completed >= 4 && cancellationRate <= 0.25 && bestConsistency >= 0.5 && (!!bestSlot || !!bestBucket);
  return {
    id: a.id,
    kind: a.kind,
    client_id: a.kind === "kinesiology" ? a.id : null,
    voice_student_email: a.kind === "voice" ? a.email : null,
    name: a.name,
    email: a.email,
    sessions_completed: a.completed,
    cancellation_rate: `${Math.round(cancellationRate * 100)}%`,
    tenure_days: tenureDays,
    days_since_last_session: daysSinceLast,
    usual_slot: useBucket
      ? `${bestBucket!.day} ${bestBucket!.bucket}`
      : bestSlot && bestSlot.hourLabel !== "unknown" ? `${bestSlot.day} ${bestSlot.hourLabel}` : bestSlot ? bestSlot.day : null,
    slot_consistency: (bestSlot || bestBucket) ? `${Math.round(bestConsistency * 100)}%` : null,
    is_anchor_pattern: isAnchorPattern,
    is_recent: daysSinceLast <= ANCHOR_RECENCY_WINDOW_DAYS,
    has_future_booking: a.hasFuture,
    last_session_date: fmtMelbourne(a.lastDate),
    availability_notes: a.availabilityNotes,
  };
}

// Both real outbound-email paths (send-assistant-email for AI-drafted sends,
// gmail-send-threaded-reply for the Email Thread pane) write to email_log, so
// this is a genuine "did I already reach out" signal, not a guess — fixes the
// "forgot I already messaged Reuben" bug where nothing ever read this back.
const RECENTLY_CONTACTED_WINDOW_DAYS = 14;

async function fetchRecentlyContactedMap(supabase: any, emails: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const clean = [...new Set(emails.filter(Boolean).map((e) => e.toLowerCase()))];
  if (clean.length === 0) return map;
  const since = new Date(Date.now() - RECENTLY_CONTACTED_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("email_log")
    .select("recipient, created_at")
    .eq("status", "sent")
    .gte("created_at", since)
    .in("recipient", clean);
  for (const row of (data || []) as { recipient: string; created_at: string }[]) {
    const key = (row.recipient || "").toLowerCase();
    const existing = map.get(key);
    if (!existing || new Date(row.created_at) > new Date(existing)) map.set(key, row.created_at);
  }
  return map;
}

async function runGetClientsNeedingAttention(supabase: any, supabaseUrl: string, serviceKey: string, userId: string) {
  const now = new Date();

  const [{ data: appts }, voiceRows] = await Promise.all([
    supabase.from("appointments")
      .select("client_id, date, status, clients(id, name, email)")
      .eq("user_id", userId)
      .order("date", { ascending: false }),
    fetchNormalizedVoiceBookings(supabase, supabaseUrl, serviceKey),
  ]);

  const hasFuture = new Set<string>();
  const agg = new Map<string, { kind: string; name: string; email: string | null; appointments: { date: string; status: string }[] }>();

  for (const a of (appts || []) as any[]) {
    if (!a.client_id || !a.clients) continue;
    const d = new Date(a.date);
    if (a.status === "Scheduled" && d > now) { hasFuture.add(a.client_id); continue; }
    if (d > now) continue;
    const existing = agg.get(a.client_id) || { kind: "kinesiology", name: a.clients.name || "Unknown", email: a.clients.email || null, appointments: [] };
    existing.appointments.push({ date: a.date, status: a.status });
    agg.set(a.client_id, existing);
  }

  for (const b of voiceRows) {
    const email = b.student_email;
    const id = `voice:${email}`;
    const d = new Date(b.lesson_date);
    if (isNaN(d.getTime())) continue;
    const isCancelled = b.status === "cancelled";
    if (!isCancelled && d > now) { hasFuture.add(id); continue; }
    if (d > now) continue;
    const existing = agg.get(id) || { kind: "voice", name: b.student_name, email, appointments: [] };
    existing.appointments.push({ date: b.lesson_date, status: isCancelled ? "Cancelled" : "Completed" });
    agg.set(id, existing);
  }

  const rows: any[] = [];
  for (const [id, { kind, name, email, appointments }] of agg.entries()) {
    if (hasFuture.has(id)) continue;
    const { status, reason, daysSinceLast, isQuickWin } = computeClientLifecycleStatus(appointments, false);
    if (status === "lead" || status === "active") continue; // only genuinely at-risk/lapsed here
    rows.push({
      kind, name, email,
      client_id: kind === "kinesiology" ? id : null,
      voice_student_email: kind === "voice" ? email : null,
      status, reason, days_since_last: daysSinceLast, is_quick_win: isQuickWin,
    });
  }

  const contactedMap = await fetchRecentlyContactedMap(supabase, rows.map((r) => r.email));
  for (const r of rows) {
    const lastContacted = r.email ? contactedMap.get(r.email.toLowerCase()) : null;
    r.recently_contacted = !!lastContacted;
    r.last_contacted_at = lastContacted ? fmtMelbourne(lastContacted) : null;
  }

  // Quick wins first (a recent cancellation from an otherwise-real client —
  // secure these before spreading effort thin on harder re-engagements),
  // then the existing at_risk-before-lapsed, most-recent-first ordering.
  rows.sort((a, b) => {
    if (a.is_quick_win !== b.is_quick_win) return a.is_quick_win ? -1 : 1;
    return a.status === b.status ? (a.days_since_last ?? 0) - (b.days_since_last ?? 0) : a.status === "at_risk" ? -1 : 1;
  });
  return { clients_needing_attention: rows };
}

async function runGetAnchorCandidates(supabase: any, supabaseUrl: string, serviceKey: string, userId: string) {
  const now = new Date();

  const [{ data: appts }, voiceRows] = await Promise.all([
    supabase.from("appointments")
      .select("client_id, date, status, clients(id, name, email, availability_notes)")
      .eq("user_id", userId)
      .order("date", { ascending: true }),
    fetchNormalizedVoiceBookings(supabase, supabaseUrl, serviceKey, ", lesson_time"),
  ]);

  const byId = new Map<string, AnchorAgg>();

  for (const a of (appts || []) as any[]) {
    if (!a.client_id || !a.clients) continue;
    const d = new Date(a.date);
    const isCancelled = a.status === "Cancelled";
    const isFuture = d > now && a.status === "Scheduled";
    const existing = byId.get(a.client_id) || {
      kind: "kinesiology" as const, id: a.client_id, name: a.clients.name || "Unknown", email: a.clients.email || null,
      availabilityNotes: a.clients.availability_notes || null, completed: 0, cancelled: 0, hasFuture: false,
      lastDate: a.date, firstDate: a.date, slotCounts: new Map(), bucketCounts: new Map(),
    };
    if (isFuture) existing.hasFuture = true;
    else if (d <= now) {
      if (isCancelled) existing.cancelled += 1;
      else {
        existing.completed += 1;
        const slot = meetingSlotFromTimestamp(a.date);
        const s = existing.slotCounts.get(slot.key) || { count: 0, day: slot.day, hourLabel: slot.hourLabel };
        s.count += 1;
        existing.slotCounts.set(slot.key, s);
        const bkt = dayTimeBucketFromTimestamp(a.date);
        const bc = existing.bucketCounts.get(bkt.key) || { count: 0, day: bkt.day, bucket: bkt.bucket };
        bc.count += 1;
        existing.bucketCounts.set(bkt.key, bc);
      }
      if (new Date(a.date) < new Date(existing.firstDate)) existing.firstDate = a.date;
      if (new Date(a.date) > new Date(existing.lastDate)) existing.lastDate = a.date;
    }
    byId.set(a.client_id, existing);
  }

  for (const b of (voiceRows || []) as any[]) {
    const email = String(b.student_email || "").toLowerCase().trim();
    if (!email) continue;
    const id = `voice:${email}`;
    const d = new Date(b.lesson_date);
    if (isNaN(d.getTime())) continue;
    const isCancelled = b.status === "cancelled";
    const isFuture = !isCancelled && d > now;
    const existing = byId.get(id) || {
      kind: "voice" as const, id, name: b.student_name || "Unknown", email,
      availabilityNotes: null, completed: 0, cancelled: 0, hasFuture: false,
      lastDate: b.lesson_date, firstDate: b.lesson_date, slotCounts: new Map(), bucketCounts: new Map(),
    };
    if (isFuture) existing.hasFuture = true;
    else if (d <= now) {
      if (isCancelled) existing.cancelled += 1;
      else {
        existing.completed += 1;
        const slot = meetingSlotFromVoiceText(b.lesson_date, b.lesson_time);
        if (slot) {
          const s = existing.slotCounts.get(slot.key) || { count: 0, day: slot.day, hourLabel: slot.hourLabel };
          s.count += 1;
          existing.slotCounts.set(slot.key, s);
          if (slot.hourLabel !== "unknown") {
            const hour = Number(slot.hourLabel.split(":")[0]);
            const bucket = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
            const bktKey = `${slot.day}-${bucket}`;
            const bc = existing.bucketCounts.get(bktKey) || { count: 0, day: slot.day, bucket };
            bc.count += 1;
            existing.bucketCounts.set(bktKey, bc);
          }
        }
      }
      if (new Date(b.lesson_date) < new Date(existing.firstDate)) existing.firstDate = b.lesson_date;
      if (new Date(b.lesson_date) > new Date(existing.lastDate)) existing.lastDate = b.lesson_date;
    }
    byId.set(id, existing);
  }

  const finalized = Array.from(byId.values()).filter((a) => a.completed > 0).map(finalizeAnchor);

  // Annotate with "did I already email this person recently" so the model
  // doesn't keep re-suggesting fresh outreach to someone already contacted
  // (real bug: it kept re-suggesting Reuben right after he'd been emailed).
  const contactedMap = await fetchRecentlyContactedMap(supabase, finalized.map((a) => a.email).filter(Boolean));
  for (const a of finalized) {
    const lastContacted = a.email ? contactedMap.get(a.email.toLowerCase()) : null;
    (a as any).recently_contacted = !!lastContacted;
    (a as any).last_contacted_at = lastContacted ? fmtMelbourne(lastContacted) : null;
  }

  // A consistent pattern AND still-recent beats a consistent pattern that's gone
  // quiet — recency is the tiebreaker, not just session count.
  const openAnchors = finalized.filter((a) => a.is_anchor_pattern && !a.has_future_booking && a.is_recent)
    .sort((a, b) => a.days_since_last_session - b.days_since_last_session || b.sessions_completed - a.sessions_completed);
  const lapsedAnchors = finalized.filter((a) => a.is_anchor_pattern && !a.has_future_booking && !a.is_recent)
    .sort((a, b) => a.days_since_last_session - b.days_since_last_session);
  const securedAnchors = finalized.filter((a) => a.is_anchor_pattern && a.has_future_booking);
  const needsConversion = finalized.filter((a) => !a.is_anchor_pattern && !a.has_future_booking)
    .sort((a, b) => new Date(b.last_session_date).getTime() - new Date(a.last_session_date).getTime());

  return {
    open_anchors: openAnchors,
    lapsed_anchors: lapsedAnchors,
    already_secured_anchors: securedAnchors,
    needs_conversion_support: needsConversion.slice(0, 20),
    note: `open_anchors = long, consistent track record (4+ sessions, ≤25% cancellation rate, same day/time ≥50% of the time) AND seen within the last ${ANCHOR_RECENCY_WINDOW_DAYS} days — secure these first, same slot, no need to re-check interest. lapsed_anchors have the exact same strong pattern but haven't been seen in over ${ANCHOR_RECENCY_WINDOW_DAYS} days — real anchors, but gone quiet, so treat as a warm re-engagement check-in ("would you be interested in resuming?"), never as a same-slot assumption. already_secured_anchors already have a future booking, no action needed. needs_conversion_support is everyone else without a future booking — lower session count, less consistent, or more cancellations — real but lower priority than either anchor bucket. Every entry has recently_contacted (and last_contacted_at) — if true, a real email already went out to them in the last ${RECENTLY_CONTACTED_WINDOW_DAYS} days, so do NOT suggest a fresh outreach as if nothing's been said yet; acknowledge it was already sent and ask if Daniele wants to follow up differently or wait.`,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authErr = await requirePractitioner(req, corsHeaders);
  if (authErr) return authErr;

  try {
    const { conversation_id, client_id, voice_student_email, voice_student_name, message } = await req.json();
    if (!message) throw new Error("Missing message.");

    // Multiple Gemini keys give real redundancy against one key's quota running
    // out (a genuine daily-use risk, not just a testing artifact — see prior
    // quota-exhaustion incidents), tried in order before ever reaching the
    // cross-provider OpenRouter fallback.
    const geminiKeys = [
      Deno.env.get("GEMINI_API_KEY"),
      Deno.env.get("GEMINI_API_KEY_2"),
      Deno.env.get("GEMINI_API_KEY_3"),
      Deno.env.get("GEMINI_API_KEY_4"),
    ].filter((k): k is string => !!k);
    if (geminiKeys.length === 0) throw new Error("GEMINI_API_KEY is missing.");
    const openRouterKey = Deno.env.get("OPENROUTER_API_KEY");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    // Identify the calling user from their own JWT (requirePractitioner only tells us they're
    // allowed through, not who they are).
    const authHeader = req.headers.get("Authorization") || "";
    const authedClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await authedClient.auth.getUser();
    if (!user) throw new Error("Could not identify the calling user.");
    const userId = user.id;

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Load or create the conversation. client_id and voice_student_email are
    // mutually exclusive foci — setting one clears the other.
    let conversationId = conversation_id;
    if (conversationId) {
      await supabase.from("assistant_conversations")
        .update({
          updated_at: new Date().toISOString(),
          ...(client_id !== undefined ? { client_id: client_id || null } : {}),
          ...(voice_student_email !== undefined ? { voice_student_email: voice_student_email || null, voice_student_name: voice_student_email ? voice_student_name || null : null } : {}),
        })
        .eq("id", conversationId).eq("user_id", userId);
    } else {
      const { data: convo, error: convoErr } = await supabase
        .from("assistant_conversations")
        .insert({
          user_id: userId,
          client_id: client_id || null,
          voice_student_email: voice_student_email || null,
          voice_student_name: voice_student_email ? voice_student_name || null : null,
          title: message.slice(0, 60),
        })
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

    // Defensive: Gemini requires strict user/model alternation starting with
    // "user". Repair any conversation whose stored rows don't already satisfy
    // that (e.g. an older row-ordering bug) by merging consecutive same-role
    // rows instead of dropping them, and skipping a leading "model" row.
    const sanitized: { role: string; content: string }[] = [];
    for (const r of (priorRows || []) as any[]) {
      const last = sanitized[sanitized.length - 1];
      if (!last) {
        if (r.role !== "user") continue;
        sanitized.push({ role: r.role, content: r.content || "" });
      } else if (last.role === r.role) {
        last.content = `${last.content}\n${r.content || ""}`.trim();
      } else {
        sanitized.push({ role: r.role, content: r.content || "" });
      }
    }

    const contents = sanitized.map((r) => ({ role: r.role, parts: [{ text: r.content }] }));
    contents.push({ role: "user", parts: [{ text: message }] });

    const systemInstruction = `You are the scheduling assistant inside Daniele's practice CRM, which runs TWO arms he treats as equally important: kinesiology/FNH clinical clients (in the clients table, use get_client_context / get_active_clients / get_revenue_opportunities) and Voice Studio piano/singing lesson students (Notion-backed + voice_bookings, use search_voice_client — they are NOT in the clients table and have no individual rate, only flat per-service pricing). get_anchor_candidates and get_available_slots both work identically across both arms already — a voice student is never a second-class case you should give up on or treat as less capable than a kinesiology client. If a tool call for a specific person fails, that means try the OTHER identifier (client_id vs voice_student_email) you may have gotten wrong, or say the lookup failed plainly — never conclude "the system doesn't support voice students" as an excuse, since for context/history/slots it does. Current time: ${melbourneNow()} (Australia/Melbourne).
Clients communicate messily — vague times ("until 2pm", "health permitting"), same-day cancellations, and ambiguous confirmations ("that's perfect" meaning "yes to the last time you proposed"). Interpret them charitably but flag genuine ambiguity rather than guessing.
Use the available tools to ground your answers in real data — never invent appointment times, client details, rates, or slot availability.
${client_id
  ? `This conversation is focused on one specific kinesiology client (client_id: ${client_id}). Call get_client_context first to load their history, current rate vs target rate, and communication style, and match their tone when drafting anything. If Daniele mentions he just changed or increased their rate, draft a warm email via draft_email_reply that references the specific old and new numbers already visible from get_client_context — and never claim it's been sent, only that it's ready for review.`
  : voice_student_email
  ? `This conversation is focused on one specific voice student (email: ${voice_student_email}${voice_student_name ? `, name: ${voice_student_name}` : ""}). Call search_voice_client with their email first to load their lesson history, notes, and likely_usual_slot before answering or drafting anything — they are NOT in the clients table, so get_client_context (kinesiology-only) doesn't apply, but get_available_slots and propose_booking BOTH work for them: pass voice_student_email instead of client_id and they behave exactly like they do for a kinesiology client, including creating a real Cal.com booking once the practitioner clicks Confirm.`
  : `This is a general conversation, not focused on one client. Default to an anchor mindset — this is how EVERY general conversation should run, not an opt-in mode: prioritise securing and deepening relationships with clients who are close to converting or renewing over chasing volume for its own sake. Don't get distracted trying to bring in everyone at once — securing one real relationship beats a scattershot list. When scheduling, prioritisation, or "who should I focus on" comes up, call get_anchor_candidates ONCE (it reflects the full current picture — don't re-call it on later turns unless something genuinely changed, like a booking confirmed or a cancellation mentioned) and work through it in this order: (1) open_anchors first — long, consistent track record, seen recently, nothing booked yet. Check get_available_slots around their usual_slot and offer to draft outreach proposing exactly that slot — don't make them re-decide a day/time they've already established. Present 2-3 at a time, not the whole list. (2) lapsed_anchors next — same strong pattern, gone quiet. Do NOT assume their old slot still holds; frame it as a warm, no-pressure re-engagement check-in and only get into scheduling specifics once they've responded with interest. (3) needs_conversion_support only once both anchor buckets are addressed — mention these ARE lower priority. (4) already_secured_anchors need no action. Keep momentum: after handling one, proactively suggest the next rather than waiting to be asked "who's next". Also check get_clients_needing_attention for anyone genuinely at risk of falling through the cracks (a cancelled-and-gone-quiet client, for example) — mention them even if the conversation didn't ask about follow-up specifically. Daniele finds scheduling decisions genuinely effortful (this tool exists specifically to lower that friction), so ALWAYS lead with any is_quick_win entries from get_clients_needing_attention before anything else — a recent cancellation from an otherwise-consistent client is the single easiest thing to resolve (check get_available_slots around their usual pattern and offer one concrete slot to propose), and surfacing it first means he secures a real win in one click instead of sifting through a long list to find it himself.`}
You can draft an email for review via draft_email_reply, but you can never send one yourself — always say the draft is ready for review, never that it has been sent. Never invent a recipient address (no "@example.com" placeholders) — always pull the real email from get_client_context, get_anchor_candidates, or search_voice_client first. Every drafted email body must read like Daniele personally typed it: first person singular ("I", never "we" or "our team" — he's one practitioner, not a business writing to a customer), plain conversational language, and absolutely no markdown syntax (no **bold**, no asterisk bullets, no # headings) — Gmail renders the literal asterisks, so markdown emphasis shows up as ugly stray characters in a real inbox. If something needs emphasis, just say it plainly instead. Avoid anything that reads like marketing copy (no "exciting news!", exclamation-heavy hooks, or salesy framing) — these are warm, low-key messages to people he already knows. Critical: after calling draft_email_reply, do NOT repeat the drafted subject/body in your text reply — it already renders as its own editable card with a Send button right above your message, and re-typing the same content is confusing (the practitioner can't tell if your text version or the card is "the real one," and on a small screen the card can get lost under a wall of repeated text). Just briefly confirm it's ready, e.g. "Draft's ready above — edit anything you like, then hit Send when you're happy with it."
Whenever draft_email_reply is used for anything scheduling-flavoured ("let's find a time", proposing a session, re-engagement outreach that might lead to booking), call get_available_slots FIRST and embed 2-3 concrete suggested times with a one-line reason each in the draft body — never draft a vague "let me know what works for you" when real availability is one tool call away. get_available_slots also auto-widens its search window itself if the immediate range is fully booked, so it will still return real options even when the calendar looks packed short-term.
Clients also have a self-serve portal at /portal/login (email OTP, no password) where they can view their own upcoming/past sessions, cancel a booking, book a new one, and message Daniele directly. If a client seems unaware of it, or asks how to manage/cancel their own booking, or Daniele wants to point someone there, feel free to mention it and include the link in a drafted email.
You can propose an actual booking via propose_booking (kinesiology or voice — same tool, pass client_id or voice_student_email), but you can never create one yourself — it only becomes real when the practitioner clicks Confirm on the proposal card, which creates a real Cal.com booking either way. Always call get_available_slots first and propose a real slot from that result, never a guessed time. When finding a slot for a specific person, always pass client_id (kinesiology) or voice_student_email (voice) to get_available_slots — it returns a ranked "suggested" shortlist (weighted by their availability_notes/booking history, not just chronological order), each with a "reason". Lead with the top suggested slot and its reason ("Tuesday 4pm usually works well for her, and it fits the note about after-work sessions") rather than defaulting to whichever slot happens to be soonest — the earliest slot is very often NOT the one they actually want.
Whenever the practitioner tells you something new about a client's OR voice student's availability (a day/time that works or doesn't), call update_client_availability right away to remember it for next time (client_id for kinesiology, voice_student_email for voice) — don't just acknowledge it in the chat and let it evaporate.
You can search the inbox read-only via search_inbox (Gmail search syntax) to check for replies or past correspondence — you cannot send, modify, or delete anything through it.
For business questions ("who's active", "who should I raise rates for", "what times are free"), use get_active_clients, get_revenue_opportunities, and get_practice_schedule_overview rather than guessing — they compute real numbers from appointment history.
Be proactive, not just reactive: if the conversation naturally touches on scheduling and get_active_clients shows active clients with no future booking, mention them and offer to help book their next session, rather than waiting to be asked. When a client's next-session cadence is clear from get_past_booking_patterns, feel free to suggest it ("she's usually every 2 weeks, so [date] would fit her pattern").
CRITICAL — never re-suggest contacting someone who was already just contacted: get_anchor_candidates and get_clients_needing_attention both return recently_contacted (and last_contacted_at) per person, computed from real sent-email logs. If recently_contacted is true, do NOT propose a fresh outreach as if nothing's been said yet — acknowledge a message already went out (and when) and ask whether Daniele wants to follow up differently or just wait for a reply. This is a real, previously-reported failure (re-suggesting an email to someone already emailed) — treat it as a hard rule, not a nice-to-have.
When Daniele opens with something open-ended and undirected — "what should I work on today", "where do I start", "help me plan my day/week", or similar, with no specific client or question in mind — treat it as a request for a genuine daily briefing, not an invitation to list your own capabilities. Call get_anchor_candidates and get_active_clients (skip get_revenue_opportunities unless the other two come back thin) and synthesize a short, concrete action list from what's actually there: lead with any open_anchors worth securing right now (their usual slot, ready to check availability), then anyone worth a quick outreach (lapsed anchors, or active clients with nothing booked ahead), and only mention a revenue opportunity if one is genuinely clear-cut. Two or three concrete next actions beats an exhaustive dump — end by asking which one to start with.
If Daniele says to skip, move on, or otherwise declines the client currently being discussed — in ANY conversation — drop that client immediately and go to the next relevant candidate (or ask what he'd like to do instead). Never re-explain who they are, re-verify their details, or bring them back up again later in the same conversation unless Daniele himself reintroduces them. Repeating a client he's already asked you to move past is a hard failure, not a minor annoyance.`;

    const toolTrace: any[] = [];
    let pendingDraft = null;
    let pendingBooking = null;
    let finalText = "";

    for (let i = 0; i < MAX_TOOL_ROUNDS; i++) {
      const { data: resp, servedBy } = await callModel(geminiKeys, openRouterKey, contents, systemInstruction);
      if (servedBy !== "gemini") console.log(`[assistant-chat] served_by: ${servedBy}`);
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
          pendingDraft = { to: args.to, subject: stripMarkdown(args.subject), body: stripMarkdown(args.body), client_id: args.client_id || client_id || null, appointment_id: args.appointment_id || null };
          result = { status: "drafted", note: "Draft created for human review. It has not been sent." };
        } else if (name === "propose_booking") {
          const proposed = await runProposeBooking(supabase, userId, args);
          pendingBooking = proposed.pendingBooking;
          result = proposed.result;
        } else if (name === "update_client_availability") {
          result = await runUpdateClientAvailability(supabase, userId, args.client_id, args.voice_student_email, args.availability_notes);
        } else if (name === "search_inbox") {
          result = await runSearchInbox(SUPABASE_URL, SERVICE_KEY, args.query);
        } else if (name === "get_client_context") {
          result = await runGetClientContext(supabase, userId, args.client_id);
        } else if (name === "get_available_slots") {
          result = await runGetAvailableSlots(supabase, SUPABASE_URL, SERVICE_KEY, userId, args.start, args.end, args.event_type_id, args.client_id, args.voice_student_email);
        } else if (name === "get_past_booking_patterns") {
          result = await runGetPastBookingPatterns(supabase, userId, args.client_id);
        } else if (name === "search_voice_client") {
          result = await runSearchVoiceClient(SUPABASE_URL, SERVICE_KEY, supabase, userId, args.query);
        } else if (name === "get_active_clients") {
          result = await runGetActiveClients(supabase, userId, args.months || 3);
        } else if (name === "get_revenue_opportunities") {
          result = await runGetRevenueOpportunities(supabase, userId, args.months || 3);
        } else if (name === "get_practice_schedule_overview") {
          result = await runGetPracticeScheduleOverview(supabase, userId, args.weeks || 8);
        } else if (name === "get_anchor_candidates") {
          result = await runGetAnchorCandidates(supabase, SUPABASE_URL, SERVICE_KEY, userId);
        } else if (name === "get_clients_needing_attention") {
          result = await runGetClientsNeedingAttention(supabase, SUPABASE_URL, SERVICE_KEY, userId);
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

    // Explicit, strictly-increasing timestamps — a batched insert can otherwise
    // give both rows the same created_at, and ORDER BY created_at doesn't then
    // guarantee user-before-model. Gemini requires strict user/model alternation
    // in `contents`, so a flipped pair permanently breaks every future turn in
    // this conversation (two consecutive "model" entries get rejected as a 400).
    const userAt = new Date();
    const modelAt = new Date(userAt.getTime() + 1);
    await supabase.from("assistant_messages").insert([
      { conversation_id: conversationId, role: "user", content: message, created_at: userAt.toISOString() },
      { conversation_id: conversationId, role: "model", content: finalText, tool_calls: toolTrace.length ? toolTrace : null, draft_email: pendingDraft, pending_booking: pendingBooking, created_at: modelAt.toISOString() },
    ]);

    return new Response(JSON.stringify({ conversation_id: conversationId, reply: finalText, draft_email: pendingDraft, pending_booking: pendingBooking }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error.message || "Unknown error";
    const isQuota = isRetryableModelError(msg);
    // Distinct, greppable log line for quota exhaustion (all keys + OpenRouter
    // fallback exhausted) vs any other failure — previously a single flat
    // console.error made it impossible to tell "Gemini is out of capacity"
    // from an unrelated bug in Supabase function logs.
    if (isQuota) console.error("[assistant-chat] GEMINI_QUOTA_EXCEEDED (all keys + fallback exhausted):", msg);
    else console.error("[assistant-chat] Error:", msg);
    return new Response(JSON.stringify({ error: msg, quota_exceeded: isQuota }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
