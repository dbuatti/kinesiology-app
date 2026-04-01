// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, cal-api-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  console.log("--- [manage-calcom-availability] v6.0 — OOO API MIGRATION ---");

  try {
    const { action, date } = await req.json()
    const CALCOM_KEY = Deno.env.get('CALCOM_API_KEY')
    
    if (!CALCOM_KEY) throw new Error("Missing CALCOM_API_KEY in Supabase Secrets.")

    // 1. Format the Date to YYYY-MM-DD
    const dateObj = new Date(date);
    const dateOnly = dateObj.toISOString().split('T')[0];

    console.log(`Action: ${action}, Target Date: ${dateOnly}`);

    const headers = {
      'Authorization': `Bearer ${CALCOM_KEY}`,
      'cal-api-version': '2024-08-13',
      'Content-Type': 'application/json',
    };

    if (action === 'block-day') {
      console.log(`Creating OOO block for ${dateOnly}...`);
      
      // Create a full-day Out-of-Office entry
      const oooPayload = {
        start: `${dateOnly}T00:00:00.000Z`,
        end: `${dateOnly}T23:59:59.999Z`,
        reason: "unavailable",
        notes: `Blocked via Antigravity CRM`
      };

      const res = await fetch(`https://api.cal.com/v2/me/ooo`, {
        method: 'POST',
        headers,
        body: JSON.stringify(oooPayload)
      });

      const json = await res.json();
      if (!res.ok) throw new Error(`Failed to block day: ${json.error?.message || res.statusText}`);

      return new Response(JSON.stringify({ 
        success: true, 
        action,
        date: dateOnly,
        message: `Day ${dateOnly} blocked successfully via OOO.`
      }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });

    } else if (action === 'unblock-day') {
      console.log(`Searching for OOO entry to remove for ${dateOnly}...`);
      
      // 1. Fetch current OOO entries
      const listRes = await fetch(`https://api.cal.com/v2/me/ooo`, {
        method: 'GET',
        headers
      });
      
      const listJson = await listRes.json();
      if (!listRes.ok) throw new Error(`Failed to fetch OOO list: ${listJson.error?.message || listRes.statusText}`);

      // 2. Find the entry matching this date
      const entries = listJson.data || [];
      const targetEntry = entries.find(e => e.start.startsWith(dateOnly));

      if (!targetEntry) {
        console.log("No matching OOO entry found to delete.");
        return new Response(JSON.stringify({ 
          success: true, 
          message: "No block found for this date." 
        }), { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }

      // 3. Delete the OOO entry
      console.log(`Deleting OOO entry ID: ${targetEntry.id}`);
      const delRes = await fetch(`https://api.cal.com/v2/me/ooo/${targetEntry.id}`, {
        method: 'DELETE',
        headers
      });

      if (!delRes.ok) {
        const delJson = await delRes.json();
        throw new Error(`Failed to delete OOO: ${delJson.error?.message || delRes.statusText}`);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        action,
        date: dateOnly,
        message: `Day ${dateOnly} unblocked successfully.`
      }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    throw new Error(`Unsupported action: ${action}`);

  } catch (error) {
    console.error("CRITICAL ERROR:", error.message);
    return new Response(JSON.stringify({ 
      status: 'error', 
      message: error.message 
    }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})