import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Loader2, ArrowUpRight, ScrollText, PanelRightClose, Calendar, Clock, Timer, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import PaymentStatusBadge from "@/components/crm/PaymentStatusBadge";
import { calculateAge } from "@/utils/crm-utils";
import { correctionsForAppointment, inhibitionsForAppointment } from "@/lib/client-log";
import type { Appointment } from "@/types/crm";
import { cn } from "@/lib/utils";

interface ClientSideBaseProps {
  clientId: string;
  clientName: string;
  /** Current session context, absorbed from the session header. */
  sessionDate?: string | number | Date | null;
  isDemo?: boolean;
  paymentReceived?: boolean | null;
  isPaidService?: boolean | null;
  priceAmount?: number | null;
  paymentMethod?: string | null;
  appointmentStatus?: string | null;
}

interface VitalsChip {
  label: string;
  value: string;
  accent: string;
}

export interface RailTimer {
  duration: number | null;
  remaining: number;
  running: boolean;
  done: boolean;
  onStart: (minutes: number) => void;
  onStop: () => void;
  onDismissDone: () => void;
  format: (seconds: number) => string;
}

interface ClientRow {
  born: string | null;
  email: string | null;
  phone: string | null;
  status: string | null;
  programme: string | null;
  corrections_holding: string | null;
  priority_pathways: string | null;
  standard_rate: number | null;
}

interface SessionRow {
  id: string;
  date: string;
  status: string | null;
  goal: string | null;
  bolt_score: number | null;
}

/** Inline peek of a past session — the plan, corrections, findings state, homework. */
function HistoryPeek({ session, planNote }: { session: Appointment; planNote?: string | null }) {
  const log = correctionsForAppointment(session);
  const inhibitions = inhibitionsForAppointment(session);
  const still = inhibitions.filter(i => !i.cleared);

  return (
    <div className="mt-2 space-y-2 border-l border-border/40 pl-3">
      {planNote && (
        <p className="text-[13px] leading-relaxed text-foreground">
          <span className="font-semibold">The plan — </span>
          <span className="text-muted-foreground">{planNote}</span>
        </p>
      )}
      {log.length > 0 ? (
        <div className="space-y-1.5">
          {log.slice(0, 3).map(c => (
            <div key={c.key} className="text-[13px] leading-snug">
              <p className="font-semibold text-foreground">{c.pathway ?? c.process}</p>
              {c.detail && <p className="text-[12px] leading-relaxed text-muted-foreground">{c.detail}</p>}
            </div>
          ))}
          {log.length > 3 && (
            <p className="text-[11px] text-muted-foreground">+{log.length - 3} more in the full log</p>
          )}
        </div>
      ) : null}
      {still.length > 0 ? (
        <p className="text-[12px] leading-relaxed">
          <span className="font-semibold text-foreground">Still to check — </span>
          <span className="text-muted-foreground">
            {still
              .slice(0, 6)
              .map(i => `${i.name}${i.side ? ` (${i.side})` : ""}`)
              .join(" · ")}
          </span>
        </p>
      ) : inhibitions.length > 0 ? (
        <p className="text-[12px] font-medium text-primary-strong dark:text-primary">
          ✓ All clear at the end of this session
        </p>
      ) : null}
      {session.homework_given && (
        <p className="text-[12px] leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">Homework — </span>
          {session.homework_given}
        </p>
      )}
    </div>
  );
}

