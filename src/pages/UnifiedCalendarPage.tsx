import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
 ArrowLeft, Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, Loader2, ExternalLink, Mic, User, RotateCcw, Plus
} from "lucide-react";
import {
  format, addMonths, subMonths, addWeeks, subWeeks, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays,
  eachDayOfInterval, isToday, parseISO, setHours, setMinutes
} from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import AppLayout from "@/components/crm/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import WeeklyTimeGrid, {
  CalendarEvent,
  calcSummary,
  EarningsPanel,
} from "@/components/crm/WeeklyTimeGrid";
import WeekByWeekOverview from "@/components/crm/WeekByWeekOverview";
import { supabase } from "@/integrations/supabase/client";
import { CALCOM_CONFIG } from "@/config/integrations";
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/utils/toast";
import { useAuth } from "@/components/AuthProvider";
import { formatVoiceTime } from "@/utils/availability";

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
 priceAmount: number | null;
 standardRate: number | null;
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
 priceAmount?: number | null;
 standardRate?: number | null;
}

function parseTimeToEvent(item: CalendarItem): CalendarEvent | null {
  const timeStr = item.time || "";
  const startMatch = timeStr.match(/^(\d+):(\d+)\s*(AM|PM)/i);
  if (!startMatch) return null;
  let startH = parseInt(startMatch[1]);
  const startM = parseInt(startMatch[2]);
  if (startMatch[3].toUpperCase() === "PM" && startH !== 12) startH += 12;
  if (startMatch[3].toUpperCase() === "AM" && startH === 12) startH = 0;

  let endH: number;
  let endM: number;
  const endMatch = timeStr.match(/–\s*(\d+):(\d+)\s*(AM|PM)/i);
  if (endMatch) {
    endH = parseInt(endMatch[1]);
    endM = parseInt(endMatch[2]);
    if (endMatch[3].toUpperCase() === "PM" && endH !== 12) endH += 12;
    if (endMatch[3].toUpperCase() === "AM" && endH === 12) endH = 0;
  } else {
    const nameLower = (item.title || "").toLowerCase();
    const is45 = /45\s*min|45min|45m/.test(nameLower) || /\b45\b/.test(nameLower);
    const durMin = is45 ? 45 : 60;
    endH = startH + Math.floor((startM + durMin) / 60);
    endM = (startM + durMin) % 60;
  }

  const itemDate = new Date(item.date);

  return {
    id: item.id,
    dayIndex: itemDate.getDay(),
    startMin: startH * 60 + startM,
    endMin: endH * 60 + endM,
    title: item.subtitle || item.title,
    subtitle: item.time,
    url: item.url,
    variant: item.source === "voice" ? "voice" as const : "kinesiology" as const,
    priceAmount: item.priceAmount ?? null,
    standardRate: item.standardRate ?? null,
  };
}

