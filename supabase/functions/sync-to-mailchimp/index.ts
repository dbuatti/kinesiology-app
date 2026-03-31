// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { record } = await req.json()
    
    const apiKey = Deno.env.get('MAILCHIMP_API_KEY')
    const listId = Deno.env.get('MAILCHIMP_LIST_ID')
    const audienceId = Deno.env.get('MAILCHIMP_AUDIENCE_ID')
    
    const MAILCHIMP_API_KEY = apiKey
    const MAILCHIMP_LIST_ID = listId || audienceId
    
    // Log partial info for verification
    console.log("Secret Verification:");
    console.log("- API Key exists:", !!MAILCHIMP_API_KEY);
    if (MAILCHIMP_API_KEY) console.log("- API Key starts with:", MAILCHIMP_API_KEY.substring(0, 3) + "...");
    
    console.log("- List ID exists:", !!MAILCHIMP_LIST_ID);
    if (MAILCHIMP_LIST_ID) console.log("- List ID starts with:", MAILCHIMP_LIST_ID.substring(0, 3) + "...");

    if (!MAILCHIMP_API_KEY) {
      throw new Error('MAILCHIMP_API_KEY is missing from Supabase Secrets.')
    }

    if (!MAILCHIMP_LIST_ID) {
      throw new Error('MAILCHIMP_LIST_ID (or MAILCHIMP_AUDIENCE_ID) is missing from Supabase Secrets.')
    }

    const keyParts = MAILCHIMP_API_KEY.split('-')
    if (keyParts.length < 2) {
      throw new Error(`Invalid API Key format. Expected 'key-datacenter' (e.g. abc-us20).`)
    }

    const DATACENTER = keyParts[1]
    const email = record.email
    
    if (!email) {
      console.log("Sync skipped: No email address for record", record.id);
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
    
    console.log(`Attempting to sync ${email} to list ${MAILCHIMP_LIST_ID} on ${DATACENTER}`);

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
      console.log(`Member ${email} already exists in Mailchimp.`);
      return new Response(JSON.stringify({ message: 'Member already exists' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      })
    }

    if (!response.ok) {
      console.error("Mailchimp API Error Response:", result);
      throw new Error(result.detail || result.title || 'Mailchimp API error')
    }

    console.log(`Successfully synced ${email} to Mailchimp.`);
    return new Response(JSON.stringify({ success: true }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    })

  } catch (error) {
    console.error("Function Execution Error:", error.message)
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400 
    })
  }
})