import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Zap, AlertCircle, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/crm/AppLayout";
import { QuickSessionDialog } from "@/components/crm/QuickSessionDialog";
import TodayTimeline, { type TimelineEntry } from "@/components/crm/TodayTimeline";
import { DayStats, TodayList, NeedsYou, ComingUp, PracticeRow, type NeedLine } from "@/components/today/TodaySections";
import { itemStart, unpaidItems, sumAmount } from "@/lib/calendarItems";
import {
  loadTodayItems, splitToday, loadTodayGoals, loadRepliesWaiting, loadFollowUps, loadPencilled, loadClinicalAlerts,
  practiceOf, hasTime, itemEnd, itemHref, itemName,
} from "@/lib/today";

// Morning Program progress lives in localStorage (see MorningProgramPage).
const MORNING_STEPS = 6;
function readMorningDone(): number {
  try {
    const saved = JSON.parse(localStorage.getItem("rk_morning_program") || "null");
    if (!saved?.date) return 0;
    const d = new Date(saved.date);
    return d.toDateString() === new Date().toDateString() ? Math.min(MORNING_STEPS, (saved.tasks || []).length) : 0;
  } catch {
    return 0;
  }
}

const names = (list: string[], max = 3) =>
  list.length <= max ? list.join(", ") : `${list.slice(0, max).join(", ")} and ${list.length - max} more`;
const firstName = (n: string) => n.split(" ")[0];

/**
 * Today — the day at a glance across kinesiology, voice and piano: the day's
 * sessions and lessons, what needs you (each line reuses the logic of the
 * page it opens), the week ahead, and a compact row for your own practice.
 * Each part loads on its own so one slow source never blanks the page.
 */
