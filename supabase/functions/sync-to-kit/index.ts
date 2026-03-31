// @ts-nocheck
// supabase/functions/sync-to-kit/index.ts
// Kit.com sync - v3 (March 2026)
// Robust JSON parsing and method validation

const KIT_API_KEY = Deno.env.get('KIT_API_KEY');

Deno.serve(async (req: Request) => {
  console.log("--- [v3] KIT SYNC START ---");

  if (!KIT_API_KEY) {
    console.error("Critical Error: KIT_API_KEY is missing");
    return new Response(
      JSON.stringify({ error: "KIT_API_KEY is missing in secrets" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // Handle non-POST requests gracefully (e.g. when testing in dashboard)
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed. Use POST with JSON body." }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    let data;
    
    // Safely parse JSON body with fallback
    try {
      const body = await req.json();
      // Adapter: Handle both direct payloads and Supabase trigger 'record' payloads
      data = body.record || body;
    } catch (jsonError) {
      console.error("JSON Parse Error:", jsonError);
      return new Response(
        JSON.stringify({ error: "Invalid JSON body. Send { \"email\": \"user@example.com\" }" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const email = data.email || data.email_address;
    if (!email) {
      return new Response(
        JSON.stringify({ error: "email is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    let first_name = data.first_name || "";
    let last_name = data.last_name || "";
    
    // If coming from CRM 'clients' table, split the name
    if (data.name && !first_name) {
      const parts = data.name.trim().split(/\s+/);
      first_name = parts[0];
      last_name = parts.slice(1).join(" ");
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
      return new Response(
        JSON.stringify({ error: "Kit API failed", details: result }),
        { status: response.status, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ Successfully synced subscriber: ${email}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        email, 
        message: "Successfully added/updated in Kit" 
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