import { useState, useMemo } from "react";
import {
  format,
  startOfWeek,
  addDays,
  addWeeks,
  isToday,
  isSameDay,
  parseISO,
} from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  Music,
  User,
  Plus,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { CALCOM_CONFIG } from "@/config/integrations";
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/utils/toast";
import { useAuth } from "@/components/AuthProvider";
import { formatVoiceTime, parseAmPmToMinutes } from "@/utils/availability";
import { calcSummary, fmtHours, fmtCurrency, WeeklySummary } from "@/components/crm/WeeklyTimeGrid";

interface VoiceLesson {
  id: string;
  notionUrl: string | null;
  name: string | null;
  date: string | null;
  time: string | null;
  studentName: string | null;
  studentEmail: string | null;
  cost: number | null;
  priceAmount: number | null;
}

interface KinesiologyAppt {
  id: string;
  date: string;
  clientName: string | null;
  status: string | null;
  tag: string | null;
  time: string | null;
  priceAmount: number | null;
  standardRate: number | null;
  calcomUid?: string | null;
}

interface DaySlot {
  timeMin: number;
  timeLabel: string;
  type: "available" | "fnh" | "voice";
  clientName?: string;
  endLabel?: string;
  url?: string;
  isoTime?: string;
  priceAmount?: number | null;
  standardRate?: number | null;
}

interface WeekByWeekOverviewProps {
  weekStart: Date;
  voiceLessons: VoiceLesson[];
  kinesiologyAppts: KinesiologyAppt[];
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  numWeeks?: number;
}

const NUM_WEEKS = 6;
const DAY_START_HOUR = 9;
const DAY_END_HOUR = 19;

