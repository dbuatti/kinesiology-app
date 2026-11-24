import { cn } from "@/lib/utils";

/** Compact visual readouts for BOLT: where one score sits, and how scores move. */
export interface BoltScorePoint {
  score: number;
  label: string;
}

const MIN_SCORE = 0;
const MAX_SCORE = 60;
const FUNCTIONAL_LOW = 25;
const FUNCTIONAL_HIGH = 35;

const clampScore = (score: number) => Math.min(MAX_SCORE, Math.max(MIN_SCORE, score));

export function BoltScoreGauge({ score, className }: { score: number; className?: string }) {
  const marker = (clampScore(score) / MAX_SCORE) * 100;
  const zoneStart = (FUNCTIONAL_LOW / MAX_SCORE) * 100;
  const zoneWidth = ((FUNCTIONAL_HIGH - FUNCTIONAL_LOW) / MAX_SCORE) * 100;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="relative h-2 w-full rounded-full bg-muted">
        <span
          aria-hidden
          className="absolute inset-y-0 rounded-full bg-primary/20"
          style={{ left: `${zoneStart}%`, width: `${zoneWidth}%` }}
        />
        <span
          aria-hidden
          className={cn(
            "absolute top-1/2 h-4 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full",
            score >= FUNCTIONAL_LOW ? "bg-primary" : "bg-warning-strong",
          )}
          style={{ left: `${marker}%` }}
        />
      </div>
      <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
        <span className="tabular-nums">0s</span>
        <span>25–35s functional</span>
        <span className="tabular-nums">60s+</span>
      </div>
    </div>
  );
}

export function BoltScoreTrend({
  scores,
  className,
}: {
  scores: BoltScorePoint[];
  className?: string;
}) {
  if (scores.length < 2) return null;

  const width = 600;
  const height = 40;
  const padX = 4;
  const padY = 5;
  const yFor = (score: number) =>
    height - padY - (clampScore(score) / MAX_SCORE) * (height - padY * 2);

  const points = scores.map((point, index) => ({
    ...point,
    x: padX + (index / (scores.length - 1)) * (width - padX * 2),
    y: yFor(point.score),
  }));
  const line = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(" ");
  const first = points[0];
  const last = points[points.length - 1];

  return (
    <div className={cn("space-y-1", className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="h-10 w-full"
        role="img"
        aria-label={`BOLT trend: ${scores.map((s) => `${s.label} ${s.score}s`).join(", ")}`}
      >
        <rect
          x="0"
          y={yFor(FUNCTIONAL_HIGH)}
          width={width}
          height={yFor(FUNCTIONAL_LOW) - yFor(FUNCTIONAL_HIGH)}
          fill="hsl(var(--chart-primary))"
          fillOpacity={0.06}
        />
        <path
          d={`${line} L ${last.x.toFixed(1)} ${height} L ${first.x.toFixed(1)} ${height} Z`}
          fill="hsl(var(--chart-primary))"
          fillOpacity={0.06}
        />
        <path
          d={line}
          fill="none"
          stroke="hsl(var(--chart-primary))"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {points.map((point, index) => (
          <circle
            key={`${point.label}-${index}`}
            cx={point.x}
            cy={point.y}
            r={index === points.length - 1 ? 3 : 2}
            fill="hsl(var(--chart-primary))"
          >
            <title>{`${point.label}: ${point.score}s`}</title>
          </circle>
        ))}
      </svg>
      <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
        <span>{first.label}</span>
        <span className="tabular-nums font-medium text-foreground">{last.score}s now</span>
      </div>
    </div>
  );
}
