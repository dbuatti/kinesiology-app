"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Calendar,
  Clock,
  Users,
  Plus,
  Save,
  RotateCcw,
  Trash2,
  Edit,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  CalendarDays,
  DollarSign,
  ChevronRight,
  HelpCircle,
  Loader2,
  GripVertical,
  X,
  Move,
  Target
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";
import { Client, Appointment } from "@/types/crm";
import { Link } from "react-router-dom";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const TIME_SLOTS = ["10:00", "14:00", "16:00"];
const TIME_LABELS: Record<string, string> = {
  "10:00": "10:00 AM",
  "14:00": "2:00 PM",
  "16:00": "4:00 PM"
};

interface ClientWithAppointments extends Client {
  appointments: Appointment[];
  lastSeenDate: Date | null;
  preferredTimeAnalyzed: { text: string; isLowData: boolean };
  followUpStatus: "Booked" | "Needs Follow-up" | "No Future Bookings";
}

interface ScheduledSlot {
  clientId: string;
  clientName: string;
  day: string;
  slot: string;
  week: number;
  rate: number;
}

interface IdealSchedule {
  id: string;
  name: string;
  description: string;
  slots: ScheduledSlot[];
  created_at: string;
  updated_at: string;
}

const IdealScheduleBuilder = ({ clients: propClients }: { clients: ClientWithAppointments[] }) => {
  const [schedules, setSchedules] = useState<IdealSchedule[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<IdealSchedule | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newScheduleName, setNewScheduleName] = useState("");
  const [newScheduleDescription, setNewScheduleDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [draggedClient, setDraggedClient] = useState<ClientWithAppointments | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editSchedule, setEditSchedule] = useState<IdealSchedule | null>(null);
  const [activeWeek, setActiveWeek] = useState<1 | 2>(1);

  // Filter to active clients for the builder
  const activeClients = useMemo(() => {
    const now = new Date();
    return propClients.filter(c => {
      if (c.appointments.some(app => new Date(app.date) > now)) return true;
      if (!c.lastSeenDate) return false;
      const diffDays = (now.getTime() - c.lastSeenDate.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays <= 90;
    });
  }, [propClients]);

  // Load schedules from database
  const loadSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from("ideal_schedules")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSchedules(data || []);
    } catch (err: any) {
      console.error("Error loading schedules:", err);
    }
  };

  useEffect(() => {
    loadSchedules();
  }, []);

  const createNewSchedule = async () => {
    if (!newScheduleName.trim()) {
      showError("Please enter a schedule name.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("ideal_schedules")
        .insert({
          name: newScheduleName,
          description: newScheduleDescription,
          slots: []
        })
        .select()
        .single();

      if (error) throw error;

      setSchedules(prev => [data, ...prev]);
      setSelectedSchedule(data);
      setIsCreating(false);
      setNewScheduleName("");
      setNewScheduleDescription("");
      showSuccess("New ideal schedule created!");
    } catch (err: any) {
      showError(err.message || "Failed to create schedule.");
    }
  };

  const saveSchedule = async () => {
    if (!selectedSchedule) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("ideal_schedules")
        .update({
          slots: selectedSchedule.slots,
          updated_at: new Date().toISOString()
        })
        .eq("id", selectedSchedule.id);

      if (error) throw error;
      showSuccess("Schedule saved successfully!");
    } catch (err: any) {
      showError(err.message || "Failed to save schedule.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteSchedule = async (scheduleId: string) => {
    if (!confirm("Are you sure you want to delete this schedule?")) return;

    try {
      const { error } = await supabase
        .from("ideal_schedules")
        .delete()
        .eq("id", scheduleId);

      if (error) throw error;

      setSchedules(prev => prev.filter(s => s.id !== scheduleId));
      if (selectedSchedule?.id === scheduleId) {
        setSelectedSchedule(null);
      }
      showSuccess("Schedule deleted successfully!");
    } catch (err: any) {
      showError(err.message || "Failed to delete schedule.");
    }
  };

  const handleDragStart = (client: ClientWithAppointments) => {
    setDraggedClient(client);
  };

  const handleDrop = (day: string, slot: string, week: number) => {
    if (!draggedClient) return;

    // Check if slot is already occupied
    const isOccupied = selectedSchedule?.slots.some(s => 
      s.day === day && s.slot === slot && s.week === week
    );

    if (isOccupied) {
      showError("This time slot is already occupied.");
      return;
    }

    // Add to schedule
    const newSlot: ScheduledSlot = {
      clientId: draggedClient.id,
      clientName: draggedClient.name,
      day,
      slot,
      week,
      rate: draggedClient.standard_rate || 50
    };

    setSelectedSchedule(prev => {
      if (!prev) return null;
      return {
        ...prev,
        slots: [...prev.slots, newSlot]
      };
    });

    setDraggedClient(null);
  };

  const removeSlot = (clientId: string, day: string, slot: string, week: number) => {
    setSelectedSchedule(prev => {
      if (!prev) return null;
      return {
        ...prev,
        slots: prev.slots.filter(s => 
          !(s.clientId === clientId && s.day === day && s.slot === slot && s.week === week)
        )
      };
    });
  };

  const getSlotClients = (day: string, slot: string, week: number): ScheduledSlot[] => {
    return selectedSchedule?.slots.filter(s => 
      s.day === day && s.slot === slot && s.week === week
    ) || [];
  };

  const calculateScheduleEarnings = () => {
    if (!selectedSchedule) return { week1: 0, week2: 0, total: 0 };
    
    const week1 = selectedSchedule.slots
      .filter(s => s.week === 1)
      .reduce((sum, s) => sum + s.rate, 0);
    
    const week2 = selectedSchedule.slots
      .filter(s => s.week === 2)
      .reduce((sum, s) => sum + s.rate, 0);
    
    return { week1, week2, total: week1 + week2 };
  };

  const scheduleEarnings = calculateScheduleEarnings();

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-6 rounded-[2rem] border border-border shadow-sm">
        <div className="space-y-1">
          <h3 className="text-xl font-black text-foreground flex items-center gap-2">
            <Target className="text-indigo-600" size={22} />
            Ideal Schedule Builder
          </h3>
          <p className="text-xs text-muted-foreground font-medium">
            Create and manage your ideal 2-week schedule by dragging and dropping clients into time slots.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-10 px-6 font-black text-[10px] uppercase tracking-widest shadow-sm"
          >
            <Plus size={14} className="mr-2" />
            New Schedule
          </Button>
        </div>
      </div>

      {/* Schedules List */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Schedules Sidebar */}
        <Card className="border-none shadow-md rounded-[2rem] bg-card overflow-hidden">
          <CardHeader className="p-6 pb-4 border-b border-border bg-muted/30">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">
              Saved Schedules
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <ScrollArea className="h-[400px] pr-2">
              {schedules.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-xs font-medium">
                  No saved schedules yet. Create your first ideal schedule!
                </div>
              ) : (
                <div className="space-y-2">
                  {schedules.map(schedule => (
                    <div
                      key={schedule.id}
                      className={cn(
                        "p-3 rounded-xl border cursor-pointer transition-all",
                        selectedSchedule?.id === schedule.id
                          ? "bg-indigo-50 border-indigo-200 shadow-sm"
                          : "bg-muted/30 border-border hover:bg-card"
                      )}
                      onClick={() => setSelectedSchedule(schedule)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <p className="text-sm font-bold text-foreground">{schedule.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {schedule.slots.length} slots • {new Date(schedule.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditSchedule(schedule);
                              setShowEditDialog(true);
                            }}
                            className="h-6 w-6 rounded-lg hover:bg-indigo-50"
                          >
                            <Edit size={12} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSchedule(schedule.id);
                            }}
                            className="h-6 w-6 rounded-lg hover:bg-rose-50"
                          >
                            <Trash2 size={12} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Main Schedule Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Schedule Info & Actions */}
          {selectedSchedule && (
            <Card className="border-none shadow-md rounded-[2rem] bg-card overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-lg font-black text-foreground">{selectedSchedule.name}</h4>
                    <p className="text-sm text-muted-foreground font-medium">
                      {selectedSchedule.description || "Your ideal 2-week schedule"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={saveSchedule}
                      disabled={isSaving}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 px-6 font-black text-[10px] uppercase tracking-widest shadow-sm"
                    >
                      {isSaving ? (
                        <Loader2 className="mr-2 animate-spin" />
                      ) : (
                        <Save size={14} className="mr-2" />
                      )}
                      Save Schedule
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedSchedule(null)}
                      className="rounded-xl h-10 px-6 font-black text-[10px] uppercase tracking-widest"
                    >
                      <RotateCcw size={14} className="mr-2" />
                      Clear
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Earnings Summary */}
          {selectedSchedule && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-none shadow-md rounded-[2rem] bg-card overflow-hidden">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Week 1 Earnings</span>
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 flex items-center justify-center">
                      <DollarSign size={16} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-3xl font-black text-foreground">${scheduleEarnings.week1}</h3>
                    <p className="text-xs text-muted-foreground font-medium">Total for Week 1</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md rounded-[2rem] bg-card overflow-hidden">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Week 2 Earnings</span>
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 flex items-center justify-center">
                      <DollarSign size={16} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-3xl font-black text-foreground">${scheduleEarnings.week2}</h3>
                    <p className="text-xs text-muted-foreground font-medium">Total for Week 2</p>
                  </div>
                </CardContent>
              </Card>

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
                    <h3 className="text-3xl font-black">${scheduleEarnings.total}</h3>
                    <p className="text-xs text-indigo-200 font-medium">Combined 2-week earnings</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Schedule Grid */}
          {selectedSchedule && (
            <Card className="border-none shadow-lg rounded-[2.5rem] bg-card overflow-hidden">
              <CardContent className="p-6">
                {/* Week Switcher */}
                <div className="flex justify-center mb-6">
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

                {/* Timetable Grid */}
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
                            const slotClients = getSlotClients(day, slot, activeWeek);
                            const isBlockedSlot = slot === "12:00" || slot === "13:00";

                            return (
                              <td
                                key={day}
                                className={cn(
                                  "p-3 text-center border-r border-border/20 last:border-r-0 min-w-[140px] h-24 vertical-top",
                                  isBlockedSlot ? "bg-slate-100/80 dark:bg-slate-900/50" : ""
                                )}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={() => !isBlockedSlot && handleDrop(day, slot, activeWeek)}
                              >
                                {isBlockedSlot ? (
                                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest flex items-center justify-center gap-1">
                                    <X size={12} /> Blocked
                                  </span>
                                ) : slotClients.length > 0 ? (
                                  <div className="space-y-1.5">
                                    {slotClients.map(clientSlot => (
                                      <div
                                        key={`${clientSlot.clientId}-${day}-${slot}`}
                                        className="p-2 rounded-xl text-xs font-bold border bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900/30 relative group"
                                      >
                                        <div className="flex items-center justify-between">
                                          <span className="truncate">{clientSlot.clientName}</span>
                                          <button
                                            onClick={() => removeSlot(clientSlot.clientId, day, slot, activeWeek)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-rose-500 hover:text-rose-700"
                                          >
                                            <X size={12} />
                                          </button>
                                        </div>
                                        <div className="text-[9px] text-indigo-600 dark:text-indigo-400 font-medium">
                                          ${clientSlot.rate}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="h-full flex items-center justify-center">
                                    <span className="text-[10px] font-bold text-slate-300 dark:text-slate-800 uppercase tracking-widest">
                                      Drop clients here
                                    </span>
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Clients Palette */}
          {selectedSchedule && (
            <Card className="border-none shadow-md rounded-[2rem] bg-card overflow-hidden">
              <CardHeader className="p-6 pb-4 border-b border-border bg-muted/30">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Users size={16} className="text-indigo-500" /> Available Clients
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground font-medium">
                  Drag clients from here to schedule them in your ideal timetable
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <ScrollArea className="h-[300px] pr-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {activeClients.map(client => (
                      <div
                        key={client.id}
                        draggable
                        onDragStart={() => handleDragStart(client)}
                        className="p-3 rounded-xl border border-border bg-card hover:shadow-md transition-all cursor-move group"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-bold text-foreground truncate">{client.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            ${client.standard_rate || 50}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock size={12} />
                          <span className="truncate">{client.preferredTimeAnalyzed.text}</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <Badge 
                            variant={client.followUpStatus === "Booked" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {client.followUpStatus}
                          </Badge>
                          <Link to={`/clients/${client.id}`}>
                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-lg hover:bg-indigo-50">
                              <ChevronRight size={12} className="text-indigo-600" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create Schedule Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-foreground">Create New Ideal Schedule</DialogTitle>
            <p className="text-sm text-muted-foreground font-medium">
              Create a new ideal schedule template for your practice.
            </p>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-black tracking-wider text-muted-foreground">
                Schedule Name
              </Label>
              <Input
                placeholder="e.g., Standard Weekly Schedule"
                value={newScheduleName}
                onChange={(e) => setNewScheduleName(e.target.value)}
                className="rounded-xl border-border/60 focus-visible:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black tracking-wider text-muted-foreground">
                Description (Optional)
              </Label>
              <Input
                placeholder="e.g., My standard weekly client schedule"
                value={newScheduleDescription}
                onChange={(e) => setNewScheduleDescription(e.target.value)}
                className="rounded-xl border-border/60 focus-visible:ring-indigo-500"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={createNewSchedule} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white">
              Create Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Schedule Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-foreground">Edit Schedule</DialogTitle>
            <p className="text-sm text-muted-foreground font-medium">
              Update schedule details.
            </p>
          </DialogHeader>
          {editSchedule && (
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-black tracking-wider text-muted-foreground">
                  Schedule Name
                </Label>
                <Input
                  value={editSchedule.name}
                  onChange={(e) => setEditSchedule({...editSchedule, name: e.target.value})}
                  className="rounded-xl border-border/60 focus-visible:ring-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black tracking-wider text-muted-foreground">
                  Description
                </Label>
                <Input
                  value={editSchedule.description}
                  onChange={(e) => setEditSchedule({...editSchedule, description: e.target.value})}
                  className="rounded-xl border-border/60 focus-visible:ring-indigo-500"
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowEditDialog(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (editSchedule) {
                  setSchedules(prev => prev.map(s => s.id === editSchedule.id ? editSchedule : s));
                  setSelectedSchedule(editSchedule);
                  setShowEditDialog(false);
                  showSuccess("Schedule updated!");
                }
              }} 
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IdealScheduleBuilder;