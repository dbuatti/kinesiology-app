import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { differenceInDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertCircle, ChevronDown, ChevronUp, Mail, MessageCircle, Loader2 } from "lucide-react";

const ACTIVE_WINDOW_DAYS = 90;

interface AttentionClient {
  id: string;
  name: string;
  email: string | null;
  daysSince: number;
  isActive: boolean;
}

// Clients with at least one past appointment but nothing booked ahead — the gap
// FollowUpPage's "days since last session" view doesn't catch on its own, since
// a client can be well within a day-threshold yet still have nothing scheduled.
async function fetchNeedsAttention(): Promise<AttentionClient[]> {
  const { data, error } = await supabase
    .from("appointments")
    .select("client_id, date, status, clients(id, name, email)")
    .order("date", { ascending: false });
  if (error || !data) return [];

  const now = new Date();
  const hasFuture = new Set<string>();
  const lastPast = new Map<string, { date: string; client: any }>();

  for (const a of data as any[]) {
    if (!a.client_id || !a.clients) continue;
    const d = new Date(a.date);
    if (a.status === "Scheduled" && d > now) {
      hasFuture.add(a.client_id);
      continue;
    }
    if (d <= now && !lastPast.has(a.client_id)) {
      lastPast.set(a.client_id, { date: a.date, client: a.clients });
    }
  }

  const results: AttentionClient[] = [];
  for (const [clientId, { date, client }] of lastPast.entries()) {
    if (hasFuture.has(clientId)) continue;
    const daysSince = differenceInDays(now, new Date(date));
    results.push({ id: clientId, name: client.name || "Unknown", email: client.email || null, daysSince, isActive: daysSince <= ACTIVE_WINDOW_DAYS });
  }

  // Active (recently-seen, warm) clients surface first regardless of exact day
  // count — they're the ones worth proactively rebooking while the relationship
  // is live. Overdue clients follow, worst-first, as before.
  return results.sort((a, b) => {
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    return a.isActive ? a.daysSince - b.daysSince : b.daysSince - a.daysSince;
  });
}

function urgencyClass(c: AttentionClient) {
  if (c.isActive) return "border-chart-emerald/30 bg-chart-emerald/5 text-chart-emerald";
  if (c.daysSince >= 180) return "border-chart-destructive/30 bg-chart-destructive/5 text-chart-destructive";
  return "border-amber-500/30 bg-amber-500/5 text-amber-600";
}

const assistantPrompt = (c: AttentionClient) =>
  c.isActive
    ? `Find a good slot and book ${c.name.split(" ")[0]}'s next session — check their availability notes and usual pattern first.`
    : `Help me draft a message to ${c.name.split(" ")[0]} to book their next session.`;

export default function NeedsAttentionWidget() {
  const [clients, setClients] = useState<AttentionClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setClients(await fetchNeedsAttention());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking who needs follow-up...
      </div>
    );
  }

  if (clients.length === 0) return null;

  const shown = clients.slice(0, 12);

  return (
    <div className="rounded-2xl border border-border bg-card mb-4 overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <AlertCircle className="h-4 w-4 text-chart-destructive" />
          Needs attention
          <span className="text-[10px] font-black uppercase tracking-wider text-chart-destructive bg-chart-destructive/10 px-1.5 py-0.5 rounded-full">
            {clients.length}
          </span>
        </span>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {expanded && (
        <div className="px-4 pb-4 -mt-1">
          <p className="text-[11px] text-muted-foreground mb-3">Active clients (seen in the last {ACTIVE_WINDOW_DAYS} days) shown first — worth booking their next session while things are warm. Others are overdue.</p>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {shown.map((c) => (
              <div
                key={c.id}
                className={cn("flex flex-col gap-2 rounded-xl border p-3 shrink-0 w-[200px]", urgencyClass(c))}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Link to={`/clients/${c.id}`} className="text-sm font-semibold text-foreground hover:text-primary truncate no-underline">
                      {c.name}
                    </Link>
                    {c.isActive && (
                      <span className="text-[8px] font-black uppercase tracking-wider bg-chart-emerald/15 text-chart-emerald px-1.5 py-0.5 rounded-full shrink-0">Active</span>
                    )}
                  </div>
                  <p className="text-[10px] opacity-80 mt-0.5">
                    {c.daysSince <= 0 ? "Last session today" : `${c.daysSince}d since last session`}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <Button asChild size="sm" variant="secondary" className="h-7 flex-1 text-[10px] gap-1 px-2">
                    <Link to={`/assistant?client=${c.id}&prompt=${encodeURIComponent(assistantPrompt(c))}`}>
                      <MessageCircle className="h-3 w-3" /> {c.isActive ? "Book" : "Assistant"}
                    </Link>
                  </Button>
                  {c.email && (
                    <Button asChild size="sm" variant="outline" className="h-7 w-7 p-0 shrink-0">
                      <Link to={`/assistant?client=${c.id}&view=email`} title={`Email ${c.name} (in-app, threaded)`}><Mail className="h-3 w-3" /></Link>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {clients.length > shown.length && (
            <Link to="/business?tool=follow-up" className="text-[11px] text-primary hover:underline mt-2 inline-block">
              View all {clients.length} in Client Follow-Up →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
