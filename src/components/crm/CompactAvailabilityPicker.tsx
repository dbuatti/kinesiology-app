"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { 
  format, 
  addDays, 
  startOfToday, 
  endOfDay, 
  isSameDay,
  startOfWeek,
  addWeeks
} from "date-fns";
import { 
  Clock, 
  Calendar, 
  Loader2, 
  ChevronRight, 
  ChevronLeft,
  AlertCircle,
  CheckCircle2,
  CalendarDays,
  ArrowRight,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { CALCOM_CONFIG } from "@/config/integrations";

interface CompactAvailabilityPickerProps {
  onSlotSelect: (date: Date, time: string, slotTime: string) => void;
  eventTypeId?: string;
}

const CompactAvailabilityPicker = ({ onSlotSelect, eventTypeId }: CompactAvailabilityPickerProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [slots, setSlots] = useState<Record<string, any[]>>({});
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
  
  const targetEventTypeId = eventTypeId || CALCOM_CONFIG.DEFAULT_EVENT_TYPE_ID;

  // Generate next 14 days for the horizontal picker
  const availableDates = useMemo(() => {
    return Array.from({ length: 14 }).map((_, i) => addDays(startOfToday(), i));
  }, []);

  const fetchSlots = async () => {
    setLoading(true);
    setError(null);
    try {
      const start = startOfToday().toISOString();
      const end = endOfDay(addDays(startOfToday(), 14)).toISOString();
      
      const { data, error: invokeError } = await supabase.functions.invoke('get-calcom-slots', {
        body: { 
          start, 
          end,
          eventTypeId: targetEventTypeId,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      });

      if (invokeError) throw invokeError;
      if (data.status === 'error') throw new Error(data.message);

      setSlots(data.data || {});
    } catch (err: any) {
      console.error("Failed to fetch slots:", err);
      setError(err.message || "Failed to load availability.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, [targetEventTypeId]);

  const currentDaySlots = useMemo(() => {
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    return slots[dateKey] || [];
  }, [selectedDate, slots]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Date Scroller */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Select Date</p>
          <Badge variant="outline" className="text-[8px] font-black border-slate-200 text-slate-400">Next 14 Days</Badge>
        </div>
        
        <ScrollArea className="w-full whitespace-nowrap pb-4">
          <div className="flex gap-2">
            {availableDates.map((date) => {
              const isActive = isSameDay(date, selectedDate);
              const dateKey = format(date, 'yyyy-MM-dd');
              const hasSlots = (slots[dateKey]?.length || 0) > 0;

              return (
                <button
                  key={date.toISOString()}
                  onClick={() => setSelectedDate(date)}
                  className={cn(
                    "flex flex-col items-center justify-center min-w-[70px] h-20 rounded-2xl border-2 transition-all duration-300",
                    isActive 
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-lg scale-105" 
                      : "bg-white border-slate-100 hover:border-indigo-200 text-slate-600",
                    !hasSlots && !loading && !isActive && "opacity-40 grayscale"
                  )}
                >
                  <span className="text-[8px] font-black uppercase tracking-widest mb-1 opacity-60">
                    {format(date, "EEE")}
                  </span>
                  <span className="text-lg font-black leading-none">
                    {format(date, "d")}
                  </span>
                  {hasSlots && !isActive && (
                    <div className="w-1 h-1 rounded-full bg-emerald-500 mt-2" />
                  )}
                </button>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Slots Area */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Available Times</p>
          {currentDaySlots.length > 0 && (
            <span className="text-[10px] font-bold text-indigo-600">{currentDaySlots.length} Slots</span>
          )}
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-100">
            <Loader2 className="animate-spin text-indigo-600" size={24} />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Cal.com...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3">
            <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={16} />
            <p className="text-xs text-rose-700 font-medium leading-relaxed">{error}</p>
          </div>
        ) : currentDaySlots.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {currentDaySlots.map((slot, idx) => {
              const timeStr = slot.time || slot.start;
              const dateObj = new Date(timeStr);
              return (
                <button
                  key={idx}
                  onClick={() => onSlotSelect(dateObj, format(dateObj, "HH:mm"), timeStr)}
                  className="flex items-center justify-center p-3 rounded-xl bg-white border border-slate-100 text-[11px] font-black text-slate-900 hover:bg-indigo-600 hover:border-indigo-600 hover:text-white transition-all group shadow-sm"
                >
                  <Clock size={12} className="mr-2 opacity-30 group-hover:opacity-100" />
                  {format(dateObj, "h:mm a")}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center gap-3 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-100 text-center px-6">
            <CalendarDays className="text-slate-300" size={32} />
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-900">No slots available</p>
              <p className="text-[10px] text-slate-500 font-medium">Try selecting a different date above.</p>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-start gap-3">
        <Info size={16} className="text-indigo-600 shrink-0 mt-0.5" />
        <p className="text-[10px] text-indigo-900 font-medium leading-relaxed">
          Selecting a slot will automatically prepare the booking form. You can still override the time manually if needed.
        </p>
      </div>
    </div>
  );
};

export default CompactAvailabilityPicker;