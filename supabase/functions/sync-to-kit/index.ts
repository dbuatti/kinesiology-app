// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log("--- [v11] KIT SYNC START ---");

  try {
    const KIT_API_SECRET = Deno.env.get('KIT_API_SECRET');
    
    if (!KIT_API_SECRET) {
      console.error("❌ CRITICAL: KIT_API_SECRET is not set in Supabase secrets.");
      return new Response(JSON.stringify({ 
        error: "Missing API Secret", 
        message: "KIT_API_SECRET not found. Please run 'supabase secrets set KIT_API_SECRET=...' in your terminal." 
      }), { 
        status: 418, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const body = await req.json().catch(() => ({}));
    const record = body.record || body;
    const email = record.email;

    if (!email) {
      console.warn("⚠️ Skipping sync: No email provided in record.");
      return new Response(JSON.stringify({ error: "Validation Error", message: "Email is required." }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const nameParts = (record.name || "Client").trim().split(/\s+/);
    const first_name = nameParts[0] || "";
    const last_name = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

    console.log(`Syncing ${email} to Kit...`);

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
      console.error(`❌ Kit API Error (${response.status}):`, JSON.stringify(result));
      const status = response.status === 401 ? 418 : response.status;
      return new Response(JSON.stringify({ error: "Kit API Error", details: result }), { 
        status: status, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log(`✅ SUCCESS: ${email} synced to Kit.`);

    return new Response(JSON.stringify({ success: true }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error: any) {
    console.error("❌ CRITICAL ERROR:", error.message);
    return new Response(JSON.stringify({ error: "Internal Server Error", message: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});