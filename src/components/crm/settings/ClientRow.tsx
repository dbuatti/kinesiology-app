"use client";

import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format, formatDistanceToNow, differenceInMonths } from "date-fns";
import {
  Mail, Phone, CalendarPlus, Clock, CreditCard, ArrowRight,
  Check, X, Trash2, Loader2, Send, RefreshCw, AlertTriangle, Flame,
  MoreHorizontal, CalendarPlus as CalendarPlusIcon, Edit2, Users,
  MessageSquare, CheckCircle2, Copy, Sparkles, ArrowUpRight, Lock, PhoneCall
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";
import { Client, Appointment } from "@/types/crm";
import { parseClientJournal, stringifyClientJournal } from "@/utils/journal-helper";

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

  const lastSeenText = client.lastSeenDate ? format(client.lastSeenDate, "MMM d, yyyy") : "Never";
  const relativeTime = client.lastSeenDate ? formatDistanceToNow(client.lastSeenDate, { addSuffix: true }) : "";

  const futureApps = client.appointments.filter(app => new Date(app.date) > new Date());
  const nextApp = futureApps.length > 0 ? [...futureApps].sort((a, b) => new Date(a.date).getTime() - new Date(a.date).getTime())[0] : null;
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
  const emailTemplate = useMemo(() => {
    const firstName = client.name.split(' ')[0];
    return `Hi ${firstName},

I hope this finds you well!

I just wanted to take a moment to say a huge thank you for working with me and for trusting me with your health and integration journey. It is always a privilege to support you.

I'm writing to let you know that from next month (${nextMonthName}), my standard session rate will be moving to $${targetRate}.

This allows me to continue investing in advanced clinical training, specialist protocols, and high-quality integration resources — all to ensure I'm able to support you in the very best way possible.

Please don't hesitate to reply directly to this email if you have any questions or would like to have a chat about it.

Looking forward to our next session!

Warmly,
Daniele`;
  }, [client.name, nextMonthName, targetRate]);

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
    if (!confirm(`Confirm rate upgrade for ${client.name} to $${targetRate}? This will update their current standard rate, increment their upgrade counter, and reset their contacted status.`)) {
      return;
    }

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
      isSelectedInSimulator ? "bg-indigo-50/20 dark:bg-indigo-950/10" : ""
    )}>
      {/* Simulator Checkbox */}
      <td className="p-4 pl-6">
        <button
          onClick={() => onToggleWeeklyClient(client.id)}
          className="text-slate-400 hover:text-indigo-600 transition-colors"
        >
          {isSelectedInSimulator ? (
            <CheckSquare className="text-indigo-600" size={18} />
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
              className="font-black text-foreground text-sm hover:underline hover:text-indigo-600 transition-colors flex items-center gap-1"
            >
              {client.name}
              <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-600" />
            </Link>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
            {client.pronouns && <span>{client.pronouns}</span>}
            {client.pronouns && <span>•</span>}
            <span>Age: {calculateAge(client.born)}</span>
            <span>•</span>
            <span className="text-indigo-600 font-bold">Upgrades: {journalData.upgrade_count || 0}</span>
          </div>
        </div>
      </td>

      {/* Last Seen / Next Booked */}
      <td className="p-4">
        <div className="space-y-1">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground font-medium">Last Seen:</span>
            <span className="text-sm font-bold text-foreground">{lastSeenText}</span>
            {relativeTime && (
              <span className="text-[10px] text-muted-foreground font-medium">
                ({relativeTime})
              </span>
            )}
          </div>
          {nextAppText && (
            <div className="flex flex-col pt-1 border-t border-border/30 mt-1">
              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-wider text-[9px]">Next Booked:</span>
              <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{nextAppText}</span>
              {nextAppRelative && (
                <span className="text-[10px] text-indigo-500 font-medium">
                  ({nextAppRelative})
                </span>
              )}
            </div>
          )}
        </div>
      </td>

      {/* Rate Ladder (Current vs Target) */}
      <td className="p-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            {/* Current Rate */}
            <div className="space-y-0.5">
              <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground block">Current</span>
              <div className="flex items-center gap-1.5">
                <Select
                  value={currentRateValue.toString()}
                  onValueChange={(val) => handleRateChange(client.id, parseInt(val))}
                >
                  <SelectTrigger className="w-[90px] h-8 rounded-xl border-border/60 bg-muted/30 text-xs font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
                    {RATE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value.toString()} className="text-xs font-bold">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isCustomRate && (
                  <Badge variant="outline" className="rounded-lg border-indigo-200 dark:border-indigo-900/50 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] h-6">
                    ${client.standard_rate}
                  </Badge>
                )}
              </div>
            </div>

            <ArrowRight size={14} className="text-muted-foreground mt-4" />

            {/* Target Rate */}
            <div className="space-y-0.5">
              <span className="text-[9px] font-black uppercase tracking-wider text-indigo-600 block">Target</span>
              <Select
                value={targetRate.toString()}
                onValueChange={(val) => onSetTargetRate(client.id, parseInt(val))}
              >
                <SelectTrigger className="w-[90px] h-8 rounded-xl border-indigo-200 bg-indigo-50/30 text-indigo-600 text-xs font-black">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
                  {RATE_OPTIONS.filter(opt => opt.value !== -1).map((opt) => (
                    <SelectItem key={opt.value} value={opt.value.toString()} className="text-xs font-bold">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Rate Age & Review Flag */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground font-medium">
              Rate set {monthsSinceUpdate === 0 ? "this month" : `${monthsSinceUpdate} ${monthsSinceUpdate === 1 ? "month" : "months"} ago`}
            </span>
            {needsReview ? (
              <Badge className="bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-none font-black text-[8px] uppercase tracking-wider px-2 py-0.5 flex items-center gap-1 animate-pulse">
                <AlertTriangle size={10} /> Review Rate
              </Badge>
            ) : null}
            {needsReview && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onSetRateUpdatedDate(client.id, new Date().toISOString());
                  showSuccess("Rate marked as reviewed today.");
                }}
                className="h-5 px-1.5 text-[9px] font-black uppercase tracking-wider text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-md"
              >
                Mark Reviewed
              </Button>
            )}
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
                <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground block">Priority Score</span>
                <div className="flex items-center gap-2">
                  <Badge className={cn(
                    "font-black text-xs px-2.5 py-1 rounded-xl border-none",
                    priorityScore >= 70 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" :
                    priorityScore >= 40 ? "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400" :
                    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  )}>
                    {priorityScore}/100
                  </Badge>
                  {priorityScore >= 70 && <Flame size={14} className="text-orange-500 animate-pulse" />}
                </div>
              </div>

              {/* Re-engagement Tag */}
              <div className="space-y-0.5">
                <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground block">Status</span>
                <Select
                  value={reengagementTag || "neutral"}
                  onValueChange={(val: any) => onSetReengagementTag(client.id, val === "neutral" ? null : val)}
                >
                  <SelectTrigger className={cn(
                    "w-[90px] h-8 rounded-xl text-xs font-bold border-none",
                    reengagementTag === 'warm' ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400" :
                    reengagementTag === 'cold' ? "bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400" :
                    reengagementTag === 'lost' ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" :
                    "bg-muted/40 text-slate-500"
                  )}>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
                    <SelectItem value="neutral" className="text-xs font-bold">Neutral</SelectItem>
                    <SelectItem value="warm" className="text-xs font-bold text-emerald-600">Warm</SelectItem>
                    <SelectItem value="cold" className="text-xs font-bold text-blue-600">Cold</SelectItem>
                    <SelectItem value="lost" className="text-xs font-bold text-slate-500">Lost</SelectItem>
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
                  <span className="text-sm font-bold text-foreground">{client.preferred_time}</span>
                  <Badge className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-none font-bold text-[8px] uppercase tracking-wider px-1.5 py-0">
                    Manual
                  </Badge>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-foreground">
                    {client.preferredTimeAnalyzed.text}
                  </span>
                  {client.preferredTimeAnalyzed.isLowData && !client.preferred_time && (
                    <Badge className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-none font-bold text-[8px] uppercase tracking-wider px-1.5 py-0">
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
                <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-none font-bold text-xs px-2.5 py-0.5 rounded-full">
                  Booked
                </Badge>
              );
            } else if (recentlyContacted) {
              return (
                <Badge className="bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 border-none font-bold text-xs px-2.5 py-0.5 rounded-full">
                  Awaiting Reply
                </Badge>
              );
            } else if (client.followUpStatus === "Needs Follow-up") {
              return (
                <Badge className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-none font-bold text-xs px-2.5 py-0.5 rounded-full animate-pulse">
                  Needs Follow-up
                </Badge>
              );
            } else {
              return (
                <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-none font-bold text-xs px-2.5 py-0.5 rounded-full">
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
              {client.appointments.length < 8 ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="h-8 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 font-black text-[9px] uppercase tracking-widest flex items-center gap-1 cursor-help">
                        <Lock size={12} />
                        Locked ({client.appointments.length}/8)
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="rounded-xl font-bold text-xs p-2">
                      Clients need at least 8 sessions before they can be upgraded.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : journalData.rate_increase_contacted ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleConfirmUpgrade}
                        disabled={updatingStatus}
                        className="h-8 rounded-xl border-emerald-200 text-emerald-600 hover:bg-emerald-50 font-black text-[9px] uppercase tracking-widest flex items-center gap-1"
                      >
                        {updatingStatus ? <Loader2 className="animate-spin" size={10} /> : <ArrowUpRight size={12} />}
                        Upgrade
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="rounded-xl font-bold text-xs p-2">Confirm Rate Upgrade</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEmailModalOpen(true)}
                        className="h-8 rounded-xl border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-black text-[9px] uppercase tracking-widest flex items-center gap-1"
                      >
                        <MessageSquare size={12} />
                        Contact
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="rounded-xl font-bold text-xs p-2">Generate Rate Increase Email</TooltipContent>
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
                    className="h-8 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/50 dark:hover:bg-rose-950/30 font-black text-[9px] uppercase tracking-widest flex items-center gap-1"
                  >
                    <Mail size={12} />
                    Re-engage
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="rounded-xl font-bold text-xs p-2">Send Re-engagement Email</TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
                  className="h-8 w-8 rounded-xl text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/30"
                >
                  {updatingStatus ? <Loader2 size={14} className="animate-spin" /> : <PhoneCall size={14} />}
                </Button>
              </TooltipTrigger>
              <TooltipContent className="rounded-xl font-bold text-xs p-2">Log Contact (resets follow-up grace)</TooltipContent>
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
                  className="h-8 w-8 rounded-xl text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                >
                  <CalendarPlusIcon size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="rounded-xl font-bold text-xs p-2">Quick Book Session</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Send Onboarding */}
          {client.email && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleSendOnboarding}
                    disabled={sendingOnboarding}
                    className="h-8 w-8 rounded-xl text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                  >
                    {sendingOnboarding ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="rounded-xl font-bold text-xs p-2">Send Onboarding Email</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* More Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-slate-400 hover:text-slate-900">
                <MoreHorizontal size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-2xl p-2 shadow-2xl border-none bg-card">
              <DropdownMenuItem onClick={handleSyncToNotion} disabled={syncingNotion} className="rounded-xl py-2 px-4 cursor-pointer flex items-center gap-3">
                {syncingNotion ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} className="text-purple-500" />}
                <span className="font-bold text-xs uppercase tracking-widest">Sync to Notion</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSyncToStripe} disabled={syncingStripe} className="rounded-xl py-2 px-4 cursor-pointer flex items-center gap-3">
                {syncingStripe ? <Loader2 className="animate-spin" size={14} /> : <CreditCard size={14} className="text-blue-500" />}
                <span className="font-bold text-xs uppercase tracking-widest">Sync to Stripe</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem asChild className="rounded-xl py-2 px-4 cursor-pointer flex items-center gap-3">
                <Link to={`/clients/${client.id}`}>
                  <Users size={14} className="text-slate-500" />
                  <span className="font-bold text-xs uppercase tracking-widest">View Profile</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>

      {/* RE-ENGAGEMENT EMAIL DIALOG */}
      <Dialog open={isReengagementEmailModalOpen} onOpenChange={setIsReengagementEmailModalOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-[2.5rem] p-10">
          <DialogHeader>
            <div className="flex items-center gap-4 mb-2">
              <div className="w-14 h-14 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-xl">
                <Mail size={28} />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black">Re-engagement Email</DialogTitle>
                <DialogDescription className="text-base font-medium">
                  3+ month re-introductory offer for {client.name}.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="p-4 bg-rose-50 dark:bg-rose-950/20 rounded-2xl border border-rose-100 dark:border-rose-900/30 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest">Introductory Offer</p>
                <p className="text-lg font-black text-rose-900 dark:text-rose-300">3 sessions for $150 · then ${ongoingRate}/session</p>
              </div>
              <Badge className="bg-rose-600 text-white border-none font-black text-[8px] uppercase tracking-widest px-3 py-1 rounded-full">
                Re-engagement
              </Badge>
            </div>

            <div className="relative">
              <Textarea
                readOnly
                value={reengagementEmailTemplate}
                className="min-h-[280px] rounded-2xl border-2 border-slate-100 bg-slate-50/50 p-6 text-sm font-medium leading-relaxed resize-none"
              />
              <Button
                onClick={handleCopyReengagementEmail}
                className={cn(
                  "absolute bottom-4 right-4 h-10 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-md",
                  copiedReengagementEmail ? "bg-emerald-600 text-white" : "bg-slate-900 text-white hover:bg-slate-800"
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
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-widest px-6"
            >
              {updatingStatus ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 size={16} className="mr-2" />}
              Mark as Contacted
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* RATE INCREASE EMAIL DIALOG */}
      <Dialog open={isEmailModalOpen} onOpenChange={setIsEmailModalOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-[2.5rem] p-10">
          <DialogHeader>
            <div className="flex items-center gap-4 mb-2">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl">
                <MessageSquare size={28} />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black">Rate Increase Notification</DialogTitle>
                <DialogDescription className="text-base font-medium">
                  Personalized email template for {client.name}.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Target Rate</p>
                <p className="text-lg font-black text-indigo-900">${targetRate} / session</p>
              </div>
              <Badge className="bg-indigo-600 text-white border-none font-black text-[8px] uppercase tracking-widest px-3 py-1 rounded-full">
                Effective: {nextMonthName}
              </Badge>
            </div>

            <div className="relative">
              <Textarea
                readOnly
                value={emailTemplate}
                className="min-h-[250px] rounded-2xl border-2 border-slate-100 bg-slate-50/50 p-6 text-sm font-medium leading-relaxed resize-none"
              />
              <Button
                onClick={handleCopyEmail}
                className={cn(
                  "absolute bottom-4 right-4 h-10 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-md",
                  copiedEmail ? "bg-emerald-600 text-white" : "bg-slate-900 text-white hover:bg-slate-800"
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
              onClick={handleMarkContacted} 
              disabled={updatingStatus}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest px-6"
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