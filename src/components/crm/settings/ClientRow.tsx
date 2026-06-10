
import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format, formatDistanceToNow, differenceInMonths, addWeeks, startOfWeek, addDays, endOfDay, parseISO, getISOWeek } from "date-fns";
import {
 Mail, Phone, CalendarPlus, Clock, CreditCard, ArrowRight,
 Check, X, Trash2, Loader2, Send, RefreshCw, AlertTriangle, Flame,
 MoreHorizontal, CalendarPlus as CalendarPlusIcon, Edit2, Users,
 MessageSquare, CheckCircle2, Copy, Sparkles, ArrowUpRight, PhoneCall,
 MessageCircle, Calendar, Smile, ChevronRight as ChevronRightIcon, CalendarCheck2,
 ExternalLink
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogHeader,
 DialogTitle,
 DialogFooter,
} from "@/components/ui/dialog";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuTrigger,
 DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
 Popover,
 PopoverContent,
 PopoverTrigger,
} from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";
import { Client, Appointment } from "@/types/crm";
import { parseClientJournal, stringifyClientJournal } from "@/utils/journal-helper";
import { formatDateLine } from "@/utils/availability";

interface ClientWithAppointments extends Client {
 appointments: Appointment[];
 lastSeenDate: Date | null;
 preferredTimeAnalyzed: { text: string; isLowData: boolean };
 followUpStatus: "Booked" | "Needs Follow-up" | "No Future Bookings";
}

interface ClientRowProps {
 client: ClientWithAppointments;
 calculateAge: (born: string | Date | null) => string | number;
 handleRateChange: (clientId: string, rateValue: number) => void;
 handleOpenOverrideModal: (client: ClientWithAppointments) => void;
 selectedWeeklyClients: string[];
 onToggleWeeklyClient: (clientId: string) => void;
 onSetTargetRate: (clientId: string, rate: number) => void;
 onSetRateUpdatedDate: (clientId: string, dateStr: string) => void;
 onSetReengagementTag: (clientId: string, tag: 'warm' | 'cold' | 'lost' | null) => void;
 isLapsedSection: boolean;
 onQuickBook: (clientId: string) => void;
 onRefresh: () => void;
 averageSessionRate?: number;
}

const RATE_OPTIONS = [
 { label: "Free", value: 0 },
 { label: "$30", value: 30 },
 { label: "$50", value: 50 },
 { label: "$70", value: 70 },
 { label: "$80", value: 80 },
 { label: "$90", value: 90 },
 { label: "$100", value: 100 },
 { label: "$120", value: 120 },
 { label: "$150", value: 150 },
 { label: "Custom", value: -1 }
];

// ── SMS Template Button ──────────────────────────────────────────────────────

interface SmsTemplateButtonProps {
 client: ClientWithAppointments;
 journalData: ReturnType<typeof parseClientJournal>;
 nextApp: any | null;
 onRefresh: () => void;
}

const SmsTemplateButton = ({ client, journalData, nextApp, onRefresh }: SmsTemplateButtonProps) => {
 const [open, setOpen] = useState(false);
 const [saving, setSaving] = useState(false);
 const [loadingSlots, setLoadingSlots] = useState(false);
 const [availableSlots, setAvailableSlots] = useState<string[] | null>(null);
 const [slotsByDate, setSlotsByDate] = useState<Record<string, { time?: string; start?: string }[]> | null>(null);
 const [availabilityType, setAvailabilityType] = useState<"share" | "days" | null>(null);

 const firstName = client.name.split(' ')[0];
 const lastSmsAt = journalData.last_sms_at ? new Date(journalData.last_sms_at) : null;
 const daysSinceSms = lastSmsAt
 ? Math.floor((Date.now() - lastSmsAt.getTime()) / (1000 * 60 * 60 * 24))
 : null;
 const recentlySmsed = daysSinceSms !== null && daysSinceSms <= 7;

 const nextAppFormatted = nextApp
 ? format(new Date(nextApp.date), "EEEE, MMMM d 'at' h:mm a")
 : null;

 // Fetch available slots when popover opens
 useEffect(() => {
 if (!open || availableSlots !== null) return;
 setLoadingSlots(true);
 const start = new Date().toISOString();
 const end = addDays(new Date(), 60).toISOString();
 supabase.functions.invoke('get-calcom-slots', {
 body: { start, end, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }
 }).then(({ data }) => {
 if (!data?.data) { setAvailableSlots([]); return; }
 const raw = data.data as Record<string, { time?: string; start?: string }[]>;
 setSlotsByDate(raw);
 // Flatten all slots across all days, sorted chronologically, take first 8
 const flat: string[] = [];
 Object.values(raw).forEach(daySlots => {
 (daySlots as { time?: string; start?: string }[]).forEach(s => {
 const t = s.time || s.start;
 if (t) flat.push(t);
 });
 });
 flat.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
 setAvailableSlots(flat.slice(0, 8));
 }).catch(() => setAvailableSlots([])).finally(() => setLoadingSlots(false));
 }, [open]);

 const availabilityBody = useMemo(() => {
 if (!slotsByDate) return null;
 const dates = Object.keys(slotsByDate).sort().filter(d => slotsByDate[d]?.length > 0);
 const totalDays = dates.length;
 if (totalDays === 0) return null;
 if (totalDays <= 3) {
 const lines = dates.slice(0, 3).flatMap(dateKey =>
 slotsByDate[dateKey].map(s => {
 const t = s.time || s.start;
 return t ? format(parseISO(t), "EEE d MMM 'at' h:mm a") : "";
 }).filter(Boolean)
 ).slice(0, 10);
 return `Hi ${firstName}, I have some availability coming up — here are my next open slots:\n\n${lines.join('\n')}\n\nWould any of these work for you? 😊`;
 }
 if (totalDays <= 6) {
 const lines = dates.slice(0, 5).map(dateKey =>
 formatDateLine(dateKey, slotsByDate[dateKey].map(s => s.time || s.start).filter(Boolean) as string[])
 );
 return `Hi ${firstName}, I've got some availability coming up — here are my open times:\n\n${lines.join('\n')}\n\nWould any of these work? Or book directly: https://cal.com/daniele-buatti/30min 😊`;
 }
 return `Hi ${firstName}, I've got lots of availability coming up. Best to pick a time that works for you: https://cal.com/daniele-buatti/30min 😊`;
 }, [slotsByDate, firstName]);

 const TEMPLATES = [
 {
 id: 'appointment_reminder',
 label: 'Appointment Reminder',
 icon: Calendar,
 color: 'text-chart-primary',
 bg: 'hover:bg-muted',
 body: nextAppFormatted
 ? `Hi ${firstName}, just a reminder that your next appointment is on ${nextAppFormatted}. See you then! 😊`
 : null,
 preview: nextAppFormatted
 ? `Reminder: ${nextAppFormatted}`
 : 'No upcoming appointment booked',
 disabled: !nextAppFormatted,
 },
 {
 id: 'available_slots',
 label: 'Available Appointments',
 icon: CalendarCheck2,
 color: 'text-chart-primary',
 bg: 'hover:bg-muted',
 body: availabilityBody,
 preview: loadingSlots
 ? 'Loading slots…'
 : !slotsByDate
 ? 'Opens to load slots'
 : Object.keys(slotsByDate).filter(d => slotsByDate[d]?.length > 0).length === 0
 ? 'No open slots found'
 : Object.keys(slotsByDate).sort().slice(0, 2).map(d =>
 `${format(parseISO(d), "EEE d MMM")}: ${slotsByDate[d].slice(0, 2).map(s => {
 const t = s.time || s.start;
 return t ? format(parseISO(t), "h:mm a") : "";
 }).filter(Boolean).join(", ")}`
 ).join(" · ") + (Object.keys(slotsByDate).length > 2 ? ` +${Object.keys(slotsByDate).length - 2} more days` : ""),
 disabled: loadingSlots || !availabilityBody,
 },
 {
 id: 'check_in',
 label: 'Session Check-in',
 icon: Smile,
 color: 'text-chart-emerald',
 bg: 'hover:bg-muted',
 body: `Hi ${firstName}, just checking in to see how you're going since our last session. Hope you're feeling well! 😊`,
 preview: `Checking in on how you're going since your last session`,
 disabled: false,
 },
 {
 id: 'booking_nudge',
 label: 'Booking Nudge',
 icon: MessageCircle,
 color: 'text-muted-foreground',
 bg: 'hover:bg-muted',
 body: `Hi ${firstName}, I have some availability coming up and wanted to reach out — would you like to book in for a session soon? 😊`,
 preview: `Letting you know I have availability coming up`,
 disabled: false,
 },
 ];

 const handleSend = async (templateId: string, body: string) => {
 setSaving(true);
 window.location.href = `sms:${client.phone}?body=${encodeURIComponent(body)}`;
 setOpen(false);
 try {
 const now = new Date().toISOString();
 const updatedJournal = stringifyClientJournal({
 ...journalData,
 last_sms_at: now,
 last_sms_template: templateId,
 last_contacted_at: now,
 });
 await supabase.from('clients').update({ journal: updatedJournal }).eq('id', client.id);
 onRefresh();
 } catch {
 // Non-critical
 } finally {
 setSaving(false);
 }
 };

 return (
 <Popover open={open} onOpenChange={setOpen}>
 <PopoverTrigger asChild>
 <button
 className={cn(
 "relative h-8 w-8 rounded-xl flex items-center justify-center transition-colors",
 recentlySmsed
 ? "text-chart-emerald bg-muted"
 : "text-chart-emerald hover:bg-muted"
 )}
 title="Send message template"
 >
 <MessageCircle size={15} />
 {recentlySmsed && (
 <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-muted0 rounded-full border-2 border-white" />
 )}
 </button>
 </PopoverTrigger>

 <PopoverContent
 align="end"
 className="w-[340px] p-0 rounded-xl shadow-sm border border-border bg-card overflow-hidden"
 >
 {/* Header */}
 <div className="px-4 pt-4 pb-3 bg-muted border-b border-border">
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-xl bg-chart-emerald/10 flex items-center justify-center shrink-0">
 <MessageCircle size={16} className="text-chart-emerald" />
 </div>
 <div>
 <p className="text-sm font-semibold text-foreground">Message {firstName}</p>
 <p className="text-[10px] text-muted-foreground font-medium">{client.phone}</p>
 </div>
 </div>
 {lastSmsAt && (
 <div className={cn(
 "mt-2.5 flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-medium",
 recentlySmsed
 ? "bg-muted text-chart-emerald"
 : "bg-muted text-muted-foreground"
 )}>
 <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", recentlySmsed ? "bg-muted0" : "bg-muted-foreground/40")} />
 Last messaged:{" "}
 {daysSinceSms === 0 ? "today" : daysSinceSms === 1 ? "yesterday" : `${daysSinceSms} days ago`}
 {journalData.last_sms_template && ` · ${journalData.last_sms_template.replace(/_/g, ' ')}`}
 </div>
 )}
 </div>

 {/* Templates */}
 <div className="p-2 bg-card">
 <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-3 pt-1.5 pb-1">Templates</p>
 {TEMPLATES.map((t) => (
 <button
 key={t.id}
 disabled={t.disabled || saving}
 onClick={() => t.body && handleSend(t.id, t.body)}
 className={cn(
 "w-full flex items-start gap-3 p-3 rounded-xl transition-all text-left",
 t.disabled
 ? "opacity-40 cursor-not-allowed"
 : `cursor-pointer ${t.bg}`
 )}
 >
 <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
 {t.id === 'available_slots' && loadingSlots
 ? <Loader2 size={12} className="animate-spin text-muted-foreground/60" />
 : <t.icon size={13} className={t.color} />
 }
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center justify-between gap-2">
 <p className="text-xs font-semibold text-foreground">{t.label}</p>
 {!t.disabled && <ChevronRightIcon size={12} className="text-muted-foreground/60 shrink-0" />}
 </div>
 <p className={cn(
 "text-[10px] font-medium mt-0.5 leading-relaxed",
 t.disabled ? "text-muted-foreground/60" : "text-muted-foreground"
 )}>
 {t.preview}
 </p>
 </div>
 </button>
 ))}
 </div>

 {/* Availability actions */}
 <div className="px-2 pb-2 bg-card border-t border-border">
 <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-3 pt-3 pb-1">Send Availability</p>

 <button
 onClick={() => setAvailabilityType("share")}
 className="w-full flex items-start gap-3 p-3 rounded-xl transition-all text-left hover:bg-muted"
 >
 <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
 <CalendarCheck2 size={13} className="text-chart-primary" />
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center justify-between gap-2">
 <p className="text-xs font-semibold text-foreground">Share Availability</p>
 <ChevronRightIcon size={12} className="text-muted-foreground/60 shrink-0" />
 </div>
 <p className="text-[10px] font-medium mt-0.5 leading-relaxed text-muted-foreground">
 5 days of availability — send via email or SMS
 </p>
 </div>
 </button>

 <button
 onClick={() => setAvailabilityType("days")}
 className="w-full flex items-start gap-3 p-3 rounded-xl transition-all text-left hover:bg-muted"
 >
 <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
 <CalendarPlusIcon size={13} className="text-chart-primary" />
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center justify-between gap-2">
 <p className="text-xs font-semibold text-foreground">Share 10 Days</p>
 <ChevronRightIcon size={12} className="text-muted-foreground/60 shrink-0" />
 </div>
 <p className="text-[10px] font-medium mt-0.5 leading-relaxed text-muted-foreground">
 10 days with week separators — send via email or SMS
 </p>
 </div>
 </button>
 </div>

 {/* Availability popover */}
 {availabilityType && slotsByDate && (
 <div className="border-t border-border bg-card">
 <AvailabilityPopover
 type={availabilityType}
 slotsByDate={slotsByDate}
 client={client}
 firstName={firstName}
 onClose={() => setAvailabilityType(null)}
 />
 </div>
 )}

 </PopoverContent>
 </Popover>
 );
};

