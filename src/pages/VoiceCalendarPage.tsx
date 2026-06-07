import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Mic, Calendar as CalendarIcon, Clock, 
  ChevronLeft, ChevronRight, Loader2, ExternalLink, RefreshCw,
  CreditCard, Copy, Check, DollarSign
} from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, 
  eachDayOfInterval, isToday } from "date-fns";
import { useQuery, useMutation } from "@tanstack/react-query";
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
  studentIds: string[];
  paymentStatus: string | null;
  studentName: string | null;
  studentEmail: string | null;
}

const VoiceCalendarPage = () => {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [payDialogLesson, setPayDialogLesson] = useState<VoiceLesson | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["voice-lessons"],
    queryFn: async () => {
      const res = await supabase.functions.invoke("voice-lessons");
      if (res.error) throw res.error;
      return (res.data?.lessons || []) as VoiceLesson[];
    },
    refetchInterval: 60_000,
  });

  const lessons = data || [];

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

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

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
    if (status === "Paid (Stripe)") return "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300";
    if (status === "Paid on Day") return "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300";
    if (status === "Unpaid") return "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300";
    return "bg-muted text-muted-foreground";
  };

  return (
    <AppLayout variant="workspace">
      <div className="space-y-8">
        <PageHeader
          title="Studio Calendar"
          subtitle="Your weekly voice and piano lesson schedule at a glance."
          icon={CalendarIcon}
          iconClassName="bg-rose-500 text-white dark:bg-rose-500 dark:text-white"
          breadcrumbs={[
            { label: "Voice Studio", path: "/" },
            { label: "Calendar" },
          ]}
          badge="Voice Studio"
          actions={
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isRefetching}
                className="h-10 px-4 rounded-xl border-border font-bold text-[10px] uppercase tracking-widest gap-2"
              >
                <RefreshCw size={14} className={isRefetching ? "animate-spin" : ""} />
                {isRefetching ? "Refreshing..." : "Refresh"}
              </Button>
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
            <Loader2 className="animate-spin text-rose-500" size={48} />
            <p className="text-muted-foreground font-black text-xs uppercase tracking-widest">
              Loading lessons...
            </p>
          </div>
        ) : (
          <>
            <div className="bg-card rounded-[2.5rem] border border-border shadow-xl overflow-hidden animate-in fade-in duration-500">
              {/* Calendar Header */}
              <div className="p-8 border-b border-border flex items-center justify-between bg-muted/30">
                <div>
                  <h2 className="text-3xl font-black text-foreground tracking-tight">
                    {format(currentMonth, "MMMM yyyy")}
                  </h2>
                  <p className="text-muted-foreground font-medium text-sm mt-1">
                    {lessons.length} lesson{lessons.length !== 1 ? "s" : ""} scheduled
                  </p>
                </div>
                <div className="flex gap-2">
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
                  const dayLessons = getLessonsForDay(day);
                  const isCurrent = isSameMonth(day, monthStart);
                  const isCurrentDay = isToday(day);

                  return (
                    <div
                      key={day.toString()}
                      className={cn(
                        "min-h-[130px] p-3 border-r border-b border-border/50 transition-colors",
                        !isCurrent && "bg-muted/20 opacity-40",
                        isCurrentDay && "bg-rose-50/30 dark:bg-rose-950/10"
                      )}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span
                          className={cn(
                            "w-8 h-8 flex items-center justify-center rounded-full text-sm font-black",
                            isCurrentDay
                              ? "bg-rose-500 text-white shadow-lg shadow-rose-200"
                              : "text-muted-foreground"
                          )}
                        >
                          {format(day, "d")}
                        </span>
                        {dayLessons.length > 0 && (
                          <Badge
                            variant="secondary"
                            className="bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 border-none text-[9px] font-black"
                          >
                            {dayLessons.length}
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-1">
                        {dayLessons.slice(0, 2).map((lesson) => (
                          <Tooltip key={lesson.id}>
                            <TooltipTrigger asChild>
                              <div className="block p-1.5 rounded-lg text-[9px] font-bold truncate transition-all hover:scale-[1.02] bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border border-rose-100 dark:border-rose-800/40 cursor-default">
                                <div className="flex items-center gap-1">
                                  <Clock size={9} className="shrink-0 opacity-60" />
                                  <span className="truncate">{lesson.name || "Lesson"}</span>
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="rounded-xl p-3 shadow-2xl border-none w-64">
                              <div className="space-y-2">
                                <p className="font-black text-foreground">{lesson.name || "Voice Lesson"}</p>
                                {lesson.time && (
                                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                    <Clock size={10} /> {lesson.time}
                                  </div>
                                )}
                                {lesson.studentName && (
                                  <div className="text-[10px] text-muted-foreground font-medium">
                                    Student: {lesson.studentName}
                                  </div>
                                )}
                                {lesson.paymentStatus && (
                                  <div className="flex items-center gap-1.5">
                                    <Badge className={cn("text-[9px] font-black border-none", paymentBadge(lesson.paymentStatus))}>
                                      {lesson.paymentStatus}
                                    </Badge>
                                  </div>
                                )}
                                <div className="flex gap-1 pt-1">
                                  {lesson.notionUrl && (
                                    <a
                                      href={lesson.notionUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 text-[10px] text-rose-500 hover:underline"
                                    >
                                      <ExternalLink size={10} /> Notion
                                    </a>
                                  )}
                                  <button
                                    onClick={() => openPayDialog(lesson)}
                                    className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:text-emerald-500 ml-auto"
                                  >
                                    <CreditCard size={10} /> Payment Link
                                  </button>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                        {dayLessons.length > 2 && (
                          <p className="text-[9px] font-black text-muted-foreground text-center pt-0.5">
                            + {dayLessons.length - 2} more
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Payment Link Dialog */}
      <Dialog open={!!payDialogLesson} onOpenChange={(o) => !o && setPayDialogLesson(null)}>
        <DialogContent className="sm:max-w-[420px] rounded-[2rem] bg-white dark:bg-gray-950">
          <DialogHeader>
            <DialogTitle>Generate Payment Link</DialogTitle>
            <DialogDescription>
              Create a Stripe checkout link for this lesson. The link will be copied to your clipboard.
            </DialogDescription>
          </DialogHeader>

          {payDialogLesson && (
            <div className="space-y-4 py-2">
              <div className="bg-muted/50 rounded-xl p-4 space-y-1">
                <p className="font-black text-sm">{payDialogLesson.name || "Voice Lesson"}</p>
                {payDialogLesson.date && (
                  <p className="text-xs text-muted-foreground">{format(new Date(payDialogLesson.date), "EEEE, MMMM d, yyyy")}</p>
                )}
                {payDialogLesson.studentName && (
                  <p className="text-xs text-muted-foreground">Student: {payDialogLesson.studentName}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
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
                    className="pl-10 h-12 rounded-xl font-bold text-lg"
                  />
                </div>
              </div>

              {copiedUrl && (
                <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold p-3 rounded-xl">
                  <Check size={14} />
                  Link copied to clipboard!
                </div>
              )}

              {generatePaymentLink.isSuccess && !copiedUrl && (
                <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold p-3 rounded-xl break-all">
                  <CreditCard size={14} />
                  {generatePaymentLink.data?.url}
                </div>
              )}

              {generatePaymentLink.isError && (
                <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-bold p-3 rounded-xl">
                  Failed to generate payment link.
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setPayDialogLesson(null)} className="rounded-xl font-bold text-xs">
              Close
            </Button>
            <Button
              onClick={handleGeneratePayment}
              disabled={!payAmount || generatePaymentLink.isPending || !!copiedUrl}
              className="bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold text-xs gap-2"
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

export default VoiceCalendarPage;
