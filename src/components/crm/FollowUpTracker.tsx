"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CalendarClock, 
  History, 
  CalendarPlus, 
  ArrowRight,
  Clock,
  AlertCircle,
  CheckCircle2,
  User
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, differenceInDays, isAfter, isBefore } from 'date-fns';
import { cn } from '@/lib/utils';

interface FollowUpTrackerProps {
  clients: any[];
}

const FollowUpTracker = ({ clients }: FollowUpTrackerProps) => {
  const now = new Date();

  const clientsNeedingFollowUp = useMemo(() => {
    return clients.map(client => {
      const apps = client.appointments || [];
      const pastApps = apps.filter((a: any) => isBefore(new Date(a.date), now))
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      const futureApps = apps.filter((a: any) => isAfter(new Date(a.date), now));
      
      const lastApp = pastApps[0] || null;
      const hasFuture = futureApps.length > 0;
      
      // Only track if they've seen us in the last 30 days but have no future booking
      const isRecent = lastApp && differenceInDays(now, new Date(lastApp.date)) <= 30;

      return {
        ...client,
        lastApp,
        hasFuture,
        isRecent,
        daysSinceLast: lastApp ? differenceInDays(now, new Date(lastApp.date)) : null
      };
    }).filter(c => c.isRecent && !c.hasFuture)
      .sort((a, b) => (a.daysSinceLast || 0) - (b.daysSinceLast || 0));
  }, [clients]);

  if (clientsNeedingFollowUp.length === 0) {
    return (
      <Card className="border-none shadow-lg rounded-[2.5rem] bg-indigo-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-10"><CheckCircle2 size={120} /></div>
        <CardContent className="p-10 text-center space-y-4 relative z-10">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto border border-white/20">
            <CheckCircle2 size={32} className="text-emerald-400" />
          </div>
          <h3 className="text-xl font-black">Retention: Optimal</h3>
          <p className="text-indigo-200 font-medium">All recent clients have future sessions scheduled.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-lg rounded-[2.5rem] bg-card overflow-hidden">
      <CardHeader className="p-8 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl font-black flex items-center gap-3">
              <CalendarClock size={24} className="text-rose-500" /> Follow-up Tracker
            </CardTitle>
            <CardDescription className="font-medium">Recent clients (last 30 days) with no future sessions booked.</CardDescription>
          </div>
          <Badge className="bg-rose-500 text-white border-none font-black text-[10px] uppercase tracking-widest px-3 py-1">
            {clientsNeedingFollowUp.length} Pending
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
          {clientsNeedingFollowUp.map((client) => (
            <div key={client.id} className="p-6 border-b border-border hover:bg-muted/20 transition-colors flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 flex items-center justify-center font-black">
                  {client.name.charAt(0)}
                </div>
                <div>
                  <p className="font-black text-foreground group-hover:text-rose-600 transition-colors">{client.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                      <History size={12} /> Last: {format(new Date(client.lastApp.date), "MMM d")}
                    </span>
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md",
                      client.daysSinceLast! > 14 ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600"
                    )}>
                      {client.daysSinceLast} Days Ago
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link to={`/clients/${client.id}?tab=appointments`}>
                  <Button variant="outline" size="sm" className="rounded-xl h-9 border-border font-bold text-[10px] uppercase tracking-widest">
                    <CalendarPlus size={14} className="mr-2" /> Book
                  </Button>
                </Link>
                <Link to={`/clients/${client.id}`}>
                  <Button variant="ghost" size="icon" className="rounded-xl hover:bg-rose-50 hover:text-rose-600">
                    <ArrowRight size={18} />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default FollowUpTracker;