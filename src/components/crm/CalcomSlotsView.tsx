
import { useState, useEffect, useMemo } from 'react';
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
  Instagram,
  CalendarClock,
  Mic
} from "lucide-react";
import { format, addWeeks, subWeeks, startOfToday, endOfDay, eachDayOfInterval, addDays, isBefore, startOfDay, nextMonday, isMonday, startOfWeek, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/utils/toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
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
import SimpleBookDialog from "./SimpleBookDialog";
import { CALCOM_CONFIG } from "../../config/integrations";

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Bookable services for the slot-click chooser. Voice routes to the voice dialog
// (different backend); FNH routes to the AppointmentForm flow below.
const SLOT_SERVICES = [
  { key: "voice60", group: "Voice", label: "Voice & Piano — 60 min", kind: "voice", duration: "60" },
  { key: "voice45", group: "Voice", label: "Voice & Piano — 45 min", kind: "voice", duration: "45" },
  { key: "fnhCurrent", group: "FNH", label: "Current rate", kind: "fnh", eventTypeId: undefined as string | undefined },
  { key: "fnhNew", group: "FNH", label: "New client · $70", kind: "fnh", eventTypeId: "4279898" },
  { key: "fnhFree", group: "FNH", label: "FNH Community · Free", kind: "fnh", eventTypeId: "5927215" },
] as const;

const isVoiceTitle = (title?: string | null) => /voice|piano/i.test(title || "");

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
  
  const [bookingData, setBookingData] = useState<{ date: Date; time: string; slotTime?: string; eventTypeId?: string } | null>(null);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);

  // Slot-click "what are you booking?" chooser + voice routing
  const [slotChooser, setSlotChooser] = useState<{ date: Date; timeStr: string } | null>(null);
  const [voiceBookOpen, setVoiceBookOpen] = useState(false);
  const [voicePrefill, setVoicePrefill] = useState<{ date: string; time: string; duration: string } | null>(null);

  const [rescheduleBooking, setRescheduleBooking] = useState<any | null>(null);
  const [rescheduling, setRescheduling] = useState(false);

  const [confirmAction, setConfirmAction] = useState<{callback: () => void; title: string; description: string} | null>(null);
  
  const [eventTypeId, setEventTypeId] = useState<string>(() => 
    localStorage.getItem('calcom_preferred_event_id') || CALCOM_CONFIG.DEFAULT_EVENT_TYPE_ID
  );

  const [scheduleId, setScheduleId] = useState<string>(() => 
    localStorage.getItem('calcom_preferred_schedule_id') || CALCOM_CONFIG.DEFAULT_SCHEDULE_ID
  );

  const dateRange = useMemo(() => {
    const baseDate = addWeeks(startOfToday(), weeksOffset);
    const start = startOfWeek(baseDate, { weekStartsOn: 1 });
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
      const baseDate = addWeeks(startOfToday(), weeksOffset);
      const start = startOfWeek(baseDate, { weekStartsOn: 1 }).toISOString();
      const end = endOfDay(addDays(new Date(start), (weeks * 7) - 1)).toISOString();
      
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
    setProcessingBooking(bookingUid);
    let calcomFailed = false;
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('delete-external-appointment', {
        body: { calcomBookingId: bookingUid }
      });

      if (invokeError) throw invokeError;
      if (data?.results?.calcom === "failed") {
        calcomFailed = true;
      }
    } catch (err) {
      calcomFailed = true;
    }

    // Always clean up locally regardless of Cal.com result
    try {
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

      if (calcomFailed) {
        showSuccess(`Booking for ${attendeeName} cancelled locally. Cal.com cleanup skipped (booking may not exist there).`);
      } else {
        showSuccess(`Booking for ${attendeeName} cancelled.`);
      }
      setTimeout(fetchSlots, 2000);
    } catch (err) {
      showError("Failed to cancel booking.");
    } finally {
      setProcessingBooking(null);
    }
  };

  const handleConfirmReschedule = async (newSlotTime: string) => {
    if (!rescheduleBooking) return;
    setRescheduling(true);
    try {
      // Look up the client by email to get their CRM id
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('email', rescheduleBooking.attendeeEmail?.toLowerCase().trim())
        .maybeSingle();

      if (clientError || !client) {
        throw new Error("Client not found in CRM. Please ensure they have been synced.");
      }

      const { data: fnData, error: fnError } = await supabase.functions.invoke('create-calcom-booking', {
        body: {
          bookingUid: rescheduleBooking.uid,
          clientId: client.id,
          startTime: newSlotTime,
          eventTypeId,
        }
      });

      if (fnError) throw fnError;

      // Cal.com reschedule creates a new uid — update both date and calcom_booking_id
      const newUid = fnData?.uid || rescheduleBooking.uid;
      await supabase
        .from('appointments')
        .update({
          date: new Date(newSlotTime).toISOString(),
          calcom_booking_id: newUid,
        })
        .eq('calcom_booking_id', rescheduleBooking.uid);

      showSuccess(`${rescheduleBooking.attendeeName} rescheduled to ${format(new Date(newSlotTime), "EEE MMM d 'at' h:mm a")}`);
      setRescheduleBooking(null);
      setTimeout(fetchSlots, 2000);
    } catch (err: any) {
      showError(err.message || "Failed to reschedule booking.");
    } finally {
      setRescheduling(false);
    }
  };

  const handleToggleBlock = async (date: string, isCurrentlyBlocked: boolean) => {
    const action = isCurrentlyBlocked ? 'unblock-day' : 'block-day';
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
    // Ask which appointment type before booking (voice vs FNH route differently).
    setSlotChooser({ date: new Date(timeStr), timeStr });
  };

  const handleChooseService = (svc: typeof SLOT_SERVICES[number]) => {
    if (!slotChooser) return;
    const { date, timeStr } = slotChooser;
    setSlotChooser(null);
    if (svc.kind === "voice") {
      setVoicePrefill({ date: format(date, "yyyy-MM-dd"), time: format(date, "HH:mm"), duration: (svc as any).duration });
      setVoiceBookOpen(true);
    } else {
      setBookingData({ date, time: format(date, "HH:mm"), slotTime: timeStr, eventTypeId: (svc as any).eventTypeId });
      setBookingDialogOpen(true);
    }
  };

  const handleCopyWeek = (week: string[]) => {
    let text = "Hi! Here is my availability for the week:\n\n";
    let hasAny = false;

    week.forEach(date => {
      const isBlocked = blockedDates.includes(date);
      const daySlots = slots[date] || [];
      if (isBlocked || daySlots.length === 0) return;
      if (isBefore(startOfDay(new Date(date)), startOfToday())) return;

      hasAny = true;
      const formattedDate = format(new Date(date), "EEEE, MMMM d");
      const times = daySlots.map(s => format(new Date(s.time || s.start), "h:mm a")).join(", ");
      text += `${formattedDate}: ${times}\n`;
    });

    if (!hasAny) {
      showError("No available slots found for this week.");
      return;
    }

    text += `\nYou can book directly here: ${CALCOM_CONFIG.BOOKING_URL}`;
    navigator.clipboard.writeText(text);
    const weekKey = week[0];
    setCopied(`week-${weekKey}`);
    showSuccess("Week availability copied!");
    setTimeout(() => setCopied(null), 2000);
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
        const times = daySlots.map(s => format(new Date(s.time || s.start), "h:mm a")).join(", ");
        text += `${formattedDate}: ${times}\n`;
      }
    });

    if (!hasAny) {
      showError(`No available slots found for ${dayName}s.`);
      return;
    }

    text += `\nYou can book directly here: ${CALCOM_CONFIG.BOOKING_URL}`;

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

    const prefix = "Next week (Kin/FNH apt) ";
    const suffix = " ✦ Link in bio";
    let note = `${prefix}${availableEntries.join(', ')}${suffix}`;
    
    while (note.length > 60 && availableEntries.length > 1) {
      availableEntries.pop();
      note = `${prefix}${availableEntries.join(', ')}...${suffix}`;
    }

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
        const times = daySlots.map(s => format(new Date(s.time || s.start), "h:mm a")).join(", ");
        text += `${formattedDate}: ${times}\n`;
      }
    });

    if (!hasAny) {
      showError("No available slots to copy.");
      return;
    }

    text += `\nYou can book directly here: ${CALCOM_CONFIG.BOOKING_URL}`;

    navigator.clipboard.writeText(text);
    setCopied('all');
    showSuccess("All availability copied!");
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCopyBookings = () => {
    const allBookings: any[] = [];
    Object.keys(bookings).forEach(date => {
      const dayBookings = bookings[date] || [];
      dayBookings.forEach(b => {
        allBookings.push({
          date,
          ...b
        });
      });
    });

    if (allBookings.length === 0) {
      showError("No booked appointments found to copy.");
      return;
    }

    // Sort bookings chronologically
    allBookings.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    let text = "📋 Booked Appointments Schedule:\n\n";
    allBookings.forEach((b, idx) => {
      const dateObj = new Date(b.start);
      const formattedDate = format(dateObj, "EEEE, MMMM do, yyyy");
      const formattedTime = format(dateObj, "h:mm a");
      text += `${idx + 1}. ${b.attendeeName} (${b.attendeeEmail || 'No Email'})\n`;
      text += `   Date: ${formattedDate}\n`;
      text += `   Time: ${formattedTime}\n`;
      if (b.title) text += `   Type: ${b.title}\n`;
      text += `\n`;
    });

    navigator.clipboard.writeText(text.trim());
    setCopied('bookings');
    showSuccess("Booked appointments copied to clipboard!");
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
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Availability Logic Alert */}
      <div className="p-6 bg-foreground text-primary-foreground rounded-[2.5rem] shadow-xl relative overflow-hidden group border border-foreground/20">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-slate-950 to-purple-900/40" />
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
          <ShieldAlert size={120} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="w-14 h-14 rounded-2xl bg-card/10 flex items-center justify-center text-amber-400 border border-primary-foreground/10 shrink-0">
            <Info size={28} />
          </div>
          <div className="space-y-1">
            <h4 className="text-xl font-black">Availability Logic</h4>
            <p className="text-sm text-muted-foreground/60 leading-relaxed font-medium max-w-3xl">
              Blocking a day creates an "Out of Office" entry in Cal.com. This overrides your standard schedule and prevents any new bookings for that date.
            </p>
          </div>
        </div>
      </div>

      {/* Summary & Controls Bar */}
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-card p-6 rounded-[2.5rem] border border-border shadow-sm">
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
                    weeks === w ? "bg-card text-amber-600 shadow-sm ring-1 ring-amber-200/60" : "text-muted-foreground"
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
              onClick={handleCopyBookings}
              disabled={loading}
              className="rounded-xl h-10 px-4 border-amber-200/60 text-amber-700 hover:bg-amber-100/70 rounded-xl font-black text-[10px] uppercase tracking-widest"
            >
              {copied === 'bookings' ? <Check size={14} className="mr-2" /> : <Copy size={14} className="mr-2" />}
              Copy Bookings
            </Button>
            <Button 
              variant="outline"
              onClick={handleCopyAll}
              disabled={loading}
              className="rounded-xl h-10 px-4 border-amber-200/60 text-amber-700 hover:bg-amber-100/70 rounded-xl font-black text-[10px] uppercase tracking-widest"
            >
              {copied === 'all' ? <Check size={14} className="mr-2" /> : <Copy size={14} className="mr-2" />}
              Copy All
            </Button>
            <Button 
              onClick={fetchSlots} 
              disabled={loading}
              className="rounded-xl h-10 px-6 bg-gradient-to-br from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-primary-foreground font-black text-[10px] uppercase tracking-widest shadow-lg shadow-amber-200/50"
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
                showOnlyAvailable ? "bg-indigo-600 border-indigo-600" : "border-border group-hover:border-indigo-400"
              )}>
                {showOnlyAvailable && <Check size={10} className="text-primary-foreground" />}
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">
                Show only available days
              </span>
            </button>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Session Type:</span>
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
              <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-indigo-600">
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
            <Sparkles size={14} className="text-amber-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">Quick Copy:</span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyInstaNote}
            className={cn(
              "h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
              copied === 'insta' ? "bg-rose-50 text-primary-foreground hover:bg-rose-600" : "text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900/30"
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
                copied === day ? "bg-emerald-500 text-primary-foreground hover:bg-emerald-600" : "text-muted-foreground hover:bg-amber-100/70 dark:hover:bg-amber-950/30 hover:text-amber-700"
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
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Event Type ID</label>
                  <Input 
                    placeholder="e.g. 4279898" 
                    value={eventTypeId}
                    onChange={(e) => setEventTypeId(e.target.value)}
                    className="h-10 rounded-xl bg-card border-border font-bold text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Schedule ID</label>
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
          <p className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">Syncing with Cal.com...</p>
        </div>
      ) : (
        <div className="space-y-16">
          {groupedWeeks.map((week, weekIdx) => (
            <div key={weekIdx} className="space-y-8">
              <div className="flex items-center gap-4 px-4">
                <div className="w-10 h-10 rounded-xl bg-amber-100/70 dark:bg-amber-950/30 flex items-center justify-center text-amber-600 shadow-sm">
                  <CalendarDays size={20} />
                </div>
                <h3 className="text-xl font-serif font-bold uppercase tracking-widest text-muted-foreground">
                  Week of {format(new Date(week[0]), "MMM d")}
                </h3>
                <div className="flex-1 h-[2px] bg-muted rounded-full" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyWeek(week)}
                  className={cn(
                    "h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest shrink-0 transition-all",
                    copied === `week-${week[0]}`
                      ? "bg-emerald-500 text-primary-foreground hover:bg-emerald-600"
                      : "text-muted-foreground hover:bg-indigo-50 hover:text-indigo-600"
                  )}
                >
                  {copied === `week-${week[0]}`
                    ? <><Check size={12} className="mr-1.5" />Copied!</>
                    : <><Copy size={12} className="mr-1.5" />Copy Week</>
                  }
                </Button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {week.map(date => {
                  const daySlots = slots[date] || [];
                  const dayBookings = bookings[date] || [];
                  const isBlocked = blockedDates.includes(date);
                  const hasNoActivity = daySlots.length === 0 && dayBookings.length === 0;
                  const isExpanded = expandedDays[date] || false;
                  
                  const isPast = isBefore(startOfDay(new Date(date)), startOfToday());
                  if (isPast) return null;
                  
                  if (showOnlyAvailable && (isBlocked || daySlots.length === 0)) return null;
                  if (!isBlocked && hasNoActivity) return null;

                  const visibleSlots = isExpanded ? daySlots : daySlots.slice(0, 6);

                  return (
                    <Card key={date} className={cn(
                      "border-none shadow-xl rounded-[2.5rem] overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col",
                      isBlocked ? "bg-muted/50/80 dark:bg-foreground/50 border-2 border-dashed border-border dark:border-foreground/20" : "bg-card"
                    )}>
                      <CardHeader className={cn(
                        "transition-colors p-6 pb-4",
                        isBlocked ? "bg-muted/50 dark:bg-foreground/80" : "bg-card"
                      )}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-500",
                              isBlocked ? "bg-slate-400 scale-95" : "bg-gradient-to-br from-amber-500 to-rose-500"
                            )}>
                              {isBlocked ? <Ban size={24} className="text-primary-foreground" /> : <Calendar size={24} className="text-primary-foreground" />}
                            </div>
                            <div>
                              <CardTitle className={cn(
                                "text-xl font-serif font-bold",
                                isBlocked ? "text-muted-foreground" : "text-foreground"
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
                        <div className="h-px bg-muted w-full" />
                        
                        {isBlocked ? (
                          <div className="flex-1 flex flex-col items-center justify-center py-8 text-center space-y-4 animate-in fade-in zoom-in-95 duration-500">
                            <div className="w-16 h-16 rounded-[1.5rem] bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center mx-auto border border-rose-100 dark:border-rose-900/30 shadow-inner">
                              <ShieldAlert size={28} className="text-rose-400" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-base font-serif font-bold text-foreground dark:text-primary-foreground">Day Blocked</p>
                              <p className="text-[10px] font-medium text-muted-foreground">Manual override active</p>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-10 px-6 rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-black text-[9px] uppercase tracking-widest shadow-sm"
                              onClick={() => setConfirmAction({
                                callback: () => handleToggleBlock(date, true),
                                title: "Unblock day?",
                                description: `${format(new Date(date), "EEEE, MMMM do")} will be unblocked for new bookings.`
                              })}
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
                                      className="flex items-center justify-between p-3 rounded-2xl bg-indigo-900 text-primary-foreground shadow-lg border border-indigo-800 group/booking"
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                        <div className="w-8 h-8 rounded-lg bg-card/10 flex items-center justify-center shrink-0 border border-primary-foreground/10">
                                          <User size={14} className="text-indigo-300" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <p className="text-sm font-black truncate leading-tight">{booking.attendeeName}</p>
                                          <div className="flex items-center gap-1.5 mt-1">
                                            <span className={cn(
                                              "text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full shrink-0",
                                              isVoiceTitle(booking.title) ? "bg-rose-500/30 text-rose-200" : "bg-emerald-500/30 text-emerald-200"
                                            )}>
                                              {isVoiceTitle(booking.title) ? "Voice" : "FNH"}
                                            </span>
                                            <p className="text-[9px] font-bold text-indigo-300 uppercase tracking-widest truncate">
                                              {format(new Date(booking.start), "h:mm a")}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="hidden group-hover/booking:flex items-center gap-1 shrink-0 pl-1">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 rounded-lg text-indigo-300 hover:text-amber-400 hover:bg-amber-500/20 opacity-0 group-hover/booking:opacity-100 transition-all"
                                          title="Reschedule"
                                          onClick={() => setRescheduleBooking(booking)}
                                        >
                                          <CalendarClock size={14} />
                                        </Button>
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
                                          onClick={() => setConfirmAction({
                                            callback: () => handleCancelBooking(booking.uid, booking.attendeeName),
                                            title: "Cancel booking?",
                                            description: `Are you sure you want to cancel the booking for ${booking.attendeeName}?`
                                          })}
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
                                        className="flex items-center justify-center p-2.5 rounded-xl bg-muted/50 border border-border text-[10px] font-black text-foreground hover:bg-gradient-to-br hover:from-amber-500 hover:to-rose-500 hover:border-amber-500 hover:text-primary-foreground transition-all group/slot shadow-sm"
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

                            <div className="pt-4 border-t border-border/50 mt-auto">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="w-full h-10 px-4 text-[9px] font-black uppercase tracking-widest rounded-xl text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2"
                                onClick={() => setConfirmAction({
                                  callback: () => handleToggleBlock(date, false),
                                  title: "Block day?",
                                  description: `${format(new Date(date), "EEEE, MMMM do")} will be blocked for new bookings.`
                                })}
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

      {/* Reschedule Dialog */}
      <Dialog open={!!rescheduleBooking} onOpenChange={(open) => { if (!open) setRescheduleBooking(null); }}>
        <DialogContent className="sm:max-w-[640px] max-h-[85vh] overflow-y-auto rounded-[3rem] p-0">
          <div className="p-10">
            <DialogHeader className="mb-8">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-14 h-14 rounded-2xl bg-amber-500 text-primary-foreground flex items-center justify-center shadow-xl">
                  <CalendarClock size={28} />
                </div>
                <div>
                  <DialogTitle className="text-3xl font-serif font-bold tracking-tight">Reschedule</DialogTitle>
                  <DialogDescription className="text-base font-medium">
                    Moving <span className="font-bold text-foreground">{rescheduleBooking?.attendeeName}</span> from{" "}
                    {rescheduleBooking && format(new Date(rescheduleBooking.start), "EEE MMM d 'at' h:mm a")}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {(() => {
              const availableSlotsByDate = dateRange
                .filter(date => {
                  const daySlots = slots[date] || [];
                  return !blockedDates.includes(date) && daySlots.length > 0;
                })
                .map(date => ({ date, daySlots: slots[date] || [] }));

              if (availableSlotsByDate.length === 0) {
                return (
                  <div className="text-center py-12 text-muted-foreground">
                    <CalendarDays size={40} className="mx-auto mb-4 text-muted-foreground/60" />
                    <p className="font-bold">No available slots found in the current range.</p>
                    <p className="text-sm mt-1">Try increasing the week range and refresh.</p>
                  </div>
                );
              }

              return (
                <div className="space-y-6">
                  {availableSlotsByDate.map(({ date, daySlots }) => (
                    <div key={date} className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">
                        {format(new Date(date), "EEEE, MMMM d")}
                      </p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {daySlots.map((slot, idx) => {
                          const timeStr = slot.time || slot.start;
                          const isCurrentTime = rescheduleBooking &&
                            new Date(timeStr).toISOString() === new Date(rescheduleBooking.start).toISOString();
                          return (
                            <button
                              key={idx}
                              disabled={rescheduling || isCurrentTime}
                              onClick={() => handleConfirmReschedule(timeStr)}
                              className={cn(
                                "flex items-center justify-center gap-1.5 p-2.5 rounded-xl text-[10px] font-black border transition-all",
                                isCurrentTime
                                  ? "bg-muted border-border text-muted-foreground cursor-not-allowed line-through"
                                  : rescheduling
                                    ? "opacity-50 cursor-wait bg-muted border-border text-foreground"
                                    : "bg-muted/50 border-border text-foreground hover:bg-amber-500 hover:border-amber-500 hover:text-primary-foreground shadow-sm"
                              )}
                            >
                              {rescheduling ? <Loader2 size={11} className="animate-spin" /> : <Clock size={11} className="opacity-60" />}
                              {format(new Date(timeStr), "h:mm a")}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto rounded-[3rem] p-0">
          <div className="p-10">
            <DialogHeader className="mb-8">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-500 text-primary-foreground flex items-center justify-center shadow-xl">
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
                eventTypeId={bookingData.eventTypeId || eventTypeId}
                onSuccess={() => {
                  setBookingDialogOpen(false);
                  fetchSlots();
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Slot-click: choose appointment type (voice vs FNH route differently) */}
      <Dialog open={!!slotChooser} onOpenChange={(open) => { if (!open) setSlotChooser(null); }}>
        <DialogContent className="sm:max-w-[440px] rounded-[2rem] p-0">
          <div className="p-8">
            <DialogHeader className="mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-500 text-primary-foreground flex items-center justify-center shadow-lg">
                  <CalendarPlus size={22} />
                </div>
                <div>
                  <DialogTitle className="text-xl font-serif font-bold">Choose appointment</DialogTitle>
                  <DialogDescription className="text-xs font-medium">
                    {slotChooser && format(slotChooser.date, "EEE, MMM d 'at' h:mm a")}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="space-y-2">
              {SLOT_SERVICES.map((s, i) => {
                const prev = SLOT_SERVICES[i - 1];
                const voice = s.kind === "voice";
                return (
                  <div key={s.key}>
                    {(!prev || prev.group !== s.group) && (
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-3 mb-1.5 ml-1">{s.group}</p>
                    )}
                    <button
                      onClick={() => handleChooseService(s)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-2xl border-2 border-border transition-all text-left",
                        voice ? "hover:border-chart-destructive/40" : "hover:border-chart-primary/40"
                      )}
                    >
                      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", voice ? "bg-chart-destructive/10 text-chart-destructive" : "bg-chart-primary/10 text-chart-primary")}>
                        {voice ? <Mic size={16} /> : <User size={16} />}
                      </div>
                      <span className="text-sm font-bold">{s.label}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Voice booking (routed from the chooser) */}
      <SimpleBookDialog
        open={voiceBookOpen}
        onOpenChange={(o) => { setVoiceBookOpen(o); if (!o) setVoicePrefill(null); }}
        prefillDate={voicePrefill?.date}
        prefillTime={voicePrefill?.time}
        prefillDuration={voicePrefill?.duration}
      />
      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={(open) => { if (!open) setConfirmAction(null); }}
        title={confirmAction?.title || ""}
        description={confirmAction?.description}
        onConfirm={() => {
          confirmAction?.callback();
          setConfirmAction(null);
        }}
      />
    </div>
  );
};

export default CalcomSlotsView;