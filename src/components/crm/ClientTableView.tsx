 
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Mail,
  Phone,
  CalendarPlus,
  Clock,
  CreditCard,
  Loader2,
  Mic,
  Brain,
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

interface ClientTableViewProps {
  clients: any[];
  isPrivate: boolean;
  onQuickBook: (id: string) => void;
}

const ClientTableView = ({ clients, isPrivate, onQuickBook }: ClientTableViewProps) => {
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
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow className="hover:bg-transparent border-border">
            <TableHead className="font-semibold text-[10px] uppercase tracking-wide text-muted-foreground h-12 px-6">Client Name</TableHead>
            <TableHead className="font-semibold text-[10px] uppercase tracking-wide text-muted-foreground h-12">Age / Sign</TableHead>
            <TableHead className="font-semibold text-[10px] uppercase tracking-wide text-muted-foreground h-12">Rate</TableHead>
            <TableHead className="font-semibold text-[10px] uppercase tracking-wide text-muted-foreground h-12">Last Session</TableHead>
            <TableHead className="font-semibold text-[10px] uppercase tracking-wide text-muted-foreground h-12">Last Contacted</TableHead>
            <TableHead className="font-semibold text-[10px] uppercase tracking-wide text-muted-foreground h-12 text-center">Total</TableHead>
            <TableHead className="font-semibold text-[10px] uppercase tracking-wide text-muted-foreground h-12 text-center">Upcoming</TableHead>
            <TableHead className="font-semibold text-[10px] uppercase tracking-wide text-muted-foreground h-12 text-right px-6">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => {
            const isVoice = client.kind === "voice";
            const profileHref = isVoice ? `/clients/${client.id}/hub` : `/clients/${client.id}`;
            return (
            <TableRow key={client.id} className="hover:bg-primary/5 transition-colors group border-border">
              <TableCell className="px-6 py-4">
                <Link to={profileHref} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold uppercase shrink-0">
                    {client.name.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      {isVoice ? <Mic className="h-3.5 w-3.5 text-chart-destructive shrink-0" /> : <Brain className="h-3.5 w-3.5 text-chart-purple shrink-0" />}
                      <span className={cn(
                        "font-semibold text-foreground text-sm group-hover:text-primary transition-colors",
                        isPrivate && "blur-sm select-none"
                      )}>{client.name}</span>
                      {!isVoice && <IntakeStatusBadge client={client} />}
                      <NewInfoBadge submittedAt={(client as any).onboarding_submitted_at} />
                      {!isVoice && client.stripe_customer_id && (
                        <Badge variant="outline" className="h-4 px-1.5 text-[7px] font-black uppercase border-primary/20 text-primary bg-primary/5">
                          <CreditCard size={8} className="mr-1" /> Synced
                        </Badge>
                      )}
                      {client.lifecycle_status && client.lifecycle_status !== "active" && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span><ClientLifecycleBadge status={client.lifecycle_status} /></span>
                          </TooltipTrigger>
                          <TooltipContent>{client.lifecycle_status_reason}</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    <span className={cn("text-xs text-muted-foreground font-medium", isPrivate && "blur-[2px] select-none")}>{client.email || 'No email recorded'}</span>
                    <ActivityIndicator score={client.activity_score} />
                  </div>
                </Link>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">{client.born ? `${calculateAge(client.born)} yrs` : "-"}</span>
                  {client.born && (
                    <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                      <Clock size={10} /> {getStarSign(client.born)}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {/* Voice pricing is flat per-service, not a per-student rate
                    (see CLAUDE.md) — nothing meaningful to show per row. */}
                {isVoice ? (
                  <span className="text-xs text-muted-foreground">—</span>
                ) : client.standard_rate === 0 ? (
                  <span className="text-sm font-semibold text-chart-emerald">$0 · Free</span>
                ) : client.standard_rate != null ? (
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">${client.standard_rate}</span>
                    {client.target_rate != null && client.target_rate !== client.standard_rate && (
                      <span className="text-[10px] font-medium text-muted-foreground">→ target ${client.target_rate}</span>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">No rate set</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <CalendarPlus size={14} className="text-muted-foreground" />
                  {client.last_session_at ? format(new Date(client.last_session_at), "MMM d, yyyy") : "Never"}
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm font-medium text-muted-foreground">
                  {client.last_contacted_at ? format(new Date(client.last_contacted_at), "MMM d, yyyy") : "Never"}
                </span>
              </TableCell>
              <TableCell className="text-center">
                <div className="inline-flex flex-col items-center px-3 py-1 bg-muted rounded-lg">
                  <span className="font-semibold text-foreground text-sm">{client.session_count}</span>
                  <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wide">Sessions</span>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <div className="inline-flex flex-col items-center px-3 py-1 rounded-lg bg-chart-primary/5">
                  <span className="font-semibold text-chart-primary text-sm">{client.upcoming_count ?? 0}</span>
                  <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wide">Upcoming</span>
                </div>
              </TableCell>
              <TableCell className="text-right px-6">
                <div className="flex items-center justify-end gap-1">
                  {client.email && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-accent" asChild>
                          <a href={`mailto:${client.email}`}><Mail size={16} /></a>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="text-xs">Email Client</TooltipContent>
                    </Tooltip>
                  )}
                  {client.phone && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-accent" asChild>
                          <a href={`tel:${client.phone}`}><Phone size={16} /></a>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="text-xs">Call Client</TooltipContent>
                    </Tooltip>
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
                          {sendingId === client.id ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="text-xs">
                        {sendingId === client.id ? "Sending..." : "Send Onboarding Email"}
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {isVoice ? (
                    // Voice students don't have a `clients` row for
                    // AppointmentForm's client_id FK to attach to — routes
                    // into the Assistant Hub's own booking flow instead,
                    // which auto-sends this prompt straight to a proposed
                    // slot (see AssistantInput's autoSend).
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10" asChild>
                          <Link
                            to={`/clients/${client.id}/hub?prompt=${encodeURIComponent(`Find a good slot and book ${client.name.split(" ")[0]}'s next session — check their availability notes and usual pattern first.`)}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <CalendarPlus size={16} />
                          </Link>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="text-xs">Quick Book (via Assistant)</TooltipContent>
                    </Tooltip>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onQuickBook(client.id); }}
                        >
                          <CalendarPlus size={16} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="text-xs">Quick Book Session</TooltipContent>
                    </Tooltip>
                  )}
                  <Link to={profileHref}>
                    <Button variant="outline" size="sm" className="h-8 rounded-lg font-medium text-xs border-border hover:bg-muted ml-1">View Profile</Button>
                  </Link>
                </div>
              </TableCell>
            </TableRow>
            );
          })}
        </TableBody>
      </Table>
      </div>
    </div>
  );
};

export default ClientTableView;

function ActivityIndicator({ score }: { score?: number }) {
  if (score == null) return null;
  const filled = Math.max(0, Math.min(5, Math.round(score / 20)));
  return (
    <div className="flex items-center gap-1 mt-1" title={`Activity rating ${score}/100`}>
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