const TodayPage = () => {
  const [now, setNow] = useState(new Date());
  const [quickSessionOpen, setQuickSessionOpen] = useState(false);
  const [morningDone] = useState(readMorningDone);
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const itemsQ = useQuery({ queryKey: ["today-items"], queryFn: loadTodayItems, staleTime: 60_000 });
  const repliesQ = useQuery({ queryKey: ["today-replies"], queryFn: loadRepliesWaiting, staleTime: 120_000, retry: false });
  const followQ = useQuery({ queryKey: ["today-follow-ups"], queryFn: loadFollowUps, staleTime: 300_000 });
  const pencilQ = useQuery({ queryKey: ["today-pencilled"], queryFn: loadPencilled, staleTime: 60_000 });
  const alertsQ = useQuery({ queryKey: ["today-alerts"], queryFn: loadClinicalAlerts, staleTime: 300_000 });

  const day = useMemo(() => splitToday(itemsQ.data || [], now), [itemsQ.data, now]);
  const unpaid = useMemo(() => unpaidItems(itemsQ.data || [], now), [itemsQ.data, now]);

  const kinesiologyIds = day.today.map((i) => i.appointmentId).filter((id): id is string => !!id);
  const goalsQ = useQuery({
    queryKey: ["today-goals", kinesiologyIds.join(",")],
    queryFn: () => loadTodayGoals(kinesiologyIds),
    enabled: kinesiologyIds.length > 0,
    staleTime: 60_000,
  });

  const sessions = day.today.filter((i) => i.source === "kinesiology").length;
  const lessons = day.today.length - sessions;
  const next = day.today.find((i) => hasTime(i) && itemStart(i) > now);
  const live = day.today.find((i) => hasTime(i) && itemStart(i) <= now && itemEnd(i) > now);

  const timeline: TimelineEntry[] = day.today.filter(hasTime).map((i) => {
    const { to, external } = itemHref(i);
    return { id: i.id, start: itemStart(i), end: itemEnd(i), name: itemName(i), href: to, external, practice: practiceOf(i) };
  });

  const lines: NeedLine[] = [];
  const replies = repliesQ.data || [];
  if (replies.length) {
    lines.push({ id: "reply", icon: "reply", to: "/inbox", text: `${replies.length} ${replies.length === 1 ? "reply" : "replies"} waiting`, detail: names(replies.map((p) => firstName(p.name))) });
  }
  if (unpaid.length) {
    const s = unpaid.filter((i) => i.source === "kinesiology").length;
    const l = unpaid.length - s;
    const parts = [s ? `${s} session${s === 1 ? "" : "s"}` : "", l ? `${l} lesson${l === 1 ? "" : "s"}` : ""].filter(Boolean).join(", ");
    lines.push({ id: "unpaid", icon: "unpaid", to: "/calendar?show=unpaid", text: `$${Math.round(sumAmount(unpaid)).toLocaleString("en-AU")} unpaid from the last 60 days`, detail: `${parts} — ${names([...new Set(unpaid.map((i) => firstName(itemName(i))))])}` });
  }
  const pencils = pencilQ.data || [];
  if (pencils.length) {
    lines.push({ id: "pencil", icon: "pencil", to: "/timetable", text: `${pencils.length} pencilled booking${pencils.length === 1 ? "" : "s"} to confirm`, detail: names(pencils.map((p) => `${firstName(p.name)} ${format(new Date(p.slotStart), "EEE d MMM")}`)) });
  }
  const follow = followQ.data || [];
  if (follow.length) {
    const quick = follow.filter((c) => c.isQuickWin);
    lines.push({ id: "follow", icon: "followup", to: "/follow-up", text: `${follow.length} to follow up${quick.length ? ` — ${quick.length} quick win${quick.length === 1 ? "" : "s"}` : ""}`, detail: names((quick.length ? quick : follow).map((c) => firstName(c.name))) });
  }
  const alerts = alertsQ.data || [];
  if (alerts.length) {
    lines.push({ id: "alert", icon: "alert", to: "/clients?tool=oversight", text: `${alerts.length} clinical alert${alerts.length === 1 ? "" : "s"}`, detail: names(alerts.map((a) => `${firstName(a.name)}'s BOLT is ${a.bolt}s`)) });
  }
  const needsLoading = itemsQ.isLoading || repliesQ.isLoading || followQ.isLoading || pencilQ.isLoading || alertsQ.isLoading;

  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const summary = day.today.length === 0
    ? "Nothing booked today — a good day for practice and admin."
    : [
        [sessions ? `${sessions} session${sessions === 1 ? "" : "s"}` : "", lessons ? `${lessons} lesson${lessons === 1 ? "" : "s"}` : ""].filter(Boolean).join(" and ") + " today",
        live ? `${firstName(itemName(live))} is on now` : next ? `next: ${firstName(itemName(next))} at ${format(itemStart(next), "h:mm a")}` : "all done for the day",
      ].join(" · ");

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-[13px] text-muted-foreground">
              <time dateTime={now.toISOString()}>{format(now, "EEEE d MMMM")}</time>
              <span className="mx-1.5 text-muted-foreground/40">·</span>
              <span className="tabular-nums">{format(now, "h:mm a")}</span>
            </p>
            <h1 className="mt-1 font-serif text-[30px] font-medium leading-[1.1] tracking-[-0.025em] text-foreground sm:text-[34px]">
              {greeting}, Daniele
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground blur-sensitive">{itemsQ.isLoading ? "Loading your day…" : summary}</p>
          </div>
          <Button
            onClick={() => setQuickSessionOpen(true)}
            className="h-10 shrink-0 gap-2 rounded-xl px-4 text-sm font-medium shadow-[inset_0_1px_0_hsl(0_0%_100%/0.16),0_1px_2px_hsl(var(--shadow-color)/0.2),0_8px_20px_-8px_hsl(var(--primary)/0.5)]"
          >
            <Zap size={16} className="shrink-0" />
            Start quick session
          </Button>
        </div>

        {itemsQ.isError ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <AlertCircle size={24} className="text-destructive" />
            <p className="text-sm text-muted-foreground">Couldn't load today's sessions and lessons.</p>
            <Button variant="outline" size="sm" onClick={() => itemsQ.refetch()} className="gap-2"><RefreshCw size={14} /> Retry</Button>
          </div>
        ) : itemsQ.isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-[108px] w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        ) : (
          <>
            <DayStats
              sessions={sessions}
              lessons={lessons}
              bookedThisWeek={day.bookedThisWeek}
              earnedThisWeek={day.earnedThisWeek}
              unpaidTotal={sumAmount(unpaid)}
              unpaidCount={unpaid.length}
            />
            <div className="space-y-2">
              <TodayTimeline entries={timeline} />
              <TodayList items={day.today} goals={goalsQ.data || {}} now={now} />
            </div>
          </>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <NeedsYou lines={lines} loading={needsLoading && lines.length === 0} />
          {!itemsQ.isLoading && !itemsQ.isError && <ComingUp items={day.comingUp} />}
        </div>

        <PracticeRow morningDone={morningDone} morningTotal={MORNING_STEPS} />

        <figure className="relative overflow-hidden rounded-2xl border border-border bg-card px-6 py-6 shadow-xs sm:px-8">
          <span aria-hidden className="absolute -left-1 -top-6 select-none font-serif text-[120px] leading-none text-primary/10">“</span>
          <blockquote className="relative font-serif text-lg leading-relaxed text-foreground/90 sm:text-xl">
            Thank you for your valuable work yesterday — I slept well and now feeling relaxed and balanced today!!
          </blockquote>
          <figcaption className="relative mt-3 flex items-center gap-2 text-[13px] text-muted-foreground">
            <span className="h-px w-5 bg-border" /> A client, July 14
          </figcaption>
        </figure>
      </div>

      <QuickSessionDialog open={quickSessionOpen} onOpenChange={setQuickSessionOpen} />
    </AppLayout>
  );
};

export default TodayPage;
