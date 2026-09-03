import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Wand2, CalendarClock, AlertTriangle, Check, X } from "lucide-react";
import { format } from "date-fns";
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";
import {
  autoDraftSchedule,
  computePreferredTime,
  computeCapacityInsights,
  type SchedulerClient,
  type OpenSlot,
  type BusyBlock,
  type Assignment,
  type Unplaced,
} from "@/utils/timetable-scheduler";
import { Lightbulb } from "lucide-react";

// ── Inputs from the parent page (already-loaded data) ────────────────────────
export interface AutoDraftClient {
  key: string; // "fnh:<id>" or "voice:<email>"
  kind: "fnh" | "voice";
  id: string; // client_id (fnh) or email (voice)
  name: string;
  email: string | null;
  pastSessions: Date[];
  lastSessionAt: Date | null;
  timeKnown: boolean;
}

interface AutoDraftPanelProps {
  clients: AutoDraftClient[];
  openSlots: OpenSlot[];
  busyBlocks: BusyBlock[];
  takenSlotStarts: string[];
  fnhDurationMin: number;
  voiceDurationMin: number;
  onAccept: (input: {
    kind: "fnh" | "voice";
    clientId?: string | null;
    studentName?: string | null;
    studentEmail?: string | null;
    slotStart: string;
    slotEnd: string;
  }) => Promise<unknown>;
}

// Median gap (days) between consecutive sessions — a simple cadence estimate.
function medianGapDays(dates: Date[]): number | null {
  if (dates.length < 2) return null;
  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    gaps.push((sorted[i].getTime() - sorted[i - 1].getTime()) / 86_400_000);
  }
  gaps.sort((a, b) => a - b);
  const mid = Math.floor(gaps.length / 2);
  const val = gaps.length % 2 ? gaps[mid] : (gaps[mid - 1] + gaps[mid]) / 2;
  return val >= 3 && val <= 180 ? Math.round(val) : null;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function prefLabel(pastSessions: Date[], timeKnown: boolean): string {
  const p = computePreferredTime(pastSessions);
  if (!p) return "No history yet";
  if (!timeKnown) return `Usually ${WEEKDAYS[p.weekday]} · time flexible`;
  const h = Math.floor(p.minutesOfDay / 60);
  const m = p.minutesOfDay % 60;
  const t = format(new Date(2000, 0, 1, h, m), "h:mm a");
  return `Usually ${WEEKDAYS[p.weekday]} ~${t}`;
}

