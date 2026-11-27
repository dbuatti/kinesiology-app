import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ArrowLeft, Loader2, ScrollText, User } from "lucide-react";
import AppLayout from "@/components/crm/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PATHWAY_DIRECTION, directionForProcess, directionFromText } from "@/lib/pathway-direction";
import type { LogCorrection, LogInhibition, SessionLog } from "@/lib/client-log";

export interface LogClientSummary {
  id: string;
  name: string;
  practices: string[] | null;
}

const displayStatus = (status: string): string => {
  const value = status.trim().toLowerCase();
  return value === "inhibition" ? "inhibited" : value;
};

const statusTone = (status: string): string => {
  const value = status.trim().toLowerCase();
  if (value === "hypertonic") return "text-amber-600 dark:text-amber-400";
  if (value === "hypotonic") return "text-sky-600 dark:text-sky-400";
  if (value === "switching" || value === "dysfunctional") return "text-violet-600 dark:text-violet-400";
  if (value === "unsure") return "text-muted-foreground";
  return "text-chart-destructive";
};

const statusMark = (status: string): string => {
  const value = status.trim().toLowerCase();
  if (value === "hypertonic") return "↑";
  if (value === "hypotonic") return "↓";
  if (value === "switching" || value === "dysfunctional") return "≈";
  if (value === "unsure") return "?";
  return "↓";
};

function InhibitionLine({ item, clearedBy, corrections }: { item: LogInhibition; clearedBy?: LogCorrection; corrections?: LogCorrection[] }) {
  // Cleared status is authoritative from metadata — a correction can clear
  // things indirectly (fractal/domino effect), so don't require a matching
  // correction to display "cleared". Show the correction on hover when one
  // matches; otherwise note it was cleared without a direct correction.
  const correctionText = corrections && corrections.length > 0
    ? corrections.map((c) => `${c.process}${c.detail ? ` — ${c.detail}` : ""}`).join("; ")
    : undefined;
  const tooltip = item.cleared
    ? (clearedBy
        ? `Cleared by: ${clearedBy.process}${clearedBy.detail ? ` — ${clearedBy.detail}` : ""}${clearedBy.pathway ? ` (on ${clearedBy.pathway})` : ""}`
        : "Cleared (no direct correction logged — likely a fractal/domino effect)")
    : (correctionText ? `Correction: ${correctionText}` : undefined);
  return (
    <div
      className="group relative flex flex-col gap-0.5 text-[13px]"
      title={tooltip}
    >
      <div className="flex items-baseline gap-1.5">
      <span className={cn("font-semibold", item.cleared ? "text-cleared" : statusTone(item.status))}>
        {item.cleared ? "✓" : statusMark(item.status)}
      </span>
      <span className={cn(item.cleared ? "text-muted-foreground line-through" : "text-foreground")}>
        {item.name}
        {item.side ? ` (${item.side})` : ""}
      </span>
      <span
        className={cn(
          "text-[11px]",
          item.cleared ? "font-medium text-cleared cursor-help" : "text-muted-foreground/60",
        )}
      >
        {item.cleared ? "cleared" : displayStatus(item.status)}
      </span>
      {corrections && corrections.length > 0 && (
        <span className="inline-flex items-center rounded-full bg-cleared/10 px-1.5 py-0.5 text-[10px] font-bold text-cleared">
          corrected
        </span>
      )}
      {tooltip && (
        <span className="pointer-events-none absolute left-0 top-full z-50 mt-1 hidden max-w-xs rounded-md bg-foreground px-2 py-1 text-[11px] leading-snug text-background shadow-lg group-hover:block">
          {tooltip}
        </span>
      )}
      </div>
    </div>
  );
}

const processDirection = (process: string, processId?: string) =>
  directionForProcess(process, processId) ?? directionFromText(process);

function processPill(process: string, processId?: string): string {
  const direction = processDirection(process, processId);
  if (!direction) return "bg-muted text-foreground";
  return cn(PATHWAY_DIRECTION[direction].soft, PATHWAY_DIRECTION[direction].strong);
}

function processColor(process: string, processId?: string): string {
  const direction = processDirection(process, processId);
  return direction ? PATHWAY_DIRECTION[direction].strong : "text-foreground";
}

function CorrectionLine({ correction }: { correction: LogCorrection }) {
  const pill = processPill(correction.process, correction.processId);
  return (
    <li className="flex items-baseline gap-2 text-[13px] leading-relaxed">
      <div className="min-w-0">
        {correction.pathway && (
          <>
            <span className="text-foreground">{correction.pathway}</span>
            <span className="text-muted-foreground"> — </span>
          </>
        )}
        <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold", pill)}>
          {correction.process}
        </span>
        {correction.detail && (
          <span className="text-muted-foreground"> — {correction.detail}</span>
        )}
      </div>
    </li>
  );
}

function SessionEntry({ session, latest }: { session: SessionLog; latest: boolean }) {
  const [showAllInh, setShowAllInh] = useState(false);
  const { appointment } = session;
  const clearedByMap = useMemo(() => {
    const m = new Map<string, LogCorrection>();
    for (const inh of session.inhibitions) {
      if (!inh.cleared) continue;
      const name = inh.name.toLowerCase();
      const match = session.corrections.find((c) => {
        const haystack = `${c.pathway || ""} ${c.detail || ""} ${c.process || ""}`.toLowerCase();
        return haystack.includes(name);
      });
      if (match) m.set(inh.key, match);
    }
    return m;
  }, [session]);

  // Corrections applied to each inhibition (matched by pathway), regardless of
  // cleared status — so an inhibited finding that was corrected still surfaces
  // the correction beneath it.
  const correctionsByInhibition = useMemo(() => {
    const m = new Map<string, LogCorrection[]>();
    for (const inh of session.inhibitions) {
      const name = inh.name.toLowerCase();
      const matches = session.corrections.filter((c) => {
        const haystack = `${c.pathway || ""} ${c.detail || ""} ${c.process || ""}`.toLowerCase();
        return haystack.includes(name);
      });
      if (matches.length > 0) m.set(inh.key, matches);
    }
    return m;
  }, [session]);
  const cancelled = String(appointment.status || "").toLowerCase() === "cancelled";
  const upcoming = appointment.date.getTime() > Date.now();
  const empty = session.inhibitions.length === 0 && session.corrections.length === 0;

  return (
    <li
      className={cn(
        "relative border-l border-border/70 pb-10 pl-6 last:border-transparent last:pb-0 sm:pl-8",
        cancelled && "opacity-60",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute -left-[3.5px] top-[11px] h-[7px] w-[7px] rounded-full ring-4 ring-background",
          cancelled ? "bg-muted-foreground/40" : "bg-primary",
        )}
      />

      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <Link
          to={`/appointments/${appointment.id}`}
          className={cn(
            "font-serif text-[18px] font-medium tracking-[-0.01em] text-foreground transition-colors hover:text-primary",
            cancelled && "line-through decoration-muted-foreground/40",
          )}
        >
          {format(appointment.date, "EEE d MMM yyyy")}
        </Link>
        {cancelled && (
          <span className="inline-flex items-center rounded-full bg-muted-foreground/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Cancelled
          </span>
        )}
        <span className="text-[11px] tabular-nums text-muted-foreground/70">
          {format(appointment.date, "h:mm a")}
        </span>
        {latest && !cancelled && !upcoming && (
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary/70">Latest</span>
        )}
        {!cancelled && upcoming && (
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/60">
            Upcoming
          </span>
        )}
      </div>

      {appointment.goal && (
        <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
          <span className="text-foreground/70">Goal</span> — {appointment.goal}
        </p>
      )}

      {session.inhibitions.length > 0 && (
        <section className="mt-4">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/60">
            Inhibitions
          </h2>
          {(() => {
            const visible = showAllInh ? session.inhibitions : session.inhibitions.slice(0, 9);
            const cranial = visible.filter((i) => i.category === "Cranial nerve");
            const others = visible.filter((i) => i.category !== "Cranial nerve");

            const nerveMap = new Map<string, typeof visible>();
            for (const item of cranial) {
              const nerve = item.name.split(" \u2014 ")[0].trim();
              if (!nerveMap.has(nerve)) nerveMap.set(nerve, []);
              nerveMap.get(nerve)!.push(item);
            }
            // Drop redundant base-nerve entries when a stim exists for that side.
            for (const [nerve, items] of nerveMap) {
              const stimSides = new Set(items.filter((i) => i.name.includes(" \u2014 ")).map((i) => i.side));
              if (stimSides.size === 0) continue;
              nerveMap.set(nerve, items.filter((i) => i.name.includes(" \u2014 ") || !stimSides.has(i.side)));
            }

            const otherGroups = new Map<string, typeof visible>();
            for (const item of others) {
              if (!otherGroups.has(item.category)) otherGroups.set(item.category, []);
              otherGroups.get(item.category)!.push(item);
            }

            return (
              <div className="mt-2 space-y-3">
                {nerveMap.size > 0 && (
                  <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/50">
                      Cranial nerve
                    </p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {[...nerveMap.entries()].map(([nerve, items]) => {
                        const sides = new Map<string, typeof items>();
                        for (const it of items) {
                          const s = it.side || "\u2014";
                          if (!sides.has(s)) sides.set(s, []);
                          sides.get(s)!.push(it);
                        }
                        return (
                          <div key={nerve} className="group relative rounded-lg bg-muted/40 px-3 py-2">
                            <p className="text-[12px] font-semibold text-foreground">{nerve}</p>
                            <div className={cn("mt-1 grid gap-1", [...sides.keys()].length > 1 ? "grid-cols-2" : "grid-cols-1")}>
                              {[...sides.entries()].map(([side, sideItems]) => (
                                <div key={side} className="space-y-0.5">
                                  {sideItems.map((item) => {
                                    const stim = item.name.includes(" \u2014 ") ? item.name.split(" \u2014 ")[1].trim() : null;
                                    const isCleared = item.cleared;
                                    const tooltip = item.cleared
                                      ? (clearedByMap.get(item.key)
                                          ? `Cleared by: ${clearedByMap.get(item.key)!.process}${clearedByMap.get(item.key)!.detail ? ` \u2014 ${clearedByMap.get(item.key)!.detail}` : ""}`
                                          : "Cleared (fractal/domino effect \u2014 no direct correction logged)")
                                      : (correctionsByInhibition.get(item.key)
                                          ? `Correction: ${correctionsByInhibition.get(item.key)!.map((c) => `${c.process}${c.detail ? ` \u2014 ${c.detail}` : ""}`).join("; ")}`
                                          : undefined);
                                    return (
                                      <div key={item.key} className="group relative flex flex-col gap-0.5">
                                        <div className="flex items-baseline gap-1.5 text-[12px]">
                                          <span className="text-[10px] font-bold text-muted-foreground/70 shrink-0 w-3">{side}</span>
                                          <span className={cn("font-semibold shrink-0", item.cleared ? "text-cleared" : statusTone(item.status))}>
                                            {item.cleared ? "\u2713" : statusMark(item.status)}
                                          </span>
                                          {stim && <span className="text-foreground min-w-0 line-clamp-2">{stim}</span>}
                                          <span
                                            title={item.cleared
                                              ? (clearedByMap.get(item.key)
                                                  ? `Cleared by: ${clearedByMap.get(item.key)!.process}${clearedByMap.get(item.key)!.detail ? ` \u2014 ${clearedByMap.get(item.key)!.detail}` : ""}`
                                                  : "Cleared (fractal/domino effect \u2014 no direct correction logged)")
                                              : (correctionsByInhibition.get(item.key)
                                                  ? `Correction: ${correctionsByInhibition.get(item.key)!.map((c) => `${c.process}${c.detail ? ` \u2014 ${c.detail}` : ""}`).join("; ")}`
                                                  : undefined)}
                                            className={cn("text-[10px] shrink-0", item.cleared ? "font-medium text-cleared cursor-help" : "text-muted-foreground/60")}
                                          >
                                            {item.cleared ? "cleared" : displayStatus(item.status)}
                                          </span>
                                          {correctionsByInhibition.get(item.key) && (
                                            <span className="inline-flex items-center rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary-strong">
                                              corrected
                                            </span>
                                          )}
                                          {tooltip && (
                                            <span className="pointer-events-none absolute left-0 top-full z-50 mt-1 hidden max-w-xs rounded-md bg-foreground px-2 py-1 text-[11px] leading-snug text-background shadow-lg group-hover:block">
                                              {tooltip}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {[...otherGroups.entries()].map(([category, items]) => (
                  <div key={category}>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/50">
                      {category}
                    </p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
                      {items.map((item) => (
                        <InhibitionLine key={item.key} item={item} clearedBy={clearedByMap.get(item.key)} corrections={correctionsByInhibition.get(item.key)} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
          {session.inhibitions.length > 9 && (
            <button
              onClick={() => setShowAllInh((v) => !v)}
              className="mt-2 text-[11px] font-semibold text-chart-primary hover:underline"
            >
              {showAllInh ? "Show less" : `Show all ${session.inhibitions.length} inhibitions`}
            </button>
          )}
        </section>
      )}

      {session.corrections.length > 0 && (
        <section className="mt-4">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/60">
            Corrections
          </h2>
          <ul className="mt-2 max-w-3xl space-y-1.5">
            {session.corrections.map((correction) => (
              <CorrectionLine key={correction.key} correction={correction} />
            ))}
          </ul>
        </section>
      )}

      {empty && (
        <p className="mt-2 text-[13px] text-muted-foreground/60">
          {cancelled
            ? "Cancelled — nothing recorded."
            : upcoming
              ? "Upcoming session."
              : "No corrections or inhibitions recorded."}
        </p>
      )}
    </li>
  );
}

interface ClientLogViewProps {
  client: LogClientSummary | null;
  sessions: SessionLog[];
  loading?: boolean;
  error?: string | null;
}

/**
 * The full appointment log: a single, newest-first column. No cards, no table —
 * one session per entry with its inhibitions and corrections underneath.
 */
export default function ClientLogView({ client, sessions, loading, error }: ClientLogViewProps) {
  const correctionCounts = useMemo(() => {
    const m = new Map<string, { processId?: string; count: number; pathways: Set<string> }>();
    for (const s of sessions) for (const c of s.corrections) {
      const entry = m.get(c.process);
      if (entry) { entry.count++; if (c.pathway) entry.pathways.add(c.pathway); }
      else m.set(c.process, { processId: c.processId, count: 1, pathways: new Set(c.pathway ? [c.pathway] : []) });
    }
    return [...m.entries()].sort((a, b) => b[1].count - a[1].count);
  }, [sessions]);

  const pathwayCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of sessions) for (const c of s.corrections) {
      if (c.pathway) m.set(c.pathway, (m.get(c.pathway) || 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [sessions]);

  const inhibitionStatusMap = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const s of sessions) {
      for (const inh of s.inhibitions) {
        const key = inh.name.toLowerCase();
        if (!m.has(key)) m.set(key, new Set());
        m.get(key)!.add(inh.status.toLowerCase());
        if (inh.cleared) m.get(key)!.add("cleared");
      }
    }
    return m;
  }, [sessions]);

  const normalizePathwayName = (name: string): string =>
    name.replace(/\s*\([^)]*\)/g, "").split("·")[0].trim().toLowerCase();

  const pathwayStatus = (name: string): { arrow: string; color: string; cleared: boolean; mixed: boolean; hypertonic: boolean } | null => {
    const s = inhibitionStatusMap.get(normalizePathwayName(name));
    if (!s) return null;
    const hypertonic = s.has("hypertonic");
    const inhibited = s.has("inhibited");
    if (!hypertonic && !inhibited) return null;
    const mixed = hypertonic && inhibited;
    const arrow = mixed ? "↓↑" : hypertonic ? "↑" : "↓";
    const color = mixed
      ? "text-chart-purple"
      : hypertonic
        ? "text-warning-strong"
        : "text-chart-destructive";
    return { arrow, color, cleared: s.has("cleared"), mixed, hypertonic };
  };

  if (loading) {
    return (
      <AppLayout variant="workspace">
        <div className="flex min-h-[40vh] items-center justify-center text-[13px] text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading log…
        </div>
      </AppLayout>
    );
  }

  if (error || !client) {
    return (
      <AppLayout variant="workspace">
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <User size={24} className="text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">{error || "Client not found."}</p>
          <Button asChild variant="outline" size="sm" className="h-9 gap-1.5 rounded-lg text-[13px]">
            <Link to="/clients">
              <ArrowLeft size={14} /> Back to people
            </Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  const firstDate = sessions[0]?.date;
  const lastDate = sessions[sessions.length - 1]?.date;
  const hasKinesiology = (client.practices || []).includes("kinesiology");

  return (
    <AppLayout variant="workspace">
      <PageHeader
        icon={ScrollText}
        title={client.name}
        subtitle="Full appointment log — every correction and inhibition, newest first."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 rounded-lg px-3.5 text-[13px] font-medium"
            >
              <Link to={`/clients/${client.id}`}>
                <ArrowLeft size={14} /> Profile
              </Link>
            </Button>
            {hasKinesiology && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 rounded-lg px-3.5 text-[13px] font-medium"
              >
                <Link to={`/clients/${client.id}/hub`}>Hub</Link>
              </Button>
            )}
          </div>
        }
      />

      <div className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted-foreground">
        <span>
          {sessions.length} {sessions.length === 1 ? "session" : "sessions"}
        </span>
        {firstDate && lastDate && (
          <>
            <span className="text-muted-foreground/40">·</span>
            <span className="tabular-nums">
              {format(firstDate, "MMM yyyy")} – {format(lastDate, "MMM yyyy")}
            </span>
          </>
        )}
      </div>

      {(correctionCounts.length > 0 || pathwayCounts.length > 0) && (
        <div className="mt-4 rounded-2xl border border-border/40 bg-muted/60 p-5 space-y-5">          {correctionCounts.length > 0 && (
            <div>
              <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
                Corrections
              </p>
              <div className="flex flex-wrap gap-2">
                {correctionCounts.map(([name, { processId, count, pathways }]) => (
                  <span
                    key={name}
                    title={pathways.size > 0 ? `Pathways: ${[...pathways].join(", ")}` : undefined}
                    className="inline-flex items-center gap-2 rounded-full bg-card py-1 pl-3.5 pr-1.5 shadow-xs cursor-help"
                  >
                    <span className={cn("text-[12px] font-bold", processColor(name, processId))}>
                      {name}
                    </span>
                    <span
                      className={cn(
                        "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
                        processPill(name, processId),
                      )}
                    >
                      {count}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}
          {pathwayCounts.length > 0 && (
            <div>
              <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
                Pathways
              </p>
              <div className="flex flex-wrap gap-2">
                {pathwayCounts.map(([name, count]) => {
                  const status = pathwayStatus(name);
                  return (
                    <span
                      key={name}
                      className="inline-flex items-center gap-2 rounded-full bg-card py-1 pl-1.5 pr-3.5 shadow-xs"
                    >
                      <span
                        className={cn(
                          "flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white",
                          status
                            ? status.mixed
                              ? "bg-chart-purple"
                              : status.hypertonic
                                ? "bg-warning"
                                : "bg-chart-destructive"
                            : "bg-muted-foreground/30",
                        )}
                      >
                        {count}
                      </span>
                      {status && (
                        <span className={cn("text-[12px] font-bold leading-none", status.color)}>
                          {status.arrow}
                        </span>
                      )}
                      <span className="text-[12px] font-medium text-foreground">{name}</span>
                      {status?.cleared && (
                        <span className="text-[11px] font-bold leading-none text-primary-strong">✓</span>
                      )}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {sessions.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
          <p className="text-sm font-medium text-foreground">No appointments yet</p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Corrections and inhibitions will appear here after the first session.
          </p>
        </div>
      ) : (
        <ol className="mt-8">
          {sessions.map((session, index) => (
            <SessionEntry key={session.appointment.id} session={session} latest={index === 0} />
          ))}
        </ol>
      )}
    </AppLayout>
  );
}