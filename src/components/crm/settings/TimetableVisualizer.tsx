import { useState, useMemo, useCallback, useRef, type DragEvent } from 'react';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
 AlertTriangle,
 CheckCircle2,
 Sparkles,
 Info,
 User,
 CalendarDays,
 ArrowRight,
 RefreshCw,
 Loader2,
 DollarSign,
 GripVertical,
 Undo2,
 Save,
 ListChecks,
 Coffee,
 LayoutGrid,
 Lock,
 Unlock,
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

// 60 min session + 15 min buffer = 75 min between slot starts
// 10:00 → 11:15 → [LUNCH 12:00–14:00] → 14:00 → 15:15 → 16:30
const MORNING_SLOTS = ["10:00", "11:15"];
const AFTERNOON_SLOTS = ["14:00", "15:15", "16:30"];
const TIME_SLOTS = [...MORNING_SLOTS, ...AFTERNOON_SLOTS];
const MAX_DAILY_SLOTS = TIME_SLOTS.length; // 5 per day
const MAX_WEEKLY_SLOTS = MAX_DAILY_SLOTS * DAYS.length; // 25 per week

const TIME_LABELS: Record<string, string> = {
 "10:00": "10:00 AM",
 "11:15": "11:15 AM",
 "14:00": "2:00 PM",
 "15:15": "3:15 PM",
 "16:30": "4:30 PM",
};

type ManualPlacement = { week: 1 | 2; day: string; slot: string } | null;

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getRecentAppCount(client: ClientWithAppointments): number {
 const now = new Date().getTime();
 return client.appointments.filter(app => {
 const diff = (now - new Date(app.date).getTime()) / (1000 * 60 * 60 * 24);
 return diff >= 0 && diff <= 90;
 }).length;
}

function parsePreferredTime(timeStr: string | null | undefined, clientName: string) {
 if (clientName.toLowerCase().includes("susan") && clientName.toLowerCase().includes("lord")) {
 let day = "Wednesday";
 if (timeStr) {
 const lower = timeStr.toLowerCase();
 for (const d of DAYS) {
 if (lower.includes(d.toLowerCase())) { day = d; break; }
 }
 }
 return { day, slot: "10:00" };
 }

 if (!timeStr || timeStr === "No data") return null;
 const lower = timeStr.toLowerCase();

 let day: string | null = null;
 for (const d of DAYS) {
 if (lower.includes(d.toLowerCase())) { day = d; break; }
 }
 if (!day) return null;

 let hour = 10;
 const hourMatch = lower.match(/(\d+):(\d+)\s*(am|pm)/i) || lower.match(/(\d+)\s*(am|pm)/i);
 if (hourMatch) {
 let h = parseInt(hourMatch[1]);
 const ampm = (hourMatch[3] || hourMatch[2] || "").toLowerCase();
 if (ampm === "pm" && h !== 12) h += 12;
 if (ampm === "am" && h === 12) h = 0;
 hour = h;
 }

 // Skip lunch window — snap to nearest valid slot
 let closestSlot = "10:00";
 let minDiff = Infinity;
 TIME_SLOTS.forEach(slot => {
 const diff = Math.abs(parseInt(slot) - hour);
 if (diff < minDiff) { minDiff = diff; closestSlot = slot; }
 });

 return { day, slot: closestSlot };
}