export default function AutoDraftPanel({
  clients,
  openSlots,
  busyBlocks,
  takenSlotStarts,
  fnhDurationMin,
  voiceDurationMin,
  onAccept,
}: AutoDraftPanelProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<{ assignments: Assignment[]; unplaced: Unplaced[] } | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [acceptedKeys, setAcceptedKeys] = useState<Set<string>>(new Set());

  // Order by most-seen, then most-recent — the clients you work with most and
  // most recently float to the top of the picker.
  const sortedClients = useMemo(
    () =>
      [...clients].sort((a, b) => {
        if (b.pastSessions.length !== a.pastSessions.length) {
          return b.pastSessions.length - a.pastSessions.length;
        }
        const at = a.lastSessionAt?.getTime() ?? 0;
        const bt = b.lastSessionAt?.getTime() ?? 0;
        if (bt !== at) return bt - at;
        return a.name.localeCompare(b.name);
      }),
    [clients],
  );

  // Capacity insights — "open up more Thursdays" style nudges. Computed across
  // ALL clients (not just selected) so it reflects your whole overdue picture.
  const insights = useMemo(() => {
    const asScheduler: SchedulerClient[] = clients.map((c) => ({
      id: c.key,
      kind: c.kind,
      name: c.name,
      pastSessions: c.pastSessions,
      intervalDays: medianGapDays(c.pastSessions),
      lastSessionAt: c.lastSessionAt,
      timeKnown: c.timeKnown,
    }));
    return computeCapacityInsights(asScheduler, openSlots).slice(0, 3);
  }, [clients, openSlots]);

  const toggle = (key: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const generate = () => {
    const chosen = clients.filter((c) => selected.has(c.key));
    if (chosen.length === 0) {
      showError("Select at least one client to draft.");
      return;
    }
    const schedulerClients: SchedulerClient[] = chosen.map((c) => ({
      id: c.key,
      kind: c.kind,
      name: c.name,
      email: c.email,
      pastSessions: c.pastSessions,
      intervalDays: medianGapDays(c.pastSessions),
      lastSessionAt: c.lastSessionAt,
      durationMin: c.kind === "fnh" ? fnhDurationMin : voiceDurationMin,
      timeKnown: c.timeKnown,
    }));

    const res = autoDraftSchedule({
      clients: schedulerClients,
      openSlots,
      busyBlocks,
      takenSlotStarts,
    });
    setResult(res);
    setAcceptedKeys(new Set());
  };

  const acceptAll = async () => {
    if (!result) return;
    setAccepting(true);
    let ok = 0;
    const done = new Set(acceptedKeys);
    try {
      for (const a of result.assignments) {
        if (done.has(a.clientId)) continue;
        const original = clients.find((c) => c.key === a.clientId);
        try {
          await onAccept({
            kind: a.kind,
            clientId: a.kind === "fnh" ? original?.id ?? null : null,
            studentName: a.kind === "voice" ? a.name : null,
            studentEmail: a.kind === "voice" ? a.email ?? original?.id ?? null : null,
            slotStart: a.slotStart.toISOString(),
            slotEnd: a.slotEnd.toISOString(),
          });
          done.add(a.clientId);
          ok++;
        } catch (e) {
          console.error("Failed to pencil in", a.name, e);
        }
      }
      setAcceptedKeys(done);
      showSuccess(`Penciled in ${ok} session${ok === 1 ? "" : "s"} as drafts.`);
    } catch (e: any) {
      showError(e?.message || "Failed to save drafts.");
    } finally {
      setAccepting(false);
    }
  };

  const pendingCount = result ? result.assignments.filter((a) => !acceptedKeys.has(a.clientId)).length : 0;

  // Group the draft by day for the visual calendar strip.
  const draftDays = useMemo(() => {
    if (!result) return [];
    const map = new Map<string, Assignment[]>();
    for (const a of result.assignments) {
      const key = format(a.slotStart, "yyyy-MM-dd");
      const arr = map.get(key) ?? [];
      arr.push(a);
      map.set(key, arr);
    }
    return [...map.entries()]
      .sort((x, y) => x[0].localeCompare(y[0]))
      .map(([key, items]) => ({
        key,
        date: items[0].slotStart,
        items: items.sort((p, q) => p.slotStart.getTime() - q.slotStart.getTime()),
      }));
  }, [result]);

  return (
    <div className="space-y-4">
      {/* Capacity insights */}
      {insights.length > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-rose-500/5 p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600">
            <Lightbulb size={14} /> Where to open up
          </div>
          {insights.map((ins) => (
            <p key={ins.weekday} className="text-sm text-foreground leading-relaxed">
              {ins.message}
            </p>
          ))}
        </div>
      )}

      {/* Client picker */}
      <div className="rounded-2xl border border-border/60 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 bg-muted/40 border-b border-border/50">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Choose clients to place ({selected.size})
          </span>
          {selected.size > 0 && (
            <button onClick={() => setSelected(new Set())} className="text-[11px] font-semibold text-muted-foreground hover:text-foreground">
              Clear
            </button>
          )}
        </div>
        <div className="max-h-64 overflow-y-auto divide-y divide-border/30">
          {sortedClients.map((c) => {
            const pref = prefLabel(c.pastSessions, c.timeKnown);
            const noHistory = c.pastSessions.length === 0;
            return (
              <label
                key={c.key}
                className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-muted/30 transition-colors"
              >
                <Checkbox checked={selected.has(c.key)} onCheckedChange={() => toggle(c.key)} />
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-rose-400 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {(c.name || "?").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground truncate">{c.name}</span>
                    <Badge
                      className={cn(
                        "text-[9px] font-semibold uppercase tracking-wider border-none px-1.5 py-0 rounded-full",
                        c.kind === "voice" ? "bg-chart-destructive/10 text-chart-destructive" : "bg-chart-primary/10 text-chart-primary",
                      )}
                    >
                      {c.kind === "voice" ? "Voice" : "FNH"}
                    </Badge>
                  </div>
                  <div className={cn("text-xs mt-0.5", noHistory ? "text-amber-600" : "text-muted-foreground")}>
                    {pref}
                    {c.pastSessions.length > 0 && ` · ${c.pastSessions.length} past`}
                  </div>
                </div>
              </label>
            );
          })}
          {sortedClients.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">No clients loaded.</div>
          )}
        </div>
      </div>

      <Button
        onClick={generate}
        disabled={selected.size === 0}
        className="w-full rounded-full bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-500 hover:to-rose-600 text-white border-none shadow-sm active:scale-[0.99] transition-transform"
      >
        <Wand2 className="h-4 w-4 mr-2" />
        Generate draft timetable
      </Button>

      {/* Results */}
      {result && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Draft · {result.assignments.length} placed
              {result.unplaced.length > 0 && `, ${result.unplaced.length} need a slot`}
            </span>
            {pendingCount > 0 && (
              <Button
                size="sm"
                onClick={acceptAll}
                disabled={accepting}
                className="rounded-full h-7 text-xs bg-chart-emerald/90 hover:bg-chart-emerald text-white border-none"
              >
                {accepting ? <Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> : <Check className="h-3 w-3 mr-1.5" />}
                Pencil in all ({pendingCount})
              </Button>
            )}
          </div>

          {/* Visual mock-up: draft placed on a day strip */}
          {draftDays.length > 0 && (
            <div className="overflow-x-auto -mx-1 px-1 pb-1">
              <div className="flex gap-2 min-w-min">
                {draftDays.map((day) => (
                  <div key={day.key} className="w-36 shrink-0 rounded-2xl border border-border/60 bg-muted/20 overflow-hidden">
                    <div className="px-3 py-2 bg-muted/50 border-b border-border/40 text-center">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{format(day.date, "EEE")}</div>
                      <div className="text-sm font-serif font-bold text-foreground">{format(day.date, "d MMM")}</div>
                    </div>
                    <div className="p-1.5 space-y-1.5">
                      {day.items.map((a) => (
                        <div
                          key={a.clientId}
                          className={cn(
                            "rounded-xl px-2 py-1.5 border-l-2",
                            a.kind === "voice"
                              ? "bg-chart-destructive/5 border-l-chart-destructive"
                              : "bg-chart-primary/5 border-l-chart-primary",
                            acceptedKeys.has(a.clientId) && "ring-1 ring-chart-emerald/40",
                          )}
                          title={a.reason}
                        >
                          <div className="text-[11px] font-bold text-foreground leading-tight">{format(a.slotStart, "h:mm a")}</div>
                          <div className="text-[11px] text-muted-foreground truncate">{a.name}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.assignments.map((a) => {
            const accepted = acceptedKeys.has(a.clientId);
            return (
              <div
                key={a.clientId}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-2xl border transition-colors",
                  accepted ? "border-chart-emerald/30 bg-chart-emerald/5" : "border-border/60 bg-card",
                )}
              >
                <CalendarClock size={16} className={cn("shrink-0", a.lowConfidence ? "text-amber-500" : "text-chart-emerald")} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground truncate">{a.name}</span>
                    {a.lowConfidence && (
                      <Badge className="text-[9px] font-semibold uppercase tracking-wider border-none px-1.5 py-0 rounded-full bg-amber-500/10 text-amber-600">
                        guess
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {format(a.slotStart, "EEE d MMM · h:mm a")} — {a.reason}
                  </div>
                </div>
                {accepted && <Check size={16} className="text-chart-emerald shrink-0" />}
              </div>
            );
          })}

          {result.unplaced.length > 0 && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600">
                <AlertTriangle size={13} /> Couldn't place
              </div>
              {result.unplaced.map((u) => (
                <div key={u.clientId} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <X size={12} className="mt-0.5 shrink-0 text-amber-500" />
                  <span>
                    <span className="font-semibold text-foreground">{u.name}</span> — {u.reason}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
