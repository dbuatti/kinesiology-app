"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  RefreshCw, 
  Zap, 
  Brain, 
  Dumbbell, 
  Baby, 
  AlertCircle,
  Loader2,
  ClipboardCheck,
  ArrowRight,
  ShieldCheck,
  Info,
  Lightbulb,
  Target,
  CalendarPlus,
  Plus,
  Activity,
  FlaskConical,
  Heart,
  Wind,
  FileText,
  GitBranch,
  Sparkles,
  Calendar
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { safeParse } from "@/utils/safe-json";
import EditableField from '@/components/shared/EditableField';
import { showSuccess, showError } from '@/utils/toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import AppointmentForm from "../AppointmentForm";
import PathwayFindingsList from "../PathwayFindingsList";
import CompactAvailabilityPicker from "../CompactAvailabilityPicker";

interface EmbedTabProps {
  appointment: any;
  onUpdate: () => void;
  saveField: (field: string, value: any) => Promise<void>;
  updatePriorityPattern: (category: string, itemName: string, status: 'Clear' | 'Inhibited' | null, side?: 'L' | 'R') => Promise<void>;
}

const EmbedTab = ({ appointment, onUpdate, saveField, updatePriorityPattern }: EmbedTabProps) => {
  const [muscleTests, setMuscleTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearingId, setClearingId] = useState<string | null>(null);
  const [bookNextOpen, setBookNextOpen] = useState(false);
  
  // Booking Flow State
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; time: string; slotTime: string } | null>(null);

  const fetchMuscleTests = async () => {
    try {
      const { data, error } = await supabase
        .from('muscle_tests')
        .select('*')
        .eq('appointment_id', appointment.id);
      
      if (!error) setMuscleTests(data || []);
    } catch (err) {
      console.error("Error fetching muscle tests for embed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMuscleTests();
  }, [appointment.id]);

  const inhibitedItems = useMemo(() => {
    const items: { id: string; name: string; category: string; type: 'pattern' | 'muscle'; status: string; side?: 'L' | 'R' }[] = [];
    
    const pattern = safeParse(appointment.priority_pattern, {} as any);
    Object.entries(pattern).forEach(([catKey, categoryItems]: [string, any]) => {
      Object.entries(categoryItems).forEach(([name, status]) => {
        if (status === 'Inhibited') {
          const sideMatch = name.match(/\(([LR])\)$/);
          const side = sideMatch ? sideMatch[1] as 'L' | 'R' : undefined;
          const baseName = name.replace(/ \([LR]\)$/, '');
          
          items.push({
            id: `${catKey}-${name}`,
            name: baseName,
            category: catKey,
            type: 'pattern',
            status: 'Inhibited',
            side
          });
        }
      });
    });

    muscleTests.forEach(test => {
      if (test.status !== 'Normotonic') {
        const sideMatch = test.muscle_name.match(/\(([LR])\)$/);
        const side = sideMatch ? sideMatch[1] as 'L' | 'R' : undefined;
        const baseName = test.muscle_name.replace(/ \([LR]\)$/, '').trim();

        if (!items.find(i => i.name === baseName && i.side === side)) {
          items.push({
            id: test.id,
            name: baseName,
            category: 'Muscles',
            type: 'muscle',
            status: test.status,
            side
          });
        }
      }
    });

    return items;
  }, [appointment.priority_pattern, muscleTests]);

  const handleClearItem = async (item: any) => {
    setClearingId(item.id);
    try {
      if (item.type === 'pattern') {
        await updatePriorityPattern(item.category, item.name, 'Clear', item.side);
      } else {
        const { error } = await supabase
          .from('muscle_tests')
          .update({ status: 'Normotonic' })
          .eq('id', item.id);
        
        if (error) throw error;
        await fetchMuscleTests();
      }
      showSuccess(`${item.name} marked as Clear.`);
      onUpdate();
    } catch (err) {
      showError("Failed to clear item.");
    } finally {
      setClearingId(null);
    }
  };

  const getIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('reflex')) return Baby;
    if (cat.includes('nerve')) return Zap;
    if (cat.includes('muscle')) return Dumbbell;
    return Brain;
  };

  const hasSnsResets = !!(appointment.harmonic_rocking_notes || appointment.t1_reset_notes || appointment.diaphragm_reset_notes || appointment.vagus_nerve_notes);

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      {/* Session Status Banner */}
      <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <p className="text-xs font-bold text-emerald-900 dark:text-emerald-100 uppercase tracking-tight">Session in Progress — Findings can be edited until finalized.</p>
        </div>
        <Badge variant="outline" className="bg-white border-emerald-200 text-emerald-600 font-black text-[8px] uppercase tracking-widest">Active Window</Badge>
      </div>

      {/* 1. Next Steps & Scheduling - Elevated to Top */}
      <div className="p-8 bg-indigo-600 rounded-[2.5rem] text-white shadow-xl shadow-indigo-100 dark:shadow-none relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none"><CalendarPlus size={150} /></div>
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <CalendarPlus size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-black">Schedule Follow-up</h3>
              <p className="text-indigo-100 text-sm font-medium">Lock in the next session for {appointment.clients.name}.</p>
            </div>
          </div>
          
          <Dialog open={bookNextOpen} onOpenChange={(open) => {
            setBookNextOpen(open);
            if (!open) setSelectedSlot(null);
          }}>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto bg-white text-indigo-600 hover:bg-indigo-50 rounded-2xl h-14 px-12 font-black text-xs uppercase tracking-widest shadow-lg">
                <Plus size={20} className="mr-2" /> Book Next Session
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto rounded-[3rem] p-0 mx-4 w-[calc(100%-2rem)]">
              <div className="p-10 pb-14">
                <DialogHeader className="mb-8">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl">
                      <CalendarPlus size={28} />
                    </div>
                    <div>
                      <DialogTitle className="text-3xl font-black">
                        {selectedSlot ? "Confirm Booking" : "Select Available Time"}
                      </DialogTitle>
                      <DialogDescription className="text-base font-medium">
                        {selectedSlot 
                          ? `Finalize details for ${appointment.clients.name}.`
                          : `Live availability for ${appointment.clients.name}.`
                        }
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                {selectedSlot ? (
                  <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-600 shadow-sm">
                          <Calendar size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Selected Slot</p>
                          <p className="text-sm font-bold text-indigo-900">
                            {format(selectedSlot.date, "EEEE, MMM do")} @ {format(selectedSlot.date, "h:mm a")}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setSelectedSlot(null)}
                        className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-100"
                      >
                        Change
                      </Button>
                    </div>

                    <AppointmentForm 
                      initialClientId={appointment.clients.id}
                      initialDate={selectedSlot.date}
                      initialTime={selectedSlot.time}
                      slotTime={selectedSlot.slotTime}
                      onSuccess={() => {
                        setBookNextOpen(false);
                        setSelectedSlot(null);
                        onUpdate();
                      }} 
                    />
                  </div>
                ) : (
                  <CompactAvailabilityPicker 
                    onSlotSelect={(date, time, slotTime) => setSelectedSlot({ date, time, slotTime })}
                  />
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 2. Full Session Report Summary */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Session Summary Report</h2>
              <p className="text-xs text-slate-500 font-medium">A visual breakdown of everything recorded this session.</p>
            </div>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <RefreshCw size={12} className="animate-spin-slow" /> Auto-populating from session data
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Intake & Vitals */}
          <div className="space-y-6">
            <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
              <CardHeader className="pb-3 bg-indigo-50/50 border-b border-indigo-100">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2">
                  <Target size={14} /> Intake & Vitals
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="space-y-1">
                  <p className="text-[8px] font-black text-slate-400 uppercase">Goal</p>
                  <p className="text-xs font-bold text-slate-700 leading-relaxed">{appointment.goal || 'Not set'}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1">BOLT</p>
                    <p className="text-lg font-black text-indigo-600">{appointment.bolt_score ? `${appointment.bolt_score}s` : '—'}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1">COH</p>
                    <p className="text-lg font-black text-rose-600">{appointment.coherence_score ? appointment.coherence_score.toFixed(2) : '—'}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 bg-blue-50/50 rounded-lg border border-blue-100">
                  <span className="text-[9px] font-black text-blue-600 uppercase">Hydration</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge className={cn("border-none font-black text-[8px] uppercase cursor-help", appointment.hydrated ? "bg-emerald-500" : "bg-rose-500")}>
                          {appointment.hydrated ? 'Passed' : 'Flagged'}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent className="rounded-xl p-3 bg-slate-900 text-white border-none shadow-xl max-w-[200px]">
                        <p className="text-[10px] font-bold leading-relaxed">
                          {appointment.hydrated 
                            ? "Systemic conductivity is optimal for neurological testing." 
                            : "Low hydration detected. This can cause 'Switching' and inaccurate muscle test results. Recommend water with electrolytes."}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardContent>
            </Card>

            {hasSnsResets && (
              <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
                <CardHeader className="pb-3 bg-rose-50/50 border-b border-rose-100">
                  <CardTitle className="text-[10px] font-black uppercase tracking-widest text-rose-600 flex items-center gap-2">
                    <Zap size={14} /> SNS Down-Regulation
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-3">
                  {appointment.harmonic_rocking_notes && (
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                      <CheckCircle2 size={12} className="text-emerald-500" /> Harmonic Rocking
                    </div>
                  )}
                  {appointment.t1_reset_notes && (
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                      <CheckCircle2 size={12} className="text-emerald-500" /> T1 Reset
                    </div>
                  )}
                  {appointment.diaphragm_reset_notes && (
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                      <CheckCircle2 size={12} className="text-emerald-500" /> Diaphragm Reset
                    </div>
                  )}
                  {appointment.vagus_nerve_notes && (
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                      <CheckCircle2 size={12} className="text-emerald-500" /> Vagus Process
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Column 2: Pathway Findings */}
          <div className="lg:col-span-1">
            <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden h-full">
              <CardHeader className="pb-3 bg-amber-50/50 border-b border-amber-100">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-amber-600 flex items-center gap-2">
                  <GitBranch size={14} /> Pathway Findings
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <PathwayFindingsList 
                  priorityPattern={appointment.priority_pattern} 
                  showOnlyInhibited={false}
                  className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar"
                />
              </CardContent>
            </Card>
          </div>

          {/* Column 3: Corrections & Context */}
          <div className="space-y-6">
            <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
              <CardHeader className="pb-3 bg-emerald-50/50 border-b border-emerald-100">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2">
                  <Sparkles size={14} /> Corrections & Logic
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="space-y-1">
                  <p className="text-[8px] font-black text-slate-400 uppercase">Balances Applied</p>
                  <p className="text-xs font-medium text-slate-600 leading-relaxed italic">
                    {appointment.modes_balances || 'No specific corrections logged.'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[8px] font-black text-slate-400 uppercase">Acupoints</p>
                  <p className="text-xs font-bold text-indigo-600">{appointment.acupoints || 'None recorded'}</p>
                </div>
              </CardContent>
            </Card>

            {appointment.emotion_primary_selection && (
              <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
                <CardHeader className="pb-3 bg-rose-50/50 border-b border-rose-100">
                  <CardTitle className="text-[10px] font-black uppercase tracking-widest text-rose-600 flex items-center gap-2">
                    <Heart size={14} /> Emotional Context
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-rose-600 text-white border-none font-black text-[10px] uppercase">
                      {appointment.emotion_primary_selection}
                    </Badge>
                    {appointment.luscher_color_1 && (
                      <Badge variant="outline" className="border-rose-200 text-rose-600 text-[8px] font-black uppercase">
                        Luscher: {appointment.luscher_color_1}+{appointment.luscher_color_2}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-3 italic">"{appointment.emotion_notes}"</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* 3. Clinical Verification (Re-challenge) */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-lg">
              <RefreshCw size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Clinical Verification</h2>
              <p className="text-xs text-slate-500 font-medium">Re-challenge all inhibited findings to confirm integration.</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-500 font-bold">
            {inhibitedItems.length} Items to Check
          </Badge>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-indigo-500" /></div>
        ) : inhibitedItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inhibitedItems.map((item) => {
              const Icon = getIcon(item.category);
              const isClearing = clearingId === item.id;

              return (
                <Card key={item.id} className="border-none shadow-sm bg-white group hover:shadow-md transition-all rounded-2xl overflow-hidden border-l-4 border-rose-500">
                  <CardContent className="p-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                        <Icon size={20} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-black text-slate-900 truncate">{item.name}</p>
                          {item.side && (
                            <Badge variant="outline" className="text-[8px] font-black uppercase px-1.5 py-0 border-slate-200 text-slate-400">
                              {item.side}
                            </Badge>
                          )}
                        </div>
                        <p className="text-[9px] font-bold text-rose-500 uppercase tracking-widest">{item.status}</p>
                      </div>
                    </div>

                    <Button 
                      onClick={() => handleClearItem(item)}
                      disabled={isClearing}
                      className="bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-xl h-10 px-4 font-black text-[10px] uppercase tracking-widest transition-all border border-emerald-100"
                    >
                      {isClearing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} className="mr-2" />}
                      Mark Clear
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-emerald-50/50 rounded-[2.5rem] border-2 border-dashed border-emerald-200">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <ShieldCheck size={32} className="text-emerald-500" />
            </div>
            <h3 className="text-lg font-black text-emerald-900">All Findings Integrated</h3>
            <p className="text-emerald-700/70 font-medium text-sm max-w-xs mx-auto mt-1">
              No active inhibitions detected. The system is balanced and ready for embedding.
            </p>
          </div>
        )}
      </div>

      {/* 4. Notes Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ClipboardCheck size={16} />
            </div>
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">Re-Assessment & Homework</h3>
          </div>
          <EditableField 
            field="session_north_star" 
            label="Integration Notes" 
            value={appointment.session_north_star} 
            multiline 
            placeholder="Document final re-test results and prescribed homework for the next session..." 
            onSave={saveField} 
            className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm min-h-[250px]" 
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Target size={16} />
            </div>
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">Next Session Focus</h3>
          </div>
          <EditableField 
            field="next_session_note" 
            label="Follow-up Note" 
            value={appointment.next_session_note} 
            multiline 
            placeholder="What do you need to see clearly at the start of the next session? (e.g. Re-check Moro, follow up on sleep quality...)" 
            onSave={saveField} 
            className="bg-amber-50/30 border-amber-100 p-6 rounded-2xl border shadow-sm min-h-[250px]" 
          />
        </div>
      </div>
    </div>
  );
};

export default EmbedTab;