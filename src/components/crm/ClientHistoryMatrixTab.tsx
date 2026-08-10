import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import {
  LayoutGrid, Star, FileText, Baby, Zap, Dumbbell, Brain, Calendar,
} from "lucide-react";
import { Appointment } from "@/types/crm";
import { parsePattern, parseSideFromName, isInhibitedStatus } from "@/components/crm/v2/v2-utils";

const CATEGORIES: {
  key: string;
  label: string;
  dot: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
}[] = [
  { key: "primitiveReflexes", label: "Primitive Reflexes", dot: "bg-chart-primary", Icon: Baby },
  { key: "cranialNerves", label: "Cranial Nerves", dot: "bg-chart-destructive", Icon: Zap },
  { key: "muscles", label: "Muscles", dot: "bg-chart-emerald", Icon: Dumbbell },
  { key: "brainZones", label: "Brain Zones", dot: "bg-foreground", Icon: Brain },
];

interface ClientHistoryMatrixTabProps {
  clientName: string;
  appointments: Appointment[];
}

interface MatrixSession {
  app: Appointment;
  date: Date;
  statuses: Map<string, string>;
  priorities: Map<string, string>;
}

interface MatrixRow {
  key: string;
  catKey: string;
  fullName: string;
  displayName: string;
  side?: "L" | "R";
}

type Tone = "inhibited" | "clear" | "unsure" | "other";

const toneOf = (status: string | undefined): Tone | null => {
  if (!status) return null;
  if (isInhibitedStatus(status)) return "inhibited";
  if (status === "Clear") return "clear";
  if (status === "Unsure") return "unsure";
  return "other";
};

const StatusCell = ({ status, priority }: { status?: string; priority?: boolean }) => {
  const tone = toneOf(status);
  if (!tone) {
    return (
      <span className="text-muted-foreground/25 text-xs" title="Not recorded in this session">
        —
      </span>
    );
  }
  return (
    <span
      title={`${status}${priority ? " · Priority" : ""}`}
      className={cn(
        "relative inline-flex h-7 w-7 items-center justify-center rounded-md border text-[10px] font-black",
        tone === "inhibited" && "border-chart-destructive/40 bg-chart-destructive/15 text-chart-destructive",
        tone === "clear" && "border-chart-emerald/40 bg-chart-emerald/15 text-chart-emerald",
        tone === "unsure" && "border-yellow-400/50 bg-yellow-100/60 text-yellow-700",
        tone === "other" && "border-border bg-muted/40 text-muted-foreground"
      )}
    >
      {tone === "inhibited" ? "I" : tone === "clear" ? "C" : status?.charAt(0).toUpperCase()}
      {priority && <Star size={9} className="absolute -top-1.5 -right-1.5 text-chart-primary fill-chart-primary" />}
    </span>
  );
};

const NoteCell = ({ value }: { value?: string | null }) => (
  <td className="px-4 py-2 align-top text-xs leading-relaxed text-foreground/80 whitespace-pre-line min-w-[220px]">
    {value ? value : <span className="text-muted-foreground/40">—</span>}
  </td>
);

