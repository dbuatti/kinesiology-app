// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.25.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { requireAuth } from "../_shared/guard.ts"
import { createPaymentLink } from "../_shared/stripe-payment.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const VOICE_CLIENTS_DB_ID = "af3e38f400d84dc8975eff4b6269157b";

interface BookingSession {
  studentName: string;
  studentEmail: string;
  date: string;
  time: string;
  startTime: string | null;
  duration: string | number | null;
  cost: string | number | null;
  costNumber: number | null;
  feeWasSet: boolean;
  hasFee: boolean;
  calcomBookingUid: string | null;
  discipline: string;
  sessionName: string | null;
  productName: string;
  friendlyDate: string;
  friendlyTime: string;
  isPiano: boolean;
}

interface PaymentResult {
  paymentUrl: string | null;
  stripeErrMsg: string | null;
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function friendlyDate(date: string): string {
  // The raw date is normally YYYY-MM-DD, but older callers can send a full ISO
  // timestamp or display string. Parse defensively and never render Invalid Date.
  const dateStr = String(date || "").trim();
  const isoDay = dateStr.match(/^\d{4}-\d{2}-\d{2}$/);
  let dateObj = new Date(isoDay ? `${dateStr}T00:00:00Z` : dateStr);
  if (isNaN(dateObj.getTime())) {
    const match = dateStr.match(/\d{4}-\d{2}-\d{2}/);
    if (match) dateObj = new Date(`${match[0]}T00:00:00Z`);
  }
  return isNaN(dateObj.getTime())
    ? dateStr
    : dateObj.toLocaleDateString("en-AU", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Australia/Melbourne",
      });
}

function friendlyTime(time: string): string {
  return String(time || "")
    .replace(/\s*GMT[+-]\d{1,2}(?::?\d{2})?/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeSession(input: any, index: number): BookingSession {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error(`Session ${index + 1} must be an object.`);
  }

  const studentName = String(input.studentName ?? "").trim();
  const studentEmail = String(input.studentEmail ?? "").trim();
  const date = String(input.date ?? "").trim();
  const time = String(input.time ?? "").trim();
  if (!studentName || !studentEmail || !date || !time) {
    throw new Error(`Session ${index + 1} is missing required fields: studentName, studentEmail, date, time`);
  }
  // The recipient is interpolated into a raw MIME header by sendGmail.
  if (/[\r\n]/.test(studentEmail)) {
    throw new Error(`Session ${index + 1} has an invalid studentEmail.`);
  }

  const rawCost = input.cost ?? null;
  const cost = rawCost === null || rawCost === "" ? null : rawCost;
  const costNumber = cost === null ? null : Number(cost);
  const feeWasSet = cost !== null && String(cost).trim() !== "" && Number(cost) !== 0;
  const hasFee = costNumber !== null && Number.isFinite(costNumber) && costNumber > 0;
  const calcomBookingUid = input.calcomBookingUid == null
    ? null
    : String(input.calcomBookingUid).trim() || null;
  const startTime = input.startTime == null ? null : String(input.startTime).trim() || null;
  const discipline = String(input.discipline || "voice").trim().toLowerCase();
  const sessionName = input.sessionName == null ? null : String(input.sessionName).trim() || null;

  return {
    studentName,
    studentEmail,
    date,
    time,
    startTime,
    duration: input.duration ?? null,
    cost,
    costNumber,
    feeWasSet,
    hasFee,
    calcomBookingUid,
    discipline,
    sessionName,
    // Preserve the existing generic product name when no event name is supplied.
    productName: sessionName || "Voice & Piano Coaching",
    friendlyDate: friendlyDate(date),
    friendlyTime: friendlyTime(time),
    isPiano: discipline === "piano",
  };
}

function realCalcomUid(uid: string | null): string | null {
  const value = String(uid || "").trim();
  if (!value || value.toLowerCase().startsWith("force-")) return null;
  return value;
}

function calcomManageUrl(uid: string | null): string | null {
  const realUid = realCalcomUid(uid);
  return realUid ? `https://app.cal.com/booking/${encodeURIComponent(realUid)}` : null;
}

function googleCalendarDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function googleCalendarUrl(session: BookingSession): string | null {
  // Never infer a start time from the display date/time. Older single-booking
  // callers do not send startTime, so they simply do not get this link.
  if (!session.startTime || !session.startTime.includes("T")) return null;
  const start = new Date(session.startTime);
  const duration = Number(session.duration);
  if (isNaN(start.getTime()) || !Number.isFinite(duration) || duration <= 0) return null;
  const end = new Date(start.getTime() + duration * 60_000);
  if (isNaN(end.getTime())) return null;

  const title = session.sessionName || (session.isPiano ? "Piano lesson" : "Voice lesson");
  const manageUrl = calcomManageUrl(session.calcomBookingUid);
  const details = [
    `${session.isPiano ? "Piano" : "Voice"} lesson · ${session.duration} minutes`,
    "Reply to the confirmation email to reschedule.",
    manageUrl ? `Manage the Cal.com booking: ${manageUrl}` : "",
  ].filter(Boolean).join("\n");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
  });
  const detailsParam = new URLSearchParams({ details }).toString();
  const dates = `${googleCalendarDate(start)}/${googleCalendarDate(end)}`;
  return `https://calendar.google.com/calendar/render?${params.toString()}&dates=${dates}&${detailsParam}`;
}

