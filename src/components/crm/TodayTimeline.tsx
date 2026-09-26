import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format, differenceInMinutes } from "date-fns";
import { cn } from "@/lib/utils";

export interface TimelineEntry {
  id: string;
  start: Date;
  end: Date;
  name: string;
  href: string;
  external?: boolean; // e.g. a Notion lesson page
  practice: "kinesiology" | "voice" | "piano";
}

// Upcoming blocks are tinted by practice; the live one is always solid.
const NEXT_TONE: Record<TimelineEntry["practice"], string> = {
  kinesiology: "bg-primary/[0.09] text-primary ring-primary/25 hover:bg-primary/[0.14]",
  voice: "bg-chart-destructive/[0.09] text-chart-destructive ring-chart-destructive/25 hover:bg-chart-destructive/[0.14]",
  piano: "bg-chart-amber/[0.12] text-chart-amber ring-chart-amber/30 hover:bg-chart-amber/[0.18]",
};

const START_HOUR = 7;
const END_HOUR = 21;
const SPAN_MIN = (END_HOUR - START_HOUR) * 60;

/**
 * Today at a glance — a single ribbon from 7am to 9pm with each session as a
 * block (sessions and lessons, tinted by practice) and a live "now" line that
 * moves through the day. Past blocks fade, the current one glows, upcoming ones
 * sit ready. Click a block to open it.
 */
export function TodayTimeline({ entries }: { entries: TimelineEntry[] }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const dayStart = useMemo(() => {
    const d = new Date(now);
    d.setHours(START_HOUR, 0, 0, 0);
    return d;
  }, [now]);

  const pct = (d: Date) => Math.min(100, Math.max(0, (differenceInMinutes(d, dayStart) / SPAN_MIN) * 100));
  const nowPct = pct(now);
  const nowVisible = now.getHours() >= START_HOUR && now.getHours() < END_HOUR;

  const blocks = entries
    .map((e) => {
      const state = now >= e.end ? "past" : now >= e.start ? "live" : "next";
      return { ...e, left: pct(e.start), width: Math.max(pct(e.end) - pct(e.start), 3.2), state };
    })
    .filter((b) => b.left < 100);

  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

  return (
    <div className="rounded-xl border border-border bg-card px-4 pb-3 pt-3.5 shadow-xs sm:px-5">
      <div className="mb-3 flex items-center justify-between text-[13px]">
        <span className="font-medium text-foreground">Today</span>
        <span className="text-muted-foreground">
          {blocks.length === 0
            ? "Nothing booked — a clear day"
            : `${blocks.filter((b) => b.state !== "past").length} to go · ${blocks.filter((b) => b.state === "past").length} done`}
        </span>
      </div>

      <div className="relative h-11">
        {/* hour grid */}
        {hours.map((h, i) => (
          <div
            key={h}
            className="absolute inset-y-0 border-l border-dashed border-border/80"
            style={{ left: `${(i / (hours.length - 1)) * 100}%` }}
          />
        ))}
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" />

        {/* sessions */}
        {blocks.map((b) => {
          const className = cn(
              "group absolute top-1/2 flex h-8 -translate-y-1/2 items-center overflow-hidden rounded-md px-2 text-[11.5px] font-medium ring-1 transition-[transform,box-shadow] duration-200 hover:z-10 hover:-translate-y-[calc(50%+1px)] hover:shadow-md",
              b.state === "past" && "bg-muted text-muted-foreground ring-border",
              b.state === "live" && "bg-primary text-primary-foreground shadow-button ring-primary",
              b.state === "next" && NEXT_TONE[b.practice]
            );
          const style = { left: `${b.left}%`, width: `${b.width}%`, minWidth: 28 };
          const title = `${b.name} · ${format(b.start, "h:mm a")}`;
          const label = <span className="truncate blur-sensitive">{b.name.split(" ")[0]}</span>;
          return b.external ? (
            <a key={b.id} href={b.href} target="_blank" rel="noreferrer" title={title} className={className} style={style}>{label}</a>
          ) : (
            <Link key={b.id} to={b.href} title={title} className={className} style={style}>{label}</Link>
          );
        })}

        {/* now */}
        {nowVisible && (
          <div className="pointer-events-none absolute inset-y-[-4px] z-20" style={{ left: `${nowPct}%` }}>
            <div className="h-full w-[2px] -translate-x-1/2 rounded-full bg-destructive" />
            <div className="absolute -top-1 left-0 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-destructive ring-2 ring-card">
              <span className="absolute inset-0 animate-ping rounded-full bg-destructive/60" />
            </div>
          </div>
        )}
      </div>

      {/* hour labels */}
      <div className="relative mt-1.5 h-4 text-[10.5px] tabular-nums text-muted-foreground/80">
        {hours.map((h, i) =>
          i % 2 === 0 ? (
            <span
              key={h}
              className="absolute -translate-x-1/2 first:translate-x-0 last:-translate-x-full"
              style={{ left: `${(i / (hours.length - 1)) * 100}%` }}
            >
              {h === 12 ? "12pm" : h > 12 ? `${h - 12}pm` : `${h}am`}
            </span>
          ) : null
        )}
      </div>
    </div>
  );
}

export default TodayTimeline;
