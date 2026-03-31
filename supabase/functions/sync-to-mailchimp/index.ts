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
    
    const MAILCHIMP_API_KEY = Deno.env.get('MAILCHIMP_API_KEY')
    // Check both common names for the list ID
    const MAILCHIMP_LIST_ID = Deno.env.get('MAILCHIMP_LIST_ID') || Deno.env.get('MAILCHIMP_AUDIENCE_ID')
    
    console.log("Validation Check - API Key present:", !!MAILCHIMP_API_KEY);
    console.log("Validation Check - List ID present:", !!MAILCHIMP_LIST_ID);
    
    if (!MAILCHIMP_API_KEY) {
      throw new Error('MAILCHIMP_API_KEY is missing from Supabase Secrets.')
    }
    
    if (MAILCHIMP_API_KEY.includes('your_real_key')) {
      throw new Error('MAILCHIMP_API_KEY still contains placeholder text.')
    }

    if (!MAILCHIMP_LIST_ID) {
      throw new Error('MAILCHIMP_LIST_ID (or MAILCHIMP_AUDIENCE_ID) is missing from Supabase Secrets.')
    }

    if (MAILCHIMP_LIST_ID.includes('your_real_audience_id')) {
      throw new Error('MAILCHIMP_LIST_ID still contains placeholder text.')
    }

    const keyParts = MAILCHIMP_API_KEY.split('-')
    if (keyParts.length < 2) {
      throw new Error(`Invalid API Key format. Expected 'key-datacenter' (e.g. abc-us20).`)
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
      return new Response(JSON.stringify({ message: 'Member already exists' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      })
    }

    if (!response.ok) {
      throw new Error(result.detail || result.title || 'Mailchimp API error')
    }

    return new Response(JSON.stringify({ success: true }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    })

  } catch (error) {
    console.error("Function Error:", error.message)
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400 
    })
  }
})