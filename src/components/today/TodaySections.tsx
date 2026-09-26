import { useState } from "react";
import { Link } from "react-router-dom";
import { format, isTomorrow } from "date-fns";
import {
  ArrowUpRight, CalendarDays, Wallet, TrendingUp, CircleDollarSign, Mail, PencilLine, UserRoundCheck,
  ShieldAlert, Sun, Wind, StickyNote, ExternalLink, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PractitionerGrounding from "@/components/crm/PractitionerGrounding";
import Scratchpad from "@/components/crm/Scratchpad";
import { useCountUp } from "@/hooks/use-count-up";
import { itemStart, type CalendarItem } from "@/lib/calendarItems";
import {
  practiceOf, PRACTICE_LABEL, hasTime, itemHref, itemName, type Practice,
} from "@/lib/today";

const money = (n: number) => `$${Math.round(n).toLocaleString("en-AU")}`;

export const PRACTICE_DOT: Record<Practice, string> = {
  kinesiology: "bg-chart-primary",
  voice: "bg-chart-destructive",
  piano: "bg-chart-amber",
};

function Section({ title, aside, children }: { title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-1 flex items-baseline justify-between gap-3 border-b border-border pb-2">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {aside && <div className="text-xs text-muted-foreground">{aside}</div>}
      </div>
      {children}
    </section>
  );
}

// ── Stats strip ──────────────────────────────────────────────────────────────
function Figure({ value, format: fmt }: { value: number; format?: (n: number) => string }) {
  const v = useCountUp(value);
  return <>{fmt ? fmt(v) : Math.round(v)}</>;
}

export function DayStats(props: {
  sessions: number; lessons: number; bookedThisWeek: number; earnedThisWeek: number; unpaidTotal: number; unpaidCount: number;
}) {
  const tiles = [
    { label: "Today", value: props.sessions + props.lessons, sub: `${props.sessions} session${props.sessions === 1 ? "" : "s"} · ${props.lessons} lesson${props.lessons === 1 ? "" : "s"}`, icon: CalendarDays, to: "/calendar" },
    { label: "Booked this week", value: props.bookedThisWeek, sub: "Sessions and lessons", icon: TrendingUp, to: "/calendar" },
    { label: "Earned this week", value: props.earnedThisWeek, fmt: money, sub: "Paid so far", icon: Wallet, to: "/money" },
    {
      label: "Unpaid", value: props.unpaidTotal, fmt: money,
      sub: props.unpaidCount ? `${props.unpaidCount} from the last 60 days` : "All settled",
      icon: CircleDollarSign, to: "/calendar?show=unpaid", alert: props.unpaidCount > 0,
    },
  ];
  return (
    <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-border bg-card shadow-xs lg:grid-cols-4">
      {tiles.map((t, i) => (
        <Link
          key={t.label}
          to={t.to}
          className={cn(
            "spotlight group relative flex flex-col gap-3 p-4 sm:p-5",
            i % 2 === 1 && "border-l border-border",
            i >= 2 && "border-t border-border lg:border-t-0",
            i === 2 && "lg:border-l",
          )}
        >
          <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <t.icon size={15} strokeWidth={1.85} className={t.alert ? "text-chart-amber" : "text-muted-foreground/80"} />
            <span className="truncate">{t.label}</span>
            <ArrowUpRight size={14} className="ml-auto shrink-0 opacity-0 transition-all duration-200 group-hover:-translate-y-px group-hover:opacity-60" />
          </div>
          <span className={cn("text-[28px] font-semibold leading-none tracking-[-0.03em] tabular-nums", t.alert ? "text-chart-amber" : "text-foreground")}>
            <Figure value={t.value} format={t.fmt} />
          </span>
          <div className="text-xs text-muted-foreground">{t.sub}</div>
        </Link>
      ))}
    </div>
  );
}

// ── Today's list ─────────────────────────────────────────────────────────────
function ItemLink({ item, children, className }: { item: CalendarItem; children: React.ReactNode; className?: string }) {
  const { to, external } = itemHref(item);
  return external
    ? <a href={to} target="_blank" rel="noreferrer" className={className}>{children}</a>
    : <Link to={to} className={className}>{children}</Link>;
}

export function TodayList({ items, goals, now }: { items: CalendarItem[]; goals: Record<string, string>; now: Date }) {
  if (items.length === 0) {
    return (
      <p className="py-6 text-sm text-muted-foreground">
        Nothing booked today. <Link to="/practice?tool=self-practice" className="text-foreground underline-offset-4 hover:underline">Start a self-practice session</Link>
      </p>
    );
  }
  return (
    <ul className="divide-y divide-border/60">
      {items.map((i) => {
        const practice = practiceOf(i);
        const { external } = itemHref(i);
        const goal = i.appointmentId ? goals[i.appointmentId] : null;
        const done = hasTime(i) && itemStart(i) < now;
        return (
          <li key={i.id}>
            <ItemLink item={i} className="group flex items-start gap-3 py-3 hover:bg-muted/30 -mx-2 px-2 rounded-lg transition-colors">
              <span className={cn("w-16 shrink-0 pt-0.5 text-[13px] tabular-nums", done ? "text-muted-foreground/70" : "text-foreground")}>
                {hasTime(i) ? format(itemStart(i), "h:mm a") : "Time TBC"}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 shrink-0 rounded-full", PRACTICE_DOT[practice])} />
                  <span className={cn("truncate text-sm font-medium blur-sensitive", done ? "text-muted-foreground" : "text-foreground")}>{itemName(i)}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{PRACTICE_LABEL[practice]}</span>
                  {i.paid && <span className="inline-flex shrink-0 items-center gap-0.5 text-[11px] font-medium text-chart-emerald"><Check size={11} /> Paid</span>}
                </div>
                {i.source === "kinesiology" && (
                  <p className={cn("mt-0.5 line-clamp-2 text-[13px] leading-snug", goal ? "text-muted-foreground" : "text-muted-foreground/60")}>
                    {goal || "No goal recorded yet"}
                  </p>
                )}
              </div>
              <span className="hidden shrink-0 pt-0.5 text-xs text-muted-foreground opacity-70 transition-opacity group-hover:opacity-100 sm:inline">
                {i.source === "kinesiology" ? "Open session →" : external ? <span className="inline-flex items-center gap-1">Notion <ExternalLink size={11} /></span> : "Calendar →"}
              </span>
            </ItemLink>
          </li>
        );
      })}
    </ul>
  );
}

// ── Needs you ────────────────────────────────────────────────────────────────
export interface NeedLine {
  id: string;
  icon: "reply" | "unpaid" | "pencil" | "followup" | "alert";
  text: string;
  detail?: string;
  to: string;
}

const NEED_ICON = {
  reply: { Icon: Mail, tone: "text-chart-destructive" },
  unpaid: { Icon: CircleDollarSign, tone: "text-chart-amber" },
  pencil: { Icon: PencilLine, tone: "text-chart-primary" },
  followup: { Icon: UserRoundCheck, tone: "text-chart-emerald" },
  alert: { Icon: ShieldAlert, tone: "text-destructive" },
} as const;

export function NeedsYou({ lines, loading }: { lines: NeedLine[]; loading: boolean }) {
  return (
    <Section title="Needs you" aside={loading ? "Checking…" : undefined}>
      {lines.length === 0 ? (
        <p className="py-4 text-sm text-muted-foreground">{loading ? "Checking your inbox, payments and follow-ups…" : "Nothing needs you right now."}</p>
      ) : (
        <ul className="divide-y divide-border/60">
          {lines.map((l) => {
            const { Icon, tone } = NEED_ICON[l.icon];
            return (
              <li key={l.id}>
                <Link to={l.to} className="group -mx-2 flex items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-muted/30">
                  <Icon size={16} strokeWidth={1.85} className={cn("shrink-0", tone)} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{l.text}</p>
                    {l.detail && <p className="truncate text-[13px] text-muted-foreground blur-sensitive">{l.detail}</p>}
                  </div>
                  <ArrowUpRight size={15} className="shrink-0 text-muted-foreground opacity-50 transition-opacity group-hover:opacity-100" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}

// ── Coming up ────────────────────────────────────────────────────────────────
export function ComingUp({ items }: { items: CalendarItem[] }) {
  const days = new Map<string, CalendarItem[]>();
  for (const i of items) days.set(i.date, [...(days.get(i.date) || []), i]);
  return (
    <Section title="Coming up" aside={<Link to="/calendar" className="hover:text-foreground">Calendar →</Link>}>
      {items.length === 0 ? (
        <p className="py-4 text-sm text-muted-foreground">Nothing booked in the next 7 days.</p>
      ) : (
        <div className="space-y-4 pt-2">
          {[...days.entries()].map(([date, list]) => {
            const d = itemStart(list[0]);
            return (
              <div key={date}>
                <p className="mb-1 text-xs font-medium text-muted-foreground">{isTomorrow(d) ? "Tomorrow" : format(d, "EEEE d MMMM")}</p>
                <ul>
                  {list.map((i) => {
                    const practice = practiceOf(i);
                    return (
                      <li key={i.id}>
                        <ItemLink item={i} className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/30">
                          <span className="w-16 shrink-0 text-[13px] tabular-nums text-muted-foreground">{hasTime(i) ? format(itemStart(i), "h:mm a") : "TBC"}</span>
                          <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", PRACTICE_DOT[practice])} />
                          <span className="truncate text-sm text-foreground blur-sensitive">{itemName(i)}</span>
                          <span className="shrink-0 text-xs text-muted-foreground">{PRACTICE_LABEL[practice]}</span>
                        </ItemLink>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </Section>
  );
}

// ── Your practice (compact) ──────────────────────────────────────────────────
export function PracticeRow({ morningDone, morningTotal }: { morningDone: number; morningTotal: number }) {
  const [grounding, setGrounding] = useState(false);
  const [scratch, setScratch] = useState(false);
  const pill = "inline-flex h-9 items-center gap-2 rounded-full border border-border bg-card px-3.5 text-[13px] font-medium text-foreground/85 shadow-xs transition-colors hover:border-foreground/15 hover:text-foreground";
  const pct = morningTotal ? Math.round((morningDone / morningTotal) * 100) : 0;
  return (
    <Section title="Your practice">
      <div className="flex flex-wrap items-center gap-2 pt-3">
        <Link to="/morning-program" className={pill}>
          <Sun size={15} className="text-chart-amber" />
          Morning program
          <span className="relative h-1.5 w-14 overflow-hidden rounded-full bg-muted">
            <span className="absolute inset-y-0 left-0 rounded-full bg-chart-amber" style={{ width: `${pct}%` }} />
          </span>
          <span className="tabular-nums text-muted-foreground">{morningDone}/{morningTotal}</span>
        </Link>
        <button onClick={() => setGrounding(true)} className={pill}>
          <Wind size={15} className="text-chart-primary" /> Grounding · 60s
        </button>
        <button onClick={() => setScratch(true)} className={pill}>
          <StickyNote size={15} className="text-muted-foreground" /> Scratchpad
        </button>
      </div>

      <Dialog open={grounding} onOpenChange={setGrounding}>
        <DialogContent className="max-w-2xl overflow-hidden p-0">
          <DialogHeader className="sr-only"><DialogTitle>Practitioner grounding</DialogTitle></DialogHeader>
          <PractitionerGrounding />
        </DialogContent>
      </Dialog>
      <Dialog open={scratch} onOpenChange={setScratch}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-serif text-xl font-medium tracking-tight">Scratchpad</DialogTitle></DialogHeader>
          <Scratchpad />
        </DialogContent>
      </Dialog>
    </Section>
  );
}
