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
  const rawEmail = [
    `From: ${GMAIL_USER_EMAIL}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "Content-Type: text/html; charset=utf-8",
    "",
    htmlBody,
  ].join("\n");

  const encodedEmail = btoa(rawEmail).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

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

function generateReminderEmail(appointment: Appointment): { subject: string; html: string } {
  const appointmentDate = new Date(appointment.date);
  const formattedDate = appointmentDate.toLocaleDateString("en-AU", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const timeStr = appointment.time
    ? new Date(`1970-01-01T${appointment.time}`).toLocaleTimeString("en-AU", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : "TBA";

  const clientName = appointment.clients?.name || "Client";
  const firstName = appointment.clients?.first_name || clientName.split(" ")[0];

  const subject = `Reminder: Your ${appointment.tag || "session"} on ${formattedDate}`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">Session Reminder</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Your upcoming appointment</p>
      </div>
      <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
        <p style="color: #334155; font-size: 16px; margin: 0 0 20px 0;">Dear ${firstName},</p>
        <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
          This is a friendly reminder about your upcoming session:
        </p>
        <div style="background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px; border-left: 4px solid #6366f1;">
          <p style="color: #1e293b; font-size: 18px; font-weight: 600; margin: 0 0 8px 0;">${appointment.tag || "Session"}</p>
          <p style="color: #64748b; font-size: 14px; margin: 0 0 4px 0;">
            <strong>Date:</strong> ${formattedDate}
          </p>
          <p style="color: #64748b; font-size: 14px; margin: 0 0 4px 0;">
            <strong>Time:</strong> ${timeStr}
          </p>
          <p style="color: #64748b; font-size: 14px; margin: 0;">
            <strong>Client:</strong> ${clientName}
          </p>
        </div>
        <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
          If you need to reschedule or have any questions, please don't hesitate to reach out.
        </p>
        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">This is an automated reminder. Please don't reply to this email.</p>
        </div>
      </div>
    </div>
  `;

  return { subject, html };
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
    if (isScheduled && body.force !== true) {
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

    // Handle debug/test email request
    if (isDebug && user) {
      console.log("[send-session-reminders] Debug mode: sending test email");
      
      // Get Google access token
      const accessToken = await getGoogleAccessToken();
      
      // Generate and send test email
      const { subject, html } = generateTestEmail(user.email || "");
      
      await sendEmail(accessToken, user.email || "", subject, html);
      
      // Log the test email
      await supabase.from("email_log").insert({
        user_id: user.id,
        recipient_email: user.email || "",
        subject: `TEST: Session reminder system test`,
        status: "sent",
        email_type: "test_reminder",
      });
      
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
        id, date, client_id, status, tag, time, reminder_sent,
        clients ( id, name, email, first_name, last_name )
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
      .select("id, student_email, student_name, lesson_date, lesson_time, status, reminder_sent")
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
      const timeStr = appt.time
        ? new Date(`1970-01-01T${appt.time}`).toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit", hour12: true })
        : "TBA";
      items.push({
        source: "fnh",
        id: appt.id,
        email,
        name,
        firstName: appt.clients?.first_name || name.split(" ")[0],
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
      items.push({
        source: "voice",
        id: v.id,
        email,
        name,
        firstName: name.split(" ")[0],
        dateISO: v.lesson_date,
        timeStr: (v.lesson_time && String(v.lesson_time).trim()) || "TBA",
        typeLabel: "Voice Lesson",
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
              : d.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" });
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