const WeekByWeekOverview = ({
  weekStart,
  voiceLessons,
  kinesiologyAppts,
  onPrevWeek,
  onNextWeek,
  onToday,
  numWeeks = NUM_WEEKS,
}: WeekByWeekOverviewProps) => {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [bookingSlot, setBookingSlot] = useState<{ date: Date; isoTime: string; timeLabel: string } | null>(null);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  const fetchStart = weekStart.toISOString();
  const fetchEnd = addWeeks(weekStart, numWeeks).toISOString();

  const { data: slotsData, isLoading: slotsLoading } = useQuery({
    queryKey: ["overview-calcom-slots", weekStart.toISOString()],
    queryFn: async () => {
      const res = await supabase.functions.invoke("get-calcom-slots", {
        body: {
          start: fetchStart,
          end: fetchEnd,
          eventTypeId: CALCOM_CONFIG.DEFAULT_EVENT_TYPE_ID,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      });
      if (res.error) throw res.error;
      return res.data;
    },
    staleTime: 60_000,
  });

  const { data: clients } = useQuery({
    queryKey: ["overview-clients"],
    queryFn: async () => {
      const { data } = await supabase
        .from("clients")
        .select("id, name, is_practitioner")
        .eq("is_practitioner", false)
        .order("name", { ascending: true });
      return data || [];
    },
    staleTime: 300_000,
  });

  const bookMutation = useMutation({
    mutationFn: async ({ clientId, isoTime }: { clientId: string; isoTime: string }) => {
      const client = (clients || []).find((c: any) => c.id === clientId);
      const clientName = client?.name || "Unknown Client";
      const sessionLabel = `${clientName} — Kinesiology (${format(parseISO(isoTime), "MMM d, yyyy")})`;
      const { data: calcomData, error: invokeError } = await supabase.functions.invoke(
        "create-calcom-booking",
        {
          body: {
            clientId,
            startTime: isoTime,
            eventTypeId: CALCOM_CONFIG.DEFAULT_EVENT_TYPE_ID,
            title: sessionLabel,
            notes: "",
            is_paid: true,
          },
        }
      );
      if (invokeError) throw invokeError;
      const calcomId = calcomData?.uid || calcomData?.bookingId || null;

      const { data: newApp, error: dbError } = await supabase
        .from("appointments")
        .upsert({
          user_id: session?.user?.id,
          client_id: clientId,
          date: isoTime,
          tag: "Kinesiology",
          status: "Scheduled",
          is_paid: true,
          calcom_booking_id: calcomId,
          price_amount: 50,
          price_currency: "AUD",
          name: sessionLabel,
        }, { onConflict: calcomId ? "calcom_booking_id" : "id" })
        .select("id")
        .single();
      if (dbError) throw dbError;
      return newApp;
    },
    onSuccess: () => {
      showSuccess("Session booked successfully!");
      queryClient.invalidateQueries({ queryKey: ["unified-kinesiology-appts"] });
      queryClient.invalidateQueries({ queryKey: ["overview-calcom-slots"] });
      setBookingSlot(null);
      setSelectedClient(null);
    },
    onError: (err: any) => {
      showError(err.message || "Failed to book session");
    },
  });

  const weeks = useMemo(() => {
    return Array.from({ length: numWeeks }, (_, i) => {
      const ws = startOfWeek(addWeeks(weekStart, i));
      return Array.from({ length: 5 }, (_, j) => addDays(ws, j + 1));
    });
  }, [weekStart, numWeeks]);

  const slotsByDate: Record<string, any[]> = slotsData?.data || {};

  // Deduplicate kinesiologyAppts by calcomUid — if the same Cal.com booking
  // appears on multiple dates (e.g. stale row after reschedule), keep the latest.
  const dedupedKinesiologyAppts = useMemo(() => {
    const seen = new Map<string, KinesiologyAppt>();
    const standalone: KinesiologyAppt[] = [];
    for (const a of kinesiologyAppts) {
      if (a.status === "Cancelled") continue;
      if (a.calcomUid) {
        const existing = seen.get(a.calcomUid);
        if (!existing || new Date(a.date) > new Date(existing.date)) {
          seen.set(a.calcomUid, a);
        }
      } else {
        standalone.push(a);
      }
    }
    return [...standalone, ...seen.values()];
  }, [kinesiologyAppts]);

  const getDaySlots = (day: Date): DaySlot[] => {
    const dateKey = format(day, "yyyy-MM-dd");
    const slots: DaySlot[] = [];

    (slotsByDate[dateKey] || []).forEach((s: any) => {
      const date = parseISO(s.time);
      const timeMin = date.getHours() * 60 + date.getMinutes();
      if (timeMin >= DAY_START_HOUR * 60 && timeMin < DAY_END_HOUR * 60) {
        slots.push({
          timeMin,
          timeLabel: format(date, "h:mm a"),
          type: "available",
          isoTime: s.time,
        });
      }
    });

    dedupedKinesiologyAppts.forEach((a) => {
      const appDate = new Date(a.date);
      if (isSameDay(appDate, day)) {
        const timeMin = appDate.getHours() * 60 + appDate.getMinutes();
        if (timeMin >= DAY_START_HOUR * 60 && timeMin < DAY_END_HOUR * 60) {
          slots.push({
            timeMin,
            timeLabel: format(appDate, "h:mm a"),
            type: "fnh",
            clientName: a.clientName || undefined,
            url: `/appointments/${a.id}`,
            priceAmount: a.priceAmount,
            standardRate: a.standardRate,
          });
        }
      }
    });

    voiceLessons.forEach((l) => {
      if (l.date === dateKey && l.time) {
        const timeStr = formatVoiceTime(l.date, l.time);
        if (timeStr) {
          const timeMin = parseAmPmToMinutes(timeStr);
          if (timeMin !== null && timeMin >= DAY_START_HOUR * 60 && timeMin < DAY_END_HOUR * 60) {
            slots.push({
              timeMin,
              timeLabel: timeStr,
              type: "voice",
              clientName: l.studentName || l.name || undefined,
              url: l.notionUrl || undefined,
              priceAmount: l.priceAmount,
            });
          }
        }
      }
    });

    const bookedTimes = slots
      .filter((s) => s.type !== "available")
      .map((s) => s.timeMin);
    const filtered = slots.filter(
      (s) => s.type !== "available" || !bookedTimes.some((bt) => Math.abs(bt - s.timeMin) < 30)
    );

    return filtered.sort((a, b) => a.timeMin - b.timeMin);
  };

  const getWeekSummary = (week: Date[]): WeeklySummary => {
    const events: any[] = [];
    week.forEach((day) => {
      dedupedKinesiologyAppts.forEach((a) => {
        const appDate = new Date(a.date);
        if (isSameDay(appDate, day)) {
          const startMin = appDate.getHours() * 60 + appDate.getMinutes();
          events.push({
            startMin,
            endMin: startMin + 60,
            variant: "kinesiology",
            standardRate: a.standardRate,
            priceAmount: a.priceAmount,
          });
        }
      });
      voiceLessons.forEach((l) => {
        if (l.date === format(day, "yyyy-MM-dd") && l.time) {
          const timeStr = formatVoiceTime(l.date, l.time);
          if (timeStr) {
            const startMin = parseAmPmToMinutes(timeStr);
            if (startMin !== null) {
              const parts = timeStr.split("–").map((s) => s.trim());
              let endMin = startMin + 60;
              if (parts.length === 2) {
                const endParsed = parseAmPmToMinutes(parts[1]);
                if (endParsed !== null) endMin = endParsed;
              }
              events.push({
                startMin,
                endMin,
                variant: "voice",
                priceAmount: null,
                standardRate: null,
              });
            }
          }
        }
      });
    });
    return calcSummary(events, 95, 50);
  };

  const handleBook = () => {
    if (!bookingSlot || !selectedClient) return;
    bookMutation.mutate({ clientId: selectedClient, isoTime: bookingSlot.isoTime });
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-amber-50/40 to-card dark:from-amber-950/10 rounded-[1.5rem] border border-border/60 shadow-[0_2px_20px_-10px_rgba(120,90,40,0.15)] p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onToday} className="rounded-lg h-8 text-xs font-medium">
            Today
          </Button>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={onPrevWeek} className="h-8 w-8 rounded-lg">
              <ChevronLeft size={18} />
            </Button>
            <Button variant="ghost" size="icon" onClick={onNextWeek} className="h-8 w-8 rounded-lg">
              <ChevronRight size={18} />
            </Button>
          </div>
          <h3 className="font-semibold text-sm">
            {format(weekStart, "MMM d")} – {format(addWeeks(weekStart, numWeeks - 1), "MMM d, yyyy")}
          </h3>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-medium text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-chart-primary" /> FNH
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-chart-destructive" /> Voice
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border-2 border-chart-emerald border-dashed" /> Available
          </span>
        </div>
      </div>

      {slotsLoading ? (
        <div className="p-24 flex flex-col items-center justify-center gap-6 bg-card rounded-xl border border-border">
          <Loader2 className="animate-spin text-primary" size={32} />
          <p className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">
            Loading availability…
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {weeks.map((week, weekIdx) => {
            const totalSlots = week.reduce((acc, day) => acc + getDaySlots(day).length, 0);
            const bookedCount = week.reduce(
              (acc, day) => acc + getDaySlots(day).filter((s) => s.type !== "available").length,
              0
            );
            const availCount = totalSlots - bookedCount;
            const wkSummary = getWeekSummary(week);
            const isCurrentWeek = week.some((d) => isToday(d));
            const overworkColor =
              wkSummary.totalHours >= 25
                ? "text-destructive"
                : wkSummary.totalHours >= 20
                ? "text-amber-500"
                : "text-chart-emerald";

            return (
              <div
                key={weekIdx}
                className={cn(
                  "bg-card rounded-[1.5rem] border border-border/60 shadow-[0_4px_30px_-14px_rgba(120,90,40,0.16)] overflow-hidden animate-in fade-in duration-300",
                  isCurrentWeek ? "border-destructive/30 ring-1 ring-destructive/20" : "border-border"
                )}
              >
                <div className="px-4 py-2.5 border-b border-border bg-muted/30 flex items-center justify-between flex-wrap gap-y-2">
                  <div className="flex items-center gap-2">
                    {isCurrentWeek && (
                      <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                    )}
                    <h3 className="font-semibold text-sm">
                      Week of {format(week[0], "MMM d")}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-medium text-muted-foreground">
                    <span className="text-chart-primary">{bookedCount} booked</span>
                    <span className="text-chart-emerald">{availCount} open</span>
                    <span className="text-muted-foreground/60">·</span>
                    <span className={overworkColor}>
                      {fmtHours(wkSummary.totalHours)} load
                    </span>
                    <span className="text-muted-foreground/60">·</span>
                    <span className="text-foreground font-semibold">
                      {fmtCurrency(wkSummary.totalIncome).replace(/^.\s?/, "$")}
                    </span>
                  </div>
                </div>
                <div className="px-4 py-1.5 border-b border-border/50 bg-muted/10 flex items-center gap-4 text-[9px] text-muted-foreground">
                  <span>Appts: <strong className="text-foreground">{fmtHours(wkSummary.apptHours)}</strong></span>
                  <span>Buffer: <strong className="text-foreground">{fmtHours(wkSummary.bufferHours)}</strong></span>
                  <span>FNH: <strong className="text-chart-primary">{wkSummary.fnhCount}</strong></span>
                  <span>Voice: <strong className="text-chart-destructive">{wkSummary.voiceCount}</strong></span>
                  <span>FNH $: <strong className="text-foreground">{fmtCurrency(wkSummary.fnhIncome).replace(/^.\s?/, "$")}</strong></span>
                  <span>Voice $: <strong className="text-foreground">{fmtCurrency(wkSummary.voiceIncome).replace(/^.\s?/, "$")}</strong></span>
                  {wkSummary.totalHours >= 20 && (
                    <span className={cn("font-bold ml-auto", overworkColor)}>
                      {wkSummary.totalHours >= 25 ? "⚠ OVERWORK" : "⚠ HIGH LOAD"}
                    </span>
                  )}
                </div>
                <div className="px-4 py-2 border-b border-border/50 bg-muted/5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">Workload</span>
                    <span className={cn("text-[10px] font-bold", overworkColor)}>
                      {fmtHours(wkSummary.totalHours)} / 25h max
                    </span>
                  </div>
                  <div className="relative h-3 rounded-full bg-muted overflow-hidden border border-border/50">
                    <div className="absolute inset-y-0 left-0 w-full flex">
                      <div
                        className="bg-chart-primary/60 h-full"
                        style={{ width: `${Math.min((wkSummary.apptHours / 25) * 100, 100)}%` }}
                        title={`Appointments ${fmtHours(wkSummary.apptHours)}`}
                      />
                      <div
                        className="bg-chart-primary/25 h-full"
                        style={{ width: `${Math.min((wkSummary.bufferHours / 25) * 100, 100)}%` }}
                        title={`Buffer ${fmtHours(wkSummary.bufferHours)}`}
                      />
                    </div>
                    <div className="absolute inset-y-0 w-px bg-amber-500/60" style={{ left: `${(20 / 25) * 100}%` }} title="20h high load" />
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[8px] text-muted-foreground">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-chart-primary/60" /> Appts</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-chart-primary/25" /> Buffer</span>
                    <span className="flex items-center gap-1"><span className="w-px h-2 bg-amber-500/60" /> 20h</span>
                  </div>
                </div>

                <div className="grid grid-cols-5">
                  {week.map((day, dayIdx) => {
                    const daySlots = getDaySlots(day);
                    const todayFlag = isToday(day);

                    return (
                      <div
                        key={dayIdx}
                        className={cn(
                          "border-l border-border/50 min-h-[180px]",
                          todayFlag && "bg-chart-destructive/[0.02]",
                          dayIdx === 0 && "border-l-0"
                        )}
                      >
                        <div
                          className={cn(
                            "px-3 py-2 border-b border-border/30 text-center",
                            todayFlag && "bg-chart-destructive/5"
                          )}
                        >
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {format(day, "EEE")}
                          </div>
                          <div
                            className={cn(
                              "text-sm font-semibold",
                              todayFlag && "text-destructive"
                            )}
                          >
                            {format(day, "d")}
                          </div>
                        </div>

                        <div className="p-1.5 space-y-1.5">
                          {daySlots.length === 0 ? (
                            <p className="text-[10px] text-muted-foreground/40 text-center py-6 italic">
                              No slots
                            </p>
                          ) : (
                            daySlots.map((slot, idx) => {
                              if (slot.type === "available") {
                                return (
                                  <button
                                    key={idx}
                                    onClick={() =>
                                      setBookingSlot({
                                        date: day,
                                        isoTime: slot.isoTime!,
                                        timeLabel: slot.timeLabel,
                                      })
                                    }
                                    className="w-full flex items-center gap-1.5 p-2 rounded-lg border-2 border-dashed border-chart-emerald/30 text-[10px] font-medium text-chart-emerald hover:border-chart-emerald hover:bg-chart-emerald/5 transition-all group"
                                  >
                                    <Plus size={11} className="shrink-0 opacity-60 group-hover:opacity-100" />
                                    <span>{slot.timeLabel}</span>
                                  </button>
                                );
                              }

                              const isVoice = slot.type === "voice";
                              const Icon = isVoice ? Music : User;

                              return (
                                <Tooltip key={idx}>
                                  <TooltipTrigger asChild>
                                    <a
                                      href={slot.url || "#"}
                                      target={isVoice ? "_blank" : undefined}
                                      rel={isVoice ? "noopener noreferrer" : undefined}
                                      className={cn(
                                        "w-full flex items-center gap-1.5 p-2 rounded-lg border text-[10px] font-medium transition-all hover:scale-[1.02] block",
                                        isVoice
                                          ? "bg-chart-destructive/10 text-chart-destructive border-chart-destructive/20"
                                          : "bg-chart-primary/10 text-chart-primary border-chart-primary/20"
                                      )}
                                    >
                                      <Icon size={11} className="shrink-0 opacity-60" />
                                      <div className="flex-1 min-w-0">
                                        <div className="truncate font-semibold">
                                          {slot.clientName || (isVoice ? "Voice Lesson" : "FNH Session")}
                                        </div>
                                        <div className="flex items-center gap-1 text-[9px] opacity-70">
                                          <Clock size={8} />
                                          {slot.timeLabel}
                                        </div>
                                      </div>
                                      {(slot.standardRate != null ? slot.standardRate : slot.priceAmount) != null &&
                                       (slot.standardRate ?? slot.priceAmount!) > 0 && (
                                        <span className="text-[9px] font-bold opacity-80 shrink-0">
                                          ${slot.standardRate ?? slot.priceAmount}
                                        </span>
                                      )}
                                    </a>
                                  </TooltipTrigger>
                                  <TooltipContent
                                    side="top"
                                    className="rounded-xl p-3 shadow-sm border-none w-52 bg-popover"
                                  >
                                    <div className="space-y-1.5">
                                      <p className="font-semibold text-foreground text-xs">
                                        {slot.clientName || (isVoice ? "Voice Lesson" : "FNH Session")}
                                      </p>
                                      <p className="text-[10px] text-muted-foreground">
                                        {format(day, "EEE, MMM d")} · {slot.timeLabel}
                                      </p>
                                      <div className="flex items-center justify-between text-[10px] pt-1 border-t border-border/50">
                                        <span className="text-muted-foreground">Type</span>
                                        <span className="font-medium">{isVoice ? "Voice" : "FNH"}</span>
                                      </div>
                                      {slot.standardRate != null ? (
                                        <div className="flex items-center justify-between text-[10px]">
                                          <span className="text-muted-foreground">Rate</span>
                                          <span className="font-semibold text-chart-emerald">
                                            ${slot.standardRate}
                                          </span>
                                        </div>
                                      ) : slot.priceAmount != null ? (
                                        <div className="flex items-center justify-between text-[10px]">
                                          <span className="text-muted-foreground">Rate</span>
                                          <span className="font-semibold text-chart-emerald">
                                            ${slot.priceAmount}
                                          </span>
                                        </div>
                                      ) : null}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!bookingSlot} onOpenChange={(open) => !open && setBookingSlot(null)}>
        <DialogContent className="sm:max-w-[480px] rounded-2xl p-0 mx-4 w-[calc(100%-2rem)] flex flex-col bg-background">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-chart-emerald text-primary-foreground flex items-center justify-center shadow-sm">
                <CalendarIcon size={20} />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">Book FNH Session</DialogTitle>
                <DialogDescription className="text-muted-foreground text-xs">
                  {bookingSlot && `${format(bookingSlot.date, "EEE, MMM d")} at ${bookingSlot.timeLabel}`}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="px-6 py-5 space-y-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                Select Client
              </p>
              <div className="max-h-64 overflow-y-auto space-y-1.5">
                {(clients || []).map((c: any) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedClient(c.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left",
                      selectedClient === c.id
                        ? "border-chart-emerald bg-chart-emerald/5"
                        : "border-border hover:border-chart-emerald/30"
                    )}
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User size={14} className="text-primary" />
                    </div>
                    <span className="text-sm font-medium truncate">{c.name}</span>
                  </button>
                ))}
                {(clients || []).length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">No clients found</p>
                )}
              </div>
            </div>
          </div>

          <div className="px-6 pb-6 pt-2 border-t border-border">
            <Button
              onClick={handleBook}
              disabled={!selectedClient || bookMutation.isPending}
              className="w-full bg-chart-emerald hover:bg-chart-emerald/90 h-12 rounded-xl font-semibold text-sm"
            >
              {bookMutation.isPending ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" /> Booking…
                </>
              ) : (
                <>
                  <Plus size={16} className="mr-2" /> Book Session
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WeekByWeekOverview;
