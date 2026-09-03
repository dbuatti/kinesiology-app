// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { requireUser } from "../_shared/auth.ts"
import { fetchIcloudEvents } from "../_shared/icloud.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

/**
 * Read the practitioner's iCloud calendar over [start, end] and return events
 * overlapping that window. The iCloud published feed is the single authoritative
 * busy source (FNH, voice, teaching, appointments). No OAuth scope needed.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const authErr = await requireUser(req, corsHeaders)
  if (authErr) return authErr

  try {
    const { start, end } = await req.json().catch(() => ({}))
    if (!start || !end) throw new Error("Missing start/end.")

    const { events } = await fetchIcloudEvents(new Date(start).getTime(), new Date(end).getTime())

    const items = events.map((ev) => ({
      source: 'icloud',
      id: ev.id,
      summary: ev.summary,
      start: ev.start,
      end: ev.end,
      allDay: ev.allDay,
      location: ev.location,
      transparent: false,
    }))

    return new Response(JSON.stringify({
      status: 'success',
      items,
      total: items.length,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    console.error("[icloud-calendar-read] Error:", error.message)
    return new Response(JSON.stringify({ status: 'error', message: error.message }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
