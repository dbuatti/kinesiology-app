// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const MAILCHIMP_API_KEY = Deno.env.get('MAILCHIMP_API_KEY')
const MAILCHIMP_LIST_ID = Deno.env.get('MAILCHIMP_LIST_ID')
const DATACENTER = MAILCHIMP_API_KEY?.split('-')[1]

serve(async (req) => {
  try {
    const { record } = await req.json()
    
    // Prepare data for Mailchimp
    const nameParts = record.name.trim().split(/\s+/)
    const email = record.email
    const firstName = nameParts[0]
    const lastName = nameParts.slice(1).join(" ")

    const body = {
      email_address: email,
      status: 'subscribed',
      merge_fields: {
        FNAME: firstName,
        LNAME: lastName,
        PHONE: record.phone || "",
        OCCUPATION: record.occupation || ""
      },
      tags: ["FNH", record.is_practitioner ? "Practitioner" : "Client"]
    }

    // Ping Mailchimp API
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
    return new Response(JSON.stringify(result), { status: 200 })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }
})