import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { addWeeks, format, startOfWeek, subDays } from "date-fns";
import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertCircle, BarChart3, ExternalLink, LineChart, RefreshCw, Table2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import PageHeader from "@/components/shared/PageHeader";
import { cn } from "@/lib/utils";
import { loadCalendarItems } from "@/lib/calendarItems";
import {
  DEFAULT_PLANNING, FORWARD_WEEKS, STREAMS, fetchPlanRows, fetchPlanningSettings, savePlanningSettings,
  summarisePlanning, type PlanningSettings, type RateKey,
} from "@/lib/planning";

const money = (n: number) => `$${Math.round(n).toLocaleString("en-AU")}`;
const COLORS = { steady: "hsl(var(--chart-primary))", plan: "hsl(var(--chart-piano))" };

async function loadPlanningData() {
  const now = new Date();
  const from = subDays(now, 365);
  const to = addWeeks(startOfWeek(now, { weekStartsOn: 1 }), FORWARD_WEEKS);
  const [items, plan] = await Promise.all([
    // Sessions and lessons: the last 90 days for the typical week, the next 12 weeks for what's booked.
    loadCalendarItems(subDays(now, 91).toISOString(), to.toISOString()),
    fetchPlanRows(format(from, "yyyy-MM-dd"), format(to, "yyyy-MM-dd")),
  ]);
  return { items, plan };
}

/**
 * Planning (Money → Planning): a weekly floor from living costs and tax, the
 * two shapes of income — steady work measured from the app, bigger work from
 * Notion "The Plan" — and the next 12 weeks already booked against the floor.
 */
