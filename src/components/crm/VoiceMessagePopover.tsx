import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, addDays, parseISO } from "date-fns";
import {
  MessageCircle, Mail, Calendar, CalendarCheck2, Smile,
  Loader2, ChevronRight, ExternalLink, Phone, CreditCard
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { formatDateLine } from "@/utils/availability";

interface VoiceStudent {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
}

const SMS_TEMPLATES = [
  {
    id: "appointment_reminder",
    label: "Appointment Reminder",
    icon: Calendar,
    color: "text-indigo-600",
    bg: "hover:bg-indigo-50 dark:hover:bg-indigo-950/20",
    buildBody: (firstName: string) =>
      `Hi ${firstName}, just a reminder that your next lesson is coming up. See you then! 😊`,
    preview: "Remind of upcoming lesson",
    needsDate: true,
  },
  {
    id: "check_in",
    label: "Session Check-in",
    icon: Smile,
    color: "text-emerald-600",
    bg: "hover:bg-emerald-50 dark:hover:bg-emerald-950/20",
    buildBody: (firstName: string) =>
      `Hi ${firstName}, just checking in to see how you're going since our last session. Hope you're feeling well! 😊`,
    preview: "Check in since last lesson",
    needsDate: false,
  },
  {
    id: "booking_nudge",
    label: "Booking Nudge",
    icon: CalendarCheck2,
    color: "text-amber-600",
    bg: "hover:bg-amber-50 dark:hover:bg-amber-950/20",
    buildBody: (firstName: string) =>
      `Hi ${firstName}, I have some availability coming up — would you like to book in for a session soon? 😊`,
    preview: "Nudge to book a session",
    needsDate: false,
  },
  {
    id: "availability",
    label: "Share Availability",
    icon: ExternalLink,
    color: "text-violet-600",
    bg: "hover:bg-violet-50 dark:hover:bg-violet-950/20",
    buildBody: (firstName: string) =>
      `Hi ${firstName}, here's my booking link so you can find a time that works for you: https://cal.com/danielebuatti/voice-and-piano-coaching-60 😊`,
    preview: "Share Cal.com booking link",
    needsDate: false,
  },
  {
    id: "payment_request",
    label: "Payment Request",
    icon: CreditCard,
    color: "text-emerald-600",
    bg: "hover:bg-emerald-50 dark:hover:bg-emerald-950/20",
    buildBody: (firstName: string) =>
      `Hi ${firstName}, a payment link for your recent voice lesson is ready. You can pay securely here: ${window.location.origin}/voice/calendar`,
    preview: "Request payment via Stripe",
    needsDate: false,
  },
];

const STORAGE_KEY_PREFIX = "voice_last_contacted_";

interface VoiceMessagePopoverProps {
  student: VoiceStudent;
  hasUpcoming?: boolean;
  onContactLogged?: (studentId: string) => void;
}

const VoiceMessagePopover = ({ student, hasUpcoming, onContactLogged }: VoiceMessagePopoverProps) => {
  const [open, setOpen] = useState(false);
  const [lastContacted, setLastContacted] = useState<string | null>(null);
  const [lastChannel, setLastChannel] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${student.id}`);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setLastContacted(data.at || null);
        setLastChannel(data.channel || null);
      } catch {}
    }
  }, [student.id]);

  const firstName = (student.name || "Student").split(" ")[0];

  const { data: msgSlots, isLoading: slotsLoading } = useQuery({
    queryKey: ["voice-msg-slots", student.id],
    queryFn: async () => {
      const res = await supabase.functions.invoke("get-calcom-slots", {
        body: {
          start: new Date().toISOString(),
          end: addDays(new Date(), 60).toISOString(),
          eventTypeId: "1945081",
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      });
      if (res.error) throw res.error;
      return res.data;
    },
    enabled: open && !!student,
    staleTime: 30_000,
  });

  const slotsByDate: Record<string, any[]> = msgSlots?.data || {};

  const formatSmsSlots = (): string | null => {
    const dates = Object.keys(slotsByDate).sort().slice(0, 2);
    if (dates.length === 0) return null;
    return dates.map((dateKey) => {
      const times = slotsByDate[dateKey].slice(0, 3).map((s: any) => s.time);
      const ranges = formatSlotRanges(times);
      return `${format(parseISO(dateKey + "T12:00:00"), "EEE")}: ${ranges}`;
    }).join(" • ");
  };

  const formatEmailSlots = (): string | null => {
    const dates = Object.keys(slotsByDate).sort().slice(0, 5);
    if (dates.length === 0) return null;
    return dates.map((dateKey) => {
      const times = slotsByDate[dateKey]
        .map((s: any) => format(parseISO(s.time), "h:mm a"))
        .join(", ");
      return `${format(parseISO(dateKey + "T12:00:00"), "EEEE, MMMM d")}: ${times}`;
    }).join("\n");
  };

  const lastContactedDate = lastContacted ? new Date(lastContacted) : null;
  const daysSinceContact = lastContactedDate
    ? Math.floor((Date.now() - lastContactedDate.getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const recentlyContacted = daysSinceContact !== null && daysSinceContact <= 7;

  const logContact = (channel: "sms" | "email", templateId?: string) => {
    const data = { at: new Date().toISOString(), channel, template: templateId || null };
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${student.id}`, JSON.stringify(data));
    setLastContacted(data.at);
    setLastChannel(channel);
    onContactLogged?.(student.id);
  };

  const handleSms = (body: string, templateId: string) => {
    if (!student.phone) return;
    window.location.href = `sms:${student.phone}?body=${encodeURIComponent(body)}`;
    logContact("sms", templateId);
    setOpen(false);
  };

  const handleEmail = (subject: string, body: string) => {
    if (!student.email) return;
    const gmailUrl = `https://mail.google.com/mail/u/0/?view=cm&fs=1&to=${encodeURIComponent(student.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, "_blank");
    logContact("email");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "p-2 rounded-lg transition-all",
            recentlyContacted
              ? "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
              : "text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
          )}
          title="Contact student"
        >
          <MessageCircle size={15} />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-[340px] p-0 rounded-2xl shadow-2xl border border-border bg-card overflow-hidden"
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-3 bg-muted/30 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center shrink-0">
              <MessageCircle size={16} className="text-rose-600" />
            </div>
            <div>
              <p className="text-sm font-black text-foreground">Contact {firstName}</p>
              <p className="text-[10px] text-muted-foreground font-medium">
                {student.email || student.phone || "No contact info"}
              </p>
            </div>
          </div>
          {lastContactedDate && (
            <div className={cn(
              "mt-2.5 flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold",
              recentlyContacted
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                : "bg-muted text-muted-foreground"
            )}>
              <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", recentlyContacted ? "bg-emerald-500" : "bg-muted-foreground/50")} />
              Last contacted:{" "}
              {daysSinceContact === 0 ? "today" : daysSinceContact === 1 ? "yesterday" : `${daysSinceContact} days ago`}
              {lastChannel && ` via ${lastChannel}`}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-2">
          {/* SMS Templates */}
          {student.phone && (
            <>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground px-3 pt-1.5 pb-1">
                SMS Templates
              </p>
              {SMS_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    let body: string;
                    if (t.id === "availability") {
                      const slots = formatSmsSlots();
                      body = slots
                        ? `Hi ${firstName}, here's my availability: ${slots}. Want to book? 😊`
                        : t.buildBody(firstName);
                    } else {
                      body = t.buildBody(firstName);
                    }
                    handleSms(body, t.id);
                  }}
                  className="w-full flex items-start gap-3 p-3 rounded-xl transition-all text-left hover:bg-muted"
                >
                  <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                    <t.icon size={13} className={t.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-black text-foreground">{t.label}</p>
                      <ChevronRight size={12} className="text-muted-foreground shrink-0" />
                    </div>
                    <p className="text-[10px] font-medium mt-0.5 leading-relaxed text-muted-foreground">
                      {t.preview}
                    </p>
                  </div>
                </button>
              ))}
            </>
          )}

          {/* Email option */}
          {student.email && (
            <>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground px-3 pt-3 pb-1">
                Email
              </p>
              <button
                onClick={() => handleEmail(
                  "Voice Lesson Inquiry",
                  `Hi ${firstName},\n\nI'm reaching out regarding your voice coaching.\n\nBest,\nDaniele Buatti`
                )}
                className="w-full flex items-start gap-3 p-3 rounded-xl transition-all text-left hover:bg-muted"
              >
                <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                  <Mail size={13} className="text-rose-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-black text-foreground">Compose Email</p>
                    <ChevronRight size={12} className="text-muted-foreground shrink-0" />
                  </div>
                  <p className="text-[10px] font-medium mt-0.5 leading-relaxed text-muted-foreground">
                    Open your email client to write to {student.email}
                  </p>
                </div>
              </button>

              <button
                onClick={async () => {
                  const res = await supabase.functions.invoke("get-calcom-slots", {
                    body: {
                      start: new Date().toISOString(),
                      end: addDays(new Date(), 60).toISOString(),
                      eventTypeId: "1945081",
                      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    },
                  });
                  const freshSlotsByDate: Record<string, any[]> = res.data?.data || {};
                  const dateKeys = Object.keys(freshSlotsByDate).sort().slice(0, 5);
                  const slotLines = dateKeys.length > 0
                    ? dateKeys.map((k) => {
                        const times = freshSlotsByDate[k].map((s: any) => format(parseISO(s.time), "h:mm a")).join(", ");
                        return `${format(parseISO(k + "T12:00:00"), "EEEE, MMMM d")}: ${times}`;
                      }).join("\n")
                    : null;
                  const body = slotLines
                    ? `Hi ${firstName},\n\nI've got some time coming up. Here's my availability:\n\n${slotLines}\n\nWould you like me to book you in for a session?\n\nBest,\nDaniele Buatti`
                    : `Hi ${firstName},\n\nI've got some time coming up. Here's my availability:\n\nhttps://cal.com/danielebuatti/voice-and-piano-coaching-60\nhttps://cal.com/danielebuatti/voice-and-piano-coaching-45\n\nWould you like me to book you in for a session?\n\nBest,\nDaniele Buatti`;
                  handleEmail("Availability — Voice Coaching", body);
                }}
                className="w-full flex items-start gap-3 p-3 rounded-xl transition-all text-left hover:bg-muted"
              >
                <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                  <CalendarCheck2 size={13} className="text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-black text-foreground">Share Availability</p>
                    <ChevronRight size={12} className="text-muted-foreground shrink-0" />
                  </div>
                  <p className="text-[10px] font-medium mt-0.5 leading-relaxed text-muted-foreground">
                    "I've got time coming up — here's my availability"
                  </p>
                </div>
              </button>
            </>
          )}

          {/* Direct SMS fallback */}
          {student.phone && (
            <div className="px-3 pt-1 pb-2">
              <a
                href={`sms:${student.phone}`}
                onClick={() => logContact("sms")}
                className="flex items-center justify-center gap-2 w-full h-9 rounded-xl bg-muted text-muted-foreground hover:bg-muted/80 transition-colors text-[10px] font-black uppercase tracking-widest"
              >
                <Phone size={12} />
                Open Messages (blank)
              </a>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default VoiceMessagePopover;