const ClientHistoryMatrixTab = ({ clientName, appointments }: ClientHistoryMatrixTabProps) => {
  const navigate = useNavigate();

  const sessions = useMemo<MatrixSession[]>(() => {
    return appointments
      .slice()
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map((app) => {
        const pattern = parsePattern(app.priority_pattern);
        const statuses = new Map<string, string>();
        const priorities = new Map<string, string>();
        Object.entries(pattern).forEach(([cat, items]) => {
          if (cat === "priorities") {
            Object.entries(items || {}).forEach(([k, v]) => {
              const match = k.match(/^([^|]+)\|(.+)$/);
              if (match && match[1] !== "stim") priorities.set(`${match[1]}::${match[2]}`, String(v));
            });
            return;
          }
          Object.entries(items || {}).forEach(([fullName, status]) => {
            statuses.set(`${cat}::${fullName}`, String(status));
          });
        });
        return { app, date: app.date, statuses, priorities };
      });
  }, [appointments]);

  const rows = useMemo<MatrixRow[]>(() => {
    const seen = new Set<string>();
    sessions.forEach((s) => s.statuses.forEach((_, k) => seen.add(k)));
    const order = new Map(CATEGORIES.map((c, i) => [c.key, i]));
    const all: MatrixRow[] = [];
    seen.forEach((key) => {
      const sep = key.indexOf("::");
      const catKey = key.slice(0, sep);
      const fullName = key.slice(sep + 2);
      const { baseName, side } = parseSideFromName(fullName);
      all.push({
        key,
        catKey,
        fullName,
        displayName: `${baseName}${side ? ` (${side})` : ""}`,
        side,
      });
    });
    return all
      .filter((r) => order.has(r.catKey))
      .sort((a, b) => {
        const catDiff = (order.get(a.catKey) ?? 99) - (order.get(b.catKey) ?? 99);
        if (catDiff !== 0) return catDiff;
        return a.displayName.localeCompare(b.displayName);
      });
  }, [sessions]);

  const totals = useMemo(() => {
    let marks = 0;
    let clears = 0;
    sessions.forEach((s) =>
      s.statuses.forEach((v) => {
        if (isInhibitedStatus(v)) marks++;
        else if (v === "Clear") clears++;
      })
    );
    return { sessions: sessions.length, findings: rows.length, marks, clears };
  }, [sessions, rows]);

  const sessionInhibitedCount = (s: MatrixSession) => {
    let n = 0;
    s.statuses.forEach((v) => {
      if (isInhibitedStatus(v)) n++;
    });
    return n;
  };

  const hasAnyNotes = sessions.some(
    (s) => s.app.notes || s.app.goal || s.app.session_north_star || s.app.next_session_note
  );

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="bg-gradient-to-r from-chart-primary/10 via-transparent to-transparent p-6 border-b border-border/50 flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-chart-primary/10 flex items-center justify-center text-chart-primary shrink-0">
            <LayoutGrid size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold text-foreground tracking-tight">Session History Matrix</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Every finding captured across {clientName}'s sessions — inhibited, cleared, or not yet recorded.
            </p>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-center">
              <p className="text-2xl font-black text-chart-primary tabular-nums leading-none">{totals.sessions}</p>
              <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Sessions</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <p className="text-2xl font-black text-foreground tabular-nums leading-none">{totals.findings}</p>
              <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Findings</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <p className="text-2xl font-black text-chart-destructive tabular-nums leading-none">{totals.marks}</p>
              <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Inhibited Marks</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <p className="text-2xl font-black text-chart-emerald tabular-nums leading-none">{totals.clears}</p>
              <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Cleared</p>
            </div>
          </div>
        </div>

        {sessions.length === 0 || rows.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-muted flex items-center justify-center text-muted-foreground/40 mb-4">
              <LayoutGrid size={28} />
            </div>
            <p className="text-sm font-medium text-foreground">No findings recorded yet.</p>
            <p className="mt-1 text-xs text-muted-foreground/70 max-w-sm mx-auto">
              Findings are captured during sessions in the pathway grid and assessments. They'll appear here as a
              history matrix once recorded.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table className="min-w-[640px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 z-20 bg-muted/60 backdrop-blur min-w-[220px]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Finding</span>
                    </TableHead>
                    {sessions.map((s) => (
                      <TableHead key={s.app.id} className="px-1 py-2 text-center align-bottom">
                        <button
                          type="button"
                          onClick={() => navigate(`/appointments/${s.app.id}`)}
                          className="inline-flex flex-col items-center gap-0.5 px-1 py-1 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                          title={`${format(s.date, "EEEE, MMMM d, yyyy")} — open session`}
                        >
                          <span className="text-[11px] font-black text-foreground tabular-nums leading-none">
                            {format(s.date, "d MMM")}
                          </span>
                          <span className="text-[9px] font-medium text-muted-foreground/60 tabular-nums leading-none">
                            {format(s.date, "yyyy")}
                          </span>
                        </button>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {CATEGORIES.map((cat) => {
                    const catRows = rows.filter((r) => r.catKey === cat.key);
                    if (catRows.length === 0) return null;
                    return (
                      <TableRow key={cat.key} className="bg-muted/30 hover:bg-muted/30">
                        <TableCell
                          colSpan={sessions.length + 1}
                          className="px-4 py-2"
                        >
                          <div className="flex items-center gap-2">
                            <cat.Icon size={13} className="text-muted-foreground" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              {cat.label}
                            </span>
                            <span className={cn("h-1.5 w-1.5 rounded-full", cat.dot)} />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {rows.map((row) => {
                    const cat = CATEGORIES.find((c) => c.key === row.catKey);
                    return (
                      <TableRow key={row.key}>
                        <TableCell className="sticky left-0 z-10 bg-card px-4 py-1.5">
                          <div className="flex items-center gap-2.5">
                            <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", cat?.dot)} />
                            <span className="text-xs font-medium text-foreground whitespace-nowrap">
                              {row.displayName}
                            </span>
                          </div>
                        </TableCell>
                        {sessions.map((s) => (
                          <TableCell key={s.app.id} className="px-1 py-1.5 text-center">
                            <StatusCell
                              status={s.statuses.get(row.key)}
                              priority={!!s.priorities.get(row.key)}
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell className="sticky left-0 z-10 bg-muted/60 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Inhibited
                    </TableCell>
                    {sessions.map((s) => (
                      <TableCell key={s.app.id} className="px-1 py-2 text-center text-xs font-black text-chart-destructive tabular-nums">
                        {sessionInhibitedCount(s)}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableFooter>
              </Table>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-5 py-2.5 bg-muted/30 border-t border-border/50 text-[11px] font-medium text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded border border-chart-destructive/40 bg-chart-destructive/15 text-chart-destructive text-[9px] font-black">I</span>
                Inhibited / active
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded border border-chart-emerald/40 bg-chart-emerald/15 text-chart-emerald text-[9px] font-black">C</span>
                Cleared
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Star size={12} className="text-chart-primary fill-chart-primary" /> Priority
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="text-muted-foreground/40">—</span> Not recorded
              </span>
            </div>
          </>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border/50 flex items-center gap-3">
          <FileText size={18} className="text-chart-primary" />
          <h3 className="text-sm font-semibold text-foreground tracking-tight">Session Notes</h3>
          <span className="text-[10px] font-medium text-muted-foreground ml-1">
            ({sessions.length} {sessions.length === 1 ? "session" : "sessions"})
          </span>
        </div>
        {!hasAnyNotes ? (
          <div className="px-5 py-10 text-center">
            <p className="text-xs font-medium text-muted-foreground">No session notes recorded for {clientName} yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-36 min-w-[120px]">Date</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Goal</TableHead>
                  <TableHead>North Star</TableHead>
                  <TableHead className="w-72 min-w-[240px]">Next Session Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions
                  .slice()
                  .reverse()
                  .map((s) => (
                    <TableRow key={s.app.id}>
                      <td className="px-4 py-2 align-top">
                        <div className="flex flex-col items-start gap-1">
                          <button
                            type="button"
                            onClick={() => navigate(`/appointments/${s.app.id}`)}
                            className="text-xs font-semibold text-chart-primary hover:underline cursor-pointer"
                          >
                            {format(s.date, "MMM d, yyyy")}
                          </button>
                          {s.app.bolt_score != null && (
                            <Badge variant="outline" className="border-chart-primary/30 text-chart-primary font-semibold text-[9px] px-1.5 py-0 rounded-full">
                              BOLT {s.app.bolt_score}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <NoteCell value={s.app.notes} />
                      <NoteCell value={s.app.goal} />
                      <NoteCell value={s.app.session_north_star} />
                      <NoteCell value={s.app.next_session_note} />
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientHistoryMatrixTab;
