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
  ChevronLeft,
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
  ShieldAlert,
  CalendarPlus,
  User,
  X,
  Trash2,
  Filter,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  Activity,
  ArrowLeft,
  ArrowRight,
  Mail,
  Send,
  Sparkles,
  Instagram
} from "lucide-react";
import { format, addWeeks, subWeeks, startOfToday, endOfDay, eachDayOfInterval, addDays, isBefore, startOfDay, nextMonday, isMonday } from "date-fns";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AppointmentForm from "./AppointmentForm";
import { CALCOM_CONFIG } from "../../config/integrations";

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const CalcomSlotsView = () => {
  const [loading, setLoading] = useState(false);
  const [processingDate, setProcessingDate] = useState<string | null>(null);
  const [processingBooking, setProcessingBooking] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [slots, setSlots] = useState<Record<string, any[]>>({});
  const [bookings, setBookings] = useState<Record<string, any[]>>({});
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [weeks, setWeeks] = useState(4); 
  const [weeksOffset, setWeeksOffset] = useState(0); 
  const [copied, setCopied] = useState<string | null>(null);
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  
  const [bookingData, setBookingData] = useState<{ date: Date; time: string; slotTime?: string } | null>(null);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  
  const [eventTypeId, setEventTypeId] = useState<string>(() => 
    localStorage.getItem('calcom_preferred_event_id') || CALCOM_CONFIG.DEFAULT_EVENT_TYPE_ID
  );

  const [scheduleId, setScheduleId] = useState<string>(() => 
    localStorage.getItem('calcom_preferred_schedule_id') || CALCOM_CONFIG.DEFAULT_SCHEDULE_ID
  );

  const dateRange = useMemo(() => {
    const start = addWeeks(startOfToday(), weeksOffset);
    const end = addDays(start, (weeks * 7) - 1);
    return eachDayOfInterval({ start, end }).map(d => format(d, 'yyyy-MM-dd'));
  }, [weeks, weeksOffset]);

  const stats = useMemo(() => {
    let totalSlots = 0;
    let totalBookings = 0;
    Object.values(slots).forEach(daySlots => totalSlots += daySlots.length);
    Object.values(bookings).forEach(dayBookings => totalBookings += dayBookings.length);
    return { totalSlots, totalBookings };
  }, [slots, bookings]);

  const availableDaysOfWeek = useMemo(() => {
    const days = new Set<string>();
    dateRange.forEach(date => {
      const isBlocked = blockedDates.includes(date);
      const daySlots = slots[date] || [];
      if (!isBlocked && daySlots.length > 0) {
        days.add(format(new Date(date), "EEEE"));
      }
    });
    return DAYS_OF_WEEK.filter(d => days.has(d));
  }, [dateRange, slots, blockedDates]);

  const fetchSlots = async () => {
    setLoading(true);
    setError(null);
    try {
      const start = addWeeks(startOfToday(), weeksOffset).toISOString();
      const end = endOfDay(addWeeks(new Date(start), weeks)).toISOString();
      
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
      setBookings(data.bookings || {});
      setBlockedDates(data.blockedDates || []);
      
      if (eventTypeId) localStorage.setItem('calcom_preferred_event_id', eventTypeId);
      if (scheduleId) localStorage.setItem('calcom_preferred_schedule_id', scheduleId);
      
    } catch (err: any) {
      console.error("Failed to fetch slots:", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOnboarding = async (booking: any) => {
    if (!booking.attendeeEmail) {
      showError("No email address found for this booking.");
      return;
    }

    setSendingEmail(booking.uid);
    try {
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('email', booking.attendeeEmail.toLowerCase().trim())
        .maybeSingle();

      if (clientError || !client) {
        throw new Error("Client not found in CRM. Please ensure the booking has synced first.");
      }

      const { error: emailError } = await supabase.functions.invoke('send-manual-onboarding', {
        body: { clientId: client.id }
      });

      if (emailError) throw emailError;

      showSuccess(`Onboarding email sent to ${booking.attendeeName}!`);
    } catch (err: any) {
      console.error(err);
      showError(err.message || "Failed to send onboarding email.");
    } finally {
      setSendingEmail(null);
    }
  };

  const handleCancelBooking = async (bookingUid: string, attendeeName: string) => {
    if (!confirm(`Are you sure you want to cancel the booking for ${attendeeName}?`)) return;

    setProcessingBooking(bookingUid);
    try {
      const { error: invokeError } = await supabase.functions.invoke('delete-external-appointment', {
        body: { calcomBookingId: bookingUid }
      });

      if (invokeError) throw invokeError;

      await supabase
        .from('appointments')
        .delete()
        .eq('calcom_booking_id', bookingUid);

      setBookings(prev => {
        const newBookings = { ...prev };
        Object.keys(newBookings).forEach(date => {
          newBookings[date] = newBookings[date].filter(b => b.uid !== bookingUid);
        });
        return newBookings;
      });

      showSuccess(`Booking for ${attendeeName} cancelled.`);
      setTimeout(fetchSlots, 2000);
    } catch (err) {
      showError("Failed to cancel booking.");
    } finally {
      setProcessingBooking(null);
    }
  };

  const handleToggleBlock = async (date: string, isCurrentlyBlocked: boolean) => {
    const action = isCurrentlyBlocked ? 'unblock-day' : 'block-day';
    if (!confirm(`${isCurrentlyBlocked ? 'Unblock' : 'Block'} ${format(new Date(date), "EEEE, MMMM do")}?`)) return;

    setProcessingDate(date);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('manage-calcom-availability', {
        body: { action, date, eventTypeId, scheduleId: scheduleId || undefined }
      });

      if (invokeError) throw invokeError;
      
      if (data.status === 'error') {
        showError(data.message);
        return;
      }

      if (isCurrentlyBlocked) {
        setBlockedDates(prev => prev.filter(d => d !== date));
      } else {
        setBlockedDates(prev => [...prev, date]);
      }

      showSuccess(isCurrentlyBlocked ? "Day unblocked." : "Day blocked.");
      setTimeout(fetchSlots, 2000);
    } catch (err: any) {
      showError("Failed to update availability.");
    } finally {
      setProcessingDate(null);
    }
  };

  const handleSlotClick = (dateStr: string, timeStr: string) => {
    const slotDate = new Date(timeStr);
    
    setBookingData({ 
      date: slotDate, 
      time: format(slotDate, "HH:mm"),
      slotTime: timeStr 
    });
    setBookingDialogOpen(true);
  };

  const handleCopyDay = (dayName: string) => {
    if (dateRange.length === 0) return;

    let text = `Hi! Here is my current availability for ${dayName}s:\n\n`;
    let hasAny = false;

    dateRange.forEach(date => {
      const dateObj = new Date(date);
      const currentDayName = format(dateObj, "EEEE");
      
      if (currentDayName !== dayName) return;

      const isBlocked = blockedDates.includes(date);
      const daySlots = slots[date] || [];
      
      if (!isBlocked && daySlots.length > 0) {
        hasAny = true;
        const formattedDate = format(dateObj, "MMMM do");
        
        const morning = daySlots.filter(s => new Date(s.time || s.start).getHours() < 12);
        const afternoon = daySlots.filter(s => new Date(s.time || s.start).getHours() >= 12);
        
        text += `${formattedDate}\n`;
        if (morning.length > 0) text += `  Morning: ${morning.map(s => format(new Date(s.time || s.start), "h:mm a")).join(", ")}\n`;
        if (afternoon.length > 0) text += `  Afternoon: ${afternoon.map(s => format(new Date(s.time || s.start), "h:mm a")).join(", ")}\n`;
        text += "\n";
      }
    });

    if (!hasAny) {
      showError(`No available slots found for ${dayName}s.`);
      return;
    }

    text += `You can book directly here: ${CALCOM_CONFIG.BOOKING_URL}`;

    navigator.clipboard.writeText(text);
    setCopied(dayName);
    showSuccess(`${dayName} availability copied!`);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCopyInstaNote = () => {
    const today = startOfToday();
    const startOfNextWeek = isMonday(today) ? addDays(today, 7) : nextMonday(today);
    const nextWeekDays = Array.from({ length: 5 }).map((_, i) => format(addDays(startOfNextWeek, i), 'yyyy-MM-dd'));
    
    const availableEntries: string[] = [];
    nextWeekDays.forEach(date => {
      const isBlocked = blockedDates.includes(date);
      const daySlots = slots[date] || [];
      if (!isBlocked && daySlots.length > 0) {
        const dayLabel = format(new Date(date), "E");
        const firstSlot = new Date(daySlots[0].time || daySlots[0].start);
        const hour = firstSlot.getHours();
        const ampm = hour >= 12 ? 'p' : 'a';
        const displayHour = hour % 12 || 12;
        
        availableEntries.push(`${dayLabel} ${displayHour}${ampm}`);
      }
    });

    if (availableEntries.length === 0) {
      showError("No availability found for next Mon-Fri.");
      return;
    }

    const suffix = " ✦ Link in bio";
    let note = `Next week: ${availableEntries.join(', ')}${suffix}`;
    
    // If over 60 chars, try removing entries one by one until it fits
    while (note.length > 60 && availableEntries.length > 1) {
      availableEntries.pop();
      note = `Next week: ${availableEntries.join(', ')}...${suffix}`;
    }

    // Final safety truncate
    const finalNote = note.length > 60 ? note.substring(0, 57) + "..." : note;

    navigator.clipboard.writeText(finalNote);
    setCopied('insta');
    showSuccess("Instagram Note copied!");
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCopyAll = () => {
    if (dateRange.length === 0) return;

    let text = "Hi! Here is my current availability for a session:\n\n";
    let hasAny = false;

    dateRange.forEach(date => {
      const isBlocked = blockedDates.includes(date);
      const daySlots = slots[date] || [];
      
      if (!isBlocked && daySlots.length > 0) {
        hasAny = true;
        const formattedDate = format(new Date(date), "EEEE, MMMM do");
        
        const morning = daySlots.filter(s => new Date(s.time || s.start).getHours() < 12);
        const afternoon = daySlots.filter(s => new Date(s.time || s.start).getHours() >= 12);
        
        text += `${formattedDate}\n`;
        if (morning.length > 0) text += `  Morning: ${morning.map(s => format(new Date(s.time || s.start), "h:mm a")).join(", ")}\n`;
        if (afternoon.length > 0) text += `  Afternoon: ${afternoon.map(s => format(new Date(s.time || s.start), "h:mm a")).join(", ")}\n`;
        text += "\n";
      }
    });

    if (!hasAny) {
      showError("No available slots to copy.");
      return;
    }

    text += `You can book directly here: ${CALCOM_CONFIG.BOOKING_URL}`;

    navigator.clipboard.writeText(text);
    setCopied('all');
    showSuccess("All availability copied!");
    setTimeout(() => setCopied(null), 2000);
  };

  const toggleDayExpansion = (date: string) => {
    setExpandedDays(prev => ({
      ...prev,
      [date]: !prev[date]
    }));
  };

  useEffect(() => {
    fetchSlots();
  }, [weeks, weeksOffset]);

  const groupedWeeks = useMemo(() => {
    const result = [];
    for (let i = 0; i < dateRange.length; i += 7) {
      result.push(dateRange.slice(i, i + 7));
    }
    return result;
  }, [dateRange]);

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Summary & Controls Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-[2.5rem] border border-border shadow-sm">
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Available Slots</p>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-black text-emerald-600">{stats.totalSlots}</span>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold">Open</Badge>
                </div>
              </div>
              <div className="w-px h-10 bg-border hidden md:block" />
              <div className="flex flex-col">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Upcoming Bookings</p>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-black text-indigo-600">{stats.totalBookings}</span>
                  <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-100 font-bold">Confirmed</Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex bg-muted p-1 rounded-xl">
                {[2, 4, 8].map(w => (
                  <Button 
                    key={w}
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setWeeks(w)}
                    className={cn(
                      "h-8 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest",
                      weeks === w ? "bg-card text-indigo-600 shadow-sm" : "text-muted-foreground"
                    )}
                  >
                    {w}W
                  </Button>
                ))}
              </div>

              <div className="flex bg-muted p-1 rounded-xl">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setWeeksOffset(prev => prev - 1)}
                  disabled={weeksOffset <= 0}
                  className="h-8 w-8 rounded-lg"
                >
                  <ArrowLeft size={16} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setWeeksOffset(prev => prev + 1)}
                  className="h-8 w-8 rounded-lg"
                >
                  <ArrowRight size={16} />
                </Button>
              </div>
              
              <Button 
                variant="outline"
                onClick={handleCopyAll}
                disabled={loading}
                className="rounded-xl h-10 px-4 border-indigo-100 text-indigo-600 hover:bg-indigo-100 rounded-xl font-black text-[10px] uppercase tracking-widest"
              >
                {copied === 'all' ? <Check size={14} className="mr-2" /> : <Copy size={14} className="mr-2" />}
                Copy All
              </Button>
              <Button 
                onClick={fetchSlots} 
                disabled={loading}
                className="rounded-xl h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw size={14} className="mr-2" />}
                Refresh
              </Button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-4">
            <div className="flex items-center gap-6">
              <button
                onClick={() => setShowOnlyAvailable(!showOnlyAvailable)}
                className="flex items-center gap-2 group"
              >
                <div className={cn(
                  "w-4 h-4 rounded border-2 flex items-center justify-center transition-all",
                  showOnlyAvailable ? "bg-indigo-600 border-indigo-600" : "border-slate-300 group-hover:border-indigo-400"
                )}>
                  {showOnlyAvailable && <Check size={10} className="text-white" />}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-900 transition-colors">
                  Show only available days
                </span>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Session Type:</span>
                <Select value={eventTypeId} onValueChange={(val) => {
                  setEventTypeId(val);
                  setTimeout(fetchSlots, 100);
                }}>
                  <SelectTrigger className="h-8 w-[180px] rounded-xl bg-card border-border font-bold text-[10px] uppercase tracking-widest">
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-2xl">
                    {CALCOM_CONFIG.EVENT_TYPES.map(type => (
                      <SelectItem key={type.id} value={type.id} className="rounded-lg text-[10px] font-bold uppercase tracking-widest">
                        {type.name} (${type.price})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Collapsible open={configOpen} onOpenChange={setConfigOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600">
                  <Settings2 size={14} className="mr-2" />
                  Advanced Settings
                  {configOpen ? <ChevronUp size={14} className="ml-1" /> : <ChevronDown size={14} className="ml-1" />}
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          </div>

          {/* Copy by Day Bar */}
          <div className="px-4 py-3 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 flex flex-wrap items-center gap-3 animate-in slide-in-from-top-2 duration-500">
            <div className="flex items-center gap-2 mr-2">
              <Sparkles size={14} className="text-indigo-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Quick Copy:</span>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyInstaNote}
              className={cn(
                "h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                copied === 'insta' ? "bg-rose-500 text-white hover:bg-rose-600" : "text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900/30"
              )}
            >
              {copied === 'insta' ? <Check size={12} className="mr-1.5" /> : <Instagram size={12} className="mr-1.5" />}
              Insta Note (Next Week)
            </Button>

            <div className="w-px h-4 bg-indigo-200 dark:bg-indigo-800 mx-1" />

            {availableDaysOfWeek.map(day => (
              <Button
                key={day}
                variant="ghost"
                size="sm"
                onClick={() => handleCopyDay(day)}
                className={cn(
                  "h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                  copied === day ? "bg-emerald-500 text-white hover:bg-emerald-600" : "text-slate-500 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-indigo-600"
                )}
              >
                {copied === day ? <Check size={12} className="mr-1.5" /> : <Copy size={12} className="mr-1.5" />}
                {day}s
              </Button>
            ))}
          </div>

          <Collapsible open={configOpen}>
            <CollapsibleContent className="animate-in slide-in-from-top-2 duration-300">
              <Card className="border-none shadow-sm bg-muted/30 rounded-[2rem] p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Event Type ID</label>
                    <Input 
                      placeholder="e.g. 4279898" 
                      value={eventTypeId}
                      onChange={(e) => setEventTypeId(e.target.value)}
                      className="h-10 rounded-xl bg-card border-border font-bold text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Schedule ID</label>
                    <Input 
                      placeholder="Optional override" 
                      value={scheduleId}
                      onChange={(e) => setScheduleId(e.target.value)}
                      className="h-10 rounded-xl bg-card border-border font-bold text-xs"
                    />
                  </div>
                </div>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <div className="lg:col-span-4">
          <Card className="border-none shadow-lg rounded-[2.5rem] bg-slate-900 text-white h-full overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-slate-950 to-purple-900/40" />
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-700">
              <ShieldAlert size={100} />
            </div>
            <CardContent className="p-8 flex flex-col justify-center h-full space-y-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-amber-400 border border-white/10">
                <Info size={24} />
              </div>
              <h4 className="text-xl font-black">Availability Logic</h4>
              <p className="text-sm text-slate-400 leading-relaxed font-medium">
                Blocking a day avoids "Out of Office" entry in Cal.com. This overrides your standard schedule and prevents any new bookings for that date.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-rose-50 border-rose-200 rounded-2xl">
          <AlertCircle className="h-5 w-5 text-rose-600" />
          <AlertDescription className="text-sm text-rose-900 font-bold">
            Error: {error}
          </AlertDescription>
        </Alert>
      )}

      {loading && Object.keys(slots).length === 0 ? (
        <div className="py-32 flex flex-col items-center justify-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-[2rem] bg-indigo-600/10 animate-pulse" />
            <Loader2 className="absolute inset-0 m-auto w-10 h-10 text-indigo-600 animate-spin" />
          </div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Syncing with Cal.com...</p>
        </div>
      ) : (
        <div className="space-y-16">
          {groupedWeeks.map((week, weekIdx) => (
            <div key={weekIdx} className="space-y-8">
              <div className="flex items-center gap-4 px-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm">
                  <CalendarDays size={20} />
                </div>
                <h3 className="text-xl font-serif font-bold uppercase tracking-widest text-slate-400">
                  Week of {format(new Date(week[0]), "MMM d")}
                </h3>
                <div className="flex-1 h-[2px] bg-slate-100 rounded-full" />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
                {week.map(date => {
                  const daySlots = slots[date] || [];
                  const dayBookings = bookings[date] || [];
                  const isBlocked = blockedDates.includes(date);
                  const hasNoActivity = daySlots.length === 0 && dayBookings.length === 0;
                  const isExpanded = expandedDays[date] || false;
                  
                  if (showOnlyAvailable && (isBlocked || daySlots.length === 0)) return null;
                  if (!isBlocked && hasNoActivity) return null;

                  const visibleSlots = isExpanded ? daySlots : daySlots.slice(0, 6);

                  return (
                    <Card key={date} className={cn(
                      "border-none shadow-xl rounded-[2.5rem] overflow-hidden group hover:shadow-2xl transition-all duration-500 flex flex-col",
                      isBlocked ? "bg-slate-50/80 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-800" : "bg-card"
                    )}>
                      <CardHeader className={cn(
                        "transition-colors p-6 pb-4",
                        isBlocked ? "bg-slate-100/50 dark:bg-slate-900/80" : "bg-card"
                      )}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-500",
                              isBlocked ? "bg-slate-400 scale-95" : "bg-indigo-600"
                            )}>
                              {isBlocked ? <Ban size={24} className="text-white" /> : <Calendar size={24} className="text-white" />}
                            </div>
                            <div>
                              <CardTitle className={cn(
                                "text-xl font-serif font-bold",
                                isBlocked ? "text-slate-500" : "text-foreground"
                              )}>
                                {format(new Date(date), "EEEE")}
                              </CardTitle>
                              <CardDescription className="font-black text-[9px] uppercase tracking-[0.2em] text-indigo-600 mt-0.5">
                                {format(new Date(date), "MMM d, yyyy")}
                              </CardDescription>
                            </div>
                          </div>
                          <Badge className={cn(
                            "border-none font-black text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-full shadow-sm",
                            isBlocked ? "bg-rose-100 text-rose-600" : "bg-emerald-50 text-emerald-600"
                          )}>
                            {isBlocked ? "Blocked" : `${daySlots.length} Slots`}
                          </Badge>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="p-6 pt-0 space-y-6 flex-1 flex flex-col">
                        <div className="h-px bg-slate-100 w-full" />
                        
                        {isBlocked ? (
                          <div className="flex-1 flex flex-col items-center justify-center py-8 text-center space-y-4 animate-in fade-in zoom-in-95 duration-500">
                            <div className="w-16 h-16 rounded-[1.5rem] bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center mx-auto border border-rose-100 dark:border-rose-900/30 shadow-inner">
                              <ShieldAlert size={28} className="text-rose-400" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-base font-serif font-bold text-slate-900 dark:text-white">Day Blocked</p>
                              <p className="text-[10px] font-medium text-slate-500">Manual override active</p>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-10 px-6 rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-black text-[9px] uppercase tracking-widest shadow-sm"
                              onClick={() => handleToggleBlock(date, true)}
                              disabled={processingDate === date}
                            >
                              {processingDate === date ? <Loader2 size={14} className="animate-spin mr-2" /> : <Unlock size={14} className="mr-2" />}
                              Unblock Day
                            </Button>
                          </div>
                        ) : (
                          <>
                            {dayBookings.length > 0 && (
                              <div className="space-y-3">
                                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Confirmed Sessions</p>
                                <div className="grid grid-cols-1 gap-2">
                                  {dayBookings.map((booking) => (
                                    <div 
                                      key={booking.id} 
                                      className="flex items-center justify-between p-3 rounded-2xl bg-indigo-900 text-white shadow-lg border border-indigo-800 group/booking"
                                    >
                                      <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
                                          <User size={14} className="text-indigo-300" />
                                        </div>
                                        <div className="min-w-0">
                                          <p className="text-xs font-black truncate">{booking.attendeeName}</p>
                                          <p className="text-[9px] font-bold text-indigo-300 uppercase tracking-widest mt-0.5">
                                            {format(new Date(booking.start), "h:mm a")}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="h-8 w-8 rounded-lg text-indigo-300 hover:text-emerald-400 hover:bg-emerald-500/20 opacity-0 group-hover/booking:opacity-100 transition-all"
                                          onClick={() => handleSendOnboarding(booking)}
                                          disabled={sendingEmail === booking.uid}
                                        >
                                          {sendingEmail === booking.uid ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                        </Button>
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="h-8 w-8 rounded-lg text-indigo-300 hover:text-rose-400 hover:bg-rose-500/20 opacity-0 group-hover/booking:opacity-100 transition-all"
                                          onClick={() => handleCancelBooking(booking.uid, booking.attendeeName)}
                                          disabled={processingBooking === booking.uid}
                                        >
                                          {processingBooking === booking.uid ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {daySlots.length > 0 && (
                              <div className="space-y-3 flex-1">
                                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Available Slots</p>
                                <div className="grid grid-cols-2 gap-2">
                                  {visibleSlots.map((slot, idx) => {
                                    const timeStr = slot.time || slot.start;
                                    return (
                                      <button 
                                        key={idx} 
                                        onClick={() => handleSlotClick(date, timeStr)}
                                        className="flex items-center justify-center p-2.5 rounded-xl bg-muted/50 border border-border text-[10px] font-black text-foreground hover:bg-indigo-600 hover:border-indigo-600 hover:text-white transition-all group/slot shadow-sm"
                                      >
                                        <Clock size={12} className="mr-1.5 opacity-40 group-hover/slot:opacity-100 transition-opacity" />
                                        {format(new Date(timeStr), "h:mm a")}
                                      </button>
                                    );
                                  })}
                                </div>
                                {daySlots.length > 6 && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => toggleDayExpansion(date)}
                                    className="w-full h-8 rounded-lg text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50"
                                  >
                                    {isExpanded ? (
                                      <><ChevronUp size={12} className="mr-1.5" /> Show Less</>
                                    ) : (
                                      <><ChevronDown size={12} className="mr-1.5" /> Show {daySlots.length - 6} More</>
                                    )}
                                  </Button>
                                )}
                              </div>
                            )}

                            <div className="pt-4 border-t border-slate-100 mt-auto">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="w-full h-10 px-4 text-[9px] font-black uppercase tracking-widest rounded-xl text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2"
                                onClick={() => handleToggleBlock(date, false)}
                                disabled={processingDate === date}
                              >
                                {processingDate === date ? <Loader2 size={14} className="animate-spin" /> : <Ban size={14} />}
                                Block Full Day
                              </Button>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && dateRange.every(date => !blockedDates.includes(date) && (slots[date] || []).length === 0 && (bookings[date] || []).length === 0) && (
        <div className="text-center py-32 bg-muted/30 rounded-[3rem] border-2 border-dashed border-border">
          <div className="mx-auto w-24 h-24 bg-card rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl">
            <CalendarDays className="text-muted-foreground" size={48} />
          </div>
          <p className="text-foreground font-black text-2xl">No availability found</p>
          <p className="text-muted-foreground mt-2 mb-10 font-medium max-w-xs mx-auto">Try increasing the lookahead range or check your Cal.com settings.</p>
          <Button variant="outline" className="h-14 px-10 border-border hover:bg-card rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg" onClick={fetchSlots}>
            Retry Sync
          </Button>
        </div>
      )}

      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto rounded-[3rem] p-0">
          <div className="p-10">
            <DialogHeader className="mb-8">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl">
                  <CalendarPlus size={28} />
                </div>
                <div>
                  <DialogTitle className="text-3xl font-serif font-bold tracking-tight">Book Client</DialogTitle>
                  <DialogDescription className="text-base font-medium">Schedule a session for the selected time slot.</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            {bookingData && (
              <AppointmentForm
                initialDate={bookingData.date}
                initialTime={bookingData.time}
                slotTime={bookingData.slotTime}
                eventTypeId={eventTypeId}
                onSuccess={() => {
                  setBookingDialogOpen(false);
                  fetchSlots();
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CalcomSlotsView;