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
    const MAILCHIMP_LIST_ID = Deno.env.get('MAILCHIMP_LIST_ID')
    
    if (!MAILCHIMP_API_KEY || MAILCHIMP_API_KEY.includes('your_real_key')) {
      throw new Error('Invalid or missing MAILCHIMP_API_KEY in Supabase Secrets')
    }

    const DATACENTER = MAILCHIMP_API_KEY.split('-')[1]
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

    console.log(`Attempting to sync ${email} to list ${MAILCHIMP_LIST_ID} on ${DATACENTER}`)

    // Using POST to add a new member. 
    // Note: If member exists, Mailchimp returns 400 "Member Exists".
    const response = await fetch(
      `https://${DATACENTER}.api.mailchimp.com/3.0/lists/${MAILCHIMP_LIST_ID}/members`,
      {
        method: 'POST',
        headers: {
          Authorization: `apikey ${MAILCHIMP_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    )

    const result = await response.json()

    // If the error is just that they already exist, we treat it as a success
    if (!response.ok && result.title === "Member Exists") {
      return new Response(JSON.stringify({ message: 'Member already exists, sync skipped' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      })
    }

    if (!response.ok) {
      console.error("Mailchimp Error Details:", result)
      throw new Error(result.detail || result.title || 'Mailchimp API error')
    }

    return new Response(JSON.stringify({ success: true, data: result }), { 
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