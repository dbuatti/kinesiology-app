"use client";

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

const LimitingBeliefsTool = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const prefillData = location.state?.prefill;
  const backlogId = location.state?.backlogId;
  const reflectionId = location.state?.reflectionId;

  const [step, setStep] = useState<Step>(1);
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
  const [isGeneratingSense, setIsGeneratingSense] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [limitingSuggestions, setLimitingSuggestions] = useState<string[]>([]);
  const [positiveSuggestions, setPositiveSuggestions] = useState<string[]>([]);
  const [senseSuggestions, setSenseSuggestions] = useState<string[]>([]);

  const progress = (step / 5) * 100;

  useEffect(() => {
    fetchPastSessions();
    if (backlogId) {
      fetchBacklogItem();
      checkForDraft();
    }
  }, [backlogId]);

  const fetchBacklogItem = async () => {
    const { data } = await supabase
      .from('identity_backlog')
      .select('*')
      .eq('id', backlogId)
      .single();
    if (data) setBacklogItem(data);
  };

  const checkForDraft = async () => {
    const { data, error } = await supabase
      .from('limiting_belief_sessions')
      .select('*')
      .eq('backlog_id', backlogId)
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

  const saveProgress = async (isComplete: boolean = false, overrideData?: Partial<FormData>, overrideStep?: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const dataToSave = { ...formData, ...overrideData };
    const stepToSave = overrideStep ?? step;

    setIsSaving(true);
    try {
      const payload = {
        user_id: user.id,
        backlog_id: backlogId || null,
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

      if (isComplete && backlogId) {
        await supabase
          .from('identity_backlog')
          .update({ status: 'completed' })
          .eq('id', backlogId);
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

  const handleGenerateBelief = async (type: 'limiting_belief' | 'positive_belief' | 'felt_sense') => {
    if (!formData.problem) return;
    
    if (type === 'limiting_belief') setIsGeneratingLimiting(true);
    else if (type === 'positive_belief') setIsGeneratingPositive(true);
    else setIsGeneratingSense(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-identity', {
        body: { problem: formData.problem, feltSense: formData.feltSense, type: type },
      });

      if (!error && data?.suggestions) {
        if (type === 'limiting_belief') setLimitingSuggestions(data.suggestions);
        else if (type === 'positive_belief') setPositiveSuggestions(data.suggestions);
        else setSenseSuggestions(data.suggestions);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsGeneratingLimiting(false);
      setIsGeneratingPositive(false);
      setIsGeneratingSense(false);
    }
  };

  const handleNext = () => {
    if (step < 5) {
      const nextStep = (step + 1) as Step;
      setStep(nextStep);
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
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {backlogItem && (
        <div className="p-8 bg-rose-50 dark:bg-rose-950/10 rounded-[2.5rem] border-2 border-rose-200 dark:border-rose-900/30 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none"><Quote size={120} /></div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-lg">
              <History size={20} />
            </div>
            <h4 className="text-sm font-black text-rose-900 dark:text-rose-100 uppercase tracking-widest">Source Context</h4>
          </div>
          <div className="space-y-4 relative z-10">
            {backlogItem.priority_reasoning && (
              <div className="space-y-1">
                <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">AI Reasoning</p>
                <p className="text-sm font-medium text-rose-800 dark:text-rose-200 leading-relaxed italic">
                  "{backlogItem.priority_reasoning}"
                </p>
              </div>
            )}
            {backlogItem.polarity_insight && (
              <div className="flex items-start gap-3 p-4 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-rose-200 dark:border-rose-900/30">
                <ArrowRightLeft size={16} className="text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Polarity Insight</p>
                  <p className="text-xs font-bold text-rose-900 dark:text-rose-100">{backlogItem.polarity_insight}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-8">
        <div className="space-y-4">
          <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1">1. The Problem</Label>
          <Textarea 
            placeholder="Clearly define the problem..." 
            value={formData.problem}
            onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
            className="min-h-[120px] rounded-[2rem] border-2 border-slate-100 focus:border-indigo-500 bg-white p-8 text-xl font-medium leading-relaxed shadow-inner resize-none transition-all"
          />
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">2. The Felt Sense</Label>
            <Button variant="ghost" size="sm" onClick={() => handleGenerateBelief('felt_sense')} disabled={isGeneratingSense || !formData.problem} className="h-8 text-indigo-600 hover:bg-indigo-50 gap-1.5 font-black text-[10px] uppercase tracking-widest">
              {isGeneratingSense ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Suggest
            </Button>
          </div>
          <Input 
            placeholder="Where do you feel it in your body?" 
            value={formData.feltSense}
            onChange={(e) => setFormData({ ...formData, feltSense: e.target.value })}
            className="h-14 rounded-2xl border-2 border-slate-100 px-6 text-lg font-bold bg-white"
          />
          {senseSuggestions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {senseSuggestions.map((s, i) => (
                <button key={i} onClick={() => setFormData({ ...formData, feltSense: s })} className="text-[10px] font-bold px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100 hover:bg-indigo-100 transition-all">
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="pt-8 flex gap-4">
        <Button variant="outline" onClick={() => saveProgress(false)} disabled={isSaving || !formData.problem} className="flex-1 rounded-2xl h-14 font-black text-xs uppercase tracking-widest border-slate-200">
          <Save className="mr-2" size={18} /> Save Draft
        </Button>
        <Button onClick={handleNext} disabled={!formData.problem || !formData.feltSense} className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-14 font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100">
          Next: Extract Beliefs <ArrowRight className="ml-2" size={18} />
        </Button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Limiting Belief</Label>
            <Button variant="ghost" size="sm" onClick={() => handleGenerateBelief('limiting_belief')} disabled={isGeneratingLimiting || !formData.problem} className="h-8 text-rose-600 hover:bg-rose-50 gap-1.5 font-black text-[10px] uppercase tracking-widest">
              {isGeneratingLimiting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Suggest
            </Button>
          </div>
          <Input
            placeholder="I am..."
            value={formData.limitingBelief}
            onChange={(e) => setFormData({ ...formData, limitingBelief: e.target.value })}
            className="h-14 rounded-2xl border-2 border-slate-100 px-6 text-lg font-bold bg-white"
          />
          {limitingSuggestions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {limitingSuggestions.map((s, i) => (
                <button key={i} onClick={() => setFormData({ ...formData, limitingBelief: s.replace(/^I am\s+/i, '') })} className="text-[10px] font-bold px-4 py-2 bg-rose-50 text-rose-600 rounded-full border border-rose-100 hover:bg-rose-100 transition-all">
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Positive Belief</Label>
            <Button variant="ghost" size="sm" onClick={() => handleGenerateBelief('positive_belief')} disabled={isGeneratingPositive || !formData.problem} className="h-8 text-emerald-600 hover:bg-emerald-50 gap-1.5 font-black text-[10px] uppercase tracking-widest">
              {isGeneratingPositive ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Suggest
            </Button>
          </div>
          <Input
            placeholder="I am..."
            value={formData.positiveBelief}
            onChange={(e) => setFormData({ ...formData, positiveBelief: e.target.value })}
            className="h-14 rounded-2xl border-2 border-slate-100 px-6 text-lg font-bold bg-white"
          />
          {positiveSuggestions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {positiveSuggestions.map((s, i) => (
                <button key={i} onClick={() => setFormData({ ...formData, positiveBelief: s.replace(/^I am\s+/i, '') })} className="text-[10px] font-bold px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 hover:bg-emerald-100 transition-all">
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="pt-8 flex gap-4">
        <Button variant="outline" onClick={handleBack} className="flex-1 rounded-2xl h-14 font-black text-xs uppercase tracking-widest border-slate-200">
          <ArrowLeft className="mr-2" size={18} /> Back
        </Button>
        <Button onClick={handleNext} disabled={!formData.limitingBelief || !formData.positiveBelief} className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-14 font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100">
          Begin Dissolving Loop <ArrowRight className="ml-2" size={18} />
        </Button>
      </div>
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
      <div className="flex flex-col items-center text-center space-y-16 py-12 animate-in fade-in zoom-in-95 duration-500">
        <div className="w-full max-w-md space-y-3">
          <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
            <span className={cn(currentLoopType === 'A' ? "text-rose-500" : "text-emerald-500")}>
              Part {currentLoopType}: {currentLoopType === 'A' ? "Limiting" : "Positive"}
            </span>
            <span>Waypoint {loopSubStep} of 3</span>
          </div>
          <Progress value={(loopSubStep / 3) * 100} className={cn("h-1 bg-slate-100", currentLoopType === 'A' ? "[&>div]:bg-rose-500" : "[&>div]:bg-emerald-500")} />
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
          <Button variant="ghost" onClick={handleBack} className="text-slate-400 uppercase tracking-widest text-[10px] font-black hover:text-indigo-600 hover:bg-transparent">
            <ArrowLeft className="mr-2" size={14} /> Back
          </Button>
          <div className="flex gap-4">
            <Button 
              onClick={handleLoopNext} 
              disabled={!value.trim()}
              className={cn(
                "rounded-full px-12 h-16 font-black uppercase tracking-widest text-xs shadow-2xl transition-all hover:scale-105 text-white",
                currentLoopType === 'A' ? "bg-rose-600 hover:bg-rose-700 shadow-rose-200" : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
              )}
            >
              {loopSubStep === 3 ? "Complete Part" : "Continue"} <ArrowRight className="ml-2" size={18} />
            </Button>
            {formData.dissolveLog.length >= 2 && loopSubStep === 1 && (
              <Button onClick={handleNext} variant="outline" className="rounded-full px-8 h-16 border-indigo-600 text-indigo-600 font-black uppercase tracking-widest text-xs">
                Shift Occurred
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderStep4 = () => (
    <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500 text-center py-12">
      <div className="space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-[1.5rem] text-indigo-600 mb-2 shadow-inner">
          <ShieldCheck size={32} />
        </div>
        <h3 className="text-3xl md:text-4xl font-serif font-bold">Verification</h3>
        <p className="text-lg text-muted-foreground">Testing the stability of the shift.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-10 rounded-[3rem] border-2 border-slate-100 hover:border-indigo-200 transition-all space-y-8 bg-white shadow-sm">
          <p className="text-xl font-bold text-center leading-relaxed">"Do you still believe <span className="text-rose-600">"I am {formData.limitingBelief}"</span>?"</p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => { setFormData({ ...formData, checkBeliefResult: false }); saveProgress(false, { checkBeliefResult: false }); }} className={cn("flex-1 h-14 rounded-2xl border-emerald-200 text-emerald-600 font-black text-xs uppercase tracking-widest", formData.checkBeliefResult === false && "bg-emerald-50")}>No</Button>
            <Button variant="outline" onClick={() => { setFormData({ ...formData, checkBeliefResult: true }); saveProgress(false, { checkBeliefResult: true }); }} className={cn("flex-1 h-14 rounded-2xl border-rose-200 text-rose-600 font-black text-xs uppercase tracking-widest", formData.checkBeliefResult === true && "bg-rose-50")}>Yes</Button>
          </div>
        </div>

        <div className="p-10 rounded-[3rem] border-2 border-slate-100 hover:border-indigo-200 transition-all space-y-8 bg-white shadow-sm">
          <p className="text-xl font-bold text-center leading-relaxed">"Feel the problem of <span className="text-indigo-600">"{formData.problem}"</span>... does it still feel like a problem?"</p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => { setFormData({ ...formData, checkProblemResult: false }); saveProgress(false, { checkProblemResult: false }); }} className={cn("flex-1 h-14 rounded-2xl border-emerald-200 text-emerald-600 font-black text-xs uppercase tracking-widest", formData.checkProblemResult === false && "bg-emerald-50")}>No</Button>
            <Button variant="outline" onClick={() => { setFormData({ ...formData, checkProblemResult: true }); saveProgress(false, { checkProblemResult: true }); }} className={cn("flex-1 h-14 rounded-2xl border-rose-200 text-rose-600 font-black text-xs uppercase tracking-widest", formData.checkProblemResult === true && "bg-rose-50")}>Yes</Button>
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-8">
        <Button onClick={handleNext} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-16 px-16 font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-100">
          Move to Integration <ArrowRight className="ml-2" size={18} />
        </Button>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 py-8">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-[1.5rem] text-emerald-600 mb-2 shadow-inner">
          <Sparkles size={32} />
        </div>
        <h3 className="text-3xl md:text-4xl font-serif font-bold">Integration</h3>
        <p className="text-lg text-muted-foreground">Final reflections to ground the shift.</p>
      </div>

      <div className="grid grid-cols-1 gap-12">
        <div className="space-y-8">
          <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 px-2 border-l-4 border-indigo-500">Awareness</h4>
          <div className="space-y-4">
            <Label className="text-base font-bold text-slate-700 ml-1">What is the new awareness or perspective you're taking away?</Label>
            <Textarea value={formData.integrationAwareness} onChange={e => setFormData({...formData, integrationAwareness: e.target.value})} className="rounded-[2rem] min-h-[120px] border-2 border-slate-100 p-8 text-lg font-medium bg-white" />
          </div>
        </div>

        <div className="space-y-8 pt-8 border-t border-slate-100">
          <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 px-2 border-l-4 border-emerald-500">Action</h4>
          <div className="space-y-4">
            <Label className="text-base font-bold text-slate-700 ml-1">What is one small action you can take from this new space?</Label>
            <Input value={formData.integrationAction} onChange={e => setFormData({...formData, integrationAction: e.target.value})} className="rounded-2xl h-14 border-2 border-slate-100 px-6 text-lg font-medium bg-white" />
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 pt-12">
        <Button 
          onClick={handleDeepScan} 
          disabled={isAnalyzing || !formData.integrationAwareness}
          variant="outline"
          className="flex-1 h-16 rounded-2xl border-indigo-200 text-indigo-600 font-black text-xs uppercase tracking-widest hover:bg-indigo-50"
        >
          {isAnalyzing ? <Loader2 className="mr-2 animate-spin" /> : <Wand2 className="mr-2" />} Scan for Deeper Patterns
        </Button>
        <Button onClick={() => saveProgress(true)} disabled={isSaving || !formData.integrationAwareness} className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-16 font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100">
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
                      <h4 className="font-black text-lg text-slate-900 truncate">{session.problem}</h4>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Step {session.current_step} • {new Date(session.created_at).toLocaleDateString()}</p>
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
                <div key={session.id} className="p-6 bg-white rounded-[2rem] border-2 border-border hover:border-indigo-400 transition-all cursor-pointer group flex items-center justify-between shadow-sm" onClick={() => setViewingReportId(session.id)}>
                  <div className="flex items-center gap-6 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-inner">
                      <FileText size={24} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-black text-lg text-slate-900 truncate">{session.problem}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <Badge variant="secondary" className="text-[8px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 border-none px-2 py-0.5">{session.limiting_belief}</Badge>
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
    return <LimitingBeliefsReport session={session} onBack={() => setViewingReportId(null)} />;
  }

  return (
    <div className="w-full">
      <div className="mb-12 space-y-6">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600">Step {step} of 5</h2>
            <p className="text-2xl font-black text-slate-900">
              {step === 1 && "Problem & Feeling"}
              {step === 2 && "Belief Extraction"}
              {step === 3 && "Dissolving Loop"}
              {step === 4 && "Verification"}
              {step === 5 && "Integration"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {reflectionId && (
              <JournalRefresher reflectionId={reflectionId} />
            )}
            <Button variant="ghost" size="sm" onClick={handleLeave} className="rounded-full h-10 px-5 text-[10px] font-black uppercase tracking-widest gap-2 text-slate-500 hover:bg-slate-100">
              <ArrowLeft size={16} /> Leave for now
            </Button>
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
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
            {step === 5 && renderStep5()}
          </>
        )}
      </div>
    </div>
  );
};

export default LimitingBeliefsTool;