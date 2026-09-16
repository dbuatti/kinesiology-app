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

/**
 * Stricter guard for practitioner-only edge functions (CRM operations,
 * sending real emails, touching Stripe/Notion/Cal.com on the practitioner's
 * behalf). Unlike requireUser(), this rejects ANY authenticated caller that
 * isn't specifically the practitioner's own account — important once client
 * portal logins exist (Phase 2 of the client-zone plan), since a client's
 * session is a perfectly valid `authenticated` Supabase user and would
 * otherwise pass requireUser() too.
 *
 * The practitioner's auth.users id is stored as the PRACTITIONER_USER_ID
 * secret (this app is single-practitioner — there is exactly one such id).
 *
 * Returns a 401/403 Response when unauthorised, or null when the request may proceed.
 */
export async function requirePractitioner(req: Request, corsHeaders: Record<string, string>): Promise<Response | null> {
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");

  // Internal service-role calls (e.g. webhook -> function, cron -> function) are trusted.
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (token && serviceKey && token === serviceKey) return null;

  const practitionerId = Deno.env.get("PRACTITIONER_USER_ID");

  try {
    const sb = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await sb.auth.getUser();
    if (user && practitionerId && user.id === practitionerId) return null;
    if (user) {
      return new Response(JSON.stringify({ error: "Forbidden — practitioner only." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (_e) {
    // fall through to 401
  }

  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Guard for internal-only edge functions (scheduled/cron jobs, function-to-
 * function calls) that should never be reachable by any logged-in user —
 * practitioner or client — only by a caller presenting the service-role key
 * directly (e.g. pg_cron's pg_net calls, or another edge function).
 *
 * Returns a 401 Response when unauthorised, or null when the request may proceed.
 */
export async function requireServiceRole(req: Request, corsHeaders: Record<string, string>): Promise<Response | null> {
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (token && serviceKey && token === serviceKey) return null;

  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
