"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Loader2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { format, isToday, isTomorrow } from "date-fns";
import { cn } from "@/lib/utils";
import { AppointmentWithClient } from "@/types/crm";

const UpcomingAppointments = () => {
  const [appointments, setAppointments] = useState<AppointmentWithClient[]>([]);
  const [loading, setLoading] = useState(true);

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
      <Card className="border-none shadow-sm rounded-2xl bg-card">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Calendar size={20} className="text-indigo-500" />
            Upcoming Sessions
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-indigo-500" size={24} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-sm rounded-2xl bg-card">
      <CardHeader>
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Calendar size={20} className="text-indigo-500" />
          Upcoming Sessions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {appointments.map((appointment) => {
            const dateLabel = getDateLabel(appointment.date);
            const isUrgent = isToday(appointment.date) || isTomorrow(appointment.date);

            return (
              <Link
                key={appointment.id}
                to={`/appointments/${appointment.id}`}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-xl transition-all group border-2",
                  isUrgent
                    ? "border-amber-200 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-900/10 hover:border-amber-300 dark:hover:border-amber-900/50"
                    : "border-muted bg-muted/30 hover:bg-muted/50"
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      className={cn(
                        "text-[10px] font-black uppercase tracking-widest",
                        isUrgent
                          ? "bg-amber-500 hover:bg-amber-600"
                          : "bg-indigo-500 hover:bg-indigo-600"
                      )}
                    >
                      {dateLabel}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-bold flex items-center gap-1">
                      <Clock size={12} />
                      {format(appointment.date, "h:mm a")}
                    </span>
                  </div>
                  <p className="font-black text-sm text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                    {appointment.clients.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {appointment.name || appointment.tag}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ArrowRight size={16} />
                </Button>
              </Link>
            );
          })}
          {appointments.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm mb-2 font-medium">No upcoming sessions</p>
              <Link to="/appointments">
                <Button variant="outline" size="sm" className="text-[10px] font-black uppercase tracking-widest rounded-xl">
                  Schedule Session
                </Button>
              </Link>
            </div>
          )}
        </div>
        {appointments.length > 0 && (
          <Link to="/appointments" className="block mt-4">
            <Button
              variant="ghost"
              className="w-full text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-[10px] font-black uppercase tracking-widest"
            >
              VIEW ALL APPOINTMENTS
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingAppointments;