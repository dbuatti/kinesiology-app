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
  HelpCircle,
  RefreshCw,
  Ban,
  Loader2,
  DollarSign,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
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
const TIME_SLOTS = ["10:00", "14:00", "16:00"];

const TIME_LABELS: Record<string, string> = {
  "10:00": "10:00 AM",
  "14:00": "2:00 PM",
  "16:00": "4:00 PM"
};

// Helper to parse preferred time string
function parsePreferredTime(timeStr: string | null | undefined, clientName: string) {
  // Prioritize Susan Elizabeth Lord in the morning (10:00 AM)
  if (clientName.toLowerCase().includes("susan") && clientName.toLowerCase().includes("lord")) {
    // If she has a preferred day, keep it, otherwise default to Wednesday (preferred clinic day)
    let day = "Wednesday";
    if (timeStr) {
      const lower = timeStr.toLowerCase();
      for (const d of DAYS) {
        if (lower.includes(d.toLowerCase())) {
          day = d;
          break;
        }
      }
    }
    return { day, slot: "10:00" };
  }

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
  const activeSlots = TIME_SLOTS.filter(slot => slot !== "12:00" && slot !== "13:00");
  let closestSlot = "10:00";
  let minDiff = Infinity;
  activeSlots.forEach(slot => {
    const slotHour = parseInt(slot.split(':')[0]);
    const diff = Math.abs(slotHour - hour);
    if (diff < minDiff) {
      minDiff = diff;
      closestSlot = slot;
    }
  });

  return { day, slot: closestSlot };
}

interface ProposedMove {
  clientId: string;
  clientName: string;
  originalDay: string;
  originalSlot: string;
  originalWeek: number;
  newDay: string;
  newSlot: string;
  newWeek: number;
  reason: string;
}

const TimetableVisualizer = ({ clients }: TimetableVisualizerProps) => {
  const [activeWeek, setActiveWeek] = useState<1 | 2>(1);
  const [isOptimized, setIsOptimized] = useState(false);
  const [applyingMoves, setApplyingMoves] = useState(false);

  // Filter to active clients (seen in last 30 days OR booked in the future) to keep the timetable relevant
  const activeClients = useMemo(() => {
    const now = new Date();
    return clients.filter(c => {
      // Safety check: ensure appointments exists before calling .some()
      const hasFutureAppointment = c.appointments?.some(app => new Date(app.date) > now);
      if (hasFutureAppointment) return true;
      
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
      const prefTimeText = client.preferred_time || client.preferredTimeAnalyzed?.text;
      const parsed = parsePreferredTime(prefTimeText, client.name);

      if (!parsed) {
        unscheduled.push(client);
        return;
      }

      // Determine regularity / frequency
      // Safety check: ensure appointments exists before calling .filter()
      const recentAppsCount = (client.appointments || []).filter(app => {
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

  // Generate optimized schedule resolving conflicts
  const optimizedData = useMemo(() => {
    const grid: Record<string, { clients: ClientWithAppointments[]; hasConflict: boolean }> = {};
    const proposedMoves: ProposedMove[] = [];

    // Initialize optimized grid with a copy of scheduledData
    for (const week of [1, 2]) {
      for (const day of DAYS) {
        for (const slot of TIME_SLOTS) {
          const key = `${week}-${day}-${slot}`;
          grid[key] = {
            clients: [...(scheduledData.grid[key]?.clients || [])],
            hasConflict: false
          };
        }
      }
    }

    // Helper to find the nearest available slot for a client
    const findNearestAvailableSlot = (
      client: ClientWithAppointments,
      startWeek: number,
      startDay: string,
      startSlot: string
    ) => {
      const activeSlots = TIME_SLOTS.filter(s => s !== "12:00" && s !== "13:00");
      
      // Define preferred clinic days order
      const preferredDays = ["Wednesday", "Friday"];
      const otherDays = ["Monday", "Tuesday", "Thursday"];

      // 1. Try same day, adjacent time slots first (keeps them on their preferred day)
      const currentSlotIndex = activeSlots.indexOf(startSlot);
      const searchOffsets = [1, -1, 2, -2, 3, -3, 4, -4];

      for (const offset of searchOffsets) {
        const targetIndex = currentSlotIndex + offset;
        if (targetIndex >= 0 && targetIndex < activeSlots.length) {
          const targetSlot = activeSlots[targetIndex];
          const key = `${startWeek}-${startDay}-${targetSlot}`;
          if (grid[key].clients.length === 0) {
            return { week: startWeek, day: startDay, slot: targetSlot, reason: `Moved to adjacent slot on same day (${startDay})` };
          }
        }
      }

      // 2. Try preferred clinic days (Wednesday, Friday), same time slot
      for (const targetDay of preferredDays) {
        if (targetDay === startDay) continue;
        const key = `${startWeek}-${targetDay}-${startSlot}`;
        if (grid[key].clients.length === 0) {
          return { week: startWeek, day: targetDay, slot: startSlot, reason: `Moved to same time slot on preferred clinic day (${targetDay})` };
        }
      }

      // 3. Try preferred clinic days (Wednesday, Friday), any available slot
      for (const targetDay of preferredDays) {
        if (targetDay === startDay) continue;
        for (const targetSlot of activeSlots) {
          const key = `${startWeek}-${targetDay}-${targetSlot}`;
          if (grid[key].clients.length === 0) {
            return { week: startWeek, day: targetDay, slot: targetSlot, reason: `Moved to available slot on preferred clinic day (${targetDay} at ${TIME_LABELS[targetSlot]})` };
          }
        }
      }

      // 4. Try other days (Monday, Tuesday, Thursday), same time slot
      for (const targetDay of otherDays) {
        if (targetDay === startDay) continue;
        const key = `${startWeek}-${targetDay}-${startSlot}`;
        if (grid[key].clients.length === 0) {
          return { week: startWeek, day: targetDay, slot: startSlot, reason: `Moved to same time slot on adjacent day (${targetDay})` };
        }
      }

      // 5. Try other days (Monday, Tuesday, Thursday), any available slot
      for (const targetDay of otherDays) {
        if (targetDay === startDay) continue;
        for (const targetSlot of activeSlots) {
          const key = `${startWeek}-${targetDay}-${targetSlot}`;
          if (grid[key].clients.length === 0) {
            return { week: startWeek, day: targetDay, slot: targetSlot, reason: `Moved to available slot on adjacent day (${targetDay} at ${TIME_LABELS[targetSlot]})` };
          }
        }
      }

      // 6. Try other week, same day, same slot
      const otherWeek = startWeek === 1 ? 2 : 1;
      const otherWeekKey = `${otherWeek}-${startDay}-${startSlot}`;
      if (grid[otherWeekKey].clients.length === 0) {
        return { week: otherWeek, day: startDay, slot: startSlot, reason: `Moved to same slot on alternate week (Week ${otherWeek})` };
      }

      return null;
    };

    // Resolve conflicts week by week, day by day, slot by slot
    for (const week of [1, 2]) {
      for (const day of DAYS) {
        for (const slot of TIME_SLOTS) {
          const key = `${week}-${day}-${slot}`;
          const cell = grid[key];

          if (cell.clients.length > 1) {
            // Sort clients by priority: keep Susan Elizabeth Lord first, then sort by most appointments
            const sortedClients = [...cell.clients].sort((a, b) => {
              const aIsSusan = a.name.toLowerCase().includes("susan") && a.name.toLowerCase().includes("lord");
              const bIsSusan = b.name.toLowerCase().includes("susan") && b.name.toLowerCase().includes("lord");
              if (aIsSusan && !bIsSusan) return -1;
              if (!aIsSusan && bIsSusan) return 1;
              return (b.appointments?.length || 0) - (a.appointments?.length || 0);
            });
            
            // Keep the primary client
            const primaryClient = sortedClients[0];
            cell.clients = [primaryClient];

            // Move the other conflicting clients
            for (let i = 1; i < sortedClients.length; i++) {
              const duplicateClient = sortedClients[i];
              const newSlot = findNearestAvailableSlot(duplicateClient, week, day, slot);

              if (newSlot) {
                const newKey = `${newSlot.week}-${newSlot.day}-${newSlot.slot}`;
                grid[newKey].clients.push(duplicateClient);
                proposedMoves.push({
                  clientId: duplicateClient.id,
                  clientName: duplicateClient.name,
                  originalDay: day,
                  originalSlot: slot,
                  originalWeek: week,
                  newDay: newSlot.day,
                  newSlot: newSlot.slot,
                  newWeek: newSlot.week,
                  reason: newSlot.reason
                });
              } else {
                // Fallback: keep in original slot if no other slot is found
                cell.clients.push(duplicateClient);
              }
            }
          }
        }
      }
    }

    return { grid, proposedMoves };
  }, [scheduledData]);

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
          dayTotal += (isOptimized ? optimizedData.grid : scheduledData.grid)[`${week}-${day}-${slot}`].clients.length;
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
  }, [scheduledData, optimizedData, isOptimized]);

  const handleApplyOptimizedSchedule = async () => {
    if (optimizedData.proposedMoves.length === 0) return;
    
    if (!confirm(`Are you sure you want to apply the resolved schedule? This will update the preferred times for ${optimizedData.proposedMoves.length} clients in the database.`)) {
      return;
    }

    setApplyingMoves(true);
    try {
      const todayStr = new Date().toISOString();
      
      for (const move of optimizedData.proposedMoves) {
        const formattedTime = `${move.newDay}s at ${TIME_LABELS[move.newSlot]}`;
        
        const { error } = await supabase
          .from("clients")
          .update({
            preferred_time: formattedTime,
            rate_updated_at: todayStr // Mark as reviewed
          })
          .eq("id", move.clientId);

        if (error) throw error;
      }

      showSuccess(`Successfully resolved conflicts and updated preferred times for ${optimizedData.proposedMoves.length} clients!`);
      setIsOptimized(false);
      window.location.reload(); // Reload to fetch fresh data
    } catch (err: any) {
      showError(err.message || "Failed to apply resolved schedule.");
    } finally {
      setApplyingMoves(false);
    }
  };

  // Calculate daily earnings based on scheduled clients and their standard rates
  const dailyEarnings = useMemo(() => {
    const earnings: Record<string, number> = {};
    
    DAYS.forEach(day => {
      let daySum = 0;
      TIME_SLOTS.forEach(slot => {
        const key = `${activeWeek}-${day}-${slot}`;
        const cell = (isOptimized ? optimizedData.grid : scheduledData.grid)[key];
        if (cell && cell.clients) {
          cell.clients.forEach(client => {
            daySum += client.standard_rate ?? 50;
          });
        }
      });
      earnings[day] = daySum;
    });
    
    return earnings;
  }, [activeWeek, isOptimized, optimizedData.grid, scheduledData.grid]);

  // Calculate earnings for both weeks
  const weeklyEarningsSummary = useMemo(() => {
    const summary = {
      week1: 0,
      week2: 0,
      fortnight: 0,
      byDayWeek1: {} as Record<string, number>,
      byDayWeek2: {} as Record<string, number>
    };

    DAYS.forEach(day => {
      summary.byDayWeek1[day] = 0;
      summary.byDayWeek2[day] = 0;

      TIME_SLOTS.forEach(slot => {
        // Week 1
        const cell1 = (isOptimized ? optimizedData.grid : scheduledData.grid)[`1-${day}-${slot}`];
        if (cell1 && cell1.clients) {
          cell1.clients.forEach(client => {
            const rate = client.standard_rate ?? 50;
            summary.byDayWeek1[day] += rate;
            summary.week1 += rate;
          });
        }

        // Week 2
        const cell2 = (isOptimized ? optimizedData.grid : scheduledData.grid)[`2-${day}-${slot}`];
        if (cell2 && cell2.clients) {
          cell2.clients.forEach(client => {
            const rate = client.standard_rate ?? 50;
            summary.byDayWeek2[day] += rate;
            summary.week2 += rate;
          });
        }
      });
    });

    summary.fortnight = summary.week1 + summary.week2;
    return summary;
  }, [isOptimized, optimizedData.grid, scheduledData.grid]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
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

        <div className="flex items-center gap-3 shrink-0">
          {/* Resolve Conflicts Toggle */}
          {scheduledData.conflictsList.length > 0 && (
            <Button
              onClick={() => setIsOptimized(!isOptimized)}
              className={cn(
                "rounded-xl h-10 px-6 font-black text-[10px] uppercase tracking-widest shadow-sm transition-all",
                isOptimized
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-amber-500 hover:bg-amber-600 text-white"
              )}
            >
              {isOptimized ? (
                <><CheckCircle2 size={14} className="mr-2" /> View Original</>
              ) : (
                <><RefreshCw size={14} className="mr-2" /> Resolve Conflicts</>
              )}
            </Button>
          )}

          <div className="flex bg-muted p-1 rounded-xl">
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
      </div>

      {/* Earnings Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Week 1 Earnings Card */}
        <Card className="border-none shadow-md rounded-[2rem] bg-card overflow-hidden">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Week 1 Earnings</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 flex items-center justify-center">
                <DollarSign size={16} />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-black text-foreground">${weeklyEarningsSummary.week1}</h3>
              <p className="text-xs text-muted-foreground font-medium">Total for Week 1 schedule</p>
            </div>
            <div className="pt-3 border-t border-border/40 space-y-1.5">
              <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground block">Daily Breakdown</span>
              <div className="grid grid-cols-5 gap-1 text-center">
                {DAYS.map(day => (
                  <div key={day} className="bg-muted/30 p-1.5 rounded-lg">
                    <span className="text-[9px] font-bold text-muted-foreground block">{day.substring(0, 3)}</span>
                    <span className="text-xs font-black text-foreground">${weeklyEarningsSummary.byDayWeek1[day] || 0}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Week 2 Earnings Card */}
        <Card className="border-none shadow-md rounded-[2rem] bg-card overflow-hidden">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Week 2 Earnings</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 flex items-center justify-center">
                <DollarSign size={16} />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-black text-foreground">${weeklyEarningsSummary.week2}</h3>
              <p className="text-xs text-muted-foreground font-medium">Total for Week 2 schedule</p>
            </div>
            <div className="pt-3 border-t border-border/40 space-y-1.5">
              <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground block">Daily Breakdown</span>
              <div className="grid grid-cols-5 gap-1 text-center">
                {DAYS.map(day => (
                  <div key={day} className="bg-muted/30 p-1.5 rounded-lg">
                    <span className="text-[9px] font-bold text-muted-foreground block">{day.substring(0, 3)}</span>
                    <span className="text-xs font-black text-foreground">${weeklyEarningsSummary.byDayWeek2[day] || 0}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fortnightly Total Card */}
        <Card className="border-none shadow-lg rounded-[2.5rem] bg-indigo-600 text-white overflow-hidden relative group">
          <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
          <CardContent className="p-6 space-y-4 relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Fortnightly Total</span>
              <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
                <Sparkles size={16} />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-black">${weeklyEarningsSummary.fortnight}</h3>
              <p className="text-xs text-indigo-200 font-medium">Combined 2-week schedule earnings</p>
            </div>
            <div className="pt-3 border-t border-white/10 space-y-1.5">
              <span className="text-[9px] font-black uppercase tracking-wider text-indigo-200 block">Estimated Monthly / Annual</span>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-white/5 p-2 rounded-xl border border-white/10">
                  <span className="text-[9px] font-bold text-indigo-200 block">Monthly</span>
                  <span className="text-sm font-black">${Math.round(weeklyEarningsSummary.fortnight * 2.16)}</span>
                </div>
                <div className="bg-white/5 p-2 rounded-xl border border-white/10">
                  <span className="text-[9px] font-bold text-indigo-200 block">Annual</span>
                  <span className="text-sm font-black">${Math.round(weeklyEarningsSummary.fortnight * 26)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Smart Suggestions & Capacity Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          {/* Timetable Grid */}
          <div className="bg-card rounded-[2.5rem] border border-border shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="p-4 pl-6 font-black text-[10px] uppercase tracking-widest text-muted-foreground w-24">Time</th>
                    {DAYS.map(day => {
                      const earnings = dailyEarnings[day] || 0;
                      return (
                        <th key={day} className="p-4 font-black text-[10px] uppercase tracking-widest text-muted-foreground text-center">
                          <div>{day}</div>
                          {earnings > 0 && (
                            <div className="text-emerald-600 dark:text-emerald-400 font-black text-[9px] mt-1">
                              ${earnings} Earned
                            </div>
                          )}
                        </th>
                      );
                    })}
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
                        const cell = (isOptimized ? optimizedData.grid : scheduledData.grid)[key];
                        const hasClients = cell.clients.length > 0;

                        const isBlockedSlot = slot === "12:00" || slot === "13:00";

                        return (
                          <td
                            key={day}
                            className={cn(
                              "p-3 text-center border-r border-border/20 last:border-r-0 min-w-[140px] h-24 vertical-top",
                              cell.hasConflict ? "bg-rose-50/30 dark:bg-rose-950/10" : "",
                              isBlockedSlot ? "bg-slate-100/80 dark:bg-slate-900/50" : ""
                            )}
                          >
                            {isBlockedSlot ? (
                              <span className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest flex items-center justify-center gap-1">
                                <Ban size={12} /> Blocked
                              </span>
                            ) : hasClients ? (
                              <div className="space-y-1.5">
                                {cell.clients.map(client => {
                                  const isMoved = isOptimized && optimizedData.proposedMoves.some(m => m.clientId === client.id && m.newDay === day && m.newSlot === slot && m.newWeek === activeWeek);
                                  return (
                                    <Link
                                      key={client.id}
                                      to={`/clients/${client.id}`}
                                      className={cn(
                                        "block p-2 rounded-xl text-xs font-bold border transition-all hover:scale-[1.02] truncate",
                                        cell.hasConflict
                                          ? "bg-rose-100 text-rose-700 border-rose-200"
                                          : isMoved
                                            ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/30"
                                            : "bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900/30"
                                      )}
                                      title={`${client.name} (${client.preferred_time || client.preferredTimeAnalyzed?.text})`}
                                    >
                                      <div className="flex items-center justify-center gap-1">
                                        {isMoved && <Sparkles size={10} className="text-amber-500 shrink-0" />}
                                        <span className="truncate">{client.name}</span>
                                      </div>
                                    </Link>
                                  );
                                })}
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

          {/* Proposed Moves List */}
          {isOptimized && optimizedData.proposedMoves.length > 0 && (
            <Card className="border-none shadow-lg rounded-[2.5rem] bg-white border-2 border-emerald-100 overflow-hidden animate-in slide-in-from-top-4 duration-500">
              <CardHeader className="p-6 pb-4 bg-emerald-50/50 border-b border-emerald-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-black text-emerald-900 flex items-center gap-2">
                      <Sparkles size={20} className="text-emerald-600" /> Proposed Conflict Resolutions
                    </CardTitle>
                    <CardDescription className="text-emerald-700 font-medium">
                      The following clients have been moved to adjacent open slots to resolve conflicts.
                    </CardDescription>
                  </div>
                  <Button
                    onClick={handleApplyOptimizedSchedule}
                    disabled={applyingMoves}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 px-6 font-black text-[10px] uppercase tracking-widest shadow-lg"
                  >
                    {applyingMoves ? <Loader2 className="mr-2 animate-spin" /> : <CheckCircle2 size={14} className="mr-2" />}
                    Apply Resolved Schedule
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {optimizedData.proposedMoves.map((move) => (
                    <div key={move.clientId} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between gap-3">
                      <div className="space-y-1">
                        <p className="font-bold text-slate-900">"{move.clientName}"</p>
                        <p className="text-[10px] text-slate-500 font-medium">
                          Moved from <span className="font-bold text-rose-600">{move.originalDay} at {TIME_LABELS[move.originalSlot]} (W{move.originalWeek})</span> to <span className="font-bold text-emerald-600">{move.newDay} at {TIME_LABELS[move.newSlot]} (W{move.newWeek})</span>
                        </p>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-[10px] text-slate-600 font-medium italic">
                        "{move.reason}"
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
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