function fmt(n: number) {
 return n.toLocaleString();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const TimetableVisualizer = ({ clients }: TimetableVisualizerProps) => {
 const [isOptimized, setIsOptimized] = useState(false);
 const [applyingMoves, setApplyingMoves] = useState(false);
 const [draggingClientId, setDraggingClientId] = useState<string | null>(null);
 const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const [manualPlacements, setManualPlacements] = useState<Record<string, ManualPlacement>>({});
  const [pendingSaves, setPendingSaves] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [isLocked, setIsLocked] = useState(() => localStorage.getItem('timetable_locked') === 'true');
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showApplyConfirm, setShowApplyConfirm] = useState(false);

 const activeClients = useMemo(() => {
 const now = new Date();
 return clients.filter(c => {
 if (c.appointments.some(app => new Date(app.date) > now)) return true;
 if (!c.lastSeenDate) return false;
 return (now.getTime() - c.lastSeenDate.getTime()) / (1000 * 60 * 60 * 24) <= 30;
 });
 }, [clients]);

 const scheduledData = useMemo(() => {
 const grid: Record<string, { clients: ClientWithAppointments[]; hasConflict: boolean }> = {};
 const unscheduled: ClientWithAppointments[] = [];

 for (const week of [1, 2]) {
 for (const day of DAYS) {
 for (const slot of TIME_SLOTS) {
 grid[`${week}-${day}-${slot}`] = { clients: [], hasConflict: false };
 }
 }
 }

 activeClients.forEach(client => {
 const recentCount = getRecentAppCount(client);
 const isWeekly = recentCount >= 8;
 const isFortnightly = recentCount >= 4 && recentCount < 8;

 if (client.id in manualPlacements) {
 const placement = manualPlacements[client.id];
 if (placement === null) {
 unscheduled.push(client);
 } else {
 grid[`${placement.week}-${placement.day}-${placement.slot}`].clients.push(client);
 if (isWeekly) {
 const mirror = placement.week === 1 ? 2 : 1;
 grid[`${mirror}-${placement.day}-${placement.slot}`].clients.push(client);
 }
 }
 return;
 }

 const prefText = client.preferred_time || client.preferredTimeAnalyzed.text;
 const parsed = parsePreferredTime(prefText, client.name);
 if (!parsed) { unscheduled.push(client); return; }

 if (isWeekly) {
 grid[`1-${parsed.day}-${parsed.slot}`].clients.push(client);
 grid[`2-${parsed.day}-${parsed.slot}`].clients.push(client);
 } else {
 grid[`${isFortnightly ? 1 : 2}-${parsed.day}-${parsed.slot}`].clients.push(client);
 }
 });

 const conflictsList: { day: string; slot: string; clients: ClientWithAppointments[] }[] = [];
 for (const week of [1, 2]) {
 for (const day of DAYS) {
 for (const slot of TIME_SLOTS) {
 const key = `${week}-${day}-${slot}`;
 if (grid[key].clients.length > 1) {
 grid[key].hasConflict = true;
 conflictsList.push({ day: `${day} (Week ${week})`, slot: TIME_LABELS[slot], clients: grid[key].clients });
 }
 }
 }
 }

 return { grid, unscheduled, conflictsList };
 }, [activeClients, manualPlacements]);

 const optimizedData = useMemo(() => {
 const grid: Record<string, { clients: ClientWithAppointments[]; hasConflict: boolean }> = {};
 const proposedMoves: ProposedMove[] = [];

 for (const week of [1, 2]) {
 for (const day of DAYS) {
 for (const slot of TIME_SLOTS) {
 const key = `${week}-${day}-${slot}`;
 grid[key] = { clients: [...(scheduledData.grid[key]?.clients || [])], hasConflict: false };
 }
 }
 }

 const findFreeSlot = (startWeek: number, startDay: string, startSlot: string) => {
 const preferred = ["Wednesday", "Friday"];
 const others = ["Monday", "Tuesday", "Thursday"];
 const si = TIME_SLOTS.indexOf(startSlot);
 const offsets = [1, -1, 2, -2, 3, -3, 4, -4];

 for (const o of offsets) {
 const ti = si + o;
 if (ti >= 0 && ti < TIME_SLOTS.length) {
 const key = `${startWeek}-${startDay}-${TIME_SLOTS[ti]}`;
 if (grid[key].clients.length === 0)
 return { week: startWeek, day: startDay, slot: TIME_SLOTS[ti], reason: `Moved to adjacent time on ${startDay}` };
 }
 }
 for (const d of [...preferred, ...others]) {
 if (d === startDay) continue;
 for (const s of TIME_SLOTS) {
 const key = `${startWeek}-${d}-${s}`;
 if (grid[key].clients.length === 0)
 return { week: startWeek, day: d, slot: s, reason: `Moved to ${d} at ${TIME_LABELS[s]}` };
 }
 }
 const other = startWeek === 1 ? 2 : 1;
 if (grid[`${other}-${startDay}-${startSlot}`].clients.length === 0)
 return { week: other, day: startDay, slot: startSlot, reason: `Moved to Week ${other}, same slot` };
 return null;
 };

 for (const week of [1, 2]) {
 for (const day of DAYS) {
 for (const slot of TIME_SLOTS) {
 const key = `${week}-${day}-${slot}`;
 const cell = grid[key];
 if (cell.clients.length <= 1) continue;

 const sorted = [...cell.clients].sort((a, b) => b.appointments.length - a.appointments.length);
 cell.clients = [sorted[0]];

 for (let i = 1; i < sorted.length; i++) {
 const dup = sorted[i];
 const found = findFreeSlot(week, day, slot);
 if (found) {
 grid[`${found.week}-${found.day}-${found.slot}`].clients.push(dup);
 proposedMoves.push({ clientId: dup.id, clientName: dup.name, originalDay: day, originalSlot: slot, originalWeek: week, newDay: found.day, newSlot: found.slot, newWeek: found.week, reason: found.reason });
 } else {
 cell.clients.push(dup);
 }
 }
 }
 }
 }
 return { grid, proposedMoves };
 }, [scheduledData]);

 const activeGrid = isOptimized ? optimizedData.grid : scheduledData.grid;

 const suggestions = useMemo(() => {
 const list: string[] = [];
 scheduledData.conflictsList.forEach(c => {
 list.push(`Conflict on ${c.day} at ${c.slot}: ${c.clients.map(x => x.name).join(" & ")} overlap.`);
 });
 DAYS.forEach(day => {
 let total = 0;
 for (const week of [1, 2]) for (const slot of TIME_SLOTS)
 total += activeGrid[`${week}-${day}-${slot}`].clients.length;
 if (total > MAX_DAILY_SLOTS * 1.5)
 list.push(`${day} is heavy (${total} sessions/fortnight). Consider spreading across other days.`);
 });
 if (scheduledData.unscheduled.length > 0)
 list.push(`${scheduledData.unscheduled.length} active client${scheduledData.unscheduled.length > 1 ? "s" : ""} not yet scheduled. Drag from the panel below.`);
 return list;
 }, [scheduledData, activeGrid]);

 const earningsSummary = useMemo(() => {
 let w1 = 0, w2 = 0;
 const d1: Record<string, number> = {}, d2: Record<string, number> = {};
 DAYS.forEach(d => { d1[d] = 0; d2[d] = 0; });
 for (const day of DAYS) for (const slot of TIME_SLOTS) {
 activeGrid[`1-${day}-${slot}`]?.clients.forEach(c => { const r = c.standard_rate ?? 50; d1[day] += r; w1 += r; });
 activeGrid[`2-${day}-${slot}`]?.clients.forEach(c => { const r = c.standard_rate ?? 50; d2[day] += r; w2 += r; });
 }
 return { w1, w2, fortnight: w1 + w2, d1, d2 };
 }, [activeGrid]);

 const weekCapacity = useCallback((week: 1 | 2) => {
 const seen = new Set<string>();
 for (const day of DAYS) for (const slot of TIME_SLOTS)
 activeGrid[`${week}-${day}-${slot}`]?.clients.forEach(c => seen.add(c.id));
 return seen.size;
 }, [activeGrid]);

  const autoSave = useCallback(async (clientId: string, placement: ManualPlacement | null) => {
    try {
      const { error } = await supabase.from("clients")
        .update({ preferred_time: placement ? `${placement.day}s at ${TIME_LABELS[placement.slot]}` : null })
        .eq("id", clientId);
      if (error) console.error("Auto-save failed:", error);
    } catch (err) {
      console.error("Auto-save failed:", err);
    }
  }, []);

  // Handlers
  const executeApplySchedule = async () => {
  if (!optimizedData.proposedMoves.length) return;
  setShowApplyConfirm(false);
  setApplyingMoves(true);
 try {
 const now = new Date().toISOString();
 for (const move of optimizedData.proposedMoves) {
 const { error } = await supabase.from("clients")
 .update({ preferred_time: `${move.newDay}s at ${TIME_LABELS[move.newSlot]}`, rate_updated_at: now })
 .eq("id", move.clientId);
 if (error) throw error;
 }
 showSuccess(`Resolved conflicts for ${optimizedData.proposedMoves.length} client${optimizedData.proposedMoves.length > 1 ? "s" : ""}!`);
 setIsOptimized(false);
 window.location.reload();
 } catch (err: any) {
 showError(err.message || "Failed to apply resolved schedule.");
 } finally {
 setApplyingMoves(false);
 }
 };

 const handleDragStart = useCallback((e: DragEvent, clientId: string) => {
 if (isLocked) { e.preventDefault(); return; }
 setDraggingClientId(clientId);
 e.dataTransfer.effectAllowed = "move";
 e.dataTransfer.setData("clientId", clientId);
 }, [isLocked]);

 const handleDragEnd = useCallback(() => {
 setDraggingClientId(null);
 setDragOverKey(null);
 }, []);

 const handleDragOver = useCallback((e: DragEvent, key: string) => {
 if (isLocked) return;
 e.preventDefault();
 e.dataTransfer.dropEffect = "move";
 setDragOverKey(key);
 }, [isLocked]);

 const handleDragLeave = useCallback((e: DragEvent) => {
 if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverKey(null);
 }, []);

  const handleDrop = useCallback((e: DragEvent, week: 1 | 2, day: string, slot: string) => {
  if (isLocked) return;
  e.preventDefault();
  const clientId = e.dataTransfer.getData("clientId");
  if (!clientId) return;
  setManualPlacements(prev => ({ ...prev, [clientId]: { week, day, slot } }));
  setPendingSaves(prev => new Set(prev).add(clientId));
  autoSave(clientId, { week, day, slot });
  setDragOverKey(null);
  setDraggingClientId(null);
  }, [isLocked, autoSave]);

  const handleDropUnscheduled = useCallback((e: DragEvent) => {
  if (isLocked) return;
  e.preventDefault();
  const clientId = e.dataTransfer.getData("clientId");
  if (!clientId) return;
  setManualPlacements(prev => ({ ...prev, [clientId]: null }));
  setPendingSaves(prev => new Set(prev).add(clientId));
  autoSave(clientId, null);
  setDragOverKey(null);
  setDraggingClientId(null);
  }, [isLocked, autoSave]);

 const handleResetPlacement = useCallback((clientId: string) => {
 setManualPlacements(prev => { const n = { ...prev }; delete n[clientId]; return n; });
 setPendingSaves(prev => { const n = new Set(prev); n.delete(clientId); return n; });
 }, []);

 const handleResetAll = useCallback(() => {
 setManualPlacements({});
 setPendingSaves(new Set());
 }, []);

 const handleSaveAll = useCallback(async () => {
 if (!pendingSaves.size) return;
 setIsSaving(true);
 try {
 const now = new Date().toISOString();
 for (const clientId of Array.from(pendingSaves)) {
 const p = manualPlacements[clientId];
 const { error } = await supabase.from("clients")
 .update({ preferred_time: p ? `${p.day}s at ${TIME_LABELS[p.slot]}` : null, rate_updated_at: now })
 .eq("id", clientId);
 if (error) throw error;
 }
 showSuccess(`Saved ${pendingSaves.size} change${pendingSaves.size > 1 ? "s" : ""}!`);
 setPendingSaves(new Set());
 } catch (err: any) {
 showError(err.message || "Failed to save changes.");
 } finally {
 setIsSaving(false);
 }
 }, [pendingSaves, manualPlacements]);

 if (activeClients.length === 0) {
 return (
 <div className="flex flex-col items-center justify-center py-24 space-y-4 text-center">
 <CalendarDays className="text-muted-foreground/40" size={48} />
 <p className="text-sm font-medium text-muted-foreground">No active clients to schedule.</p>
 <p className="text-xs text-muted-foreground/60">Clients seen in the last 30 days or with upcoming appointments will appear here.</p>
 </div>
 );
 }

 const isDragging = draggingClientId !== null;

 // Renders a single slot cell
 const renderCell = (week: 1 | 2, day: string, slot: string) => {
 const key = `${week}-${day}-${slot}`;
 const cell = activeGrid[key] || { clients: [], hasConflict: false };
 const isOver = dragOverKey === key;
 const isEmpty = cell.clients.length === 0;

 return (
 <td
 key={`${day}-${slot}`}
 onDragOver={e => handleDragOver(e, key)}
 onDragLeave={handleDragLeave}
 onDrop={e => handleDrop(e, week, day, slot)}
 className={cn(
 "p-1.5 border-r border-border/20 last:border-r-0 min-w-[120px] h-[82px] align-top transition-colors duration-100",
 cell.hasConflict && !isOver ? "bg-chart-destructive/10/40 " : "",
 isOver ? "bg-primary/5 ring-2 ring-inset ring-primary/50" : "",
 isDragging && isEmpty && !isOver ? "bg-muted/20" : "",
 )}
 >
 {isOver ? (
 <div className="w-full h-full flex items-center justify-center pointer-events-none">
 <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">
 {isEmpty ? "Drop here" : "Add here"}
 </span>
 </div>
 ) : (
 <div className="space-y-1 pt-0.5">
 {cell.clients.map(client => {
 const isMoved = isOptimized && optimizedData.proposedMoves.some(
 m => m.clientId === client.id && m.newDay === day && m.newSlot === slot && m.newWeek === week
 );
 const isManual = client.id in manualPlacements && manualPlacements[client.id] !== null;
 const isPending = pendingSaves.has(client.id);
 const isBeingDragged = draggingClientId === client.id;

 return (
 <div
 key={client.id}
 draggable={!isLocked}
 onDragStart={e => handleDragStart(e, client.id)}
 onDragEnd={handleDragEnd}
 className={cn(
 "group flex items-center gap-1 px-1.5 py-1 rounded-lg text-[11px] font-medium border select-none transition-all",
 isLocked ? "cursor-default" : "cursor-grab active:cursor-grabbing",
 isBeingDragged ? "opacity-25 scale-95" : (!isLocked ? "hover:shadow-md hover:scale-[1.02]" : ""),
 cell.hasConflict
 ? "bg-destructive/10 text-destructive border-destructive/20"
 : isMoved
 ? "bg-muted text-muted-foreground border-border "
 : isManual
 ? "bg-chart-primary/10 text-violet-700 border-violet-200 "
 : "bg-primary/8 text-primary border-primary/15 "
 )}
 title={`${client.name} · $${client.standard_rate ?? 50}/session — drag to move`}
 >
 <GripVertical size={9} className="shrink-0 opacity-30 group-hover:opacity-60" />
 <span className="truncate flex-1 leading-tight">{client.name}</span>
 <span className="shrink-0 text-[10px] font-semibold opacity-50">${client.standard_rate ?? 50}</span>
 {isPending && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" title="Unsaved" />}
 {cell.hasConflict && <AlertTriangle size={9} className="shrink-0 text-destructive" />}
 </div>
 );
 })}
 {isEmpty && isDragging && (
 <div className="mx-0.5 h-6 rounded-lg border-2 border-dashed border-primary/20 flex items-center justify-center">
 <span className="text-[10px] font-medium text-primary/30 uppercase tracking-wider">Drop</span>
 </div>
 )}
 {isEmpty && !isDragging && (
 <span className="block text-center text-[10px] font-medium text-muted-foreground/30 uppercase tracking-wider pt-2">Open</span>
 )}
 </div>
 )}
 </td>
 );
 };

 // Renders a full week grid table
 const renderWeekGrid = (week: 1 | 2) => {
 const capacity = weekCapacity(week);
 const earnings = week === 1 ? earningsSummary.w1 : earningsSummary.w2;
 const dailyBreakdown = week === 1 ? earningsSummary.d1 : earningsSummary.d2;

 return (
 <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
 {/* Week header */}
 <div className="px-5 py-3.5 bg-muted/40 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
 <div className="flex items-center gap-3">
 <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
 <LayoutGrid size={14} className="text-primary" />
 </div>
 <div>
 <h4 className="font-semibold text-sm text-foreground">Week {week}</h4>
 <p className="text-[10px] text-muted-foreground font-medium">
 {capacity} session{capacity !== 1 ? "s" : ""} · ${fmt(earnings)} revenue · {MAX_WEEKLY_SLOTS - capacity} slot{MAX_WEEKLY_SLOTS - capacity !== 1 ? "s" : ""} open
 </p>
 </div>
 </div>
 {/* Per-day earnings pills */}
 <div className="flex gap-1.5 flex-wrap">
 {DAYS.map(day => dailyBreakdown[day] > 0 && (
 <div key={day} className="px-2 py-0.5 rounded-full bg-chart-emerald/10 border border-border text-center">
 <span className="text-[10px] font-medium text-muted-foreground block leading-tight">{day.substring(0, 3)}</span>
 <span className="text-[10px] font-semibold text-chart-emerald ">${dailyBreakdown[day]}</span>
 </div>
 ))}
 </div>
 </div>

 <div className="overflow-x-auto">
 <table className="w-full border-collapse">
 <thead>
 <tr className="border-b border-border bg-muted/20">
 <th className="p-3 pl-5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground w-24 text-left">Time</th>
 {DAYS.map(day => (
 <th key={day} className="p-3 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground text-center">
 {day.substring(0, 3)}
 <span className="hidden sm:inline">{day.substring(3)}</span>
 </th>
 ))}
 </tr>
 </thead>
 <tbody>
 {/* Morning slots */}
 {MORNING_SLOTS.map(slot => (
 <tr key={slot} className="border-b border-border/40 hover:bg-muted/5 transition-colors">
 <td className="p-2 pl-5 font-semibold text-xs text-muted-foreground bg-muted/10 whitespace-nowrap align-middle">
 {TIME_LABELS[slot]}
 </td>
 {DAYS.map(day => renderCell(week, day, slot))}
 </tr>
 ))}

 {/* Lunch break row */}
 <tr className="border-b border-border/40">
 <td colSpan={6} className="py-2 px-5 bg-muted/30">
 <div className="flex items-center gap-3">
 <div className="flex-1 h-px bg-border" />
 <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 shrink-0">
 <Coffee size={11} /> Lunch Break · 12:00 – 2:00 PM
 </span>
 <div className="flex-1 h-px bg-border" />
 </div>
 </td>
 </tr>

 {/* Afternoon slots */}
 {AFTERNOON_SLOTS.map(slot => (
 <tr key={slot} className="border-b border-border/40 last:border-b-0 hover:bg-muted/5 transition-colors">
 <td className="p-2 pl-5 font-semibold text-xs text-muted-foreground bg-muted/10 whitespace-nowrap align-middle">
 {TIME_LABELS[slot]}
 </td>
 {DAYS.map(day => renderCell(week, day, slot))}
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 );
 };

 return (
 <div className="space-y-8 animate-in fade-in duration-700">
 {/* Header */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-6 rounded-xl border border-border shadow-sm">
 <div className="space-y-1">
 <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
 <CalendarDays className="text-primary" size={22} />
 Fortnightly Timetable
 </h3>
 <p className="text-xs text-muted-foreground font-medium">
 Both weeks shown — drag clients between any slot or week. Sessions 60 min · 15 min buffer · Lunch blocked 12–2 PM.
 </p>
 {isLocked && (
 <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
 <Lock size={11} /> Timetable is locked — click Unlock to make changes.
 </p>
 )}
 {!isLocked && pendingSaves.size > 0 && (
 <p className="text-[11px] font-medium text-chart-primary ">
 {pendingSaves.size} unsaved change{pendingSaves.size > 1 ? "s" : ""} — save or discard before leaving.
 </p>
 )}
 </div>

 <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
 {/* Lock / Unlock toggle */}
 <Button
 variant={isLocked ? "default" : "outline"}
 size="sm"
 onClick={() => setIsLocked(prev => {
 const next = !prev;
 localStorage.setItem('timetable_locked', String(next));
 return next;
 })}
  className={cn(
  "rounded-xl text-xs font-medium h-9 px-4",
  isLocked
  ? "bg-muted hover:bg-muted/80 text-foreground border-none"
  : "border-border/60"
  )}
 >
 {isLocked
 ? <><Lock size={13} className="mr-1.5" /> Locked</>
 : <><Unlock size={13} className="mr-1.5" /> Lock</>}
 </Button>

 {!isLocked && pendingSaves.size > 0 && (
 <>
 <Button variant="outline" size="sm" onClick={handleResetAll}
 className="rounded-xl text-xs font-medium h-9 px-4">
 <Undo2 size={13} className="mr-1.5" /> Discard
 </Button>
 <Button size="sm" onClick={handleSaveAll} disabled={isSaving}
 className="rounded-xl text-xs font-medium bg-primary hover:bg-primary/90 text-primary-foreground h-9 px-5">
 {isSaving ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : <Save size={13} className="mr-1.5" />}
 Save {pendingSaves.size} Change{pendingSaves.size > 1 ? "s" : ""}
 </Button>
 </>
 )}

 {!isLocked && scheduledData.conflictsList.length > 0 && (
 <Button onClick={() => setIsOptimized(!isOptimized)} size="sm"
  className={cn(
  "rounded-xl h-9 px-5 font-semibold text-[10px] uppercase tracking-wider",
  isOptimized
  ? "bg-chart-emerald hover:bg-chart-emerald/90 text-primary-foreground "
  : "bg-muted hover:bg-muted/80 text-foreground "
  )}>
 {isOptimized
 ? <><CheckCircle2 size={13} className="mr-1.5" /> View Original</>
 : <><RefreshCw size={13} className="mr-1.5" /> Auto-Resolve ({scheduledData.conflictsList.length})</>}
 </Button>
 )}
 </div>
 </div>

 {/* Fortnightly earnings summary */}
 <div className="grid grid-cols-3 gap-4">
 {[
 { label: "Week 1", value: earningsSummary.w1, cap: weekCapacity(1), sub: "sessions booked" },
 { label: "Week 2", value: earningsSummary.w2, cap: weekCapacity(2), sub: "sessions booked" },
 ].map(({ label, value, cap, sub }) => (
 <Card key={label} className="border-none shadow-md rounded-xl bg-card overflow-hidden col-span-1">
 <CardContent className="p-5 space-y-2">
 <div className="flex items-center justify-between">
 <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
 <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
 <DollarSign size={14} />
 </div>
 </div>
 <h3 className="text-2xl font-semibold text-foreground">${fmt(value)}</h3>
 <p className="text-[10px] text-muted-foreground font-medium">{cap} {sub} · {MAX_WEEKLY_SLOTS} max slots</p>
 </CardContent>
 </Card>
 ))}
 <Card className="border-none shadow-sm rounded-xl bg-primary text-primary-foreground overflow-hidden col-span-1">
 <CardContent className="p-5 space-y-2">
 <div className="flex items-center justify-between">
 <span className="text-[10px] font-semibold uppercase tracking-wider opacity-70">Fortnightly</span>
 <div className="w-7 h-7 rounded-lg bg-card/10 flex items-center justify-center">
 <Sparkles size={14} />
 </div>
 </div>
 <h3 className="text-2xl font-semibold">${fmt(earningsSummary.fortnight)}</h3>
 <p className="text-[10px] opacity-70 font-medium">
 ~${fmt(Math.round(earningsSummary.fortnight * 2.16))}/mo · ~${fmt(Math.round(earningsSummary.fortnight * 26))}/yr
 </p>
 </CardContent>
 </Card>
 </div>

 {/* Both week grids */}
 <div className="space-y-6">
 {renderWeekGrid(1)}
 {renderWeekGrid(2)}
 </div>

 {/* Legend */}
 <div className="flex flex-wrap items-center gap-4 px-1">
 {[
 { cls: "bg-primary/10 border-primary/20", label: "Auto-placed" },
 { cls: "bg-chart-primary/10 border-violet-200 ", label: "Manually moved" },
 { cls: "bg-destructive/10 border-destructive/20", label: "Conflict" },
 ].map(({ cls, label }) => (
 <div key={label} className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground">
 <div className={cn("w-4 h-4 rounded-md border", cls)} />
 {label}
 </div>
 ))}
 <div className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground">
 <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
 Unsaved change
 </div>
 </div>

 {/* Auto-resolve proposed moves */}
 {isOptimized && optimizedData.proposedMoves.length > 0 && (
 <Card className="border-none shadow-sm rounded-xl bg-card border border-border overflow-hidden animate-in slide-in-from-top-4 duration-500">
 <CardHeader className="p-6 pb-4 bg-chart-emerald/10/50 border-b border-border ">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div className="space-y-1">
 <CardTitle className="text-base font-semibold text-emerald-900 flex items-center gap-2">
 <Sparkles size={18} className="text-chart-emerald" /> Auto-Resolved Conflicts
 </CardTitle>
 <CardDescription className="text-chart-emerald font-medium">
 {optimizedData.proposedMoves.length} client{optimizedData.proposedMoves.length > 1 ? "s" : ""} moved to open slots.
 </CardDescription>
 </div>
  <Button onClick={() => setShowApplyConfirm(true)} disabled={applyingMoves}
 className="bg-chart-emerald hover:bg-chart-emerald/90 text-primary-foreground rounded-xl h-9 px-6 font-semibold text-[10px] uppercase tracking-wider shrink-0">
 {applyingMoves ? <Loader2 className="mr-2 animate-spin" size={13} /> : <CheckCircle2 size={13} className="mr-2" />}
 Apply Schedule
 </Button>
 </div>
 </CardHeader>
 <CardContent className="p-5">
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
 {optimizedData.proposedMoves.map(move => (
 <div key={move.clientId} className="p-3.5 bg-muted/30 rounded-xl border border-border space-y-1.5">
 <p className="font-medium text-foreground text-sm">{move.clientName}</p>
 <p className="text-[10px] text-muted-foreground font-medium">
 <span className="text-destructive font-medium">{move.originalDay} {TIME_LABELS[move.originalSlot]} W{move.originalWeek}</span>
 {" → "}
 <span className="text-chart-emerald font-medium">{move.newDay} {TIME_LABELS[move.newSlot]} W{move.newWeek}</span>
 </p>
 <p className="text-[10px] text-muted-foreground italic">{move.reason}</p>
 </div>
 ))}
 </div>
 </CardContent>
 </Card>
 )}

 {/* Bottom info panels */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 {/* Insights */}
 <Card className="border-none shadow-sm rounded-xl bg-card text-primary-foreground overflow-hidden relative">
 <div className="absolute top-0 right-0 p-6 opacity-[0.06] pointer-events-none"><Sparkles size={96} /></div>
 <CardHeader className="pb-2">
 <CardTitle className="text-sm font-semibold uppercase tracking-wider text-primary/70 flex items-center gap-2">
 <Sparkles size={15} /> Schedule Insights
 </CardTitle>
 </CardHeader>
 <CardContent className="p-5 pt-0 space-y-2">
 {suggestions.length > 0 ? suggestions.map((s, i) => (
 <div key={i} className="p-3 bg-card/5 rounded-xl border border-primary-foreground/10 flex items-start gap-2.5">
 <Info size={13} className="text-primary/70 shrink-0 mt-0.5" />
 <p className="text-xs text-muted-foreground/60 font-medium leading-relaxed">{s}</p>
 </div>
 )) : (
 <div className="text-center py-8 space-y-2">
 <CheckCircle2 className="mx-auto text-chart-emerald/60" size={28} />
 <p className="text-xs font-medium text-muted-foreground/60">Schedule looks great!</p>
 </div>
 )}
 </CardContent>
 </Card>

 {/* Unscheduled drop zone */}
 <Card
 className={cn(
 "border-none shadow-sm rounded-xl bg-card overflow-hidden transition-all duration-150",
 dragOverKey === "unscheduled" ? "ring-2 ring-primary/50 bg-primary/5" : ""
 )}
 onDragOver={e => { e.preventDefault(); setDragOverKey("unscheduled"); }}
 onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverKey(null); }}
 onDrop={handleDropUnscheduled}
 >
 <CardHeader className="pb-2 border-b border-border bg-muted/30">
 <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
 <User size={13} className="text-primary" />
 Unscheduled ({scheduledData.unscheduled.length})
 {dragOverKey === "unscheduled" && (
 <span className="text-[10px] text-primary font-medium ml-1">· Drop to remove</span>
 )}
 </CardTitle>
 </CardHeader>
 <CardContent className="p-4">
 <ScrollArea className="h-[180px] pr-2">
 {scheduledData.unscheduled.length > 0 ? (
 <div className="space-y-1.5">
 {scheduledData.unscheduled.map(client => (
 <div
 key={client.id}
 draggable
 onDragStart={e => handleDragStart(e, client.id)}
 onDragEnd={handleDragEnd}
 className={cn(
 "flex items-center justify-between p-2.5 bg-muted/30 rounded-xl border border-border cursor-grab active:cursor-grabbing select-none group transition-all",
 draggingClientId === client.id ? "opacity-30" : "hover:bg-card hover:shadow-sm hover:border-primary/30"
 )}
 >
 <div className="flex items-center gap-2 min-w-0">
 <GripVertical size={12} className="text-muted-foreground shrink-0 opacity-40 group-hover:opacity-70" />
 <span className="text-xs font-medium text-foreground truncate">{client.name}</span>
 <span className="text-[10px] font-semibold text-muted-foreground">${client.standard_rate ?? 50}</span>
 {pendingSaves.has(client.id) && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
 </div>
 <div className="flex items-center gap-1 shrink-0 ml-1">
 {client.id in manualPlacements && (
 <Button variant="ghost" size="icon" className="h-6 w-6 rounded-lg hover:bg-destructive/10"
 onClick={() => handleResetPlacement(client.id)} title="Reset">
 <Undo2 size={11} className="text-destructive" />
 </Button>
 )}
 <Link to={`/clients/${client.id}`}>
 <Button variant="ghost" size="icon" className="h-6 w-6 rounded-lg hover:bg-primary/10">
 <ArrowRight size={11} className="text-primary" />
 </Button>
 </Link>
 </div>
 </div>
 ))}
 </div>
 ) : (
 <div className="text-center py-8 text-muted-foreground text-xs font-medium">
 All active clients are scheduled.
 </div>
 )}
 </ScrollArea>
 </CardContent>
 </Card>

 {/* Pending changes log */}
 {Object.keys(manualPlacements).length > 0 ? (
 <Card className="border-none shadow-sm rounded-xl bg-card overflow-hidden border border-violet-200 ">
 <CardHeader className="pb-2 border-b border-border bg-muted/30">
 <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between gap-2">
 <span className="flex items-center gap-2">
 <ListChecks size={13} className="text-primary" />
 Pending Changes ({Object.keys(manualPlacements).length})
 </span>
 {pendingSaves.size > 0 && (
 <button onClick={handleSaveAll} disabled={isSaving}
 className="text-[10px] font-semibold text-primary hover:underline">
 Save all
 </button>
 )}
 </CardTitle>
 </CardHeader>
 <CardContent className="p-3">
 <ScrollArea className="h-[168px] pr-1">
 <div className="space-y-1.5">
 {Object.entries(manualPlacements).map(([clientId, placement]) => {
 const client = activeClients.find(c => c.id === clientId);
 if (!client) return null;
 return (
 <div key={clientId} className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-muted/30 border border-border">
 <div className="min-w-0">
 <p className="font-medium text-foreground text-xs truncate">{client.name}</p>
 <p className="text-[10px] text-muted-foreground font-medium">
 {placement
 ? `→ ${placement.day} ${TIME_LABELS[placement.slot]} W${placement.week}`
 : "→ Unscheduled"}
 </p>
 </div>
 <Button variant="ghost" size="icon"
 className="h-6 w-6 rounded-lg hover:bg-destructive/10 shrink-0"
 onClick={() => handleResetPlacement(clientId)}>
 <Undo2 size={11} className="text-destructive" />
 </Button>
 </div>
 );
 })}
 </div>
 </ScrollArea>
 </CardContent>
 </Card>
 ) : (
 <Card className="border-none shadow-sm rounded-xl bg-card overflow-hidden border border-border">
 <CardContent className="p-5 flex flex-col items-center justify-center h-full text-center space-y-2 py-10">
 <ListChecks size={24} className="text-muted-foreground/30" />
 <p className="text-xs font-medium text-muted-foreground">No manual changes yet.</p>
 <p className="text-[10px] text-muted-foreground/60">Drag clients between slots to rearrange the schedule.</p>
 </CardContent>
 </Card>
  )}

  <ConfirmDialog
    open={showApplyConfirm}
    onOpenChange={setShowApplyConfirm}
    title="Apply Resolved Schedule"
    description={`Apply auto-resolved schedule for ${optimizedData.proposedMoves.length} client${optimizedData.proposedMoves.length > 1 ? "s" : ""}?`}
    onConfirm={executeApplySchedule}
  />
  </div>
  </div>
  );
};

export default TimetableVisualizer;
