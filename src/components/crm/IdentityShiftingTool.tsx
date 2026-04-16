"use client";

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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
  Fingerprint,
  Sparkles,
  Brain,
  Zap,
  Loader2,
  History,
  Save,
  FileText,
  Trash2,
  Clock,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  Info,
  ChevronRight,
  Wand2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import IdentityShiftingReport from './IdentityShiftingReport';
import JournalRefresher from './JournalRefresher';

type Phase = 1 | 2 | 3 | 4 | 5;

interface FormData {
  id?: string;
  problem: string;
  emotion: string;
  feltSense: string;
  identity: string;
  loopResponses: string[];
  feelingsNow: string;
  moreConsciousOf: string;
  newIntention: string;
  actionPlan: string;
  no1Thing: string;
}

const IdentityShiftingTool = () => {
  const location = useLocation();
  const prefillData = location.state?.prefill;
  const backlogId = location.state?.backlogId;
  const reflectionId = location.state?.reflectionId;

  const [phase, setPhase] = useState<Phase>(1);
  const [formData, setFormData] = useState<FormData>({
    problem: '',
    emotion: '',
    feltSense: '',
    identity: prefillData || '',
    loopResponses: [],
    feelingsNow: '',
    moreConsciousOf: '',
    newIntention: '',
    actionPlan: '',
    no1Thing: '',
  });

  const [loopStep, setLoopStep] = useState(0);
  const [currentLoopResponse, setCurrentLoopResponse] = useState('');
  const [loopContext, setLoopContext] = useState<string | null>(null);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [pastSessions, setPastSessions] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [viewingReportId, setViewingReportId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const progress = (phase / 5) * 100;

  useEffect(() => {
    fetchPastSessions();
    if (backlogId) checkForDraft();
  }, [backlogId]);

  const checkForDraft = async () => {
    const { data, error } = await supabase
      .from('identity_shifting_sessions')
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
      .from('identity_shifting_sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setPastSessions(data || []);
  };

  const loadSession = (session: any) => {
    setFormData({
      id: session.id,
      problem: session.problem || '',
      emotion: session.emotion || '',
      feltSense: session.felt_sense || '',
      identity: session.identity || '',
      loopResponses: session.loop_responses || [],
      feelingsNow: '',
      moreConsciousOf: '',
      newIntention: '',
      actionPlan: '',
      no1Thing: '',
    });
    setPhase((session.current_phase || 1) as Phase);
    setLoopStep(session.loop_step || 0);
    setShowHistory(false);
    setViewingReportId(null);
  };

  const deleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this session?")) return;

    try {
      const { error } = await supabase
        .from('identity_shifting_sessions')
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

  const saveProgress = async (isComplete: boolean = false, overrideData?: Partial<FormData>, overridePhase?: number, overrideLoopStep?: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const dataToSave = { ...formData, ...overrideData };
    const phaseToSave = overridePhase ?? phase;
    const loopStepToSave = overrideLoopStep ?? loopStep;

    setIsSaving(true);
    try {
      const payload = {
        user_id: user.id,
        backlog_id: backlogId || null,
        problem: dataToSave.problem,
        emotion: dataToSave.emotion,
        felt_sense: dataToSave.feltSense,
        identity: dataToSave.identity,
        loop_responses: dataToSave.loopResponses,
        integration_awareness: `Feelings Now: ${dataToSave.feelingsNow}\nConscious Of: ${dataToSave.moreConsciousOf}\nIntention: ${dataToSave.newIntention}`,
        integration_action: `Action: ${dataToSave.actionPlan}\nNo. 1 Thing: ${dataToSave.no1Thing}`,
        is_complete: isComplete,
        current_phase: phaseToSave,
        loop_step: loopStepToSave
      };

      let error;
      if (formData.id) {
        const { error: updateError } = await supabase.from('identity_shifting_sessions').update(payload).eq('id', formData.id);
        error = updateError;
      } else {
        const { data, error: insertError } = await supabase.from('identity_shifting_sessions').insert(payload).select().single();
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

  const handleDeepScan = async () => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-session', {
        body: { type: 'shifting', data: formData }
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
          source_session_type: 'shifting'
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

  const handleGenerateIdentity = async () => {
    if (!formData.problem) return;
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-identity', {
        body: { problem: formData.problem, emotion: formData.emotion, feltSense: formData.feltSense },
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
      const nextPhase = (phase + 1) as Phase;
      setPhase(nextPhase);
      saveProgress(false, {}, nextPhase);
    }
  };

  const handleBack = () => {
    if (phase > 1) setPhase((p) => (p - 1) as Phase);
  };

  const getLoopQuestion = () => {
    const identity = loopContext || formData.identity;
    const lastResp = formData.loopResponses[formData.loopResponses.length - 1];

    switch (loopStep) {
      case 0: return `Feel yourself being "${identity}"... what does it feel like?`;
      case 1: return `Feel "${lastResp}"... what happens in yourself when you feel "${lastResp}"?`;
      case 2: return `Who are you when you are not being "${identity}"?`;
      case 3: return `Feel yourself being "${lastResp}"... what does "${lastResp}" feel like?`;
      case 4: return `Feel "${lastResp}"... what happens in yourself when you feel "${lastResp}"?`;
      default: return "";
    }
  };

  const handleLoopNext = () => {
    if (currentLoopResponse.trim() === '') return;
    const newResponses = [...formData.loopResponses, currentLoopResponse];
    const nextLoopStep = loopStep < 4 ? loopStep + 1 : 5;
    
    setFormData({ ...formData, loopResponses: newResponses });
    setLoopStep(nextLoopStep);
    setCurrentLoopResponse('');
    
    // Save every loop step
    saveProgress(false, { loopResponses: newResponses }, phase, nextLoopStep);
  };

  const handleLoopBack = () => {
    if (loopStep > 0) {
      const nextLoopStep = loopStep - 1;
      const newResponses = [...formData.loopResponses];
      newResponses.pop();
      
      setFormData({ ...formData, loopResponses: newResponses });
      setLoopStep(nextLoopStep);
      setCurrentLoopResponse('');
      
      saveProgress(false, { loopResponses: newResponses }, phase, nextLoopStep);
    } else {
      handleBack();
    }
  };

  const handleCheckIdentity = (stillFeelsSolid: boolean) => {
    if (stillFeelsSolid) {
      handleLoopRestart();
    } else {
      handleNext();
    }
  };

  const handleLoopRestart = () => {
    setLoopStep(0);
    setCurrentLoopResponse('');
    setFormData(prev => ({ ...prev, loopResponses: [] }));
    saveProgress(false, { loopResponses: [] }, phase, 0);
  };

  const handlePhase3Check = (failed: boolean, context: string) => {
    if (failed) {
      setLoopContext(context);
      setPhase(2);
      handleLoopRestart();
    }
  };

  const reset = () => {
    setPhase(1);
    setFormData({
      problem: '',
      emotion: '',
      feltSense: '',
      identity: '',
      loopResponses: [],
      feelingsNow: '',
      moreConsciousOf: '',
      newIntention: '',
      actionPlan: '',
      no1Thing: '',
    });
    setLoopStep(0);
    setCurrentLoopResponse('');
    setLoopContext(null);
  };

  const renderPhase1 = () => (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-8">
        <div className="space-y-4">
          <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1">1. The Challenge</Label>
          <Textarea 
            placeholder="What is the problem or pattern you're facing?" 
            value={formData.problem}
            onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
            className="min-h-[120px] rounded-[2rem] border-2 border-slate-100 focus:border-indigo-500 bg-white p-8 text-xl font-medium leading-relaxed shadow-inner resize-none transition-all"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1">2. Primary Emotion</Label>
            <Input 
              placeholder="Fear, Worry, Anger, etc." 
              value={formData.emotion}
              onChange={(e) => setFormData({ ...formData, emotion: e.target.value })}
              className="h-14 rounded-2xl border-2 border-slate-100 px-6 text-lg font-bold bg-white"
            />
          </div>
          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1">3. Felt Sense</Label>
            <Input 
              placeholder="Where is it in the body?" 
              value={formData.feltSense}
              onChange={(e) => setFormData({ ...formData, feltSense: e.target.value })}
              className="h-14 rounded-2xl border-2 border-slate-100 px-6 text-lg font-bold bg-white"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">4. Stuck Identity</Label>
            <Button variant="ghost" size="sm" onClick={handleGenerateIdentity} disabled={isGenerating || !formData.problem} className="h-8 text-indigo-600 hover:bg-indigo-50 gap-1.5 font-black text-[10px] uppercase tracking-widest">
              {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Suggest
            </Button>
          </div>
          <Input
            placeholder="Who are you being when you have this problem?"
            value={formData.identity}
            onChange={(e) => setFormData({ ...formData, identity: e.target.value })}
            className="h-14 rounded-2xl border-2 border-slate-100 px-6 text-lg font-bold bg-white"
          />
          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => setFormData({ ...formData, identity: s })} className="text-[10px] font-bold px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100 hover:bg-indigo-100 transition-all">
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
        <Button onClick={handleNext} disabled={!formData.problem || !formData.identity} className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-14 font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100">
          Begin Dissolving <ArrowRight className="ml-2" size={18} />
        </Button>
      </div>
    </div>
  );

  const renderPhase2 = () => {
    if (loopStep === 5) {
      return (
        <div className="space-y-12 animate-in zoom-in-95 duration-500 text-center py-20">
          <div className="w-24 h-24 bg-indigo-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
            <RefreshCw className="text-indigo-600" size={48} />
          </div>
          <div className="space-y-4">
            <h3 className="text-3xl md:text-4xl font-serif font-bold">Check Identity</h3>
            <p className="text-xl text-muted-foreground">"Can you still feel yourself being <span className="text-indigo-600 font-bold">"{loopContext || formData.identity}"</span>?"</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Button variant="outline" onClick={() => handleCheckIdentity(true)} className="h-16 px-12 rounded-2xl border-2 border-indigo-100 text-indigo-600 font-black text-xs uppercase tracking-widest hover:bg-indigo-50">
              Yes, it's still there
            </Button>
            <Button onClick={() => handleCheckIdentity(false)} className="h-16 px-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100">
              No, it has dissolved
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center text-center space-y-16 py-12 animate-in fade-in zoom-in-95 duration-500">
        <div className="w-full max-w-md space-y-3">
          <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
            <span>Dissolving Identity</span>
            <span>Step {loopStep + 1} of 5</span>
          </div>
          <Progress value={((loopStep + 1) / 5) * 100} className="h-1 bg-slate-100 [&>div]:bg-indigo-600" />
        </div>

        <div className="space-y-8 w-full max-w-3xl">
          <h2 className="text-3xl md:text-5xl font-serif font-bold leading-tight text-slate-900">
            {getLoopQuestion()}
          </h2>

          <div className="w-full relative">
            <textarea 
              autoFocus
              className="w-full bg-transparent text-2xl md:text-3xl text-center border-none focus:ring-0 placeholder:text-slate-200 resize-none min-h-[120px] font-medium"
              placeholder="First thing that comes up..."
              value={currentLoopResponse}
              onChange={(e) => setCurrentLoopResponse(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleLoopNext())}
            />
            <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent mt-4" />
          </div>
        </div>

        <div className="flex gap-8 items-center">
          <Button variant="ghost" onClick={handleLoopBack} className="text-slate-400 uppercase tracking-widest text-[10px] font-black hover:text-indigo-600 hover:bg-transparent">
            <ArrowLeft className="mr-2" size={14} /> Back
          </Button>
          <Button 
            onClick={handleLoopNext} 
            disabled={!currentLoopResponse.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-12 h-16 font-black uppercase tracking-widest text-xs shadow-2xl shadow-indigo-200 transition-all hover:scale-105"
          >
            Continue <ArrowRight className="ml-2" size={18} />
          </Button>
        </div>

        <div className="pt-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-full text-[10px] font-black text-indigo-400 uppercase tracking-widest">
            <Info size={14} /> Keep answers brief and intuitive
          </div>
        </div>
      </div>
    );
  };

  const renderPhase3 = () => (
    <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500 py-12">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-[1.5rem] text-indigo-600 mb-2 shadow-inner">
          <ShieldCheck size={32} />
        </div>
        <h3 className="text-3xl md:text-4xl font-serif font-bold">Checking Identity</h3>
        <p className="text-lg text-muted-foreground">Testing the stability of the shift across time and space.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-10 rounded-[3rem] border-2 border-slate-100 hover:border-indigo-200 transition-all space-y-8 bg-white shadow-sm">
          <p className="text-xl font-bold text-center leading-relaxed">"Do you think you might feel yourself being <span className="text-indigo-600">"{formData.identity}"</span> in the future?"</p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => handlePhase3Check(true, `${formData.identity} in the future`)} className="flex-1 h-14 rounded-2xl border-rose-200 text-rose-600 font-black text-xs uppercase tracking-widest">Yes</Button>
            <Button variant="outline" className="flex-1 h-14 rounded-2xl border-emerald-200 text-emerald-600 hover:bg-emerald-50 font-black text-xs uppercase tracking-widest">No</Button>
          </div>
        </div>

        <div className="p-10 rounded-[3rem] border-2 border-slate-100 hover:border-indigo-200 transition-all space-y-8 bg-white shadow-sm">
          <p className="text-xl font-bold text-center leading-relaxed">"Is there any scenario in which you might still feel yourself being <span className="text-indigo-600">"{formData.identity}"</span>?"</p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => handlePhase3Check(true, `${formData.identity} in that scenario`)} className="flex-1 h-14 rounded-2xl border-rose-200 text-rose-600 font-black text-xs uppercase tracking-widest">Yes</Button>
            <Button variant="outline" className="flex-1 h-14 rounded-2xl border-emerald-200 text-emerald-600 hover:bg-emerald-50 font-black text-xs uppercase tracking-widest">No</Button>
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-8">
        <Button onClick={handleNext} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-16 px-16 font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-100">
          Move to Phase 4 <ArrowRight className="ml-2" size={18} />
        </Button>
      </div>
    </div>
  );

  const renderPhase4 = () => (
    <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500 text-center py-20">
      <div className="space-y-6">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-100 rounded-[2rem] text-amber-600 mb-2 shadow-inner">
          <Zap size={40} />
        </div>
        <h3 className="text-3xl md:text-4xl font-serif font-bold">Re-assessing the Problem</h3>
        <p className="text-xl text-muted-foreground">"Feel <span className="text-slate-900 font-bold">"{formData.problem}"</span>... does it still feel like a problem?"</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
        <Button variant="outline" onClick={() => { reset(); setPhase(1); }} className="h-16 px-12 rounded-2xl border-2 border-rose-200 text-rose-600 font-black text-xs uppercase tracking-widest hover:bg-rose-50">
          Yes, start new process
        </Button>
        <Button onClick={handleNext} className="h-16 px-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest shadow-2xl shadow-emerald-100">
          No, it's clear
        </Button>
      </div>
    </div>
  );

  const renderPhase5 = () => (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 py-8">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-[1.5rem] text-emerald-600 mb-2 shadow-inner">
          <Sparkles size={32} />
        </div>
        <h3 className="text-3xl md:text-4xl font-serif font-bold">Conscious Integration</h3>
        <p className="text-lg text-muted-foreground">Final reflections to ground the new state.</p>
      </div>

      <div className="grid grid-cols-1 gap-12">
        <div className="space-y-8">
          <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 px-2 border-l-4 border-indigo-500">Awareness</h4>
          <div className="space-y-8">
            <div className="space-y-3">
              <Label className="text-base font-bold text-slate-700 ml-1">1. How do you feel about the problem now?</Label>
              <Input value={formData.feelingsNow} onChange={e => setFormData({...formData, feelingsNow: e.target.value})} className="rounded-2xl h-14 border-2 border-slate-100 px-6 text-lg font-medium bg-white" />
            </div>
            <div className="space-y-3">
              <Label className="text-base font-bold text-slate-700 ml-1">2. What are you more conscious of now than before?</Label>
              <Input value={formData.moreConsciousOf} onChange={e => setFormData({...formData, moreConsciousOf: e.target.value})} className="rounded-2xl h-14 border-2 border-slate-100 px-6 text-lg font-medium bg-white" />
            </div>
            <div className="space-y-3">
              <Label className="text-base font-bold text-slate-700 ml-1">3. What's your new intention?</Label>
              <Input value={formData.newIntention} onChange={e => setFormData({...formData, newIntention: e.target.value})} className="rounded-2xl h-14 border-2 border-slate-100 px-6 text-lg font-medium bg-white" />
            </div>
          </div>
        </div>

        <div className="space-y-8 pt-8 border-t border-slate-100">
          <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 px-2 border-l-4 border-emerald-500">Action & Next Steps</h4>
          <div className="space-y-8">
            <div className="space-y-3">
              <Label className="text-base font-bold text-slate-700 ml-1">1. How are you going to put that intention or awareness into action?</Label>
              <Input value={formData.actionPlan} onChange={e => setFormData({...formData, actionPlan: e.target.value})} className="rounded-2xl h-14 border-2 border-slate-100 px-6 text-lg font-medium bg-white" />
            </div>
            <div className="space-y-3">
              <Label className="text-base font-bold text-slate-700 ml-1">2. What is the No.1 thing to do to make that happen?</Label>
              <Input value={formData.no1Thing} onChange={e => setFormData({...formData, no1Thing: e.target.value})} className="rounded-2xl h-14 border-2 border-slate-100 px-6 text-lg font-medium bg-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 pt-12">
        <Button 
          onClick={handleDeepScan} 
          disabled={isAnalyzing || !formData.newIntention}
          variant="outline"
          className="flex-1 h-16 rounded-2xl border-indigo-200 text-indigo-600 font-black text-xs uppercase tracking-widest hover:bg-indigo-50"
        >
          {isAnalyzing ? <Loader2 className="mr-2 animate-spin" /> : <Wand2 className="mr-2" />} Scan for Deeper Patterns
        </Button>
        <Button onClick={() => saveProgress(true)} disabled={isSaving || !formData.newIntention} className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-16 font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100">
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
                      <h4 className="font-black text-lg text-slate-900 truncate">{session.problem}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <Badge variant="secondary" className="text-[8px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 border-none px-2 py-0.5">{session.identity}</Badge>
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
    return <IdentityShiftingReport session={session} onBack={() => setViewingReportId(null)} />;
  }

  return (
    <div className="w-full">
      <div className="mb-12 space-y-6">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600">Phase {phase} of 5</h2>
            <p className="text-2xl font-black text-slate-900">
              {phase === 1 && "Isolating the Identity"}
              {phase === 2 && "Dissolving the Construct"}
              {phase === 3 && "Checking Stability"}
              {phase === 4 && "Re-assessing Problem"}
              {phase === 5 && "Conscious Integration"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {reflectionId && (
              <JournalRefresher reflectionId={reflectionId} />
            )}
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

export default IdentityShiftingTool;