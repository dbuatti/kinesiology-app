 
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  Mail, 
  Phone, 
  CalendarPlus, 
  Clock, 
  CreditCard, 
  Loader2 
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
    <div className="bg-card rounded-[2.5rem] border border-border shadow-xl overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow className="hover:bg-transparent border-border">
            <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground h-14 px-8">Client Name</TableHead>
            <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground h-14">Age / Sign</TableHead>
            <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground h-14">Last Session</TableHead>
            <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground h-14 text-center">Total</TableHead>
            <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground h-14 text-right px-8">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.id} className="hover:bg-primary/5 transition-colors group border-border">
              <TableCell className="px-8 py-5">
                <Link to={`/clients/${client.id}`} className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-rose-400 text-white flex items-center justify-center text-lg font-black uppercase shadow-sm group-hover:scale-105 transition-transform">
                    {client.name.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "font-black text-foreground text-lg group-hover:text-primary transition-colors",
                        isPrivate && "blur-sm select-none"
                      )}>{client.name}</span>
                      <IntakeStatusBadge client={client} />
                      <NewInfoBadge submittedAt={(client as any).onboarding_submitted_at} />
                      {client.stripe_customer_id && (
                        <Badge variant="outline" className="h-4 px-1.5 text-[7px] font-black uppercase border-primary/20 text-primary bg-primary/5">
                          <CreditCard size={8} className="mr-1" /> Synced
                        </Badge>
                      )}
                    </div>
                    <span className={cn("text-xs text-muted-foreground font-medium", isPrivate && "blur-[2px] select-none")}>{client.email || 'No email recorded'}</span>
                  </div>
                </Link>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-foreground">{client.born ? `${calculateAge(client.born)} yrs` : "-"}</span>
                  {client.born && (
                    <span className="text-[10px] font-black text-amber-600 uppercase tracking-wider flex items-center gap-1">
                      <Clock size={10} /> {getStarSign(client.born)}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                  <CalendarPlus size={14} className="text-muted-foreground" />
                  {client.last_session_at ? format(new Date(client.last_session_at), "MMM d, yyyy") : "Never"}
                </div>
              </TableCell>
              <TableCell className="text-center">
                <div className="inline-flex flex-col items-center px-3 py-1 bg-muted rounded-xl border border-border">
                  <span className="font-black text-foreground">{client.session_count}</span>
                  <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Sessions</span>
                </div>
              </TableCell>
              <TableCell className="text-right px-8">
                <div className="flex items-center justify-end gap-2">
                  {client.email && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground hover:text-primary hover:bg-accent" asChild>
                          <a href={`mailto:${client.email}`}><Mail size={18} /></a>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="rounded-xl font-bold text-xs">Email Client</TooltipContent>
                    </Tooltip>
                  )}
                  {client.phone && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground hover:text-primary hover:bg-accent" asChild>
                          <a href={`tel:${client.phone}`}><Phone size={18} /></a>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="rounded-xl font-bold text-xs">Call Client</TooltipContent>
                    </Tooltip>
                  )}
                  {client.email && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-xl text-muted-foreground hover:text-amber-600 hover:bg-amber-500/10"
                          disabled={sendingId === client.id}
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSendOnboarding(client); }}
                        >
                          {sendingId === client.id ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="rounded-xl font-bold text-xs">
                        {sendingId === client.id ? "Sending..." : "Send Onboarding Email"}
                      </TooltipContent>
                    </Tooltip>
                  )}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onQuickBook(client.id); }}
                      >
                        <CalendarPlus size={18} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="rounded-xl font-bold text-xs">Quick Book Session</TooltipContent>
                  </Tooltip>
                  <Link to={`/clients/${client.id}`}>
                    <Button variant="outline" size="sm" className="rounded-xl font-black text-[10px] uppercase tracking-widest border-border hover:bg-card hover:shadow-md ml-2">View Profile</Button>
                  </Link>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ClientTableView;