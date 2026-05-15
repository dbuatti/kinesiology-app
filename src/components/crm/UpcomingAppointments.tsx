"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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
    if (isToday(date)) return "TODAY";
    if (isTomorrow(date)) return "TOMORROW";
    return format(date, "MMM d").toUpperCase();
  };

  if (loading) {
    return (
      <div className="p-8 border border-border flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  return (
    <div className="p-8 border border-border bg-background">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3 text-primary">
          <Calendar size={18} />
          <h3 className="text-xl font-medium uppercase tracking-tight">Upcoming Sessions</h3>
        </div>
        {isPrivate && (
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-destructive">
            <EyeOff size={12} />
            <span>Private</span>
          </div>
        )}
      </div>
      
      <div className="space-y-0 border border-border">
        {appointments.map((appointment) => {
          const dateLabel = getDateLabel(appointment.date);
          const isUrgent = isToday(appointment.date) || isTomorrow(appointment.date);

          return (
            <Link
              key={appointment.id}
              to={`/appointments/${appointment.id}`}
              className={cn(
                "flex items-center gap-4 p-6 border-b border-border last:border-b-0 transition-colors group",
                isUrgent ? "bg-destructive/5 hover:bg-destructive/10" : "hover:bg-muted"
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5",
                    isUrgent ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"
                  )}>
                    {dateLabel}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-1">
                    <Clock size={12} />
                    {format(appointment.date, "h:mm a")}
                  </span>
                </div>
                <p className={cn(
                  "font-medium text-lg uppercase tracking-tight group-hover:text-primary transition-colors truncate",
                  isPrivate && "blur-sm select-none"
                )}>
                  {appointment.clients.name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <p className={cn(
                    "text-[10px] text-muted-foreground font-bold uppercase tracking-widest truncate",
                    isPrivate && "blur-[2px] select-none"
                  )}>
                    {appointment.name || appointment.tag || "Clinical Session"}
                  </p>
                </div>
              </div>
              <ArrowRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          );
        })}
        {appointments.length === 0 && (
          <div className="text-center py-12 bg-muted/30">
            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mb-4">No upcoming sessions</p>
            <Link to="/appointments">
              <Button variant="outline" size="sm" className="h-10 px-6 font-bold text-[10px] uppercase tracking-widest border-border">
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
            className="w-full h-12 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary hover:bg-muted group"
          >
            View All Appointments <ArrowRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      )}
    </div>
  );
};

export default UpcomingAppointments;