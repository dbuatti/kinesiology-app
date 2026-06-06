
import React from 'react';
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
  Activity
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { calculateAge, getStarSign } from "@/utils/crm-utils";
import { cn } from "@/lib/utils";

interface ClientGridViewProps {
  clients: any[];
  isPrivate: boolean;
  onQuickBook: (id: string) => void;
}

const ClientGridView = ({ clients, isPrivate, onQuickBook }: ClientGridViewProps) => {
  const navigate = useNavigate();

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
              <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-600 text-white flex items-center justify-center text-2xl font-black uppercase shadow-xl shadow-indigo-100 dark:shadow-indigo-900/20 group-hover:scale-110 transition-transform">
                {client.name.charAt(0)}
              </div>
              <div className="flex flex-col items-end">
                <Badge className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-none font-black text-[10px] uppercase tracking-widest mb-2">
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
                  "text-2xl font-black text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate",
                  isPrivate && "blur-sm select-none"
                )}>{client.name}</h3>
                {client.stripe_customer_id && (
                  <Badge variant="outline" className="h-4 px-1.5 text-[7px] font-black uppercase border-blue-200 text-blue-600 bg-blue-50">
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
                client.latest_bolt === null ? "bg-muted/30 border-border" : (client.latest_bolt >= 25 ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30" : "bg-rose-100 dark:bg-rose-900/30 border-rose-200 dark:border-rose-900/50")
              )}>
                <FlaskConical size={14} className={cn("mb-1.5", client.latest_bolt === null ? "text-muted-foreground" : (client.latest_bolt >= 25 ? "text-emerald-600" : "text-rose-600"))} />
                <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Latest BOLT</p>
                <p className="text-lg font-black">{client.latest_bolt !== null ? `${client.latest_bolt}s` : "—"}</p>
              </div>
              <div className="p-3 rounded-2xl border border-border bg-muted/30 flex flex-col items-center text-center">
                <Activity size={14} className="mb-1 text-indigo-500" />
                <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Sessions</p>
                <p className="text-lg font-black">{client.session_count}</p>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-border">
              {client.email && (
                <div className="flex items-center justify-between group/contact">
                  <div className={cn("flex items-center gap-3 text-xs font-bold text-muted-foreground", isPrivate && "blur-[2px] select-none")}>
                    <Mail size={14} className="text-indigo-400" /> {client.email}
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg opacity-0 group-hover/contact:opacity-100 transition-opacity" asChild onClick={(e) => e.stopPropagation()}>
                    <a href={`mailto:${client.email}`}><ArrowRight size={12} className="-rotate-45" /></a>
                  </Button>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center justify-between group/contact">
                  <div className={cn("flex items-center gap-3 text-xs font-bold text-muted-foreground", isPrivate && "blur-[2px] select-none")}>
                    <Phone size={14} className="text-indigo-400" /> {client.phone}
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg opacity-0 group-hover/contact:opacity-100 transition-opacity" asChild onClick={(e) => e.stopPropagation()}>
                    <a href={`tel:${client.phone}`}><ArrowRight size={12} className="-rotate-45" /></a>
                  </Button>
                </div>
              )}
            </div>

            <div className="pt-4 flex items-center justify-between">
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-0 text-indigo-600 dark:text-indigo-400 font-black text-[10px] uppercase tracking-widest hover:bg-transparent"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onQuickBook(client.id); }}
              >
                <CalendarPlus size={14} className="mr-2" /> Quick Book
              </Button>
              <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
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