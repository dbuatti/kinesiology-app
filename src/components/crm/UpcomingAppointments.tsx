
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Loader2, ArrowRight, EyeOff } from "lucide-react";
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
      <div className="p-8 bg-card dark:bg-foreground rounded-[2rem] border border-border/50 dark:border-foreground flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={24} />
      </div>
    );
  }

  return (
    <div className="p-8 bg-card dark:bg-foreground rounded-[2rem] border border-border/50 dark:border-foreground shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-2xl font-serif font-bold flex items-center gap-4 text-foreground dark:text-primary-foreground">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 shadow-sm">
            <Calendar size={20} />
          </div>
          Upcoming Sessions
        </h3>
        {isPrivate && (
          <Badge variant="outline" className="h-5 px-2 text-[8px] font-black uppercase border-rose-200 text-rose-400 rounded-full">
            <EyeOff size={10} className="mr-1" /> Private
          </Badge>
        )}
      </div>
      
      <div className="space-y-4">
        {appointments.map((appointment) => {
          const dateLabel = getDateLabel(appointment.date);
          const isUrgent = isToday(appointment.date) || isTomorrow(appointment.date);

          return (
            <Link
              key={appointment.id}
              to={`/appointments/${appointment.id}`}
              className={cn(
                "flex items-center gap-5 p-5 rounded-2xl transition-all duration-500 group border",
                isUrgent
                  ? "border-amber-200 bg-amber-50/50 dark:bg-amber-900/10 hover:border-amber-400 hover:shadow-lg"
                  : "border-border/30 dark:border-foreground bg-muted/50/50 dark:bg-foreground/50 hover:border-indigo-200 hover:shadow-lg"
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <Badge
                    className={cn(
                      "text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border-none shadow-sm",
                      isUrgent
                        ? "bg-amber-500 text-primary-foreground"
                        : "bg-indigo-600 text-primary-foreground"
                    )}
                  >
                    {dateLabel}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-1.5">
                    <Clock size={12} />
                    {format(appointment.date, "h:mm a")}
                  </span>
                </div>
                <p className={cn(
                  "font-black text-lg text-foreground dark:text-primary-foreground group-hover:text-indigo-600 transition-colors truncate",
                  isPrivate && "blur-sm select-none"
                )}>
                  {appointment.clients.name}
                </p>
                <div className="flex items-center gap-3 mt-1.5">
                  <p className={cn(
                    "text-[10px] text-muted-foreground font-bold uppercase tracking-widest truncate",
                    isPrivate && "blur-[2px] select-none"
                  )}>
                    {appointment.name || appointment.tag || "Clinical Session"}
                  </p>
                  {appointment.is_paid && (
                    <span className={cn(
                      "px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest",
                      appointment.payment_received ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                    )}>
                      {appointment.payment_received ? "Paid" : `Due ${appointment.price_amount ? `$${appointment.price_amount}` : ''}`}
                    </span>
                  )}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-card dark:bg-foreground flex items-center justify-center text-muted-foreground/60 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all shadow-sm">
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
        {appointments.length === 0 && (
          <div className="text-center py-16 bg-muted/50 dark:bg-foreground/50 rounded-2xl border border-dashed border-border dark:border-foreground">
            <p className="text-muted-foreground text-sm font-medium mb-6">No upcoming sessions</p>
            <Link to="/appointments">
              <Button variant="outline" className="rounded-xl px-8 h-12 font-black text-[10px] uppercase tracking-widest border-border hover:bg-card shadow-sm">
                Schedule Session
              </Button>
            </Link>
          </div>
        )}
      </div>
      
      {appointments.length > 0 && (
        <Link to="/appointments" className="mt-8 block">
          <Button
            variant="ghost"
            className="w-full rounded-xl h-12 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50 group transition-all"
          >
            View All Appointments <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      )}
    </div>
  );
};

export default UpcomingAppointments;