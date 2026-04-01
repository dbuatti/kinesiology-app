// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, cal-api-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  console.log("--- [manage-calcom-availability] v7.0 — OOO DEBUG MODE ---");

  try {
    const { action, date } = await req.json()
    const CALCOM_KEY = Deno.env.get('CALCOM_API_KEY')
    
    if (!CALCOM_KEY) throw new Error("Missing CALCOM_API_KEY in Supabase Secrets.")

    // 1. Format the Date to YYYY-MM-DD
    // Ensure we handle the date string correctly regardless of input format
    const dateOnly = typeof date === 'string' && date.includes('T') 
      ? date.split('T')[0] 
      : date;

    console.log(`Action: ${action}, Target Date: ${dateOnly}`);

    const headers = {
      'Authorization': `Bearer ${CALCOM_KEY}`,
      'cal-api-version': '2024-08-13',
      'Content-Type': 'application/json',
    };

    if (action === 'block-day') {
      // Use clean ISO strings without milliseconds as some APIs are sensitive to them
      const start = `${dateOnly}T00:00:00Z`;
      const end = `${dateOnly}T23:59:59Z`;

      const oooPayload = {
        start,
        end,
        reason: "unavailable",
        notes: `Blocked via Antigravity CRM`
      };

      console.log("Sending OOO Payload:", JSON.stringify(oooPayload));

      const res = await fetch(`https://api.cal.com/v2/me/ooo`, {
        method: 'POST',
        headers,
        body: JSON.stringify(oooPayload)
      });

      const json = await res.json();
      
      if (!res.ok) {
        console.error("Cal.com API Error Response:", JSON.stringify(json));
        // Extract the most useful error message
        const errorMsg = json.error?.message || json.message || res.statusText;
        throw new Error(`Cal.com Error: ${errorMsg}`);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        action,
        date: dateOnly,
        message: `Day ${dateOnly} blocked successfully.`
      }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });

    } else if (action === 'unblock-day') {
      console.log(`Searching for OOO entry to remove for ${dateOnly}...`);
      
      const listRes = await fetch(`https://api.cal.com/v2/me/ooo`, {
        method: 'GET',
        headers
      });
      
      const listJson = await listRes.json();
      if (!listRes.ok) throw new Error(`Failed to fetch OOO list: ${listJson.error?.message || listRes.statusText}`);

      // Find the entry matching this date
      const entries = listJson.data || [];
      const targetEntry = entries.find(e => e.start.startsWith(dateOnly));

      if (!targetEntry) {
        return new Response(JSON.stringify({ 
          success: true, 
          message: "No block found for this date." 
        }), { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }

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