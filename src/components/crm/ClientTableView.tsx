"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  Mail, 
  Phone, 
  CalendarPlus, 
  ArrowRight 
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { calculateAge, getStarSign } from "@/utils/crm-utils";
import { cn } from "@/lib/utils";

interface ClientTableViewProps {
  clients: any[];
  isPrivate: boolean;
  onQuickBook: (id: string) => void;
}

const ClientTableView = ({ clients, isPrivate, onQuickBook }: ClientTableViewProps) => {
  return (
    <div className="border border-border bg-background">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-border">
            <TableHead className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground h-14 px-8">Client Name</TableHead>
            <TableHead className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground h-14">Age / Sign</TableHead>
            <TableHead className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground h-14">Last Session</TableHead>
            <TableHead className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground h-14 text-center">Total</TableHead>
            <TableHead className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground h-14 text-right px-8">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.id} className="hover:bg-muted transition-colors group border-border">
              <TableCell className="px-8 py-6">
                <Link to={`/clients/${client.id}`} className="flex items-center gap-4">
                  <div className="w-10 h-10 border border-border flex items-center justify-center text-sm font-bold text-primary uppercase">
                    {client.name.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "font-bold text-foreground text-base uppercase tracking-tight group-hover:text-primary transition-colors",
                        isPrivate && "blur-sm select-none"
                      )}>{client.name}</span>
                      {client.stripe_customer_id && (
                        <span className="px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-widest border border-primary text-primary">
                          Synced
                        </span>
                      )}
                    </div>
                    <span className={cn("text-[10px] text-muted-foreground font-bold uppercase tracking-widest", isPrivate && "blur-[2px] select-none")}>{client.email || 'No email recorded'}</span>
                  </div>
                </Link>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-foreground">{client.born ? `${calculateAge(client.born)} YRS` : "-"}</span>
                  {client.born && (
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      {getStarSign(client.born).toUpperCase()}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm font-bold text-muted-foreground uppercase tracking-tight">
                  {client.last_session_at ? format(new Date(client.last_session_at), "MMM D, YYYY").toUpperCase() : "NEVER"}
                </div>
              </TableCell>
              <TableCell className="text-center">
                <div className="inline-flex flex-col items-center px-3 py-1 border border-border">
                  <span className="font-bold text-foreground">{client.session_count}</span>
                  <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Sessions</span>
                </div>
              </TableCell>
              <TableCell className="text-right px-8">
                <div className="flex items-center justify-end gap-4">
                  {client.email && (
                    <a href={`mailto:${client.email}`} className="text-muted-foreground hover:text-primary transition-colors">
                      <Mail size={16} />
                    </a>
                  )}
                  {client.phone && (
                    <a href={`tel:${client.phone}`} className="text-muted-foreground hover:text-primary transition-colors">
                      <Phone size={16} />
                    </a>
                  )}
                  <button 
                    className="text-muted-foreground hover:text-primary transition-colors"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onQuickBook(client.id); }}
                  >
                    <CalendarPlus size={16} />
                  </button>
                  <Link to={`/clients/${client.id}`}>
                    <Button variant="outline" size="sm" className="font-bold text-[10px] uppercase tracking-widest border-border hover:bg-muted">View Profile</Button>
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