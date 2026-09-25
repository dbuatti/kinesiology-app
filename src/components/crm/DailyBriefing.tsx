import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronRight, CalendarCheck, Coffee } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { AppointmentWithClient } from "@/types/crm";
import SectionCard from "@/components/shared/SectionCard";

interface DailyBriefingProps {
  todaySessions: AppointmentWithClient[];
  activeSession: AppointmentWithClient | null;
}

const DailyBriefing = ({ todaySessions, activeSession }: DailyBriefingProps) => {
  return (
    <SectionCard
      title="Today’s sessions"
      icon={CalendarCheck}
      description={
        todaySessions.length > 0
          ? `${todaySessions.length} scheduled for today`
          : "Your schedule is clear today"
      }
      action={
        activeSession && (
          <Link
            to={`/appointments/${activeSession.id}`}
            className="inline-flex h-7 items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 text-xs font-medium text-destructive hover:bg-destructive/15"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-destructive" />
            </span>
            Live · <span className="blur-sensitive">{activeSession.clients?.name}</span>
          </Link>
        )
      }
    >
      {todaySessions.length > 0 ? (
        <ul className="space-y-px">
          {todaySessions.map((session) => {
            const live = activeSession?.id === session.id;
            return (
              <li key={session.id}>
                <Link
                  to={`/appointments/${session.id}`}
                  className={cn(
                    "group flex items-start gap-4 rounded-xl px-3 py-3 hover:bg-foreground/[0.03]",
                    live && "bg-primary/[0.05] hover:bg-primary/[0.08]"
                  )}
                >
                  <div className="w-16 shrink-0 pt-0.5 text-right">
                    <div className={cn("text-[13px] font-medium tabular-nums", live ? "text-primary" : "text-foreground")}>
                      {format(session.date, "h:mm")}
                      <span className="ml-0.5 text-[11px] text-muted-foreground">{format(session.date, "a")}</span>
                    </div>
                    {live && <div className="text-[11px] font-medium text-primary">Now</div>}
                  </div>
                  <div className={cn("w-px self-stretch rounded-full", live ? "bg-primary" : "bg-border")} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground blur-sensitive">{session.clients?.name}</p>
                    {session.goal ? (
                      <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-muted-foreground">{session.goal}</p>
                    ) : (
                      <p className="mt-0.5 text-[13px] text-muted-foreground/70">No goal recorded yet</p>
                    )}
                  </div>
                  <ChevronRight
                    size={16}
                    className="mt-0.5 shrink-0 text-muted-foreground/50 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-foreground"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 px-6 pb-8 pt-4 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground">
            <Coffee size={20} strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">No sessions today</p>
            <p className="mx-auto mt-0.5 max-w-xs text-[13px] text-muted-foreground">
              Use the time for clinical research or your own practice.
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="mt-1 h-8 rounded-lg text-[13px]">
            <Link to="/practice/self">Start self practice</Link>
          </Button>
        </div>
      )}
    </SectionCard>
  );
};

export default DailyBriefing;
