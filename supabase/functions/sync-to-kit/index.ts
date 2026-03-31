// supabase/functions/sync-to-kit/index.ts
import { corsHeaders } from 'https://esm.sh/@supabase/supabase-js@2/cors';   // Recommended way in 2026

const KIT_API_KEY = Deno.env.get('KIT_API_KEY');

Deno.serve(async (req: Request) => {
  console.log("--- [v4] KIT SYNC START ---");

  // Handle preflight OPTIONS request (CORS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (!KIT_API_KEY) {
    console.error("Critical Error: KIT_API_KEY is missing");
    return new Response(
      JSON.stringify({ error: "KIT_API_KEY is missing in secrets" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { email, first_name = "", last_name = "" } = body;

    if (!email) {
      return new Response(
        JSON.stringify({ error: "email is required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

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