// src/utils/session-summary-email-html.ts
//
// The single rendering function for the client-facing session summary email.
// Used by BOTH the in-app preview (SessionSummaryEmailDialog) and asserted
// against the send/draft path. The edge function (gmail-session-summary)
// replicates this template server-side; keep them in sync — the preview must
// look exactly like what the client receives.

export interface SessionEmailRenderInput {
  from: string;
  to: string;
  subject: string;
  body: string;
  date: string; // formatted date string shown in the header
}

export function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function renderSessionSummaryEmailHtml(input: SessionEmailRenderInput): string {
  const { from, to, subject, body, date } = input;
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const htmlBody = escapeHtml(body).split(/\n+/).map((p) => `<p style="margin:0 0 14px;">${p}</p>`).join("");
  return `<!DOCTYPE html>
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
}

// Header line for the preview pane (Gmail-style).
export function buildEmailPreviewHeaders(input: SessionEmailRenderInput): { from: string; to: string; subject: string; date: string } {
  return { from: input.from, to: input.to, subject: input.subject, date: input.date };
}
