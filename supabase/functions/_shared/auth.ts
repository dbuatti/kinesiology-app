// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Authorisation guard for CRM-only edge functions.
 *
 * Supabase's `verify_jwt` accepts the public anon key (it's a valid signed JWT),
 * so it does NOT distinguish a logged-in practitioner from anyone who copied the
 * anon key out of the frontend bundle. This guard does: it allows
 *   (1) internal service-role calls (other functions / webhooks), and
 *   (2) authenticated app users,
 * and rejects anonymous (anon-key-only) callers.
 *
 * Returns a 401 Response when unauthorised, or null when the request may proceed.
 */
export async function requireUser(req: Request, corsHeaders: Record<string, string>): Promise<Response | null> {
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");

  // Internal service-role calls (e.g. webhook → function) are trusted.
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (token && serviceKey && token === serviceKey) return null;

  try {
    const sb = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await sb.auth.getUser();
    if (user) return null;
  } catch (_e) {
    // fall through to 401
  }

  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