/** Shared body: identity, this-session vitals, statistics, fundamentals, history. */
export function ClientSideContent({
  clientId,
  clientName,
  sessionDate,
  isDemo,
  paymentReceived,
  isPaidService,
  priceAmount,
  paymentMethod,
  appointmentStatus,
  vitals,
  timer,
  active = true,
  onOpenChange,
  history,
  currentId,
  planNote,
}: ClientSideBaseProps & {
  vitals?: VitalsChip[];
  timer?: RailTimer;
  /** Fetch only while the panel is actually shown. */
  active?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Full past-session rows from useAppointment — powers "Where we left off". */
  history?: Appointment[];
  /** The session on screen (excluded from "last session"). */
  currentId?: string;
  /** The note left last time for today. */
  planNote?: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const [client, setClient] = useState<ClientRow | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);

  useEffect(() => {
    if (!active || !clientId) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      const [clientRes, sessionRes] = await Promise.all([
        supabase.from("clients").select(
          "born, email, phone, status, programme, corrections_holding, priority_pathways, standard_rate",
        ).eq("id", clientId).maybeSingle(),
        supabase.from("appointments").select("id, date, status, goal, bolt_score")
          .eq("client_id", clientId).order("date", { ascending: false }).limit(10),
      ]);
      if (cancelled) return;
      setClient((clientRes.data || null) as ClientRow | null);
      setSessions((sessionRes.data || []) as SessionRow[]);
      setLoading(false);
    })().catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [active, clientId]);

  const past = sessions.filter((s) => new Date(s.date).getTime() <= Date.now());
  const completed = past.filter((s) => String(s.status || "").toLowerCase() !== "cancelled");
  const lastSessionDate = completed[0]?.date ?? null;
  const latestBolt = [...sessions].reverse().find((s) => s.bolt_score != null)?.bolt_score ?? null;
  const initials = (clientName || "?").trim().split(/\s+/).filter(Boolean).slice(0, 2)
    .map((word) => word[0]?.toUpperCase()).join("") || "?";
  const age = client?.born ? calculateAge(new Date(client.born)) : null;
  const rate = client?.standard_rate === 0 ? "Free" : client?.standard_rate != null ? `$${client.standard_rate}` : null;

  /** Past sessions before the one on screen — newest first. */
  const pastSessions = (history ?? [])
    .filter(h =>
      h.id !== currentId &&
      new Date(h.date).getTime() <= Date.now() &&
      String(h.status || "").toLowerCase() !== "cancelled",
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const lastSession = pastSessions[0];
  const homework = lastSession?.homework_given ?? null;
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  const stats: [string, string][] = [
    ["Sessions", completed.length ? String(completed.length) : "—"],
    ["Last session", lastSessionDate ? format(new Date(lastSessionDate), "d MMM yyyy") : "—"],
    ["Latest BOLT", latestBolt != null ? `${latestBolt}s` : "—"],
    ["Rate", rate ?? "—"],
  ];

  const fundamentals = ([
    ["Status", client?.status ?? null],
    ["Programme", client?.programme ?? null],
    ["Corrections holding", client?.corrections_holding ?? null],
    ["Priority pathways", client?.priority_pathways ?? null],
  ].filter(([, value]) => !!value) as [string, string][]);

  return (
    <div className="flex flex-col">
      {/* Identity — links to the client's profile */}
      <Link
        to={`/clients/${clientId}`}
        onClick={() => onOpenChange?.(false)}
        className="group flex items-center gap-3.5 border-b border-border/60 px-5 py-5 transition-colors hover:bg-muted/40"
        title="Open client profile"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-indigo-700 text-sm font-semibold text-white">
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-serif text-xl font-medium tracking-[-0.02em] text-foreground transition-colors group-hover:text-primary">
              {clientName}
            </p>
            {isDemo && (
              <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[9px] font-medium tracking-tight text-muted-foreground">
                Demo
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {[
              age != null ? `${age} yrs` : null,
              client?.email || null,
            ].filter(Boolean).join(" · ") || "\u00A0"}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <PaymentStatusBadge
              paid={paymentReceived}
              isPaidService={isPaidService}
              priceAmount={priceAmount}
              paymentMethod={paymentMethod}
              status={appointmentStatus}
              size="sm"
            />
            {sessionDate && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground/80">
                <Calendar size={11} />
                {format(new Date(sessionDate), "EEE, MMM d")}
                <span className="text-muted-foreground/40">·</span>
                <Clock size={11} />
                {format(new Date(sessionDate), "h:mm a")}
              </span>
            )}
          </div>
        </div>
      </Link>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-[13px] text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading client…
        </div>
      ) : (
        <div className="space-y-5 px-5 py-5">
          {/* Where we left off — the orienting card for the session */}
          {lastSession && (
            <section>
              <h3 className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
                Where we left off
              </h3>
              <div className="rounded-2xl bg-muted/40 p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-serif text-[15px] font-medium text-foreground">
                    {format(new Date(lastSession.date), "EEE d MMM yyyy")}
                  </p>
                  <Link
                    to={`/appointments/${lastSession.id}`}
                    onClick={() => onOpenChange?.(false)}
                    className="shrink-0 text-[11px] font-medium text-primary hover:underline"
                  >
                    Open session
                  </Link>
                </div>
                <HistoryPeek session={lastSession} planNote={planNote} />
              </div>
            </section>
          )}

          {/* This session — vitals & timer, moved out of the header */}
          {((vitals && vitals.length > 0) || timer) && (
            <section>
              <h3 className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
                This session
              </h3>
              {vitals && vitals.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {vitals.map((chip, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-2.5 py-1 text-[11px] tabular-nums shadow-xs"
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", chip.accent.replace("text-", "bg-"))} />
                      <span className="font-medium text-muted-foreground">{chip.label}</span>
                      <span className="font-semibold text-foreground">{chip.value}</span>
                    </span>
                  ))}
                </div>
              )}
              {timer && (
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="flex h-7 items-center gap-1.5 rounded-full bg-muted/60 px-3 text-[11px] tabular-nums text-muted-foreground">
                    <Timer size={12} />
                    <span className="font-semibold text-foreground">{timer.format(timer.remaining)}s</span>
                  </span>
                  {[3, 6, 9].map((min) => {
                    const activeTimer = timer.running && timer.duration === min;
                    return (
                      <button
                        key={min}
                        onClick={() => (activeTimer ? timer.onStop() : timer.onStart(min))}
                        title={activeTimer ? `${timer.format(timer.remaining)} left — tap to stop` : `Start ${min} minute timer (key ${[3, 6, 9].indexOf(min) + 1})`}
                        className={cn(
                          "h-7 rounded-full border tabular-nums text-[11px] font-medium transition-colors",
                          activeTimer
                            ? "min-w-[48px] border-amber-500 bg-amber-500 font-bold text-white"
                            : "border-border bg-muted/40 px-2.5 text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {activeTimer ? timer.format(timer.remaining) : `${min}m`}
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* Statistics — clean rows, graceful when empty */}
          <section>
            <h3 className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
              Statistics
            </h3>
            {completed.length === 0 && lastSession == null && latestBolt == null ? (
              <p className="rounded-xl bg-muted/40 px-3.5 py-3 text-[12px] leading-relaxed text-muted-foreground">
                No sessions on record yet — statistics appear after the first appointment.
              </p>
            ) : (
              <dl>
                {stats.map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-baseline justify-between gap-3 border-b border-border/40 py-2 last:border-0"
                  >
                    <dt className="text-[12px] text-muted-foreground">{label}</dt>
                    <dd className={cn(
                      "text-[13px] font-medium tabular-nums",
                      value === "—" ? "text-muted-foreground/40" : "text-foreground",
                    )}>
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </section>

          {/* Fundamentals */}
          {fundamentals.length > 0 && (
            <section>
              <h3 className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
                Fundamentals
              </h3>
              <dl>
                {fundamentals.map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-baseline justify-between gap-3 border-b border-border/40 py-2 last:border-0"
                  >
                    <dt className="shrink-0 text-[12px] text-muted-foreground">{label}</dt>
                    <dd className="max-w-[60%] text-right text-[13px] leading-relaxed text-foreground">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {/* History — expandable rows; peek a session without leaving the page */}
          {pastSessions.length > 0 ? (
            <section>
              <h3 className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
                History
              </h3>
              <ul className="space-y-0.5">
                {pastSessions.slice(0, 8).map((s, i) => {
                  const expandedRow = expandedHistoryId === s.id;
                  return (
                    <li key={s.id} className="rounded-lg bg-muted/20">
                      <button
                        type="button"
                        onClick={() => setExpandedHistoryId(expandedRow ? null : s.id)}
                        aria-expanded={expandedRow}
                        className="group flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted/50"
                      >
                        <ChevronDown
                          size={12}
                          className={cn(
                            "shrink-0 text-muted-foreground/50 transition-transform",
                            expandedRow && "rotate-180",
                          )}
                        />
                        <span className="shrink-0 rounded-md bg-muted/70 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-foreground">
                          {format(new Date(s.date), "d MMM")}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[12px] text-muted-foreground">
                          {s.goal || String(s.status || "Session")}
                        </span>
                        <Link
                          to={`/appointments/${s.id}`}
                          onClick={e => {
                            e.stopPropagation();
                            onOpenChange?.(false);
                          }}
                          className="shrink-0 rounded p-1 text-muted-foreground/50 transition-colors hover:bg-muted hover:text-primary"
                          title="Open this session"
                          aria-label={`Open ${format(new Date(s.date), "d MMM")} session`}
                        >
                          <ArrowUpRight size={13} />
                        </Link>
                      </button>
                      {expandedRow && (
                        <div className="px-2 pb-2">
                          <HistoryPeek session={s} planNote={i === 0 ? planNote : null} />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
              {pastSessions.length > 8 && (
                <Link
                  to={`/clients/${clientId}/log`}
                  onClick={() => onOpenChange?.(false)}
                  className="mt-1 inline-flex text-[11px] font-medium text-primary hover:underline"
                >
                  All {pastSessions.length} in the full log
                </Link>
              )}
            </section>
          ) : (
            past.length > 0 && (
              <section>
                <h3 className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
                  Past appointments
                </h3>
                <ul className="space-y-0.5">
                  {past.slice(0, 6).map((s) => (
                    <li key={s.id}>
                      <Link
                        to={`/appointments/${s.id}`}
                        className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/50"
                      >
                        <span className="shrink-0 rounded-md bg-muted/70 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-foreground">
                          {format(new Date(s.date), "d MMM")}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[12px] text-muted-foreground">
                          {s.goal || String(s.status || "Session")}
                        </span>
                        <ArrowUpRight
                          size={13}
                          className="shrink-0 text-muted-foreground/40 transition-colors group-hover:text-primary"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )
          )}

          {/* Deep links */}
          <div className="flex flex-col gap-1.5 border-t border-border/60 pt-4">
            <Link
              to={`/clients/${clientId}/log`}
              onClick={() => onOpenChange?.(false)}
              className="group flex items-center justify-between rounded-xl border border-border bg-card px-3.5 py-2.5 text-[13px] font-medium text-foreground shadow-xs transition-colors hover:border-primary/40 hover:bg-primary/[0.04]"
            >
              <span className="flex items-center gap-2">
                <ScrollText size={14} className="text-primary" /> Full appointment log
              </span>
              <ArrowUpRight size={14} className="text-muted-foreground transition-colors group-hover:text-primary" />
            </Link>
            <Link
              to={`/clients/${clientId}`}
              onClick={() => onOpenChange?.(false)}
              className="flex items-center justify-between rounded-xl px-3.5 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Full profile <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

/** Docked, always-visible client rail (wide screens). */
export function SessionClientRail({
  onCollapse,
  vitals,
  timer,
  ...props
}: ClientSideBaseProps & {
  onCollapse: () => void;
  vitals?: VitalsChip[];
  timer?: RailTimer;
  history?: Appointment[];
  currentId?: string;
  planNote?: string | null;
}) {
  return (
    <aside
      data-client-rail
      className="sticky top-0 z-10 hidden h-[100dvh] w-[320px] shrink-0 self-start overflow-hidden flex-col border-l border-border/60 bg-background/95 min-[1100px]:flex"
    >
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-border/60 px-4">
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/60">
          Client
        </span>
        <button
          onClick={onCollapse}
          title="Collapse client rail"
          aria-label="Collapse client rail"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <PanelRightClose size={14} />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <ClientSideContent vitals={vitals} timer={timer} {...props} />
      </div>
    </aside>
  );
}

/** Overlay slide-over for narrow screens. */
export default function ClientSideSheet(
  props: ClientSideBaseProps & {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    history?: Appointment[];
    currentId?: string;
    planNote?: string | null;
  },
) {
  return (
    <Sheet open={props.open ?? true} onOpenChange={props.onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetTitle className="sr-only">{props.clientName} — client overview</SheetTitle>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <ClientSideContent active={props.open ?? true} {...props} />
        </div>
      </SheetContent>
    </Sheet>
  );
}