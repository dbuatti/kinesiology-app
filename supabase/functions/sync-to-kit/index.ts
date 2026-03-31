// @ts-nocheck
// supabase/functions/sync-to-kit/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Support both naming conventions for the secret
const KIT_API_KEY = Deno.env.get('KIT_API_SECRET') || Deno.env.get('KIT_API_KEY');

serve(async (req: Request) => {
  console.log("--- [v6] KIT SYNC START ---");

  // Handle preflight OPTIONS request (CORS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (!KIT_API_KEY) {
    console.error("Critical Error: KIT_API_SECRET is missing in Supabase secrets");
    return new Response(
      JSON.stringify({ error: "KIT_API_SECRET is missing in secrets" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    
    // The frontend sends { record: client }. We handle both wrapped and unwrapped.
    const record = body.record || body;
    const email = record.email;

    if (!email) {
      console.log("Skipping: No email provided in payload", body);
      return new Response(
        JSON.stringify({ error: "email is required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Split name into first and last for Kit
    const nameParts = (record.name || "Client").trim().split(/\s+/);
    const first_name = nameParts[0] || "";
    const last_name = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

    console.log(`Attempting to sync ${email} to Kit...`);

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
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Kit API Error:", data);
      return new Response(
        JSON.stringify({ error: "Kit API failed", details: data }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`✅ Successfully synced: ${email}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        email, 
        message: "Successfully added/updated in Kit" 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error("Critical Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});