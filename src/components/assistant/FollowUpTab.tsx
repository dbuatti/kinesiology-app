import { useEffect, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { isVoiceStudentId } from "@/lib/voice-student-id";
import { LifecycleStatus } from "@/lib/clientStatus";
import ClientLifecycleBadge from "@/components/crm/ClientLifecycleBadge";
import { fetchNeedsAttention, assistantPromptFor, AttentionClient } from "@/lib/needsAttention";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/shared/EmptyState";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Mail, MessageCircle, Mic, Zap, MoreHorizontal, BellOff, Bell, ArrowUpRight, CalendarPlus, PartyPopper } from "lucide-react";
import { showSuccess } from "@/utils/toast";

type Filter = LifecycleStatus | "all" | "quick_win";

const SNOOZE_KEY = "rk_followup_snoozed";
type SnoozeMap = Record<string, number>; // id → snoozed-until epoch ms

const readSnoozes = (): SnoozeMap => {
  try {
    const raw = JSON.parse(localStorage.getItem(SNOOZE_KEY) || "{}") as SnoozeMap;
    const now = Date.now();
    return Object.fromEntries(Object.entries(raw).filter(([, until]) => until > now));
  } catch {
    return {};
  }
};

/**
 * Follow-up as a triage queue: quick wins first, then who's drifting. Each
 * row shows why they're here and how long it's been, with one-tap Book /
 * Email. "Snooze" parks someone for a week (on this device) so the list only
 * ever holds people you still need to act on.
 */
export default function FollowUpTab() {
  const [clients, setClients] = useState<AttentionClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [snoozed, setSnoozed] = useState<SnoozeMap>(readSnoozes);
  const [showSnoozed, setShowSnoozed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setClients(await fetchNeedsAttention());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const persist = (next: SnoozeMap) => {
    setSnoozed(next);
    try { localStorage.setItem(SNOOZE_KEY, JSON.stringify(next)); } catch { /* private mode */ }
  };
  const snooze = (c: AttentionClient, days: number) => {
    persist({ ...snoozed, [c.id]: Date.now() + days * 86_400_000 });
    showSuccess(`${c.name.split(" ")[0]} snoozed for ${days === 1 ? "a day" : `${days} days`}`);
  };
  const unsnooze = (c: AttentionClient) => {
    const next = { ...snoozed };
    delete next[c.id];
    persist(next);
  };

  const live = useMemo(() => clients.filter((c) => showSnoozed || !snoozed[c.id]), [clients, snoozed, showSnoozed]);
  const counts = live.reduce((acc, c) => { acc[c.status] = (acc[c.status] || 0) + 1; return acc; }, {} as Record<LifecycleStatus, number>);
  const quickWinCount = live.filter((c) => c.isQuickWin).length;
  const snoozedCount = clients.filter((c) => snoozed[c.id]).length;
  const shown = filter === "all" ? live : filter === "quick_win" ? live.filter((c) => c.isQuickWin) : live.filter((c) => c.status === filter);

  const filters: { id: Filter; label: string; count: number; icon?: typeof Zap }[] = [
    { id: "all", label: "Everyone", count: live.length },
    ...(quickWinCount > 0 ? [{ id: "quick_win" as Filter, label: "Quick wins", count: quickWinCount, icon: Zap }] : []),
    { id: "at_risk", label: "At risk", count: counts.at_risk || 0 },
    { id: "lapsed", label: "Lapsed", count: counts.lapsed || 0 },
    { id: "active", label: "Worth rebooking", count: counts.active || 0 },
  ];

  if (loading) {
    return (
      <div className="space-y-2 py-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[72px] rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 py-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="no-scrollbar -mx-1 flex items-center gap-1 overflow-x-auto px-1">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium transition-colors",
                filter === f.id ? "bg-foreground/[0.07] text-foreground" : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground",
                f.id === "quick_win" && filter !== f.id && "text-chart-emerald"
              )}
            >
              {f.icon && <f.icon className="h-3.5 w-3.5" />}
              {f.label}
              <span className="text-xs tabular-nums opacity-60">{f.count}</span>
            </button>
          ))}
        </div>
        {snoozedCount > 0 && (
          <button
            onClick={() => setShowSnoozed((v) => !v)}
            className="inline-flex h-8 items-center gap-1.5 self-start rounded-lg px-2.5 text-[13px] text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground sm:ml-auto"
          >
            <BellOff className="h-3.5 w-3.5" /> {showSnoozed ? "Hide" : "Show"} {snoozedCount} snoozed
          </button>
        )}
      </div>

      {shown.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card">
          <EmptyState
            icon={PartyPopper}
            title={live.length === 0 ? "Everyone’s looked after" : "Nobody in this bucket"}
            description={live.length === 0 ? "No one needs a follow-up right now. Nice." : "Try another filter above."}
          />
        </div>
      ) : (
        <ul className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
          {shown.map((c, i) => {
            const voice = isVoiceStudentId(c.id);
            const initials = c.name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
            const days = c.daysSinceLast;
            // A quiet visual for "how long has it been": fills over ~12 weeks.
            const drift = days == null ? 0 : Math.min(1, days / 84);
            const isSnoozed = !!snoozed[c.id];
            const bookHref = voice
              ? `/assistant?client=${encodeURIComponent(c.id)}&prompt=${encodeURIComponent(assistantPromptFor(c))}`
              : `/clients/${c.id}/hub?prompt=${encodeURIComponent(assistantPromptFor(c))}`;
            const emailHref = voice ? `/assistant?client=${encodeURIComponent(c.id)}&view=email` : `/clients/${c.id}/hub?view=email`;
            return (
              <li
                key={c.id}
                className={cn(
                  "group flex flex-col gap-3 px-4 py-3.5 transition-colors hover:bg-foreground/[0.015] sm:flex-row sm:items-center",
                  i > 0 && "border-t border-border",
                  isSnoozed && "opacity-60"
                )}
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span
                    className={cn(
                      "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                      c.kind === "voice" ? "bg-chart-destructive/10 text-chart-destructive" : "bg-primary/10 text-primary"
                    )}
                  >
                    {initials}
                    {c.isQuickWin && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-chart-emerald text-white ring-2 ring-card">
                        <Zap className="h-2.5 w-2.5" />
                      </span>
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {voice ? (
                        <span className="truncate text-sm font-medium text-foreground blur-sensitive">{c.name}</span>
                      ) : (
                        <Link to={`/clients/${c.id}/hub`} className="truncate text-sm font-medium text-foreground hover:text-primary blur-sensitive">
                          {c.name}
                        </Link>
                      )}
                      {c.kind === "voice" && <Mic className="h-3 w-3 shrink-0 text-chart-destructive" />}
                      <ClientLifecycleBadge status={c.status} />
                      {isSnoozed && <span className="text-[11px] text-muted-foreground">snoozed</span>}
                    </div>
                    <p className="mt-0.5 truncate text-[13px] text-muted-foreground">{c.reason}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 pl-[52px] sm:pl-0">
                  <div className="hidden w-28 md:block" title={days != null ? `${days} days since last session` : "No sessions yet"}>
                    <div className="h-1 overflow-hidden rounded-full bg-foreground/[0.07]">
                      <div
                        className={cn("h-full rounded-full", drift > 0.66 ? "bg-chart-destructive" : drift > 0.33 ? "bg-chart-amber" : "bg-chart-emerald")}
                        style={{ width: `${Math.max(drift * 100, 6)}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[11px] tabular-nums text-muted-foreground">
                      {days == null ? "No sessions yet" : days === 0 ? "Seen today" : `${days}d since last`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button asChild size="sm" className="gap-1.5">
                      <Link to={bookHref}>
                        {c.status === "active" ? <CalendarPlus className="h-3.5 w-3.5" /> : <MessageCircle className="h-3.5 w-3.5" />}
                        {c.status === "active" ? "Book" : "Reach out"}
                      </Link>
                    </Button>
                    {c.email && (
                      <Button asChild size="sm" variant="outline" className="w-8 px-0" title={`Email ${c.name}`}>
                        <Link to={emailHref} aria-label={`Email ${c.name}`}><Mail className="h-3.5 w-3.5" /></Link>
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost" className="w-8 px-0 text-muted-foreground" aria-label="More">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {isSnoozed ? (
                          <DropdownMenuItem onSelect={() => unsnooze(c)}><Bell className="mr-2 h-4 w-4" /> Unsnooze</DropdownMenuItem>
                        ) : (
                          <>
                            <DropdownMenuItem onSelect={() => snooze(c, 1)}><BellOff className="mr-2 h-4 w-4" /> Snooze until tomorrow</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => snooze(c, 7)}><BellOff className="mr-2 h-4 w-4" /> Snooze for a week</DropdownMenuItem>
                          </>
                        )}
                        {!voice && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link to={`/clients/${c.id}`}><ArrowUpRight className="mr-2 h-4 w-4" /> Open profile</Link>
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
