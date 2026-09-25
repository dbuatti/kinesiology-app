import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { voiceStudentIdFor, isVoiceStudentId } from "@/lib/voice-student-id";
import { LifecycleStatus } from "@/lib/clientStatus";
import ClientLifecycleBadge from "@/components/crm/ClientLifecycleBadge";
import { fetchNeedsAttention, assistantPromptFor, AttentionClient } from "@/lib/needsAttention";
import { Button } from "@/components/ui/button";
import { Mail, MessageCircle, Loader2, Mic, Brain, Zap } from "lucide-react";

// The full, filterable follow-up list — reached via its own tab so it's never
// "somewhere else" from the Assistant, unlike the old separate /business
// Follow-Up tool this replaced. Shares its data fetch with the compact
// shorthand summary (NeedsAttentionWidget.tsx) via src/lib/needsAttention.ts.
export default function FollowUpTab() {
  const [clients, setClients] = useState<AttentionClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<LifecycleStatus | "all" | "quick_win">("all");

  const load = useCallback(async () => {
    setLoading(true);
    setClients(await fetchNeedsAttention());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const counts = clients.reduce((acc, c) => { acc[c.status] = (acc[c.status] || 0) + 1; return acc; }, {} as Record<LifecycleStatus, number>);
  const quickWinCount = clients.filter((c) => c.isQuickWin).length;
  const shown = filter === "all" ? clients : filter === "quick_win" ? clients.filter((c) => c.isQuickWin) : clients.filter((c) => c.status === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Checking who needs follow-up...
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {quickWinCount > 0 && (
          <button
            onClick={() => setFilter("quick_win")}
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors",
              filter === "quick_win" ? "bg-chart-emerald text-white border-chart-emerald" : "bg-chart-emerald/10 text-chart-emerald border-chart-emerald/30 hover:border-chart-emerald/60"
            )}
          >
            <Zap className="h-3 w-3" /> Quick Wins <span className="opacity-70">({quickWinCount})</span>
          </button>
        )}
        {(["all", "at_risk", "lapsed", "active"] as const).map((s) => {
          const count = s === "all" ? clients.length : counts[s] || 0;
          const label = s === "all" ? "All" : s === "at_risk" ? "At Risk" : s === "lapsed" ? "Lapsed" : "Worth Rebooking";
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-bold border transition-colors",
                filter === s ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/40"
              )}
            >
              {label} <span className="opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {shown.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Nobody in this bucket right now.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {shown.map((c) => (
            <div key={c.id} className={cn("flex flex-col gap-2 rounded-xl border p-3", c.isQuickWin ? "border-chart-emerald/40 bg-chart-emerald/5" : "border-border bg-card")}>
              <div className="flex items-center gap-1.5">
                {c.kind === "voice"
                  ? <Mic className="h-3 w-3 text-chart-destructive shrink-0" />
                  : <Brain className="h-3 w-3 text-chart-purple shrink-0" />}
                {isVoiceStudentId(c.id) ? (
                  <span className="text-sm font-semibold text-foreground truncate">{c.name}</span>
                ) : (
                  <Link to={`/clients/${c.id}/hub`} className="text-sm font-semibold text-foreground hover:text-primary truncate no-underline">
                    {c.name}
                  </Link>
                )}
                {c.isQuickWin && <Zap className="h-3 w-3 text-chart-emerald shrink-0 ml-auto" />}
              </div>
              <div><ClientLifecycleBadge status={c.status} /></div>
              <p className="text-[11px] text-muted-foreground leading-snug">{c.reason}</p>
              <div className="flex gap-1.5 mt-auto pt-1">
                <Button asChild size="sm" variant="secondary" className="h-7 flex-1 text-[10px] gap-1 px-2">
                  <Link to={isVoiceStudentId(c.id)
                    ? `/assistant?client=${encodeURIComponent(c.id)}&prompt=${encodeURIComponent(assistantPromptFor(c))}`
                    : `/clients/${c.id}/hub?prompt=${encodeURIComponent(assistantPromptFor(c))}`}>
                    <MessageCircle className="h-3 w-3" /> {c.status === "active" ? "Book" : "Assistant"}
                  </Link>
                </Button>
                {c.email && (
                  <Button asChild size="sm" variant="outline" className="h-7 w-7 p-0 shrink-0">
                    <Link
                      to={isVoiceStudentId(c.id) ? `/assistant?client=${encodeURIComponent(c.id)}&view=email` : `/clients/${c.id}/hub?view=email`}
                      title={`Email ${c.name} (in-app, threaded)`}
                    ><Mail className="h-3 w-3" /></Link>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
