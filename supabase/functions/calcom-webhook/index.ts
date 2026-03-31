// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
}

// Helper to get Gmail Access Token using Refresh Token
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
  return data.access_token;
}

// Helper to send email via Gmail API
async function sendGmail(accessToken: string, from: string, to: string, subject: string, htmlBody: string) {
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const messageParts = [
    `From: ${from}`,
    `To: ${to}`,
    `Content-Type: text/html; charset=utf-8`,
    `MIME-Version: 1.0`,
    `Subject: ${utf8Subject}`,
    ``,
    htmlBody,
  ];
  const message = messageParts.join('\n');

  // Base64url encode the message
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
  return response.json();
}

serve(async (req) => {
  if (req.method === 'GET') {
    return new Response(JSON.stringify({ status: "active", provider: "gmail", version: "v36" }), { 
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  console.log("--- [v36] CAL.COM WEBHOOK + GMAIL SYNC START ---");

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const NOTION_KEY = Deno.env.get('NOTION_API_KEY');
    const GMAIL_CLIENT_ID = Deno.env.get('GMAIL_CLIENT_ID');
    const GMAIL_CLIENT_SECRET = Deno.env.get('GMAIL_CLIENT_SECRET');
    const GMAIL_REFRESH_TOKEN = Deno.env.get('GMAIL_REFRESH_TOKEN');
    const SENDER_EMAIL = Deno.env.get('GMAIL_USER_EMAIL');
    
    const CLIENTS_DB_ID = "074e2c006bd541d88c502feb397ef31d";
    const APPTS_DB_ID = "171f7156cdc645e8b689af13d217bc7c";
    const PLANNER_DB_ID = "11caad21cd0980d8a3eeeffb27fc43c0";
    const PRACTITIONER_ID = "6f2caa85-bfce-4264-97cd-c0d2f62b24f0";

    const body = await req.json();
    const triggerEvent = body.triggerEvent;
    const payload = body.payload || body;
    const calcomId = String(payload.bookingId || payload.id || payload.uid);

    if (triggerEvent === 'BOOKING_CANCELLED' || triggerEvent === 'BOOKING_REJECTED') {
      const { data: appointment } = await supabase
        .from('appointments')
        .select('id, notion_page_id, notion_planner_id')
        .eq('calcom_booking_id', calcomId)
        .maybeSingle();

      if (appointment) {
        if (NOTION_KEY) {
          const notionHeaders = { 'Authorization': `Bearer ${NOTION_KEY}`, 'Content-Type': 'application/json', 'Notion-Version': '2022-06-28' };
          if (appointment.notion_page_id) {
            await fetch(`https://api.notion.com/v1/pages/${appointment.notion_page_id}`, { method: 'PATCH', headers: notionHeaders, body: JSON.stringify({ archived: true }) });
          }
          if (appointment.notion_planner_id) {
            await fetch(`https://api.notion.com/v1/pages/${appointment.notion_planner_id}`, { method: 'PATCH', headers: notionHeaders, body: JSON.stringify({ archived: true }) });
          }
        }
        await supabase.from('appointments').delete().eq('id', appointment.id);
      }
      return new Response(JSON.stringify({ success: true, action: 'deleted' }), { status: 200, headers: corsHeaders });
    }

    // 1. Extract Data
    const attendee = payload.attendees[0];
    const name = String(attendee.name || "Unknown Client").trim();
    const email = String(attendee.email || "").toLowerCase().trim();
    const phone = attendee.phoneNumber || "";
    const startTime = payload.startTime;
    const notes = payload.description || "";

    // 2. Supabase CRM Sync (Create client first to get ID for onboarding link)
    let { data: dbClient } = await supabase.from('clients').select('id').eq('email', email).maybeSingle();
    if (!dbClient && email) {
      const { data: newDbC } = await supabase.from('clients').insert({ user_id: PRACTITIONER_ID, name, email, phone }).select().single();
      dbClient = newDbC;
    }

    // 3. Send Gmail Onboarding Email
    if (GMAIL_CLIENT_ID && GMAIL_CLIENT_SECRET && GMAIL_REFRESH_TOKEN && dbClient) {
      console.log(`Sending Gmail Onboarding to ${email}...`);
      try {
        const accessToken = await getGmailAccessToken(GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN);
        const onboardingUrl = `https://kinesiology-app.vercel.app/onboarding/${dbClient.id}`;
        
        const htmlBody = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
              .wrapper { width: 100%; background-color: #f8fafc; padding: 40px 0; }
              .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
              .header { background-color: #4f46e5; padding: 40px; text-align: center; color: #ffffff; }
              .logo { font-size: 24px; font-weight: 900; letter-spacing: -0.05em; text-transform: uppercase; }
              .logo-icon { background-color: rgba(255,255,255,0.2); padding: 8px 12px; border-radius: 12px; margin-right: 8px; }
              .content { padding: 40px; line-height: 1.6; color: #334155; }
              .button { display: inline-block; background-color: #4f46e5; color: #ffffff !important; padding: 16px 32px; border-radius: 14px; text-decoration: none; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; margin: 20px 0; }
              .footer { padding: 40px; text-align: center; color: #94a3b8; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="wrapper">
              <div class="container">
                <div class="header">
                  <div class="logo"><span class="logo-icon">A</span> Antigravity</div>
                  <div style="font-size: 10px; font-weight: bold; letter-spacing: 0.2em; margin-top: 10px; text-transform: uppercase; opacity: 0.8;">Functional Neuro Health</div>
                </div>
                <div class="content">
                  <h2 style="color: #0f172a; margin-top: 0;">Action Required: Your Onboarding Form</h2>
                  <p>Hi ${name.split(' ')[0]},</p>
                  <p>Thanks for booking your session! To help me prepare and get the most out of our time together, please complete your clinical onboarding form before we meet.</p>
                  <div style="text-align: center;">
                    <a href="${onboardingUrl}" class="button">Complete My Onboarding Form</a>
                  </div>
                  <p style="font-size: 13px; color: #64748b; margin-top: 30px;">
                    If the button doesn't work, copy and paste this link into your browser:<br/>
                    <a href="${onboardingUrl}" style="color: #4f46e5;">${onboardingUrl}</a>
                  </p>
                </div>
                <div style="padding: 0 40px 40px 40px;">
                  <div style="border-top: 1px solid #f1f5f9; padding-top: 20px;">
                    <div style="font-weight: 800; color: #0f172a; font-size: 14px;">Daniele Buatti</div>
                    <div style="color: #94a3b8; font-size: 12px; font-weight: 600;">Integrated Healer & Practitioner</div>
                  </div>
                </div>
              </div>
              <div class="footer">
                <p>"The deeper you work, the higher you rise."</p>
                <p>© ${new Date().getFullYear()} Antigravity Kinesiology</p>
              </div>
            </div>
          </body>
          </html>
        `;

        await sendGmail(accessToken, SENDER_EMAIL, email, "Action Required: Your Onboarding Form", htmlBody);
        console.log("Gmail sent successfully.");
      } catch (e) {
        console.error("Failed to send Gmail:", e.message);
      }
    }

    // 4. Notion Sync (Clients)
    let notionClientId = null;
    if (NOTION_KEY) {
      const searchRes = await fetch(`https://api.notion.com/v1/databases/${CLIENTS_DB_ID}/query`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${NOTION_KEY}`, "Content-Type": "application/json", "Notion-Version": "2022-06-28" },
        body: JSON.stringify({ filter: { property: "Name", title: { equals: name } } })
      });
      const searchData = await searchRes.json();
      if (searchData.results?.length > 0) {
        notionClientId = searchData.results[0].id;
      } else {
        const createC = await fetch("https://api.notion.com/v1/pages", {
          method: "POST",
          headers: { "Authorization": `Bearer ${NOTION_KEY}`, "Content-Type": "application/json", "Notion-Version": "2022-06-28" },
          body: JSON.stringify({
            parent: { database_id: CLIENTS_DB_ID },
            properties: { "Name": { title: [{ text: { content: name } }] }, "Email": email ? { email: email } : undefined, "Phone": phone ? { phone_number: phone } : undefined }
          })
        });
        const newC = await createC.json();
        notionClientId = newC.id;
      }
    }

    // 5. Notion Sync (Appointments & Planner)
    let notionPageId = null;
    if (NOTION_KEY) {
      const apptProps = { "Name": { title: [{ text: { content: `${name} - ${payload.title || 'Session'}` } }] }, "Date": { date: { start: startTime } }, "Notes": { rich_text: [{ text: { content: notes } }] } };
      if (notionClientId) apptProps["Client"] = { relation: [{ id: notionClientId }] };
      const apptRes = await fetch("https://api.notion.com/v1/pages", { method: "POST", headers: { "Authorization": `Bearer ${NOTION_KEY}`, "Content-Type": "application/json", "Notion-Version": "2022-06-28" }, body: JSON.stringify({ parent: { database_id: APPTS_DB_ID }, properties: apptProps }) });
      const apptData = await apptRes.json();
      notionPageId = apptData.id;
    }

    let notionPlannerId = null;
    if (NOTION_KEY) {
      const amountPaid = payload.payment?.[0]?.amount ? payload.payment[0].amount / 100 : 0;
      const plannerProps = { "Title": { title: [{ text: { content: `${name} - ${payload.title || 'Session'}` } }] }, "Date": { date: { start: startTime } }, "Dollars": { number: amountPaid }, "Project": { select: { name: "Kinesiology" } } };
      if (notionClientId) plannerProps["Client (Kin)"] = { relation: [{ id: notionClientId }] };
      const plannerRes = await fetch("https://api.notion.com/v1/pages", { method: "POST", headers: { "Authorization": `Bearer ${NOTION_KEY}`, "Content-Type": "application/json", "Notion-Version": "2022-06-28" }, body: JSON.stringify({ parent: { database_id: PLANNER_DB_ID }, properties: plannerProps }) });
      const plannerData = await plannerRes.json();
      notionPlannerId = plannerData.id;
    }

    // 6. Final Supabase Appointment Sync
    if (dbClient) {
      await supabase.from('appointments').insert({
        user_id: PRACTITIONER_ID,
        client_id: dbClient.id,
        date: startTime,
        tag: "Kinesiology",
        status: "Scheduled",
        calcom_booking_id: calcomId,
        notion_page_id: notionPageId,
        notion_planner_id: notionPlannerId
      });
    }

    return new Response(JSON.stringify({ success: true, action: 'created' }), { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("Critical Webhook Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
  }
})