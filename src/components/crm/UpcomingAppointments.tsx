
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Loader2, ArrowRight, EyeOff, CalendarClock, ChevronRight } from "lucide-react";
import SectionCard from "@/components/shared/SectionCard";
import { Link } from "react-router-dom";
import { format, isToday, isTomorrow } from "date-fns";
import { cn } from "@/lib/utils";
import { AppointmentWithClient } from "@/types/crm";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";

const UpcomingAppointments = () => {
  const [appointments, setAppointments] = useState<AppointmentWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const { isPrivate } = usePrivacyMode();

  useEffect(() => {
    const fetchUpcoming = async () => {
      try {
        const { data, error } = await supabase
          .from("appointments")
          .select(`
            *,
            clients!inner (
              id,
              name,
              is_practitioner
            )
          `)
          .or('is_practitioner.eq.false,is_practitioner.is.null', { foreignTable: 'clients' })
          .neq("status", "Cancelled")
          .gte("date", new Date().toISOString())
          .order("date", { ascending: true })
          .limit(5);

        if (error) throw error;

        setAppointments(
          (data || []).map((app: any) => ({
            ...app,
            date: new Date(app.date),
          })) as unknown as AppointmentWithClient[]
        );
      } catch (error) {
        console.error("Error fetching upcoming appointments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUpcoming();
  }, []);

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "MMM d");
  };

  if (loading) {
    return (
      <SectionCard title="Upcoming sessions" icon={CalendarClock}>
        <div className="space-y-1 px-3 pb-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 py-2.5">
              <div className="h-10 w-10 animate-pulse rounded-lg bg-muted" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
                <div className="h-2.5 w-1/4 animate-pulse rounded bg-muted/70" />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Upcoming sessions"
      icon={CalendarClock}
      action={
        <>
          {isPrivate && (
            <span className="inline-flex h-6 items-center gap-1 rounded-full border border-border px-2 text-[11px] text-muted-foreground">
              <EyeOff size={11} /> Private
            </span>
          )}
          {appointments.length > 0 && (
            <Link to="/appointments" className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-[13px] text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground">
              View all <ArrowRight size={13} />
            </Link>
          )}
        </>
      }
    >
      <ul className="space-y-px">
        {appointments.map((appointment) => {
          const dateLabel = getDateLabel(appointment.date);
          const isUrgent = isToday(appointment.date) || isTomorrow(appointment.date);

          return (
            <li key={appointment.id}>
              <Link
                to={`/appointments/${appointment.id}`}
                className="group flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-foreground/[0.03]"
              >
                {/* Calendar leaf */}
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg border leading-none",
                    isUrgent ? "border-primary/25 bg-primary/[0.06] text-primary" : "border-border bg-background text-foreground"
                  )}
                >
                  <span className="text-[9.5px] font-medium uppercase tracking-wide opacity-70">{format(appointment.date, "MMM")}</span>
                  <span className="mt-0.5 text-[15px] font-semibold tabular-nums">{format(appointment.date, "d")}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className={cn("truncate text-sm font-medium text-foreground", isPrivate && "blur-sm select-none")}>
                    {appointment.clients.name}
                  </p>
                  <p className={cn("flex items-center gap-1.5 truncate text-xs text-muted-foreground", isPrivate && "blur-[2px] select-none")}>
                    <span className={cn(isUrgent && "font-medium text-primary")}>{dateLabel}</span>
                    <span className="text-muted-foreground/40">·</span>
                    <span className="tabular-nums">{format(appointment.date, "h:mm a")}</span>
                    <span className="text-muted-foreground/40">·</span>
                    {/* appointment.name deliberately not used — it's a booking-time
                        snapshot that can go stale or contradict the live client
                        record. appointment.tag is a real categorisation field. */}
                    <span className="truncate">{appointment.tag || "Clinical session"}</span>
                  </p>
                </div>
                {appointment.is_paid && (
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums",
                      appointment.payment_received
                        ? "bg-chart-emerald/10 text-chart-emerald"
                        : "bg-chart-amber/10 text-[hsl(30_80%_38%)] dark:text-chart-amber"
                    )}
                  >
                    {appointment.payment_received ? "Paid" : `Due${appointment.price_amount ? ` $${appointment.price_amount}` : ""}`}
                  </span>
                )}
                <ChevronRight size={16} className="shrink-0 text-muted-foreground/40 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-foreground" />
              </Link>
            </li>
          );
        })}
        {appointments.length === 0 && (
          <li className="flex flex-col items-center gap-3 px-6 pb-8 pt-4 text-center">
            <p className="text-[13px] text-muted-foreground">No upcoming sessions</p>
            <Button asChild variant="outline" size="sm" className="h-8 rounded-lg text-[13px]">
              <Link to="/appointments">Schedule a session</Link>
            </Button>
          </li>
        )}
      </ul>
    </SectionCard>
  );
};

export default UpcomingAppointments;