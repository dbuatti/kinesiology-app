
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
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
  Clock,
  ShieldAlert,
  RefreshCw,
  Info,
  ChevronRight,
  ShieldCheck,
  FileText,
  Wand2,
  Quote,
  ArrowRightLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import LimitingBeliefsReport from './LimitingBeliefsReport';
import JournalRefresher from './JournalRefresher';
import BacklogSelector from './BacklogSelector';

type Step = 1 | 2 | 3 | 4 | 5;

interface FormData {
  id?: string;
  problem: string;
  feltSense: string;
  limitingBelief: string;
  positiveBelief: string;
  dissolveLog: { 
    type: 'A' | 'B', 
    identity: string,
    notice1: string, 
    notice2: string 
  }[];
  checkBeliefResult: boolean | null;
  checkProblemResult: boolean | null;
  integrationAwareness: string;
  integrationAction: string;
}

interface LimitingBeliefsToolProps {
  singlePage?: boolean;
  clientId?: string;
  appointmentId?: string;
}

const LimitingBeliefsTool = ({ singlePage = false, clientId, appointmentId }: LimitingBeliefsToolProps = {}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const prefillData = location.state?.prefill;
  const backlogId = location.state?.backlogId;
  const reflectionId = location.state?.reflectionId;

  const [step, setStep] = useState<Step>(1);
  const [currentBacklogId, setCurrentBacklogId] = useState<string | null>(backlogId || null);
  const [backlogItem, setBacklogItem] = useState<any>(null);
  const [formData, setFormData] = useState<FormData>({
    problem: '',
    feltSense: '',
    limitingBelief: prefillData || '',
    positiveBelief: '',
    dissolveLog: [],
    checkBeliefResult: null,
    checkProblemResult: null,
    integrationAwareness: '',
    integrationAction: '',
  });

  const [currentLoopType, setCurrentLoopType] = useState<'A' | 'B'>('A');
  const [loopSubStep, setLoopSubStep] = useState<1 | 2 | 3>(1);
  const [currentIdentity, setCurrentIdentity] = useState('');
  const [currentNotice1, setCurrentNotice1] = useState('');
  const [currentNotice2, setCurrentNotice2] = useState('');
  
  const [pastSessions, setPastSessions] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [viewingReportId, setViewingReportId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingLimiting, setIsGeneratingLimiting] = useState(false);
  const [isGeneratingPositive, setIsGeneratingPositive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [limitingSuggestions, setLimitingSuggestions] = useState<string[]>([]);
  const [positiveSuggestions, setPositiveSuggestions] = useState<string[]>([]);

  const progress = (step / 5) * 100;

  useEffect(() => {
    fetchPastSessions();
    if (currentBacklogId) {
      fetchBacklogItem(currentBacklogId);
      checkForDraft(currentBacklogId);
    }
  }, [currentBacklogId]);

  const fetchBacklogItem = async (id: string) => {
    const { data } = await supabase
      .from('identity_backlog')
      .select('*, practitioner_reflections(content)')
      .eq('id', id)
      .single();
    if (data) setBacklogItem(data);
  };

  const checkForDraft = async (id: string) => {
    const { data, error } = await supabase
      .from('limiting_belief_sessions')
      .select('*')
      .eq('backlog_id', id)
      .eq('is_complete', false)
      .maybeSingle();

    if (data) {
      loadSession(data);
      toast.info("Resuming your work in progress.");
    }
  };

  const fetchPastSessions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('limiting_belief_sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setPastSessions(data || []);
  };

  const handleBacklogSelect = (item: any) => {
    setCurrentBacklogId(item.id);
    setFormData(prev => ({ ...prev, limitingBelief: item.content }));
    reset();
  };

  const saveProgress = async (isComplete: boolean = false, overrideData?: Partial<FormData>, overrideStep?: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const dataToSave = { ...formData, ...overrideData };
    const stepToSave = overrideStep ?? step;

    setIsSaving(true);
    try {
      const payload = {
        user_id: user.id,
        client_id: clientId || null,
        appointment_id: appointmentId || null,
        backlog_id: currentBacklogId || null,
        problem: dataToSave.problem,
        felt_sense: dataToSave.feltSense,
        limiting_belief: dataToSave.limitingBelief,
        positive_belief: dataToSave.positiveBelief,
        dissolve_log: dataToSave.dissolveLog,
        check_belief_result: dataToSave.checkBeliefResult,
        check_problem_result: dataToSave.checkProblemResult,
        integration_awareness: dataToSave.integrationAwareness,
        integration_action: dataToSave.integrationAction,
        is_complete: isComplete,
        current_step: stepToSave
      };

      let error;
      if (formData.id) {
        const { error: updateError } = await supabase.from('limiting_belief_sessions').update(payload).eq('id', formData.id);
        error = updateError;
      } else {
        const { data, error: insertError } = await supabase.from('limiting_belief_sessions').insert(payload).select().single();
        error = insertError;
        if (data) setFormData(prev => ({ ...prev, id: data.id }));
      }

      if (error) throw error;

      if (isComplete && currentBacklogId) {
        await supabase
          .from('identity_backlog')
          .update({ status: 'completed' })
          .eq('id', currentBacklogId);
      }

      if (isComplete) toast.success("Session completed!");
      fetchPastSessions();
    } catch (error) {
      toast.error("Failed to save session.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLeave = async () => {
    await saveProgress(false);
    navigate('/sandbox');
  };

  const handleDeepScan = async () => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-session', {
        body: { type: 'belief', data: formData }
      });

      if (error) throw error;

      if (data.suggestions && data.suggestions.length > 0) {
        const { data: { user } } = await supabase.auth.getUser();
        const inserts = data.suggestions.map((s: any) => ({
          user_id: user.id,
          content: s.content,
          type: s.type,
          status: 'suggested',
          priority_reasoning: s.reasoning,
          source_session_id: formData.id,
          source_session_type: 'belief'
        }));

        await supabase.from('identity_backlog').insert(inserts);
        toast.success(`AI found ${data.suggestions.length} deeper patterns. Check the "Suggested" tab in your map.`);
      } else {
        toast.info("AI scan complete. No new patterns detected this time.");
      }
    } catch (err) {
      toast.error("AI scan failed.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const loadSession = (session: any) => {
    setFormData({
      id: session.id,
      problem: session.problem,
      feltSense: session.felt_sense || '',
      limitingBelief: session.limiting_belief,
      positiveBelief: session.positive_belief,
      dissolveLog: session.dissolve_log || [],
      checkBeliefResult: session.check_belief_result,
      checkProblemResult: session.check_problem_result,
      integrationAwareness: session.integration_awareness || '',
      integrationAction: session.integration_action || '',
    });
    setStep((session.current_step || 1) as Step);
    setShowHistory(false);
    setViewingReportId(null);
  };

  const deleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this session?")) return;

    try {
      const { error } = await supabase
        .from('limiting_belief_sessions')
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

  const handleGenerateBelief = async (type: 'limiting_belief' | 'positive_belief') => {
    if (!formData.problem) return;
    
    if (type === 'limiting_belief') setIsGeneratingLimiting(true);
    else setIsGeneratingPositive(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-identity', {
        body: { problem: formData.problem, feltSense: formData.feltSense, type: type },
      });

      if (!error && data?.suggestions) {
        if (type === 'limiting_belief') setLimitingSuggestions(data.suggestions);
        else setPositiveSuggestions(data.suggestions);
        if (singlePage) scrollTo('belief-phase-2');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsGeneratingLimiting(false);
      setIsGeneratingPositive(false);
    }
  };

  const handleNext = () => {
    if (step < 5) {
      const nextStep = (step + 1) as Step;
      setStep(nextStep);
      if (singlePage) scrollTo(`belief-phase-${nextStep}`);
      saveProgress(false, {}, nextStep);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => (s - 1) as Step);
  };

  const reset = () => {
    setStep(1);
    setFormData({
      problem: '',
      feltSense: '',
      limitingBelief: '',
      positiveBelief: '',
      dissolveLog: [],
      checkBeliefResult: null,
      checkProblemResult: null,
      integrationAwareness: '',
      integrationAction: '',
    });
    setCurrentLoopType('A');
    setLoopSubStep(1);
    setCurrentIdentity('');
    setCurrentNotice1('');
    setCurrentNotice2('');
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleLoopNext = () => {
    if (loopSubStep === 1) {
      if (!currentIdentity.trim()) return;
      setLoopSubStep(2);
    } else if (loopSubStep === 2) {
      if (!currentNotice1.trim()) return;
      setLoopSubStep(3);
    } else if (loopSubStep === 3) {
      if (!currentNotice2.trim()) return;
      
      const newLog = [...formData.dissolveLog, { 
        type: currentLoopType, 
        identity: currentIdentity,
        notice1: currentNotice1,
        notice2: currentNotice2
      }];
      
      setFormData({ ...formData, dissolveLog: newLog });
      setCurrentIdentity('');
      setCurrentNotice1('');
      setCurrentNotice2('');
      setLoopSubStep(1);
      setCurrentLoopType(currentLoopType === 'A' ? 'B' : 'A');
      
      // Save every cycle completion
      saveProgress(false, { dissolveLog: newLog });
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {backlogItem && (
        <div className="p-4 bg-muted dark:bg-rose-950/10 rounded-xl border border-destructive dark:border-destructive/30 space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><Quote size={120} /></div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-destructive text-white flex items-center justify-center shadow-lg">
              <History size={16} />
            </div>
            <h4 className="text-sm font-semibold text-rose-900 dark:text-rose-100 uppercase tracking-wider">Source Context</h4>
          </div>
          <div className="space-y-4 relative z-10">
            {backlogItem.practitioner_reflections?.content && (
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-rose-400 uppercase tracking-wider">Original Journal Entry</p>
                <p className="text-sm font-medium text-muted-foreground dark:text-muted-foreground leading-relaxed line-clamp-4 italic">
                  "{backlogItem.practitioner_reflections.content}"
                </p>
              </div>
            )}

            {backlogItem.priority_reasoning && (
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-rose-400 uppercase tracking-wider">AI Reasoning</p>
                <p className="text-sm font-medium text-rose-800 dark:text-rose-100 leading-relaxed">
                  {backlogItem.priority_reasoning}
                </p>
              </div>
            )}
            
            {backlogItem.polarity_insight && (
              <div className="flex items-start gap-3 p-4 bg-white/50 dark:bg-slate-900/50 rounded-xl border border-destructive dark:border-destructive/30">
                <ArrowRightLeft size={16} className="text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-semibold text-rose-400 uppercase tracking-wider mb-1">Polarity Insight</p>
                  <p className="text-xs font-medium text-rose-900 dark:text-rose-100">{backlogItem.polarity_insight}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-4">
          <Label className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground ml-1">1. The Problem</Label>
          <Textarea 
            placeholder="Clearly define the problem..." 
            value={formData.problem}
            onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
            className="min-h-[80px] rounded-xl border border-border focus:border-primary bg-card p-4 text-base font-medium leading-relaxed resize-none transition-all"
          />
        </div>
        <div className="space-y-4">
          <Label className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground ml-1">2. The Felt Sense</Label>
          <Input 
            placeholder="Where do you feel it in your body?" 
            value={formData.feltSense}
            onChange={(e) => setFormData({ ...formData, feltSense: e.target.value })}
            className="h-10 rounded-xl border border-border px-6 text-base font-medium bg-card"
          />
        </div>
      </div>
      {!singlePage && (
      <div className="pt-4 flex gap-4">
        <Button variant="outline" onClick={() => saveProgress(false)} disabled={isSaving || !formData.problem} className="flex-1 rounded-xl h-9 font-semibold text-xs uppercase tracking-wider border-border">
          <Save className="mr-2" size={18} /> Save Draft
        </Button>
        <Button onClick={handleNext} disabled={!formData.problem || !formData.feltSense} className="flex-[2] bg-primary hover:bg-primary/90 text-white rounded-xl h-9 font-semibold text-xs uppercase tracking-wider shadow-sm">
          Next: Extract Beliefs <ArrowRight className="ml-2" size={18} />
        </Button>
      </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <Label className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">Limiting Belief</Label>
            <div className="flex items-center gap-2">
              <BacklogSelector type="belief" onSelect={handleBacklogSelect} currentValue={formData.limitingBelief} />
              <Button variant="ghost" size="sm" onClick={() => handleGenerateBelief('limiting_belief')} disabled={isGeneratingLimiting || !formData.problem} className="h-10 text-chart-destructive hover:bg-muted gap-1.5 font-semibold text-[10px] uppercase tracking-wider rounded-xl border border-border">
                {isGeneratingLimiting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                Suggest
              </Button>
            </div>
          </div>
          <Input
            placeholder="I am..."
            value={formData.limitingBelief}
            onChange={(e) => setFormData({ ...formData, limitingBelief: e.target.value })}
            className="h-10 rounded-xl border border-border px-6 text-base font-medium bg-card"
          />
          {limitingSuggestions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {limitingSuggestions.map((s, i) => (
                <button key={i} onClick={() => setFormData({ ...formData, limitingBelief: s.replace(/^I am\s+/i, '') })} className="text-[10px] font-medium px-4 py-2 bg-muted text-chart-destructive rounded-full border border-border hover:bg-muted transition-all">
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <Label className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">Positive Belief</Label>
            <Button variant="ghost" size="sm" onClick={() => handleGenerateBelief('positive_belief')} disabled={isGeneratingPositive || !formData.problem} className="h-10 text-chart-emerald hover:bg-muted gap-1.5 font-semibold text-[10px] uppercase tracking-wider rounded-xl border border-border">
              {isGeneratingPositive ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Suggest
            </Button>
          </div>
          <Input
            placeholder="I am..."
            value={formData.positiveBelief}
            onChange={(e) => setFormData({ ...formData, positiveBelief: e.target.value })}
            className="h-10 rounded-xl border border-border px-6 text-base font-medium bg-card"
          />
          {positiveSuggestions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {positiveSuggestions.map((s, i) => (
                <button key={i} onClick={() => setFormData({ ...formData, positiveBelief: s.replace(/^I am\s+/i, '') })} className="text-[10px] font-medium px-4 py-2 bg-muted text-chart-emerald rounded-full border border-border hover:bg-muted transition-all">
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {!singlePage && (
      <div className="pt-4 flex gap-4">
        <Button variant="outline" onClick={handleBack} className="flex-1 rounded-xl h-9 font-semibold text-xs uppercase tracking-wider border-border">
          <ArrowLeft className="mr-2" size={18} /> Back
        </Button>
        <Button onClick={handleNext} disabled={!formData.limitingBelief || !formData.positiveBelief} className="flex-[2] bg-primary hover:bg-primary/90 text-white rounded-xl h-9 font-semibold text-xs uppercase tracking-wider shadow-sm">
          Begin Dissolving Loop <ArrowRight className="ml-2" size={18} />
        </Button>
      </div>
      )}
    </div>
  );

  const renderStep3 = () => {
    const currentBelief = currentLoopType === 'A' ? formData.limitingBelief : formData.positiveBelief;
    
    let question = "";
    let value = "";
    let onChange = (val: string) => {};
    let placeholder = "";

    if (loopSubStep === 1) {
      question = `What kind of person believes "I am ${currentBelief}"?`;
      value = currentIdentity;
      onChange = setCurrentIdentity;
      placeholder = "Define the identity...";
    } else if (loopSubStep === 2) {
      question = `Feel yourself being "${currentIdentity}"... what do you notice first?`;
      value = currentNotice1;
      onChange = setCurrentNotice1;
      placeholder = "First sensation or thought...";
    } else if (loopSubStep === 3) {
      question = `Now feel that... what do you notice about it now?`;
      value = currentNotice2;
      onChange = setCurrentNotice2;
      placeholder = "What has shifted?";
    }

    return (
      <div className="flex flex-col items-center text-center space-y-4 py-2 animate-in fade-in zoom-in-95 duration-500">
        <div className="w-full max-w-md space-y-3">
          <div className="flex justify-between text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            <span className={cn(currentLoopType === 'A' ? "text-rose-500" : "text-emerald-500")}>
              Part {currentLoopType}: {currentLoopType === 'A' ? "Limiting" : "Positive"}
            </span>
            <span>Waypoint {loopSubStep} of 3</span>
          </div>
          <Progress value={(loopSubStep / 3) * 100} className={cn("h-1 bg-muted", currentLoopType === 'A' ? "[&>div]:bg-chart-destructive" : "[&>div]:bg-chart-emerald")} />
        </div>

        <div className="space-y-4 w-full max-w-3xl">
          <h2 className="text-lg md:text-lg font-serif font-medium leading-tight text-foreground">
            {question}
          </h2>

          <div className="w-full relative">
            <textarea 
              autoFocus
              className="w-full bg-transparent text-lg md:text-xl text-center border-none focus:ring-0 placeholder:text-muted-foreground/60 resize-none min-h-[80px] font-medium"
              placeholder={placeholder}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleLoopNext())}
            />
            <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent mt-4" />
          </div>
        </div>

        <div className="flex gap-4 items-center">
          {!singlePage && (
          <Button variant="ghost" onClick={handleBack} className="text-muted-foreground uppercase tracking-wider text-[10px] font-semibold hover:text-chart-primary hover:bg-transparent">
            <ArrowLeft className="mr-2" size={14} /> Back
          </Button>
          )}
          <div className="flex gap-4">
            <Button 
              onClick={handleLoopNext} 
              disabled={!value.trim()}
              className={cn(
                "rounded-full px-8 h-10 font-semibold uppercase tracking-wider text-xs shadow-sm transition-all hover:scale-105 text-white",
                currentLoopType === 'A' ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90"
              )}
            >
              {loopSubStep === 3 ? "Complete Part" : "Continue"} <ArrowRight className="ml-2" size={18} />
            </Button>
            {!singlePage && formData.dissolveLog.length >= 2 && loopSubStep === 1 && (
              <Button onClick={handleNext} variant="outline" className="rounded-full px-8 h-9 border-chart-primary text-chart-primary font-semibold uppercase tracking-wider text-xs">
                Shift Occurred
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderStep4 = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500 text-center py-2">
      <div className="space-y-4">
        <div className="inline-flex items-center justify-center w-8 h-8 bg-muted rounded-xl text-chart-primary mb-2 shadow-inner">
          <ShieldCheck size={22} />
        </div>
        <h3 className="text-lg md:text-lg font-serif font-medium">Verification</h3>
        <p className="text-base text-muted-foreground">Testing the stability of the shift.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 max-w-lg mx-auto">
        <div className="p-4 rounded-xl border border-border bg-card space-y-4">
          <p className="text-base font-medium text-center leading-relaxed">"Do you still believe <span className="text-chart-destructive">"I am {formData.limitingBelief}"</span>?"</p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => { setFormData({ ...formData, checkBeliefResult: false }); saveProgress(false, { checkBeliefResult: false }); }} className={cn("flex-1 h-9 rounded-xl border-chart-emerald bg-chart-emerald/10 text-chart-emerald font-semibold text-xs uppercase tracking-wider", formData.checkBeliefResult === false && "bg-chart-emerald/30")}>No</Button>
            <Button variant="outline" onClick={() => { setFormData({ ...formData, checkBeliefResult: true }); saveProgress(false, { checkBeliefResult: true }); }} className={cn("flex-1 h-9 rounded-xl border-destructive bg-destructive/10 text-destructive font-semibold text-xs uppercase tracking-wider", formData.checkBeliefResult === true && "bg-destructive/30")}>Yes</Button>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card space-y-4">
          <p className="text-base font-medium text-center leading-relaxed">"Feel the problem of <span className="text-chart-primary">"{formData.problem}"</span>... does it still feel like a problem?"</p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => { setFormData({ ...formData, checkProblemResult: false }); saveProgress(false, { checkProblemResult: false }); }} className={cn("flex-1 h-9 rounded-xl border-chart-emerald bg-chart-emerald/10 text-chart-emerald font-semibold text-xs uppercase tracking-wider", formData.checkProblemResult === false && "bg-chart-emerald/30")}>No</Button>
            <Button variant="outline" onClick={() => { setFormData({ ...formData, checkProblemResult: true }); saveProgress(false, { checkProblemResult: true }); }} className={cn("flex-1 h-9 rounded-xl border-destructive bg-destructive/10 text-destructive font-semibold text-xs uppercase tracking-wider", formData.checkProblemResult === true && "bg-destructive/30")}>Yes</Button>
          </div>
        </div>
      </div>

      {!singlePage && (
      <div className="flex justify-center pt-4">
        <Button onClick={handleNext} className="bg-primary hover:bg-primary/90 text-white rounded-xl h-9 px-12 font-semibold text-xs uppercase tracking-wider shadow-sm">
          Move to Integration <ArrowRight className="ml-2" size={18} />
        </Button>
      </div>
      )}
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 py-2">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-8 h-8 bg-muted rounded-xl text-chart-emerald mb-2 shadow-inner">
          <Sparkles size={22} />
        </div>
        <h3 className="text-lg md:text-lg font-serif font-medium">Integration</h3>
        <p className="text-base text-muted-foreground">Final reflections to ground the shift.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-4">
          <h4 className="text-[10px] font-semibold uppercase tracking-[0.4em] text-muted-foreground px-2 border-l-4 border-primary">Awareness</h4>
          <div className="space-y-4">
            <Label className="text-base font-medium text-foreground ml-1">What is the new awareness or perspective you're taking away?</Label>
            <Textarea value={formData.integrationAwareness} onChange={e => setFormData({...formData, integrationAwareness: e.target.value})} className="rounded-xl min-h-[80px] border border-border p-4 text-base font-medium bg-card" />
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-border">
          <h4 className="text-[10px] font-semibold uppercase tracking-[0.4em] text-muted-foreground px-2 border-l-4 border-chart-emerald">Action</h4>
          <div className="space-y-4">
            <Label className="text-base font-medium text-foreground ml-1">What is one small action you can take from this new space?</Label>
            <Input value={formData.integrationAction} onChange={e => setFormData({...formData, integrationAction: e.target.value})} className="rounded-xl h-10 border border-border px-6 text-base font-medium bg-card" />
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 pt-4">
        <Button 
          onClick={handleDeepScan} 
          disabled={isAnalyzing || !formData.integrationAwareness}
          variant="outline"
          className="flex-1 h-9 rounded-xl border-border text-chart-primary font-semibold text-xs uppercase tracking-wider hover:bg-muted"
        >
          {isAnalyzing ? <Loader2 className="mr-2 animate-spin" /> : <Wand2 className="mr-2" />} Scan for Deeper Patterns
        </Button>
        <Button onClick={() => saveProgress(true)} disabled={isSaving || !formData.integrationAwareness} className="flex-[2] bg-primary hover:bg-primary/90 text-white rounded-xl h-9 font-semibold text-xs uppercase tracking-wider shadow-sm">
          {isSaving ? <Loader2 className="mr-2 animate-spin" /> : <CheckCircle2 className="mr-2" />} Complete & Save Session
        </Button>
        <Button onClick={reset} variant="ghost" className="flex-1 text-muted-foreground rounded-xl h-9 font-medium hover:bg-muted">
          Start Fresh
        </Button>
      </div>
    </div>
  );

  const renderHistory = () => {
    const activeDrafts = pastSessions.filter(s => !s.is_complete);
    const completedSessions = pastSessions.filter(s => s.is_complete);

    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-serif font-medium">Session History</h3>
          <Button variant="ghost" size="sm" onClick={() => setShowHistory(false)} className="rounded-xl font-medium text-xs uppercase tracking-wider">Close</Button>
        </div>
        
        {activeDrafts.length > 0 && (
          <div className="space-y-4">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.3em] px-2 flex items-center gap-2">
              <Clock size={14} /> Active Drafts
            </p>
            <div className="grid grid-cols-1 gap-4">
              {activeDrafts.map((session) => (
                <div key={session.id} className="p-4 bg-card rounded-xl border border-border hover:border-border transition-all cursor-pointer group flex items-center justify-between" onClick={() => loadSession(session)}>
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center text-muted-foreground shadow-inner">
                      <Zap size={18} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-base text-foreground truncate">{session.problem}</h4>
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-1">Step {session.current_step} • {new Date(session.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-muted-foreground/60 hover:text-chart-destructive" onClick={(e) => deleteSession(e, session.id)}><Trash2 size={18} /></Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.3em] px-2">Completed Sessions</p>
          {completedSessions.length === 0 ? (
            <div className="text-center py-3 text-muted-foreground bg-muted rounded-xl border border-dashed border-border">
              <History className="mx-auto mb-4 opacity-20" size={64} />
              <p className="font-medium">No completed sessions yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {completedSessions.map((session) => (
                <div key={session.id} className="p-4 bg-card rounded-xl border border-border hover:border-border transition-all cursor-pointer group flex items-center justify-between" onClick={() => setViewingReportId(session.id)}>
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center text-chart-primary group-hover:bg-primary group-hover:text-white transition-colors shadow-inner">
                      <FileText size={18} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-base text-foreground truncate">{session.problem}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <Badge variant="secondary" className="text-[10px] font-semibold uppercase tracking-wider bg-muted text-muted-foreground border-none px-2 py-0.5">{session.limiting_belief}</Badge>
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{new Date(session.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-muted-foreground/60 hover:text-chart-destructive opacity-0 group-hover:opacity-100 transition-all" onClick={(e) => deleteSession(e, session.id)}><Trash2 size={18} /></Button>
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-white transition-all shadow-sm"><ArrowRight size={16} /></div>
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
    return <LimitingBeliefsReport session={session} onBack={() => setViewingReportId(null)} />;
  }

  return (
    <div className="w-full">
      {!singlePage && (
        <div className="mb-12 space-y-4">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.4em] text-chart-primary">Step {step} of 5</h2>
              <p className="text-lg font-semibold text-foreground">
                {step === 1 && "Problem &amp; Feeling"}
                {step === 2 && "Belief Extraction"}
                {step === 3 && "Dissolving Loop"}
                {step === 4 && "Verification"}
                {step === 5 && "Integration"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {reflectionId && <JournalRefresher reflectionId={reflectionId} />}
              <Button variant="ghost" size="sm" onClick={handleLeave} className="rounded-full h-10 px-5 text-[10px] font-semibold uppercase tracking-wider gap-2 text-muted-foreground hover:bg-muted">
                <ArrowLeft size={16} /> Leave for now
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowHistory(!showHistory)} className="rounded-full h-10 px-5 text-[10px] font-semibold uppercase tracking-wider gap-2 text-muted-foreground hover:bg-muted">
                <History size={16} /> {showHistory ? "Back to Tool" : "History"}
              </Button>
              {formData.id && !showHistory && (
                <Button variant="ghost" size="sm" onClick={() => saveProgress(false)} disabled={isSaving} className="rounded-full h-10 px-5 text-[10px] font-semibold uppercase tracking-wider gap-2 text-chart-primary hover:bg-muted">
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save
                </Button>
              )}
            </div>
          </div>
          {!showHistory && <Progress value={progress} className="h-1.5 bg-muted [&>div]:bg-primary" />}
        </div>
      )}

      <div className={singlePage ? "space-y-4" : "min-h-[500px]"}>
        {showHistory ? renderHistory() : (
          singlePage ? (
            <div className="space-y-4">
              <section id="belief-phase-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-4 h-4 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[10px] font-semibold">1</span>
                  <h3 className="text-xs font-semibold text-foreground">Problem &amp; Feeling</h3>
                </div>
                {renderStep1()}
              </section>
              <section id="belief-phase-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-4 h-4 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[10px] font-semibold">2</span>
                  <h3 className="text-xs font-semibold text-foreground">Belief Extraction</h3>
                </div>
                {renderStep2()}
              </section>
              <section id="belief-phase-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-4 h-4 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[10px] font-semibold">3</span>
                  <h3 className="text-xs font-semibold text-foreground">Dissolving Loop</h3>
                </div>
                {renderStep3()}
              </section>
              <section id="belief-phase-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-4 h-4 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[10px] font-semibold">4</span>
                  <h3 className="text-xs font-semibold text-foreground">Verification</h3>
                </div>
                {renderStep4()}
              </section>
              <section id="belief-phase-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-4 h-4 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[10px] font-semibold">5</span>
                  <h3 className="text-xs font-semibold text-foreground">Integration</h3>
                </div>
                {renderStep5()}
              </section>
            </div>
          ) : (
            <>
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}
              {step === 4 && renderStep4()}
              {step === 5 && renderStep5()}
            </>
          )
        )}
      </div>
    </div>
  );
};

export default LimitingBeliefsTool;