// ── Availability popover shared by SmsTemplateButton ──

const calLink = "https://cal.com/daniele-buatti/30min";

function formatAvailabilityLines(
 type: "share" | "days",
 slotsByDate: Record<string, { time?: string; start?: string }[]>
) {
 const dates = Object.keys(slotsByDate).sort().filter(d => slotsByDate[d]?.length > 0);
 if (dates.length === 0) return [];

 const entries = type === "share"
 ? dates.slice(0, 5).map(k => ({ k, slots: slotsByDate[k] }))
 : dates.slice(0, 10).map(k => ({ k, slots: slotsByDate[k] }));

 const lines: string[] = [];
 let prevWeek: number | null = null;
 for (const { k, slots } of entries) {
 if (type === "days") {
 const week = getISOWeek(parseISO(k));
 if (prevWeek !== null && week !== prevWeek) lines.push("");
 prevWeek = week;
 }
 const times = slots.map(s => s.time || s.start).filter(Boolean) as string[];
 lines.push(formatDateLine(k, times));
 }
 return lines;
}

function AvailabilityPopover({
 type,
 slotsByDate,
 client,
 firstName,
 onClose,
}: {
 type: "share" | "days";
 slotsByDate: Record<string, { time?: string; start?: string }[]>;
 client: { email?: string; phone?: string };
 firstName: string;
 onClose: () => void;
}) {
 const lines = useMemo(() => formatAvailabilityLines(type, slotsByDate), [type, slotsByDate]);

 const emailBody = lines.length > 0
 ? `Hi ${firstName},\n\nHere's my availability:\n\n${lines.join('\n')}\n\nBooking link: ${calLink}`
 : `Hi ${firstName},\n\nI have availability coming up. Book a session here:\n${calLink}`;

 const smsBody = lines.length > 0
 ? `Hi ${firstName}, here's my availability:\n\n${lines.join('\n')}\n\nBook: ${calLink}`
 : `Hi ${firstName}, book here: ${calLink}`;

 const subject = "Availability — Session Booking";

 const openEmail = () => {
 if (!client.email) return;
 const gmailUrl = `https://mail.google.com/mail/u/0/?view=cm&fs=1&to=${encodeURIComponent(client.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
 window.open(gmailUrl, "_blank");
 };

 const openSms = () => {
 if (!client.phone) return;
 window.location.href = `sms:${client.phone}?body=${encodeURIComponent(smsBody)}`;
 };

 return (
 <div className="p-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
 <div className="flex items-center justify-between">
 <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Send via</p>
 <button onClick={onClose} className="text-muted-foreground/60 hover:text-muted-foreground">
 <X size={13} />
 </button>
 </div>
 <div className="flex gap-2">
 {client.email && (
 <Button onClick={openEmail} variant="outline" size="sm" className="flex-1 rounded-xl h-9 text-[10px] font-semibold uppercase tracking-wider">
 <Mail size={11} className="mr-1.5" /> Email
 </Button>
 )}
 {client.phone && (
 <Button onClick={openSms} variant="outline" size="sm" className="flex-1 rounded-xl h-9 text-[10px] font-semibold uppercase tracking-wider">
 <MessageSquare size={11} className="mr-1.5" /> SMS
 </Button>
 )}
 </div>
 <div className="max-h-32 overflow-y-auto rounded-xl bg-muted/30 p-2.5">
 <p className="text-[10px] text-muted-foreground whitespace-pre-wrap leading-relaxed font-medium">
 {emailBody}
 </p>
 </div>
 </div>
 );
}

// ────────────────────────────────────────────────────────────────────────────

export const ClientRow = ({
 client,
 calculateAge,
 handleRateChange,
 handleOpenOverrideModal,
 selectedWeeklyClients,
 onToggleWeeklyClient,
 onSetTargetRate,
 onSetRateUpdatedDate,
 onSetReengagementTag,
 isLapsedSection,
 onQuickBook,
 onRefresh,
 averageSessionRate,
}: ClientRowProps) => {
 const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
 const [isReengagementEmailModalOpen, setIsReengagementEmailModalOpen] = useState(false);
 const [copiedEmail, setCopiedEmail] = useState(false);
 const [copiedReengagementEmail, setCopiedReengagementEmail] = useState(false);
 const [updatingStatus, setUpdatingStatus] = useState(false);
 const [confirmUpgrade, setConfirmUpgrade] = useState(false);

 const lastSeenText = client.lastSeenDate ? format(client.lastSeenDate, "MMM d, yyyy") : "Never";
 const relativeTime = client.lastSeenDate ? formatDistanceToNow(client.lastSeenDate, { addSuffix: true }) : "";

 const futureApps = client.appointments.filter(app => new Date(app.date) > new Date());
 const nextApp = futureApps.length > 0 ? [...futureApps].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0] : null;
 const nextAppText = nextApp ? format(new Date(nextApp.date), "MMM d, yyyy") : null;
 const nextAppRelative = nextApp ? formatDistanceToNow(new Date(nextApp.date), { addSuffix: true }) : null;

 const isCustomRate = client.standard_rate !== null && client.standard_rate !== undefined && ![0, 30, 50, 70, 80, 90, 100, 120, 150].includes(client.standard_rate);
 const currentRateValue = isCustomRate ? -1 : (client.standard_rate ?? 50);

 // Rate Tracking & Vision Calculations
 const targetRate = client.target_rate ?? (client.standard_rate ?? 50);
 const rateUpdatedDateStr = client.rate_updated_at;
 
 // Default to 7 months ago if never set, to prompt review for old rates
 const rateUpdatedDate = rateUpdatedDateStr ? new Date(rateUpdatedDateStr) : new Date(Date.now() - 7 * 30 * 24 * 60 * 60 * 1000);
 const monthsSinceUpdate = differenceInMonths(new Date(), rateUpdatedDate);
 const needsReview = monthsSinceUpdate >= 6;

 // Parse Journal JSON for contacted status and upgrade count
 const journalData = useMemo(() => parseClientJournal(client.journal), [client.journal]);

 // Re-engagement Priority Calculations
 const reengagementTag = client.reengagement_tag;
 const [syncingStripe, setSyncingStripe] = useState(false);
 const [syncingNotion, setSyncingNotion] = useState(false);
 const [sendingOnboarding, setSendingOnboarding] = useState(false);
 
 const priorityScore = useMemo(() => {
 let score = 0;
 
 // 1. Past appointments count (max 40 points)
 const appCount = client.appointments.length;
 score += Math.min(appCount * 5, 40);
 
 // 2. Recency (max 30 points)
 if (client.lastSeenDate) {
 const diffDays = (new Date().getTime() - client.lastSeenDate.getTime()) / (1000 * 60 * 60 * 24);
 // Closer to 90 days = higher score. If 90 days, 30 points. If 365 days, 0 points.
 const textScore = Math.max(0, 30 - Math.floor((diffDays - 90) / 10));
 score += textScore;
 }
 
 // 3. Manual Tag (max 30 points)
 if (reengagementTag === 'warm') score += 30;
 else if (reengagementTag === 'cold') score += 10;
 else if (reengagementTag === 'lost') score += 0;
 else score += 15; // default neutral
 
 return Math.min(score, 100);
 }, [client, reengagementTag]);

 const isSelectedInSimulator = selectedWeeklyClients.includes(client.id);

 const handleSyncToStripe = async (e: React.MouseEvent) => {
 e.stopPropagation();
 setSyncingStripe(true);
 try {
 const { data, error } = await supabase.functions.invoke('stripe-manager', {
 body: { 
 action: 'sync-customer', 
 clientId: client.id,
 clientData: client
 }
 });

 if (error) throw error;

 if (data.stripeCustomerId) {
 await supabase
 .from('clients')
 .update({ stripe_customer_id: data.stripeCustomerId })
 .eq('id', client.id);
 
 showSuccess(`Synced ${client.name} to Stripe!`);
 onRefresh();
 }
 } catch (err: any) {
 showError(err.message || "Failed to sync to Stripe.");
 } finally {
 setSyncingStripe(false);
 }
 };

 const handleSyncToNotion = async (e: React.MouseEvent) => {
 e.stopPropagation();
 setSyncingNotion(true);
 try {
 const { data, error } = await supabase.functions.invoke('sync-to-notion', {
 body: {
 clientId: client.id,
 origin: window.location.origin
 }
 });

 if (error) throw error;

 showSuccess(`Synced ${client.name} to Notion Client Database!`);
 onRefresh();
 } catch (err: any) {
 showError(err.message || "Failed to sync to Notion.");
 } finally {
 setSyncingNotion(false);
 }
 };

 const handleSendOnboarding = async (e: React.MouseEvent) => {
 e.stopPropagation();
 if (!client.email) {
 showError("Client email is missing.");
 return;
 }
 setSendingOnboarding(true);
 try {
 const { error } = await supabase.functions.invoke('send-manual-onboarding', {
 body: { clientId: client.id, force: true }
 });
 if (error) throw error;
 showSuccess(`Onboarding email sent to ${client.name}!`);
 } catch (err: any) {
 showError(err.message || "Failed to send onboarding email.");
 } finally {
 setSendingOnboarding(false);
 }
 };

 // Calculate next month name dynamically
 const nextMonthName = useMemo(() => {
 const nextMonth = new Date();
 nextMonth.setMonth(nextMonth.getMonth() + 1);
 return format(nextMonth, "MMMM");
 }, []);

 // Generate personalized rate increase email template (British English)
 const currentRateNum = client.standard_rate ?? 50;

 const emailTemplate = useMemo(() => {
 const firstName = client.name.split(' ')[0];
 return `Hi ${firstName},

I hope this finds you well!

I just wanted to take a moment to say a huge thank you for working with me and for trusting me with your health and integration journey. It is always a privilege to support you.

I'm writing to let you know that from ${nextMonthName} onwards, my session rate for you will be moving from $${currentRateNum} to $${targetRate} per session.

This allows me to continue investing in advanced clinical training, specialist protocols, and high-quality integration resources — all to ensure I'm able to support you in the very best way possible.

Please don't hesitate to reply directly to this email if you have any questions or would like to have a chat about it.

Looking forward to our next session!

Warmly,
Daniele`;
 }, [client.name, nextMonthName, targetRate, currentRateNum]);

 // Generate re-engagement email template (British English)
 const ongoingRate = averageSessionRate ? Math.round(averageSessionRate) : 70;
 const reengagementEmailTemplate = useMemo(() => {
 const firstName = client.name.split(' ')[0];
 return `Hi ${firstName},

I hope you're keeping well and that life has been treating you kindly!

It's been a little while since we last worked together, and I've been thinking about how you're getting on.

I'm currently offering a special re-introductory package for returning clients: 3 sessions for $150 (roughly $50 per session), followed by my standard rate of $${ongoingRate} per session going forward.

I'd love to welcome you back and pick up where we left off — whether that's continuing with where we were, or starting fresh with something new.

If you're open to it, feel free to simply reply to this email and we can go from there.

Looking forward to hearing from you!

Warmly,
Daniele`;
 }, [client.name, ongoingRate]);

  const handleCopyEmail = () => {
  navigator.clipboard.writeText(emailTemplate);
  setCopiedEmail(true);
  showSuccess("Email template copied to clipboard!");
  setTimeout(() => setCopiedEmail(false), 2000);
  };

  const [sendingEmail, setSendingEmail] = useState(false);
  const handleSendEmail = async () => {
    if (!client.email) { showError("No email on file for this client."); return; }
    setSendingEmail(true);
    try {
      const { error } = await supabase.functions.invoke('send-rate-increase-email', {
        body: { clientName: client.name, clientEmail: client.email, currentRate: currentRateNum, targetRate, effectiveMonth: nextMonthName }
      });
      if (error) throw error;
      showSuccess(`Rate increase email sent to ${client.name}!`);
      setIsEmailModalOpen(false);
    } catch (e: any) {
      showError(e.message || "Failed to send email.");
    } finally {
      setSendingEmail(false);
    }
  };

 const handleCopyReengagementEmail = () => {
 navigator.clipboard.writeText(reengagementEmailTemplate);
 setCopiedReengagementEmail(true);
 showSuccess("Re-engagement email copied to clipboard!");
 setTimeout(() => setCopiedReengagementEmail(false), 2000);
 };

 const handleLogContact = async () => {
 setUpdatingStatus(true);
 try {
 const now = new Date().toISOString();
 const updatedJournal = stringifyClientJournal({ ...journalData, last_contacted_at: now });
 const { error } = await supabase.from('clients').update({ journal: updatedJournal }).eq('id', client.id);
 if (error) throw error;
 showSuccess(`Contact logged for ${client.name}.`);
 onRefresh();
 } catch {
 showError("Failed to log contact.");
 } finally {
 setUpdatingStatus(false);
 }
 };

 const handleMarkReengagementContacted = async () => {
 setUpdatingStatus(true);
 try {
 const now = new Date().toISOString();
 const updatedJournal = stringifyClientJournal({
 ...journalData,
 last_contacted_at: now,
 });
 const { error } = await supabase
 .from('clients')
 .update({ journal: updatedJournal })
 .eq('id', client.id);
 if (error) throw error;
 showSuccess(`${client.name} marked as contacted.`);
 setIsReengagementEmailModalOpen(false);
 onRefresh();
 } catch (err) {
 showError("Failed to update contact status.");
 } finally {
 setUpdatingStatus(false);
 }
 };

 const handleMarkContacted = async () => {
 setUpdatingStatus(true);
 try {
 const now = new Date().toISOString();
 const updatedJournal = stringifyClientJournal({
 ...journalData,
 rate_increase_contacted: true,
 rate_increase_contacted_at: now,
 last_contacted_at: now,
 });

 const { error } = await supabase
 .from('clients')
 .update({ journal: updatedJournal })
 .eq('id', client.id);

 if (error) throw error;
 showSuccess(`${client.name} marked as Contacted.`);
 setIsEmailModalOpen(false);
 onRefresh();
 } catch (err) {
 showError("Failed to update contacted status.");
 } finally {
 setUpdatingStatus(false);
 }
 };

 const handleConfirmUpgrade = async () => {
 setUpdatingStatus(true);
 try {
 const todayStr = new Date().toISOString();
 const updatedJournal = stringifyClientJournal({
 ...journalData,
 rate_increase_contacted: false,
 rate_increase_contacted_at: null,
 upgrade_count: (journalData.upgrade_count || 0) + 1
 });

 const { error } = await supabase
 .from('clients')
 .update({ 
 standard_rate: targetRate,
 rate_updated_at: todayStr,
 journal: updatedJournal
 })
 .eq('id', client.id);

 if (error) throw error;
 showSuccess(`Successfully upgraded ${client.name} to $${targetRate}!`);
 onRefresh();
 } catch (err) {
 showError("Failed to execute rate upgrade.");
 } finally {
 setUpdatingStatus(false);
 }
 };

 return (
 <tr className={cn(
 "hover:bg-muted/10 transition-colors group",
 isSelectedInSimulator ? "bg-muted/20" : ""
 )}>
 {/* Simulator Checkbox */}
 <td className="p-4 pl-6">
 <button
 onClick={() => onToggleWeeklyClient(client.id)}
 className="text-muted-foreground/60 hover:text-chart-primary transition-colors"
 >
 {isSelectedInSimulator ? (
 <CheckSquare className="text-chart-primary" size={18} />
 ) : (
 <Square size={18} />
 )}
 </button>
 </td>

 {/* Client */}
 <td className="p-4">
 <div className="space-y-1">
 <div className="flex items-center gap-1.5">
 <Link 
 to={`/clients/${client.id}`}
 className="font-semibold text-foreground text-sm hover:underline hover:text-chart-primary transition-colors flex items-center gap-1"
 >
 {client.name}
 <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-chart-primary" />
 </Link>
 </div>
 <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium flex-wrap">
 {client.pronouns && <span>{client.pronouns}</span>}
 {client.pronouns && <span>•</span>}
 <span>Age: {calculateAge(client.born)}</span>
 <span>•</span>
 <span>{client.appointments.length} sessions</span>
 <span>•</span>
 <span className="text-chart-primary font-medium">Upgrades: {journalData.upgrade_count || 0}</span>
 {(journalData.upgrade_count || 0) >= 4 && (
 <span className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
 <span className="w-1.5 h-1.5 rounded-full bg-muted0 animate-pulse" />
 Due
 </span>
 )}
 </div>
 {client.phone && (
 <div className="flex items-center gap-1.5 mt-0.5">
 <Phone size={10} className="text-muted-foreground shrink-0" />
 <span className="text-[11px] text-muted-foreground font-medium tracking-wide">{client.phone}</span>
 </div>
 )}
 </div>
 </td>

 {/* Last Seen / Next Booked */}
 <td className="p-4">
 <div className="space-y-1">
 <div className="flex flex-col">
 <span className="text-xs text-muted-foreground font-medium">Last Seen:</span>
 <span className="text-sm font-medium text-foreground">{lastSeenText}</span>
 {relativeTime && (
 <span className="text-[10px] text-muted-foreground font-medium">
 ({relativeTime})
 </span>
 )}
 </div>
 {nextAppText && (
 <div className="flex flex-col pt-1 border-t border-border/30 mt-1">
 <span className="text-xs text-chart-primary font-semibold uppercase tracking-wider text-[10px]">Next Booked:</span>
 <span className="text-sm font-semibold text-chart-primary">{nextAppText}</span>
 {nextAppRelative && (
 <span className="text-[10px] text-chart-primary font-medium">
 ({nextAppRelative})
 </span>
 )}
 </div>
 )}
 </div>
 </td>

 {/* Rate Ladder (Current vs Target) */}
 <td className="p-4">
 <div className="space-y-1.5">
 <div className="flex items-center gap-2">
 <Select
 value={currentRateValue.toString()}
 onValueChange={(val) => handleRateChange(client.id, parseInt(val))}
 >
 <SelectTrigger className="w-[82px] h-7 rounded-lg border-border/60 bg-muted/30 text-[11px] font-medium">
 <SelectValue />
 </SelectTrigger>
 <SelectContent className="rounded-xl bg-card border border-border shadow-sm">
 {RATE_OPTIONS.map((opt) => (
 <SelectItem key={opt.value} value={opt.value.toString()} className="text-xs font-medium">
 {opt.label}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 {isCustomRate && (
 <Badge variant="outline" className="rounded-lg border-border bg-muted text-chart-primary font-medium text-[10px] h-5">
 ${client.standard_rate}
 </Badge>
 )}
 <ArrowRight size={12} className="text-muted-foreground shrink-0" />
 <Select
 value={targetRate.toString()}
 onValueChange={(val) => onSetTargetRate(client.id, parseInt(val))}
 >
 <SelectTrigger className="w-[82px] h-7 rounded-lg border-border bg-muted/30 text-chart-primary text-[11px] font-semibold">
 <SelectValue />
 </SelectTrigger>
 <SelectContent className="rounded-xl bg-card border border-border shadow-sm">
 {RATE_OPTIONS.filter(opt => opt.value !== -1).map((opt) => (
 <SelectItem key={opt.value} value={opt.value.toString()} className="text-xs font-medium">
 {opt.label}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>

 <div className="flex items-center gap-1.5 flex-wrap">
 <span className="text-[10px] text-muted-foreground font-medium">
 Set {monthsSinceUpdate === 0 ? "this month" : `${monthsSinceUpdate}mo ago`}
 </span>
 {needsReview ? (
 <>
 <Badge className="bg-muted text-muted-foreground border-none font-semibold text-[7px] uppercase tracking-wider px-1.5 py-0 flex items-center gap-0.5 animate-pulse h-4">
 <AlertTriangle size={8} /> Review
 </Badge>
 <button
 onClick={() => {
 onSetRateUpdatedDate(client.id, new Date().toISOString());
 showSuccess("Rate marked as reviewed today.");
 }}
 className="h-4 px-1 text-[10px] font-semibold uppercase tracking-wider text-chart-primary hover:bg-muted rounded"
 >
 Dismiss
 </button>
 </>
 ) : null}
 </div>
 </div>
 </td>

 {/* Preferred Time OR Re-engagement Priority */}
 <td className="p-4">
 {isLapsedSection ? (
 <div className="space-y-2">
 {/* Priority Score & Tag */}
 <div className="flex items-center gap-3">
 {/* Priority Score */}
 <div className="space-y-0.5">
 <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">Priority Score</span>
 <div className="flex items-center gap-2">
 <Badge className={cn(
 "font-semibold text-xs px-2.5 py-1 rounded-xl border-none",
 priorityScore >= 70 ? "bg-chart-emerald/10 text-chart-emerald" :
 priorityScore >= 40 ? "bg-muted text-muted-foreground" :
 "bg-muted text-muted-foreground"
 )}>
 {priorityScore}/100
 </Badge>
 {priorityScore >= 70 && <Flame size={14} className="text-muted-foreground animate-pulse" />}
 </div>
 </div>

 {/* Re-engagement Tag */}
 <div className="space-y-0.5">
 <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">Status</span>
 <Select
 value={reengagementTag || "neutral"}
 onValueChange={(val: any) => onSetReengagementTag(client.id, val === "neutral" ? null : val)}
 >
 <SelectTrigger className={cn(
 "w-[90px] h-8 rounded-xl text-xs font-medium border-none",
 reengagementTag === 'warm' ? "bg-muted text-chart-emerald" :
 reengagementTag === 'cold' ? "bg-muted text-muted-foreground" :
 reengagementTag === 'lost' ? "bg-muted text-muted-foreground" :
 "bg-muted/40 text-muted-foreground"
 )}>
 <SelectValue placeholder="Select" />
 </SelectTrigger>
 <SelectContent className="rounded-xl bg-card border border-border shadow-sm">
 <SelectItem value="neutral" className="text-xs font-medium">Neutral</SelectItem>
 <SelectItem value="warm" className="text-xs font-medium text-chart-emerald">Warm</SelectItem>
 <SelectItem value="cold" className="text-xs font-medium text-chart-primary">Cold</SelectItem>
 <SelectItem value="lost" className="text-xs font-medium text-muted-foreground">Lost</SelectItem>
 </SelectContent>
 </Select>
 </div>
 </div>
 </div>
 ) : (
 <div className="flex items-center gap-2 group">
 <div className="space-y-0.5">
 {client.preferred_time ? (
 <div className="flex items-center gap-1.5">
 <span className="text-sm font-medium text-foreground">{client.preferred_time}</span>
 <Badge className="bg-muted text-chart-primary border-none font-medium text-[10px] uppercase tracking-wider px-1.5 py-0">
 Manual
 </Badge>
 </div>
 ) : (
 <div className="flex items-center gap-1.5">
 <span className="text-sm font-medium text-foreground">
 {client.preferredTimeAnalyzed.text}
 </span>
 {client.preferredTimeAnalyzed.isLowData && !client.preferred_time && (
 <Badge className="bg-muted text-muted-foreground border-none font-medium text-[10px] uppercase tracking-wider px-1.5 py-0">
 Low Data
 </Badge>
 )}
 </div>
 )}
 </div>
 <Button
 variant="ghost"
 size="icon"
 onClick={() => handleOpenOverrideModal(client)}
 className="w-7 h-7 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted"
 >
 <Edit2 size={12} className="text-muted-foreground" />
 </Button>
 </div>
 )}
 </td>

 {/* Follow-up Status */}
 <td className="p-4">
 <div className="space-y-1.5">
 {(() => {
 const lastContactedAt = journalData.last_contacted_at;
 const recentlyContacted = lastContactedAt
 ? (new Date().getTime() - new Date(lastContactedAt).getTime()) / (1000 * 60 * 60 * 24) < 14
 : false;

 if (client.followUpStatus === "Booked") {
 return (
 <Badge className="bg-chart-emerald/10 text-chart-emerald border-none font-medium text-xs px-2.5 py-0.5 rounded-full">
 Booked
 </Badge>
 );
 } else if (recentlyContacted) {
 return (
 <Badge className="bg-muted text-muted-foreground border-none font-medium text-xs px-2.5 py-0.5 rounded-full">
 Awaiting Reply
 </Badge>
 );
 } else if (client.followUpStatus === "Needs Follow-up") {
 return (
 <Badge className="bg-muted text-muted-foreground border-none font-medium text-xs px-2.5 py-0.5 rounded-full animate-pulse">
 Needs Follow-up
 </Badge>
 );
 } else {
 return (
 <Badge className="bg-muted text-muted-foreground border-none font-medium text-xs px-2.5 py-0.5 rounded-full">
 No Future Bookings
 </Badge>
 );
 }
 })()}
 {journalData.last_contacted_at && (
 <p className="text-[10px] text-muted-foreground font-medium">
 Contacted {formatDistanceToNow(new Date(journalData.last_contacted_at), { addSuffix: true })}
 </p>
 )}
 </div>
 </td>

 {/* Row Actions */}
 <td className="p-4 pr-6 text-right">
 <div className="flex items-center justify-end gap-2">
 {/* Rate Increase Follow-up Action */}
 {client.standard_rate !== targetRate && (
 <div className="flex items-center gap-1.5">
 <TooltipProvider>
 <Tooltip>
 <TooltipTrigger asChild>
 <Button
 variant="outline"
 size="sm"
 onClick={() => setIsEmailModalOpen(true)}
 className="h-8 rounded-xl border-border text-chart-primary hover:bg-muted font-semibold text-[10px] uppercase tracking-wider flex items-center gap-1"
 >
 <MessageSquare size={12} />
 Contact
 </Button>
 </TooltipTrigger>
 <TooltipContent className="rounded-xl font-medium text-xs p-2">
 Send rate increase email: ${currentRateNum} → ${targetRate}
 </TooltipContent>
 </Tooltip>
 </TooltipProvider>

 {confirmUpgrade ? (
 <>
 <Button
 variant="ghost"
 size="sm"
 onClick={() => setConfirmUpgrade(false)}
 className="h-8 px-2 rounded-xl text-muted-foreground/60 hover:bg-muted font-semibold text-[10px]"
 >
 <X size={12} />
 </Button>
 <Button
 size="sm"
 onClick={() => { setConfirmUpgrade(false); handleConfirmUpgrade(); }}
 disabled={updatingStatus}
 className="h-8 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-[10px] uppercase tracking-wider px-3"
 >
 {updatingStatus ? <Loader2 className="animate-spin" size={10} /> : <Check size={10} className="mr-1" />}
 Confirm ${targetRate}?
 </Button>
 </>
 ) : (
 <TooltipProvider>
 <Tooltip>
 <TooltipTrigger asChild>
 <Button
 variant="outline"
 size="sm"
 onClick={() => setConfirmUpgrade(true)}
 className="h-8 rounded-xl border-border text-chart-emerald hover:bg-muted font-semibold text-[10px] uppercase tracking-wider flex items-center gap-1"
 >
 <ArrowUpRight size={12} />
 Upgrade
 </Button>
 </TooltipTrigger>
 <TooltipContent className="rounded-xl font-medium text-xs p-2">Upgrade to ${targetRate}</TooltipContent>
 </Tooltip>
 </TooltipProvider>
 )}
 </div>
 )}

 {/* Re-engagement email button for lapsed clients */}
 {isLapsedSection && (
 <TooltipProvider>
 <Tooltip>
 <TooltipTrigger asChild>
 <Button
 variant="outline"
 size="sm"
 onClick={() => setIsReengagementEmailModalOpen(true)}
 className="h-8 rounded-xl border-border text-chart-destructive hover:bg-muted font-semibold text-[10px] uppercase tracking-wider flex items-center gap-1"
 >
 <Mail size={12} />
 Re-engage
 </Button>
 </TooltipTrigger>
 <TooltipContent className="rounded-xl font-medium text-xs p-2">Send Re-engagement Email</TooltipContent>
 </Tooltip>
 </TooltipProvider>
 )}

 {/* Message via iMessage/SMS — template picker */}
 {client.phone && (
 <SmsTemplateButton
 client={client}
 journalData={journalData}
 nextApp={nextApp}
 onRefresh={onRefresh}
 />
 )}

 {/* Log Contact */}
 <TooltipProvider>
 <Tooltip>
 <TooltipTrigger asChild>
 <Button
 variant="ghost"
 size="icon"
 onClick={handleLogContact}
 disabled={updatingStatus}
 className="h-8 w-8 rounded-xl text-chart-emerald hover:bg-muted"
 >
 {updatingStatus ? <Loader2 size={14} className="animate-spin" /> : <PhoneCall size={14} />}
 </Button>
 </TooltipTrigger>
 <TooltipContent className="rounded-xl font-medium text-xs p-2">Log Contact (resets follow-up grace)</TooltipContent>
 </Tooltip>
 </TooltipProvider>

 {/* Quick Book */}
 <TooltipProvider>
 <Tooltip>
 <TooltipTrigger asChild>
 <Button
 variant="ghost"
 size="icon"
 onClick={(e) => { e.preventDefault(); e.stopPropagation(); onQuickBook(client.id); }}
 className="h-8 w-8 rounded-xl text-chart-primary hover:bg-muted"
 >
 <CalendarPlusIcon size={16} />
 </Button>
 </TooltipTrigger>
 <TooltipContent className="rounded-xl font-medium text-xs p-2">Quick Book Session</TooltipContent>
 </Tooltip>
 </TooltipProvider>

 {/* More Actions Dropdown */}
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-muted-foreground/60 hover:text-foreground">
 <MoreHorizontal size={16} />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end" className="rounded-xl p-2 shadow-sm border-none bg-card">
 {client.email && (
 <DropdownMenuItem onClick={handleSendOnboarding} disabled={sendingOnboarding} className="rounded-xl py-2 px-4 cursor-pointer flex items-center gap-3">
 {sendingOnboarding ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} className="text-chart-emerald" />}
 <span className="font-medium text-xs uppercase tracking-wider">Send Onboarding</span>
 </DropdownMenuItem>
 )}
 <DropdownMenuItem onClick={handleSyncToNotion} disabled={syncingNotion} className="rounded-xl py-2 px-4 cursor-pointer flex items-center gap-3">
 {syncingNotion ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} className="text-muted-foreground" />}
 <span className="font-medium text-xs uppercase tracking-wider">Sync to Notion</span>
 </DropdownMenuItem>
 <DropdownMenuItem onClick={handleSyncToStripe} disabled={syncingStripe} className="rounded-xl py-2 px-4 cursor-pointer flex items-center gap-3">
 {syncingStripe ? <Loader2 className="animate-spin" size={14} /> : <CreditCard size={14} className="text-chart-primary" />}
 <span className="font-medium text-xs uppercase tracking-wider">Sync to Stripe</span>
 </DropdownMenuItem>
 <DropdownMenuSeparator className="my-1" />
 <DropdownMenuItem asChild className="rounded-xl py-2 px-4 cursor-pointer flex items-center gap-3">
 <Link to={`/clients/${client.id}`}>
 <Users size={14} className="text-muted-foreground" />
 <span className="font-medium text-xs uppercase tracking-wider">View Profile</span>
 </Link>
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 </div>
 </td>

 {/* RE-ENGAGEMENT EMAIL DIALOG */}
 <Dialog open={isReengagementEmailModalOpen} onOpenChange={setIsReengagementEmailModalOpen}>
 <DialogContent className="sm:max-w-[600px] rounded-xl p-10">
 <DialogHeader>
 <div className="flex items-center gap-4 mb-2">
 <div className="w-14 h-14 rounded-xl bg-destructive text-destructive-foreground flex items-center justify-center shadow-sm">
 <Mail size={28} />
 </div>
 <div>
 <DialogTitle className="text-2xl font-semibold">Re-engagement Email</DialogTitle>
 <DialogDescription className="text-base font-medium">
 3+ month re-introductory offer for {client.name}.
 </DialogDescription>
 </div>
 </div>
 </DialogHeader>

 <div className="space-y-6 py-4">
 <div className="p-4 bg-muted rounded-xl border border-border flex items-center justify-between">
 <div className="space-y-0.5">
 <p className="text-[10px] font-semibold text-chart-destructive uppercase tracking-wider">Introductory Offer</p>
 <p className="text-lg font-semibold text-foreground">3 sessions for $150 · then ${ongoingRate}/session</p>
 </div>
 <Badge className="bg-destructive text-destructive-foreground border-none font-semibold text-[10px] uppercase tracking-wider px-3 py-1 rounded-full">
 Re-engagement
 </Badge>
 </div>

 <div className="relative">
 <Textarea
 readOnly
 value={reengagementEmailTemplate}
 className="min-h-[280px] rounded-xl border-2 border-border bg-muted/50 p-6 text-sm font-medium leading-relaxed resize-none"
 />
 <Button
 onClick={handleCopyReengagementEmail}
 className={cn(
 "absolute bottom-4 right-4 h-10 px-4 rounded-xl font-semibold text-[10px] uppercase tracking-wider transition-all shadow-md",
 copiedReengagementEmail ? "bg-primary text-primary-foreground" : "bg-card text-card-foreground border border-border hover:bg-muted"
 )}
 >
 {copiedReengagementEmail ? <Check size={14} className="mr-1.5" /> : <Copy size={14} className="mr-1.5" />}
 {copiedReengagementEmail ? "Copied!" : "Copy Email"}
 </Button>
 </div>
 </div>

 <DialogFooter className="gap-2">
 <Button variant="outline" onClick={() => setIsReengagementEmailModalOpen(false)} className="rounded-xl">
 Cancel
 </Button>
 <Button
 onClick={handleMarkReengagementContacted}
 disabled={updatingStatus}
 className="rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold text-xs uppercase tracking-wider px-6"
 >
 {updatingStatus ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 size={16} className="mr-2" />}
 Mark as Contacted
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>

 {/* RATE INCREASE EMAIL DIALOG */}
 <Dialog open={isEmailModalOpen} onOpenChange={setIsEmailModalOpen}>
 <DialogContent className="sm:max-w-[600px] rounded-xl p-10">
 <DialogHeader>
 <div className="flex items-center gap-4 mb-2">
 <div className="w-14 h-14 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
 <MessageSquare size={28} />
 </div>
 <div>
 <DialogTitle className="text-2xl font-semibold">Rate Increase Notification</DialogTitle>
 <DialogDescription className="text-base font-medium">
 Personalized email template for {client.name}.
 </DialogDescription>
 </div>
 </div>
 </DialogHeader>

 <div className="space-y-6 py-4">
 <div className="p-4 bg-muted rounded-xl border border-border flex items-center justify-between">
 <div className="space-y-0.5">
 <p className="text-[10px] font-semibold text-chart-primary uppercase tracking-wider">Rate Change</p>
 <p className="text-lg font-semibold text-foreground">$${currentRateNum} → $${targetRate} / session</p>
 </div>
 <Badge className="bg-primary text-primary-foreground border-none font-semibold text-[10px] uppercase tracking-wider px-3 py-1 rounded-full">
 Effective: {nextMonthName}
 </Badge>
 </div>

 <div className="relative">
 <Textarea
 readOnly
 value={emailTemplate}
 className="min-h-[250px] rounded-xl border-2 border-border bg-muted/50 p-6 text-sm font-medium leading-relaxed resize-none"
 />
 <Button
 onClick={handleCopyEmail}
 className={cn(
 "absolute bottom-4 right-4 h-10 px-4 rounded-xl font-semibold text-[10px] uppercase tracking-wider transition-all shadow-md",
 copiedEmail ? "bg-primary text-primary-foreground" : "bg-card text-card-foreground border border-border hover:bg-muted"
 )}
 >
 {copiedEmail ? <Check size={14} className="mr-1.5" /> : <Copy size={14} className="mr-1.5" />}
 {copiedEmail ? "Copied!" : "Copy Email"}
 </Button>
 </div>
 </div>

  <DialogFooter className="gap-2">
  <Button variant="outline" onClick={() => setIsEmailModalOpen(false)} className="rounded-xl">
  Cancel
  </Button>
  <Button 
    onClick={handleSendEmail} 
    disabled={sendingEmail || !client.email}
    className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs uppercase tracking-wider px-6"
  >
    {sendingEmail ? <Loader2 className="animate-spin mr-2" size={14} /> : <Send size={14} className="mr-2" />}
    Send Email
  </Button>
  <Button 
  onClick={handleMarkContacted} 
  disabled={updatingStatus}
  className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs uppercase tracking-wider px-6"
  >
  {updatingStatus ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 size={16} className="mr-2" />}
  Mark as Contacted
  </Button>
  </DialogFooter>
 </DialogContent>
 </Dialog>
 </tr>
 );
};

function CheckSquare({ className, size }: { className?: string; size?: number }) {
 return <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="18" x="3" y="3" rx="2" /><path d="m9 12 2 2 4-4" /></svg>;
}

function Square({ className, size }: { className?: string; size?: number }) {
 return <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="18" x="3" y="3" rx="2" /></svg>;
}