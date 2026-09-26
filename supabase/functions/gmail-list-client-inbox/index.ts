// @ts-nocheck
// Cross-client inbox: every recent email FROM a known client or voice student,
// across the whole practice, sorted chronologically — not scoped to one person.
// Read-only (gmail.readonly scope), same as gmail-get-client-thread.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requirePractitioner } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Keeps the Gmail search query (and round-trip cost) bounded — a practice with
// more distinct client emails than this would need pagination, not a bigger cap.
const MAX_ADDRESSES = 200;
const MAX_MESSAGES = 60;
const MAX_SENT = 80;

async function getAccessToken(clientId: string, clientSecret: string, refreshToken: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: "refresh_token" }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Gmail Auth Error: ${data.error_description || data.error}`);
  return data.access_token;
}

function headerValue(headers: { name: string; value: string }[], name: string) {
  return headers?.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || "";
}

// Gmail's own `snippet` field is generated from the HTML body and can leave
// individual words still HTML-entity-encoded (seen live: "I&#39;m" next to an
// already-clean "wasn't" in the same snippet) — decode before it reaches the UI.
function decodeHtmlEntities(text: string): string {
  if (!text) return text;
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ");
}

// Snippets of replies carry the quoted history ("…great! > On 24 Sep 2026, at
// 12:23, Daniele Buatti wrote: > > Hi Lizzy…"), which crowds out what the
// client actually said. Cut at the first quote marker.
function stripQuotedTail(text: string): string {
  if (!text) return text;
  const cut = text.search(/(\s>\s|\s*On (?:(?!\. )[^\n]){6,160}?(wrote|a écrit):|\s*-{2,}\s*Original Message|\s*From:\s.+?Sent:)/i);
  return (cut > 0 ? text.slice(0, cut) : text).trim();
}

// Pulls the bare address out of a "Name" <email@x.com> or plain email@x.com header.
function extractEmail(fromHeader: string): string {
  const match = fromHeader.match(/<([^>]+)>/);
  return (match ? match[1] : fromHeader).toLowerCase().trim();
}

// Client-portal messages: From is the practice, Reply-To is the client.
function portalSender(headers: { name: string; value: string }[]): string | null {
  if (!/\(Client Portal\)/.test(headerValue(headers, "Subject"))) return null;
  const replyTo = headerValue(headers, "Reply-To");
  return replyTo ? extractEmail(replyTo) : null;
}

function extractDisplayName(fromHeader: string): string {
  const match = fromHeader.match(/^"?([^"<]+?)"?\s*</);
  return match ? match[1].trim() : "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const authErr = await requirePractitioner(req, corsHeaders);
  if (authErr) return authErr;

  try {
    const CLIENT_ID = Deno.env.get("GMAIL_CLIENT_ID");
    const CLIENT_SECRET = Deno.env.get("GMAIL_CLIENT_SECRET");
    const REFRESH = Deno.env.get("GMAIL_READONLY_INBOX_REFRESH_TOKEN");
    const PRACTICE_EMAIL = (Deno.env.get("GMAIL_USER_EMAIL") || "").toLowerCase();
    // Every address Daniele can appear as in a From header. GMAIL_USER_EMAIL is
    // the auth account ("daniele.buatti@gmail.com"), but all client-facing reads
    // and writes are sent from the verified alias "Daniele Buatti
    // <info@danielebuatti.com>" AND self-Bcc'd (every send function writes
    // "Bcc: info@danielebuatti.com"), so the practice's own sent mail lands back
    // in the inbox with From = info@danielebuatti.com. The old self-test
    // exclusion compared only against GMAIL_USER_EMAIL, so these Bcc copies were
    // swept up as a phantom client called "Daniele Buatti" and flagged "needs
    // reply" even though he sent them. Both addresses must count as "the practice".
    const practiceEmails = new Set([PRACTICE_EMAIL, "info@danielebuatti.com", "daniele.buatti@gmail.com"].filter(Boolean));
    if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH) throw new Error("Gmail inbox read is not configured.");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Known client/student emails — the single source of truth for "who counts",
    // so the inbox view never shows a stranger's email just because it matched text.
    const [{ data: clients }, { data: voiceRows }] = await Promise.all([
      supabase.from("clients").select("id, name, email").not("email", "is", null),
      supabase.from("voice_bookings").select("student_name, student_email").not("student_email", "is", null),
    ]);

    // Daniele has his own self-test row in `clients` (same email he practices
    // from, which is the alias the app sends as) — without excluding it, his own
    // sent mail (which lands back in his inbox via Bcc-to-self) gets swept up and
    // shown as if a client named "Daniele Buatti" emailed him, and opening it
    // searches his own address against his whole inbox instead of one real
    // client's thread. His own email on the receiving side is the only thing
    // distinguishing these rows from a genuine client.
    const byEmail = new Map<string, { id: string; name: string; kind: "kinesiology" | "voice" }>();
    for (const c of (clients || []) as any[]) {
      const email = String(c.email || "").toLowerCase().trim();
      if (email && !practiceEmails.has(email)) byEmail.set(email, { id: c.id, name: c.name || "Unknown", kind: "kinesiology" });
    }
    for (const v of (voiceRows || []) as any[]) {
      const email = String(v.student_email || "").toLowerCase().trim();
      if (email && !practiceEmails.has(email) && !byEmail.has(email)) byEmail.set(email, { id: `voice:${email}`, name: v.student_name || "Unknown", kind: "voice" });
    }

    const addresses = Array.from(byEmail.keys()).slice(0, MAX_ADDRESSES);
    if (addresses.length === 0) {
      return new Response(JSON.stringify({ messages: [] }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const accessToken = await getAccessToken(CLIENT_ID, CLIENT_SECRET, REFRESH);
    const authHeaders = { Authorization: `Bearer ${accessToken}` };

    // One search covering every known client, rather than one call per client —
    // the whole point is this stays fast enough to run every time the view opens.
    const fromClause = addresses.map((e) => `from:${e}`).join(" OR ");
    const listUrl = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");
    listUrl.searchParams.set("q", `in:inbox newer_than:90d (${fromClause})`);
    listUrl.searchParams.set("maxResults", String(MAX_MESSAGES));
    const listRes = await fetch(listUrl.toString(), { headers: authHeaders });
    const listData = await listRes.json();
    if (!listRes.ok) throw new Error(listData?.error?.message || "Gmail search failed.");

    // Client-portal messages ("Message from X (Client Portal)") are sent from
    // the practice address to itself with Reply-To: the client, so the from:
    // search above never finds them. Pick them up separately and attribute
    // them via Reply-To.
    const portalUrl = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");
    portalUrl.searchParams.set("q", `in:inbox newer_than:90d subject:"Client Portal"`);
    portalUrl.searchParams.set("maxResults", "30");
    const portalRes = await fetch(portalUrl.toString(), { headers: authHeaders });
    const portalData = portalRes.ok ? await portalRes.json() : {};
    const ids: string[] = [...new Set([...(listData.messages || []), ...(portalData.messages || [])].map((m: any) => m.id))];
    const messages = await Promise.all(
      ids.map(async (id) => {
        const url = new URL(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}`);
        url.searchParams.set("format", "metadata");
        url.searchParams.append("metadataHeaders", "Subject");
        url.searchParams.append("metadataHeaders", "Date");
        url.searchParams.append("metadataHeaders", "From");
        url.searchParams.append("metadataHeaders", "Reply-To");
        const res = await fetch(url.toString(), { headers: authHeaders });
        if (!res.ok) return null;
        const data = await res.json();
        const headers = data.payload?.headers || [];
        const fromHeader = headerValue(headers, "From");
        const portalEmail = portalSender(headers);
        const email = portalEmail || extractEmail(fromHeader);
        const known = byEmail.get(email);
        if (!known) return null; // defensive — the search already scoped to known senders
        return {
          id: data.id,
          thread_id: data.threadId,
          client_id: known.kind === "kinesiology" ? known.id : null,
          voice_student_email: known.kind === "voice" ? email : null,
          name: known.name,
          from_display_name: portalEmail ? known.name : extractDisplayName(fromHeader) || known.name,
          via_portal: !!portalEmail,
          email,
          kind: known.kind,
          subject: decodeHtmlEntities(headerValue(headers, "Subject")) || "(no subject)",
          snippet: stripQuotedTail(decodeHtmlEntities(data.snippet || "")),
          date: headerValue(headers, "Date"),
          date_iso: new Date(headerValue(headers, "Date")).toISOString(),
        };
      }),
    );

    const clean = messages.filter(Boolean).sort((a: any, b: any) => new Date(b.date_iso).getTime() - new Date(a.date_iso).getTime());

    // For each distinct thread, check whether the practice has already sent a
    // later reply — that's what actually determines "needs a reply" vs
    // "already handled", not just that a client message exists at all.
    // Compare the last message's sender against THIS CLIENT's own email
    // (always known for certain) rather than a hardcoded GMAIL_USER_EMAIL env
    // var — same real bug already fixed once in gmail-get-client-thread
    // (GMAIL_USER_EMAIL didn't match the actual sending address
    // "info@danielebuatti.com", so a real reply was never recognised as one).
    const threadClientEmail = new Map<string, string>();
    for (const m of clean as any[]) threadClientEmail.set(m.thread_id, m.email);
    const threadIds = Array.from(new Set(clean.map((m: any) => m.thread_id)));
    const needsReplyByThread = new Map<string, boolean>();
    await Promise.all(
      threadIds.map(async (threadId) => {
        try {
          const url = new URL(`https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}`);
          url.searchParams.set("format", "metadata");
          url.searchParams.append("metadataHeaders", "From");
          url.searchParams.append("metadataHeaders", "Date");
          url.searchParams.append("metadataHeaders", "Subject");
          url.searchParams.append("metadataHeaders", "Reply-To");
          const res = await fetch(url.toString(), { headers: authHeaders });
          if (!res.ok) { needsReplyByThread.set(threadId, true); return; }
          const data = await res.json();
          const msgs = data.messages || [];
          if (msgs.length === 0) { needsReplyByThread.set(threadId, true); return; }
          const last = msgs[msgs.length - 1];
          const lastHeaders = last.payload?.headers || [];
          const clientEmail = threadClientEmail.get(threadId) || "";
          // A portal message is the client speaking even though From is the practice.
          if (portalSender(lastHeaders) === clientEmail) { needsReplyByThread.set(threadId, true); return; }
          const lastFrom = extractEmail(headerValue(lastHeaders, "From"));
          // Needs a reply only if the LAST message is from the client, not the
          // practice (any of its sending addresses — not just GMAIL_USER_EMAIL,
          // since replies can be sent from the info@ alias or a mail app).
          const fromPractice = practiceEmails.has(lastFrom);
          needsReplyByThread.set(threadId, !fromPractice && lastFrom === clientEmail);
        } catch {
          needsReplyByThread.set(threadId, true);
        }
      }),
    );

    const withStatus = clean.map((m: any) => ({ ...m, needs_reply: needsReplyByThread.get(m.thread_id) ?? true }));

    // Outbound side of the conversation. The inbox list above is inbound-only,
    // so on its own it can't tell "Daniele replied in a DIFFERENT thread" (the
    // client's mail app split the conversation, or the reply went out as a new
    // email) from "nobody replied", and it can't see people Daniele emailed who
    // never wrote back — which is what the Follow up queue is for. The frontend
    // groups inbound + outbound by person and normalised subject.
    const sent = await (async () => {
      try {
        const toClause = addresses.map((e) => `to:${e}`).join(" OR ");
        const fromPractice = Array.from(practiceEmails).map((e) => `from:${e}`).join(" OR ");
        const url = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");
        url.searchParams.set("q", `(in:sent OR ${fromPractice}) newer_than:90d (${toClause})`);
        url.searchParams.set("maxResults", String(MAX_SENT));
        const res = await fetch(url.toString(), { headers: authHeaders });
        const data = await res.json();
        if (!res.ok) return [];
        const sentIds: string[] = (data.messages || []).map((m: any) => m.id);
        const rows = await Promise.all(sentIds.map(async (id) => {
          const u = new URL(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}`);
          u.searchParams.set("format", "metadata");
          for (const h of ["Subject", "Date", "To", "From"]) u.searchParams.append("metadataHeaders", h);
          const r = await fetch(u.toString(), { headers: authHeaders });
          if (!r.ok) return null;
          const d = await r.json();
          const headers = d.payload?.headers || [];
          if (!practiceEmails.has(extractEmail(headerValue(headers, "From")))) return null;
          // A message can be addressed to several people — attribute it to
          // every known client on the To line.
          const toEmails = headerValue(headers, "To").split(",").map((t) => extractEmail(t)).filter((e) => byEmail.has(e));
          if (toEmails.length === 0) return null;
          const dateHeader = headerValue(headers, "Date");
          const date = new Date(dateHeader || Number(d.internalDate));
          return toEmails.map((to) => ({
            id: d.id,
            thread_id: d.threadId,
            to_email: to,
            subject: decodeHtmlEntities(headerValue(headers, "Subject")) || "(no subject)",
            snippet: stripQuotedTail(decodeHtmlEntities(d.snippet || "")),
            date_iso: isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString(),
          }));
        }));
        return rows.filter(Boolean).flat();
      } catch {
        return [];
      }
    })();

    // Emails Daniele wrote himself through the app (as opposed to automated
    // reminders/receipts, which also come from the practice address). Lets the
    // frontend put a no-reply-yet email into Follow up without flooding it
    // with every reminder the system ever sent.
    const since = new Date(Date.now() - 90 * 86400000).toISOString();
    const { data: manualSends } = await supabase
      .from("email_log")
      .select("recipient, subject, created_at")
      .in("function_name", ["gmail-send-threaded-reply", "assistant-chat", "send-rate-increase-email"])
      .eq("status", "sent")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(300);

    // Next upcoming session per person — shown as a "Booked" chip so a thread
    // that's really been settled by a booking is obvious at a glance.
    const todayIso = new Date().toISOString().slice(0, 10);
    const kinesiologyIds = Array.from(byEmail.values()).filter((c) => c.kind === "kinesiology").map((c) => c.id);
    const [{ data: upcomingAppts }, { data: upcomingLessons }] = await Promise.all([
      kinesiologyIds.length
        ? supabase.from("appointments").select("client_id, date, status").in("client_id", kinesiologyIds).gte("date", todayIso).order("date", { ascending: true })
        : Promise.resolve({ data: [] }),
      supabase.from("voice_bookings").select("student_email, lesson_date, status").gte("lesson_date", todayIso).order("lesson_date", { ascending: true }),
    ]);
    const emailByClientId = new Map<string, string>();
    for (const [email, c] of byEmail) if (c.kind === "kinesiology") emailByClientId.set(c.id, email);
    const upcoming: Record<string, string> = {};
    for (const a of (upcomingAppts || []) as any[]) {
      if (String(a.status || "").toLowerCase() === "cancelled") continue;
      const email = emailByClientId.get(a.client_id);
      if (email && !upcoming[email]) upcoming[email] = a.date;
    }
    for (const v of (upcomingLessons || []) as any[]) {
      if (String(v.status || "").toLowerCase() === "cancelled") continue;
      const email = String(v.student_email || "").toLowerCase().trim();
      if (byEmail.has(email) && !upcoming[email]) upcoming[email] = v.lesson_date;
    }

    // Name/kind for everyone who appears on either side, so outbound-only
    // conversations (no reply yet) can still be labelled.
    const contacts: Record<string, { name: string; kind: string; client_id: string | null }> = {};
    for (const email of new Set([...clean.map((m: any) => m.email), ...sent.map((m: any) => m.to_email)])) {
      const c = byEmail.get(email);
      if (c) contacts[email] = { name: c.name, kind: c.kind, client_id: c.kind === "kinesiology" ? c.id : null };
    }

    return new Response(JSON.stringify({
      messages: withStatus,
      sent,
      manual_sends: (manualSends || []).map((m: any) => ({ recipient: String(m.recipient || "").toLowerCase().trim(), subject: m.subject || "", created_at: m.created_at })),
      upcoming,
      contacts,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[gmail-list-client-inbox] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
