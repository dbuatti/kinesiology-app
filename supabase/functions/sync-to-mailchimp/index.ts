// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // VERIFICATION MARKER
  console.log("--- [v13] MAILCHIMP SYNC START ---");

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { record } = await req.json()
    
    const API_KEY = Deno.env.get('MAILCHIMP_API_KEY');
    const LIST_ID = Deno.env.get('MAILCHIMP_LIST_ID') || Deno.env.get('MAILCHIMP_AUDIENCE_ID');
    
    // Log presence of secrets (not the values themselves for security)
    console.log(`Config: API_KEY=${!!API_KEY}, LIST_ID=${LIST_ID ? LIST_ID.substring(0, 3) + '...' : 'MISSING'}`);

    if (!API_KEY || !LIST_ID) {
      throw new Error("Missing Mailchimp Secrets. Please ensure MAILCHIMP_API_KEY and MAILCHIMP_LIST_ID are set in Supabase.");
    }

    const datacenter = API_KEY.split('-')[1];
    if (!datacenter) throw new Error("Invalid Mailchimp API Key format (missing datacenter suffix like -us21).");

    const email = record.email;
    if (!email) {
      console.log("Skipping record: No email address found.");
      return new Response(JSON.stringify({ message: 'No email' }), { status: 200, headers: corsHeaders });
    }

    const nameParts = (record.name || "Client").trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";
    
    const body = {
      email_address: email,
      status: 'subscribed',
      merge_fields: {
        FNAME: firstName,
        LNAME: lastName,
        PHONE: record.phone || "",
      },
      tags: ["FNH", record.is_practitioner ? "Practitioner" : "Client"]
    }

    const url = `https://${datacenter}.api.mailchimp.com/3.0/lists/${LIST_ID}/members`;
    
    console.log(`Attempting to sync ${email} to Mailchimp...`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `apikey ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();

    if (!response.ok) {
      if (result.title === "Member Exists") {
        console.log(`${email} is already on the list.`);
        return new Response(JSON.stringify({ message: 'Already exists' }), { status: 200, headers: corsHeaders });
      }
      console.error("Mailchimp API Error:", result);
      throw new Error(result.detail || result.title || "Mailchimp API Error");
    }

    console.log(`Successfully synced ${email} to Mailchimp.`);
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