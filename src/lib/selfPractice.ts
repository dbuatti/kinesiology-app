import { addDays, format, startOfDay } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

/** Self-practice is never a billable service, wherever a session is created. */
export const SELF_SESSION_BILLING = {
  tag: "Self Practice",
  is_paid: false,
  price_amount: 0,
  payment_received: false,
} as const;

export interface SelfSessionRow {
  id: string;
  name: string | null;
  date: string;
  tag: string | null;
  status: string | null;
}

/**
 * The practitioner and the "Daniele Buatti" client are one person. Resolve the
 * canonical self record dynamically instead of trusting a hardcoded UUID, and
 * prefer the row carrying the practitioner's own email if duplicates exist.
 */
export async function getSelfClient(): Promise<{ id: string; email: string | null; name: string | null } | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("clients")
    .select("id, email, name, is_practitioner")
    .eq("is_practitioner", true)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(10);

  if (error) throw error;

  const rows = data || [];
  return rows.find((row) => row.email?.toLowerCase() === user.email?.toLowerCase()) || rows[0] || null;
}

/** Today's self-session, in the browser's local day (the practitioner's day). */
export async function getTodaySelfSession(clientId: string): Promise<SelfSessionRow | null> {
  const today = startOfDay(new Date());
  const { data, error } = await supabase
    .from("appointments")
    .select("id, name, date, tag, status")
    .eq("client_id", clientId)
    .gte("date", today.toISOString())
    .lt("date", startOfDay(addDays(today, 1)).toISOString())
    .order("date", { ascending: false })
    .limit(1);

  if (error) throw error;
  return (data?.[0] as SelfSessionRow | undefined) || null;
}

/** Create today's self-session with the free-of-charge fields already set. */
export async function createTodaySelfSession(clientId: string): Promise<SelfSessionRow> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in to start a self-session.");

  const now = new Date();
  const { data, error } = await supabase
    .from("appointments")
    .insert({
      user_id: user.id,
      client_id: clientId,
      name: `Self Practice - ${format(now, "MMM d, yyyy")}`,
      date: now.toISOString(),
      status: "Scheduled",
      goal: "Personal health monitoring & protocol practice",
      ...SELF_SESSION_BILLING,
    })
    .select("id, name, date, tag, status")
    .single();

  if (error) throw error;
  return data as SelfSessionRow;
}
