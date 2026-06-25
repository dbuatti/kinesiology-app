import { useMemo } from "react";
import {
  format,
  startOfWeek,
  endOfWeek,
  addDays,
  isToday,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Music,
  User,
  DollarSign,
  AlertCircle,
  Plus,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface CalendarEvent {
  id: string;
  dayIndex: number;
  startMin: number;
  endMin: number;
  title: string;
  subtitle?: string | null;
  url?: string | null;
  variant?: "voice" | "kinesiology";
  priceAmount?: number | null;
  standardRate?: number | null;
}

interface VoiceLesson {
  id: string;
  name: string | null;
  date: string | null;
  time: string | null;
  studentIds: string[];
  paymentStatus: string | null;
  studentName: string | null;
  studentEmail: string | null;
  notionUrl: string | null;
}

interface TimeEvent {
  id: string;
  dayIndex: number;
  startMin: number;
  endMin: number;
  studentName: string | null;
  lessonName: string | null;
  paymentStatus: string | null;
  notionUrl: string | null;
  timeLabel: string;
}

const HOUR_HEIGHT = 60;
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DEFAULT_VOICE_RATE = 95;
const DEFAULT_FNH_RATE = 50;
const BUFFER_MIN_PER_EVENT = 60;

const paymentStyles: Record<string, string> = {
  "Paid (Stripe)": "bg-chart-emerald/10 text-chart-emerald border-chart-emerald/20",
  "Paid on Day": "bg-chart-primary/10 text-chart-primary border-chart-primary/20",
  "Pending payment": "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  "Unpaid": "bg-muted/40 text-muted-foreground border-border/30",
};

const variantStyles: Record<string, string> = {
  voice: "bg-chart-destructive/10 text-chart-destructive border-chart-destructive/20",
  kinesiology: "bg-chart-primary/10 text-chart-primary border-chart-primary/20",
};

const rateTierStyles: Record<string, string> = {
  free: "bg-muted/40 text-muted-foreground border-muted-foreground/20 italic",
  low: "bg-chart-primary/5 text-chart-primary/80 border-chart-primary/15",
  mid: "bg-chart-primary/10 text-chart-primary border-chart-primary/20",
  high: "bg-chart-primary/20 text-chart-primary border-chart-primary/35",
  premium: "bg-chart-primary/30 text-chart-primary border-chart-primary/50",
};

function getRateTier(rate: number | null | undefined): string {
  if (rate == null) return "mid";
  if (rate === 0) return "free";
  if (rate <= 30) return "low";
  if (rate <= 50) return "mid";
  if (rate <= 70) return "high";
  return "premium";
}

const variantIcons: Record<string, typeof Music> = {
  voice: Music,
  kinesiology: User,
};

function parseTimeEvent(lesson: VoiceLesson): TimeEvent | null {
  if (!lesson.date || !lesson.time) return null;

  const [year, month, day] = lesson.date.split("-").map(Number);
  const isUTC = /UTC/i.test(lesson.time);

  const parseTime = (s: string) => {
    const cleaned = s.replace(/UTC/i, "").trim();
    const match = cleaned.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
    if (!match) return null;
    let h = parseInt(match[1]);
    const m = parseInt(match[2]);
    if (match[3].toUpperCase() === "PM" && h !== 12) h += 12;
    if (match[3].toUpperCase() === "AM" && h === 12) h = 0;
    return { h, m };
  };

  const parts = lesson.time.split("–").map((s) => s.trim());
  const startT = parseTime(parts[0] || lesson.time);
  if (!startT) return null;

  let endT = parts.length >= 2 ? parseTime(parts[1]) : null;
  if (!endT) {
    endT = { h: startT.h + 1, m: startT.m };
  }

  const startDate = isUTC
    ? new Date(Date.UTC(year, month - 1, day, startT.h, startT.m))
    : new Date(year, month - 1, day, startT.h, startT.m);
  const endDate = isUTC
    ? new Date(Date.UTC(year, month - 1, day, endT.h, endT.m))
    : new Date(year, month - 1, day, endT.h, endT.m);

  return {
    id: lesson.id,
    dayIndex: startDate.getDay(),
    startMin: startDate.getHours() * 60 + startDate.getMinutes(),
    endMin: endDate.getHours() * 60 + endDate.getMinutes(),
    studentName: lesson.studentName || lesson.name || "Lesson",
    lessonName: lesson.name || null,
    paymentStatus: lesson.paymentStatus,
    notionUrl: lesson.notionUrl,
    timeLabel: `${format(startDate, "h:mm a")} – ${format(endDate, "h:mm a")}`,
  };
}

export interface WeeklySummary {
  totalIncome: number;
  voiceIncome: number;
  fnhIncome: number;
  eventCount: number;
  apptHours: number;
  bufferHours: number;
  totalHours: number;
  voiceCount: number;
  fnhCount: number;
}

export function calcSummary(
  events: any[],
  voiceRate: number,
  fnhRate: number
): WeeklySummary {
  let voiceIncome = 0;
  let fnhIncome = 0;
  let voiceMinutes = 0;
  let fnhMinutes = 0;
  let voiceCount = 0;
  let fnhCount = 0;

  for (const ev of events) {
    const dur = (ev.endMin ?? 0) - (ev.startMin ?? 0);
    if (dur <= 0) continue;

    const isVoice = ev.variant === "voice";
    if (isVoice) {
      voiceMinutes += dur;
      voiceCount++;
    } else {
      fnhMinutes += dur;
      fnhCount++;
    }

    if (ev.standardRate != null) {
      if (isVoice) voiceIncome += ev.standardRate;
      else fnhIncome += ev.standardRate;
    } else if (ev.priceAmount !== undefined && ev.priceAmount !== null) {
      if (isVoice) voiceIncome += ev.priceAmount;
      else fnhIncome += ev.priceAmount;
    } else {
      const rate = isVoice ? voiceRate : fnhRate;
      if (isVoice) voiceIncome += (dur / 60) * rate;
      else fnhIncome += (dur / 60) * rate;
    }
  }

  const eventCount = voiceCount + fnhCount;
  const apptHours = (voiceMinutes + fnhMinutes) / 60;
  const bufferHours = (eventCount * BUFFER_MIN_PER_EVENT) / 60;

  return {
    totalIncome: voiceIncome + fnhIncome,
    voiceIncome,
    fnhIncome,
    eventCount,
    apptHours,
    bufferHours,
    totalHours: apptHours + bufferHours,
    voiceCount,
    fnhCount,
  };
}

export function fmtCurrency(n: number): string {
  return n.toLocaleString("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).replace("$", "$\u00a0");
}

export function fmtHours(n: number): string {
  return `${n.toFixed(1)}h`;
}

interface EarningsPanelProps {
  summary: WeeklySummary;
  voiceRate: number;
  fnhRate: number;
  label: string;
}

export function EarningsPanel({ summary, voiceRate, fnhRate, label }: EarningsPanelProps) {
  const fmt = fmtCurrency;
  const hr = fmtHours;
  const overworked = summary.totalHours >= 25;
  const highLoad = summary.totalHours >= 20 && summary.totalHours < 25;
  const circleClass = overworked
    ? "from-destructive/90 to-destructive/60"
    : highLoad
    ? "from-amber-500/90 to-amber-400/60"
    : "from-chart-emerald/90 to-chart-emerald/60";
  const loadColor = overworked
    ? "text-destructive"
    : highLoad
    ? "text-amber-500"
    : "text-chart-emerald";

  return (
    <div className="flex flex-col items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <button className={cn(
            "group relative w-20 h-20 rounded-full bg-gradient-to-br flex items-center justify-center shadow-lg hover:shadow-xl transition-all cursor-default",
            circleClass
          )}>
            <div className="flex flex-col items-center leading-tight">
              <DollarSign size={16} className="text-white" />
              <span className="text-white text-lg font-black">
                {fmt(summary.totalIncome).replace(/^.\s?/, "$")}
              </span>
            </div>
            <div className="absolute inset-0 rounded-full ring-2 ring-white/20" />
            {overworked && (
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive flex items-center justify-center text-white text-[8px] font-bold animate-pulse">
                !
              </div>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="left"
          className="w-64 rounded-xl border-border/50 shadow-xl p-4"
        >
          <div className="space-y-3">
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                Income — {label}
              </h4>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Voice ({summary.voiceCount})</span>
                  <span className="font-semibold">{fmt(summary.voiceIncome)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">FNH ({summary.fnhCount})</span>
                  <span className="font-semibold">{fmt(summary.fnhIncome)}</span>
                </div>
                <div className="border-t border-border/50 pt-1 mt-1 flex items-center justify-between text-xs font-semibold">
                  <span>Total</span>
                  <span>{fmt(summary.totalIncome)}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                Hours
              </h4>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Appointments</span>
                  <span className="font-semibold">{hr(summary.apptHours)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Buffer (30min ea.)</span>
                  <span className="font-semibold">{hr(summary.bufferHours)}</span>
                </div>
                <div className="border-t border-border/50 pt-1 mt-1 flex items-center justify-between text-xs font-semibold">
                  <span className={loadColor}>Total load{overworked ? " ⚠" : highLoad ? " ⚠" : ""}</span>
                  <span className={loadColor}>{hr(summary.totalHours)}</span>
                </div>
              </div>
            </div>
            <div className="pt-1 border-t border-border/50">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Rate per hr</span>
                <span>V:{voiceRate}/h · FNH:{fnhRate}/h</span>
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
      <div className="text-[9px] text-muted-foreground font-medium text-center leading-tight px-1">
        {summary.eventCount} sess
        <br />
        {hr(summary.totalHours)}
      </div>
      <div className="w-20 px-1">
        <div className="relative h-2 rounded-full bg-muted overflow-hidden border border-border/40">
          <div className="absolute inset-y-0 left-0 w-full flex">
            <div
              className={cn(overworked ? "bg-destructive/60" : highLoad ? "bg-amber-500/60" : "bg-chart-primary/60", "h-full")}
              style={{ width: `${Math.min((summary.apptHours / 25) * 100, 100)}%` }}
            />
            <div
              className={cn(overworked ? "bg-destructive/30" : highLoad ? "bg-amber-500/30" : "bg-chart-primary/25", "h-full")}
              style={{ width: `${Math.min((summary.bufferHours / 25) * 100, 100)}%` }}
            />
          </div>
          <div className="absolute inset-y-0 w-px bg-amber-500/50" style={{ left: "80%" }} />
        </div>
      </div>
    </div>
  );
}

interface WeeklyTimeGridProps {
  lessons?: VoiceLesson[];
  events?: CalendarEvent[];
  weekStart: Date;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  minHour?: number;
  maxHour?: number;
  voiceRatePerHour?: number;
  fnhRatePerHour?: number;
  onSlotClick?: (date: Date, hour: number) => void;
  availableSlots?: Set<string>;
}

const WeeklyTimeGrid = ({
  lessons,
  events: externalEvents,
  weekStart,
  onPrevWeek,
  onNextWeek,
  onToday,
  minHour = 9,
  maxHour = 17,
  voiceRatePerHour = DEFAULT_VOICE_RATE,
  fnhRatePerHour = DEFAULT_FNH_RATE,
  onSlotClick,
  availableSlots,
}: WeeklyTimeGridProps) => {
  const startHour = Math.max(0, minHour);
  const endHour = Math.min(24, maxHour);
  const weekEnd = endOfWeek(weekStart);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const displayEvents = useMemo(() => {
    if (externalEvents) return externalEvents;

    if (!lessons) return [];

    return lessons
      .map(parseTimeEvent)
      .filter((e): e is TimeEvent => e !== null)
      .filter((e) => {
        const lessonDate = new Date(lessons.find((l) => l.id === e.id)?.date || "");
        return !isNaN(lessonDate.getTime()) &&
          lessonDate >= startOfWeek(weekStart) &&
          lessonDate <= endOfWeek(weekStart);
      })
      .map((e) => ({
        id: e.id,
        dayIndex: e.dayIndex,
        startMin: e.startMin,
        endMin: e.endMin,
        title: e.studentName || "Lesson",
        subtitle: e.timeLabel,
        url: e.notionUrl,
        variant: "voice" as const,
        paymentStatus: e.paymentStatus,
        timeLabel: e.timeLabel,
        _raw: e,
      }));
  }, [lessons, externalEvents, weekStart]);

  const summary = useMemo(
    () => calcSummary(displayEvents, voiceRatePerHour, fnhRatePerHour),
    [displayEvents, voiceRatePerHour, fnhRatePerHour]
  );

  const visibleHours = Array.from(
    { length: endHour - startHour },
    (_, i) => startHour + i
  );

  const totalHeight = visibleHours.length * HOUR_HEIGHT;

  const slotToPx = (min: number) =>
    ((min - startHour * 60) / 60) * HOUR_HEIGHT;

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden animate-in fade-in duration-500">
      <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onToday}
            className="rounded-lg h-8 text-xs font-medium"
          >
            Today
          </Button>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={onPrevWeek}
              className="h-8 w-8 rounded-lg"
            >
              <ChevronLeft size={18} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onNextWeek}
              className="h-8 w-8 rounded-lg"
            >
              <ChevronRight size={18} />
            </Button>
          </div>
          <h3 className="font-semibold text-sm">
            {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}
          </h3>
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-3">
          <span>
            {displayEvents.length} event{displayEvents.length !== 1 ? "s" : ""}
          </span>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors print:hidden"
            title="Print weekly schedule"
          >
            <Printer size={12} />
            Print
          </button>
        </p>
      </div>

      <div className="flex">
        <div className="flex-1 min-w-0">
          <div className="flex border-b border-border">
            <div className="w-20 shrink-0" />
            {days.map((day, i) => (
              <div
                key={i}
                className={cn(
                  "flex-1 text-center py-2 border-l border-border/50",
                  isToday(day) && "bg-chart-destructive/[0.03]"
                )}
              >
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {DAY_LABELS[i]}
                </div>
                <div
                  className={cn(
                    "text-sm font-semibold leading-tight",
                    isToday(day) && "text-destructive"
                  )}
                >
                  {format(day, "d")}
                </div>
              </div>
            ))}
          </div>

          <div className="overflow-y-auto" style={{ maxHeight: "560px" }}>
            <div className="flex" style={{ height: totalHeight }}>
              <div className="w-20 shrink-0 border-r border-border bg-muted/10">
                {visibleHours.map((hour) => (
                  <div
                    key={hour}
                    className="border-t border-border/50"
                    style={{ height: HOUR_HEIGHT }}
                  >
                    <span className="block text-right pr-3 pt-1 text-[11px] font-medium text-muted-foreground leading-none">
                      {format(new Date().setHours(hour, 0, 0, 0), "ha").toLowerCase()}
                    </span>
                  </div>
                ))}
              </div>

              {days.map((day, dayIdx) => {
                const dayEvents = (displayEvents as any[])
                  .filter((e: any) => e.dayIndex === dayIdx)
                  .sort((a: any, b: any) => a.startMin - b.startMin);

                const conflicts = dayEvents.filter((ev, i) =>
                  dayEvents.some((other, j) =>
                    i !== j &&
                    ev.startMin < other.endMin &&
                    ev.endMin > other.startMin
                  )
                );
                const conflictIds = new Set(conflicts.map((c) => c.id));

                return (
                  <div
                    key={dayIdx}
                    className={cn(
                      "flex-1 relative border-l border-border/50",
                      isToday(day) && "bg-chart-destructive/[0.03]"
                    )}
                  >
                      {visibleHours.map((hour) => {
                      const hasEvent = dayEvents.some(
                        (e: any) => e.startMin < (hour + 1) * 60 && e.endMin > hour * 60
                      );
                      const dateKey = format(day, "yyyy-MM-dd");
                      const slotKey = `${dateKey}-${hour}`;
                      const isAvailable = !availableSlots || availableSlots.has(slotKey);
                      const slotClickable = onSlotClick && !hasEvent && isAvailable;
                      return (
                        <div
                          key={hour}
                          className={cn(
                            "border-t border-border/30",
                            slotClickable && "cursor-pointer hover:bg-chart-emerald/10 transition-colors"
                          )}
                          style={{ height: HOUR_HEIGHT }}
                          onClick={() => slotClickable && onSlotClick(day, hour)}
                        >
                          {slotClickable && (
                            <div className="flex items-center justify-center h-full gap-1">
                              <Plus size={14} className="text-chart-emerald/60 shrink-0" />
                              <span className="text-[10px] font-medium text-chart-emerald/60">Available</span>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {dayEvents.map((event: any) => {
                      const top = slotToPx(event.startMin);
                      const height = Math.max(
                        ((event.endMin - event.startMin) / 60) * HOUR_HEIGHT,
                        20
                      );
                      const ps = event.paymentStatus
                        ? paymentStyles[event.paymentStatus as string]
                        : null;
                      const tier = event.variant === "kinesiology"
                        ? rateTierStyles[getRateTier(event.standardRate ?? event.priceAmount)]
                        : null;
                      const vs = event.variant
                        ? variantStyles[event.variant]
                        : null;
                      const colorStyle = ps || tier || vs || "bg-muted/50 text-muted-foreground border-border/30";
                      const Icon = event.variant ? (variantIcons[event.variant] || Clock) : Clock;
                      const durMin = (event.endMin ?? 0) - (event.startMin ?? 0);
                      const durHr = durMin / 60;
                      const rateLabel = event.standardRate != null
                        ? `$${event.standardRate}`
                        : event.priceAmount != null
                        ? `$${event.priceAmount}`
                        : `$${Math.round((event.variant === "voice" ? voiceRatePerHour : fnhRatePerHour) * durHr)}`;
                      const isConflict = conflictIds.has(event.id);

                      return (
                        <Tooltip key={event.id}>
                          <TooltipTrigger asChild>
                            <a
                              href={event.url || "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={cn(
                                "absolute left-0.5 right-0.5 rounded-lg border px-1.5 py-1 overflow-hidden z-20",
                                "hover:opacity-90 transition-opacity cursor-pointer block",
                                colorStyle,
                                isConflict && "ring-2 ring-destructive ring-offset-1"
                              )}
                              style={{ top, height, minHeight: 20 }}
                            >
                              <div className="flex items-center gap-1">
                                {isConflict ? (
                                  <AlertCircle size={10} className="shrink-0 text-destructive" />
                                ) : (
                                  <Icon size={10} className="shrink-0 opacity-60" />
                                )}
                                <span className="text-[10px] font-medium truncate leading-tight">
                                  {event.title}
                                </span>
                              </div>
                              {event.subtitle && (
                                <div className="flex items-center gap-1 mt-0.5">
                                  <Clock size={8} className="shrink-0 opacity-50" />
                                  <span className="text-[8px] text-muted-foreground truncate leading-tight">
                                    {event.subtitle}
                                  </span>
                                </div>
                              )}
                            </a>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="rounded-xl p-3 shadow-sm border-none w-56 bg-popover">
                            <div className="space-y-1.5">
                              <p className="font-semibold text-foreground text-xs">{event.title}</p>
                              {event.subtitle && (
                                <p className="text-[10px] text-muted-foreground">{event.subtitle}</p>
                              )}
                              <div className="flex items-center justify-between text-[10px] pt-1 border-t border-border/50">
                                <span className="text-muted-foreground">Rate</span>
                                <span className="font-semibold text-chart-emerald">{rateLabel}</span>
                              </div>
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="text-muted-foreground">Duration</span>
                                <span className="font-medium">{durHr.toFixed(1)}h ({durMin}m)</span>
                              </div>
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="text-muted-foreground">Type</span>
                                <span className="font-medium">{event.variant === "voice" ? "Voice" : "FNH"}</span>
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="w-24 shrink-0 border-l border-border flex flex-col items-center justify-start pt-6 gap-3 bg-muted/5">
          <EarningsPanel
            summary={summary}
            voiceRate={voiceRatePerHour}
            fnhRate={fnhRatePerHour}
            label="This Week"
          />
        </div>
      </div>
    </div>
  );
};

export default WeeklyTimeGrid;
