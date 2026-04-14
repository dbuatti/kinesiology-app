"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
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
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import IdentityShiftingReport from './IdentityShiftingReport';

type Phase = 1 | 2 | 3 | 4 | 5;

interface FormData {
  id?: string;
  problem: string;
  emotion: string;
  feltSense: string;
  identity: string;
  loopResponses: string[];
  // Phase 5 fields
  feelingsNow: string;
  moreConsciousOf: string;
  newIntention: string;
  actionPlan: string;
  no1Thing: string;
}

const IdentityShiftingTool = () => {
  const [phase, setPhase] = useState<Phase>(1);
  const [formData, setFormData] = useState<FormData>({
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

  const [loopStep, setLoopStep] = useState(0);
  const [currentLoopResponse, setCurrentLoopResponse] = useState('');
  const [loopContext, setLoopContext] = useState<string | null>(null); // For "Future" or "Scenario" checks
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [pastSessions, setPastSessions] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [viewingReportId, setViewingReportId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const progress = (phase / 5) * 100;

  useEffect(() => {
    fetchPastSessions();
  }, []);

  const fetchPastSessions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('identity_shifting_sessions')
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
        problem: formData.problem,
        emotion: formData.emotion,
        felt_sense: formData.feltSense,
        identity: formData.identity,
        loop_responses: formData.loopResponses,
        // Map Phase 5 fields to existing schema columns for now
        integration_awareness: `Feelings Now: ${formData.feelingsNow}\nConscious Of: ${formData.moreConsciousOf}\nIntention: ${formData.newIntention}`,
        integration_action: `Action: ${formData.actionPlan}\nNo. 1 Thing: ${formData.no1Thing}`,
        is_complete: isComplete,
        current_phase: phase,
        loop_step: loopStep
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
      toast.success(isComplete ? "Session completed!" : "Draft saved.");
      fetchPastSessions();
    } catch (error) {
      toast.error("Failed to save session.");
    } finally {
      setIsSaving(false);
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
      setPhase((p) => (p + 1) as Phase);
      saveProgress(false);
    }
  };

  const handleBack = () => {
    if (phase > 1) setPhase((p) => (p - 1) as Phase);
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

  // Phase 2 Loop Logic
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
    setFormData({ ...formData, loopResponses: newResponses });
    
    if (loopStep < 4) {
      setLoopStep(loopStep + 1);
      setCurrentLoopResponse('');
    } else {
      // End of loop - move to check
      setLoopStep(5); 
    }
  };

  const handleLoopBack = () => {
    if (loopStep > 0) {
      setLoopStep(loopStep - 1);
      const newResponses = [...formData.loopResponses];
      newResponses.pop();
      setFormData({ ...formData, loopResponses: newResponses });
      setCurrentLoopResponse('');
    } else {
      handleBack();
    }
  };

  const handleCheckIdentity = (stillFeelsSolid: boolean) => {
    if (stillFeelsSolid) {
      handleLoopRestart();
    } else {
      handleNext(); // Move to Phase 3 (Future/Scenario checks)
    }
  };

  const handleLoopRestart = () => {
    setLoopStep(0);
    setCurrentLoopResponse('');
    setFormData(prev => ({ ...prev, loopResponses: [] }));
  };

  const handlePhase3Check = (failed: boolean, context: string) => {
    if (failed) {
      setLoopContext(context);
      setPhase(2);
      handleLoopRestart();
    }
  };

  const loadSession = (session: any) => {
    setFormData({
      id: session.id,
      problem: session.problem,
      emotion: session.emotion || '',
      feltSense: session.felt_sense || '',
      identity: session.identity || '',
      loopResponses: session.loop_responses || [],
      feelingsNow: '', // These would need parsing from integration_awareness if needed
      moreConsciousOf: '',
      newIntention: '',
      actionPlan: '',
      no1Thing: '',
    });
    setPhase((session.current_phase || 1) as Phase);
    setLoopStep(session.loop_step || 0);
    setShowHistory(false);
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
      fetchPastSessions();
    } catch (error) {
      toast.error("Failed to delete session.");
    }
  };

  const renderPhase1 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-black uppercase tracking-widest text-slate-500">1. Identify Problem / Trigger / Pattern</Label>
          <Textarea 
            placeholder="What is the challenge you're facing?" 
            value={formData.problem}
            onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
            className="min-h-[100px] rounded-2xl border-2 border-slate-100 focus:border-indigo-500"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-500">2. Associated Emotion</Label>
            <Input 
              placeholder="Fear, Worry, Anger, etc." 
              value={formData.emotion}
              onChange={(e) => setFormData({ ...formData, emotion: e.target.value })}
              className="rounded-xl border-2 border-slate-100"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-500">3. Associated Felt Sense</Label>
            <Input 
              placeholder="Where do you feel it in the body?" 
              value={formData.feltSense}
              onChange={(e) => setFormData({ ...formData, feltSense: e.target.value })}
              className="rounded-xl border-2 border-slate-100"
            />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-500">4. Stuck Identity / Behavior</Label>
            <Button variant="ghost" size="sm" onClick={handleGenerateIdentity} disabled={isGenerating || !formData.problem} className="h-8 text-indigo-600 hover:bg-indigo-50 gap-1.5">
              {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              <span className="text-[10px] font-black uppercase">Suggest</span>
            </Button>
          </div>
          <Input
            placeholder="Who are you being when you have this problem?"
            value={formData.identity}
            onChange={(e) => setFormData({ ...formData, identity: e.target.value })}
            className="rounded-xl border-2 border-slate-100"
          />
          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => setFormData({ ...formData, identity: s })} className="text-[10px] font-bold px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100 hover:bg-indigo-100 transition-all">
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <Button onClick={handleNext} disabled={!formData.problem || !formData.identity} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-14 font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100">
        Begin Dissolving <ArrowRight className="ml-2" size={18} />
      </Button>
    </div>
  );

  const renderPhase2 = () => {
    if (loopStep === 5) {
      return (
        <div className="space-y-8 animate-in zoom-in-95 duration-500 text-center py-8">
          <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="text-indigo-600" size={40} />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-serif font-bold">Check Identity</h3>
            <p className="text-muted-foreground">"Can you still feel yourself being <span className="text-foreground font-bold">"{loopContext || formData.identity}"</span>?"</p>
          </div>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => handleCheckIdentity(true)} className="h-14 px-10 rounded-2xl border-2 border-indigo-100 text-indigo-600 font-black text-xs uppercase tracking-widest">
              Yes, it's still there
            </Button>
            <Button onClick={() => handleCheckIdentity(false)} className="h-14 px-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest shadow-lg">
              No, it has dissolved
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex items-start gap-3">
          <Info size={18} className="text-indigo-600 shrink-0 mt-0.5" />
          <p className="text-xs text-indigo-900 font-medium leading-relaxed">
            <strong>Instructions:</strong> Keep your answers brief. Tell me the first thing that comes up (emotion, sensation, thought, or image).
          </p>
        </div>

        <Card className="border-2 border-indigo-600/20 shadow-2xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-indigo-600/5 border-b border-indigo-600/10 p-8">
            <div className="flex justify-between items-center mb-4">
              <Badge className="bg-indigo-600 text-white border-none font-black text-[8px] uppercase tracking-widest">Step {loopStep + 1} of 5</Badge>
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className={cn("w-2 h-2 rounded-full", i <= loopStep ? "bg-indigo-600" : "bg-indigo-200")} />
                ))}
              </div>
            </div>
            <CardTitle className="text-2xl font-serif leading-tight">{getLoopQuestion()}</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <Textarea 
              autoFocus
              placeholder="First thing that comes up..." 
              value={currentLoopResponse}
              onChange={(e) => setCurrentLoopResponse(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleLoopNext())}
              className="min-h-[120px] text-xl border-none focus-visible:ring-0 p-0 resize-none placeholder:text-slate-300"
            />
          </CardContent>
          <CardFooter className="bg-slate-50 p-4 flex justify-between">
            <Button variant="ghost" onClick={handleLoopBack} className="text-slate-400 font-bold">
              <ArrowLeft className="mr-2" size={16} /> Back
            </Button>
            <Button onClick={handleLoopNext} disabled={!currentLoopResponse.trim()} className="bg-indigo-600 text-white rounded-xl px-8 font-black text-xs uppercase tracking-widest h-11">
              Next <ArrowRight className="ml-2" size={16} />
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  };

  const renderPhase3 = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full text-indigo-600 mb-2">
          <ShieldCheck size={32} />
        </div>
        <h3 className="text-2xl font-serif font-bold">Phase 3: Checking Identity</h3>
        <p className="text-muted-foreground">Testing the stability of the shift across time and space.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Card className="p-8 rounded-[2rem] border-2 border-slate-100 hover:border-indigo-200 transition-all space-y-6">
          <p className="text-lg font-bold text-center">"Do you think you might feel yourself being <span className="text-indigo-600">"{formData.identity}"</span> in the future?"</p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => handlePhase3Check(true, `${formData.identity} in the future`)} className="flex-1 h-12 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 font-bold">Yes</Button>
            <Button variant="outline" className="flex-1 h-12 rounded-xl border-emerald-200 text-emerald-600 hover:bg-emerald-50 font-bold">No</Button>
          </div>
        </Card>

        <Card className="p-8 rounded-[2rem] border-2 border-slate-100 hover:border-indigo-200 transition-all space-y-6">
          <p className="text-lg font-bold text-center">"Is there any scenario in which you might still feel yourself being <span className="text-indigo-600">"{formData.identity}"</span>?"</p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => handlePhase3Check(true, `${formData.identity} in that scenario`)} className="flex-1 h-12 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 font-bold">Yes</Button>
            <Button variant="outline" className="flex-1 h-12 rounded-xl border-emerald-200 text-emerald-600 hover:bg-emerald-50 font-bold">No</Button>
          </div>
        </Card>
      </div>

      <div className="flex justify-center pt-4">
        <Button onClick={handleNext} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-14 px-12 font-black text-xs uppercase tracking-widest shadow-xl">
          Move to Phase 4 <ArrowRight className="ml-2" size={18} />
        </Button>
      </div>
    </div>
  );

  const renderPhase4 = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 text-center py-8">
      <div className="space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full text-amber-600 mb-2">
          <Zap size={32} />
        </div>
        <h3 className="text-2xl font-serif font-bold">Phase 4: Re-assessing the Problem</h3>
        <p className="text-muted-foreground">"Feel <span className="text-foreground font-bold">"{formData.problem}"</span>... does it still feel like a problem?"</p>
      </div>
      <div className="flex gap-4 justify-center">
        <Button variant="outline" onClick={() => { reset(); setPhase(1); }} className="h-14 px-10 rounded-2xl border-2 border-rose-200 text-rose-600 font-black text-xs uppercase tracking-widest">
          Yes, start new process
        </Button>
        <Button onClick={handleNext} className="h-14 px-10 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest shadow-lg">
          No, it's clear
        </Button>
      </div>
    </div>
  );

  const renderPhase5 = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full text-emerald-600 mb-2">
          <Sparkles size={32} />
        </div>
        <h3 className="text-2xl font-serif font-bold">Phase 5: Conscious Integration</h3>
        <p className="text-muted-foreground">Final reflections to ground the new state.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-4">
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 px-2">Awareness</h4>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-bold">1. How do you feel about the problem now?</Label>
              <Input value={formData.feelingsNow} onChange={e => setFormData({...formData, feelingsNow: e.target.value})} className="rounded-xl h-12" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-bold">2. What are you more conscious of now than before?</Label>
              <Input value={formData.moreConsciousOf} onChange={e => setFormData({...formData, moreConsciousOf: e.target.value})} className="rounded-xl h-12" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-bold">3. What's your new intention?</Label>
              <Input value={formData.newIntention} onChange={e => setFormData({...formData, newIntention: e.target.value})} className="rounded-xl h-12" />
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 px-2">Action & Next Steps</h4>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-bold">1. How are you going to put that intention or awareness into action?</Label>
              <Input value={formData.actionPlan} onChange={e => setFormData({...formData, actionPlan: e.target.value})} className="rounded-xl h-12" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-bold">2. What is the No.1 thing to do to make that happen?</Label>
              <Input value={formData.no1Thing} onChange={e => setFormData({...formData, no1Thing: e.target.value})} className="rounded-xl h-12" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 pt-6">
        <Button onClick={() => saveProgress(true)} disabled={isSaving || !formData.newIntention} className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-14 font-black text-xs uppercase tracking-widest shadow-xl">
          {isSaving ? <Loader2 className="mr-2 animate-spin" /> : <CheckCircle2 className="mr-2" />} Complete & Save Session
        </Button>
        <Button onClick={reset} variant="ghost" className="flex-1 text-slate-400 rounded-2xl h-14 font-bold">
          Start Fresh
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
          <h3 className="text-xl font-serif font-bold">Session History</h3>
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
                        <h4 className="font-bold text-slate-900 truncate">{session.problem}</h4>
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
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <FileText size={20} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 truncate">{session.problem}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-[8px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 border-none">{session.identity}</Badge>
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
    return <IdentityShiftingReport session={session} onBack={() => setViewingReportId(null)} />;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8 space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-serif font-bold tracking-tight">Identity Shifting</h1>
            <p className="text-muted-foreground">Interactive Sandbox Tool</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)} className="rounded-full h-8 px-3 text-xs gap-1.5">
              <History size={14} /> {showHistory ? "Back to Tool" : "History & Drafts"}
            </Button>
            {!showHistory && (
              <div className="text-right">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Phase {phase} of 5</span>
                <p className="text-sm font-bold text-primary">
                  {phase === 1 && "Isolating"}
                  {phase === 2 && "Dissolving"}
                  {phase === 3 && "Checking Identity"}
                  {phase === 4 && "Checking Problem"}
                  {phase === 5 && "Integration"}
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

export default IdentityShiftingTool;