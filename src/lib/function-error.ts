// supabase.functions.invoke wraps non-2xx responses in a generic FunctionsHttpError
// ("Edge Function returned a non-2xx status code") whose real message sits in
// `.context` (the raw Response). Pull it out so a toast shows the actual server
// error (e.g. "Gmail Auth Error: invalid_grant").
export async function extractFnError(fnError: unknown, fallback: string): Promise<string> {
  const err = fnError as { context?: Response; message?: string } | null;
  try {
    const ctx = err?.context;
    if (ctx && typeof ctx.json === "function") {
      const body = await ctx.clone().json();
      if (body?.error) return body.error;
    } else if (ctx && typeof ctx.text === "function") {
      const t = await ctx.clone().text();
      if (t) return t;
    }
  } catch {
    /* fall through */
  }
  return err?.message || fallback;
}
