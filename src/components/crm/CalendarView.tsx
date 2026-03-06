"use client";

import React, { useState } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval,
  isToday
} from 'date-fns';
import { ChevronLeft, ChevronRight, Clock, User, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CalendarViewProps {
  appointments: any[];
}

const CalendarView = ({ appointments }: CalendarViewProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const getAppointmentsForDay = (day: Date) => {
    return appointments.filter(app => isSameDay(new Date(app.date), day));
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden animate-in fade-in duration-500">
      {/* Calendar Header */}
      <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <p className="text-slate-500 font-medium text-sm mt-1">Monthly clinical schedule</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth} className="rounded-xl h-12 w-12 border-slate-200 hover:bg-white">
            <ChevronLeft size={24} />
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth} className="rounded-xl h-12 w-12 border-slate-200 hover:bg-white">
            <ChevronRight size={24} />
          </Button>
        </div>
      </div>

      {/* Days of Week */}
      <div className="grid grid-cols-7 border-b border-slate-100">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="py-4 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day, i) => {
          const dayApps = getAppointmentsForDay(day);
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isCurrentDay = isToday(day);

          return (
            <div 
              key={day.toString()} 
              className={cn(
                "min-h-[140px] p-3 border-r border-b border-slate-50 transition-colors",
                !isCurrentMonth && "bg-slate-50/30 opacity-40",
                isCurrentDay && "bg-indigo-50/30"
              )}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={cn(
                  "w-8 h-8 flex items-center justify-center rounded-full text-sm font-black",
                  isCurrentDay ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "text-slate-400"
                )}>
                  {format(day, "d")}
                </span>
                {dayApps.length > 0 && (
                  <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-none text-[9px] font-black">
                    {dayApps.length}
                  </Badge>
                )}
              </div>

              <div className="space-y-1.5">
                {dayApps.slice(0, 3).map((app) => (
                  <Tooltip key={app.id}>
                    <TooltipTrigger asChild>
                      <Link 
                        to={`/appointments/${app.id}`}
                        className={cn(
                          "block p-2 rounded-lg text-[10px] font-bold truncate transition-all hover:scale-[1.02]",
                          app.status === 'Completed' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-indigo-50 text-indigo-700 border border-indigo-100"
                        )}
                      >
                        <div className="flex items-center gap-1">
                          <span className="opacity-60">{format(new Date(app.date), "h:mm")}</span>
                          <span className="truncate">{app.clients?.name}</span>
                        </div>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent className="rounded-xl p-3 shadow-2xl border-none">
                      <div className="space-y-1">
                        <p className="font-black text-slate-900">{app.clients?.name}</p>
                        <p className="text-[10px] font-bold text-indigo-600 uppercase">{app.tag}</p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          <Clock size={10} /> {format(new Date(app.date), "h:mm a")}
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                ))}
                {dayApps.length > 3 && (
                  <p className="text-[9px] font-black text-slate-400 text-center pt-1">
                    + {dayApps.length - 3} more
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;