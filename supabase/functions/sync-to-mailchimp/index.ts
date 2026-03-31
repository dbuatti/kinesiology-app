// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Unique Version ID to verify deployment success
  console.log("--- EDGE FUNCTION VERSION: v11-FINAL-CHECK ---");

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { record } = await req.json()
    
    const MAILCHIMP_API_KEY = Deno.env.get('MAILCHIMP_API_KEY')
    const MAILCHIMP_LIST_ID = Deno.env.get('MAILCHIMP_LIST_ID') || Deno.env.get('MAILCHIMP_AUDIENCE_ID')
    
    // Log exactly what the function sees (masked for safety)
    console.log("Environment Check:");
    console.log("- API Key detected:", !!MAILCHIMP_API_KEY);
    if (MAILCHIMP_API_KEY) {
      console.log("- API Key suffix:", "..." + MAILCHIMP_API_KEY.slice(-4));
    }
    
    console.log("- List ID detected:", !!MAILCHIMP_LIST_ID);
    if (MAILCHIMP_LIST_ID) {
      console.log("- List ID value being used:", MAILCHIMP_LIST_ID);
    }

    if (!MAILCHIMP_API_KEY || !MAILCHIMP_LIST_ID) {
      throw new Error(`Missing Secrets. API_KEY: ${!!MAILCHIMP_API_KEY}, LIST_ID: ${!!MAILCHIMP_LIST_ID}`)
    }

    const keyParts = MAILCHIMP_API_KEY.split('-')
    if (keyParts.length < 2) {
      throw new Error(`Invalid API Key format. Expected 'key-datacenter'.`)
    }

    const DATACENTER = keyParts[1]
    const email = record.email
    
    if (!email) {
      return new Response(JSON.stringify({ message: 'No email provided' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      })
    }

    const nameParts = (record.name || "Client").trim().split(/\s+/)
    const firstName = nameParts[0] || ""
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : ""

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

    const url = `https://${DATACENTER}.api.mailchimp.com/3.0/lists/${MAILCHIMP_LIST_ID}/members`
    
    console.log(`Requesting Mailchimp API: ${url}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `apikey ${MAILCHIMP_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const result = await response.json()

    if (!response.ok && result.title === "Member Exists") {
      console.log(`Member ${email} already exists.`);
      return new Response(JSON.stringify({ message: 'Member already exists' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      })
    }

    if (!response.ok) {
      console.error("Mailchimp Error:", result);
      throw new Error(result.detail || result.title || 'Mailchimp API error')
    }

    console.log(`Successfully synced ${email}`);
    return new Response(JSON.stringify({ success: true }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    })

  } catch (error) {
    console.error("Execution Error:", error.message)
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400 
    })
  }
})