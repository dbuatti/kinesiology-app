"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft,
  Info,
  User,
  CalendarDays,
  Plus,
  ArrowRight,
  HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Client, Appointment } from "@/types/crm";
import { Link } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ClientWithAppointments extends Client {
  appointments: Appointment[];
  lastSeenDate: Date | null;
  preferredTimeAnalyzed: { text: string; isLowData: boolean };
  followUpStatus: "Booked" | "Needs Follow-up" | "No Future Bookings";
}

interface TimetableVisualizerProps {
  clients: ClientWithAppointments[];
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const TIME_SLOTS = ["09:00", "11:00", "13:00", "15:00", "17:00"];

const TIME_LABELS: Record<string, string> = {
  "09:00": "9:00 AM",
  "11:00": "11:00 AM",
  "13:00": "1:00 PM",
  "15:00": "3:00 PM",
  "17:00": "5:00 PM"
};

// Helper to parse preferred time string
function parsePreferredTime(timeStr: string | null | undefined) {
  if (!timeStr || timeStr === "No data") return null;
  const lower = timeStr.toLowerCase();
  let day: string | null = null;
  
  for (const d of DAYS) {
    if (lower.includes(d.toLowerCase())) {
      day = d;
      break;
    }
  }

  if (!day) return null;

  // Default to 10:00 AM if no hour found, map to closest slot
  let hour = 10; 
  const hourMatch = lower.match(/(\d+):(\d+)\s*(am|pm)/i) || lower.match(/(\d+)\s*(am|pm)/i);
  if (hourMatch) {
    let h = parseInt(hourMatch[1]);
    const ampm = (hourMatch[3] || hourMatch[2] || "").toLowerCase();
    if (ampm === 'pm' && h !== 12) h += 12;
    if (ampm === 'am' && h === 12) h = 0;
    hour = h;
  }

  // Map to closest standard slot
  let closestSlot = "11:00";
  let minDiff = Infinity;
  TIME_SLOTS.forEach(slot => {
    const slotHour = parseInt(slot.split(':')[0]);
    const diff = Math.abs(slotHour - hour);
    if (diff < minDiff) {
      minDiff = diff;
      closestSlot = slot;
    }
  });

  return { day, slot: closestSlot };
}

const TimetableVisualizer = ({ clients }: TimetableVisualizerProps) => {
  const [activeWeek, setActiveWeek] = useState<1 | 2>(1);

  // Filter to active clients (seen in last 30 days / last month) to keep the timetable relevant
  const activeClients = useMemo(() => {
    const now = new Date();
    return clients.filter(c => {
      if (!c.lastSeenDate) return false;
      const diffDays = (now.getTime() - c.lastSeenDate.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays <= 30;
    });
  }, [clients]);

  // Map clients to their preferred slots and regularity
  const scheduledData = useMemo(() => {
    const grid: Record<string, { clients: ClientWithAppointments[]; hasConflict: boolean }> = {};
    const unscheduled: ClientWithAppointments[] = [];
    const conflictsList: { day: string; slot: string; clients: ClientWithAppointments[] }[] = [];

    // Initialize grid
    for (const week of [1, 2]) {
      for (const day of DAYS) {
        for (const slot of TIME_SLOTS) {
          grid[`${week}-${day}-${slot}`] = { clients: [], hasConflict: false };
        }
      }
    }

    activeClients.forEach(client => {
      const prefTimeText = client.preferred_time || client.preferredTimeAnalyzed.text;
      const parsed = parsePreferredTime(prefTimeText);

      if (!parsed) {
        unscheduled.push(client);
        return;
      }

      // Determine regularity / frequency
      const recentAppsCount = client.appointments.filter(app => {
        const appDate = new Date(app.date);
        const diffDays = (new Date().getTime() - appDate.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays >= 0 && diffDays <= 90;
      }).length;

      const isWeekly = recentAppsCount >= 8; // ~weekly if 8+ sessions in 90 days
      const isFortnightly = recentAppsCount >= 4 && recentAppsCount < 8; // ~fortnightly if 4-7 sessions

      // Assign to weeks
      if (isWeekly) {
        grid[`1-${parsed.day}-${parsed.slot}`].clients.push(client);
        grid[`2-${parsed.day}-${parsed.slot}`].clients.push(client);
      } else if (isFortnightly) {
        // Fortnightly clients go to Week 1
        grid[`1-${parsed.day}-${parsed.slot}`].clients.push(client);
      } else {
        // Monthly or less frequent go to Week 2 to balance load
        grid[`2-${parsed.day}-${parsed.slot}`].clients.push(client);
      }
    });

    // Detect conflicts
    for (const week of [1, 2]) {
      for (const day of DAYS) {
        for (const slot of TIME_SLOTS) {
          const key = `${week}-${day}-${slot}`;
          if (grid[key].clients.length > 1) {
            grid[key].hasConflict = true;
            conflictsList.push({
              day: `${day} (Week ${week})`,
              slot: TIME_LABELS[slot],
              clients: grid[key].clients
            });
          }
        }
      }
    }

    return { grid, unscheduled, conflictsList };
  }, [activeClients]);

  // Generate smart suggestions based on conflicts and capacity
  const suggestions = useMemo(() => {
    const list: string[] = [];
    
    // 1. Handle direct slot conflicts
    scheduledData.conflictsList.forEach(conflict => {
      const names = conflict.clients.map(c => c.name).join(" and ");
      list.push(
        `Conflict on ${conflict.day} at ${conflict.slot}: ${names} both prefer this slot. Suggestion: Move one client to an adjacent open slot.`
      );
    });

    // 2. Analyze day-by-day capacity
    DAYS.forEach(day => {
      let dayTotal = 0;
      for (const week of [1, 2]) {
        for (const slot of TIME_SLOTS) {
          dayTotal += scheduledData.grid[`${week}-${day}-${slot}`].clients.length;
        }
      }

      // If a single day has more than 6 bookings across the fortnight, suggest opening another day
      if (dayTotal > 6) {
        const alternativeDay = day === "Monday" || day === "Tuesday" ? "Thursday" : "Wednesday";
        list.push(
          `High Load on ${day}s: You have ${dayTotal} sessions scheduled on ${day}s across the fortnight. Suggestion: Open up slots on ${alternativeDay}s to distribute the load.`
        );
      }
    });

    // 3. Unscheduled clients warning
    if (scheduledData.unscheduled.length > 0) {
      list.push(
        `Unscheduled Clients: ${scheduledData.unscheduled.length} active clients have no preferred time slot recorded. Suggestion: Update their profiles with preferred times to optimize your calendar.`
      );
    }

    return list;
  }, [scheduledData]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header & Week Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-6 rounded-[2rem] border border-border shadow-sm">
        <div className="space-y-1">
          <h3 className="text-xl font-black text-foreground flex items-center gap-2">
            <CalendarDays className="text-indigo-600" size={22} />
            Supposed Timetable
          </h3>
          <p className="text-xs text-muted-foreground font-medium">
            A simulated 2-week block based on active clients seen within the last month, their preferred times, and session regularity.
          </p>
        </div>

        <div className="flex bg-muted p-1 rounded-xl shrink-0">
          <Button 
            variant={activeWeek === 1 ? 'default' : 'ghost'} 
            size="sm" 
            onClick={() => setActiveWeek(1)}
            className={cn(
              "rounded-lg h-9 px-6 font-bold text-xs uppercase tracking-widest",
              activeWeek === 1 ? "bg-card text-indigo-600 shadow-sm" : "text-muted-foreground"
            )}
          >
            Week 1
          </Button>
          <Button 
            variant={activeWeek === 2 ? 'default' : 'ghost'} 
            size="sm" 
            onClick={() => setActiveWeek(2)}
            className={cn(
              "rounded-lg h-9 px-6 font-bold text-xs uppercase tracking-widest",
              activeWeek === 2 ? "bg-card text-indigo-600 shadow-sm" : "text-muted-foreground"
            )}
          >
            Week 2
          </Button>
        </div>
      </div>

      {/* Smart Suggestions & Capacity Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          {/* Timetable Grid */}
          <div className="bg-card rounded-[2.5rem] border border-border shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="p-4 pl-6 font-black text-[10px] uppercase tracking-widest text-muted-foreground w-24">Time</th>
                    {DAYS.map(day => (
                      <th key={day} className="p-4 font-black text-[10px] uppercase tracking-widest text-muted-foreground text-center">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {TIME_SLOTS.map(slot => (
                    <tr key={slot} className="hover:bg-muted/5 transition-colors">
                      <td className="p-4 pl-6 font-black text-xs text-muted-foreground bg-muted/10">
                        {TIME_LABELS[slot]}
                      </td>
                      {DAYS.map(day => {
                        const key = `${activeWeek}-${day}-${slot}`;
                        const cell = scheduledData.grid[key];
                        const hasClients = cell.clients.length > 0;

                        return (
                          <td 
                            key={day} 
                            className={cn(
                              "p-3 text-center border-r border-border/20 last:border-r-0 min-w-[140px] h-24 vertical-top",
                              cell.hasConflict ? "bg-rose-50/30 dark:bg-rose-950/10" : ""
                            )}
                          >
                            {hasClients ? (
                              <div className="space-y-1.5">
                                {cell.clients.map(client => (
                                  <Link 
                                    key={client.id} 
                                    to={`/clients/${client.id}`}
                                    className={cn(
                                      "block p-2 rounded-xl text-xs font-bold border transition-all hover:scale-[1.02] truncate",
                                      cell.hasConflict 
                                        ? "bg-rose-100 text-rose-700 border-rose-200" 
                                        : "bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900/30"
                                    )}
                                    title={`${client.name} (${client.preferred_time || client.preferredTimeAnalyzed.text})`}
                                  >
                                    {client.name}
                                  </Link>
                                ))}
                                {cell.hasConflict && (
                                  <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-rose-600 bg-rose-100 px-2 py-0.5 rounded-md">
                                    <AlertTriangle size={10} /> Conflict
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-300 dark:text-slate-800 uppercase tracking-widest">
                                Open
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar: Suggestions & Unscheduled */}
        <div className="lg:col-span-4 space-y-6">
          {/* Suggestions Card */}
          <Card className="border-none shadow-lg rounded-[2rem] bg-slate-900 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-6 opacity-10"><Sparkles size={100} /></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                <Sparkles size={16} /> Optimization Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              {suggestions.length > 0 ? (
                <div className="space-y-3">
                  {suggestions.map((s, idx) => (
                    <div key={idx} className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-start gap-3">
                      <Info size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-300 font-medium leading-relaxed">
                        {s}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 space-y-3">
                  <CheckCircle2 className="mx-auto text-emerald-400" size={32} />
                  <p className="text-xs font-bold text-slate-300">Schedule is fully optimized!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Unscheduled Clients */}
          <Card className="border-none shadow-lg rounded-[2rem] bg-card overflow-hidden">
            <CardHeader className="pb-2 border-b border-border bg-muted/30">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <User size={16} className="text-indigo-500" /> Unscheduled Active Clients ({scheduledData.unscheduled.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ScrollArea className="h-[200px] pr-2">
                {scheduledData.unscheduled.length > 0 ? (
                  <div className="space-y-2">
                    {scheduledData.unscheduled.map(client => (
                      <div key={client.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-border hover:bg-card transition-all">
                        <span className="text-xs font-bold text-foreground">{client.name}</span>
                        <Link to={`/clients/${client.id}`}>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-indigo-50">
                            <ArrowRight size={14} className="text-indigo-600" />
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-xs font-medium">
                    All active clients have preferred times mapped!
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TimetableVisualizer;