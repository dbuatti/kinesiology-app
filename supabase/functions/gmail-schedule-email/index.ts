// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { requireUser } from "../_shared/auth.ts"
import { fetchIcloudEvents } from "../_shared/icloud.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const TIMEZONE = "Australia/Melbourne"

async function getGmailAccessToken(clientId, clientSecret, refreshToken) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(`Gmail Auth Error: ${data.error_description || data.error}`)
  return data.access_token
}

async function sendGmail(accessToken, from, to, subject, htmlBody) {
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`
  const messageParts = [
    `From: ${from}`,
    `To: ${to}`,
    `Content-Type: text/html; charset=utf-8`,
    `MIME-Version: 1.0`,
    `Subject: ${utf8Subject}`,
    ``,
    htmlBody,
  ]
  const message = messageParts.join('\n')
  const encodedMessage = btoa(unescape(encodeURIComponent(message)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: encodedMessage }),
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(`Gmail send failed (${response.status}): ${data?.error?.message || data?.message || "unknown"}`)
  }
  return data
}

// Format a UTC instant as Melbourne time parts without Intl (simpler + reliable).
function melbourneParts(ms) {
  const d = new Date(ms)
  const dme = new Date(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}T00:00:00Z`)
  const dstStart = dstTransitionMM(d.getUTCFullYear(), "start")
  const dstEnd = dstTransitionMM(d.getUTCFullYear(), "end")
  const inDst = ms >= dstStart && ms < dstEnd
  const offsetMin = (inDst ? 11 : 10) * 60
  const local = new Date(ms + offsetMin * 60000)
  return {
    year: local.getUTCFullYear(),
    month: local.getUTCMonth(),
    day: local.getUTCDate(),
    hour: local.getUTCHours(),
    minute: local.getUTCMinutes(),
    dateKey: `${local.getUTCFullYear()}-${String(local.getUTCMonth() + 1).padStart(2, "0")}-${String(local.getUTCDate()).padStart(2, "0")}`,
  }
}

// Melbourne DST transitions (UTC ms) as used for the current-year window.
function dstTransitionMM(year, kind) {
  // DST starts first Sunday Oct 02:00 local (=01:00 UTC +10): boundary for +11
  // DST ends first Sunday Apr 03:00 local (=02:00 UTC +11): boundary for +10
  const firstOct = new Date(Date.UTC(year, 9, 1))
  const startSun = firstOct.getUTCDay() === 0 ? 1 : 1 + (7 - firstOct.getUTCDay())
  const firstApr = new Date(Date.UTC(year, 3, 1))
  const endSun = firstApr.getUTCDay() === 0 ? 1 : 1 + (7 - firstApr.getUTCDay())
  if (kind === "start") return Date.UTC(year, 9, startSun, 1, 0, 0)
  return Date.UTC(year, 3, endSun, 2, 0, 0)
}

function fmtTime12(hour, minute) {
  const h12 = ((hour + 11) % 12) + 1
  const ampm = hour >= 12 ? "pm" : "am"
  return `${h12}:${String(minute).padStart(2, "0")} ${ampm}`
}

