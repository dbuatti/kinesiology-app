import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { differenceInDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertCircle, ChevronDown, ChevronUp, Mail, MessageCircle, Loader2 } from "lucide-react";

interface AttentionClient {
  id: string;
  name: string;
  email: string | null;
  daysSince: number;
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
    results.push({ id: clientId, name: client.name || "Unknown", email: client.email || null, daysSince: differenceInDays(now, new Date(date)) });
  }

  return results.sort((a, b) => b.daysSince - a.daysSince);
}

function urgencyClass(days: number) {
  if (days >= 30) return "border-chart-destructive/30 bg-chart-destructive/5 text-chart-destructive";
  if (days >= 14) return "border-amber-500/30 bg-amber-500/5 text-amber-600";
  return "border-border bg-muted/30 text-muted-foreground";
}

const mailToLink = (c: AttentionClient) =>
  `mailto:${c.email || ""}?subject=Booking your next session&body=Hi ${c.name.split(" ")[0]}%2C%0A%0AI wanted to check in about booking your next session. Let me know what works for you.%0A%0ADaniele`;

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
          <p className="text-[11px] text-muted-foreground mb-3">Clients with nothing booked ahead of them.</p>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {shown.map((c) => (
              <div
                key={c.id}
                className={cn("flex flex-col gap-2 rounded-xl border p-3 shrink-0 w-[200px]", urgencyClass(c.daysSince))}
              >
                <div className="min-w-0">
                  <Link to={`/clients/${c.id}`} className="text-sm font-semibold text-foreground hover:text-primary truncate block no-underline">
                    {c.name}
                  </Link>
                  <p className="text-[10px] opacity-80 mt-0.5">
                    {c.daysSince <= 0 ? "Last session today" : `${c.daysSince}d since last session`}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <Button asChild size="sm" variant="secondary" className="h-7 flex-1 text-[10px] gap-1 px-2">
                    <Link to={`/assistant?client=${c.id}&prompt=${encodeURIComponent(`Help me draft a message to ${c.name.split(" ")[0]} to book their next session.`)}`}>
                      <MessageCircle className="h-3 w-3" /> Assistant
                    </Link>
                  </Button>
                  {c.email && (
                    <Button asChild size="sm" variant="outline" className="h-7 w-7 p-0 shrink-0">
                      <a href={mailToLink(c)} title={`Email ${c.name}`}><Mail className="h-3 w-3" /></a>
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
