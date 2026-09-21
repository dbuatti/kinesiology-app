import { useEffect, useState, useCallback } from "react";
import { AlertCircle, ChevronRight, Loader2, Zap } from "lucide-react";
import { fetchNeedsAttention, AttentionClient } from "@/lib/needsAttention";
import { LifecycleStatus } from "@/lib/clientStatus";
import { cn } from "@/lib/utils";

// Compact shorthand summary shown above the tabs — the FULL interactive list
// lives in the Follow-up tab (see FollowUpTab.tsx). Both read from the same
// src/lib/needsAttention.ts so the numbers never disagree with each other.
interface Props {
  onOpenFollowUp: () => void;
}

export default function NeedsAttentionWidget({ onOpenFollowUp }: Props) {
  const [clients, setClients] = useState<AttentionClient[]>([]);
  const [loading, setLoading] = useState(true);

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

  const counts = clients.reduce((acc, c) => { acc[c.status] = (acc[c.status] || 0) + 1; return acc; }, {} as Record<LifecycleStatus, number>);
  const quickWins = clients.filter((c) => c.isQuickWin);
  const mostUrgent = clients[0];

  return (
    <button
      onClick={onOpenFollowUp}
      className={cn(
        "w-full flex items-center justify-between gap-3 rounded-xl border bg-card px-4 py-2.5 mb-4 text-left transition-colors",
        quickWins.length > 0 ? "border-chart-emerald/40 hover:border-chart-emerald/60" : "border-border hover:border-chart-destructive/40"
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        {quickWins.length > 0 ? (
          <>
            <Zap className="h-4 w-4 text-chart-emerald shrink-0" />
            <span className="text-sm font-semibold text-foreground shrink-0">{quickWins.length} quick win{quickWins.length > 1 ? "s" : ""}</span>
            <span className="text-xs text-muted-foreground truncate hidden sm:inline">
              {quickWins.slice(0, 3).map((c) => c.name.split(" ")[0]).join(", ")} — normally consistent, just cancelled recently. Easy rebooks.
            </span>
          </>
        ) : (
          <>
            <AlertCircle className="h-4 w-4 text-chart-destructive shrink-0" />
            <span className="text-sm font-semibold text-foreground shrink-0">{clients.length} need follow-up</span>
            <span className="text-xs text-muted-foreground truncate hidden sm:inline">
              {(["at_risk", "lapsed", "active"] as LifecycleStatus[]).filter((s) => counts[s]).map((s) => `${counts[s]} ${s === "at_risk" ? "at risk" : s === "lapsed" ? "lapsed" : "worth rebooking"}`).join(" · ")}
              {mostUrgent && ` — most urgent: ${mostUrgent.name.split(" ")[0]}`}
            </span>
          </>
        )}
      </div>
      <span className="flex items-center gap-1 text-[11px] font-medium text-foreground shrink-0">
        View Follow-up <ChevronRight className="h-3 w-3" />
      </span>
    </button>
  );
}
