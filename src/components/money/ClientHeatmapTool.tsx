import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { loadInsights, type HeatClient } from "@/lib/insights";

type View = "priority" | "recency" | "discipline";
const VIEWS: { id: View; label: string }[] = [
  { id: "priority", label: "Priority" },
  { id: "recency", label: "Recency" },
  { id: "discipline", label: "Discipline" },
];

const scoreAlpha = (s: number) => (s >= 9 ? 0.42 : s >= 7 ? 0.34 : s >= 5 ? 0.26 : s >= 3 ? 0.18 : s >= 1 ? 0.12 : 0.07);
const colour = (group: string) => group === "V" ? "hsl(var(--chart-destructive))" : "hsl(var(--chart-primary))";

function tileBackground(c: HeatClient): string {
  const a = scoreAlpha(c.score);
  if (c.group === "B") {
    return `linear-gradient(135deg, hsl(var(--chart-primary) / ${a}) 0 50%, hsl(var(--chart-destructive) / ${a}) 50% 100%)`;
  }
  if (c.group === "N") return `hsl(var(--muted-foreground) / ${a})`;
  return `hsl(${c.group === "V" ? "var(--chart-destructive)" : "var(--chart-primary)"} / ${a})`;
}

const shortDate = (d: string | null) => (d ? d.slice(5).replace("-", "/") : "—");

