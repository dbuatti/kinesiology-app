// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  console.log("--- [v1] KIT SYNC START ---");

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { record } = await req.json()
    
    const API_SECRET = Deno.env.get('KIT_API_SECRET');
    
    if (!API_SECRET) {
      throw new Error("Missing KIT_API_SECRET. Please set this in your Supabase project secrets.");
    }

    const email = record.email;
    if (!email) {
      console.log("Skipping record: No email address found.");
      return new Response(JSON.stringify({ message: 'No email' }), { status: 200, headers: corsHeaders });
    }

    const nameParts = (record.name || "Client").trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    
    // Kit V4 Subscriber Payload
    const body = {
      email_address: email,
      first_name: firstName,
      fields: {
        phone: record.phone || "",
        suburbs: Array.isArray(record.suburbs) ? record.suburbs.join(", ") : (record.suburbs || ""),
        occupation: record.occupation || ""
      },
      // Map FNH status to tags
      tags: ["FNH", record.is_practitioner ? "Practitioner" : "Client"]
    }

    console.log(`Attempting to sync ${email} to Kit...`);

    const response = await fetch('https://api.kit.com/v4/subscribers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Kit API Error:", result);
      throw new Error(result.message || "Kit API Error");
    }

    console.log(`Successfully synced ${email} to Kit.`);
    return new Response(JSON.stringify({ success: true }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error("Critical Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})