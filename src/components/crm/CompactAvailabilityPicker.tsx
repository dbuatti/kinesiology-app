
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { 
  format, 
  addDays, 
  startOfToday, 
  endOfDay, 
  isSameDay,
  parseISO,
  eachDayOfInterval
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

  // Generate all 30 days, marking which have slots
  const allDays = useMemo(() => {
    const today = startOfToday();
    const days = eachDayOfInterval({ start: today, end: addDays(today, 29) });
    return days.map(date => {
      const dateKey = format(date, 'yyyy-MM-dd');
      const hasSlots = (slots[dateKey] || []).length > 0;
      return { date, dateKey, hasSlots };
    });
  }, [slots]);

  const availableDates = useMemo(() => {
    return allDays.filter(d => d.hasSlots);
  }, [allDays]);

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
          <p className="text-sm font-bold text-foreground">Syncing Availability</p>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Checking Cal.com...</p>
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
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Date Scroller */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Available Days</p>
          <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest">
            Next 30 Days
          </Badge>
        </div>

        {allDays.length > 0 ? (
          <>
            {availableDates.length === 0 && (
              <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
                <p className="text-xs font-semibold text-amber-700">No available slots in the next 30 days</p>
                <p className="text-[10px] text-amber-600 mt-0.5">Check your availability settings in Cal.com</p>
              </div>
            )}
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-2.5 pb-2">
                {allDays.filter(d => d.hasSlots).map(({ date, dateKey }) => {
                  const isActive = selectedDate && isSameDay(date, selectedDate);
                  return (
                    <button
                      key={dateKey}
                      onClick={() => setSelectedDate(date)}
                      className={cn(
                        "flex flex-col items-center justify-center min-w-[72px] h-20 rounded-2xl border-2 transition-all duration-200 shrink-0",
                        isActive
                          ? "bg-primary border-primary text-white shadow-lg scale-105"
                          : "bg-card border-border hover:border-primary/30 text-foreground"
                      )}
                    >
                      <span className="text-[9px] font-black uppercase tracking-wider opacity-60">
                        {format(date, "EEE")}
                      </span>
                      <span className="text-xl font-black leading-tight">
                        {format(date, "d")}
                      </span>
                      <span className="text-[8px] font-bold opacity-40 uppercase">
                        {format(date, "MMM")}
                      </span>
                    </button>
                  );
                })}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </>
        ) : (
          <div className="py-10 bg-muted/30 rounded-2xl border-2 border-dashed border-border text-center px-6">
            <CalendarDays className="mx-auto text-muted-foreground/30 mb-3" size={36} />
            <p className="text-sm font-bold text-foreground">No availability found</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              No open slots in the next 30 days. Check your schedule in Cal.com.
            </p>
          </div>
        )}
      </div>

      {/* Slots Grid */}
      {selectedDate && (
        <div className="space-y-3 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
              Times for {format(selectedDate, "EEEE, MMMM do")}
            </p>
            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              {currentDaySlots.length} slots
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {currentDaySlots.map((slot, idx) => {
              const timeStr = slot.time || slot.start;
              const dateObj = parseISO(timeStr);
              return (
                <button
                  key={idx}
                  onClick={() => onSlotSelect(dateObj, format(dateObj, "HH:mm"), timeStr)}
                  className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-card border border-border text-sm font-black text-foreground hover:bg-indigo-600 hover:border-indigo-600 hover:text-white transition-all group shadow-sm"
                >
                  <Clock size={13} className="opacity-40 group-hover:opacity-100 transition-opacity shrink-0" />
                  {format(dateObj, "h:mm a")}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-start gap-3">
        <Info size={16} className="text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-foreground/80 font-medium leading-relaxed">
          <strong>Clinical Workflow:</strong> Selecting a slot prepares the booking form automatically. You can still override the time for off-grid adjustments.
        </p>
      </div>
    </div>
  );
};

export default CompactAvailabilityPicker;