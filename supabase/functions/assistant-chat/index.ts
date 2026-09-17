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
    name: "get_available_slots",
    description: "Get open Cal.com booking slots in a date range for the practitioner's event type. Pass client_id whenever you're finding a slot FOR a specific client (not just checking general availability) — the result then ranks/annotates a `suggested` shortlist by that client's own known availability notes and historical day/time pattern, so you're not guessing which of the (often dozens of) open slots they'd actually want.",
    parameters: {
      type: "OBJECT",
      properties: {
        start: { type: "STRING", description: "ISO date, e.g. 2026-09-15" },
        end: { type: "STRING", description: "ISO date, e.g. 2026-09-22" },
        event_type_id: { type: "NUMBER", description: "Cal.com event type id. Omit to use the default." },
        client_id: { type: "STRING", description: "Kinesiology client id — when provided, ranks slots by this client's availability_notes + booking history instead of returning an unranked list." },
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
    description: "Propose booking a specific real, available slot (from get_available_slots) for a client. This does NOT create the booking — it only returns a proposal for human review and confirmation. Always call get_available_slots first to confirm the exact time is genuinely free before proposing it; never invent a time.",
    parameters: {
      type: "OBJECT",
      properties: {
        client_id: { type: "STRING" },
        client_name: { type: "STRING" },
        start_iso: { type: "STRING", description: "Exact ISO datetime of the slot, taken verbatim from a prior get_available_slots result." },
        event_type_id: { type: "NUMBER", description: "Cal.com event type id. Omit to use the default kinesiology session type." },
        notes: { type: "STRING", description: "Optional short note about why this slot / session." },
      },
      required: ["client_id", "client_name", "start_iso"],
    },
  },
  {
    name: "update_client_availability",
    description: "Save or update what you've learned about a kinesiology client's availability (e.g. \"only Tuesday evenings now\", \"not Wednesdays\") so future scheduling remembers it. Use this whenever the practitioner tells you something new about when a client can/can't do sessions — this is a low-stakes internal note, not client-facing, so save it directly rather than asking permission first.",
    parameters: {
      type: "OBJECT",
      properties: {
        client_id: { type: "STRING" },
        availability_notes: { type: "STRING", description: "The full, updated availability note — replace the old note with the complete new text, don't just append a fragment." },
      },
      required: ["client_id", "availability_notes"],
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

function monthsSince(iso: string | null | undefined) {
  if (!iso) return null;
  const then = new Date(iso);
  const now = new Date();
  return (now.getFullYear() - then.getFullYear()) * 12 + (now.getMonth() - then.getMonth());
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

  const standardRate = client.standard_rate ?? 0;
  const targetRate = client.target_rate ?? standardRate;

  return {
    client: {
      name: client.name, email: client.email, phone: client.phone,
      preferred_time: client.preferred_time, availability_notes: client.availability_notes,
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

async function runUpdateClientAvailability(supabase: any, userId: string, clientId: string, availabilityNotes: string) {
  const { error } = await supabase
    .from("clients")
    .update({ availability_notes: availabilityNotes })
    .eq("id", clientId).eq("user_id", userId);
  if (error) return { error: "Could not save that — client not found." };

  // Also feed the Timetable Simulator's structured availability store, so what's
  // taught here actually shapes its auto-drafter, not just a note only this
  // assistant reads. Same client_key convention the simulator itself uses.
  const windows = parseAvailabilityText(availabilityNotes);
  const clientKey = `fnh:${clientId}`;
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
      : "Couldn't confidently parse specific days/times from that — the Timetable Simulator will still treat this client as fully open. Ask the practitioner to phrase it like 'Tuesdays after 5pm' if precision matters.",
  };
}

async function runProposeBooking(supabase: any, userId: string, args: any) {
  // Writes into the SAME booking_proposals table the Timetable Simulator's
  // fortnight view reads (useBookingProposals hook) — a slot proposed here
  // shows up there too as pencilled-in, and vice versa, instead of the
  // assistant running its own disconnected shadow booking system.
  const startISO = args.start_iso;
  const endISO = new Date(new Date(startISO).getTime() + 60 * 60000).toISOString();
  const { data, error } = await supabase
    .from("booking_proposals")
    .insert({
      user_id: userId,
      kind: "fnh",
      client_id: args.client_id,
      student_name: args.client_name,
      event_type_id: args.event_type_id ? String(args.event_type_id) : null,
      slot_start: startISO,
      slot_end: endISO,
      status: "proposed",
      reason: args.notes || null,
    })
    .select("id")
    .single();

  const pendingBooking = {
    client_id: args.client_id, client_name: args.client_name, start_iso: startISO,
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

async function runGetAvailableSlots(supabase: any, userId: string, start: string, end: string, eventTypeId: number | undefined, clientId?: string) {
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
  const flatIsos: string[] = [];
  for (const [date, entries] of Object.entries<any>(raw)) {
    const isos = (entries || []).map((e: any) => (typeof e === "string" ? e : (e?.start || e?.time))).filter(Boolean);
    slots[date] = isos.map(fmtMelbourne);
    flatIsos.push(...isos);
  }

  if (!clientId || flatIsos.length === 0) return { slots };

  // Rank candidates by this client's own known preferences instead of leaving
  // "which of these dozens of slots would they actually want" to the model's
  // own guesswork across two separate tool outputs.
  const [{ data: clientRow }, { data: pastAppointments }] = await Promise.all([
    supabase.from("clients").select("availability_notes").eq("id", clientId).eq("user_id", userId).maybeSingle(),
    supabase.from("appointments").select("date").eq("client_id", clientId).eq("user_id", userId).eq("status", "Completed").order("date", { ascending: false }).limit(30),
  ]);

  const windows = clientRow?.availability_notes ? parseAvailabilityText(clientRow.availability_notes) : [];

  const dayFreq: Record<number, number> = {};
  const bucketFreq: Record<string, number> = {};
  for (const a of pastAppointments || []) {
    const d = new Date(a.date);
    const day = melbourneDayIndex(d);
    const hour = melbourneHour(d);
    const bucket = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
    if (day >= 0) dayFreq[day] = (dayFreq[day] || 0) + 1;
    bucketFreq[bucket] = (bucketFreq[bucket] || 0) + 1;
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

  return { slots, suggested };
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

async function runSearchVoiceClient(supabaseUrl: string, serviceKey: string, supabase: any, query: string) {
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
  const { data: bookings } = await supabase
    .from("voice_bookings")
    .select("lesson_date, lesson_time, cost, status, discipline")
    .ilike("student_email", student.email || "")
    .order("lesson_date", { ascending: false })
    .limit(10);

  return {
    student: { name: student.name, email: student.email, phone: student.phone, discipline: student.discipline, tags: student.tags, notes: student.notes, last_communication: student.lastCommunication, latest_lesson_date: student.latestDate },
    recent_lessons: (bookings || []).map((b: any) => ({ date: b.lesson_date, time: b.lesson_time, cost: b.cost, status: b.status })),
    note: "Voice lesson pricing is a flat per-service rate (see event_pricing), not per-student — there is no individual rate ladder for voice students.",
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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authErr = await requirePractitioner(req, corsHeaders);
  if (authErr) return authErr;

  try {
    const { conversation_id, client_id, message } = await req.json();
    if (!message) throw new Error("Missing message.");

    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) throw new Error("GEMINI_API_KEY is missing.");

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

    const systemInstruction = `You are the scheduling assistant inside Daniele's practice CRM, which runs TWO arms: kinesiology/FNH clinical clients (in the clients table, use get_client_context / get_active_clients / get_revenue_opportunities) and Voice Studio piano/singing lesson students (Notion-backed, use search_voice_client — they are NOT in the clients table and have no individual rate, only flat per-service pricing). Current time: ${melbourneNow()} (Australia/Melbourne).
Clients communicate messily — vague times ("until 2pm", "health permitting"), same-day cancellations, and ambiguous confirmations ("that's perfect" meaning "yes to the last time you proposed"). Interpret them charitably but flag genuine ambiguity rather than guessing.
Use the available tools to ground your answers in real data — never invent appointment times, client details, rates, or slot availability.
${client_id ? `This conversation is focused on one specific client (client_id: ${client_id}). Call get_client_context first to load their history, current rate vs target rate, and communication style, and match their tone when drafting anything.` : "This is a general conversation, not focused on one client."}
You can draft an email for review via draft_email_reply, but you can never send one yourself — always say the draft is ready for review, never that it has been sent.
Clients also have a self-serve portal at /portal/login (email OTP, no password) where they can view their own upcoming/past sessions, cancel a booking, book a new one, and message Daniele directly. If a client seems unaware of it, or asks how to manage/cancel their own booking, or Daniele wants to point someone there, feel free to mention it and include the link in a drafted email.
You can propose an actual booking via propose_booking, but you can never create one yourself — it only becomes real when the practitioner clicks Confirm on the proposal card. Always call get_available_slots first and propose a real slot from that result, never a guessed time. When finding a slot for a specific client, always pass client_id to get_available_slots — it returns a ranked "suggested" shortlist (weighted by that client's availability_notes and their actual booking history, not just chronological order), each with a "reason". Lead with the top suggested slot and its reason ("Tuesday 4pm usually works well for her, and it fits the note about after-work sessions") rather than defaulting to whichever slot happens to be soonest — the earliest slot is very often NOT the one a client actually wants.
Whenever the practitioner tells you something new about a client's availability (a day/time that works or doesn't), call update_client_availability right away to remember it for next time — don't just acknowledge it in the chat and let it evaporate.
You can search the inbox read-only via search_inbox (Gmail search syntax) to check for replies or past correspondence — you cannot send, modify, or delete anything through it.
For business questions ("who's active", "who should I raise rates for", "what times are free"), use get_active_clients, get_revenue_opportunities, and get_practice_schedule_overview rather than guessing — they compute real numbers from appointment history.
Be proactive, not just reactive: if the conversation naturally touches on scheduling and get_active_clients shows active clients with no future booking, mention them and offer to help book their next session, rather than waiting to be asked. When a client's next-session cadence is clear from get_past_booking_patterns, feel free to suggest it ("she's usually every 2 weeks, so [date] would fit her pattern").`;

    const toolTrace: any[] = [];
    let pendingDraft = null;
    let pendingBooking = null;
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
        } else if (name === "propose_booking") {
          const proposed = await runProposeBooking(supabase, userId, args);
          pendingBooking = proposed.pendingBooking;
          result = proposed.result;
        } else if (name === "update_client_availability") {
          result = await runUpdateClientAvailability(supabase, userId, args.client_id, args.availability_notes);
        } else if (name === "search_inbox") {
          result = await runSearchInbox(SUPABASE_URL, SERVICE_KEY, args.query);
        } else if (name === "get_client_context") {
          result = await runGetClientContext(supabase, userId, args.client_id);
        } else if (name === "get_available_slots") {
          result = await runGetAvailableSlots(supabase, userId, args.start, args.end, args.event_type_id, args.client_id);
        } else if (name === "get_past_booking_patterns") {
          result = await runGetPastBookingPatterns(supabase, userId, args.client_id);
        } else if (name === "search_voice_client") {
          result = await runSearchVoiceClient(SUPABASE_URL, SERVICE_KEY, supabase, args.query);
        } else if (name === "get_active_clients") {
          result = await runGetActiveClients(supabase, userId, args.months || 3);
        } else if (name === "get_revenue_opportunities") {
          result = await runGetRevenueOpportunities(supabase, userId, args.months || 3);
        } else if (name === "get_practice_schedule_overview") {
          result = await runGetPracticeScheduleOverview(supabase, userId, args.weeks || 8);
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
    console.error("[assistant-chat] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
