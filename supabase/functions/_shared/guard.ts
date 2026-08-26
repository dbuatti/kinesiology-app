// @ts-nocheck
import { requireUser } from "./auth.ts";

// Permissive-but-closed gate for email-sending edge functions.
// Allows a request if ANY of these hold:
//   1. A valid user session JWT (app/client calls via supabase.functions.invoke)
//   2. The Supabase service-role key (server-to-server calls from other edge fns)
//   3. A shared INTERNAL_FN_SECRET header (preferred for internal calls going forward)
// Anonymous requests (no credential) are rejected, closing the open public-endpoint gap.
export async function requireAuth(req, corsHeaders) {
  const userErr = await requireUser(req, corsHeaders);
  if (!userErr) return null;

  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : auth;
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (token && serviceRole && token === serviceRole) return null;

  const secret = req.headers.get("x-internal-secret");
  const expected = Deno.env.get("INTERNAL_FN_SECRET");
  if (secret && expected && secret === expected) return null;

  return userErr || new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
