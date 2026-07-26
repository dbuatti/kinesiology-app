 
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  Mail, 
  Phone, 
  CalendarPlus, 
  Clock, 
  CreditCard, 
  ArrowRight,
  FlaskConical,
  Activity,
  Loader2
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {clients.map((client) => (
        <Card 
          key={client.id} 
          className="hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-none shadow-lg rounded-[2rem] overflow-hidden group cursor-pointer bg-card h-full"
          onClick={() => navigate(`/clients/${client.id}`)}
        >
          <CardContent className="p-8 space-y-6">
            <div className="flex items-start justify-between">
              <div className="w-16 h-16 rounded-[1.5rem] bg-primary text-primary-foreground flex items-center justify-center text-2xl font-black uppercase shadow-xl shadow-primary/10 group-hover:scale-110 transition-transform">
                {client.name.charAt(0)}
              </div>
              <div className="flex flex-col items-end">
                <Badge className="bg-chart-emerald/10 text-chart-emerald border-none font-black text-[10px] uppercase tracking-widest mb-2">
                  {client.session_count} Sessions
                </Badge>
                <div className="flex items-center gap-1 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  <Clock size={12} /> {client.last_session_at ? format(new Date(client.last_session_at), "MMM d") : "Never"}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className={cn(
                  "text-2xl font-black text-foreground group-hover:text-primary transition-colors truncate",
                  isPrivate && "blur-sm select-none"
                )}>{client.name}</h3>
                <IntakeStatusBadge client={client} />
                <NewInfoBadge submittedAt={(client as any).onboarding_submitted_at} />
                {client.stripe_customer_id && (
                  <Badge variant="outline" className="h-4 px-1.5 text-[7px] font-black uppercase border-primary/20 text-primary bg-primary/5">
                    <CreditCard size={8} className="mr-1" /> Synced
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                {client.born && <span>{calculateAge(client.born)} yrs • {getStarSign(client.born)}</span>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className={cn(
                "p-3 rounded-2xl border flex flex-col items-center text-center",
                client.latest_bolt === null ? "bg-muted/30 border-border" : (client.latest_bolt >= 25 ? "bg-chart-emerald/10 border-chart-emerald/20" : "bg-destructive/10 border-destructive/20")
              )}>
                <FlaskConical size={14} className={cn("mb-1.5", client.latest_bolt === null ? "text-muted-foreground" : (client.latest_bolt >= 25 ? "text-chart-emerald" : "text-destructive"))} />
                <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Latest BOLT</p>
                <p className="text-lg font-black">{client.latest_bolt !== null ? `${client.latest_bolt}s` : "—"}</p>
              </div>
              <div className="p-3 rounded-2xl border border-border bg-muted/30 flex flex-col items-center text-center">
                <Activity size={14} className="mb-1 text-primary" />
                <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Sessions</p>
                <p className="text-lg font-black">{client.session_count}</p>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-border">
              {client.email && (
                <div className="flex items-center justify-between group/contact">
                  <div className={cn("flex items-center gap-3 text-xs font-bold text-muted-foreground", isPrivate && "blur-[2px] select-none")}>
                    <Mail size={14} className="text-muted-foreground" /> {client.email}
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg opacity-0 group-hover/contact:opacity-100 transition-opacity" asChild onClick={(e) => e.stopPropagation()}>
                    <a href={`mailto:${client.email}`}><ArrowRight size={12} className="-rotate-45" /></a>
                  </Button>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center justify-between group/contact">
                  <div className={cn("flex items-center gap-3 text-xs font-bold text-muted-foreground", isPrivate && "blur-[2px] select-none")}>
                    <Phone size={14} className="text-muted-foreground" /> {client.phone}
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg opacity-0 group-hover/contact:opacity-100 transition-opacity" asChild onClick={(e) => e.stopPropagation()}>
                    <a href={`tel:${client.phone}`}><ArrowRight size={12} className="-rotate-45" /></a>
                  </Button>
                </div>
              )}
            </div>

            <div className="pt-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-0 text-primary font-black text-[10px] uppercase tracking-widest hover:bg-transparent"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onQuickBook(client.id); }}
                >
                  <CalendarPlus size={14} className="mr-2" /> Quick Book
                </Button>
                {client.email && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-xl text-muted-foreground hover:text-amber-600 hover:bg-amber-500/10"
                        disabled={sendingId === client.id}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSendOnboarding(client); }}
                      >
                        {sendingId === client.id ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="rounded-xl font-bold text-xs">
                      {sendingId === client.id ? "Sending..." : "Send Onboarding Email"}
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all shrink-0">
                <ArrowRight size={16} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ClientGridView;