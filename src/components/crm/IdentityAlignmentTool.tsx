import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
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
  MessageSquare,
  Loader2,
  History,
  Save,
  Plus,
  FileText,
  Trash2,
  Activity,
  Target,
  Anchor,
  Clock,
  ShieldAlert,
  XCircle
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
  const [phase, setPhase] = useState<Phase>(1);
  const [formData, setFormData] = useState<FormData>({
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

    if (error) {
      console.error("Error fetching sessions:", error);
    } else {
      setPastSessions(data || []);
    }
  };

  const handleGenerateTargetIdentity = async () => {
    if (!formData.goal) return;
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-identity', {
        body: { goal: formData.goal, type: 'target' },
      });
      if (error) throw error;
      if (data?.suggestions) setSuggestions(data.suggestions);
    } catch (error) {
      console.error("Error generating identity:", error);
      toast.error("Failed to generate identity suggestions.");
    } finally {
      setIsGenerating(false);
    }
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
      if (isComplete) toast.success("Alignment session completed!");
      else toast.success("Draft saved.");
      fetchPastSessions();
    } catch (error) {
      console.error("Error saving session:", error);
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
      console.error("Error deleting session:", error);
      toast.error("Failed to delete session.");
    }
  };

  const handleNext = () => {
    if (phase < 5) {
      const nextPhase = (phase + 1) as Phase;
      setPhase(nextPhase);
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

  const handleCheckFailure = (targetPhase: Phase = 3) => {
    toast.error("Check failed. Returning to Reconsolidation Loop to clear the block.");
    setPhase(targetPhase);
    if (targetPhase === 3) setLoopStep(1);
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
    setSuggestions([]);
  };

  const renderPhase1 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2 mb-4">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full text-primary mb-2">
          <Target size={24} />
        </div>
        <h3 className="text-xl font-serif font-bold">Phase 1: Setup & Extraction</h3>
        <p className="text-sm text-muted-foreground">Define your goal and extract the latent identity.</p>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="goal">Step 1: Establish the Goal</Label>
          <Textarea id="goal" placeholder="Define a specific outcome..." value={formData.goal} onChange={(e) => setFormData({ ...formData, goal: e.target.value })} className="min-h-[100px] rounded-xl" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="targetIdentity">Step 2: Extract the Required Identity</Label>
            <Button variant="ghost" size="sm" onClick={handleGenerateTargetIdentity} disabled={isGenerating || !formData.goal} className="h-8 px-2 text-primary hover:bg-primary/10 gap-1.5">
              {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              <span className="text-xs font-bold">Magic Suggest</span>
            </Button>
          </div>
          <Input id="targetIdentity" placeholder="e.g. The Confident Practitioner" value={formData.targetIdentity} onChange={(e) => setFormData({ ...formData, targetIdentity: e.target.value })} className="rounded-xl" />
          <AnimatePresence>
            {suggestions.length > 0 && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-wrap gap-2 mt-2">
                {suggestions.map((suggestion, index) => (
                  <motion.button key={index} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setFormData({ ...formData, targetIdentity: suggestion })} className="text-[10px] font-bold px-3 py-1.5 bg-primary/10 text-primary rounded-full border border-primary/20 hover:bg-primary/20 transition-colors">
                    {suggestion}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => saveProgress(false)} disabled={isSaving || !formData.goal} className="flex-1 rounded-xl h-12 font-bold">
          <Save className="mr-2" size={18} /> Save Draft
        </Button>
        <Button onClick={handleNext} disabled={!formData.goal || !formData.targetIdentity} className="flex-[2] bg-primary hover:bg-primary/90 text-white rounded-xl h-12 font-bold">
          Move to Somatic Embodiment <ArrowRight className="ml-2" size={18} />
        </Button>
      </div>
    </div>
  );

  const renderPhase2 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2 mb-4">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full text-indigo-600 mb-2">
          <Activity size={24} />
        </div>
        <h3 className="text-xl font-serif font-bold">Phase 2: Somatic Embodiment</h3>
        <p className="text-sm text-muted-foreground">Anchor the target identity into a somatic baseline.</p>
      </div>
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="somatic">Step 3: Embody the Target Identity</Label>
          <p className="text-[10px] text-muted-foreground italic mb-2">"Now feel yourself being {formData.targetIdentity}. What does that feel like?"</p>
          <Textarea id="somatic" placeholder="Map physical sensation (e.g. Standing tall, strong...)" value={formData.physicalSensation} onChange={(e) => setFormData({ ...formData, physicalSensation: e.target.value })} className="min-h-[100px] rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="emotions">Step 4: Deepen the Feeling</Label>
          <p className="text-[10px] text-muted-foreground italic mb-2">"Now feel {formData.physicalSensation || 'that sensation'}. What does that feeling feel like?"</p>
          <Input id="emotions" placeholder="Core emotional state (e.g. Peaceful, Free...)" value={formData.emotionalState} onChange={(e) => setFormData({ ...formData, emotionalState: e.target.value })} className="rounded-xl" />
        </div>
      </div>
      <div className="flex gap-4">
        <Button variant="outline" onClick={handleBack} className="flex-1 rounded-xl h-12 font-bold">
          <ArrowLeft className="mr-2" size={18} /> Back
        </Button>
        <Button onClick={handleNext} disabled={!formData.physicalSensation || !formData.emotionalState} className="flex-[2] bg-primary hover:bg-primary/90 text-white rounded-xl h-12 font-bold">
          Begin Reconsolidation Loop <ArrowRight className="ml-2" size={18} />
        </Button>
      </div>
    </div>
  );

  const renderPhase3 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2 mb-4">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full text-amber-600 mb-2">
          <Zap size={24} />
        </div>
        <h3 className="text-xl font-serif font-bold">Phase 3: The Reconsolidation Loop</h3>
        <p className="text-sm text-muted-foreground">Metabolize shadow resistance. Hit ENTER to move through waypoints.</p>
      </div>

      <Card className="border-2 border-amber-500/20 bg-amber-50/5 rounded-[2rem] overflow-hidden">
        <CardHeader className="bg-amber-500/10 border-b border-amber-500/20">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">Waypoint {loopStep} of 4</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={cn("w-2 h-2 rounded-full", i <= loopStep ? "bg-amber-500" : "bg-amber-200")} />
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <AnimatePresence mode="wait">
            {loopStep === 1 && (
              <motion.div key="w1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <Label className="text-xl font-serif">"Why would you not be {formData.targetIdentity}?"</Label>
                <Input autoFocus placeholder="Surface the block (e.g. Because I'm afraid...)" value={currentLoop.block || ''} onChange={e => setCurrentLoop({...currentLoop, block: e.target.value})} onKeyDown={(e) => e.key === 'Enter' && handleLoopNext()} className="h-14 text-lg rounded-xl bg-white" />
              </motion.div>
            )}
            {loopStep === 2 && (
              <motion.div key="w2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <Label className="text-xl font-serif">"Feel {currentLoop.block}. What does that feel like?"</Label>
                <Input autoFocus placeholder="Feel the resistance (e.g. Tightness in throat...)" value={currentLoop.resistance || ''} onChange={e => setCurrentLoop({...currentLoop, resistance: e.target.value})} onKeyDown={(e) => e.key === 'Enter' && handleLoopNext()} className="h-14 text-lg rounded-xl bg-white" />
              </motion.div>
            )}
            {loopStep === 3 && (
              <motion.div key="w3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <Label className="text-xl font-serif">"What would it feel like to not have that problem?"</Label>
                <Input autoFocus placeholder="Remove the problem (e.g. Light, expansive...)" value={currentLoop.alternative || ''} onChange={e => setCurrentLoop({...currentLoop, alternative: e.target.value})} onKeyDown={(e) => e.key === 'Enter' && handleLoopNext()} className="h-14 text-lg rounded-xl bg-white" />
              </motion.div>
            )}
            {loopStep === 4 && (
              <motion.div key="w4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <Label className="text-xl font-serif">"Feel {currentLoop.alternative}. What does that feel like?"</Label>
                <Input autoFocus placeholder="Embody replacement state (e.g. Freedom, Joy...)" value={currentLoop.replacement || ''} onChange={e => setCurrentLoop({...currentLoop, replacement: e.target.value})} onKeyDown={(e) => e.key === 'Enter' && handleLoopNext()} className="h-14 text-lg rounded-xl bg-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
        <CardFooter className="bg-amber-500/5 p-4 flex justify-between">
          <Button variant="ghost" onClick={() => loopStep > 1 ? setLoopStep((loopStep - 1) as any) : handleBack()} className="text-amber-700 font-bold">
            <ArrowLeft className="mr-2" size={16} /> Back
          </Button>
          <Button onClick={handleLoopNext} disabled={!(loopStep === 1 ? currentLoop.block : loopStep === 2 ? currentLoop.resistance : loopStep === 3 ? currentLoop.alternative : loopStep === 4 ? currentLoop.replacement : false)} className="bg-amber-600 text-white rounded-xl px-8">
            {loopStep === 4 ? "Metabolize & Add" : "Next Waypoint"} <ArrowRight className="ml-2" size={16} />
          </Button>
        </CardFooter>
      </Card>

      {formData.reconsolidationData.length > 0 && (
        <div className="space-y-3">
          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2">Metabolized Resistance ({formData.reconsolidationData.length})</Label>
          <div className="space-y-2">
            {formData.reconsolidationData.map((entry, i) => (
              <div key={i} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-amber-100 dark:border-amber-900/30 text-xs flex justify-between items-center group">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center"><ShieldAlert size={16} /></div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">{entry.block}</p>
                    <p className="text-emerald-600 font-medium">Shifted to: {entry.replacement}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-slate-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all" onClick={(e) => { e.stopPropagation(); const newData = [...formData.reconsolidationData]; newData.splice(i, 1); setFormData({ ...formData, reconsolidationData: newData }); }}><Trash2 size={14} /></Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-4 pt-4">
        <Button variant="outline" onClick={handleBack} className="flex-1 rounded-xl h-12 font-bold">
          <ArrowLeft className="mr-2" size={18} /> Back to Somatic
        </Button>
        <Button onClick={handleNext} disabled={formData.reconsolidationData.length === 0} className="flex-[2] bg-primary hover:bg-primary/90 text-white rounded-xl h-12 font-bold shadow-lg">
          Move to Time-Space Testing <ArrowRight className="ml-2" size={18} />
        </Button>
      </div>
    </div>
  );

  const renderPhase4 = () => {
    const CheckRow = ({ label, value, onChange, onFail }: { label: string, value: boolean | null, onChange: (v: boolean) => void, onFail: () => void }) => (
      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Label className="text-base font-bold text-slate-900 dark:text-slate-100">{label}</Label>
        <ToggleGroup type="single" value={value === null ? "" : value ? "yes" : "no"} onValueChange={(v) => {
          if (v === "yes") onChange(true);
          if (v === "no") { onChange(false); onFail(); }
        }} className="bg-muted p-1 rounded-xl">
          <ToggleGroupItem value="yes" className="rounded-lg px-6 h-10 data-[state=on]:bg-emerald-600 data-[state=on]:text-white font-black text-xs uppercase tracking-widest">YES</ToggleGroupItem>
          <ToggleGroupItem value="no" className="rounded-lg px-6 h-10 data-[state=on]:bg-rose-600 data-[state=on]:text-white font-black text-xs uppercase tracking-widest">NO</ToggleGroupItem>
        </ToggleGroup>
      </div>
    );

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center space-y-2 mb-4">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full text-emerald-600 mb-2">
            <Clock size={24} />
          </div>
          <h3 className="text-xl font-serif font-bold">Phase 4: Time-Space Testing</h3>
          <p className="text-sm text-muted-foreground">Prevent identity collapse by engaging future simulation networks.</p>
        </div>

        <div className="space-y-4">
          <CheckRow 
            label={`Step 9: Do you feel like you are now ${formData.targetIdentity}?`} 
            value={formData.presentCheck} 
            onChange={(v) => setFormData({...formData, presentCheck: v})} 
            onFail={() => handleCheckFailure(3)} 
          />
          <CheckRow 
            label={`Step 10: Do you feel like you will be ${formData.targetIdentity} in the future?`} 
            value={formData.futureCheck} 
            onChange={(v) => setFormData({...formData, futureCheck: v})} 
            onFail={() => handleCheckFailure(3)} 
          />
          
          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <Label className="text-base font-bold text-slate-900 dark:text-slate-100">{`Step 11: Is there any scenario in which you would not be ${formData.targetIdentity}?`}</Label>
            <ToggleGroup type="single" value={formData.scenarioStability === null ? "" : formData.scenarioStability ? "yes" : "no"} onValueChange={(v) => {
              if (v === "yes") { setFormData({...formData, scenarioStability: true}); handleCheckFailure(3); }
              if (v === "no") setFormData({...formData, scenarioStability: false});
            }} className="bg-muted p-1 rounded-xl">
              <ToggleGroupItem value="yes" className="rounded-lg px-6 h-10 data-[state=on]:bg-rose-600 data-[state=on]:text-white font-black text-xs uppercase tracking-widest">YES</ToggleGroupItem>
              <ToggleGroupItem value="no" className="rounded-lg px-6 h-10 data-[state=on]:bg-emerald-600 data-[state=on]:text-white font-black text-xs uppercase tracking-widest">NO</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <Button variant="outline" onClick={handleBack} className="flex-1 rounded-xl h-12 font-bold">
            <ArrowLeft className="mr-2" size={18} /> Back
          </Button>
          <Button 
            onClick={handleNext} 
            disabled={formData.presentCheck !== true || formData.futureCheck !== true || formData.scenarioStability !== false} 
            className="flex-[2] bg-primary hover:bg-primary/90 text-white rounded-xl h-12 font-bold shadow-lg"
          >
            Move to Final Anchoring <ArrowRight className="ml-2" size={18} />
          </Button>
        </div>
      </div>
    );
  };

  const renderPhase5 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2 mb-4">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full text-indigo-600 mb-2">
          <Anchor size={24} />
        </div>
        <h3 className="text-xl font-serif font-bold">Phase 5: Final Anchoring</h3>
        <p className="text-sm text-muted-foreground">Lock in behavioral congruence and long-term capacity.</p>
      </div>

      <div className="space-y-6">
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Label className="text-base font-bold text-slate-900 dark:text-slate-100">{`Step 12: Do you know that you can maintain being ${formData.targetIdentity} to achieve that reality?`}</Label>
          <ToggleGroup type="single" value={formData.maintenanceCapacity === null ? "" : formData.maintenanceCapacity ? "yes" : "no"} onValueChange={(v) => {
            if (v === "yes") setFormData({...formData, maintenanceCapacity: true});
            if (v === "no") { setFormData({...formData, maintenanceCapacity: false}); handleCheckFailure(3); }
          }} className="bg-muted p-1 rounded-xl">
            <ToggleGroupItem value="yes" className="rounded-lg px-6 h-10 data-[state=on]:bg-emerald-600 data-[state=on]:text-white font-black text-xs uppercase tracking-widest">YES</ToggleGroupItem>
            <ToggleGroupItem value="no" className="rounded-lg px-6 h-10 data-[state=on]:bg-rose-600 data-[state=on]:text-white font-black text-xs uppercase tracking-widest">NO</ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="p-6 bg-indigo-900 text-white rounded-[2rem] border border-indigo-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <Label className="text-base font-bold">{`Final Anchor: Does it now feel like that goal is inevitable?`}</Label>
          <ToggleGroup type="single" value={formData.goalInevitable === null ? "" : formData.goalInevitable ? "yes" : "no"} onValueChange={(v) => {
            if (v === "yes") setFormData({...formData, goalInevitable: true});
            if (v === "no") { setFormData({...formData, goalInevitable: false}); handleCheckFailure(1); }
          }} className="bg-white/10 p-1 rounded-xl">
            <ToggleGroupItem value="yes" className="rounded-lg px-6 h-10 data-[state=on]:bg-emerald-500 data-[state=on]:text-white font-black text-xs uppercase tracking-widest">YES</ToggleGroupItem>
            <ToggleGroupItem value="no" className="rounded-lg px-6 h-10 data-[state=on]:bg-rose-500 data-[state=on]:text-white font-black text-xs uppercase tracking-widest">NO</ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="finalAnchor">Somatic Anchor of Inevitability</Label>
          <Input id="finalAnchor" placeholder="e.g. A deep breath and a slight smile..." value={formData.finalAnchor} onChange={(e) => setFormData({ ...formData, finalAnchor: e.target.value })} className="h-14 rounded-xl text-lg font-medium" />
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-4">
        <Button onClick={() => saveProgress(true)} disabled={isSaving || formData.maintenanceCapacity !== true || formData.goalInevitable !== true || !formData.finalAnchor} className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl h-14 font-black text-sm uppercase tracking-widest shadow-xl">
          {isSaving ? <Loader2 className="mr-2 animate-spin" size={18} /> : <CheckCircle2 className="mr-2" size={18} />} Complete & Save Session
        </Button>
        <Button variant="ghost" onClick={reset} className="w-full text-muted-foreground rounded-xl h-12 font-bold">
          <RotateCcw className="mr-2" size={18} /> Start Fresh Session
        </Button>
      </div>
    </div>
  );

  const renderHistory = () => {
    const activeDrafts = pastSessions.filter(s => !s.is_complete);
    const completedSessions = pastSessions.filter(s => s.is_complete);

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-serif font-bold">Alignment History</h3>
          <Button variant="ghost" size="sm" onClick={() => setShowHistory(false)}>Close</Button>
        </div>
        
        {activeDrafts.length > 0 && (
          <div className="space-y-4">
            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest px-2 flex items-center gap-2">
              <Clock size={12} /> Active Drafts
            </p>
            <div className="grid grid-cols-1 gap-3">
              {activeDrafts.map((session) => (
                <Card key={session.id} className="border-amber-200 bg-amber-50/30 hover:border-amber-400 transition-all cursor-pointer group rounded-2xl overflow-hidden" onClick={() => loadSession(session)}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                        <Zap size={20} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 truncate">{session.goal}</h4>
                        <p className="text-[10px] text-slate-500">Phase {session.current_phase} • {new Date(session.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-slate-300 hover:text-rose-600" onClick={(e) => deleteSession(e, session.id)}><Trash2 size={16} /></Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Completed Sessions</p>
          {completedSessions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100">
              <History className="mx-auto mb-4 opacity-20" size={48} />
              <p>No completed sessions yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {completedSessions.map((session) => (
                <Card key={session.id} className="hover:border-primary/50 transition-all cursor-pointer group rounded-2xl overflow-hidden" onClick={() => setViewingReportId(session.id)}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <Anchor size={20} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 truncate">{session.goal}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-[8px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 border-none">{session.target_identity}</Badge>
                          <span className="text-[10px] text-slate-400 font-medium">{new Date(session.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-slate-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all" onClick={(e) => deleteSession(e, session.id)}><Trash2 size={16} /></Button>
                      <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all"><ArrowRight size={18} /></div>
                    </div>
                  </CardContent>
                </Card>
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
    <div className="max-w-3xl mx-auto">
      <div className="mb-8 space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-serif font-bold tracking-tight">Identity Alignment</h1>
            <p className="text-muted-foreground">Neural Reconsolidation Protocol</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)} className="rounded-full h-8 px-3 text-xs gap-1.5">
              <History size={14} /> {showHistory ? "Back to Tool" : "History & Drafts"}
            </Button>
            {!showHistory && (
              <div className="text-right">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Phase {phase} of 5</span>
                <p className="text-sm font-bold text-primary">
                  {phase === 1 && "Setup"}
                  {phase === 2 && "Somatic"}
                  {phase === 3 && "Reconsolidation"}
                  {phase === 4 && "Testing"}
                  {phase === 5 && "Anchoring"}
                </p>
              </div>
            )}
          </div>
        </div>
        {!showHistory && <Progress value={progress} className="h-2 bg-secondary" />}
      </div>

      <div className="min-h-[400px]">
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