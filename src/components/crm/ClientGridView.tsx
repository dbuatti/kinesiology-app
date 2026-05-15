"use client";

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border border-border">
      {clients.map((client) => (
        <div 
          key={client.id} 
          className="p-8 border-r border-b border-border last:border-r-0 hover:bg-muted transition-colors group cursor-pointer bg-background flex flex-col h-full"
          onClick={() => navigate(`/clients/${client.id}`)}
        >
          <div className="flex items-start justify-between mb-8">
            <div className="w-12 h-12 border border-border flex items-center justify-center text-xl font-bold text-primary uppercase">
              {client.name.charAt(0)}
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="bg-success text-success-foreground px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest">
                {client.session_count} Sessions
              </span>
              <div className="flex items-center gap-1 text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
                <Clock size={10} /> {client.last_session_at ? format(new Date(client.last_session_at), "MMM D").toUpperCase() : "NEVER"}
              </div>
            </div>
          </div>

          <div className="space-y-1 mb-8">
            <div className="flex items-center gap-2">
              <h3 className={cn(
                "text-xl font-medium uppercase tracking-tight group-hover:text-primary transition-colors truncate",
                isPrivate && "blur-sm select-none"
              )}>{client.name}</h3>
              {client.stripe_customer_id && (
                <span className="px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-widest border border-primary text-primary">
                  Synced
                </span>
              )}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {client.born && <span>{calculateAge(client.born)} YRS • {getStarSign(client.born).toUpperCase()}</span>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-0 border border-border mb-8">
            <div className={cn(
              "p-4 border-r border-border flex flex-col items-center text-center",
              client.latest_bolt === null ? "bg-background" : (client.latest_bolt >= 25 ? "bg-success/10" : "bg-destructive/10")
            )}>
              <FlaskConical size={14} className={cn("mb-2", client.latest_bolt === null ? "text-muted-foreground" : (client.latest_bolt >= 25 ? "text-success" : "text-destructive"))} />
              <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Latest BOLT</p>
              <p className="text-lg font-bold">{client.latest_bolt !== null ? `${client.latest_bolt}S` : "—"}</p>
            </div>
            <div className="p-4 flex flex-col items-center text-center">
              <Activity size={14} className="mb-2 text-primary" />
              <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Sessions</p>
              <p className="text-lg font-bold">{client.session_count}</p>
            </div>
          </div>

          <div className="space-y-4 pt-8 border-t border-border mt-auto">
            {client.email && (
              <div className={cn("flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground", isPrivate && "blur-[2px] select-none")}>
                <Mail size={12} className="text-primary" /> {client.email}
              </div>
            )}
            {client.phone && (
              <div className={cn("flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground", isPrivate && "blur-[2px] select-none")}>
                <Phone size={12} className="text-primary" /> {client.phone}
              </div>
            )}
          </div>

          <div className="pt-8 flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-0 text-primary font-bold text-[10px] uppercase tracking-widest hover:bg-transparent"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onQuickBook(client.id); }}
            >
              <CalendarPlus size={14} className="mr-2" /> Quick Book
            </Button>
            <ArrowRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default ClientGridView;