"use client";

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
      <div className="p-8 bg-white dark:bg-slate-900 rounded-[2rem] border border-secondary/30 flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 bg-white dark:bg-slate-900 rounded-[2rem] border border-secondary/30 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-serif font-bold flex items-center gap-3 text-primary">
          <Calendar size={20} className="text-rose-500" />
          Upcoming Sessions
        </h3>
        {isPrivate && (
          <Badge variant="outline" className="h-5 px-2 text-[8px] font-black uppercase border-rose-200 text-rose-400 rounded-full">
            <EyeOff size={10} className="mr-1" /> Private
          </Badge>
        )}
      </div>
      
      <div className="space-y-3">
        {appointments.map((appointment) => {
          const dateLabel = getDateLabel(appointment.date);
          const isUrgent = isToday(appointment.date) || isTomorrow(appointment.date);

          return (
            <Link
              key={appointment.id}
              to={`/appointments/${appointment.id}`}
              className={cn(
                "flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group border",
                isUrgent
                  ? "border-amber-200 bg-amber-50/50 dark:bg-amber-900/10 hover:border-amber-400"
                  : "border-secondary/30 bg-muted/30 hover:bg-muted/50"
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <Badge
                    className={cn(
                      "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                      isUrgent
                        ? "bg-amber-500 text-white"
                        : "bg-primary text-white"
                    )}
                  >
                    {dateLabel}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-1">
                    <Clock size={12} />
                    {format(appointment.date, "h:mm a")}
                  </span>
                </div>
                <p className={cn(
                  "font-black text-sm text-foreground group-hover:text-primary transition-colors truncate",
                  isPrivate && "blur-sm select-none"
                )}>
                  {appointment.clients.name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <p className={cn(
                    "text-[10px] text-muted-foreground font-black uppercase tracking-widest truncate",
                    isPrivate && "blur-[2px] select-none"
                  )}>
                    {appointment.name || appointment.tag || "Clinical Session"}
                  </p>
                  {appointment.is_paid && (
                    <span className={cn(
                      "px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                      appointment.payment_received ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                    )}>
                      {appointment.payment_received ? "Paid" : `Due ${appointment.price_amount ? `$${appointment.price_amount}` : ''}`}
                    </span>
                  )}
                </div>
              </div>
              <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-all shadow-sm">
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
        {appointments.length === 0 && (
          <div className="text-center py-12 bg-muted/30 rounded-2xl border border-dashed border-secondary/50">
            <p className="text-muted-foreground text-sm font-medium mb-4">No upcoming sessions</p>
            <Link to="/appointments">
              <Button variant="outline" size="sm" className="text-[10px] font-black uppercase tracking-widest rounded-full px-6">
                Schedule Session
              </Button>
            </Link>
          </div>
        )}
      </div>
      
      {appointments.length > 0 && (
        <Link to="/appointments" className="mt-6 block">
          <Button
            variant="ghost"
            className="w-full h-10 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary hover:bg-muted group rounded-xl"
          >
            View All Appointments <ArrowRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      )}
    </div>
  );
};

export default UpcomingAppointments;