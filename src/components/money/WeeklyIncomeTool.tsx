import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { loadInsights, type IncomeLedgerRow } from "@/lib/insights";

const money = (n: number) => `$${Math.round(n).toLocaleString("en-AU")}`;
const FNH = "hsl(var(--chart-primary))";
const VOICE = "hsl(var(--chart-destructive))";

type Filter = "all" | "paid" | "fnh" | "voice";
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All sessions" },
  { id: "paid", label: "Paid only" },
  { id: "fnh", label: "Kinesiology" },
  { id: "voice", label: "Voice & piano" },
];

export function WeeklyIncomeTool() {
  const [filter, setFilter] = useState<Filter>("all");
  const q = useQuery({ queryKey: ["insights"], queryFn: loadInsights, staleTime: 120_000 });

  const ledger = useMemo(() => {
    const rows = q.data?.ledger || [];
    return rows.filter((r: IncomeLedgerRow) =>
      filter === "all" ? true
        : filter === "paid" ? r.paid
        : filter === "fnh" ? r.discipline === "fnh"
        : r.discipline === "voice");
  }, [q.data, filter]);

  if (q.isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <AlertCircle size={24} className="text-destructive" />
        <p className="text-sm text-muted-foreground">Couldn&apos;t load the session ledger.</p>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => q.refetch()}><RefreshCw size={14} /> Retry</Button>
      </div>
    );
  }
  if (q.isLoading) {
    return <div className="space-y-4"><Skeleton className="h-[108px] rounded-xl" /><Skeleton className="h-72 rounded-xl" /></div>;
  }

  const data = q.data!;
  const fnh = data.weeks.reduce((n, w) => n + w.fnh, 0);
  const voice = data.weeks.reduce((n, w) => n + w.voice, 0);
  const activeWeeks = data.weeks.filter((w) => w.total > 0).length;
  const total = fnh + voice;
  const tiles = [
    { label: `Booked in ${data.year}`, value: money(total), sub: `${data.ledger.length} sessions` },
    { label: "Kinesiology", value: money(fnh), sub: "Completed or scheduled" },
    { label: "Voice & piano", value: money(voice), sub: "Paid or scheduled" },
    { label: "Weeks with income", value: String(activeWeeks), sub: `of ${data.weeks.length} weeks` },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-border bg-card shadow-xs lg:grid-cols-4">
        {tiles.map((t, i) => (
          <div key={t.label} className={cn("flex flex-col gap-3 p-4 sm:p-5", i % 2 === 1 && "border-l border-border", i >= 2 && "border-t border-border lg:border-t-0", i === 2 && "lg:border-l")}>
            <span className="truncate text-[13px] text-muted-foreground">{t.label}</span>
            <span className="text-[28px] font-semibold leading-none tracking-[-0.03em] tabular-nums text-foreground">{t.value}</span>
            <span className="text-xs text-muted-foreground">{t.sub}</span>
          </div>
        ))}
      </div>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-2">
          <h2 className="text-sm font-semibold text-foreground">Booked value, week by week · {data.year}</h2>
          <div className="flex items-center gap-3 text-xs text-muted-foreground" aria-label="Legend">
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: FNH }} />Kinesiology</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: VOICE }} />Voice &amp; piano</span>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.weeks} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="2 4" />
              <XAxis dataKey="label" interval={3} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis width={48} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => (v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v}`)} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const row = payload[0].payload as { label: string; fnh: number; voice: number; total: number };
                  return (
                    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
                      <p className="mb-1 font-medium text-foreground">Week of {row.label}</p>
                      <p className="flex justify-between gap-6 text-muted-foreground"><span>Kinesiology</span><span className="tabular-nums text-foreground">{money(row.fnh)}</span></p>
                      <p className="flex justify-between gap-6 text-muted-foreground"><span>Voice &amp; piano</span><span className="tabular-nums text-foreground">{money(row.voice)}</span></p>
                      <p className="mt-1 flex justify-between border-t border-border pt-1 font-medium text-foreground"><span>Total</span><span className="tabular-nums">{money(row.total)}</span></p>
                    </div>
                  );
                }}
              />
              <Line type="monotone" dataKey="fnh" stroke={FNH} strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="voice" stroke={VOICE} strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Booked value, not settled cash. Cancelled and rescheduled voice lessons are excluded.</p>
      </section>

      <section>
        <div className="mb-1 flex flex-wrap items-baseline justify-between gap-3 border-b border-border pb-2">
          <h2 className="text-sm font-semibold text-foreground">Session ledger</h2>
          <div className="flex flex-wrap gap-1" role="group" aria-label="Filter session ledger">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                aria-pressed={filter === f.id}
                className={cn("rounded-md px-2 py-1 text-xs transition-colors", filter === f.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <p className="mb-2 text-xs text-muted-foreground">{ledger.length} sessions · {money(ledger.reduce((n, r) => n + r.amount, 0))}</p>
        {/* Mobile: stacked cards so nothing scrolls sideways. */}
        <ul className="space-y-2 sm:hidden">
          {ledger.map((r) => (
            <li key={r.id} className="rounded-lg border border-border bg-card px-3 py-2.5">
              <div className="flex items-center justify-between gap-3">
                <span className="min-w-0 truncate text-[13px] font-medium text-foreground blur-sensitive">{r.name}</span>
                <span className="shrink-0 tabular-nums text-[13px] font-medium text-foreground">{money(r.amount)}</span>
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                <span className="tabular-nums">{new Date(`${r.date}T00:00:00`).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}</span>
                <span>·</span>
                <span>{r.discipline === "voice" ? "Voice & piano" : "Kinesiology"}</span>
                <span>·</span>
                <span>{r.paid ? "Paid" : r.status || "Scheduled"}</span>
              </div>
            </li>
          ))}
          {ledger.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">Nothing in this view.</li>}
        </ul>
        {/* Desktop: full table. */}
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-muted-foreground">
              <th className="py-2 pr-4 font-medium">Date</th>
              <th className="py-2 pr-4 font-medium">Client</th>
              <th className="py-2 pr-4 font-medium">Discipline</th>
              <th className="py-2 pr-4 font-medium">Status</th>
              <th className="py-2 text-right font-medium">Amount</th>
            </tr></thead>
            <tbody className="divide-y divide-border/60">
              {ledger.map((r) => (
                <tr key={r.id}>
                  <td className="py-2 pr-4 tabular-nums text-muted-foreground">{new Date(`${r.date}T00:00:00`).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}</td>
                  <td className="py-2 pr-4 text-foreground blur-sensitive">{r.name}</td>
                  <td className="py-2 pr-4 text-xs text-muted-foreground">{r.discipline === "voice" ? "Voice & piano" : "Kinesiology"}</td>
                  <td className="py-2 pr-4 text-xs text-muted-foreground">{r.paid ? "Paid" : r.status || "Scheduled"}</td>
                  <td className="py-2 text-right tabular-nums text-foreground">{money(r.amount)}</td>
                </tr>
              ))}
              {ledger.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-sm text-muted-foreground">Nothing in this view.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
