"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Loader2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { format, isToday, isTomorrow } from "date-fns";
import { cn } from "@/lib/utils";
import { useUpcomingAppointments } from "@/hooks/use-crm-data";
import { Skeleton } from "@/components/ui/skeleton";

const UpcomingAppointments = () => {
  const { data: appointments, isLoading, error } = useUpcomingAppointments();

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "MMM d");
  };

  if (isLoading) {
    return (
      <Card className="border-none shadow-sm rounded-2xl bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Calendar size={20} className="text-indigo-500" />
            Upcoming Sessions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100">
              <div className="flex-1 min-w-0 space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-none shadow-sm rounded-2xl bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Calendar size={20} className="text-indigo-500" />
            Upcoming Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-red-500 text-sm py-8">Error loading appointments.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-sm rounded-2xl bg-white">
      <CardHeader>
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Calendar size={20} className="text-indigo-500" />
          Upcoming Sessions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {appointments?.map((appointment) => {
            const dateLabel = getDateLabel(appointment.date);
            const isUrgent = isToday(appointment.date) || isTomorrow(appointment.date);

            return (
              <Link
                key={appointment.id}
                to={`/appointments/${appointment.id}`}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-xl transition-all group border-2",
                  isUrgent
                    ? "border-amber-200 bg-amber-50 hover:border-amber-300"
                    : "border-slate-100 hover:bg-slate-50"
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      className={cn(
                        "text-xs font-bold",
                        isUrgent
                          ? "bg-amber-500 hover:bg-amber-600"
                          : "bg-indigo-500 hover:bg-indigo-600"
                      )}
                    >
                      {dateLabel}
                    </Badge>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock size={12} />
                      {format(appointment.date, "h:mm a")}
                    </span>
                  </div>
                  <p className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                    {appointment.clients.name}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
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
          {appointments?.length === 0 && (
            <div className="text-center py-8">
              <p className="text-slate-400 text-sm mb-2">No upcoming sessions</p>
              <Link to="/appointments">
                <Button variant="outline" size="sm" className="text-xs">
                  Schedule Session
                </Button>
              </Link>
            </div>
          )}
        </div>
        {appointments && appointments.length > 0 && (
          <Link to="/appointments" className="block mt-4">
            <Button
              variant="ghost"
              className="w-full text-indigo-600 hover:bg-indigo-50 text-xs font-bold"
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