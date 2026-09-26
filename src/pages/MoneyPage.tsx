import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, subMonths, endOfMonth, subDays } from "date-fns";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import HubTabs from "@/components/shared/HubTabs";
import PageHeader from "@/components/shared/PageHeader";
import { Wallet, LineChart, AlertCircle, RefreshCw, ArrowUpRight, Table2, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PlanningTool } from "@/components/money/PlanningTool";
import { loadCalendarItems, unpaidItems, sumAmount, itemStart, type CalendarItem } from "@/lib/calendarItems";
import { practiceOf, itemName, PRACTICE_LABEL, type Practice } from "@/lib/today";

// Series colours: the app's practice tokens. Piano has its own chart token
// (--chart-piano) because the warning amber fails the dark-mode lightness band;
// the trio is validated with the dataviz palette checks in both modes.
const SERIES: { key: Practice; color: string }[] = [
  { key: "kinesiology", color: "hsl(var(--chart-primary))" },
  { key: "voice", color: "hsl(var(--chart-destructive))" },
  { key: "piano", color: "hsl(var(--chart-piano))" },
];

const money = (n: number) => `$${Math.round(n).toLocaleString("en-AU")}`;
const isPaid = (i: CalendarItem) => i.paid && !i.cancelled && (i.amount ?? 0) > 0;

async function loadMoneyItems(): Promise<CalendarItem[]> {
  const now = new Date();
  return loadCalendarItems(startOfMonth(subMonths(now, 11)).toISOString(), endOfMonth(now).toISOString());
}

// ── Overview ──────────────────────────────────────────────────────────────────
function MoneyOverview() {
  const [asTable, setAsTable] = useState(false);
  const q = useQuery({ queryKey: ["money-items"], queryFn: loadMoneyItems, staleTime: 120_000 });
  const now = new Date();

  const view = useMemo(() => {
    const items = q.data || [];
    const monthStart = startOfMonth(now);
    const lastStart = startOfMonth(subMonths(now, 1));
    const inRange = (i: CalendarItem, a: Date, b: Date) => itemStart(i) >= a && itemStart(i) < b;
    const paid = items.filter(isPaid);
    const earnedThis = sumAmount(paid.filter((i) => inRange(i, monthStart, endOfMonth(now))));
    const earnedLast = sumAmount(paid.filter((i) => inRange(i, lastStart, monthStart)));
    const unpaid = unpaidItems(items, now);
    const bookedUnpaid = items.filter((i) => !i.cancelled && !i.paid && !i.isFree && (i.amount ?? 0) > 0 && itemStart(i) >= now && itemStart(i) <= endOfMonth(now));
    const recentPaid = paid.filter((i) => itemStart(i) >= subDays(now, 90));
    const avgRate = recentPaid.length ? sumAmount(recentPaid) / recentPaid.length : 0;

    const months = Array.from({ length: 12 }, (_, k) => {
      const start = startOfMonth(subMonths(now, 11 - k));
      const end = startOfMonth(subMonths(now, 10 - k));
      const row: Record<string, number | string> = { month: format(start, "MMM"), label: format(start, "MMMM yyyy"), total: 0 };
      for (const s of SERIES) row[s.key] = 0;
      for (const i of paid) if (inRange(i, start, end)) { row[practiceOf(i)] = (row[practiceOf(i)] as number) + (i.amount ?? 0); row.total = (row.total as number) + (i.amount ?? 0); }
      return row;
    });

    const byPerson = new Map<string, { name: string; practice: Practice; total: number; count: number }>();
    for (const i of paid) {
      const name = itemName(i) || "Unknown";
      const e = byPerson.get(name) || { name, practice: practiceOf(i), total: 0, count: 0 };
      e.total += i.amount ?? 0; e.count += 1;
      byPerson.set(name, e);
    }
    const top = [...byPerson.values()].sort((a, b) => b.total - a.total).slice(0, 8);
    const recent = [...paid].filter((i) => itemStart(i) <= now).sort((a, b) => itemStart(b).getTime() - itemStart(a).getTime()).slice(0, 10);
    return { earnedThis, earnedLast, unpaid, bookedUnpaid, avgRate, recentPaidCount: recentPaid.length, months, top, recent };
  }, [q.data]); // eslint-disable-line react-hooks/exhaustive-deps

  if (q.isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <AlertCircle size={24} className="text-destructive" />
        <p className="text-sm text-muted-foreground">Couldn't load your sessions and lessons.</p>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => q.refetch()}><RefreshCw size={14} /> Retry</Button>
      </div>
    );
  }
  if (q.isLoading) {
    return <div className="space-y-4"><Skeleton className="h-[108px] rounded-xl" /><Skeleton className="h-72 rounded-xl" /></div>;
  }

  const diff = view.earnedThis - view.earnedLast;
  const tiles = [
    { label: "Earned this month", value: money(view.earnedThis), sub: `${diff >= 0 ? "+" : "−"}${money(Math.abs(diff))} vs ${format(subMonths(now, 1), "MMMM")}`, to: "/calendar" },
    { label: "Unpaid", value: money(sumAmount(view.unpaid)), sub: view.unpaid.length ? `${view.unpaid.length} from the last 60 days` : "All settled", to: "/calendar?show=unpaid", alert: view.unpaid.length > 0 },
    { label: "Still to come this month", value: money(sumAmount(view.bookedUnpaid)), sub: `${view.bookedUnpaid.length} booked, not yet paid`, to: "/calendar" },
    { label: "Average session", value: money(view.avgRate), sub: `${view.recentPaidCount} paid in the last 90 days`, to: "/audit" },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-border bg-card shadow-xs lg:grid-cols-4">
        {tiles.map((t, i) => (
          <Link key={t.label} to={t.to} className={cn("spotlight group flex flex-col gap-3 p-4 sm:p-5", i % 2 === 1 && "border-l border-border", i >= 2 && "border-t border-border lg:border-t-0", i === 2 && "lg:border-l")}>
            <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <span className="truncate">{t.label}</span>
              <ArrowUpRight size={14} className="ml-auto shrink-0 opacity-0 transition-opacity group-hover:opacity-60" />
            </div>
            <span className={cn("text-[28px] font-semibold leading-none tracking-[-0.03em] tabular-nums", t.alert ? "text-chart-amber" : "text-foreground")}>{t.value}</span>
            <div className="text-xs text-muted-foreground">{t.sub}</div>
          </Link>
        ))}
      </div>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-2">
          <h2 className="text-sm font-semibold text-foreground">Paid revenue, last 12 months</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-xs text-muted-foreground" aria-label="Legend">
              {SERIES.map((s) => (
                <span key={s.key} className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: s.color }} />{PRACTICE_LABEL[s.key]}
                </span>
              ))}
            </div>
            <Button variant="ghost" size="sm" className="h-7 gap-1.5 px-2 text-xs" onClick={() => setAsTable((v) => !v)} aria-pressed={asTable}>
              {asTable ? <><BarChart3 size={13} /> Chart</> : <><Table2 size={13} /> Table</>}
            </Button>
          </div>
        </div>
        {asTable ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Month</th>
                {SERIES.map((s) => <th key={s.key} className="py-2 pr-4 text-right font-medium">{PRACTICE_LABEL[s.key]}</th>)}
                <th className="py-2 text-right font-medium">Total</th>
              </tr></thead>
              <tbody className="divide-y divide-border/60">
                {view.months.map((m) => (
                  <tr key={m.label as string}>
                    <td className="py-2 pr-4 text-foreground">{m.label}</td>
                    {SERIES.map((s) => <td key={s.key} className="py-2 pr-4 text-right tabular-nums text-muted-foreground">{money(m[s.key] as number)}</td>)}
                    <td className="py-2 text-right font-medium tabular-nums text-foreground">{money(m.total as number)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={view.months} margin={{ top: 8, right: 4, bottom: 0, left: 0 }} barCategoryGap="28%">
                <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="2 4" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tickLine={false} axisLine={false} width={48} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => (v >= 1000 ? `$${(v / 1000).toFixed(v % 1000 ? 1 : 0)}k` : `$${v}`)} />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted) / 0.5)" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const row = payload[0].payload as Record<string, number | string>;
                    return (
                      <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
                        <p className="mb-1 font-medium text-foreground">{row.label}</p>
                        {SERIES.map((s) => (
                          <p key={s.key} className="flex items-center justify-between gap-6 text-muted-foreground">
                            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-[2px]" style={{ background: s.color }} />{PRACTICE_LABEL[s.key]}</span>
                            <span className="tabular-nums text-foreground">{money(row[s.key] as number)}</span>
                          </p>
                        ))}
                        <p className="mt-1 flex justify-between border-t border-border pt-1 font-medium text-foreground"><span>Total</span><span className="tabular-nums">{money(row.total as number)}</span></p>
                      </div>
                    );
                  }}
                />
                {SERIES.map((s, idx) => (
                  <Bar key={s.key} dataKey={s.key} stackId="rev" fill={s.color} stroke="hsl(var(--card))" strokeWidth={2}
                    radius={idx === SERIES.length - 1 ? [4, 4, 0, 0] : 0} maxBarSize={36} isAnimationActive={false} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <section>
          <div className="mb-1 flex items-baseline justify-between border-b border-border pb-2">
            <h2 className="text-sm font-semibold text-foreground">Recent payments</h2>
            <Link to="/calendar" className="text-xs text-muted-foreground hover:text-foreground">Calendar →</Link>
          </div>
          {view.recent.length === 0 ? <p className="py-4 text-sm text-muted-foreground">No payments recorded yet.</p> : (
            <ul className="divide-y divide-border/60">
              {view.recent.map((i) => (
                <li key={i.id} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="w-20 shrink-0 text-[13px] tabular-nums text-muted-foreground">{format(itemStart(i), "d MMM")}</span>
                  <span className="min-w-0 flex-1 truncate text-foreground blur-sensitive">{itemName(i)}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{PRACTICE_LABEL[practiceOf(i)]}</span>
                  <span className="w-16 shrink-0 text-right tabular-nums text-foreground">{money(i.amount ?? 0)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section>
          <div className="mb-1 flex items-baseline justify-between border-b border-border pb-2">
            <h2 className="text-sm font-semibold text-foreground">Top clients and students</h2>
            <span className="text-xs text-muted-foreground">Paid, last 12 months</span>
          </div>
          {view.top.length === 0 ? <p className="py-4 text-sm text-muted-foreground">Nothing paid yet in this window.</p> : (
            <ul className="divide-y divide-border/60">
              {view.top.map((p) => (
                <li key={p.name} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="min-w-0 flex-1 truncate text-foreground blur-sensitive">{p.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{PRACTICE_LABEL[p.practice]} · {p.count}</span>
                  <span className="w-16 shrink-0 text-right tabular-nums text-foreground">{money(p.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "overview", label: "Overview", icon: Wallet },
  { id: "planning", label: "Planning", icon: LineChart },
];

/**
 * Money — one place for what's earned, owed and coming, across kinesiology,
 * voice and piano (shared money rules in src/lib/calendarItems.ts), plus
 * Planning: the weekly floor, steady and bigger work, and the next 12 weeks
 * (src/lib/planning.ts).
 */
const MoneyPage = () => {
  const [tab, setTab] = useState(() => (new URLSearchParams(window.location.search).get("tool") === "planning" ? "planning" : "overview"));
  return (
    <Tabs value={tab} onValueChange={setTab} className="w-full">
      <HubTabs value={tab} onChange={setTab} tabs={TABS} />
      <TabsContent value="overview" className="m-0">
        <div className="w-full space-y-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <PageHeader icon={Wallet} title="Money" subtitle="Earned, owed and coming up — kinesiology, voice and piano together." />
          <MoneyOverview />
        </div>
      </TabsContent>
      <TabsContent value="planning" className="m-0">
        <div className="w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <PlanningTool />
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default MoneyPage;
