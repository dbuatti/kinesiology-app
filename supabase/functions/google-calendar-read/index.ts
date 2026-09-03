// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { requireUser } from "../_shared/auth.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

/**
 * Phase 3 — read the practitioner's Google Calendar over a window and return
 * busy events (plus the calendar's name). Reuses the Gmail Google Cloud OAuth
 * client (GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET) with a refresh token. If that
 * refresh token was never granted calendar.readonly scope, the Calendar API
 * returns 403 and we surface a friendly, actionable error instead of crashing.
 */
async function getGoogleAccessToken(clientId, clientSecret, refreshToken) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Google Auth Error: ${data.error_description || data.error}`);
  return data.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const authErr = await requireUser(req, corsHeaders)
  if (authErr) return authErr

  try {
    const { start, end, timeZone } = await req.json().catch(() => ({}))
    if (!start || !end) throw new Error("Missing start/end.")

    const CLIENT_ID = Deno.env.get('GMAIL_CLIENT_ID')
    const CLIENT_SECRET = Deno.env.get('GMAIL_CLIENT_SECRET')
    const REFRESH_TOKEN = Deno.env.get('GMAIL_REFRESH_TOKEN')

    if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
      throw new Error("Missing Gmail Google OAuth secrets.")
    }

    let accessToken
    try {
      accessToken = await getGoogleAccessToken(CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN)
    } catch (err) {
      return new Response(JSON.stringify({
        status: 'error',
        scopeError: 'auth',
        message: err.message,
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const params = new URLSearchParams({
      timeMin: start,
      timeMax: end,
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '2500',
    })
    if (timeZone) params.set('timeZone', timeZone)
    // Primary calendar of the authenticated user.
    const calRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const calData = await calRes.json()

    // 403 with insufficientPermissions = the refresh token lacks calendar scope.
    if (calRes.status === 403 && (calData?.error?.message || '').toLowerCase().includes('permission')) {
      return new Response(JSON.stringify({
        status: 'error',
        scopeError: 'scope',
        message: "The Gmail token lacks Google Calendar read scope. Add a calendar.readonly-scoped GOOGLE_CALENDAR_REFRESH_TOKEN and re-point this function.",
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    if (!calRes.ok) {
      return new Response(JSON.stringify({
        status: 'error',
        scopeError: 'api',
        message: `Calendar API error ${calRes.status}: ${calData?.error?.message || calRes.statusText}`,
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Also list the calendars this token can see — a busy-plan may live in a
    // NON-primary calendar, so we surface id/summary/primary to find it.
    let calendarsResult = []
    try {
      const calListRes = await fetch(
        'https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=50&showHidden=true',
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      if (calListRes.ok) {
        const calListData = await calListRes.json()
        calendarsResult = (calListData.items || []).map((c) => ({
          id: c.id,
          summary: c.summary || '',
          primary: !!c.primary,
          accessRole: c.accessRole || '',
        }))
      }
    } catch { /* non-fatal diagnostics */ }

    // Include EVERY event that has a start (dated or all-day). The old filter
    // (`ev.start && ev.start.dateTime`) silently dropped all-day events, which
    // made the UI show "0 busy events" when the calendar was actually full of
    // all-day entries. Also return diagnostics (total, sample, calendars) so we
    // can tell a genuinely-empty result apart from a data-shape mismatch.
    const items = (calData.items || [])
      .filter((ev) => ev.start)
      .map((ev) => ({
        id: ev.id,
        summary: ev.summary || 'Busy',
        start: ev.start?.dateTime || ev.start?.date || null,
        end: ev.end?.dateTime || ev.end?.date || null,
        allDay: !!ev.start?.date && !ev.start?.dateTime,
        location: ev.location || null,
        transparent: ev.transparency === 'transparent',
      }))

    return new Response(JSON.stringify({
      status: 'success',
      timeZone,
      items,
      total: calData.items?.length || 0,
      sample: (calData.items || []).slice(0, 3).map((ev) => ({
        summary: ev.summary || 'Busy',
        start: ev.start || null,
        end: ev.end || null,
      })),
      calendars: calendarsResult,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    console.error("[google-calendar-read] Error:", error.message)
    return new Response(JSON.stringify({ status: 'error', message: error.message }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
