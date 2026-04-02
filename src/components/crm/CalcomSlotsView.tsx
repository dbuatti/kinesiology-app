"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Clock, 
  Loader2, 
  RefreshCw, 
  ChevronRight, 
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  CalendarDays,
  Info,
  Settings2,
  Copy,
  Check,
  Ban,
  Unlock,
  Hash,
  ShieldAlert,
  CalendarPlus
} from "lucide-react";
import { format, addWeeks, startOfToday, endOfDay, eachDayOfInterval, addDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/utils/toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AppointmentForm from "./AppointmentForm";

const CalcomSlotsView = () => {
  const [loading, setLoading] = useState(false);
  const [processingDate, setProcessingDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<Record<string, any[]>>({});
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [weeks, setWeeks] = useState(4);
  const [copied, setCopied] = useState(false);
  
  // Booking Dialog State
  const [bookingData, setBookingData] = useState<{ date: Date; time: string } | null>(null);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  
  const [eventTypeId, setEventTypeId] = useState<string>(() => 
    localStorage.getItem('calcom_preferred_event_id') || "4279898"
  );

  const [scheduleId, setScheduleId] = useState<string>(() => 
    localStorage.getItem('calcom_preferred_schedule_id') || "1387833"
  );

  const dateRange = useMemo(() => {
    const start = startOfToday();
    const end = addDays(start, (weeks * 7) - 1);
    return eachDayOfInterval({ start, end }).map(d => format(d, 'yyyy-MM-dd'));
  }, [weeks]);

  const fetchSlots = async () => {
    setLoading(true);
    setError(null);
    try {
      const start = startOfToday().toISOString();
      const end = endOfDay(addWeeks(new Date(), weeks)).toISOString();
      
      const { data, error: invokeError } = await supabase.functions.invoke('get-calcom-slots', {
        body: { 
          start, 
          end,
          eventTypeId: eventTypeId || undefined,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      });

      if (invokeError) throw invokeError;
      
      if (data.status === 'error') {
        setError(data.message);
        return;
      }

      setSlots(data.data || {});
      setBlockedDates(data.blockedDates || []);
      
      showSuccess("Availability updated.");
      
      if (eventTypeId) localStorage.setItem('calcom_preferred_event_id', eventTypeId);
      if (scheduleId) localStorage.setItem('calcom_preferred_schedule_id', scheduleId);
      
    } catch (err: any) {
      console.error("Failed to fetch slots:", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBlock = async (date: string, isCurrentlyBlocked: boolean) => {
    const action = isCurrentlyBlocked ? 'unblock-day' : 'block-day';
    const confirmMsg = isCurrentlyBlocked 
      ? `Restore default availability for ${format(new Date(date), "EEEE, MMMM do")}?`
      : `Block off ${format(new Date(date), "EEEE, MMMM do")}? You will be marked as unavailable.`;

    if (!confirm(confirmMsg)) return;

    setProcessingDate(date);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('manage-calcom-availability', {
        body: { 
          action, 
          date,
          eventTypeId,
          scheduleId: scheduleId || undefined
        }
      });

      if (invokeError) throw invokeError;
      
      if (data.status === 'error') {
        showError(data.message);
        return;
      }

      showSuccess(isCurrentlyBlocked ? "Day unblocked." : "Day blocked.");
      fetchSlots();
    } catch (err: any) {
      showError("Failed to update availability.");
    } finally {
      setProcessingDate(null);
    }
  };

  const handleSlotClick = (dateStr: string, timeStr: string) => {
    const date = new Date(dateStr);
    // Extract HH:mm from the time string (which might be ISO or just time)
    const timeMatch = timeStr.match(/(\d{2}:\d{2})/);
    const formattedTime = timeMatch ? timeMatch[1] : "10:00";
    
    setBookingData({ date, time: formattedTime });
    setBookingDialogOpen(true);
  };

  const handleCopyAll = () => {
    if (dateRange.length === 0) return;

    let text = "Here is my current availability for a session:\n\n";
    let hasAny = false;

    dateRange.forEach(date => {
      const isBlocked = blockedDates.includes(date);
      const daySlots = slots[date] || [];
      
      if (!isBlocked && daySlots.length > 0) {
        hasAny = true;
        const formattedDate = format(new Date(date), "EEEE, MMMM do");
        const times = daySlots.map(s => format(new Date(s.time || s.start), "h:mm a")).join(", ");
        text += `• ${formattedDate}: ${times}\n`;
      }
    });

    if (!hasAny) {
      showError("No available slots to copy.");
      return;
    }

    text += "\nYou can book directly here: https://cal.com/danielebuatti/fnh-neuro-75";

    navigator.clipboard.writeText(text);
    setCopied(true);
    showSuccess("Availability copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    fetchSlots();
  }, [weeks]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 bg-card p-6 rounded-[2rem] border border-border shadow-sm">
        <div className="space-y-4 flex-1">
          <div className="flex items-center gap-2">
            <Settings2 size={16} className="text-indigo-500" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Configuration</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Lookahead Range</label>
              <div className="flex bg-muted p-1 rounded-xl w-max">
                {[2, 4, 6, 8].map(w => (
                  <Button 
                    key={w}
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setWeeks(w)}
                    className={cn(
                      "h-8 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest",
                      weeks === w ? "bg-white text-indigo-600 shadow-sm" : "text-slate-50"
                    )}
                  >
                    {w}W
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 flex items-center gap-1">
                Event Type ID <Info size={10} className="text-slate-400" />
              </label>
              <Input 
                placeholder="e.g. 4279898" 
                value={eventTypeId}
                onChange={(e) => setEventTypeId(e.target.value)}
                className="h-10 rounded-xl bg-muted/50 border-none font-bold text-xs"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 flex items-center gap-1">
                Schedule ID <Hash size={10} className="text-slate-400" />
              </label>
              <Input 
                placeholder="Optional override" 
                value={scheduleId}
                onChange={(e) => setScheduleId(e.target.value)}
                className="h-10 rounded-xl bg-muted/50 border-none font-bold text-xs"
              />
            </div>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button 
            variant="outline"
            onClick={handleCopyAll}
            disabled={loading}
            className="rounded-xl h-12 px-6 border-indigo-100 text-indigo-600 hover:bg-indigo-50 font-black text-xs uppercase tracking-widest"
          >
            {copied ? <Check size={16} className="mr-2" /> : <Copy size={16} className="mr-2" />}
            Copy
          </Button>
          <Button 
            onClick={fetchSlots} 
            disabled={loading}
            className="rounded-xl h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-100"
          >
            {loading ? <Loader2 className="mr-2 animate-spin" /> : <RefreshCw size={16} className="mr-2" />}
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-rose-50 border-rose-200 rounded-2xl">
          <AlertCircle className="h-5 w-5 text-rose-600" />
          <AlertDescription className="text-sm text-rose-900 font-bold">
            Error: {error}
            <p className="mt-2 text-xs font-medium opacity-80">
              Tip: Try manually entering your **Schedule ID** from the Cal.com Availability URL.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {loading && Object.keys(slots).length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Fetching Cal.com Slots...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dateRange.map(date => {
            const daySlots = slots[date] || [];
            const isBlocked = blockedDates.includes(date);
            const hasNoSlots = daySlots.length === 0;
            
            if (!isBlocked && hasNoSlots) return null;

            return (
              <Card key={date} className={cn(
                "border-none shadow-md rounded-[2rem] overflow-hidden group hover:shadow-xl transition-all duration-500",
                isBlocked ? "bg-slate-50/80 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-800" : "bg-white dark:bg-slate-950"
              )}>
                <CardHeader className={cn(
                  "border-b transition-colors p-6",
                  isBlocked ? "bg-slate-100/50 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800" : "bg-slate-50/50 dark:bg-slate-900/30 border-slate-100 dark:border-slate-900"
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all duration-500",
                        isBlocked ? "bg-slate-400 scale-95" : "bg-indigo-600"
                      )}>
                        {isBlocked ? <Ban size={20} className="text-white" /> : <Calendar size={20} className="text-white" />}
                      </div>
                      <div>
                        <CardTitle className={cn(
                          "text-lg font-black",
                          isBlocked ? "text-slate-500" : "text-slate-900 dark:text-white"
                        )}>
                          {format(new Date(date), "EEEE")}
                        </CardTitle>
                        <CardDescription className="font-bold text-[10px] uppercase tracking-widest text-indigo-600">
                          {format(new Date(date), "MMMM d, yyyy")}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={cn(
                        "border-none font-black text-[8px] uppercase tracking-widest px-3 py-1 rounded-full shadow-sm",
                        isBlocked ? "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400" : "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                      )}>
                        {isBlocked ? "Blocked" : `${daySlots.length} Slots`}
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={cn(
                          "h-7 px-3 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all",
                          isBlocked 
                            ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-100 dark:shadow-none" 
                            : "text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 opacity-0 group-hover:opacity-100"
                        )}
                        onClick={() => handleToggleBlock(date, isBlocked)}
                        disabled={processingDate === date}
                      >
                        {processingDate === date ? (
                          <Loader2 size={12} className="animate-spin mr-1.5" />
                        ) : isBlocked ? (
                          <Unlock size={12} className="mr-1.5" />
                        ) : (
                          <Ban size={12} className="mr-1.5" />
                        )}
                        {isBlocked ? "Unblock Day" : "Block Day"}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {isBlocked ? (
                    <div className="py-10 text-center space-y-3 animate-in fade-in zoom-in-95 duration-500">
                      <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center mx-auto">
                        <ShieldAlert size={24} className="text-rose-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Manual Override</p>
                        <p className="text-xs font-bold text-slate-500 mt-1">This day is currently blocked <br/>across all event types.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {daySlots.map((slot, idx) => {
                        const timeStr = slot.time || slot.start;
                        return (
                          <button 
                            key={idx} 
                            onClick={() => handleSlotClick(date, timeStr)}
                            className="flex items-center justify-center p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs font-black text-slate-700 dark:text-slate-300 hover:bg-indigo-600 hover:border-indigo-600 hover:text-white transition-all group/slot"
                          >
                            <Clock size={12} className="mr-2 opacity-40 group-hover/slot:opacity-100 transition-opacity" />
                            {format(new Date(timeStr), "h:mm a")}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[2.5rem]">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                <CalendarPlus size={20} />
              </div>
              <DialogTitle className="text-2xl font-black">Book Client</DialogTitle>
            </div>
            <DialogDescription>Schedule a session for the selected time slot.</DialogDescription>
            <div className="flex items-center gap-4 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-indigo-600" />
                <span className="text-xs font-bold text-indigo-900">{bookingData?.date ? format(bookingData.date, "MMM d, yyyy") : ""}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-indigo-600" />
                <span className="text-xs font-bold text-indigo-900">{bookingData?.time}</span>
              </div>
            </div>
          </DialogHeader>
          {bookingData && (
            <AppointmentForm 
              initialDate={bookingData.date}
              initialTime={bookingData.time}
              onSuccess={() => {
                setBookingDialogOpen(false);
                fetchSlots();
              }} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CalcomSlotsView;