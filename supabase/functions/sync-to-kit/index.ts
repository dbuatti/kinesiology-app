// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const KIT_API_KEY = Deno.env.get('KIT_API_KEY');

serve(async (req) => {
  console.log("--- [v2] KIT SYNC START ---");

  if (!KIT_API_KEY) {
    console.error("Critical Error: KIT_API_KEY is missing in Supabase Secrets");
    return new Response("Missing KIT_API_KEY", { status: 500 });
  }

  try {
    const body = await req.json();
    
    // Adapter: If the request comes from the CRM trigger, it wraps data in a 'record' object
    const data = body.record || body;
    
    const email = data.email || data.email_address;
    let first_name = data.first_name || "";
    let last_name = data.last_name || "";
    let tags = data.tags || [];

    // If coming from CRM 'clients' table, split the name
    if (data.name && !first_name) {
      const parts = data.name.trim().split(/\s+/);
      first_name = parts[0];
      last_name = parts.slice(1).join(" ");
    }

    // If coming from CRM, determine tags
    if (data.id && tags.length === 0) {
      tags = ["FNH", data.is_practitioner ? "Practitioner" : "Client"];
    }

    if (!email) {
      return new Response("Email is required", { status: 400 });
    }

    console.log(`Attempting to sync ${email} to Kit...`);

    // 1. Create or update subscriber
    const subscriberResponse = await fetch('https://api.kit.com/v4/subscribers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Kit-Api-Key': KIT_API_KEY,
      },
      body: JSON.stringify({
        email_address: email,
        first_name: first_name,
        last_name: last_name,
        fields: {
          phone: data.phone || "",
          suburbs: Array.isArray(data.suburbs) ? data.suburbs.join(", ") : (data.suburbs || ""),
          occupation: data.occupation || ""
        }
      }),
    });

    const subscriberData = await subscriberResponse.json();

    if (!subscriberResponse.ok) {
      console.error("Kit Subscriber Error:", subscriberData);
      throw new Error(`Kit API Error: ${JSON.stringify(subscriberData)}`);
    }

    console.log(`Successfully synced subscriber: ${email}`);

    // 2. Add tags if provided
    if (tags.length > 0) {
      console.log(`Applying tags: ${tags.join(", ")}`);
      
      // Note: Kit V4 tagging requires tag IDs or specific endpoints. 
      // For now, we log them. If you have specific Tag IDs, we can add the secondary fetch here.
    }

    return new Response(
      JSON.stringify({ success: true, email, message: "Synced to Kit" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Critical Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
});