export function PlanningTool() {
  const queryClient = useQueryClient();
  const dataQ = useQuery({ queryKey: ["planning-data"], queryFn: loadPlanningData, staleTime: 120_000 });
  const settingsQ = useQuery({ queryKey: ["planning-settings"], queryFn: fetchPlanningSettings, staleTime: Infinity });
  const [settings, setSettings] = useState<PlanningSettings>(DEFAULT_PLANNING);
  const [savedLocal, setSavedLocal] = useState<boolean | null>(null);
  const [asTable, setAsTable] = useState(false);
  const loaded = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (settingsQ.data && !loaded.current) {
      loaded.current = true;
      setSettings(settingsQ.data.settings);
      setSavedLocal(settingsQ.data.local);
    }
  }, [settingsQ.data]);

  const update = (next: PlanningSettings) => {
    setSettings(next);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const { local } = await savePlanningSettings(next);
      setSavedLocal(local);
      queryClient.setQueryData(["planning-settings"], { settings: next, local });
    }, 600);
  };
  const setRate = (key: RateKey, value: number) => update({ ...settings, rates: { ...settings.rates, [key]: value } });

  const view = useMemo(
    () => summarisePlanning(dataQ.data?.items || [], dataQ.data?.plan.rows || [], settings),
    [dataQ.data, settings],
  );

  const header = <PageHeader icon={LineChart} title="Planning" subtitle="What a week needs to bring in, where it comes from, and what's already booked." />;

  if (dataQ.isError) {
    return (
      <div className="space-y-8">
        {header}
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <AlertCircle size={24} className="text-destructive" />
          <p className="text-sm text-muted-foreground">Couldn't load your sessions and lessons.</p>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => dataQ.refetch()}><RefreshCw size={14} /> Retry</Button>
        </div>
      </div>
    );
  }
  if (dataQ.isLoading || settingsQ.isLoading) {
    return <div className="space-y-8">{header}<Skeleton className="h-[108px] rounded-xl" /><Skeleton className="h-72 rounded-xl" /></div>;
  }

  const plan = dataQ.data!.plan;
  const floor = view.floor.weekly;
  const gap = view.typicalWeekly - floor;
  const bookedWeeks = view.weeks.filter((w) => w.total >= floor).length;
  const tiles = [
    { label: "Your weekly floor", value: money(floor), sub: settings.addTax ? `${money(settings.livingCosts)}/month living costs + ${money(view.floor.tax / 12)} tax` : `${money(settings.livingCosts)}/month living costs` },
    { label: "Typical week", value: money(view.typicalWeekly), sub: gap >= 0 ? `${money(gap)} above your floor` : `${money(-gap)} short of your floor`, tone: gap >= 0 ? "good" : "alert" },
    { label: "Steady work", value: money(view.steadyWeekly), sub: "a week, last 90 days" },
    { label: "Bigger work", value: plan.error ? "—" : money(view.bigWeekly), sub: plan.error ? "The Plan isn't connected" : `a week, averaged over 12 months (${money(view.bigYear)})` },
  ];

  return (
    <div className="space-y-10">
      {header}

      <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-border bg-card shadow-xs lg:grid-cols-4">
        {tiles.map((t, i) => (
          <div key={t.label} className={cn("flex flex-col gap-3 p-4 sm:p-5", i % 2 === 1 && "border-l border-border", i >= 2 && "border-t border-border lg:border-t-0", i === 2 && "lg:border-l")}>
            <span className="truncate text-[13px] text-muted-foreground">{t.label}</span>
            <span className={cn("text-[28px] font-semibold leading-none tracking-[-0.03em] tabular-nums", t.tone === "alert" ? "text-chart-amber" : "text-foreground")}>{t.value}</span>
            <span className="text-xs text-muted-foreground">{t.sub}</span>
          </div>
        ))}
      </div>

      {plan.error && (
        <div className="flex gap-3 rounded-lg border border-border bg-muted/40 p-4 text-sm">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-chart-amber" />
          <div className="space-y-1">
            <p className="font-medium text-foreground">Bigger work and backing tracks aren't showing yet</p>
            <p className="text-muted-foreground">
              {plan.needsShare
                ? "The app can't see The Plan in Notion. Open The Plan, choose ••• → Connections, and add the same integration the voice lessons use. Then reload this page."
                : `The Plan couldn't be read (${plan.error}).`}
            </p>
          </div>
        </div>
      )}

      {/* Next 12 weeks */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-2">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Next {FORWARD_WEEKS} weeks, already booked</h2>
            <p className="text-xs text-muted-foreground">{bookedWeeks} of {FORWARD_WEEKS} weeks reach your floor so far</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-xs text-muted-foreground" aria-label="Legend">
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: COLORS.steady }} />Sessions & lessons</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: COLORS.plan }} />The Plan</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-0 w-3 border-t-2 border-dashed border-foreground/50" />Floor</span>
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
                <th className="py-2 pr-4 font-medium">Week of</th>
                <th className="py-2 pr-4 text-right font-medium">Sessions & lessons</th>
                <th className="py-2 pr-4 text-right font-medium">The Plan</th>
                <th className="py-2 pr-4 text-right font-medium">Total</th>
                <th className="py-2 text-right font-medium">Against floor</th>
              </tr></thead>
              <tbody className="divide-y divide-border/60">
                {view.weeks.map((w) => (
                  <tr key={w.key}>
                    <td className="py-2 pr-4 text-foreground">{w.label}</td>
                    <td className="py-2 pr-4 text-right tabular-nums text-muted-foreground">{money(w.steady)}</td>
                    <td className="py-2 pr-4 text-right tabular-nums text-muted-foreground">{money(w.plan)}</td>
                    <td className="py-2 pr-4 text-right font-medium tabular-nums text-foreground">{money(w.total)}</td>
                    <td className={cn("py-2 text-right tabular-nums", w.total >= floor ? "text-chart-emerald" : "text-muted-foreground")}>{w.total >= floor ? "+" : "−"}{money(Math.abs(w.total - floor))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={view.weeks} margin={{ top: 8, right: 4, bottom: 0, left: 0 }} barCategoryGap="24%">
                <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="2 4" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} interval="preserveStartEnd" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tickLine={false} axisLine={false} width={48} domain={[0, (max: number) => Math.max(max, Math.ceil(floor * 1.15))]}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => (v >= 1000 ? `$${(v / 1000).toFixed(v % 1000 ? 1 : 0)}k` : `$${v}`)} />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted) / 0.5)" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const w = payload[0].payload as (typeof view.weeks)[number];
                    return (
                      <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
                        <p className="mb-1 font-medium text-foreground">Week of {format(w.start, "d MMMM")}</p>
                        <p className="flex justify-between gap-6 text-muted-foreground"><span>Sessions & lessons</span><span className="tabular-nums text-foreground">{money(w.steady)}</span></p>
                        <p className="flex justify-between gap-6 text-muted-foreground"><span>The Plan</span><span className="tabular-nums text-foreground">{money(w.plan)}</span></p>
                        <p className="mt-1 flex justify-between gap-6 border-t border-border pt-1 font-medium text-foreground"><span>Total</span><span className="tabular-nums">{money(w.total)}</span></p>
                        <p className="text-muted-foreground">{w.total >= floor ? `${money(w.total - floor)} over your floor` : `${money(floor - w.total)} to go`}</p>
                      </div>
                    );
                  }}
                />
                <ReferenceLine y={floor} stroke="hsl(var(--foreground) / 0.5)" strokeDasharray="4 4" strokeWidth={1.5} />
                <Bar dataKey="steady" stackId="w" fill={COLORS.steady} stroke="hsl(var(--card))" strokeWidth={2} maxBarSize={36} isAnimationActive={false} />
                <Bar dataKey="plan" stackId="w" fill={COLORS.plan} stroke="hsl(var(--card))" strokeWidth={2} radius={[4, 4, 0, 0]} maxBarSize={36} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        {/* Steady work */}
        <section>
          <div className="mb-1 flex items-baseline justify-between border-b border-border pb-2">
            <h2 className="text-sm font-semibold text-foreground">Steady work</h2>
            <span className="text-xs text-muted-foreground">Last 90 days</span>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-muted-foreground">
              <th className="py-2 pr-3 font-medium">Stream</th>
              <th className="py-2 pr-3 text-right font-medium">A week</th>
              <th className="py-2 pr-3 text-right font-medium">Average</th>
              <th className="py-2 text-right font-medium">$ a week</th>
            </tr></thead>
            <tbody className="divide-y divide-border/60">
              {view.steady.map((st) => (
                <tr key={st.key}>
                  <td className="py-2.5 pr-3">
                    <span className="block text-foreground">{st.label}</span>
                    <span className="block text-xs text-muted-foreground">{st.source}</span>
                  </td>
                  <td className="py-2.5 pr-3 text-right tabular-nums text-muted-foreground">{st.perWeek.toFixed(1)}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums text-muted-foreground">{money(st.avgPrice)}</td>
                  <td className="py-2.5 text-right font-medium tabular-nums text-foreground">{money(st.weekly)}</td>
                </tr>
              ))}
              <tr>
                <td className="py-2.5 pr-3 font-medium text-foreground" colSpan={3}>Total</td>
                <td className="py-2.5 text-right font-semibold tabular-nums text-foreground">{money(view.steadyWeekly)}</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Bigger work */}
        <section>
          <div className="mb-1 flex items-baseline justify-between border-b border-border pb-2">
            <h2 className="text-sm font-semibold text-foreground">Bigger work</h2>
            <span className="text-xs text-muted-foreground">From The Plan, last 12 months</span>
          </div>
          {plan.error ? (
            <p className="py-4 text-sm text-muted-foreground">Connect The Plan to see gigs, institutions, musical theatre and corporate work here.</p>
          ) : view.big.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">No bigger work recorded in The Plan in the last 12 months.</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {view.big.map((b) => (
                <li key={b.project} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="min-w-0 flex-1 truncate text-foreground">{b.project}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{b.count} {b.count === 1 ? "payment" : "payments"}</span>
                  <span className="w-20 shrink-0 text-right tabular-nums text-foreground">{money(b.total)}</span>
                </li>
              ))}
              <li className="flex items-center gap-3 py-2.5 text-sm">
                <span className="flex-1 font-medium text-foreground">Last 90 days</span>
                <span className="w-32 shrink-0 text-right tabular-nums text-muted-foreground">{money(view.bigRecentWeekly)} a week</span>
              </li>
            </ul>
          )}
          {view.upcoming.length > 0 && (
            <>
              <h3 className="mb-1 mt-6 border-b border-border pb-2 text-xs font-semibold text-muted-foreground">Coming up in The Plan</h3>
              <ul className="divide-y divide-border/60">
                {view.upcoming.slice(0, 8).map((r) => (
                  <li key={r.id} className="flex items-center gap-3 py-2.5 text-sm">
                    <span className="w-16 shrink-0 text-[13px] tabular-nums text-muted-foreground">{r.date ? format(new Date(r.date), "d MMM") : "—"}</span>
                    <a href={r.url} target="_blank" rel="noreferrer" className="group min-w-0 flex-1 truncate text-foreground hover:underline blur-sensitive">
                      {r.title || r.project || "Untitled"} <ExternalLink size={11} className="inline opacity-0 group-hover:opacity-60" />
                    </a>
                    <span className="shrink-0 text-xs text-muted-foreground">{r.project}</span>
                    <span className="w-16 shrink-0 text-right tabular-nums text-foreground">{money(r.dollars)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>

      {/* Settings */}
      <section className="space-y-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-2">
          <h2 className="text-sm font-semibold text-foreground">Your numbers</h2>
          <span className="text-xs text-muted-foreground">
            {savedLocal === null ? "" : savedLocal ? "Saved in this browser — apply supabase_planning_settings.sql to sync devices" : "Saved to your account"}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <label className="block space-y-1.5">
              <span className="text-sm text-foreground">Living costs, per month</span>
              <Input type="number" inputMode="numeric" min={0} step={50} value={settings.livingCosts}
                onChange={(e) => update({ ...settings, livingCosts: Math.max(0, Number(e.target.value) || 0) })} className="max-w-[180px] tabular-nums" />
              <span className="block text-xs text-muted-foreground">Rent, bills, food and everything else, before tax. Your runway budget comes to about $3,370, which with tax is its $3,700 target.</span>
            </label>
            <label className="flex items-start gap-3">
              <Switch checked={settings.addTax} onCheckedChange={(v) => update({ ...settings, addTax: v })} className="mt-0.5" />
              <span className="space-y-0.5">
                <span className="block text-sm text-foreground">Earn enough to cover tax too</span>
                <span className="block text-xs text-muted-foreground">
                  As a sole trader nobody withholds it. {settings.addTax ? `About ${money(view.floor.tax)} a year on ${money(view.floor.annual)} (2026–27 rates, rough, not tax advice).` : ""}
                </span>
              </span>
            </label>
          </div>
          <div className="space-y-2">
            <span className="text-sm text-foreground">Prices used when a session or lesson has none</span>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
              {STREAMS.filter((st): st is typeof st & { key: RateKey } => st.key !== "backing").map((st) => (
                <label key={st.key} className="block space-y-1">
                  <span className="text-xs text-muted-foreground">{st.label}</span>
                  <Input type="number" inputMode="numeric" min={0} step={5} value={settings.rates[st.key]}
                    onChange={(e) => setRate(st.key, Math.max(0, Number(e.target.value) || 0))} className="tabular-nums" />
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Kinesiology uses the price on the session, or the client's own rate. Backing tracks use the price recorded in The Plan. <Link to="/audit" className="underline underline-offset-2 hover:text-foreground">Per-client rates are in Client audit</Link>.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
