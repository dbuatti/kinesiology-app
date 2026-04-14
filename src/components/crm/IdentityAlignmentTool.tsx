"use client";

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Brain,
  Zap,
  Loader2,
  History,
  Save,
  Trash2,
  Activity,
  Target,
  Anchor,
  Clock,
  ShieldAlert,
  XCircle,
  Info,
  ChevronRight,
  ShieldCheck,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import IdentityAlignmentReport from './IdentityAlignmentReport';

type Phase = 1 | 2 | 3 | 4 | 5;

interface ReconsolidationEntry {
  block: string;
  resistance: string;
  alternative: string;
  replacement: string;
}

interface FormData {
  id?: string;
  goal: string;
  targetIdentity: string;
  physicalSensation: string;
  emotionalState: string;
  reconsolidationData: ReconsolidationEntry[];
  presentCheck: boolean | null;
  futureCheck: boolean | null;
  scenarioStability: boolean | null;
  maintenanceCapacity: boolean | null;
  goalInevitable: boolean | null;
  finalAnchor: string;
}

const IdentityAlignmentTool = () => {
  const location = useLocation();
  const prefillData = location.state?.prefill;
  const backlogId = location.state?.backlogId;

  const [phase, setPhase] = useState<Phase>(1);
  const [formData, setFormData] = useState<FormData>({
    goal: '',
    targetIdentity: prefillData || '',
    physicalSensation: '',
    emotionalState: '',
    reconsolidationData: [],
    presentCheck: null,
    futureCheck: null,
    scenarioStability: null,
    maintenanceCapacity: null,
    goalInevitable: null,
    finalAnchor: '',
  });

  const [loopStep, setLoopStep] = useState<1 | 2 | 3 | 4>(1);
  const [currentLoop, setCurrentLoop] = useState<Partial<ReconsolidationEntry>>({});
  const [pastSessions, setPastSessions] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [viewingReportId, setViewingReportId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const progress = (phase / 5) * 100;

  useEffect(() => {
    fetchPastSessions();
  }, []);

  const fetchPastSessions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('identity_alignment_sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setPastSessions(data || []);
  };

  const saveProgress = async (isComplete: boolean = false) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setIsSaving(true);
    try {
      const payload = {
        user_id: user.id,
        goal: formData.goal,
        target_identity: formData.targetIdentity,
        somatic_sensations: formData.physicalSensation,
        emotional_states: formData.emotionalState,
        reconsolidation_data: formData.reconsolidationData,
        present_check: formData.presentCheck,
        future_check: formData.futureCheck,
        scenario_stability: formData.scenarioStability,
        maintenance_capacity: formData.maintenanceCapacity,
        goal_inevitable: formData.goalInevitable,
        final_anchor: formData.finalAnchor,
        is_complete: isComplete,
        current_phase: phase
      };

      let error;
      if (formData.id) {
        const { error: updateError } = await supabase.from('identity_alignment_sessions').update(payload).eq('id', formData.id);
        error = updateError;
      } else {
        const { data, error: insertError } = await supabase.from('identity_alignment_sessions').insert(payload).select().single();
        error = insertError;
        if (data) setFormData(prev => ({ ...prev, id: data.id }));
      }

      if (error) throw error;

      // If this was from a backlog item, mark it as completed
      if (isComplete && backlogId) {
        await supabase
          .from('identity_backlog')
          .update({ status: 'completed' })
          .eq('id', backlogId);
      }

      if (isComplete) toast.success("Alignment session completed!");
      else toast.success("Draft saved.");
      fetchPastSessions();
    } catch (error) {
      toast.error("Failed to save session.");
    } finally {
      setIsSaving(false);
    }
  };

  const loadSession = (session: any) => {
    setFormData({
      id: session.id,
      goal: session.goal,
      targetIdentity: session.target_identity || '',
      physicalSensation: session.somatic_sensations || '',
      emotionalState: session.emotional_states || '',
      reconsolidationData: session.reconsolidation_data || [],
      presentCheck: session.present_check,
      futureCheck: session.future_check,
      scenarioStability: session.scenario_stability,
      maintenanceCapacity: session.maintenance_capacity,
      goalInevitable: session.goal_inevitable,
      finalAnchor: session.final_anchor || '',
    });
    setPhase((session.current_phase || 1) as Phase);
    setShowHistory(false);
    setViewingReportId(null);
  };

  const deleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this session?")) return;

    try {
      const { error } = await supabase
        .from('identity_alignment_sessions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success("Session deleted.");
      if (formData.id === id) reset();
      fetchPastSessions();
    } catch (error) {
      toast.error("Failed to delete session.");
    }
  };

  const handleGenerateTargetIdentity = async () => {
    if (!formData.goal) return;
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-identity', {
        body: { goal: formData.goal, type: 'target' },
      });
      if (!error && data?.suggestions) setSuggestions(data.suggestions);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNext = () => {
    if (phase < 5) {
      setPhase((p) => (p + 1) as Phase);
      saveProgress(false);
    }
  };

  const handleBack = () => {
    if (phase > 1) setPhase((p) => (p - 1) as Phase);
  };

  const handleLoopNext = () => {
    if (loopStep === 1 && currentLoop.block) setLoopStep(2);
    else if (loopStep === 2 && currentLoop.resistance) setLoopStep(3);
    else if (loopStep === 3 && currentLoop.alternative) setLoopStep(4);
    else if (loopStep === 4 && currentLoop.replacement) {
      setFormData({
        ...formData,
        reconsolidationData: [...formData.reconsolidationData, currentLoop as ReconsolidationEntry]
      });
      setCurrentLoop({});
      setLoopStep(1);
      toast.success("Resistance metabolized.");
    }
  };

  const reset = () => {
    setPhase(1);
    setFormData({
      goal: '',
      targetIdentity: '',
      physicalSensation: '',
      emotionalState: '',
      reconsolidationData: [],
      presentCheck: null,
      futureCheck: null,
      scenarioStability: null,
      maintenanceCapacity: null,
      goalInevitable: null,
      finalAnchor: '',
    });
    setCurrentLoop({});
    setLoopStep(1);
  };

  const renderPhase1 = () => (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-8">
        <div className="space-y-4">
          <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1">1. The Goal</Label>
          <Textarea 
            placeholder="Define a specific outcome..." 
            value={formData.goal}
            onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
            className="min-h-[120px] rounded-[2rem] border-2 border-slate-100 focus:border-indigo-500 bg-white p-8 text-xl font-medium leading-relaxed shadow-inner resize-none transition-all"
          />
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">2. Target Identity</Label>
            <Button variant="ghost" size="sm" onClick={handleGenerateTargetIdentity} disabled={isGenerating || !formData.goal} className="h-8 text-indigo-600 hover:bg-indigo-50 gap-1.5 font-black text-[10px] uppercase tracking-widest">
              {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Suggest
            </Button>
          </div>
          <Input
            placeholder="Who do you need to be to achieve this?"
            value={formData.targetIdentity}
            onChange={(e) => setFormData({ ...formData, targetIdentity: e.target.value })}
            className="h-14 rounded-2xl border-2 border-slate-100 px-6 text-lg font-bold bg-white"
          />
          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => setFormData({ ...formData, targetIdentity: s })} className="text-[10px] font-bold px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100 hover:bg-indigo-100 transition-all">
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="pt-8 flex gap-4">
        <Button variant="outline" onClick={() => saveProgress(false)} disabled={isSaving || !formData.goal} className="flex-1 rounded-2xl h-14 font-black text-xs uppercase tracking-widest border-slate-200">
          <Save className="mr-2" size={18} /> Save Draft
        </Button>
        <Button onClick={handleNext} disabled={!formData.goal || !formData.targetIdentity} className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-14 font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100">
          Move to Somatic <ArrowRight className="ml-2" size={18} />
        </Button>
      </div>
    </div>
  );

  const renderPhase2 = () => (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1">3. Physical Sensation</Label>
          <Textarea 
            placeholder="What does being this identity feel like in your body?" 
            value={formData.physicalSensation}
            onChange={(e) => setFormData({ ...formData, physicalSensation: e.target.value })}
            className="min-h-[120px] rounded-[2rem] border-2 border-slate-100 focus:border-indigo-500 bg-white p-8 text-lg font-medium leading-relaxed shadow-inner resize-none transition-all"
          />
        </div>
        <div className="space-y-4">
          <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1">4. Emotional State</Label>
          <Textarea 
            placeholder="What is the core emotion of this identity?" 
            value={formData.emotionalState}
            onChange={(e) => setFormData({ ...formData, emotionalState: e.target.value })}
            className="min-h-[120px] rounded-[2rem] border-2 border-slate-100 focus:border-indigo-500 bg-white p-8 text-lg font-medium leading-relaxed shadow-inner resize-none transition-all"
          />
        </div>
      </div>
      <div className="pt-8 flex gap-4">
        <Button variant="outline" onClick={handleBack} className="flex-1 rounded-2xl h-14 font-black text-xs uppercase tracking-widest border-slate-200">
          <ArrowLeft className="mr-2" size={18} /> Back
        </Button>
        <Button onClick={handleNext} disabled={!formData.physicalSensation || !formData.emotionalState} className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-14 font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100">
          Begin Reconsolidation <ArrowRight className="ml-2" size={18} />
        </Button>
      </div>
    </div>
  );

  const renderPhase3 = () => {
    let question = "";
    let value = "";
    let onChange = (val: string) => {};
    let placeholder = "";

    if (loopStep === 1) {
      question = `Why would you not be "${formData.targetIdentity}"?`;
      value = currentLoop.block || '';
      onChange = (v) => setCurrentLoop({...currentLoop, block: v});
      placeholder = "Surface the block...";
    } else if (loopStep === 2) {
      question = `Feel "${currentLoop.block}"... what does that feel like?`;
      value = currentLoop.resistance || '';
      onChange = (v) => setCurrentLoop({...currentLoop, resistance: v});
      placeholder = "Feel the resistance...";
    } else if (loopStep === 3) {
      question = `What would it feel like to not have that problem?`;
      value = currentLoop.alternative || '';
      onChange = (v) => setCurrentLoop({...currentLoop, alternative: v});
      placeholder = "Remove the problem...";
    } else if (loopStep === 4) {
      question = `Feel "${currentLoop.alternative}"... what does that feel like?`;
      value = currentLoop.replacement || '';
      onChange = (v) => setCurrentLoop({...currentLoop, replacement: v});
      placeholder = "Embody replacement state...";
    }

    return (
      <div className="flex flex-col items-center text-center space-y-16 py-12 animate-in fade-in zoom-in-95 duration-500">
        <div className="w-full max-w-md space-y-3">
          <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
            <span className="text-amber-500">Reconsolidation Loop</span>
            <span>Waypoint {loopStep} of 4</span>
          </div>
          <Progress value={(loopStep / 4) * 100} className="h-1 bg-slate-100 [&>div]:bg-amber-500" />
        </div>

        <div className="space-y-8 w-full max-w-3xl">
          <h2 className="text-3xl md:text-5xl font-serif font-bold leading-tight text-slate-900">
            {question}
          </h2>

          <div className="w-full relative">
            <textarea 
              autoFocus
              className="w-full bg-transparent text-2xl md:text-3xl text-center border-none focus:ring-0 placeholder:text-slate-200 resize-none min-h-[120px] font-medium"
              placeholder={placeholder}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleLoopNext())}
            />
            <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent mt-4" />
          </div>
        </div>

        <div className="flex gap-8 items-center">
          <Button variant="ghost" onClick={() => loopStep > 1 ? setLoopStep((loopStep - 1) as any) : handleBack()} className="text-slate-400 uppercase tracking-widest text-[10px] font-black hover:text-indigo-600 hover:bg-transparent">
            <ArrowLeft className="mr-2" size={14} /> Back
          </Button>
          <div className="flex gap-4">
            <Button 
              onClick={handleLoopNext} 
              disabled={!value.trim()}
              className="bg-amber-600 hover:bg-amber-700 text-white rounded-full px-12 h-16 font-black uppercase tracking-widest text-xs shadow-2xl shadow-amber-200 transition-all hover:scale-105"
            >
              {loopStep === 4 ? "Metabolize & Add" : "Continue"} <ArrowRight className="ml-2" size={18} />
            </Button>
            {formData.reconsolidationData.length > 0 && loopStep === 1 && (
              <Button onClick={handleNext} variant="outline" className="rounded-full px-8 h-16 border-indigo-600 text-indigo-600 font-black uppercase tracking-widest text-xs">
                Move to Testing
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderPhase4 = () => {
    const CheckRow = ({ label, value, onChange }: { label: string, value: boolean | null, onChange: (v: boolean) => void }) => (
      <div className="p-8 bg-white rounded-[2rem] border-2 border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm">
        <Label className="text-xl font-bold text-slate-900 text-left leading-tight">{label}</Label>
        <ToggleGroup type="single" value={value === null ? "" : value ? "yes" : "no"} onValueChange={(v) => onChange(v === "yes")} className="bg-slate-100 p-1 rounded-xl shrink-0">
          <ToggleGroupItem value="yes" className="rounded-lg px-8 h-12 data-[state=on]:bg-emerald-600 data-[state=on]:text-white font-black text-xs uppercase tracking-widest">YES</ToggleGroupItem>
          <ToggleGroupItem value="no" className="rounded-lg px-8 h-12 data-[state=on]:bg-rose-600 data-[state=on]:text-white font-black text-xs uppercase tracking-widest">NO</ToggleGroupItem>
        </ToggleGroup>
      </div>
    );

    return (
      <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500 py-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-[1.5rem] text-indigo-600 mb-2 shadow-inner">
            <ShieldCheck size={32} />
          </div>
          <h3 className="text-3xl md:text-4xl font-serif font-bold">Time-Space Testing</h3>
          <p className="text-lg text-muted-foreground">Testing the stability of the shift across time and space.</p>
        </div>

        <div className="space-y-6">
          <CheckRow label={`Do you feel like you are now ${formData.targetIdentity}?`} value={formData.presentCheck} onChange={(v) => setFormData({...formData, presentCheck: v})} />
          <CheckRow label={`Do you feel like you will be ${formData.targetIdentity} in the future?`} value={formData.futureCheck} onChange={(v) => setFormData({...formData, futureCheck: v})} />
        </div>

        <div className="flex justify-center pt-8">
          <Button onClick={handleNext} disabled={formData.presentCheck !== true || formData.futureCheck !== true} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-16 px-16 font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-100">
            Move to Anchoring <ArrowRight className="ml-2" size={18} />
          </Button>
        </div>
      </div>
    );
  };

  const renderPhase5 = () => (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 py-8">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-[1.5rem] text-emerald-600 mb-2 shadow-inner">
          <Anchor size={32} />
        </div>
        <h3 className="text-3xl md:text-4xl font-serif font-bold">Final Anchoring</h3>
        <p className="text-lg text-muted-foreground">Lock in behavioral congruence and long-term capacity.</p>
      </div>

      <div className="space-y-8">
        <div className="p-8 bg-indigo-900 text-white rounded-[3rem] border border-indigo-800 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xl">
          <Label className="text-xl font-bold text-left leading-tight">Does it now feel like that goal is inevitable?</Label>
          <ToggleGroup type="single" value={formData.goalInevitable === null ? "" : formData.goalInevitable ? "yes" : "no"} onValueChange={(v) => setFormData({...formData, goalInevitable: v === "yes"})} className="bg-white/10 p-1 rounded-xl shrink-0">
            <ToggleGroupItem value="yes" className="rounded-lg px-8 h-12 data-[state=on]:bg-emerald-500 data-[state=on]:text-white font-black text-xs uppercase tracking-widest">YES</ToggleGroupItem>
            <ToggleGroupItem value="no" className="rounded-lg px-8 h-12 data-[state=on]:bg-rose-500 data-[state=on]:text-white font-black text-xs uppercase tracking-widest">NO</ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="space-y-4">
          <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1">Somatic Anchor of Inevitability</Label>
          <Input 
            placeholder="e.g. A deep breath and a slight smile..." 
            value={formData.finalAnchor}
            onChange={(e) => setFormData({ ...formData, finalAnchor: e.target.value })}
            className="h-16 rounded-2xl border-2 border-slate-100 px-8 text-xl font-medium bg-white"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 pt-12">
        <Button onClick={() => saveProgress(true)} disabled={isSaving || formData.goalInevitable !== true || !formData.finalAnchor} className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-16 font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-100">
          {isSaving ? <Loader2 className="mr-2 animate-spin" /> : <CheckCircle2 className="mr-2" />} Complete & Save Session
        </Button>
        <Button onClick={reset} variant="ghost" className="flex-1 text-slate-400 rounded-2xl h-16 font-bold hover:bg-slate-50">
          Start Fresh
        </Button>
      </div>
    </div>
  );

  const renderHistory = () => {
    const activeDrafts = pastSessions.filter(s => !s.is_complete);
    const completedSessions = pastSessions.filter(s => s.is_complete);

    return (
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-serif font-bold">Session History</h3>
          <Button variant="ghost" size="sm" onClick={() => setShowHistory(false)} className="rounded-xl font-bold text-xs uppercase tracking-widest">Close</Button>
        </div>
        
        {activeDrafts.length > 0 && (
          <div className="space-y-6">
            <p className="text-[10px] font-black text-amber-600 uppercase tracking-[0.3em] px-2 flex items-center gap-2">
              <Clock size={14} /> Active Drafts
            </p>
            <div className="grid grid-cols-1 gap-4">
              {activeDrafts.map((session) => (
                <div key={session.id} className="p-6 bg-white rounded-[2rem] border-2 border-amber-100 hover:border-amber-400 transition-all cursor-pointer group flex items-center justify-between shadow-sm" onClick={() => loadSession(session)}>
                  <div className="flex items-center gap-6 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-inner">
                      <Zap size={24} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-black text-lg text-slate-900 truncate">{session.goal}</h4>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Phase {session.current_phase} • {new Date(session.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-300 hover:text-rose-600" onClick={(e) => deleteSession(e, session.id)}><Trash2 size={18} /></Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-6">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-2">Completed Sessions</p>
          {completedSessions.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
              <History className="mx-auto mb-4 opacity-20" size={64} />
              <p className="font-medium">No completed sessions yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {completedSessions.map((session) => (
                <div key={session.id} className="p-6 bg-white rounded-[2rem] border-2 border-slate-100 hover:border-indigo-400 transition-all cursor-pointer group flex items-center justify-between shadow-sm" onClick={() => setViewingReportId(session.id)}>
                  <div className="flex items-center gap-6 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-inner">
                      <FileText size={24} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-black text-lg text-slate-900 truncate">{session.goal}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <Badge variant="secondary" className="text-[8px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 border-none px-2 py-0.5">{session.target_identity}</Badge>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(session.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all" onClick={(e) => deleteSession(e, session.id)}><Trash2 size={18} /></Button>
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm"><ArrowRight size={20} /></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (viewingReportId) {
    const session = pastSessions.find(s => s.id === viewingReportId);
    return <IdentityAlignmentReport session={session} onBack={() => setViewingReportId(null)} />;
  }

  return (
    <div className="w-full">
      <div className="mb-12 space-y-6">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600">Phase {phase} of 5</h2>
            <p className="text-2xl font-black text-slate-900">
              {phase === 1 && "Setup & Extraction"}
              {phase === 2 && "Somatic Embodiment"}
              {phase === 3 && "Reconsolidation Loop"}
              {phase === 4 && "Time-Space Testing"}
              {phase === 5 && "Final Anchoring"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setShowHistory(!showHistory)} className="rounded-full h-10 px-5 text-[10px] font-black uppercase tracking-widest gap-2 text-slate-500 hover:bg-slate-100">
              <History size={16} /> {showHistory ? "Back to Tool" : "History"}
            </Button>
            {formData.id && !showHistory && (
              <Button variant="ghost" size="sm" onClick={() => saveProgress(false)} disabled={isSaving} className="rounded-full h-10 px-5 text-[10px] font-black uppercase tracking-widest gap-2 text-indigo-600 hover:bg-indigo-50">
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save
              </Button>
            )}
          </div>
        </div>
        {!showHistory && <Progress value={progress} className="h-1.5 bg-slate-100 [&>div]:bg-indigo-600" />}
      </div>

      <div className="min-h-[500px]">
        {showHistory ? renderHistory() : (
          <>
            {phase === 1 && renderPhase1()}
            {phase === 2 && renderPhase2()}
            {phase === 3 && renderPhase3()}
            {phase === 4 && renderPhase4()}
            {phase === 5 && renderPhase5()}
          </>
        )}
      </div>
    </div>
  );
};

export default IdentityAlignmentTool;