import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
 ArrowLeft, Mic, Calendar as CalendarIcon, Clock, 
 ChevronLeft, ChevronRight, Loader2, ExternalLink, RefreshCw,
 CreditCard, Copy, Check, DollarSign, Trash2, CalendarSync,
 XCircle, Search, ChevronDown
} from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, 
  eachDayOfInterval, isToday, parseISO, addWeeks, subWeeks, parse, getISOWeek } from "date-fns";
import WeeklyTimeGrid from "@/components/crm/WeeklyTimeGrid";
import { formatDateLine, formatVoiceTime } from "@/utils/availability";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
 DialogFooter,
} from "@/components/ui/dialog";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AppLayout from "@/components/crm/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/utils/toast";
import { CALCOM_CONFIG } from "@/config/integrations";
import {
 Popover,
 PopoverContent,
 PopoverTrigger,
} from "@/components/ui/popover";

interface VoiceLesson {
 id: string;
 notionUrl: string | null;
 name: string | null;
 date: string | null;
 time: string | null;
 studentIds: string[];
 paymentStatus: string | null;
 studentName: string | null;
 studentEmail: string | null;
}

interface VoiceBooking {
 calcom_booking_id: string;
 student_id: string;
 student_name: string;
 student_email: string;
 lesson_date: string;
 lesson_time: string;
 duration: string;
 cost: number | null;
 status: string;
 notion_lesson_id_1: string | null;
 notion_lesson_id_2: string | null;
}

const EVENT_TYPES = [
 { key: "60", label: "60 min", eventTypeId: "1945081", price: "$95" },
 { key: "45", label: "45 min", eventTypeId: "5925021", price: "$75" },
];

const VoiceCalendarPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));
  const [payDialogLesson, setPayDialogLesson] = useState<VoiceLesson | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [cancelLesson, setCancelLesson] = useState<{ lesson: VoiceLesson; booking: VoiceBooking } | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [rescheduleLesson, setRescheduleLesson] = useState<{ lesson: VoiceLesson; booking: VoiceBooking } | null>(null);
  const [rescheduleSlot, setRescheduleSlot] = useState<string | null>(null);
  const [copyingWeeks, setCopyingWeeks] = useState<number | null>(null);

 const { data: lessonsData, isLoading, refetch, isRefetching } = useQuery({
 queryKey: ["voice-lessons"],
 queryFn: async () => {
 const res = await supabase.functions.invoke("voice-lessons");
 if (res.error) throw res.error;
 return (res.data?.lessons || []) as VoiceLesson[];
 },
 refetchInterval: 60_000,
 });

 const lessons = lessonsData || [];

 // Fetch voice_bookings to get calcom_booking_ids
 const { data: bookingsData } = useQuery({
 queryKey: ["voice-bookings"],
 queryFn: async () => {
 const { data } = await supabase
 .from("voice_bookings")
 .select("*")
 .neq("status", "cancelled");
 return (data || []) as VoiceBooking[];
 },
 refetchInterval: 60_000,
 });

 const bookings = bookingsData || [];

 const { data: availabilityData } = useQuery({
 queryKey: ["voice-calendar-availability", format(currentMonth, "yyyy-MM")],
 queryFn: async () => {
 const res = await supabase.functions.invoke("get-calcom-slots", {
 body: {
 start: startOfMonth(currentMonth).toISOString(),
 end: endOfMonth(currentMonth).toISOString(),
 eventTypeId: "1945081",
 timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
 },
 });
 if (res.error) throw res.error;
 return (res.data?.data || {}) as Record<string, any[]>;
 },
 staleTime: 30_000,
 });

 const datesWithSlots = useMemo(() => {
 if (!availabilityData) return new Set<string>();
 const set = new Set<string>();
 for (const [key, slots] of Object.entries(availabilityData)) {
 if (Array.isArray(slots) && slots.length > 0) {
 set.add(key);
 }
 }
 return set;
 }, [availabilityData]);

 const generatePaymentLink = useMutation({
 mutationFn: async (params: { lesson: VoiceLesson; amount: number }) => {
 const res = await supabase.functions.invoke("voice-payment-link", {
 body: {
 amount: params.amount,
 lessonTitle: params.lesson.name || "Voice Lesson",
 lessonId: params.lesson.id,
 email: params.lesson.studentEmail || undefined,
 studentName: params.lesson.studentName || undefined,
 },
 });
 if (res.error) throw res.error;
 return res.data;
 },
 onSuccess: (data) => {
 if (data?.url) {
 setCopiedUrl(data.url);
 navigator.clipboard.writeText(data.url);
 setTimeout(() => setCopiedUrl(null), 3000);
 }
 },
 });

 const findBooking = (lesson: VoiceLesson): VoiceBooking | undefined =>
 bookings.find((b) => {
 if (!lesson.date || !lesson.studentEmail) return false;
 return b.lesson_date === lesson.date && b.student_email === lesson.studentEmail;
 });

 const resolveBooking = useMutation({
 mutationFn: async (lesson: VoiceLesson) => {
 const res = await supabase.functions.invoke("voice-resolve-booking", {
 body: {
 date: lesson.date,
 studentEmail: lesson.studentEmail,
 lessonNotionId1: lesson.id,
 },
 });
 if (res.error) throw res.error;
 return res.data;
 },
 onSuccess: (data, lesson) => {
 if (data?.found && data?.booking) {
 showSuccess("Cal.com booking linked! Cancel/reschedule now available.");
 // Directly inject into cache so UI updates immediately
 queryClient.setQueryData(["voice-bookings"], (old: VoiceBooking[] | undefined) => {
 const newBooking: VoiceBooking = {
 calcom_booking_id: data.booking.calcom_booking_id,
 student_id: "",
 student_name: lesson.studentName || "",
 student_email: data.booking.student_email,
 lesson_date: data.booking.lesson_date,
 lesson_time: lesson.time || "",
 duration: "",
 cost: null,
 status: "scheduled",
 notion_lesson_id_1: lesson.id || null,
 notion_lesson_id_2: null,
 };
 if (!old) return [newBooking];
 const exists = old.find(b => b.calcom_booking_id === newBooking.calcom_booking_id);
 if (exists) return [...old];
 return [...old, newBooking];
 });
 } else {
 showError("No matching Cal.com booking found for this lesson.");
 }
 },
 onError: (err: any) => {
 showError(err.message || "Failed to resolve booking");
 },
 });

 const handleCancel = async () => {
 if (!cancelLesson) return;
 setCancelling(true);
 try {
 const { error } = await supabase.functions.invoke("voice-cancel-lesson", {
 body: {
 calcomBookingId: cancelLesson.booking.calcom_booking_id,
 notionLessonId1: cancelLesson.booking.notion_lesson_id_1,
 notionLessonId2: cancelLesson.booking.notion_lesson_id_2,
 },
 });
 if (error) throw error;
 showSuccess("Lesson cancelled in Cal.com and archived in Notion.");
 queryClient.invalidateQueries({ queryKey: ["voice-lessons"] });
 queryClient.invalidateQueries({ queryKey: ["voice-bookings"] });
 setCancelLesson(null);
 } catch (err: any) {
 showError(err.message || "Failed to cancel lesson");
 }
 setCancelling(false);
 };

 const handleReschedule = async () => {
 if (!rescheduleLesson || !rescheduleSlot) return;
 try {
 const { error } = await supabase.functions.invoke("voice-create-booking", {
 body: {
 bookingUid: rescheduleLesson.booking.calcom_booking_id,
 studentName: rescheduleLesson.lesson.studentName,
 studentEmail: rescheduleLesson.lesson.studentEmail,
 startTime: rescheduleSlot,
 eventTypeId: "1945081",
 notionLessonId1: rescheduleLesson.booking.notion_lesson_id_1,
 notionLessonId2: rescheduleLesson.booking.notion_lesson_id_2,
 },
 });
 if (error) throw error;
 showSuccess("Lesson rescheduled in Cal.com and Notion!");
 queryClient.invalidateQueries({ queryKey: ["voice-lessons"] });
 queryClient.invalidateQueries({ queryKey: ["voice-bookings"] });
 setRescheduleLesson(null);
 setRescheduleSlot(null);
 } catch (err: any) {
 showError(err.message || "Failed to reschedule");
 }
 };

 const monthStart = startOfMonth(currentMonth);
 const monthEnd = endOfMonth(monthStart);
 const startDate = startOfWeek(monthStart);
 const endDate = endOfWeek(monthEnd);

  type SlotRange = "upcoming" | "near" | "future" | "ten";
  const rangeConfig: Record<string, { label: string; startDays: number; endDays: number }> = {
  upcoming: { label: "Next 30 Days", startDays: 0, endDays: 30 },
  near: { label: "1–3 Months", startDays: 0, endDays: 90 },
  future: { label: "3+ Months", startDays: 90, endDays: 180 },
  ten: { label: "Next 10 Days", startDays: 0, endDays: 60 },
  };

 const handleCopySlots = useCallback(async (range: SlotRange) => {
 const cfg = rangeConfig[range];
 setCopyingWeeks(range === "ten" ? 10 : cfg.endDays);
 try {
  const now = new Date();
  const res = await supabase.functions.invoke("get-calcom-slots", {
  body: {
  start: addDays(now, cfg.startDays).toISOString(),
  end: addDays(now, cfg.endDays).toISOString(),
  eventTypeId: "1945081",
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  },
  });
 if (res.error) throw res.error;

 const slotsByDate: Record<string, any[]> = res.data?.data || {};
 const datesWithSlots = Object.keys(slotsByDate).sort().filter((d) => slotsByDate[d]?.length > 0);

 if (datesWithSlots.length === 0) {
 showError(`No available slots in ${cfg.label.toLowerCase()}`);
 setCopyingWeeks(null);
 return;
 }

 let text = `${cfg.label}:\n`;
 const selectedDates = range === "ten" ? datesWithSlots.slice(0, 10) : datesWithSlots;
 let prevWeek: number | null = null;

 for (const dateKey of selectedDates) {
 if (range === "ten") {
 const week = getISOWeek(parseISO(dateKey));
 if (prevWeek !== null && week !== prevWeek) {
 text += "\n";
 }
 prevWeek = week;
 }
 const times = slotsByDate[dateKey].map((s: any) => s.time);
 text += `\n${formatDateLine(dateKey, times)}`;
 }

 await navigator.clipboard.writeText(text);
 showSuccess(`Copied ${selectedDates.length} day(s) of availability to clipboard!`);
 } catch (err: any) {
 showError(err.message || "Failed to get available slots");
 }
 setCopyingWeeks(null);
 }, []);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextWeek = () => setWeekStart(addWeeks(weekStart, 1));
  const prevWeek = () => setWeekStart(subWeeks(weekStart, 1));
  const goToToday = () => setWeekStart(startOfWeek(new Date()));

 const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

 const getLessonsForDay = (day: Date) =>
 lessons.filter((l) => l.date && isSameDay(new Date(l.date), day));

 const openPayDialog = (lesson: VoiceLesson) => {
 setPayDialogLesson(lesson);
 setPayAmount("");
 setCopiedUrl(null);
 };

 const handleGeneratePayment = () => {
 if (!payDialogLesson || !payAmount) return;
 const amountCents = Math.round(parseFloat(payAmount) * 100);
 if (isNaN(amountCents) || amountCents <= 0) return;
 generatePaymentLink.mutate({ lesson: payDialogLesson, amount: amountCents });
 };

 const paymentBadge = (status: string | null) => {
 if (status === "Paid (Stripe)") return "bg-chart-emerald/10 text-chart-emerald ";
 if (status === "Paid on Day") return "bg-chart-primary/10 text-chart-primary ";
 if (status === "Unpaid") return "bg-muted text-muted-foreground ";
 return "bg-muted text-muted-foreground";
 };

 return (
 <AppLayout>
 <div className="space-y-8">
 <PageHeader
 title="Studio Calendar"
 subtitle="Your weekly voice and piano lesson schedule at a glance."
 icon={CalendarIcon}
  iconClassName="bg-destructive text-white "
  actions={
 <div className="flex gap-2">
 <Button
 variant="outline"
 size="sm"
 onClick={() => refetch()}
 disabled={isRefetching}
 className="h-10 px-4 rounded-xl border-border font-medium text-[10px] uppercase tracking-wider gap-2"
 >
 <RefreshCw size={14} className={isRefetching ? "animate-spin" : ""} />
 {isRefetching ? "Refreshing..." : "Refresh"}
 </Button>
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
 <Loader2 className="animate-spin text-destructive" size={48} />
 <p className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">
 Loading lessons...
 </p>
 </div>
 ) : (
 <>
 <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden animate-in fade-in duration-500">
 {/* Calendar Header */}
 <div className="p-8 border-b border-border flex items-center justify-between bg-muted/30">
 <div>
          <h2 className="text-3xl font-semibold text-foreground tracking-tight">
          {viewMode === "month"
            ? format(currentMonth, "MMMM yyyy")
            : `${format(weekStart, "MMM d")} – ${format(endOfWeek(weekStart), "MMM d, yyyy")}`
          }
          </h2>
          <p className="text-muted-foreground font-medium text-sm mt-1">
          {viewMode === "month"
            ? `${lessons.length} lesson${lessons.length !== 1 ? "s" : ""} scheduled`
            : `${lessons.filter((l) => l.date && new Date(l.date) >= weekStart && new Date(l.date) <= endOfWeek(weekStart)).length} lesson${lessons.filter((l) => l.date && new Date(l.date) >= weekStart && new Date(l.date) <= endOfWeek(weekStart)).length !== 1 ? "s" : ""} this week`
          }
          </p>
 {availabilityData && (
 <div className="flex items-center gap-4 mt-2">
 <span className="flex items-center gap-1.5 text-[10px] font-medium text-chart-emerald uppercase tracking-wider">
 <span className="w-3 h-3 rounded-sm bg-emerald-400" /> Free
 </span>
 <span className="flex items-center gap-1.5 text-[10px] font-medium text-gray-400 uppercase tracking-wider">
 <span className="w-3 h-3 rounded-sm bg-gray-300 " /> Full
 </span>
 </div>
 )}
 </div>
          <div className="flex gap-2 items-center">
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
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="rounded-xl h-12 gap-2 font-medium text-xs"
                  disabled={copyingWeeks !== null}
                >
                  {copyingWeeks !== null ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Copy size={14} />
                  )}
                  {copyingWeeks !== null ? "Fetching..." : "Get Slots"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl min-w-[220px]">
                {(["upcoming", "near", "future"] as SlotRange[]).map((key) => (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => handleCopySlots(key)}
                    className="font-medium text-sm py-3"
                    disabled={copyingWeeks !== null}
                  >
                    <Copy size={14} className="mr-2" />
                    {rangeConfig[key].label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {viewMode === "month" ? (
              <>
                <Button variant="outline" size="icon" onClick={prevMonth} className="rounded-xl h-12 w-12">
                  <ChevronLeft size={24} />
                </Button>
                <Button variant="outline" size="icon" onClick={nextMonth} className="rounded-xl h-12 w-12">
                  <ChevronRight size={24} />
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="icon" onClick={prevWeek} className="rounded-xl h-12 w-12">
                  <ChevronLeft size={24} />
                </Button>
                <Button variant="outline" size="icon" onClick={nextWeek} className="rounded-xl h-12 w-12">
                  <ChevronRight size={24} />
                </Button>
              </>
            )}
          </div>
 </div>

  {viewMode === "month" ? (
  <>
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
    const dayLessons = getLessonsForDay(day);
    const isCurrent = isSameMonth(day, monthStart);
    const isCurrentDay = isToday(day);
    const dayKey = format(day, "yyyy-MM-dd");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isPast = day.getTime() < today.getTime();
    const dayHasAvailability = isCurrent && !isPast && datesWithSlots.has(dayKey);
    const dayNoAvailability = isCurrent && !isPast && !datesWithSlots.has(dayKey) && !!availabilityData;

    return (
    <div
    key={day.toString()}
    className={cn(
    "min-h-[130px] p-3 border-r border-b border-border/50 transition-colors",
    !isCurrent && "bg-muted/20 opacity-40",
    isCurrentDay && "bg-chart-destructive/10/40 ",
    dayHasAvailability && "bg-chart-emerald/10 border-l-[3px] border-emerald-400 ",
    dayNoAvailability && "bg-gray-100/50 border-l-[3px] border-gray-200 "
    )}
    >
    <div className="flex justify-between items-start mb-2">
    <div className="flex items-center gap-1.5">
    <span
    className={cn(
    "w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold",
    isCurrentDay
    ? "bg-destructive text-white shadow-sm "
    : "text-muted-foreground"
    )}
    >
    {format(day, "d")}
    </span>
    {dayHasAvailability && (
    <div className="w-2 h-2 rounded-full bg-chart-emerald shadow-sm" />
    )}
    {dayNoAvailability && (
    <div className="w-2 h-2 rounded-full bg-gray-300 " />
    )}
    </div>
    {dayLessons.length > 0 && (
    <Badge
    variant="secondary"
    className="bg-chart-destructive/10 text-chart-destructive border-none text-[10px] font-semibold"
    >
    {dayLessons.length}
    </Badge>
    )}
    </div>

    <div className="space-y-1">
    {dayLessons.slice(0, 2).map((lesson) => {
    const booking = findBooking(lesson);
    return (
    <Tooltip key={lesson.id}>
    <TooltipTrigger asChild>
    <a
    href={lesson.notionUrl || "#"}
    target="_blank"
    rel="noopener noreferrer"
    className="block p-1.5 rounded-lg text-[10px] font-medium truncate transition-all hover:scale-[1.02] bg-chart-destructive/10 text-chart-destructive border border-border "
    >
    <div className="flex items-center gap-1">
    <Clock size={9} className="shrink-0 opacity-60" />
    <span className="truncate">{lesson.name || "Lesson"}</span>
    </div>
    </a>
    </TooltipTrigger>
    <TooltipContent className="rounded-xl p-3 shadow-sm border-none w-72 bg-popover">
    <div className="space-y-2">
    <p className="font-semibold text-foreground">{lesson.name || "Voice Lesson"}</p>
    {lesson.date && lesson.time && (
    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
    <Clock size={10} /> {formatVoiceTime(lesson.date, lesson.time)}
    </div>
    )}
    {lesson.studentName && (
    <div className="text-[10px] text-muted-foreground font-medium">
    <span className="font-medium">Student:</span> {lesson.studentName}
    </div>
    )}
    {lesson.studentEmail && (
    <div className="text-[10px] text-muted-foreground">
    <span className="font-medium">Email:</span> {lesson.studentEmail}
    </div>
    )}
    {lesson.paymentStatus && (
    <div className="flex items-center gap-1.5">
    <Badge className={cn("text-[10px] font-semibold border-none", paymentBadge(lesson.paymentStatus))}>
    {lesson.paymentStatus}
    </Badge>
    </div>
    )}
    <div className="flex flex-wrap gap-1 pt-1">
    {lesson.notionUrl && (
    <a
    href={lesson.notionUrl}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-1 text-[10px] text-destructive hover:underline"
    >
    <ExternalLink size={10} /> Notion
    </a>
    )}
    <button
    onClick={() => openPayDialog(lesson)}
    className="flex items-center gap-1 text-[10px] font-medium text-chart-emerald hover:text-chart-emerald ml-auto"
    >
    <CreditCard size={10} /> Payment Link
    </button>
    {booking ? (
    <>
    <button
    onClick={(e) => {
    e.preventDefault();
    setCancelLesson({ lesson, booking });
    }}
    className="flex items-center gap-1 text-[10px] font-medium text-destructive hover:text-destructive/70"
    >
    <XCircle size={10} /> Cancel
    </button>
    <button
    onClick={(e) => {
    e.preventDefault();
    setRescheduleLesson({ lesson, booking });
    setRescheduleSlot(null);
    }}
    className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-muted-foreground"
    >
    <CalendarSync size={10} /> Reschedule
    </button>
    </>
    ) : lesson.date && lesson.studentEmail && (
    <button
    onClick={(e) => {
    e.preventDefault();
    resolveBooking.mutate(lesson);
    }}
    disabled={resolveBooking.isPending}
    className="flex items-center gap-1 text-[10px] font-medium text-primary hover:text-primary/70"
    >
    {resolveBooking.isPending ? (
    <Loader2 size={10} className="animate-spin" />
    ) : (
    <Search size={10} />
    )}
    {resolveBooking.isPending ? "Linking..." : "Link Cal.com"}
    </button>
    )}
    </div>
    </div>
    </TooltipContent>
    </Tooltip>
    );
    })}
    {dayLessons.length > 2 && (
    <p className="text-[10px] font-semibold text-muted-foreground text-center pt-0.5">
    + {dayLessons.length - 2} more
    </p>
    )}
    </div>
    </div>
    );
    })}
    </div>
  </>
  ) : (
          <WeeklyTimeGrid
            lessons={lessons}
            weekStart={weekStart}
            onPrevWeek={prevWeek}
            onNextWeek={nextWeek}
            onToday={goToToday}
            minHour={9}
            maxHour={17}
          />
  )}
  </div>
 </>
 )}
 </div>

 {/* Cancel Confirmation Dialog */}
 <Dialog open={!!cancelLesson} onOpenChange={(o) => !o && setCancelLesson(null)}>
 <DialogContent className="sm:max-w-[400px] rounded-xl bg-white ">
 <DialogHeader>
 <DialogTitle>Cancel Lesson</DialogTitle>
 <DialogDescription>
 This will cancel the booking in Cal.com and archive the lesson in Notion.
 </DialogDescription>
 </DialogHeader>
 {cancelLesson && (
 <div className="bg-chart-destructive/10 rounded-xl p-4 space-y-1">
 <p className="font-semibold text-sm">{cancelLesson.lesson.name || "Voice Lesson"}</p>
 {cancelLesson.lesson.date && (
  <p className="text-xs text-muted-foreground">{cancelLesson.lesson.date}
    {cancelLesson.lesson.date && cancelLesson.lesson.time
      ? ` at ${formatVoiceTime(cancelLesson.lesson.date, cancelLesson.lesson.time)}`
      : cancelLesson.lesson.time ? ` at ${cancelLesson.lesson.time}` : ""}
  </p>
 )}
 <p className="text-xs text-muted-foreground">Student: {cancelLesson.lesson.studentName}</p>
 </div>
 )}
 <DialogFooter className="flex gap-2">
 <Button variant="outline" onClick={() => setCancelLesson(null)} className="rounded-xl font-medium text-xs">
 Keep
 </Button>
 <Button
 onClick={handleCancel}
 disabled={cancelling}
 className="bg-destructive hover:bg-destructive/80 rounded-xl font-medium text-xs gap-2"
 >
 {cancelling ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
 {cancelling ? "Cancelling..." : "Confirm Cancel"}
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>

 {/* Reschedule Dialog */}
 <Dialog open={!!rescheduleLesson} onOpenChange={(o) => !o && setRescheduleLesson(null)}>
 <DialogContent className="sm:max-w-[500px] rounded-xl bg-white ">
 <DialogHeader>
 <DialogTitle>Reschedule Lesson</DialogTitle>
 <DialogDescription>
 Pick a new time slot for this lesson.
 </DialogDescription>
 </DialogHeader>
 <RescheduleSlotPicker
 booking={rescheduleLesson?.booking}
 selectedSlot={rescheduleSlot}
 onSelect={setRescheduleSlot}
 />
 <DialogFooter className="flex gap-2">
 <Button variant="outline" onClick={() => setRescheduleLesson(null)} className="rounded-xl font-medium text-xs">
 Cancel
 </Button>
 <Button
 onClick={handleReschedule}
 disabled={!rescheduleSlot}
 className="bg-muted hover:bg-muted/80 rounded-xl font-medium text-xs gap-2"
 >
 <CalendarSync size={14} />
 Confirm Reschedule
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>

 {/* Payment Link Dialog */}
 <Dialog open={!!payDialogLesson} onOpenChange={(o) => !o && setPayDialogLesson(null)}>
 <DialogContent className="sm:max-w-[420px] rounded-xl bg-white ">
 <DialogHeader>
 <DialogTitle>Generate Payment Link</DialogTitle>
 <DialogDescription>
 Create a Stripe checkout link for this lesson. The link will be copied to your clipboard.
 </DialogDescription>
 </DialogHeader>

 {payDialogLesson && (
 <div className="space-y-4 py-2">
 <div className="bg-muted/50 rounded-xl p-4 space-y-1">
 <p className="font-semibold text-sm">{payDialogLesson.name || "Voice Lesson"}</p>
 {payDialogLesson.date && (
 <p className="text-xs text-muted-foreground">{format(new Date(payDialogLesson.date), "EEEE, MMMM d, yyyy")}</p>
 )}
 {payDialogLesson.studentName && (
 <p className="text-xs text-muted-foreground">Student: {payDialogLesson.studentName}</p>
 )}
 </div>

 <div className="space-y-2">
 <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
 Amount (AUD)
 </label>
 <div className="relative">
 <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
 <Input
 type="number"
 step="0.01"
 min="0"
 placeholder="90.00"
 value={payAmount}
 onChange={(e) => setPayAmount(e.target.value)}
 className="pl-10 h-12 rounded-xl font-medium text-lg"
 />
 </div>
 </div>

 {copiedUrl && (
 <div className="flex items-center gap-2 bg-chart-emerald/10 text-chart-emerald text-xs font-medium p-3 rounded-xl">
 <Check size={14} />
 Link copied to clipboard!
 </div>
 )}

 {generatePaymentLink.isSuccess && !copiedUrl && (
 <div className="flex items-center gap-2 bg-chart-emerald/10 text-chart-emerald text-xs font-medium p-3 rounded-xl break-all">
 <CreditCard size={14} />
 {generatePaymentLink.data?.url}
 </div>
 )}

 {generatePaymentLink.isError && (
 <div className="flex items-center gap-2 bg-destructive/10 text-destructive text-xs font-medium p-3 rounded-xl">
 Failed to generate payment link.
 </div>
 )}
 </div>
 )}

 <DialogFooter className="flex gap-2 sm:gap-0">
 <Button variant="outline" onClick={() => setPayDialogLesson(null)} className="rounded-xl font-medium text-xs">
 Close
 </Button>
 <Button
 onClick={handleGeneratePayment}
 disabled={!payAmount || generatePaymentLink.isPending || !!copiedUrl}
 className="bg-chart-emerald hover:bg-chart-emerald/90 rounded-xl font-medium text-xs gap-2"
 >
 {generatePaymentLink.isPending ? (
 <Loader2 size={14} className="animate-spin" />
 ) : copiedUrl ? (
 <Check size={14} />
 ) : (
 <CreditCard size={14} />
 )}
 {generatePaymentLink.isPending ? "Generating..." : copiedUrl ? "Copied!" : "Generate & Copy"}
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 </AppLayout>
 );
};

