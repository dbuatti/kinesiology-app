"use client";

import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format, formatDistanceToNow, differenceInMonths } from "date-fns";
import { 
  Mail, Phone, CalendarPlus, Clock, CreditCard, ArrowRight,
  Check, X, Trash2, Loader2, Send, RefreshCw, AlertTriangle, Flame,
  MoreHorizontal, CalendarPlus as CalendarPlusIcon, Edit2, Users
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
}: ClientRowProps) => {
  const lastSeenText = client.lastSeenDate ? format(client.lastSeenDate, "MMM d, yyyy") : "Never";
  const relativeTime = client.lastSeenDate ? formatDistanceToNow(client.lastSeenDate, { addSuffix: true }) : "";

  const isCustomRate = client.standard_rate !== null && client.standard_rate !== undefined && ![0, 30, 50, 70, 80, 90, 100, 120, 150].includes(client.standard_rate);
  const currentRateValue = isCustomRate ? -1 : (client.standard_rate ?? 50);

  // Rate Tracking & Vision Calculations
  const targetRate = client.target_rate ?? (client.standard_rate ?? 50);
  const rateUpdatedDateStr = client.rate_updated_at;
  
  // Default to 7 months ago if never set, to prompt review for old rates
  const rateUpdatedDate = rateUpdatedDateStr ? new Date(rateUpdatedDateStr) : new Date(Date.now() - 7 * 30 * 24 * 60 * 60 * 1000);
  const monthsSinceUpdate = differenceInMonths(new Date(), rateUpdatedDate);
  const needsReview = monthsSinceUpdate >= 6;

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
      const recencyScore = Math.max(0, 30 - Math.floor((diffDays - 90) / 10));
      score += recencyScore;
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
          </div>
        </div>
      </td>

      {/* Last Seen */}
      <td className="p-4">
        <div className="space-y-1">
          <span className="text-sm font-bold text-foreground">{lastSeenText}</span>
          {relativeTime && (
            <span className="text-xs text-muted-foreground font-medium block">
              {relativeTime}
            </span>
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
        {client.followUpStatus === "Booked" ? (
          <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-none font-bold text-xs px-2.5 py-0.5 rounded-full">
            Booked
          </Badge>
        ) : client.followUpStatus === "Needs Follow-up" ? (
          <Badge className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-none font-bold text-xs px-2.5 py-0.5 rounded-full animate-pulse">
            Needs Follow-up
          </Badge>
        ) : (
          <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-none font-bold text-xs px-2.5 py-0.5 rounded-full">
            No Future Bookings
          </Badge>
        )}
      </td>

      {/* Row Actions */}
      <td className="p-4 pr-6 text-right">
        <div className="flex items-center justify-end gap-2">
          {/* Quick Book */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => { e.stopPropagation(); onQuickBook(client.id); }}
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
    </tr>
  );
};

function CheckSquare({ className, size }: { className?: string; size?: number }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="18" x="3" y="3" rx="2" /><path d="m9 12 2 2 4-4" /></svg>;
}

function Square({ className, size }: { className?: string; size?: number }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="18" x="3" y="3" rx="2" /></svg>;
}