// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  console.log("--- DEPLOYMENT CHECK: VERSION v12-FIXED-TYPES ---");

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { record } = await req.json()
    
    const API_KEY = Deno.env.get('MAILCHIMP_API_KEY');
    const LIST_ID = Deno.env.get('MAILCHIMP_LIST_ID') || Deno.env.get('MAILCHIMP_AUDIENCE_ID');
    
    console.log(`Secrets Check - API Key: ${!!API_KEY}, List ID: ${LIST_ID}`);

    if (!API_KEY || !LIST_ID) {
      throw new Error("Missing Mailchimp Secrets in Supabase.");
    }

    const datacenter = API_KEY.split('-')[1];
    if (!datacenter) throw new Error("Invalid Mailchimp API Key format (missing -usXX suffix).");

    const email = record.email;
    if (!email) return new Response(JSON.stringify({ message: 'No email' }), { status: 200, headers: corsHeaders });

    const nameParts = (record.name || "Client").trim().split(/\s+/);
    
    const body = {
      email_address: email,
      status: 'subscribed',
      merge_fields: {
        FNAME: nameParts[0] || "",
        LNAME: nameParts.length > 1 ? nameParts.slice(1).join(" ") : "",
        PHONE: record.phone || "",
      },
      tags: ["FNH", record.is_practitioner ? "Practitioner" : "Client"]
    }

    const url = `https://${datacenter}.api.mailchimp.com/3.0/lists/${LIST_ID}/members`;
    
    console.log(`Syncing ${email} to list ${LIST_ID}...`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `apikey ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();

    if (!response.ok && result.title === "Member Exists") {
      return new Response(JSON.stringify({ message: 'Already exists' }), { status: 200, headers: corsHeaders });
    }

    if (!response.ok) {
      console.error("Mailchimp API Error:", result);
      throw new Error(result.detail || result.title || "Mailchimp Error");
    }

    return new Response(JSON.stringify({ success: true }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error("Function Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})