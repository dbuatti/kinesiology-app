// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Kit V4 requires the API SECRET (not the public key)
const KIT_API_KEY = Deno.env.get('KIT_API_SECRET') || Deno.env.get('KIT_API_KEY');

serve(async (req: Request) => {
  console.log("--- [v9] KIT SYNC START ---");

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (!KIT_API_KEY) {
    console.error("Critical Error: KIT_API_SECRET is missing in Supabase secrets.");
    return new Response(
      JSON.stringify({ error: "Configuration Error: KIT_API_SECRET is missing in Supabase project secrets." }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    console.log("Incoming Payload:", JSON.stringify(body));
    
    const record = body.record || body;
    const email = record.email;

    if (!email) {
      console.error("Validation Error: No email provided in record.");
      return new Response(
        JSON.stringify({ error: "Email is required for Kit sync." }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Split full name into first and last for Kit
    const nameParts = (record.name || "Client").trim().split(/\s+/);
    const first_name = nameParts[0] || "";
    const last_name = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

    console.log(`Syncing ${email} to Kit using key starting with: ${KIT_API_KEY.substring(0, 6)}...`);

    const response = await fetch("https://api.kit.com/v4/subscribers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Kit-Api-Key": KIT_API_KEY,
      },
      body: JSON.stringify({
        email_address: email,
        first_name,
        last_name,
        fields: {
          occupation: record.occupation || ""
        }
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Kit API Error Response:", JSON.stringify(result));
      return new Response(
        JSON.stringify({ 
          error: "Kit API rejected the request. This usually means the API Secret is invalid.", 
          details: result,
          status: response.status 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Successfully synced: ${email} (Occupation: ${record.occupation || 'N/A'})`);

    return new Response(
      JSON.stringify({ success: true, email, message: "Synced to Kit" }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error("Critical Edge Function Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message || "Internal Server Error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});