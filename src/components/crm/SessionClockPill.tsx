import { useEffect, useState } from "react";
import { differenceInSeconds, format } from "date-fns";
import { cn } from "@/lib/utils";

/**
 * Live session clock — the readout from the old timer strip, on its own.
 *
 * It owns its interval so the page around it does not re-render once a second,
 * and it follows the same 60-minute session shape (5 stages × 15/15/15/10/5).
 */
const TOTAL_SECONDS = 60 * 60;

const clock = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
};

const SessionClockPill = ({
  appointmentDate,
  status,
  className,
}: {
  appointmentDate: Date | string;
  status?: string;
  className?: string;
}) => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const start = new Date(appointmentDate);
  const elapsed = differenceInSeconds(now, start);
  const finished = status === "Completed";
  const upcoming = elapsed < 0;
  const overtime = elapsed >= TOTAL_SECONDS;

  const tone = finished
    ? "bg-success/10 text-success-strong"
    : upcoming
    ? "bg-muted text-muted-foreground"
    : overtime
    ? "bg-destructive/10 text-destructive-strong"
    : "bg-success/10 text-success-strong";

  const label = finished
    ? "Complete"
    : upcoming
    ? `Upcoming · ${format(start, "h:mm a")}`
    : overtime
    ? `+${clock(elapsed - TOTAL_SECONDS).replace("m ", "m ")}`
    : clock(TOTAL_SECONDS - elapsed);

  return (
    <span
      title={`Started ${format(start, "h:mm a")} · 60-minute session`}
      className={cn(
        "inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-semibold tabular-nums",
        tone,
        className
      )}
    >
      {!finished && !upcoming && (
        <span aria-hidden className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-current" />
      )}
      <span className="whitespace-nowrap">{label}</span>
    </span>
  );
};

export default SessionClockPill;