function sessionFeeLabel(session: BookingSession): string {
  return session.cost === null || String(session.cost).trim() === "" ? "—" : `AU $${session.cost}`;
}

function renderStudentSessionCard(
  session: BookingSession,
  payment: PaymentResult,
  index: number,
  total: number,
): string {
  const manageUrl = calcomManageUrl(session.calcomBookingUid);
  const calendarUrl = googleCalendarUrl(session);
  const title = session.sessionName || (session.isPiano ? "Piano lesson" : "Voice lesson");
  const disciplineLabel = session.isPiano ? "Piano" : "Voice";
  const paymentSection = payment.paymentUrl ? `
    <div style="background-color: #FFF1F2; border-radius: 18px; padding: 18px; margin: 20px 0 0; border: 1px solid #FECDD3; text-align: center;">
      <div style="font-size: 10px; font-weight: 800; color: #BE123C; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px;">Secure payment (${escapeHtml(sessionFeeLabel(session))})</div>
      <p style="margin: 0 0 16px 0; font-size: 14px; color: #475569; line-height: 1.6;">Complete your payment to confirm this session time.</p>
      <a href="${escapeHtml(payment.paymentUrl)}" style="display: inline-block; background-color: #E11D48; color: #ffffff; padding: 14px 32px; border-radius: 100px; text-decoration: none; font-weight: 700; font-size: 14px;">Pay now</a>
    </div>
  ` : session.feeWasSet ? `
    <div style="background-color: #FEF3C7; border-radius: 16px; padding: 14px 18px; margin: 20px 0 0; border: 1px solid #FDE68A; font-size: 13px; color: #92400E; text-align: center;">
      The payment link for this session is unavailable. Please reply to this email to arrange payment.
    </div>
  ` : "";

  return `
    <div style="background-color: #F8FAFC; border-radius: 24px; padding: 28px; margin: 28px 0; border: 1px solid #E2E8F0;">
      ${total > 1 ? `<div style="font-size: 10px; font-weight: 800; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px;">Session ${index + 1} of ${total}</div>` : ""}
      <div style="font-size: 20px; font-weight: 700; color: #1E293B;">${escapeHtml(title)}</div>
      <div style="font-size: 13px; color: #64748B; margin-top: 4px;">${disciplineLabel}${session.duration ? ` · ${escapeHtml(session.duration)} minutes` : ""}</div>
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 20px;">
        <tr>
          <td style="padding-bottom: 16px;">
            <div style="font-size: 10px; font-weight: 800; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px;">Date</div>
            <div style="font-size: 22px; font-weight: 700; color: #1E293B;">${escapeHtml(session.friendlyDate)}</div>
          </td>
        </tr>
        <tr>
          <td style="padding-top: 16px; border-top: 1px solid #E2E8F0;">
            <div style="font-size: 10px; font-weight: 800; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px;">Time</div>
            <div style="font-size: 22px; font-weight: 700; color: #1E293B;">${escapeHtml(session.friendlyTime)}</div>
          </td>
        </tr>
        <tr>
          <td style="padding-top: 16px; border-top: 1px solid #E2E8F0;">
            <div style="font-size: 10px; font-weight: 800; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px;">Fee</div>
            <div style="font-size: 16px; font-weight: 700; color: #1E293B;">${escapeHtml(sessionFeeLabel(session))}</div>
          </td>
        </tr>
      </table>
      ${manageUrl || calendarUrl ? `
        <div style="margin-top: 18px; font-size: 13px; line-height: 1.8;">
          ${calendarUrl ? `<a href="${escapeHtml(calendarUrl)}" style="color: #E11D48; font-weight: 700; text-decoration: underline;">Add to Google Calendar</a>` : ""}
          ${calendarUrl && manageUrl ? " · " : ""}
          ${manageUrl ? `<a href="${escapeHtml(manageUrl)}" style="color: #E11D48; font-weight: 700; text-decoration: underline;">Manage or reschedule in Cal.com</a>` : ""}
        </div>
      ` : ""}
      ${paymentSection}
    </div>
  `;
}

