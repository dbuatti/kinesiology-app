import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, Loader2, ExternalLink, Mic, User, RotateCcw
} from "lucide-react";
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays,
  eachDayOfInterval, isToday, parseISO
} from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import AppLayout from "@/components/crm/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface VoiceLesson {
  id: string;
  notionUrl: string | null;
  name: string | null;
  date: string | null;
  time: string | null;
  studentName: string | null;
  studentEmail: string | null;
}

interface KinesiologyAppt {
  id: string;
  date: string;
  clientName: string | null;
  status: string | null;
  tag: string | null;
  time: string | null;
}

interface CalendarItem {
  id: string;
  source: "kinesiology" | "voice";
  date: string;
  time: string | null;
  title: string;
  subtitle: string | null;
  url: string | null;
  tag: string | null;
}

const UnifiedCalendarPage = () => {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const fetchStart = subMonths(startDate, 1).toISOString();
  const fetchEnd = addMonths(endDate, 1).toISOString();

  const { data: voiceLessons, isLoading: voiceLoading, isError: voiceError, refetch: refetchVoice } = useQuery({
    queryKey: ["unified-voice-lessons", currentMonth.toISOString()],
    queryFn: async () => {
      const res = await supabase.functions.invoke("voice-lessons");
      if (res.error) throw res.error;
      return (res.data?.lessons || []) as VoiceLesson[];
    },
    staleTime: 60_000,
  });

  const { data: kinesiologyAppts, isLoading: kinesiologyLoading, isError: kinesiologyError, refetch: refetchKinesiology } = useQuery({
    queryKey: ["unified-kinesiology-appts", currentMonth.toISOString()],
    queryFn: async () => {
      const { data } = await supabase
        .from("appointments")
        .select("id, date, status, tag, clients (name)")
        .gte("date", fetchStart)
        .lte("date", fetchEnd)
        .order("date", { ascending: true });
      return (data || []).map((a: any) => ({
        id: a.id,
        date: a.date,
        clientName: a.clients?.name || "Unknown",
        status: a.status,
        tag: a.tag,
        time: null,
      })) as KinesiologyAppt[];
    },
    staleTime: 60_000,
  });

  const calendarItems: CalendarItem[] = useMemo(() => {
    const items: CalendarItem[] = [];

    (voiceLessons || []).forEach((l) => {
      if (!l.date) return;
      items.push({
        id: `v-${l.id}`,
        source: "voice",
        date: l.date,
        time: l.time || null,
        title: l.name || "Voice Lesson",
        subtitle: l.studentName || null,
        url: l.notionUrl || null,
        tag: "voice",
      });
    });

    (kinesiologyAppts || []).forEach((a) => {
      items.push({
        id: `k-${a.id}`,
        source: "kinesiology",
        date: a.date.split("T")[0],
        time: null,
        title: a.clientName || "Appointment",
        subtitle: null,
        url: `/appointments/${a.id}`,
        tag: a.tag || a.status || "Kinesiology",
      });
    });

    return items;
  }, [voiceLessons, kinesiologyAppts]);

  const getItemsForDay = (day: Date) =>
    calendarItems.filter((item) => isSameDay(new Date(item.date), day));

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
  const isLoading = voiceLoading || kinesiologyLoading;
  const hasError = voiceError || kinesiologyError;

  if (hasError) {
    return (
      <AppLayout>
        <div className="space-y-8 max-w-7xl mx-auto">
          <PageHeader
            title="Calendar"
            subtitle="Kinesiology appointments and voice lessons at a glance."
            icon={CalendarIcon}
            breadcrumbs={[{ label: "Home", path: "/" }, { label: "Calendar" }]}
          />
          <div className="p-24 flex flex-col items-center justify-center gap-6 bg-red-50 dark:bg-red-950/10 rounded-[2.5rem]">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
              <span className="text-2xl font-black text-red-500">!</span>
            </div>
            <p className="text-red-600 font-black text-xs uppercase tracking-widest text-center">Failed to load calendar data</p>
            <Button
              onClick={() => { refetchVoice(); refetchKinesiology(); }}
              className="bg-red-500 hover:bg-red-600 rounded-xl font-bold text-xs"
            >
              <RotateCcw size={14} className="mr-2" /> Retry
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        <PageHeader
          title="Calendar"
          subtitle="Kinesiology appointments and voice lessons at a glance."
          icon={CalendarIcon}
          iconClassName="bg-indigo-500 text-white dark:bg-indigo-500 dark:text-white"
          breadcrumbs={[
            { label: "Home", path: "/" },
            { label: "Calendar" },
          ]}
          actions={
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(-1)}
                className="h-10 px-4 rounded-xl border-border font-bold text-[10px] uppercase tracking-widest gap-2"
              >
                <ArrowLeft size={14} />
                Back
              </Button>
            </div>
          }
        />

        {isLoading ? (
          <div className="p-24 flex flex-col items-center justify-center gap-6">
            <Loader2 className="animate-spin text-indigo-500" size={48} />
            <p className="text-muted-foreground font-black text-xs uppercase tracking-widest">
              Loading calendar...
            </p>
          </div>
        ) : (
          <div className="bg-card rounded-[2.5rem] border border-border shadow-xl overflow-hidden animate-in fade-in duration-500">
            {/* Legend */}
            <div className="px-8 pt-6 pb-0 flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-500" />
                <span className="text-[10px] font-bold text-muted-foreground">Kinesiology</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="text-[10px] font-bold text-muted-foreground">Voice Studio</span>
              </div>
            </div>

            {/* Calendar Header */}
            <div className="p-8 border-b border-border flex items-center justify-between bg-muted/30">
              <div>
                <h2 className="text-3xl font-black text-foreground tracking-tight">
                  {format(currentMonth, "MMMM yyyy")}
                </h2>
                <p className="text-muted-foreground font-medium text-sm mt-1">
                  {calendarItems.length} item{calendarItems.length !== 1 ? "s" : ""} scheduled
                </p>
              </div>
              <div className="flex gap-2 items-center">
                <Button variant="outline" size="icon" onClick={prevMonth} className="rounded-xl h-12 w-12">
                  <ChevronLeft size={24} />
                </Button>
                <Button variant="outline" size="icon" onClick={nextMonth} className="rounded-xl h-12 w-12">
                  <ChevronRight size={24} />
                </Button>
              </div>
            </div>

            {/* Days of Week */}
            <div className="grid grid-cols-7 border-b border-border">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="py-4 text-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day) => {
                const dayItems = getItemsForDay(day);
                const isCurrent = isSameMonth(day, monthStart);
                const isCurrentDay = isToday(day);
                const voiceCount = dayItems.filter((i) => i.source === "voice").length;
                const kinesiologyCount = dayItems.filter((i) => i.source === "kinesiology").length;

                return (
                  <div
                    key={day.toString()}
                    className={cn(
                      "min-h-[130px] p-3 border-r border-b border-border/50 transition-colors",
                      !isCurrent && "bg-muted/20 opacity-40",
                      isCurrentDay && "bg-indigo-50/30 dark:bg-indigo-950/10"
                    )}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span
                        className={cn(
                          "w-8 h-8 flex items-center justify-center rounded-full text-sm font-black",
                          isCurrentDay
                            ? "bg-indigo-500 text-white shadow-lg shadow-indigo-200"
                            : "text-muted-foreground"
                        )}
                      >
                        {format(day, "d")}
                      </span>
                      {dayItems.length > 0 && (
                        <div className="flex gap-1">
                          {kinesiologyCount > 0 && (
                            <Badge className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 border-none text-[9px] font-black">
                              {kinesiologyCount}
                            </Badge>
                          )}
                          {voiceCount > 0 && (
                            <Badge className="bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 border-none text-[9px] font-black">
                              {voiceCount}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      {dayItems.slice(0, 3).map((item) => (
                        <Tooltip key={item.id}>
                          <TooltipTrigger asChild>
                            {item.url ? (
                              <a
                                href={item.url}
                                target={item.source === "voice" ? "_blank" : undefined}
                                rel={item.source === "voice" ? "noopener noreferrer" : undefined}
                                className={cn(
                                  "block p-1.5 rounded-lg text-[9px] font-bold truncate transition-all hover:scale-[1.02] border",
                                  item.source === "voice"
                                    ? "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-100 dark:border-rose-800/40"
                                    : "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 border-indigo-100 dark:border-indigo-800/40"
                                )}
                              >
                                <div className="flex items-center gap-1">
                                  {item.source === "voice" ? (
                                    <Mic size={9} className="shrink-0 opacity-60" />
                                  ) : (
                                    <User size={9} className="shrink-0 opacity-60" />
                                  )}
                                  <span className="truncate">{item.title}</span>
                                </div>
                              </a>
                            ) : (
                              <div
                                className={cn(
                                  "block p-1.5 rounded-lg text-[9px] font-bold truncate transition-all hover:scale-[1.02] border",
                                  item.source === "voice"
                                    ? "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-100 dark:border-rose-800/40"
                                    : "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 border-indigo-100 dark:border-indigo-800/40"
                                )}
                              >
                                <div className="flex items-center gap-1">
                                  {item.source === "voice" ? (
                                    <Mic size={9} className="shrink-0 opacity-60" />
                                  ) : (
                                    <User size={9} className="shrink-0 opacity-60" />
                                  )}
                                  <span className="truncate">{item.title}</span>
                                </div>
                              </div>
                            )}
                          </TooltipTrigger>
                          <TooltipContent className="rounded-xl p-3 shadow-2xl border-none w-64 bg-popover">
                            <div className="space-y-2">
                              <p className="font-black text-foreground text-sm">{item.title}</p>
                              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                <CalendarIcon size={10} />
                                {format(new Date(item.date), "EEE, MMM d, yyyy")}
                                {item.time && (
                                  <>
                                    <span className="opacity-40">·</span>
                                    <Clock size={10} />
                                    {item.time}
                                  </>
                                )}
                              </div>
                              {item.subtitle && (
                                <div className="text-[10px] text-muted-foreground font-medium">
                                  {item.source === "voice" ? "Student" : "Client"}: {item.subtitle}
                                </div>
                              )}
                              <Badge
                                className={cn(
                                  "text-[9px] font-black border-none",
                                  item.source === "voice"
                                    ? "bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400"
                                    : "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400"
                                )}
                              >
                                {item.source === "voice" ? "Voice" : item.tag || "Kinesiology"}
                              </Badge>
                              {item.url && item.source === "voice" && (
                                <div className="flex items-center gap-1 text-[10px] text-rose-500">
                                  <ExternalLink size={10} /> Open in Notion
                                </div>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                      {dayItems.length > 3 && (
                        <p className="text-[9px] font-black text-muted-foreground text-center pt-0.5">
                          + {dayItems.length - 3} more
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default UnifiedCalendarPage;
