import { useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Wand2, CalendarClock, AlertTriangle, Check, X, Plane, Search, Clock, Mail } from "lucide-react";
import { format } from "date-fns";
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";
import {
  autoDraftSchedule,
  computePreferredTime,
  computeCapacityInsights,
  parseAvailabilityText,
  type SchedulerClient,
  type OpenSlot,
  type BusyBlock,
  type Assignment,
  type Unplaced,
  type AvailabilityWindow,
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
  /** Emits the current draft so the parent can preview it on the fortnight calendar. */
  onDraftChange?: (assignments: Assignment[]) => void;
  /** Clients currently away, keyed by client key → until date + reason. */
  awayByKey?: Record<string, { until: string; reason: string | null }>;
  /** Set/clear a client's away status (untilISO null clears it). */
  onSetAway?: (key: string, untilISO: string | null, reason?: string) => void;
  /** The fortnight calendar, rendered between the controls and the review list. */
  calendarPreview?: ReactNode;
  /** Recorded scheduling prefs per client key: availability windows, note, cadence. */
  availabilityByKey?: Record<string, { windows: AvailabilityWindow[]; note: string | null; cadenceDays: number | null }>;
  /** Merge-save a client's scheduling prefs (only passed fields change). */
  onSavePrefs?: (
    key: string,
    patch: { windows?: AvailabilityWindow[]; note?: string | null; cadenceDays?: number | null },
  ) => void;
  /** Email a client the time they've been penciled in for. Resolves on success. */
  onEmailTimes?: (assignment: Assignment) => Promise<unknown>;
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
// Distinct, calm colours per weekday so the list is scannable by day.
const WEEKDAY_CHIP = [
  "bg-slate-500/15 text-slate-600 dark:text-slate-300",
  "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  "bg-slate-500/15 text-slate-600 dark:text-slate-300",
];

function cadenceLabel(days: number): string {
  if (days === 7) return "Weekly";
  if (days === 14) return "Fortnightly";
  if (days === 21) return "3-weekly";
  if (days === 28) return "Monthly";
  return `Every ${days}d`;
}

function fmtHHMM(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  return format(new Date(2000, 0, 1, h, m), "h:mma").toLowerCase();
}

function windowLabel(w: AvailabilityWindow): string {
  const dayPart = w.days.length === 0 ? "Any day" : w.days.map((d) => WEEKDAYS[d]).join("/");
  let timePart = "";
  if (w.from && w.to) timePart = `${fmtHHMM(w.from)}–${fmtHHMM(w.to)}`;
  else if (w.from) timePart = `from ${fmtHHMM(w.from)}`;
  else if (w.to) timePart = `until ${fmtHHMM(w.to)}`;
  return timePart ? `${dayPart} ${timePart}` : dayPart;
}

const DAY_TOGGLES = [
  { d: 1, l: "Mon" },
  { d: 2, l: "Tue" },
  { d: 3, l: "Wed" },
  { d: 4, l: "Thu" },
  { d: 5, l: "Fri" },
  { d: 6, l: "Sat" },
  { d: 0, l: "Sun" },
];

const CADENCE_OPTIONS: { label: string; days: number | null }[] = [
  { label: "Auto", days: null },
  { label: "Weekly", days: 7 },
  { label: "Fortnightly", days: 14 },
  { label: "3-weekly", days: 21 },
  { label: "Monthly", days: 28 },
];

function AvailabilityEditor({
  windows,
  note,
  cadenceDays,
  onSave,
}: {
  windows: AvailabilityWindow[];
  note: string | null;
  cadenceDays: number | null;
  onSave: (patch: { windows?: AvailabilityWindow[]; note?: string | null; cadenceDays?: number | null }) => void;
}) {
  const [days, setDays] = useState<number[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [text, setText] = useState(note ?? "");

  const toggleDay = (d: number) =>
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  const add = () => {
    onSave({ windows: [...windows, { days: [...days].sort(), from: from || null, to: to || null }] });
    setDays([]);
    setFrom("");
    setTo("");
  };

  const parseText = () => {
    const parsed = parseAvailabilityText(text);
    if (parsed.length === 0) return;
    onSave({ windows: parsed, note: text }); // replace windows with the parsed set + keep the raw note
  };

  return (
    <div className="mt-2 rounded-xl border border-border/60 bg-muted/20 p-2.5 space-y-2.5" onClick={(e) => e.stopPropagation()}>
      {/* Cadence */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 mr-0.5">Sees me</span>
        {CADENCE_OPTIONS.map((opt) => (
          <button
            key={opt.label}
            onClick={() => onSave({ cadenceDays: opt.days })}
            className={cn(
              "text-[10px] font-bold rounded-md px-1.5 py-0.5 border",
              (cadenceDays ?? null) === opt.days
                ? "bg-foreground text-background border-foreground"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {windows.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {windows.map((w, i) => (
            <span key={i} className="flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-semibold pl-2 pr-1 py-0.5">
              {windowLabel(w)}
              <button onClick={() => onSave({ windows: windows.filter((_, j) => j !== i) })} className="hover:text-rose-500">
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Paste-a-note shortcut */}
      <div className="space-y-1.5">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          placeholder={'Type it: "Wed anytime, Tue until 2pm, Fri anytime" or "any day from 5:30pm"'}
          className="w-full text-xs rounded-lg border border-border bg-background px-2 py-1.5 resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          onClick={parseText}
          disabled={!text.trim()}
          className="text-[11px] font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-full px-3 py-1 disabled:opacity-40"
        >
          Read from text
        </button>
      </div>

      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">or set manually</div>
      <div className="flex flex-wrap gap-1">
        {DAY_TOGGLES.map(({ d, l }) => (
          <button
            key={d}
            onClick={() => toggleDay(d)}
            className={cn(
              "text-[10px] font-bold rounded-md px-1.5 py-0.5 border",
              days.includes(d) ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {l}
          </button>
        ))}
        <span className="text-[10px] text-muted-foreground self-center ml-0.5">{days.length === 0 ? "= any day" : ""}</span>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] text-muted-foreground">from</span>
        <input type="time" value={from} onChange={(e) => setFrom(e.target.value)} className="text-xs rounded-md border border-border bg-background px-1.5 py-0.5" />
        <span className="text-[10px] text-muted-foreground">to</span>
        <input type="time" value={to} onChange={(e) => setTo(e.target.value)} className="text-xs rounded-md border border-border bg-background px-1.5 py-0.5" />
        <button
          onClick={add}
          disabled={!from && !to && days.length === 0}
          className="text-[11px] font-semibold text-white bg-emerald-600/90 hover:bg-emerald-600 rounded-full px-2.5 py-0.5 disabled:opacity-40"
        >
          Add window
        </button>
      </div>
      <p className="text-[10px] text-muted-foreground leading-snug">
        e.g. Nikki → any day, from 5:30pm. Maria → add "Wed" (any time), "Tue until 2:00pm", "Fri" (any time).
      </p>
    </div>
  );
}

function prefTimeText(pastSessions: Date[], timeKnown: boolean): string {
  const p = computePreferredTime(pastSessions);
  if (!p) return "";
  if (!timeKnown) return "time flexible";
  const h = Math.floor(p.minutesOfDay / 60);
  const m = p.minutesOfDay % 60;
  return format(new Date(2000, 0, 1, h, m), "h:mm a");
}

export default function AutoDraftPanel({
  clients,
  openSlots,
  busyBlocks,
  takenSlotStarts,
  fnhDurationMin,
  voiceDurationMin,
  onAccept,
  onDraftChange,
  awayByKey = {},
  onSetAway,
  calendarPreview,
  availabilityByKey = {},
  onSavePrefs,
  onEmailTimes,
}: AutoDraftPanelProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [awayEditKey, setAwayEditKey] = useState<string | null>(null);
  const [availEditKey, setAvailEditKey] = useState<string | null>(null);
  const [emailedKeys, setEmailedKeys] = useState<Set<string>>(new Set());
  const [emailingKey, setEmailingKey] = useState<string | null>(null);

  const emailOne = async (a: Assignment) => {
    if (!onEmailTimes || !a.email) return;
    setEmailingKey(a.clientId);
    try {
      await onEmailTimes(a);
      setEmailedKeys((prev) => new Set(prev).add(a.clientId));
    } finally {
      setEmailingKey(null);
    }
  };
  const [search, setSearch] = useState("");
  const [showNoHistory, setShowNoHistory] = useState(false);
  const [groupByKind, setGroupByKind] = useState(true);
  const [result, setResult] = useState<{ assignments: Assignment[]; unplaced: Unplaced[] } | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [acceptedKeys, setAcceptedKeys] = useState<Set<string>>(new Set());

  // Order by MOST-RECENT first (clients you've seen/scheduled lately float up),
  // then by how often you see them, then name. Away clients sink to the bottom.
  const sortedClients = useMemo(
    () =>
      [...clients].sort((a, b) => {
        const aAway = !!awayByKey[a.key];
        const bAway = !!awayByKey[b.key];
        if (aAway !== bAway) return aAway ? 1 : -1;
        const at = a.lastSessionAt?.getTime() ?? 0;
        const bt = b.lastSessionAt?.getTime() ?? 0;
        if (bt !== at) return bt - at;
        if (b.pastSessions.length !== a.pastSessions.length) {
          return b.pastSessions.length - a.pastSessions.length;
        }
        return a.name.localeCompare(b.name);
      }),
    [clients, awayByKey],
  );

  // Capacity insights — "open up more Thursdays" style nudges. Computed across
  // ALL clients (not just selected) so it reflects your whole overdue picture.
  const insights = useMemo(() => {
    const asScheduler: SchedulerClient[] = clients
      .filter((c) => !awayByKey[c.key]) // don't nag about clients who are away
      .map((c) => ({
      id: c.key,
      kind: c.kind,
      name: c.name,
      pastSessions: c.pastSessions,
      intervalDays: medianGapDays(c.pastSessions),
      lastSessionAt: c.lastSessionAt,
      timeKnown: c.timeKnown,
    }));
    return computeCapacityInsights(asScheduler, openSlots).slice(0, 3);
  }, [clients, openSlots, awayByKey]);

  const noHistoryCount = useMemo(
    () => sortedClients.filter((c) => c.pastSessions.length === 0).length,
    [sortedClients],
  );

  const visibleClients = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (q) return sortedClients.filter((c) => c.name.toLowerCase().includes(q));
    // Default: only clients with history (the actionable ones); toggle to reveal the rest.
    return showNoHistory ? sortedClients : sortedClients.filter((c) => c.pastSessions.length > 0);
  }, [sortedClients, search, showNoHistory]);

  const awayCount = useMemo(
    () => sortedClients.filter((c) => awayByKey[c.key]).length,
    [sortedClients, awayByKey],
  );

  const toggle = (key: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const selectAllShown = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      for (const c of visibleClients) if (!awayByKey[c.key]) next.add(c.key);
      return next;
    });

  const generate = () => {
    const chosen = clients.filter((c) => selected.has(c.key) && !awayByKey[c.key]);
    if (chosen.length === 0) {
      showError("Select at least one available client to draft.");
      return;
    }
    const schedulerClients: SchedulerClient[] = chosen.map((c) => ({
      id: c.key,
      kind: c.kind,
      name: c.name,
      email: c.email,
      pastSessions: c.pastSessions,
      // Explicit cadence (weekly/fortnightly/…) overrides the inferred median gap.
      intervalDays: availabilityByKey[c.key]?.cadenceDays ?? medianGapDays(c.pastSessions),
      lastSessionAt: c.lastSessionAt,
      durationMin: c.kind === "fnh" ? fnhDurationMin : voiceDurationMin,
      timeKnown: c.timeKnown,
      availability: availabilityByKey[c.key]?.windows,
    }));

    const res = autoDraftSchedule({
      clients: schedulerClients,
      openSlots,
      busyBlocks,
      takenSlotStarts,
      groupByKind,
    });
    setResult(res);
    setAcceptedKeys(new Set());
    onDraftChange?.(res.assignments);
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
      // Drop penciled-in items from the preview — they now exist as real proposals.
      onDraftChange?.(result.assignments.filter((a) => !done.has(a.clientId)));
      showSuccess(`Penciled in ${ok} session${ok === 1 ? "" : "s"} as drafts.`);
    } catch (e: any) {
      showError(e?.message || "Failed to save drafts.");
    } finally {
      setAccepting(false);
    }
  };

  const pendingCount = result ? result.assignments.filter((a) => !acceptedKeys.has(a.clientId)).length : 0;

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
        <div className="px-4 py-2.5 bg-muted/40 border-b border-border/50 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {selected.size} selected{awayCount > 0 && ` · ${awayCount} away`}
            </span>
            <div className="flex items-center gap-3">
              <button onClick={selectAllShown} className="text-[11px] font-semibold text-amber-600 hover:text-amber-700">
                Select shown
              </button>
              {selected.size > 0 && (
                <button onClick={() => setSelected(new Set())} className="text-[11px] font-semibold text-muted-foreground hover:text-foreground">
                  Clear
                </button>
              )}
            </div>
          </div>
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clients…"
              className="w-full text-sm rounded-lg border border-border bg-background pl-8 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 p-3 max-h-[26rem] overflow-y-auto">
          {visibleClients.map((c) => {
            const p = computePreferredTime(c.pastSessions);
            const timeText = prefTimeText(c.pastSessions, c.timeKnown);
            const noHistory = c.pastSessions.length === 0;
            const away = awayByKey[c.key];
            const editingAway = awayEditKey === c.key;
            const isSel = selected.has(c.key);
            return (
              <div
                key={c.key}
                onClick={() => !away && toggle(c.key)}
                className={cn(
                  "px-3 py-2.5 rounded-xl border transition-colors",
                  away
                    ? "bg-muted/20 opacity-70 border-border/40 cursor-default"
                    : isSel
                      ? "bg-amber-500/10 border-amber-500/40 cursor-pointer"
                      : "border-border/50 hover:border-border hover:bg-muted/30 cursor-pointer",
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Checkbox
                    checked={isSel}
                    disabled={!!away}
                    onClick={(e) => e.stopPropagation()}
                    onCheckedChange={() => toggle(c.key)}
                  />
                  <div
                    className={cn(
                      "w-8 h-8 rounded-xl text-white flex items-center justify-center text-xs font-bold shrink-0 bg-gradient-to-br",
                      c.kind === "voice" ? "from-rose-400 to-pink-500" : "from-indigo-400 to-violet-500",
                    )}
                  >
                    {(c.name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground truncate">{c.name}</span>
                      <span
                        className={cn(
                          "text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0 rounded-full shrink-0",
                          c.kind === "voice" ? "bg-rose-500/10 text-rose-500" : "bg-indigo-500/10 text-indigo-500",
                        )}
                      >
                        {c.kind === "voice" ? "Voice" : "FNH"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      {away ? (
                        <span className="text-xs text-rose-500 font-medium">
                          {away.until >= "2900-01-01"
                            ? "Off the books (indefinite)"
                            : `Away until ${format(new Date(away.until + "T00:00:00"), "d MMM")}`}
                        </span>
                      ) : noHistory ? (
                        <span className="text-xs text-amber-600">No history yet</span>
                      ) : (
                        <>
                          {p && (
                            <span className={cn("text-[10px] font-bold rounded px-1.5 py-0.5", WEEKDAY_CHIP[p.weekday])}>
                              {WEEKDAYS[p.weekday]}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {timeText}
                            {c.pastSessions.length > 0 && ` · ${c.pastSessions.length}×`}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Availability + away controls */}
                  {!away && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setAvailEditKey(availEditKey === c.key ? null : c.key); }}
                      title="Set availability (when they can come)"
                      className={cn(
                        "shrink-0 p-1 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-600",
                        (availabilityByKey[c.key]?.windows?.length || availEditKey === c.key) ? "text-emerald-600 bg-emerald-500/10" : "text-muted-foreground",
                      )}
                    >
                      <Clock size={14} />
                    </button>
                  )}
                  {away ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); onSetAway?.(c.key, null); }}
                      title="Mark as back / available"
                      className="text-[11px] font-semibold text-rose-500 hover:text-rose-600 shrink-0"
                    >
                      Back
                    </button>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); setAwayEditKey(editingAway ? null : c.key); }}
                      title="Mark away / off the books"
                      className={cn("shrink-0 p-1 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10", editingAway && "text-rose-500 bg-rose-500/10")}
                    >
                      <Plane size={14} />
                    </button>
                  )}
                </div>

                {/* Availability + cadence summary chips */}
                {!away && availEditKey !== c.key &&
                  ((availabilityByKey[c.key]?.windows?.length ?? 0) > 0 || availabilityByKey[c.key]?.cadenceDays != null) && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {availabilityByKey[c.key]?.cadenceDays != null && (
                        <span className="rounded-full bg-sky-500/10 text-sky-600 text-[10px] font-semibold px-2 py-0.5">
                          {cadenceLabel(availabilityByKey[c.key]!.cadenceDays!)}
                        </span>
                      )}
                      {(availabilityByKey[c.key]?.windows ?? []).map((w, i) => (
                        <span key={i} className="rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-semibold px-2 py-0.5">
                          {windowLabel(w)}
                        </span>
                      ))}
                    </div>
                  )}

                {availEditKey === c.key && !away && (
                  <AvailabilityEditor
                    windows={availabilityByKey[c.key]?.windows ?? []}
                    note={availabilityByKey[c.key]?.note ?? null}
                    cadenceDays={availabilityByKey[c.key]?.cadenceDays ?? null}
                    onSave={(patch) => onSavePrefs?.(c.key, patch)}
                  />
                )}

                {editingAway && !away && (
                  <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-[11px] text-muted-foreground">Away until</span>
                    <input
                      type="date"
                      className="text-xs rounded-lg border border-border bg-background px-2 py-1"
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => {
                        if (e.target.value) {
                          onSetAway?.(c.key, e.target.value);
                          setAwayEditKey(null);
                        }
                      }}
                    />
                    <span className="text-[11px] text-muted-foreground">or</span>
                    <button
                      onClick={() => {
                        onSetAway?.(c.key, "2999-01-01");
                        setAwayEditKey(null);
                      }}
                      className="text-[11px] font-semibold text-rose-500 hover:text-rose-600 rounded-full border border-rose-500/30 px-2 py-0.5"
                    >
                      Off the books indefinitely
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          {visibleClients.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              {search ? "No clients match your search." : "No clients with history yet."}
            </div>
          )}
        </div>
        {!search && noHistoryCount > 0 && (
          <button
            onClick={() => setShowNoHistory((v) => !v)}
            className="w-full px-4 py-2 text-[11px] font-semibold text-muted-foreground hover:text-foreground bg-muted/30 border-t border-border/40"
          >
            {showNoHistory ? "Hide" : "Show"} {noHistoryCount} client{noHistoryCount === 1 ? "" : "s"} with no history yet
          </button>
        )}
      </div>

      {/* Selected clients as removable chips */}
      {selected.size > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {clients
            .filter((c) => selected.has(c.key))
            .map((c) => (
              <button
                key={c.key}
                onClick={() => toggle(c.key)}
                className="group flex items-center gap-1 rounded-full bg-muted/60 hover:bg-rose-500/10 pl-2.5 pr-1.5 py-0.5 text-xs font-medium text-foreground transition-colors"
                title="Remove from draft"
              >
                {c.name}
                <X size={11} className="text-muted-foreground group-hover:text-rose-500" />
              </button>
            ))}
        </div>
      )}

      <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
        <Checkbox checked={groupByKind} onCheckedChange={(v) => setGroupByKind(!!v)} />
        Batch same type together (voice with voice, FNH with FNH)
      </label>

      <Button
        onClick={generate}
        disabled={selected.size === 0}
        className="w-full rounded-full bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-500 hover:to-rose-600 text-white border-none shadow-sm active:scale-[0.99] transition-transform"
      >
        <Wand2 className="h-4 w-4 mr-2" />
        {selected.size > 0 ? `Draft ${selected.size} client${selected.size === 1 ? "" : "s"}` : "Generate draft timetable"}
      </Button>

      {/* Calendar preview — your commitments + the blue draft, between controls and review */}
      {calendarPreview}

      {/* Results — the review list, under the calendar */}
      {result && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-sm font-bold text-foreground">
                {result.assignments.length > 0
                  ? `Here's what I came up with — ${result.assignments.length} placed`
                  : "I couldn't place anyone with the current openings"}
              </p>
              {result.unplaced.length > 0 && (
                <p className="text-xs text-amber-600 mt-0.5">{result.unplaced.length} still need a slot (see below)</p>
              )}
            </div>
            {pendingCount > 0 && (
              <Button
                size="sm"
                onClick={acceptAll}
                disabled={accepting}
                className="rounded-full h-8 text-xs bg-chart-emerald/90 hover:bg-chart-emerald text-white border-none"
              >
                {accepting ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1.5" />}
                Pencil in all ({pendingCount})
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
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
                {onEmailTimes && a.email && (
                  emailedKeys.has(a.clientId) ? (
                    <span className="text-[10px] font-semibold text-chart-emerald shrink-0 flex items-center gap-1">
                      <Check size={12} /> Emailed
                    </span>
                  ) : (
                    <button
                      onClick={() => emailOne(a)}
                      disabled={emailingKey === a.clientId}
                      title="Email this client their proposed time"
                      className="shrink-0 flex items-center gap-1 text-[10px] font-semibold text-sky-600 hover:text-sky-700 rounded-full border border-sky-500/30 px-2 py-0.5 disabled:opacity-50"
                    >
                      {emailingKey === a.clientId ? <Loader2 size={11} className="animate-spin" /> : <Mail size={11} />}
                      Email
                    </button>
                  )
                )}
              </div>
            );
          })}
          </div>

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