function renderOrganizerSessionCard(
  session: BookingSession,
  payment: PaymentResult,
  index: number,
  total: number,
): string {
  const manageUrl = calcomManageUrl(session.calcomBookingUid);
  const title = session.sessionName || (session.isPiano ? "Piano lesson" : "Voice lesson");
  const disciplineLabel = session.isPiano ? "Piano" : "Voice";
  const paymentSection = payment.paymentUrl ? `
    <div style="margin-top: 14px;">
      <a href="${escapeHtml(payment.paymentUrl)}" style="display: inline-block; background-color: #E11D48; color: #ffffff; padding: 10px 24px; border-radius: 100px; text-decoration: none; font-weight: 700; font-size: 13px;">Open payment link</a>
      <div style="font-size: 11px; color: #6B7280; margin-top: 10px; word-break: break-all;">${escapeHtml(payment.paymentUrl)}</div>
    </div>
  ` : session.feeWasSet ? `
    <div style="background-color: #FEF3C7; border-radius: 16px; padding: 14px 18px; margin-top: 14px; border: 1px solid #FDE68A; font-size: 13px; color: #92400E;">
      No payment link was generated for this session (a fee was set but the link was not created — check Stripe)${payment.stripeErrMsg ? ` · Reason: ${escapeHtml(payment.stripeErrMsg.slice(0, 240))}` : ""}.
    </div>
  ` : "";

  return `
    <div style="background-color: #F8FAFC; border-radius: 20px; padding: 22px 24px; margin: 0 0 16px; border: 1px solid #E2E8F0;">
      <div style="font-size: 10px; font-weight: 800; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px;">Session ${index + 1} of ${total} · ${disciplineLabel}</div>
      <div style="font-size: 18px; font-weight: 700; color: #1E293B;">${escapeHtml(title)}</div>
      <div style="font-size: 15px; font-weight: 700; color: #1E293B; margin-top: 12px;">${escapeHtml(session.friendlyDate)} · ${escapeHtml(session.friendlyTime)}${session.duration ? ` <span style="font-size: 13px; color: #94A3B8; font-weight: 500;">(${escapeHtml(session.duration)} min)</span>` : ""}</div>
      <div style="font-size: 14px; color: #475569; margin-top: 6px;">Fee: <strong>${escapeHtml(sessionFeeLabel(session))}</strong></div>
      ${manageUrl ? `<div style="font-size: 13px; margin-top: 12px;"><a href="${escapeHtml(manageUrl)}" style="color: #E11D48; font-weight: 700; text-decoration: underline;">Manage in Cal.com</a></div>` : ""}
      ${paymentSection}
    </div>
  `;
}

async function getGmailAccessToken(clientId: string, clientSecret: string, refreshToken: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`Gmail Auth Error: ${data.error_description || data.error}`);
  return data.access_token;
}

async function sendGmail(accessToken: string, from: string, to: string, subject: string, htmlBody: string) {
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const messageParts = [
    `From: ${from}`,
    `To: ${to}`,
    `Bcc: info@danielebuatti.com`,
    `Content-Type: text/html; charset=utf-8`,
    `MIME-Version: 1.0`,
    `Subject: ${utf8Subject}`,
    ``,
    htmlBody,
  ];
  const message = messageParts.join('\n');
  const encodedMessage = btoa(unescape(encodeURIComponent(message)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw: encodedMessage }),
    }
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Gmail send failed (${response.status}): ${data?.error?.message || data?.message || "unknown"}`);
  }
  return data;
}

// Best-effort audit log of every email send/failure so delivery is verifiable.
async function logEmail(supabase, rec) {
  try {
    await supabase.from("email_log").insert({
      function_name: rec.fn,
      recipient: rec.to,
      subject: rec.subject ?? null,
      status: rec.status,
      error_message: rec.error ?? null,
      created_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error(`[${rec.fn}] email_log insert failed:`, e?.message);
  }
}

serve(async (req) => {
  const functionName = "voice-send-onboarding";
  console.log(`[${functionName}] Request received`);

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authErr = await requireAuth(req, corsHeaders);
  if (authErr) return authErr;

  try {
    const NOTION_KEY = Deno.env.get("NOTION_API_KEY");
    const STRIPE_KEY = Deno.env.get('STRIPE_SECRET_KEY_VOICE');
    if (!STRIPE_KEY) throw new Error("Missing STRIPE_SECRET_KEY_VOICE");
    const GMAIL_CLIENT_ID = Deno.env.get("GMAIL_CLIENT_ID");
    const GMAIL_CLIENT_SECRET = Deno.env.get("GMAIL_CLIENT_SECRET");
    const GMAIL_REFRESH_TOKEN = Deno.env.get("GMAIL_REFRESH_TOKEN");
    const SENDER_EMAIL = Deno.env.get("GMAIL_USER_EMAIL");
    // Public-facing site URL for client-facing links (Stripe success/cancel, onboarding).
    // Must NOT depend on the caller's origin — when the practitioner books from localhost,
    // the client's email/redirect would otherwise point at localhost. Set the SITE_URL
    // secret to your production domain.
    const APP_ORIGIN = Deno.env.get('SITE_URL') || 'https://kinesiology-app.vercel.app';

    if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN || !SENDER_EMAIL) {
      throw new Error("Missing Gmail credentials in Supabase Secrets.");
    }
    // Client-facing sends use the practice's real, verified alias — GMAIL_USER_EMAIL
    // still authenticates the API call for everything sent from this function,
    // including the internal organizer notification below.
    const FROM_ADDRESS = "Daniele Buatti <info@danielebuatti.com>";

    const body = await req.json();
    const sessionInputs = body?.sessions === undefined ? [body] : body.sessions;
    if (!Array.isArray(sessionInputs) || sessionInputs.length === 0) {
      throw new Error("Provide either a single booking or a non-empty sessions array.");
    }
    if (sessionInputs.length > 100) {
      throw new Error("Too many sessions in one email (maximum 100).");
    }
    const sessions = sessionInputs.map(normalizeSession);
    const firstSession = sessions[0];
    const studentName = firstSession.studentName;
    const studentEmail = firstSession.studentEmail;
    const canonicalEmail = studentEmail.toLowerCase();
    if (sessions.some((session) => session.studentEmail.toLowerCase() !== canonicalEmail)) {
      throw new Error("All sessions must belong to the same student email.");
    }

    const hasMultiple = sessions.length > 1;
    const disciplines = new Set(sessions.map((session) => session.isPiano ? "piano" : "voice"));
    const isPiano = disciplines.size === 1 && firstSession.isPiano;
    const isMixed = disciplines.size > 1;
    const studioName = isMixed ? "Voice & Piano Studio" : isPiano ? "Piano Studio" : "Voice Studio";
    const coachTitle = isMixed ? "Voice & Piano Coach" : isPiano ? "Piano Coach" : "Voice Coach";
    const emoji = isMixed ? "🎼" : isPiano ? "🎹" : "🎵";
    const subjectLine = isPiano || isMixed
      ? `Welcome to ${studioName}! ${emoji} — Your ${hasMultiple ? `${sessions.length} Lesson Bookings` : "Lesson Booking"}`
      : `Welcome to Voice Studio! 🎵 — Your ${hasMultiple ? `${sessions.length} Lesson Bookings` : "Lesson Booking"}`;

    const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));

    // 1. Create one Notion record if not already there (deduplicate by email).
    if (NOTION_KEY) {
      try {
        const notionHeaders = {
          Authorization: `Bearer ${NOTION_KEY}`,
          "Content-Type": "application/json",
          "Notion-Version": "2022-06-28",
        };

        const queryRes = await fetch(
          `https://api.notion.com/v1/databases/${VOICE_CLIENTS_DB_ID}/query`,
          {
            method: "POST",
            headers: notionHeaders,
            body: JSON.stringify({
              filter: { property: "Email", email: { equals: studentEmail } },
              page_size: 1,
            }),
          }
        );

        let existingId = null;
        if (queryRes.ok) {
          const queryData = await queryRes.json();
          if (queryData.results?.length > 0) {
            existingId = queryData.results[0].id;
          }
        }

        if (existingId) {
          console.log(`[${functionName}] Client already exists in Notion: ${existingId}`);
        } else {
          console.log(`[${functionName}] Creating Notion page for ${studentName}...`);
          await fetch("https://api.notion.com/v1/pages", {
            method: "POST",
            headers: notionHeaders,
            body: JSON.stringify({
              parent: { database_id: VOICE_CLIENTS_DB_ID },
              properties: {
                Name: { title: [{ text: { content: studentName } }] },
                Email: { email: studentEmail },
              },
            }),
          });
        }
      } catch (notionErr) {
        console.error(`[${functionName}] Notion creation error (non-fatal):`, notionErr.message);
      }
    }

    // 2. Create one Stripe payment link per paid session. Each link carries that
    // occurrence's own Cal.com UID so the webhook marks the correct lesson paid.
    const stripe = new Stripe(STRIPE_KEY, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });
    const paymentResults: PaymentResult[] = await Promise.all(sessions.map(async (session) => {
      if (!session.hasFee) return { paymentUrl: null, stripeErrMsg: null };
      try {
        const metadata: Record<string, string> = {
          student_name: studentName,
          student_email: studentEmail,
          lesson_date: session.date,
        };
        const realUid = realCalcomUid(session.calcomBookingUid);
        if (realUid) metadata.calcom_booking_uid = realUid;
        const paymentUrl = await createPaymentLink(stripe, {
          amount: session.costNumber,
          name: session.productName,
          description: `${session.duration ? `${session.duration} min lesson` : "Lesson"} on ${session.friendlyDate} at ${session.friendlyTime}`,
          customerEmail: studentEmail,
          metadata,
          statementDescriptor: "VOICE COACHING",
        });
        return { paymentUrl, stripeErrMsg: null };
      } catch (stripeErr) {
        const msg = stripeErr?.message || String(stripeErr);
        console.error(`[${functionName}] Stripe error (non-fatal):`, msg);
        try {
          await supabase.from('webhook_failures').insert({
            source: functionName,
            event_type: 'payment_link_create',
            reference: studentEmail,
            detail: `Stripe Checkout create failed for ${session.calcomBookingUid || studentEmail} (${session.date}): ${msg}`,
          });
        } catch (_e) { /* non-fatal */ }
        return { paymentUrl: null, stripeErrMsg: msg };
      }
    }));

    // 3. Ensure one voice_onboarding record exists without resetting a profile
    // the student has already completed (the DB default handles new rows).
    try {
      await supabase.from('voice_onboarding').upsert({
        email: studentEmail,
        name: studentName,
      }, { onConflict: 'email' });
    } catch (dbErr) {
      console.error(`[${functionName}] DB error (non-fatal):`, dbErr.message);
    }

    // 4. Send one welcome/confirmation email containing every session card,
    // each unpaid session's payment button, and one student-profile link.
    const accessToken = await getGmailAccessToken(GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN);
    const onboardingUrl = `${APP_ORIGIN}/voice-onboarding/${encodeURIComponent(studentEmail)}`;
    const studentSessionCards = sessions.map((session, index) =>
      renderStudentSessionCard(session, paymentResults[index], index, sessions.length)
    ).join("");
    const thanksLine = hasMultiple
      ? `Thanks for booking! Here are your ${sessions.length} session details:`
      : `Thanks for booking ${firstSession.sessionName ? firstSession.productName : `a ${firstSession.isPiano ? "piano" : "voice"} lesson`}! Here are your session details:`;

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 0; font-family: sans-serif;">
        <center style="width: 100%; padding: 40px 0;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 40px; overflow: hidden;">
            <tr><td style="height: 6px; background-color: #E11D48;"></td></tr>
            <tr>
              <td style="padding: 56px 40px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 16px;">${emoji}</div>
                <div style="color: #1E293B; font-size: 28px; font-weight: 700;">Welcome to ${studioName}</div>
                <div style="color: #E11D48; font-size: 11px; font-weight: 900; letter-spacing: 0.4em; margin-top: 12px; text-transform: uppercase;">${hasMultiple ? `${sessions.length} Lessons Confirmed` : "Lesson Confirmed"}</div>

                <div style="text-align: left; margin-top: 40px; line-height: 1.8; font-size: 16px; color: #475569;">
                  <p>Hi ${escapeHtml(studentName.split(/\s+/)[0])},</p>
                  <p>${escapeHtml(thanksLine)}</p>

                  ${studentSessionCards}

                  <p style="font-size: 14px; color: #475569; line-height: 1.6;"><strong>Need to reschedule?</strong> Reply to this email and I'll arrange a new time with you.</p>

                  <div style="text-align: center; padding: 12px 0 28px;">
                    <a href="${escapeHtml(onboardingUrl)}" style="display: inline-block; background-color: #E11D48; color: #ffffff; padding: 16px 40px; border-radius: 100px; text-decoration: none; font-weight: 700; font-size: 15px;">Complete Student Profile</a>
                  </div>
                  <p style="font-size: 13px; color: #94A3B8; text-align: center;">Tell me about your goals, experience level, and what you'd like to focus on.</p>

                  <p>I'm looking forward to working with you!</p>
                </div>

                <div style="border-top: 1px solid #F1F5F9; margin-top: 40px; padding-top: 32px; text-align: left;">
                  <div style="font-weight: 700; color: #1E293B; font-size: 18px;">Daniele Buatti</div>
                  <div style="color: #E11D48; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;">${coachTitle}</div>
                </div>
              </td>
            </tr>
          </table>
        </center>
      </body>
      </html>
    `;

    // 4a. Send the student onboarding email. Non-fatal — a failure here must not
    // block the organizer notification below.
    try {
      await sendGmail(accessToken, FROM_ADDRESS, studentEmail, subjectLine, htmlBody);
      console.log(`[${functionName}] Onboarding email sent to ${studentEmail}`);
      await logEmail(supabase, { fn: functionName, to: studentEmail, subject: subjectLine, status: "sent" });
    } catch (studentErr) {
      console.error(`[${functionName}] Student onboarding send failed (non-fatal):`, studentErr?.message || studentErr);
      await logEmail(supabase, { fn: functionName, to: studentEmail, subject: subjectLine, status: "failed", error: studentErr?.message || String(studentErr) });
    }

    // 4b. Send one dedicated organizer notification summarizing every session.
    // It is addressed TO the studio inbox (not only BCC'd) so it can't be lost.
    const organizerEmail = "info@danielebuatti.com";
    const organizerSubject = hasMultiple
      ? `New ${studioName} bookings — ${studentName} · ${sessions.length} sessions from ${firstSession.date}`
      : `New ${studioName} booking — ${studentName} · ${firstSession.date} ${firstSession.time}`;
    try {
      const organizerSessionCards = sessions.map((session, index) =>
        renderOrganizerSessionCard(session, paymentResults[index], index, sessions.length)
      ).join("");
      const organizerHtml = `
        <!DOCTYPE html>
        <html>
        <body style="margin: 0; padding: 0; background-color: #FDFCFB; font-family: sans-serif;">
          <center style="width: 100%; background-color: #FDFCFB; padding: 40px 0;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 40px; overflow: hidden; border: 1px solid #F1E9EF;">
              <tr><td style="height: 6px; background-color: #E11D48;"></td></tr>
              <tr>
                <td style="padding: 48px 40px;">
                  <div style="text-align: center; margin-bottom: 8px;">
                    <div style="font-size: 32px; margin-bottom: 8px;">${emoji}</div>
                    <div style="font-size: 11px; font-weight: 900; letter-spacing: 0.4em; text-transform: uppercase; color: #E11D48;">${hasMultiple ? "New Bookings" : "New Booking"}</div>
                    <div style="color: #1E293B; font-size: 24px; font-weight: 700; margin-top: 6px;">${studioName}</div>
                  </div>

                  <div style="background-color: #FFF1F2; border-radius: 24px; padding: 24px 28px; margin: 28px 0 20px; border: 1px solid #FECDD3;">
                    <div style="font-size: 10px; font-weight: 800; color: #BE123C; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 6px;">Student</div>
                    <div style="font-size: 20px; font-weight: 700; color: #1E293B;">${escapeHtml(studentName)}</div>
                    <div style="font-size: 14px; color: #475569; margin-top: 2px;">${escapeHtml(studentEmail)}</div>
                  </div>

                  <div style="font-size: 10px; font-weight: 800; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.12em; margin: 0 0 12px;">${hasMultiple ? `${sessions.length} Sessions` : "Session Details"}</div>
                  ${organizerSessionCards}

                  <p style="font-size: 13px; color: #94A3B8; margin: 24px 0 0; text-align: center;">A separate "Welcome to ${studioName}" email with ${hasMultiple ? `all ${sessions.length} session details` : "these details"} was sent to the student.</p>
                </td>
              </tr>
            </table>
          </center>
        </body>
        </html>
      `;
      await sendGmail(accessToken, FROM_ADDRESS, organizerEmail, organizerSubject, organizerHtml);
      console.log(`[${functionName}] Organizer notification sent to ${organizerEmail}`);
      await logEmail(supabase, { fn: functionName, to: organizerEmail, subject: organizerSubject, status: "sent" });
    } catch (orgErr) {
      console.error(`[${functionName}] Organizer notification failed (non-fatal):`, orgErr?.message || orgErr);
      await logEmail(supabase, { fn: functionName, to: organizerEmail, subject: organizerSubject, status: "failed", error: orgErr?.message || String(orgErr) });
    }

    const paymentUrls = paymentResults.map((result) => result.paymentUrl).filter(Boolean);
    return new Response(JSON.stringify({
      success: true,
      // Keep the original single-booking response field for existing callers.
      paymentUrl: paymentUrls[0] || null,
      paymentUrls,
      sessionCount: sessions.length,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`[${functionName}] Error:`, error?.message || error);
    return new Response(JSON.stringify({ error: error?.message || String(error) }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
