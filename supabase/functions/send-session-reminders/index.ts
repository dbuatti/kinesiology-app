import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[send-session-reminders] Authenticated user: ${user.id}`);

    // Get appointments for the next 7 days that haven't had reminders sent
    const today = new Date().toISOString().split("T")[0];
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split("T")[0];

    console.log(`[send-session-reminders] Fetching appointments from ${today} to ${nextWeekStr}`);

    const { data: appointments, error: dbError } = await supabase
      .from("appointments")
      .select(`
        id,
        date,
        client_id,
        status,
        tag,
        time,
        price_amount,
        reminder_sent,
        clients (
          id,
          name,
          email,
          first_name,
          last_name
        )
      `)
      .gte("date", today)
      .lte("date", nextWeekStr)
      .eq("reminder_sent", false)
      .eq("status", "Scheduled")
      .order("date", { ascending: true });

    if (dbError) {
      console.error("[send-session-reminders] Database error:", dbError);
      return new Response(JSON.stringify({ error: dbError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!appointments || appointments.length === 0) {
      console.log("[send-session-reminders] No pending reminders found");
      return new Response(
        JSON.stringify({
          message: "No pending reminders",
          result: { success: 0, failed: 0, errors: [] },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`[send-session-reminders] Found ${appointments.length} appointments needing reminders`);

    // Get Google access token
    const accessToken = await getGoogleAccessToken();

    // Group appointments by client email to batch emails
    const clientEmails = new Map<string, Appointment[]>();
    appointments.forEach((appt) => {
      const email = appt.clients?.email;
      if (email) {
        const existing = clientEmails.get(email) || [];
        existing.push(appt);
        clientEmails.set(email, existing);
      }
    });

    console.log(`[send-session-reminders] Processing ${clientEmails.size} unique clients`);

    const result: ReminderResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    // Process each client's appointments
    for (const [email, clientAppointments] of clientEmails) {
      if (!email) {
        result.failed += clientAppointments.length;
        clientAppointments.forEach((appt) => {
          result.errors.push({
            client: appt.clients?.name || "Unknown",
            error: "No email address on file",
          });
        });
        continue;
      }

      try {
        // Build email with all appointments for this client
        const appointmentDetails = clientAppointments
          .map((appt) => {
            const apptDate = new Date(appt.date);
            const formattedDate = apptDate.toLocaleDateString("en-AU", {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
            });
            const timeStr = appt.time
              ? new Date(`1970-01-01T${appt.time}`).toLocaleTimeString("en-AU", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })
              : "TBA";
            return `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">${formattedDate}</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">${timeStr}</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">${appt.tag || "Session"}</td>
              </tr>
            `;
          })
          .join("");

        const subject = `Reminder: ${clientAppointments.length} Upcoming Session${clientAppointments.length > 1 ? "s" : ""}`;
        const html = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">Session Reminder</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Upcoming appointments</p>
            </div>
            <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
              <p style="color: #334155; font-size: 16px; margin: 0 0 20px 0;">Dear ${clientAppointments[0].clients?.first_name || clientAppointments[0].clients?.name?.split(" ")[0] || "Client"},</p>
              <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
                Here are your upcoming session${clientAppointments.length > 1 ? "s" : ""}:
              </p>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <thead>
                  <tr style="background: #e2e8f0;">
                    <th style="padding: 10px; text-align: left; font-size: 13px; color: #475569; border-bottom: 2px solid #cbd5e1;">Date</th>
                    <th style="padding: 10px; text-align: left; font-size: 13px; color: #475569; border-bottom: 2px solid #cbd5e1;">Time</th>
                    <th style="padding: 10px; text-align: left; font-size: 13px; color: #475569; border-bottom: 2px solid #cbd5e1;">Type</th>
                  </tr>
                </thead>
                <tbody>
                  ${appointmentDetails}
                </tbody>
              </table>
              <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
                If you need to reschedule or have any questions, please don't hesitate to reach out.
              </p>
              <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center;">
                <p style="color: #94a3b8; font-size: 12px; margin: 0;">This is an automated reminder. Please don't reply to this email.</p>
              </div>
            </div>
          </div>
        `;

        await sendEmail(accessToken, email, subject, html);

        // Update reminder_sent status for all appointments for this client
        const appointmentIds = clientAppointments.map((a) => a.id);
        const { error: updateError } = await supabase
          .from("appointments")
          .update({
            reminder_sent: true,
            reminder_sent_at: new Date().toISOString(),
          })
          .in("id", appointmentIds);

        if (updateError) {
          console.error(`[send-session-reminders] Error updating appointments for ${email}:`, updateError);
          result.failed += clientAppointments.length;
          result.errors.push({
            client: clientAppointments[0].clients?.name || "Unknown",
            error: updateError.message,
          });
        } else {
          result.success += clientAppointments.length;
          console.log(`[send-session-reminders] Successfully sent reminders to ${email} (${clientAppointments.length} appointments)`);
        }
      } catch (err: any) {
        console.error(`[send-session-reminders] Error sending email to ${email}:`, err);
        result.failed += clientAppointments.length;
        result.errors.push({
          client: clientAppointments[0].clients?.name || "Unknown",
          error: err.message || "Unknown error",
        });

        // Update error status for failed appointments
        const appointmentIds = clientAppointments.map((a) => a.id);
        await supabase
          .from("appointments")
          .update({
            reminder_error: err.message || "Unknown error",
          })
          .in("id", appointmentIds);
      }
    }

    // Log the email activity
    await supabase.from("email_log").insert({
      user_id: user.id,
      recipient_email: Array.from(clientEmails.keys()).join(", "),
      subject: `Session reminders (${result.success} sent, ${result.failed} failed)`,
      status: result.failed === 0 ? "sent" : "partial",
      email_type: "session_reminder",
    });

    console.log(`[send-session-reminders] Completed: ${result.success} success, ${result.failed} failed`);

    return new Response(
      JSON.stringify({
        message: "Reminders processed",
        result,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
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