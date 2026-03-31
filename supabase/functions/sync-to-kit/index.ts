// @ts-nocheck
// supabase/functions/sync-to-kit/index.ts
// Kit.com sync - v2 (March 2026)
// Handles both direct calls and database triggers

const KIT_API_KEY = Deno.env.get('KIT_API_KEY');

Deno.serve(async (req: Request) => {
  console.log("--- [v2] KIT SYNC START ---");

  if (!KIT_API_KEY) {
    console.error("Critical Error: KIT_API_KEY is missing in Supabase Secrets");
    return new Response(JSON.stringify({ error: "KIT_API_KEY missing" }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const body = await req.json();
    
    // Adapter: Handle both direct payloads and Supabase trigger 'record' payloads
    const data = body.record || body;
    
    const email = data.email || data.email_address;
    let first_name = data.first_name || "";
    let last_name = data.last_name || "";
    
    // If coming from CRM 'clients' table, split the name
    if (data.name && !first_name) {
      const parts = data.name.trim().split(/\s+/);
      first_name = parts[0];
      last_name = parts.slice(1).join(" ");
    }

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    console.log(`Attempting to sync ${email} to Kit...`);

    // 1. Create or update subscriber (Kit API does upsert automatically)
    const response = await fetch("https://api.kit.com/v4/subscribers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Kit-Api-Key": KIT_API_KEY,
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

    const result = await response.json();

    if (!response.ok) {
      console.error("Kit API Error:", result);
      return new Response(JSON.stringify({ error: result }), { 
        status: response.status,
        headers: { "Content-Type": "application/json" }
      });
    }

    console.log(`✅ Successfully synced subscriber: ${email}`);

    // 2. Tagging Logic
    // Note: In Kit V4, you typically need the Tag ID. 
    // For now, we log that the subscriber is ready for tagging.
    // If you have specific Tag IDs, we can add a second fetch here to apply them.
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        email, 
        message: "Synced to Kit",
        details: "Subscriber created/updated. Ensure Tags are configured in Kit automation rules." 
      }),
      { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );

  } catch (error: any) {
    console.error("Critical Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});