function esc(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const authErr = await requireUser(req, corsHeaders)
  if (authErr) return authErr

  try {
    const body = await req.json().catch(() => ({}))
    const days = Math.min(Math.max(parseInt(body?.days, 10) || 14, 1), 60)

    const GMAIL_CLIENT_ID = Deno.env.get('GMAIL_CLIENT_ID')
    const GMAIL_CLIENT_SECRET = Deno.env.get('GMAIL_CLIENT_SECRET')
    const GMAIL_REFRESH_TOKEN = Deno.env.get('GMAIL_REFRESH_TOKEN')
    const SENDER_EMAIL = Deno.env.get('GMAIL_USER_EMAIL')
    const RECIPIENT = body?.to || SENDER_EMAIL || 'daniele.buatti@gmail.com'

    if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN) {
      throw new Error("Missing Gmail OAuth secrets.")
    }

    // Window: from start of today (Melbourne) for N days.
    const nowUtc = Date.now()
    const today = melbourneParts(nowUtc)
    const startMs = Date.UTC(today.year, today.month, today.day) - (10 * 60 * 60 * 1000) // earlier than needed
    const endMs = startMs + days * 24 * 60 * 60 * 1000

    const { events, parseCount } = await fetchIcloudEvents(startMs, endMs)

    // Group by Melbourne date key.
    const byDay = new Map()
    for (const ev of events) {
      let key = melbourneParts(ev.startMs).dateKey
      // All-day events: key is the event's own calendar day (start is yyyy-MM-dd).
      if (ev.isDateOnly) key = ev.start.slice(0, 10)
      if (!byDay.has(key)) byDay.set(key, [])
      byDay.get(key).push(ev)
    }

    // Build ordered day list for the window (Melbourne calendar dates).
    const dayKeys = []
    for (let i = 0; i < days; i++) {
      const p = melbourneParts(startMs + i * 24 * 60 * 60 * 1000)
      dayKeys.push(`${p.year}-${String(p.month + 1).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`)
    }

    const rows = []
    let totalEvents = 0
    for (const key of dayKeys) {
      const dayEvents = (byDay.get(key) || []).sort((a, b) => {
        if (a.allDay !== b.allDay) return a.allDay ? -1 : 1
        return a.startMs - b.startMs
      })
      const [y, mo, d] = key.split("-").map(Number)
      const weekday = new Date(Date.UTC(y, mo - 1, d)).getUTCDay()
      const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
      const daysArr = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
      const dateLabel = `${daysArr[weekday]}, ${d} ${months[mo - 1]} ${y}`
      const isToday = key === today.dateKey

      if (dayEvents.length === 0) continue
      totalEvents += dayEvents.length

      const itemsHtml = dayEvents.map((ev) => {
        if (ev.allDay) {
          const end = ev.end && ev.end !== ev.start ? ` → ${ev.end.slice(0, 10)}` : ""
          return `
            <div style="display:flex; gap:12px; padding:10px 0; border-bottom:1px solid #F1F5F9; align-items:baseline;">
              <div style="min-width:56px; font-size:10px; font-weight:800; color:#D46A9B; text-transform:uppercase; letter-spacing:0.08em;">All day</div>
              <div style="font-size:14px; font-weight:600; color:#1E293B;">${esc(ev.summary)}${end ? `<span style="color:#94A3B8; font-weight:400;">${esc(end)}</span>` : ""}</div>
            </div>`
        }
        const s = melbourneParts(ev.startMs)
        const e = ev.endMs > ev.startMs ? melbourneParts(ev.endMs) : null
        const time = e
          ? `${fmtTime12(s.hour, s.minute)} – ${fmtTime12(e.hour, e.minute)}`
          : fmtTime12(s.hour, s.minute)
        const loc = ev.location ? `<span style="color:#94A3B8; font-weight:400;"> · ${esc(ev.location)}</span>` : ""
        return `
          <div style="display:flex; gap:12px; padding:10px 0; border-bottom:1px solid #F1F5F9; align-items:baseline;">
            <div style="min-width:56px; font-size:11px; font-weight:700; color:#1E3A8A;">${time}</div>
            <div style="font-size:14px; font-weight:600; color:#1E293B;">${esc(ev.summary)}${loc}</div>
          </div>`
      }).join("")

      rows.push(`
        <div style="margin-bottom: 20px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <div style="width:8px; height:8px; border-radius:99px; ${isToday ? "background:#E11D48;" : "background:#D46A9B;"}"></div>
            <div style="font-size:13px; font-weight:800; color:${isToday ? "#E11D48" : "#334155"};">${dateLabel}${isToday ? " · Today" : ""}</div>
          </div>
          <div style="margin-top:6px; background:#FDFCFB; border:1px solid #F1F5F9; border-radius:16px; padding:4px 16px;">
            ${itemsHtml}
          </div>
        </div>`)
    }

    const subject = `Timetable — next ${days} days`
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <body style="margin:0; padding:0; background-color:#FDFCFB; font-family: sans-serif;">
        <center style="width:100%; background-color:#FDFCFB; padding:40px 0;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:32px; overflow:hidden; border:1px solid #F1F5F9;">
            <tr><td style="height:6px; background-color:#D46A9B;"></td></tr>
            <tr>
              <td style="padding:40px 36px;">
                <div style="color:#1E3261; font-size:24px; font-weight:700;">Timetable — next ${days} days</div>
                <div style="color:#D46A9B; font-size:11px; font-weight:800; letter-spacing:0.2em; margin-top:8px; text-transform:uppercase;">${esc(TIMEZONE)}</div>
                <div style="border-top:1px solid #F1F5F9; margin:24px 0;"></div>
                ${rows.join("") || `<p style="color:#94A3B8; font-size:14px;">No events in this window.</p>`}
                <div style="border-top:1px solid #F1F5F9; margin-top:16px; padding-top:24px; text-align:left; color:#94A3B8; font-size:12px;">
                  ${totalEvents} events across ${rows.length} day(s) · parsed ${parseCount} iCloud events.
                </div>
              </td>
            </tr>
          </table>
        </center>
      </body>
      </html>
    `

    const accessToken = await getGmailAccessToken(GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN)
    const result = await sendGmail(accessToken, SENDER_EMAIL, RECIPIENT, subject, htmlBody)
    console.log(`[gmail-schedule-email] Sent "${subject}" to ${RECIPIENT} (${totalEvents} events)`)

    return new Response(JSON.stringify({
      success: true,
      sentTo: RECIPIENT,
      subject,
      eventCount: totalEvents,
      dayCount: rows.length,
      messageId: result?.id,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    console.error("[gmail-schedule-email] Error:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
