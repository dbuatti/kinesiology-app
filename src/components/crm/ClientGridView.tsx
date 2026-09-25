
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Mail,
  Phone,
  CalendarPlus,
  Clock,
  CreditCard,
  ArrowRight,
  Activity,
  Loader2,
  Mic,
  Brain,
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import { calculateAge, getStarSign } from "@/utils/crm-utils";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import NewInfoBadge from "@/components/crm/NewInfoBadge";
import { IntakeStatusBadge } from "@/components/crm/IntakeStatusBadge";
import ClientLifecycleBadge from "@/components/crm/ClientLifecycleBadge";

interface ClientGridViewProps {
  clients: any[];
  isPrivate: boolean;
  onQuickBook: (id: string) => void;
}

const ClientGridView = ({ clients, isPrivate, onQuickBook }: ClientGridViewProps) => {
  const navigate = useNavigate();
  const [sendingId, setSendingId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSendOnboarding = async (client: any) => {
    if (!client.email) {
      toast({ title: "Error", description: "Client has no email address.", variant: "destructive" });
      return;
    }
    setSendingId(client.id);
    try {
      const { error } = await supabase.functions.invoke('send-manual-onboarding', {
        body: { clientId: client.id, force: true }
      });
      if (error) throw error;
      toast({ title: "Onboarding email sent", description: `Email sent to ${client.name}.` });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message || "Failed to send onboarding email.", variant: "destructive" });
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {clients.map((client) => {
        const isVoice = client.kind === "voice";
        const profileHref = isVoice ? `/clients/${client.id}/hub` : `/clients/${client.id}`;
        return (
        <Card
          key={client.id}
          className="hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border border-border shadow-sm rounded-2xl overflow-hidden group cursor-pointer bg-card h-full"
          onClick={() => navigate(profileHref)}
        >
          <CardContent className="p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-semibold uppercase shrink-0">
                {client.name.charAt(0)}
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1.5">
                  <Badge className="bg-chart-emerald/10 text-chart-emerald border-none font-medium text-[10px]">
                    {client.session_count} sessions
                  </Badge>
                  {(client.upcoming_count ?? 0) > 0 && (
                    <Badge className="bg-chart-primary/10 text-chart-primary border-none font-medium text-[10px]">
                      {client.upcoming_count} upcoming
                    </Badge>
                  )}
                </div>
                {client.lifecycle_status && client.lifecycle_status !== "active" && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span><ClientLifecycleBadge status={client.lifecycle_status} /></span>
                    </TooltipTrigger>
                    <TooltipContent>{client.lifecycle_status_reason}</TooltipContent>
                  </Tooltip>
                )}
                <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                  <Clock size={11} /> {client.last_session_at ? format(new Date(client.last_session_at), "MMM d") : "Never"}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {isVoice ? <Mic className="h-3.5 w-3.5 text-chart-destructive shrink-0" /> : <Brain className="h-3.5 w-3.5 text-chart-purple shrink-0" />}
                <h3 className={cn(
                  "text-lg font-semibold text-foreground group-hover:text-primary transition-colors truncate",
                  isPrivate && "blur-sm select-none"
                )}>{client.name}</h3>
                {!isVoice && <IntakeStatusBadge client={client} />}
                <NewInfoBadge submittedAt={(client as any).onboarding_submitted_at} />
                {!isVoice && client.stripe_customer_id && (
                  <Badge variant="outline" className="h-4 px-1.5 text-[7px] font-medium uppercase border-primary/20 text-primary bg-primary/5">
                    <CreditCard size={8} className="mr-1" /> Synced
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                {client.born && <span>{calculateAge(client.born)} yrs · {getStarSign(client.born)}</span>}
              </div>
              {/* Voice pricing is flat per-service, not a per-student rate
                  (see CLAUDE.md) — nothing meaningful to show per row. */}
              {!isVoice && (
                <div className="flex items-center gap-1 text-xs font-medium">
                  {client.standard_rate === 0 ? (
                    <span className="text-chart-emerald font-semibold">$0 · Free</span>
                  ) : client.standard_rate != null ? (
                    <span className="text-foreground font-semibold">${client.standard_rate}</span>
                  ) : (
                    <span className="text-muted-foreground">No rate set</span>
                  )}
                  {client.target_rate != null && client.target_rate !== client.standard_rate && (
                    <span className="text-muted-foreground">→ target ${client.target_rate}</span>
                  )}
                </div>
              )}
              <div className="pt-2">
                <ActivityIndicator score={client.activity_score} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Last Contacted, not Latest BOLT — BOLT is kinesiology-only
                  clinical data (always "—" for voice, dead space), and this
                  business-relationship list benefits more from "have I
                  actually reached out" than a clinical assessment score,
                  which still lives in full on the Clinical Profile. */}
              <div className="p-2.5 rounded-xl border border-border bg-muted/30 flex flex-col items-center text-center">
                <Mail size={13} className="mb-1 text-muted-foreground" />
                <p className="text-[10px] font-medium uppercase tracking-wide opacity-60">Last Contacted</p>
                <p className="text-base font-semibold">{client.last_contacted_at ? format(new Date(client.last_contacted_at), "MMM d") : "Never"}</p>
              </div>
              <div className="p-2.5 rounded-xl border border-border bg-muted/30 flex flex-col items-center text-center">
                <Activity size={13} className="mb-1 text-primary" />
                <p className="text-[10px] font-medium uppercase tracking-wide opacity-60">Sessions</p>
                <p className="text-base font-semibold">{client.session_count}</p>
              </div>
            </div>

            <div className="space-y-2.5 pt-3 border-t border-border">
              {client.email && (
                <div className="flex items-center justify-between group/contact">
                  <div className={cn("flex items-center gap-2.5 text-xs font-medium text-muted-foreground min-w-0 truncate", isPrivate && "blur-[2px] select-none")}>
                    <Mail size={13} className="text-muted-foreground shrink-0" /> <span className="truncate">{client.email}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg opacity-0 group-hover/contact:opacity-100 transition-opacity shrink-0" asChild onClick={(e) => e.stopPropagation()}>
                    <a href={`mailto:${client.email}`}><ArrowRight size={12} className="-rotate-45" /></a>
                  </Button>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center justify-between group/contact">
                  <div className={cn("flex items-center gap-2.5 text-xs font-medium text-muted-foreground", isPrivate && "blur-[2px] select-none")}>
                    <Phone size={13} className="text-muted-foreground" /> {client.phone}
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg opacity-0 group-hover/contact:opacity-100 transition-opacity" asChild onClick={(e) => e.stopPropagation()}>
                    <a href={`tel:${client.phone}`}><ArrowRight size={12} className="-rotate-45" /></a>
                  </Button>
                </div>
              )}
            </div>

            <div className="pt-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                {isVoice ? (
                  // Voice students don't have a `clients` row for
                  // AppointmentForm's client_id FK to attach to — routes
                  // into the Assistant Hub's own booking flow instead,
                  // which auto-sends this prompt straight to a proposed
                  // slot (see AssistantInput's autoSend).
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-2 h-8 text-primary font-medium text-xs hover:bg-primary/5"
                    asChild
                  >
                    <Link
                      to={`/clients/${client.id}/hub?prompt=${encodeURIComponent(`Find a good slot and book ${client.name.split(" ")[0]}'s next session — check their availability notes and usual pattern first.`)}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <CalendarPlus size={14} className="mr-1.5" /> Quick Book
                    </Link>
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-2 h-8 text-primary font-medium text-xs hover:bg-primary/5"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onQuickBook(client.id); }}
                  >
                    <CalendarPlus size={14} className="mr-1.5" /> Quick Book
                  </Button>
                )}
                {!isVoice && client.email && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-amber-600 hover:bg-amber-500/10"
                        disabled={sendingId === client.id}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSendOnboarding(client); }}
                      >
                        {sendingId === client.id ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs">
                      {sendingId === client.id ? "Sending..." : "Send Onboarding Email"}
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all shrink-0">
                <ArrowRight size={14} />
              </div>
            </div>
          </CardContent>
        </Card>
        );
      })}
    </div>
  );
};

export default ClientGridView;

function ActivityIndicator({ score }: { score?: number }) {
  if (score == null) return null;
  const filled = Math.max(0, Math.min(5, Math.round(score / 20)));
  return (
    <div className="flex items-center gap-1" title={`Activity rating ${score}/100`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className={cn(
            "w-2 h-2 rounded-full",
            i < filled
              ? i >= 4
                ? "bg-chart-emerald"
                : i >= 3
                  ? "bg-chart-primary"
                  : "bg-amber-500"
              : "bg-muted"
          )}
        />
      ))}
    </div>
  );
}
