// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Kit V4 requires the API SECRET
const KIT_API_SECRET = Deno.env.get('KIT_API_SECRET');

serve(async (req: Request) => {
  console.log("--- [v10] KIT SYNC START ---");

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!KIT_API_SECRET) {
      console.error("Configuration Error: KIT_API_SECRET is not set in Supabase secrets.");
      return new Response(
        JSON.stringify({ 
          error: "Missing API Secret", 
          message: "Please run 'supabase secrets set KIT_API_SECRET=your_secret' in your terminal or add it via the Supabase Dashboard." 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const record = body.record || body;
    const email = record.email;

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Validation Error", message: "Email is required for Kit sync." }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const nameParts = (record.name || "Client").trim().split(/\s+/);
    const first_name = nameParts[0] || "";
    const last_name = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

    console.log(`Attempting to sync ${email} to Kit...`);

    // Kit V4 uses X-Kit-Api-Key header for the Secret Key
    const response = await fetch("https://api.kit.com/v4/subscribers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Kit-Api-Key": KIT_API_SECRET,
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
      console.error(`Kit API Error (${response.status}):`, JSON.stringify(result));
      // Pass through the 401 if Kit returns it, but ensure CORS headers are attached
      return new Response(
        JSON.stringify({ 
          error: "Kit API Rejected Request", 
          details: result,
          hint: response.status === 401 ? "Your KIT_API_SECRET is likely invalid or expired." : "Check the details object for more info."
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Successfully synced: ${email}`);

    return new Response(
      JSON.stringify({ success: true, message: "Synced to Kit" }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error("Critical Edge Function Error:", error.message);
    return new Response(
      JSON.stringify({ error: "Internal Server Error", message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});