const RescheduleSlotPicker = ({
 booking,
 selectedSlot,
 onSelect,
}: {
 booking: VoiceBooking | undefined;
 selectedSlot: string | null;
 onSelect: (slot: string) => void;
}) => {
 const [selectedDate, setSelectedDate] = useState<Date | null>(null);

 const { data: slotsData, isLoading } = useQuery({
 queryKey: ["reschedule-slots", booking?.lesson_date],
 queryFn: async () => {
 const res = await supabase.functions.invoke("get-calcom-slots", {
 body: {
 start: new Date().toISOString(),
 end: addDays(new Date(), 30).toISOString(),
 eventTypeId: "1945081",
 timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
 },
 });
 if (res.error) throw res.error;
 return res.data;
 },
 enabled: !!booking,
 staleTime: 30_000,
 });

 const slotsByDate: Record<string, any[]> = slotsData?.data || {};
 const availableDates = useMemo(() => {
 return Object.keys(slotsByDate)
 .filter((key) => slotsByDate[key].length > 0)
 .map((key) => parseISO(key))
 .sort((a, b) => a.getTime() - b.getTime());
 }, [slotsByDate]);

 const currentSlots = selectedDate
 ? (slotsByDate[format(selectedDate, "yyyy-MM-dd")] || [])
 : [];

 return (
 <div className="py-4 space-y-4">
 {isLoading ? (
 <div className="flex justify-center py-8">
 <Loader2 className="animate-spin text-muted-foreground" size={24} />
 </div>
 ) : (
 <>
 {/* Date chips */}
 <div className="flex gap-2 overflow-x-auto pb-2">
 {availableDates.map((date) => (
 <button
 key={date.toISOString()}
 onClick={() => { setSelectedDate(date); onSelect(""); }}
 className={cn(
 "flex flex-col items-center justify-center min-w-[64px] h-16 rounded-xl border-2 transition-all shrink-0",
 selectedDate?.getTime() === date.getTime()
 ? "bg-muted border-border text-white"
 : "bg-card border-border hover:border-amber-300 text-foreground"
 )}
 >
 <span className="text-[10px] font-semibold uppercase opacity-60">{format(date, "EEE")}</span>
 <span className="text-lg font-semibold leading-tight">{format(date, "d")}</span>
 <span className="text-[7px] font-medium uppercase opacity-40">{format(date, "MMM")}</span>
 </button>
 ))}
 </div>

 {/* Time slots */}
 {selectedDate && (
 <div className="grid grid-cols-2 gap-2">
 {currentSlots.map((slot: any) => {
 const time = format(parseISO(slot.time), "h:mm a");
 const timeVal = slot.time;
 return (
 <button
 key={timeVal}
 onClick={() => onSelect(timeVal)}
 className={cn(
 "flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all",
 selectedSlot === timeVal
 ? "bg-muted border-border text-white"
 : "bg-card border-border text-foreground hover:bg-muted"
 )}
 >
 <Clock size={12} />
 {time}
 </button>
 );
 })}
 </div>
 )}
 </>
 )}
 </div>
 );
};

export default VoiceCalendarPage;
