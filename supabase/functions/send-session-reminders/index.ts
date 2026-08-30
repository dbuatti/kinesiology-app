// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Supabase credentials from environment
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const GMAIL_CLIENT_ID = Deno.env.get("GMAIL_CLIENT_ID") || "";
const GMAIL_CLIENT_SECRET = Deno.env.get("GMAIL_CLIENT_SECRET") || "";
const GMAIL_REFRESH_TOKEN = Deno.env.get("GMAIL_REFRESH_TOKEN") || "";
const GMAIL_USER_EMAIL = Deno.env.get("GMAIL_USER_EMAIL") || "";

// Google OAuth token endpoint
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

// Voice lesson_time is stored as a display string, sometimes in UTC
// (e.g. "5:15 AM UTC – 6:00 AM UTC") and sometimes already local wall-clock
// (e.g. "2:15 PM"). This edge function runs in UTC, so UTC strings must be
// explicitly converted to Melbourne local; non-UTC strings are just tidied.
function melbourneVoiceTime(dateStr: string, timeStr: string): string {
  if (!timeStr) return "TBA";
  const [y, mo, d] = String(dateStr || "").split("-").map(Number);
  const isUTC = /UTC/i.test(timeStr);
  const stripTz = (s: string) =>
    s.replace(/(?:UTC|AEST|AEDT|GMT[+-]\d+|EST|ACST|ACDT|AWST)\b/gi, "").trim();

  const parseHM = (s: string): { h: number; m: number } | null => {
    const m = stripTz(s).match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!m) return null;
    let h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    const ap = m[3].toUpperCase();
    if (ap === "PM" && h !== 12) h += 12;
    if (ap === "AM" && h === 12) h = 0;
    return { h, m: min };
  };

  const fmt = (h: number, min: number): string => {
    if (isUTC && y && mo && d) {
      return new Date(Date.UTC(y, mo - 1, d, h, min)).toLocaleTimeString("en-AU", {
        timeZone: "Australia/Melbourne",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }
    const ap = h >= 12 ? "pm" : "am";
    const hr12 = h % 12 === 0 ? 12 : h % 12;
    return `${hr12}:${String(min).padStart(2, "0")} ${ap}`;
  };

  const parts = timeStr.split(/[–—−-]/).map((s) => s.trim());
  const start = parseHM(parts[0]);
  if (!start) return stripTz(timeStr) || "TBA";
  if (parts.length >= 2) {
    const end = parseHM(parts[1]);
    if (end) return `${fmt(start.h, start.m)} – ${fmt(end.h, end.m)}`;
  }
  return fmt(start.h, start.m);
}

interface Appointment {
  id: string;
  date: string;
  client_id: string;
  clients: {
    name: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
  status: string;
  tag: string;
  time: string | null;
  price_amount: number | null;
  reminder_sent: boolean;
}

interface ReminderResult {
  success: number;
  failed: number;
  errors: Array<{ client: string; error: string }>;
}

async function getGoogleAccessToken(): Promise<string> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GMAIL_CLIENT_ID,
      client_secret: GMAIL_CLIENT_SECRET,
      refresh_token: GMAIL_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get Google access token: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function sendEmail(
  accessToken: string,
  to: string,
  subject: string,
  htmlBody: string
): Promise<boolean> {
  // Encode the subject per RFC 2047 so non-ASCII (✦, –, curly quotes) survives.
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const rawEmail = [
    `From: ${GMAIL_USER_EMAIL}`,
    `To: ${to}`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=utf-8",
    `Subject: ${utf8Subject}`,
    "",
    htmlBody,
  ].join("\n");

  // btoa only handles Latin1 — UTF-8-encode first so the branded HTML doesn't throw.
  const encodedEmail = btoa(unescape(encodeURIComponent(rawEmail)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: encodedEmail }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Gmail API error: ${response.status}`);
  }

  return true;
}

function generateTestEmail(userEmail: string): { subject: string; html: string } {
  const now = new Date();
  const formattedDate = now.toLocaleDateString("en-AU", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = now.toLocaleTimeString("en-AU", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const subject = `Preview: Session reminder email`;

  // A branded preview so the "Send test email" button shows exactly what clients
  // will receive — same look as the real weekly reminder, with a sample session.
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="margin: 0; padding: 0; background-color: #FDFCFB; font-family: sans-serif;">
      <center style="width: 100%; background-color: #FDFCFB; padding: 40px 0;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 40px; overflow: hidden; border: 1px solid #F1E9EF;">
          <tr><td style="height: 6px; background-color: #D46A9B;"></td></tr>
          <tr>
            <td style="padding: 56px 44px;">
              <div style="text-align: center;">
                <div style="color: #1E3261; font-size: 26px; font-weight: 700;">✦ Resonance Kinesiology</div>
                <div style="color: #D46A9B; font-size: 11px; font-weight: 900; letter-spacing: 0.36em; margin-top: 14px; text-transform: uppercase;">Session Reminder</div>
              </div>

              <div style="text-align: left; margin-top: 44px; line-height: 1.8; font-size: 17px; color: #334155;">
                <p style="margin: 0 0 18px;">Hi Daniele,</p>
                <p style="margin: 0 0 8px;">Just a friendly reminder about your next appointment this week:</p>

                <div style="background-color: #F8FAFC; border-radius: 20px; padding: 22px 24px; margin: 14px 0; border: 1px solid #EEF2F7;">
                  <div style="font-size: 10px; font-weight: 800; color: #D46A9B; text-transform: uppercase; letter-spacing: 0.14em;">FNH Session</div>
                  <div style="font-size: 20px; font-weight: 700; color: #1E293B; margin-top: 6px;">${formattedDate}</div>
                  <div style="font-size: 15px; color: #64748B; margin-top: 4px;">${formattedTime}</div>
                </div>

                <p style="margin: 28px 0 0;">Looking forward to seeing you. If anything changes, just reply to this email and we'll sort it out.</p>
              </div>

              <div style="margin-top: 40px; text-align: left;">
                <p style="margin: 0; font-size: 17px; color: #334155;">All the best,</p>
                <div style="font-weight: 700; color: #1E3261; font-size: 18px; margin-top: 6px;">Daniele</div>
                <div style="color: #D46A9B; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 2px;">Resonance Kinesiology</div>
              </div>

              <div style="border-top: 1px solid #F1F5F9; margin-top: 40px; padding-top: 20px; text-align: center;">
                <p style="color: #B8C0CC; font-size: 11px; margin: 0;">This is a preview sent to ${userEmail} — clients receive the same design.</p>
              </div>
            </td>
          </tr>
        </table>
      </center>
    </body>
    </html>
  `;

  return { subject, html };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  console.log("[send-session-reminders] Function invoked");

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");

    // Initialize Supabase client with service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Two kinds of caller are allowed:
    //   (1) the scheduled pg_cron job, which authenticates with the service-role key, and
    //   (2) a logged-in practitioner clicking "Send reminders" in the app.
    // Anonymous / anon-key-only callers are rejected.
    const isServiceCall = !!SUPABASE_SERVICE_ROLE_KEY && token === SUPABASE_SERVICE_ROLE_KEY;

    let user: { id: string; email?: string } | null = null;
    if (!isServiceCall) {
      const { data: { user: authedUser }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !authedUser) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      user = authedUser;
    }

    console.log(`[send-session-reminders] Caller: ${isServiceCall ? "cron/service" : `user ${user?.id}`}`);

    // Parse request body for debug/test/scheduling parameters
    let body: Record<string, any> = {};
    let isDebug = false;
    try {
      body = await req.json();
      isDebug = body.debug === true;
    } catch (e) {
      // If body is not JSON, treat as normal request
      isDebug = false;
    }

    // DST-safe timing guard: the cron fires every Sunday at both 05:00 and 06:00 UTC.
    // Only the run that lands on 16:00 (4pm) in Melbourne actually sends — the other is
    // skipped here. This hits 4pm local year-round without tracking AEST/AEDT ourselves.
    // `force: true` bypasses the guard (manual re-run / testing).
    const isScheduled = isServiceCall || body.scheduled === true;
    if (isScheduled && body.force !== true && !isDebug) {
      const melHour = parseInt(
        new Intl.DateTimeFormat("en-AU", {
          timeZone: "Australia/Melbourne",
          hour: "2-digit",
          hour12: false,
        }).format(new Date()),
        10,
      );
      if (melHour !== 16) {
        console.log(`[send-session-reminders] Skipping scheduled run — Melbourne hour is ${melHour}, not 16.`);
        return new Response(
          JSON.stringify({ message: `Skipped: not 4pm in Melbourne (hour ${melHour})`, result: { success: 0, failed: 0, errors: [] } }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // Handle debug/test email request. Works for both a logged-in user (sends to
    // them) and a direct service-role curl (sends to GMAIL_USER_EMAIL) so the
    // pipeline can be verified without touching real clients.
    if (isDebug) {
      const testRecipient = user?.email || GMAIL_USER_EMAIL;
      console.log(`[send-session-reminders] Debug mode: sending test email to ${testRecipient}`);
      if (!testRecipient) throw new Error("No test recipient (no user email and GMAIL_USER_EMAIL unset)");

      // Get Google access token
      const accessToken = await getGoogleAccessToken();

      // Generate and send test email
      const { subject, html } = generateTestEmail(testRecipient);

      await sendEmail(accessToken, testRecipient, subject, html);

      // Log the test email
      try {
        await supabase.from("email_log").insert({
          user_id: user?.id ?? null,
          recipient_email: testRecipient,
          subject: `TEST: Session reminder system test`,
          status: "sent",
          email_type: "test_reminder",
        });
      } catch (_e) { /* logging is best-effort */ }

      console.log("[send-session-reminders] Test email sent successfully");
      
      return new Response(
        JSON.stringify({
          message: "Test email sent successfully",
          result: { success: 1, failed: 0, errors: [] },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Look 7 days ahead for both FNH appointments and voice lessons.
    const today = new Date().toISOString().split("T")[0];
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split("T")[0];

    console.log(`[send-session-reminders] Fetching sessions from ${today} to ${nextWeekStr}`);

    // A single normalized shape so FNH + voice can share one digest email per client.
    interface ReminderItem {
      source: "fnh" | "voice";
      id: string;
      email: string;
      name: string;
      firstName: string;
      dateISO: string;   // sortable date (ISO or YYYY-MM-DD)
      timeStr: string;    // display time
      typeLabel: string;
    }

    // Addresses that represent the practitioner, not a client — never remind these.
    const PRACTITIONER_EMAILS = new Set(
      [Deno.env.get("GMAIL_USER_EMAIL"), "daniele.buatti@gmail.com", "info@danielebuatti.com"]
        .filter(Boolean)
        .map((e) => e!.toLowerCase()),
    );

    // --- 1. FNH appointments -------------------------------------------------
    const { data: appointments, error: dbError } = await supabase
      .from("appointments")
      .select(`
        id, date, client_id, status, tag, reminder_sent,
        clients ( id, name, email )
      `)
      .gte("date", today)
      .lte("date", nextWeekStr)
      .eq("reminder_sent", false)
      .eq("status", "Scheduled")
      .order("date", { ascending: true });

    if (dbError) {
      console.error("[send-session-reminders] FNH query error:", dbError);
      return new Response(JSON.stringify({ error: dbError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- 2. Voice lessons ----------------------------------------------------
    const { data: voiceRows, error: voiceError } = await supabase
      .from("voice_bookings")
      .select("id, student_email, student_name, lesson_date, lesson_time, status, discipline, reminder_sent")
      .gte("lesson_date", today)
      .lte("lesson_date", nextWeekStr)
      .eq("reminder_sent", false)
      .order("lesson_date", { ascending: true });

    if (voiceError) {
      // Voice is best-effort: log and continue with FNH rather than failing the whole run.
      console.error("[send-session-reminders] Voice query error (continuing):", voiceError.message);
    }

    const items: ReminderItem[] = [];

    for (const appt of appointments || []) {
      const email = (appt.clients?.email || "").toLowerCase().trim();
      if (!email || PRACTITIONER_EMAILS.has(email)) continue;
      const name = appt.clients?.name || "Client";
      // The appointment time lives inside the `date` timestamp; render it in Melbourne.
      const apptDt = new Date(appt.date);
      const timeStr = isNaN(apptDt.getTime())
        ? "TBA"
        : apptDt.toLocaleTimeString("en-AU", { timeZone: "Australia/Melbourne", hour: "numeric", minute: "2-digit", hour12: true });
      items.push({
        source: "fnh",
        id: appt.id,
        email,
        name,
        firstName: name.split(" ")[0],
        dateISO: appt.date,
        timeStr,
        typeLabel: appt.tag || "FNH Session",
      });
    }

    for (const v of voiceRows || []) {
      const email = (v.student_email || "").toLowerCase().trim();
      const name = (v.student_name || "").trim();
      const status = (v.status || "").toLowerCase();
      // Skip practitioner self-bookings, nameless placeholders, and cancellations.
      if (!email || PRACTITIONER_EMAILS.has(email) || !name) continue;
      if (status.includes("cancel")) continue;
      const isPiano = String(v.discipline || "").toLowerCase() === "piano";
      items.push({
        source: "voice",
        id: v.id,
        email,
        name,
        firstName: name.split(" ")[0],
        dateISO: v.lesson_date,
        timeStr: v.lesson_time ? melbourneVoiceTime(v.lesson_date, v.lesson_time) : "TBA",
        typeLabel: isPiano ? "Piano Lesson" : "Voice Lesson",
      });
    }

    if (items.length === 0) {
      console.log("[send-session-reminders] No pending reminders found");
      return new Response(
        JSON.stringify({ message: "No pending reminders", result: { success: 0, failed: 0, errors: [] } }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log(`[send-session-reminders] ${items.length} sessions (${(appointments || []).length} FNH, ${(voiceRows || []).length} voice) to remind`);

    const accessToken = await getGoogleAccessToken();

    // Group by client email so each client gets one digest of all their sessions.
    const byEmail = new Map<string, ReminderItem[]>();
    for (const it of items) {
      const list = byEmail.get(it.email) || [];
      list.push(it);
      byEmail.set(it.email, list);
    }

    console.log(`[send-session-reminders] Processing ${byEmail.size} unique clients`);

    const result: ReminderResult = { success: 0, failed: 0, errors: [] };

    for (const [email, clientItems] of byEmail) {
      clientItems.sort((a, b) => new Date(a.dateISO).getTime() - new Date(b.dateISO).getTime());
      const firstName = clientItems[0].firstName || "there";

      try {
        // Each session as a soft, warm card: type + friendly date + time.
        const sessionCards = clientItems
          .map((it) => {
            const d = new Date(it.dateISO);
            const friendlyDate = isNaN(d.getTime())
              ? it.dateISO
              : d.toLocaleDateString("en-AU", { timeZone: "Australia/Melbourne", weekday: "long", day: "numeric", month: "long" });
            return `
              <div style="background-color: #F8FAFC; border-radius: 20px; padding: 22px 24px; margin: 14px 0; border: 1px solid #EEF2F7;">
                <div style="font-size: 10px; font-weight: 800; color: #D46A9B; text-transform: uppercase; letter-spacing: 0.14em;">${it.typeLabel}</div>
                <div style="font-size: 20px; font-weight: 700; color: #1E293B; margin-top: 6px;">${friendlyDate}</div>
                <div style="font-size: 15px; color: #64748B; margin-top: 4px;">${it.timeStr}</div>
              </div>`;
          })
          .join("");

        const subject = clientItems.length > 1
          ? `Looking forward to seeing you this week, ${firstName}`
          : `A reminder about your session this week, ${firstName}`;

        const html = `
          <!DOCTYPE html>
          <html>
          <body style="margin: 0; padding: 0; background-color: #FDFCFB; font-family: sans-serif;">
            <center style="width: 100%; background-color: #FDFCFB; padding: 40px 0;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 40px; overflow: hidden; border: 1px solid #F1E9EF;">
                <tr><td style="height: 6px; background-color: #D46A9B;"></td></tr>
                <tr>
                  <td style="padding: 56px 44px;">
                    <div style="text-align: center;">
                      <div style="color: #1E3261; font-size: 26px; font-weight: 700;">✦ Resonance Kinesiology</div>
                      <div style="color: #D46A9B; font-size: 11px; font-weight: 900; letter-spacing: 0.36em; margin-top: 14px; text-transform: uppercase;">Session Reminder</div>
                    </div>

                    <div style="text-align: left; margin-top: 44px; line-height: 1.8; font-size: 17px; color: #334155;">
                      <p style="margin: 0 0 18px;">Hi ${firstName},</p>
                      <p style="margin: 0 0 8px;">Just a friendly reminder about your ${clientItems.length > 1 ? "upcoming sessions" : "next appointment"} this week:</p>

                      ${sessionCards}

                      <p style="margin: 28px 0 0;">Looking forward to seeing you. If anything changes, just reply to this email and we'll sort it out.</p>
                    </div>

                    <div style="margin-top: 40px; text-align: left;">
                      <p style="margin: 0; font-size: 17px; color: #334155;">All the best,</p>
                      <div style="font-weight: 700; color: #1E3261; font-size: 18px; margin-top: 6px;">Daniele</div>
                      <div style="color: #D46A9B; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 2px;">Resonance Kinesiology</div>
                    </div>
                  </td>
                </tr>
              </table>
            </center>
          </body>
          </html>`;

        await sendEmail(accessToken, email, subject, html);

        // Flag each source row so it isn't reminded again this week.
        const nowIso = new Date().toISOString();
        const fnhIds = clientItems.filter((i) => i.source === "fnh").map((i) => i.id);
        const voiceIds = clientItems.filter((i) => i.source === "voice").map((i) => i.id);
        if (fnhIds.length) {
          await supabase.from("appointments").update({ reminder_sent: true, reminder_sent_at: nowIso }).in("id", fnhIds);
        }
        if (voiceIds.length) {
          await supabase.from("voice_bookings").update({ reminder_sent: true, reminder_sent_at: nowIso }).in("id", voiceIds);
        }

        result.success += clientItems.length;
        console.log(`[send-session-reminders] Sent reminder to ${email} (${clientItems.length} session(s))`);
      } catch (err: any) {
        console.error(`[send-session-reminders] Error sending to ${email}:`, err);
        result.failed += clientItems.length;
        result.errors.push({ client: clientItems[0].name || "Unknown", error: err.message || "Unknown error" });
      }
    }

    // Log the run (user_id is null for the scheduled/cron caller).
    try {
      await supabase.from("email_log").insert({
        user_id: user?.id ?? null,
        recipient_email: Array.from(byEmail.keys()).join(", "),
        subject: `Weekly session reminders (${result.success} sent, ${result.failed} failed)`,
        status: result.failed === 0 ? "sent" : "partial",
        email_type: "session_reminder",
      });
    } catch (e: any) {
      console.error("[send-session-reminders] email_log insert failed:", e?.message);
    }

    console.log(`[send-session-reminders] Completed: ${result.success} success, ${result.failed} failed`);

    return new Response(
      JSON.stringify({ message: "Reminders processed", result }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("[send-session-reminders] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});