const UnifiedCalendarPage = () => {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week" | "overview">("month");
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));
  const [bookSlot, setBookSlot] = useState<{ date: Date; hour: number } | null>(null);
  const [bookClient, setBookClient] = useState<string | null>(null);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextWeek = () => setWeekStart(addWeeks(weekStart, 1));
  const prevWeek = () => setWeekStart(subWeeks(weekStart, 1));
  const goToToday = () => {
    setCurrentMonth(new Date());
    setWeekStart(startOfWeek(new Date()));
  };

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
 .select("id, date, status, tag, price_amount, clients (name, is_practitioner, standard_rate)")
 .gte("date", fetchStart)
 .lte("date", fetchEnd)
 .order("date", { ascending: true });
 return (data || [])
   .filter((a: any) => !(a.clients?.is_practitioner))
   .map((a: any) => ({
 id: a.id,
 date: a.date,
 clientName: a.clients?.name || "Unknown",
 status: a.status,
 tag: a.tag,
 time: null,
 priceAmount: a.price_amount ?? null,
 standardRate: a.clients?.standard_rate ?? null,
})) as KinesiologyAppt[];
 },
  staleTime: 60_000,
  });

  const { session } = useAuth();
  const queryClient = useQueryClient();

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
    mutationFn: async ({ clientId, date }: { clientId: string; date: Date }) => {
      const isoTime = date.toISOString();
      const { data: calcomData, error: invokeError } = await supabase.functions.invoke(
        "create-calcom-booking",
        {
          body: {
            clientId,
            startTime: isoTime,
            eventTypeId: CALCOM_CONFIG.DEFAULT_EVENT_TYPE_ID,
            title: `FNH Session — ${format(date, "MMM d, yyyy")}`,
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
          name: `Session — ${format(date, "MMM d, yyyy")}`,
        }, { onConflict: calcomId ? "calcom_booking_id" : "id" })
        .select("id")
        .single();
      if (dbError) throw dbError;
      return newApp;
    },
    onSuccess: () => {
      showSuccess("Session booked successfully!");
      queryClient.invalidateQueries({ queryKey: ["unified-kinesiology-appts"] });
      setBookSlot(null);
      setBookClient(null);
    },
    onError: (err: any) => {
      showError(err.message || "Failed to book session");
    },
  });

  const calendarItems: CalendarItem[] = useMemo(() => {
 const items: CalendarItem[] = [];

  (voiceLessons || []).forEach((l) => {
  if (!l.date) return;
  items.push({
  id: `v-${l.id}`,
  source: "voice",
  date: l.date,
  time: l.date && l.time ? formatVoiceTime(l.date, l.time) : null,
  title: l.name || "Voice Lesson",
  subtitle: l.studentName || null,
  url: l.notionUrl || null,
  tag: "voice",
  });
  });

  (kinesiologyAppts || []).forEach((a) => {
  const appDate = new Date(a.date);
  items.push({
  id: `k-${a.id}`,
  source: "kinesiology",
  date: format(appDate, 'yyyy-MM-dd'),
  time: format(appDate, 'h:mm a'),
  title: a.clientName || "Appointment",
 subtitle: null,
 url: `/appointments/${a.id}`,
 tag: a.tag || a.status || "Kinesiology",
 priceAmount: a.priceAmount,
 standardRate: a.standardRate,
 });
 });

  items.sort((a, b) => {
  const dateCmp = a.date.localeCompare(b.date);
  if (dateCmp !== 0) return dateCmp;
  const parseStart = (t: string) => {
  const m = t.match(/^(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return 0;
  let h = parseInt(m[1]);
  const min = parseInt(m[2]);
  if (m[3].toUpperCase() === "PM" && h !== 12) h += 12;
  if (m[3].toUpperCase() === "AM" && h === 12) h = 0;
  return h * 60 + min;
  };
  return parseStart(a.time || "") - parseStart(b.time || "");
  });
  return items;
  }, [voiceLessons, kinesiologyAppts]);

  const weeklyEvents: CalendarEvent[] = useMemo(() => {
  const ws = startOfWeek(weekStart);
  const we = endOfWeek(weekStart);
  return calendarItems
    .filter((item) => item.time && new Date(item.date) >= ws && new Date(item.date) <= we)
    .map(parseTimeToEvent)
    .filter((e): e is CalendarEvent => e !== null);
  }, [calendarItems, weekStart]);

  const monthlyEvents: CalendarEvent[] = useMemo(() => {
    return calendarItems
      .filter((item) => item.time && new Date(item.date) >= monthStart && new Date(item.date) <= monthEnd)
      .map(parseTimeToEvent)
      .filter((e): e is CalendarEvent => e !== null);
  }, [calendarItems, monthStart, monthEnd]);

  const monthlySummary = useMemo(
    () => calcSummary(monthlyEvents, 95, 50),
    [monthlyEvents]
  );

  const getItemsForDay = (day: Date) =>
  calendarItems.filter((item) => isSameDay(new Date(item.date), day));

 const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
 const isLoading = voiceLoading || kinesiologyLoading;
 const hasError = voiceError || kinesiologyError;

 if (hasError) {
 return (
<AppLayout variant="workspace">
 <div className="space-y-8 max-w-7xl mx-auto">
 <PageHeader
 title="Calendar"
 subtitle="Kinesiology appointments and voice lessons at a glance."
           icon={CalendarIcon}
           />
 <div className="p-24 flex flex-col items-center justify-center gap-6 bg-destructive/10 rounded-xl">
 <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
 <span className="text-2xl font-semibold text-destructive">!</span>
 </div>
 <p className="text-destructive font-semibold text-xs uppercase tracking-wider text-center">Failed to load calendar data</p>
 <Button
 onClick={() => { refetchVoice(); refetchKinesiology(); }}
 className="bg-destructive hover:bg-destructive/80 rounded-xl font-medium text-xs"
 >
 <RotateCcw size={14} className="mr-2" /> Retry
 </Button>
 </div>
 </div>
 </AppLayout>
 );
 }

 return (
 <AppLayout variant="workspace">
 <div className="space-y-8 max-w-7xl mx-auto">
 <PageHeader
 title="Calendar"
 subtitle="Kinesiology appointments and voice lessons at a glance."
  icon={CalendarIcon}
  iconClassName="bg-primary text-white "
  actions={
 <div className="flex gap-2">
 <Button
 variant="outline"
 size="sm"
 onClick={() => navigate(-1)}
 className="h-10 px-4 rounded-xl border-border font-medium text-[10px] uppercase tracking-wider gap-2"
 >
 <ArrowLeft size={14} />
 Back
 </Button>
 </div>
 }
 />

 {isLoading ? (
 <div className="p-24 flex flex-col items-center justify-center gap-6">
 <Loader2 className="animate-spin text-primary" size={48} />
 <p className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">
 Loading calendar...
 </p>
 </div>
 ) : (

 <div className="flex gap-4 items-start">

   <div className="flex-1 min-w-0">

   {/* Shared view toggle */}
   <div className="flex items-center justify-between mb-4">
     <div className="flex bg-muted rounded-xl p-0.5 border border-border">
       <button
         onClick={() => setViewMode("month")}
         className={cn(
           "px-4 py-2 rounded-[10px] text-xs font-semibold transition-all",
           viewMode === "month"
           ? "bg-card text-foreground shadow-sm"
           : "text-muted-foreground hover:text-foreground"
         )}
       >
         Month
       </button>
       <button
         onClick={() => setViewMode("week")}
         className={cn(
           "px-4 py-2 rounded-[10px] text-xs font-semibold transition-all",
           viewMode === "week"
           ? "bg-card text-foreground shadow-sm"
           : "text-muted-foreground hover:text-foreground"
         )}
       >
         Week
       </button>
       <button
         onClick={() => setViewMode("overview")}
         className={cn(
           "px-4 py-2 rounded-[10px] text-xs font-semibold transition-all",
           viewMode === "overview"
           ? "bg-card text-foreground shadow-sm"
           : "text-muted-foreground hover:text-foreground"
         )}
       >
         Overview
       </button>
     </div>
   </div>

   {viewMode === "month" ? (

   <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden animate-in fade-in duration-500">
   {/* Legend */}
   <div className="px-8 pt-6 pb-0 flex items-center gap-6">
   <div className="flex items-center gap-2">
   <div className="w-3 h-3 rounded-full bg-primary" />
   <span className="text-[10px] font-medium text-muted-foreground">Kinesiology</span>
   </div>
   <div className="flex items-center gap-2">
   <div className="w-3 h-3 rounded-full bg-destructive" />
   <span className="text-[10px] font-medium text-muted-foreground">Voice Studio</span>
   </div>
   </div>

   {/* Calendar Header */}
   <div className="p-8 border-b border-border flex items-center justify-between bg-muted/30">
   <div>
   <h2 className="text-3xl font-semibold text-foreground tracking-tight">
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
   className="py-4 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
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

   const dayIncome = dayItems.reduce((sum, item) => {
     if (item.source === "kinesiology") {
       return sum + (item.standardRate ?? item.priceAmount ?? 50);
     }
     const timeStr = item.time || "";
     const hasEnd = /–/.test(timeStr);
     const nameLower = (item.title || "").toLowerCase();
     const is45 = /45/.test(nameLower);
     return sum + (hasEnd ? (is45 ? 75 : 95) : 95);
   }, 0);

   return (
   <div
   key={day.toString()}
   className={cn(
   "min-h-[130px] p-3 border-r border-b border-border/50 transition-colors",
   !isCurrent && "bg-muted/20 opacity-40",
   isCurrentDay && "bg-chart-primary/10/30 "
   )}
   >
   <div className="flex justify-between items-start mb-2">
   <span
   className={cn(
   "w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold",
   isCurrentDay
   ? "bg-primary text-white shadow-sm "
   : "text-muted-foreground"
   )}
   >
   {format(day, "d")}
   </span>
   {dayItems.length > 0 && (
   <div className="flex gap-1">
   {kinesiologyCount > 0 && (
   <Badge className="bg-chart-primary/10 text-chart-primary border-none text-[10px] font-semibold">
   {kinesiologyCount}
   </Badge>
   )}
   {voiceCount > 0 && (
   <Badge className="bg-chart-destructive/10 text-chart-destructive border-none text-[10px] font-semibold">
   {voiceCount}
   </Badge>
   )}
   </div>
   )}
   </div>

   {dayItems.length > 0 && (
   <div className="text-[9px] font-bold text-chart-emerald mb-1">
     ${dayIncome}
   </div>
   )}

   <div className="space-y-1">
   {dayItems.map((item) => (
   <Tooltip key={item.id}>
   <TooltipTrigger asChild>
   {item.url ? (
   <a
   href={item.url}
   target={item.source === "voice" ? "_blank" : undefined}
   rel={item.source === "voice" ? "noopener noreferrer" : undefined}
   className={cn(
   "block p-1.5 rounded-lg text-[10px] font-medium truncate transition-all hover:scale-[1.02] border",
   item.source === "voice"
   ? "bg-chart-destructive/10 text-chart-destructive border-border "
   : "bg-chart-primary/10 text-chart-primary border-border "
   )}
   >
   <div className="flex items-center gap-1">
   {item.source === "voice" ? (
   <Mic size={9} className="shrink-0 opacity-60" />
   ) : (
   <User size={9} className="shrink-0 opacity-60" />
   )}
   <span className="truncate">{item.title}</span>
   {item.time && <span className="text-[9px] opacity-60 shrink-0 ml-0.5">{item.time}</span>}
   </div>
   </a>
   ) : (
   <div
   className={cn(
   "block p-1.5 rounded-lg text-[10px] font-medium truncate border",
   item.source === "voice"
   ? "bg-chart-destructive/10 text-chart-destructive border-border "
   : "bg-chart-primary/10 text-chart-primary border-border "
   )}
   >
   <div className="flex items-center gap-1">
   {item.source === "voice" ? (
   <Mic size={9} className="shrink-0 opacity-60" />
   ) : (
   <User size={9} className="shrink-0 opacity-60" />
   )}
   <span className="truncate">{item.title}</span>
   {item.time && <span className="text-[9px] opacity-60 shrink-0 ml-0.5">{item.time}</span>}
   </div>
   </div>
   )}
   </TooltipTrigger>
   <TooltipContent className="rounded-xl p-3 shadow-sm border-none w-64 bg-popover">
   <div className="space-y-2">
   <p className="font-semibold text-foreground text-sm">{item.title}</p>
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
   "text-[10px] font-semibold border-none",
   item.source === "voice"
   ? "bg-chart-destructive/10 text-chart-destructive "
   : "bg-chart-primary/10 text-chart-primary "
   )}
   >
   {item.source === "voice" ? "Voice" : item.tag || "Kinesiology"}
   </Badge>
   {item.url && item.source === "voice" && (
   <div className="flex items-center gap-1 text-[10px] text-destructive">
   <ExternalLink size={10} /> Open in Notion
   </div>
   )}
   </div>
   </TooltipContent>
   </Tooltip>
   ))}

   </div>
   </div>
   );
   })}
   </div>
   </div>

    ) : viewMode === "week" ? (

    <WeeklyTimeGrid
      events={weeklyEvents}
      weekStart={weekStart}
      onPrevWeek={prevWeek}
      onNextWeek={nextWeek}
      onToday={() => { goToToday(); }}
      minHour={9}
      maxHour={17}
      fnhRatePerHour={50}
      onSlotClick={(date, hour) => setBookSlot({ date, hour })}
    />

    ) : (

    <WeekByWeekOverview
      weekStart={weekStart}
      voiceLessons={voiceLessons || []}
      kinesiologyAppts={kinesiologyAppts || []}
      onPrevWeek={prevWeek}
      onNextWeek={nextWeek}
      onToday={() => { goToToday(); }}
    />

    )}

   </div>

    {viewMode !== "overview" && (
    <div className="w-24 shrink-0 flex flex-col items-center gap-6 pt-2">
      <EarningsPanel
        summary={monthlySummary}
        voiceRate={95}
        fnhRate={50}
        label="This Month"
      />
    </div>
  )}

  </div>

  )}

  {bookSlot && (
    <Dialog open onOpenChange={(open) => { if (!open) { setBookSlot(null); setBookClient(null); } }}>
      <DialogContent className="sm:max-w-[480px] rounded-2xl p-0 mx-4 w-[calc(100%-2rem)] flex flex-col bg-background">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-chart-emerald text-white flex items-center justify-center shadow-sm">
              <Plus size={20} />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">Book FNH Session</DialogTitle>
              <DialogDescription className="text-muted-foreground text-xs">
                {format(setMinutes(setHours(bookSlot.date, bookSlot.hour), 0), "EEE, MMM d 'at' h:mm a")}
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
                  onClick={() => setBookClient(c.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left",
                    bookClient === c.id
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
            onClick={() => {
              if (!bookSlot || !bookClient) return;
              const date = setMinutes(setHours(bookSlot.date, bookSlot.hour), 0);
              bookMutation.mutate({ clientId: bookClient, date });
            }}
            disabled={!bookClient || bookMutation.isPending}
            className="w-full bg-chart-emerald hover:bg-chart-emerald/90 h-12 rounded-xl font-semibold text-sm"
          >
            {bookMutation.isPending ? (
              <><Loader2 size={16} className="mr-2 animate-spin" /> Booking…</>
            ) : (
              <><Plus size={16} className="mr-2" /> Book Session</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )}

  </div>
  </AppLayout>
  );
};

export default UnifiedCalendarPage;
