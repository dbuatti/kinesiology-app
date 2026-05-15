"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { 
  format, 
  addDays, 
  startOfToday, 
  endOfDay, 
  isSameDay,
  parseISO
} from "date-fns";
import { 
  Clock, 
  Calendar, 
  Loader2, 
  AlertCircle,
  CalendarDays,
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
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  const targetEventTypeId = eventTypeId || CALCOM_CONFIG.DEFAULT_EVENT_TYPE_ID;

  const fetchSlots = async () => {
    setLoading(true);
    setError(null);
    try {
      const start = startOfToday().toISOString();
      // Scan 30 days ahead to ensure we find available days
      const end = endOfDay(addDays(startOfToday(), 30)).toISOString();
      
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

      const fetchedSlots = data.data || {};
      setSlots(fetchedSlots);

      // Auto-select the first day that actually has slots
      const availableDates = Object.keys(fetchedSlots)
        .filter(dateKey => fetchedSlots[dateKey].length > 0)
        .sort();

      if (availableDates.length > 0) {
        setSelectedDate(parseISO(availableDates[0]));
      }
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

  // Only show days that have slots
  const availableDates = useMemo(() => {
    return Object.keys(slots)
      .filter(dateKey => slots[dateKey].length > 0)
      .map(dateKey => parseISO(dateKey))
      .sort((a, b) => a.getTime() - b.getTime());
  }, [slots]);

  const currentDaySlots = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    return slots[dateKey] || [];
  }, [selectedDate, slots]);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-4 text-center">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 animate-pulse" />
          <Loader2 className="absolute inset-0 m-auto w-8 h-8 text-indigo-600 animate-spin" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-slate-900">Syncing Availability</p>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Checking Cal.com...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-rose-50 border-2 border-rose-100 rounded-[2rem] text-center space-y-4">
        <AlertCircle className="mx-auto text-rose-500" size={32} />
        <div className="space-y-1">
          <p className="text-sm font-bold text-rose-900">Connection Error</p>
          <p className="text-xs text-rose-700 leading-relaxed">{error}</p>
        </div>
        <Button variant="outline" onClick={fetchSlots} className="rounded-xl border-rose-200 text-rose-700 hover:bg-rose-100">
          Retry Sync
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Date Scroller */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Available Days</p>
          <Badge variant="outline" className="text-[8px] font-black border-slate-200 text-slate-400 uppercase tracking-widest">
            Next 30 Days
          </Badge>
        </div>
        
        {availableDates.length > 0 ? (
          <ScrollArea className="w-full whitespace-nowrap pb-4">
            <div className="flex gap-3 px-1">
              {availableDates.map((date) => {
                const isActive = selectedDate && isSameDay(date, selectedDate);
                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => setSelectedDate(date)}
                    className={cn(
                      "flex flex-col items-center justify-center min-w-[80px] h-24 rounded-[1.5rem] border-2 transition-all duration-300",
                      isActive 
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-xl scale-105 z-10" 
                        : "bg-white border-slate-100 hover:border-indigo-200 text-slate-600"
                    )}
                  >
                    <span className="text-[9px] font-black uppercase tracking-widest mb-1 opacity-60">
                      {format(date, "EEE")}
                    </span>
                    <span className="text-2xl font-black leading-none">
                      {format(date, "d")}
                    </span>
                    <span className="text-[8px] font-bold mt-2 opacity-40 uppercase">
                      {format(date, "MMM")}
                    </span>
                  </button>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        ) : (
          <div className="py-12 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 text-center px-8">
            <CalendarDays className="mx-auto text-slate-300 mb-4" size={40} />
            <h3 className="text-lg font-bold text-slate-900">No availability found</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              There are no open slots in the next 30 days. Please check your schedule in Cal.com.
            </p>
          </div>
        )}
      </div>

      {/* Slots Area */}
      {selectedDate && (
        <div className="space-y-4 animate-in slide-in-from-top-2 duration-500">
          <div className="flex items-center justify-between px-1">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
              Times for {format(selectedDate, "EEEE, MMMM do")}
            </p>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              {currentDaySlots.length} Slots
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {currentDaySlots.map((slot, idx) => {
              const timeStr = slot.time || slot.start;
              const dateObj = parseISO(timeStr);
              return (
                <button
                  key={idx}
                  onClick={() => onSlotSelect(dateObj, format(dateObj, "HH:mm"), timeStr)}
                  className="flex items-center justify-center p-4 rounded-2xl bg-white border border-slate-100 text-xs font-black text-slate-900 hover:bg-indigo-600 hover:border-indigo-600 hover:text-white transition-all group shadow-sm hover:shadow-md hover:-translate-y-0.5"
                >
                  <Clock size={14} className="mr-2 opacity-30 group-hover:opacity-100 transition-opacity" />
                  {format(dateObj, "h:mm a")}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="p-5 bg-indigo-50 rounded-[2rem] border-2 border-indigo-100 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
          <Info size={20} />
        </div>
        <p className="text-xs text-indigo-900 font-medium leading-relaxed">
          <strong>Clinical Workflow:</strong> Selecting a slot will automatically prepare the booking form. You can still override the time manually if the client needs a specific off-grid adjustment.
        </p>
      </div>
    </div>
  );
};

export default CompactAvailabilityPicker;