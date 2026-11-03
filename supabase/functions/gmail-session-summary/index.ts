// @ts-nocheck
// Creates a Gmail DRAFT or SENDS a client-facing session summary email.
// Recipient is resolved server-side from the appointment's client record —
// never from the request body — so a client email can never be swapped in.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requirePractitioner } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
  "Access-Control-Methods": "POST, OPTIONS",
};

async function gmailAccessToken() {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: Deno.env.get("GMAIL_CLIENT_ID") || "",
      client_secret: Deno.env.get("GMAIL_CLIENT_SECRET") || "",
      refresh_token: Deno.env.get("GMAIL_REFRESH_TOKEN") || "",
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Gmail Auth Error: ${data.error_description || data.error}`);
  return data.access_token as string;
}

function buildRaw({ from, to, subject, html }: { from: string; to: string; subject: string; html: string }) {
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const mime = [
    `From: ${from}`,
    `To: ${to}`,
    `Bcc: info@danielebuatti.com`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=utf-8",
    `Subject: ${utf8Subject}`,
    "",
    html,
  ].join("\r\n");
  // base64url
  return btoa(unescape(encodeURIComponent(mime)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const authErr = await requirePractitioner(req, corsHeaders);
  if (authErr) return authErr;

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    const { appointmentId, subject, body, mode, action } = await req.json();
    if (!appointmentId || !body) throw new Error("Missing appointmentId or body.");
    const m = mode === "send" ? "send" : "draft";
    const isPreview = action === "preview";

    // Resolve recipient server-side.
    const { data: appt, error: apptErr } = await supabase
      .from("appointments")
      .select("id, date, clients ( name, email )")
      .eq("id", appointmentId)
      .single();
    if (apptErr || !appt) throw new Error("Appointment not found.");

    const client = (appt as any).clients || {};
    const to = client.email;
    if (!to) throw new Error("No client email on file for this appointment.");

    const CLIENT_ID = Deno.env.get("GMAIL_CLIENT_ID");
    const CLIENT_SECRET = Deno.env.get("GMAIL_CLIENT_SECRET");
    const REFRESH = Deno.env.get("GMAIL_REFRESH_TOKEN");
    const SENDER = Deno.env.get("GMAIL_USER_EMAIL");
    if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH || !SENDER) throw new Error("Gmail is not configured.");

    const token = await gmailAccessToken();
    const firstName = String(client.name || "").trim().split(/\s+/)[0];
    const subj = subject || `Your session summary — ${formatDate(appt.date)}`;
    const esc = (s: string) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const htmlBody = esc(body).split(/\n+/).map((p: string) => `<p style="margin:0 0 14px;">${p}</p>`).join("");
    const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:#FDFCFB;font-family:sans-serif;">
  <center style="width:100%;background-color:#FDFCFB;padding:40px 0;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #F1E9EF;">
      <tr><td style="height:6px;background-color:#D46A9B;"></td></tr>
      <tr><td style="padding:40px 40px 24px;">
        <div style="color:#1E3261;font-size:20px;font-weight:700;text-align:center;">✦ Resonance Kinesiology</div>
        <div style="margin-top:28px;line-height:1.8;font-size:16px;color:#334155;white-space:pre-wrap;">${htmlBody}</div>
      </td></tr>
      <tr><td style="padding:16px 40px;background-color:#FAF7F5;border-top:1px solid #F1E9EF;text-align:center;font-size:12px;color:#94A3B8;">
        Resonance Kinesiology — Daniele Buatti<br/>
        <a href="mailto:info@danielebuatti.com" style="color:#D46A9B;text-decoration:none;">info@danielebuatti.com</a>
      </td></tr>
    </table>
  </center>
</body>
</html>`;

    const raw = buildRaw({ from: `Daniele Buatti <${SENDER}>`, to, subject: subj, html });

    if (isPreview) {
      return new Response(JSON.stringify({
        success: true,
        mode: "preview",
        from: `Daniele Buatti <${SENDER}>`,
        to,
        subject: subj,
        date: formatDate(appt.date),
        html,
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let result: any = {};
    if (m === "draft") {
      const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/drafts", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ message: { raw } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(`Gmail draft error: ${JSON.stringify(data)}`);
      result = { draftId: data.id, messageId: data.message?.id };
    } else {
      const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ raw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(`Gmail send error: ${JSON.stringify(data)}`);
      result = { messageId: data.id };
    }

    // Store final text + timestamp server-side.
    const now = new Date().toISOString();
    const update: Record<string, any> = { session_summary_email: body };
    if (m === "draft") update.session_summary_drafted_at = now;
    else update.session_summary_sent_at = now;
    await supabase.from("appointments").update(update).eq("id", appointmentId);

    return new Response(JSON.stringify({ success: true, mode: m, recipient: to, ...result }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    const msg = err.message || "Unknown error";
    const scopeError = /insufficientPermissions|ACCESS_TOKEN_SCOPE_INSUFFICIENT|insufficient authentication scopes/i.test(msg);
    console.error("[gmail-session-summary]", msg);
    return new Response(JSON.stringify({
      error: scopeError
        ? "Gmail drafts need the gmail.compose scope, which the current refresh token doesn't have. 'Send' still works. Re-authorize Gmail with the compose scope to enable drafts, or use 'Open in Gmail' to save a draft manually."
        : msg,
      scopeError,
    }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function formatDate(d: string | null | undefined): string {
  if (!d) return "";
  try { return new Date(d).toLocaleDateString("en-AU", { day: "numeric", month: "long" }); } catch { return String(d); }
}
