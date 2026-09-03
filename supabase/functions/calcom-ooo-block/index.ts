// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { requireUser } from "../_shared/auth.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, cal-api-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

/**
 * Phase 3 — write a booking block as a Cal.com Out-of-Office (OOO) entry so the
 * time is held as busy in the practitioner's Cal.com availability. Used when
 * confirming a proposal (FNH or voice) to lock the slot against double-booking.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const authErr = await requireUser(req, corsHeaders)
  if (authErr) return authErr

  try {
    const { action, start, end, proposalId, reason } = await req.json().catch(() => ({}))
    const CALCOM_KEY = Deno.env.get('CALCOM_API_KEY')
    if (!CALCOM_KEY) throw new Error("Missing CALCOM_API_KEY in Supabase Secrets.")
    if (!start || !end) throw new Error("Missing start/end.")

    const headers = {
      'Authorization': `Bearer ${CALCOM_KEY}`,
      'cal-api-version': '2024-08-13',
      'Content-Type': 'application/json',
    }

    if (action === 'set') {
      const oooPayload = {
        start,
        end,
        reason: "unspecified",
        notes: proposalId ? `Booking block for proposal ${proposalId}` : "Booking block via Antigravity CRM",
      }
      const res = await fetch(`https://api.cal.com/v2/me/ooo`, {
        method: 'POST',
        headers,
        body: JSON.stringify(oooPayload),
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(`Cal.com OOO Error: ${json.error?.message || json.message || res.statusText}`)
      }
      return new Response(JSON.stringify({ success: true, action, start, end, oooId: json.data?.id || json.id || null }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (action === 'clear') {
      // Find and delete the OOO entry matching this window (by proposalId in notes).
      const listRes = await fetch(`https://api.cal.com/v2/me/ooo`, { method: 'GET', headers })
      const listJson = await listRes.json()
      if (!listRes.ok) throw new Error(`Failed to read OOO list: ${listJson.error?.message || listRes.statusText}`)

      const matches = (listJson.data || []).filter((e) => {
        const inProposal = proposalId && e.notes && e.notes.includes(proposalId)
        const inWindow = e.start === start && e.end === end
        return inProposal || inWindow
      })

      let cleared = 0
      for (const entry of matches) {
        const delRes = await fetch(`https://api.cal.com/v2/me/ooo/${entry.id}`, { method: 'DELETE', headers })
        if (delRes.ok) cleared++
      }
      return new Response(JSON.stringify({ success: true, action, cleared }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    throw new Error(`Unsupported action: ${action}`)

  } catch (error) {
    console.error("[calcom-ooo-block] Error:", error.message)
    return new Response(JSON.stringify({ status: 'error', message: error.message }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