export function ClientHeatmapTool() {
  const [view, setView] = useState<View>("priority");
  const q = useQuery({ queryKey: ["insights"], queryFn: loadInsights, staleTime: 120_000 });

  const quadrants = useMemo(() => {
    const all = q.data?.clients || [];
    return [
      { title: "Core regulars", action: "Recently seen and well established — keep them booked.", hot: true, high: true },
      { title: "Lapsed regulars", action: "Real history, no recent visit — the best follow-ups.", hot: false, high: true },
      { title: "Building", action: "Recent but early — an easy second booking.", hot: true, high: false },
      { title: "Dormant", action: "Little history and out of the window — lowest priority.", hot: false, high: false },
    ].map((qd) => ({
      ...qd,
      group: all.filter((c) => (c.recency >= 4) === qd.hot && (c.traction >= 3) === qd.high).sort((a, b) => b.score - a.score),
    }));
  }, [q.data]);

  const bands = useMemo(() => {
    const all = q.data?.clients || [];
    if (view === "priority") {
      const defs = [
        { label: "Keep close", lo: 9, action: "Strong history and currently engaged — protect these slots." },
        { label: "Rebook now", lo: 7, action: "Good relationship: a direct offer should land." },
        { label: "Light follow-up", lo: 5, action: "Worth a short nudge." },
        { label: "Distant", lo: 3, action: "Offer a specific time rather than a generic check-in." },
        { label: "Out of window", lo: 1, action: "Re-engagement campaign only." },
        { label: "No record", lo: -99, action: "No sessions in the CRM." },
      ];
      return defs.map((d, i) => ({
        label: d.label,
        action: d.action,
        group: all.filter((c) => c.score >= d.lo && (i === 0 || c.score < defs[i - 1].lo)),
      }));
    }
    if (view === "recency") {
      const defs = [
        { label: "On the books", p: 6 }, { label: "This week", p: 5 },
        { label: "Within a fortnight", p: 4 }, { label: "Within a month", p: 3 },
        { label: "1–2 months", p: 2 }, { label: "2–3 months", p: 1 },
        { label: "Out of window", p: 0 }, { label: "No bookings", p: -1 },
      ];
      return defs.map((d) => ({ label: d.label, action: "", group: all.filter((c) => c.recency === d.p) }));
    }
    const defs = [
      { label: "Kinesiology only", g: "F" }, { label: "Voice & piano only", g: "V" },
      { label: "Both disciplines", g: "B" }, { label: "No booking record", g: "N" },
    ];
    return defs.map((d) => ({ label: d.label, action: "", group: all.filter((c) => c.group === d.g) }));
  }, [q.data, view]);

  if (q.isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <AlertCircle size={24} className="text-destructive" />
        <p className="text-sm text-muted-foreground">Couldn&apos;t load the client heat map.</p>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => q.refetch()}><RefreshCw size={14} /> Retry</Button>
      </div>
    );
  }
  if (q.isLoading) {
    return <div className="space-y-4"><Skeleton className="h-28 rounded-xl" /><Skeleton className="h-72 rounded-xl" /></div>;
  }

  const tile = (c: HeatClient) => {
    const when = c.next ? `Next ${shortDate(c.next)}` : c.last ? `Last ${shortDate(c.last)}` : "No sessions";
    return (
      <Link
        key={c.id}
        to={`/clients/${c.id}`}
        title={`${c.name} — ${c.sessions} sessions, ${when}`}
        className="min-w-0 rounded-lg border border-l-[3px] border-border bg-card px-3 py-2.5 transition-colors hover:border-primary"
        style={{ background: tileBackground(c), borderLeftColor: c.group === "N" ? "hsl(var(--muted-foreground))" : colour(c.group) }}
      >
        <div className="flex items-start justify-between gap-2">
          <span className="min-w-0 truncate text-[13px] font-medium text-foreground blur-sensitive">{c.name}</span>
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {c.group === "B" ? "K+V" : c.group === "F" ? "K" : c.group === "V" ? "V" : "—"}
          </span>
        </div>
        <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
          {c.sessions} {c.sessions === 1 ? "session" : "sessions"} · {when}
          {c.rate === 0 && c.sessions > 0 ? " · $0" : ""}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="rounded px-1.5 py-0.5 text-[11px] font-semibold text-white" style={{ background: c.group === "N" ? "hsl(var(--muted-foreground))" : colour(c.group) }}>{c.score}</span>
          <span className="text-[10px] tabular-nums text-muted-foreground">R{c.recency} + E{c.traction}</span>
        </div>
      </Link>
    );
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {quadrants.map((q) => (
          <div key={q.title} className="rounded-xl border border-border bg-card p-4 shadow-xs">
            <h3 className="text-xs font-semibold text-foreground">{q.title}</h3>
            <div className="mt-1 text-[28px] font-semibold leading-none tabular-nums text-foreground">{q.group.length}</div>
            <p className="mt-2 text-[11px] text-muted-foreground">{q.action}</p>
            <p className="mt-2 truncate text-[11px] text-muted-foreground">
              {q.group.slice(0, 5).map((c) => c.name).join(" · ") || "—"}
              {q.group.length > 5 ? ` · +${q.group.length - 5} more` : ""}
            </p>
          </div>
        ))}
      </div>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-2">
          <h2 className="text-sm font-semibold text-foreground">Who to follow up · {q.data!.clients.length} clients</h2>
          <div className="flex flex-wrap gap-1" role="group" aria-label="Heat map view">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setView(v.id)}
                aria-pressed={view === v.id}
                className={cn("rounded-md px-2 py-1 text-xs transition-colors", view === v.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mb-4 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: colour("F") }} />Kinesiology</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: colour("V") }} />Voice</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: "linear-gradient(135deg, hsl(var(--chart-primary)) 0 50%, hsl(var(--chart-destructive)) 50% 100%)" }} />Both</span>
          <span className="ml-auto">Priority = Recency + Traction</span>
        </div>
        <div className="space-y-6">
          {bands.map((band) => {
            const sorted = [...band.group].sort((a, b) => b.score - a.score || b.sessions - a.sessions || a.name.localeCompare(b.name));
            return (
              <div key={band.label}>
                <div className="mb-2 flex items-baseline gap-2">
                  <h3 className="text-xs font-semibold text-foreground">{band.label}</h3>
                  <span className="text-[11px] text-muted-foreground">{sorted.length} {sorted.length === 1 ? "client" : "clients"}</span>
                </div>
                {band.action && <p className="mb-2 text-[11px] text-muted-foreground">{band.action}</p>}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {sorted.map(tile)}
                </div>
                {sorted.length === 0 && <p className="text-xs text-muted-foreground">—</p>}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
