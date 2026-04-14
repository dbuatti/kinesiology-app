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
  MessageSquare,
  Loader2,
  History,
  Save,
  Plus,
  FileText,
  Trash2,
  Clock
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
  integrationAwareness: string;
  integrationAction: string;
}

const IdentityShiftingTool = () => {
  const [phase, setPhase] = useState<Phase>(1);
  const [formData, setFormData] = useState<FormData>({
    problem: '',
    emotion: '',
    feltSense: '',
    identity: '',
    loopResponses: [],
    integrationAwareness: '',
    integrationAction: '',
  });

  const [loopStep, setLoopStep] = useState(0);
  const [currentLoopResponse, setCurrentLoopResponse] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
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

    if (error) {
      console.error("Error fetching sessions:", error);
    } else {
      setPastSessions(data || []);
    }
  };

  const saveProgress = async (isComplete: boolean = false) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in to save progress.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        user_id: user.id,
        problem: formData.problem,
        emotion: formData.emotion,
        felt_sense: formData.feltSense,
        identity: formData.identity,
        loop_responses: formData.loopResponses,
        integration_awareness: formData.integrationAwareness,
        integration_action: formData.integrationAction,
        is_complete: isComplete,
        current_phase: phase,
        loop_step: loopStep
      };

      let error;
      if (formData.id) {
        const { error: updateError } = await supabase
          .from('identity_shifting_sessions')
          .update(payload)
          .eq('id', formData.id);
        error = updateError;
      } else {
        const { data, error: insertError } = await supabase
          .from('identity_shifting_sessions')
          .insert(payload)
          .select()
          .single();
        error = insertError;
        if (data) setFormData(prev => ({ ...prev, id: data.id }));
      }

      if (error) throw error;
      
      if (isComplete) {
        toast.success("Session completed and saved!");
      } else {
        toast.success("Draft saved.");
      }
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
      problem: session.problem,
      emotion: session.emotion || '',
      feltSense: session.felt_sense || '',
      identity: session.identity,
      loopResponses: session.loop_responses || [],
      integrationAwareness: session.integration_awareness || '',
      integrationAction: session.integration_action || '',
    });
    setPhase((session.current_phase || 1) as Phase);
    setLoopStep(session.loop_step || 0);
    setShowHistory(false);
    setViewingReportId(null);
    toast.info(session.is_complete ? "Viewing completed session." : "Resuming draft session.");
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

  const handleGenerateIdentity = async () => {
    if (!formData.problem) return;
    
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-identity', {
        body: {
          problem: formData.problem,
          emotion: formData.emotion,
          feltSense: formData.feltSense
        },
      });

      if (error) throw error;
      if (data?.suggestions) {
        setSuggestions(data.suggestions);
      }
    } catch (error) {
      console.error("Error generating identity:", error);
      toast.error("Failed to generate identity suggestions.");
    } finally {
      setIsGenerating(false);
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

  const reset = () => {
    setPhase(1);
    setFormData({
      problem: '',
      emotion: '',
      feltSense: '',
      identity: '',
      loopResponses: [],
      integrationAwareness: '',
      integrationAction: '',
    });
    setLoopStep(0);
    setCurrentLoopResponse('');
    setSuggestions([]);
  };

  const loopQuestions = [
    (identity: string) => `What is "${identity}"?`,
    (identity: string) => `Where did "${identity}" come from?`,
    (identity: string) => `What is "${identity}" made of?`,
    (identity: string) => `What is "${identity}" trying to do?`,
    (identity: string) => `What is "${identity}" now?`,
  ];

  const handleLoopNext = () => {
    if (currentLoopResponse.trim() === '') return;
    
    const newResponses = [...formData.loopResponses, currentLoopResponse];
    const updatedData = { ...formData, loopResponses: newResponses };
    setFormData(updatedData);
    
    if (loopStep < 4) {
      setLoopStep(loopStep + 1);
      setCurrentLoopResponse('');
    } else {
      setPhase(3);
    }
  };

  const handleLoopBack = () => {
    if (loopStep > 0) {
      const newResponses = [...formData.loopResponses];
      const lastResponse = newResponses.pop();
      setFormData({ ...formData, loopResponses: newResponses });
      setCurrentLoopResponse(lastResponse || '');
      setLoopStep(loopStep - 1);
    } else {
      setPhase(1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (phase === 1 && formData.problem && formData.identity) handleNext();
      else if (phase === 2 && currentLoopResponse.trim()) handleLoopNext();
      else if (phase === 5 && formData.integrationAwareness && formData.integrationAction) saveProgress(true);
    }
  };

  const renderPhase1 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="problem">What is the problem or challenge you're facing?</Label>
          <Textarea 
            id="problem" 
            placeholder="Describe the situation..." 
            value={formData.problem}
            onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
            onKeyDown={handleKeyDown}
            className="min-h-[100px] rounded-xl"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="emotion">What is the primary emotion?</Label>
            <Input 
              id="emotion" 
              placeholder="e.g. Anxiety, Anger, Sadness" 
              value={formData.emotion}
              onChange={(e) => setFormData({ ...formData, emotion: e.target.value })}
              onKeyDown={handleKeyDown}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="feltSense">Where do you feel it in your body?</Label>
            <Input 
              id="feltSense" 
              placeholder="e.g. Tightness in chest, Pit in stomach" 
              value={formData.feltSense}
              onChange={(e) => setFormData({ ...formData, feltSense: e.target.value })}
              onKeyDown={handleKeyDown}
              className="rounded-xl"
            />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="identity">Who are you being when you have this problem? (The Identity)</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGenerateIdentity}
              disabled={isGenerating || !formData.problem}
              className="h-8 px-2 text-primary hover:text-primary/80 hover:bg-primary/10 gap-1.5"
            >
              {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              <span className="text-xs font-bold">Magic Suggest</span>
            </Button>
          </div>
          <Input
            id="identity"
            placeholder="e.g. The Failure, The Victim, The Perfectionist"
            value={formData.identity}
            onChange={(e) => setFormData({ ...formData, identity: e.target.value })}
            onKeyDown={handleKeyDown}
            className="rounded-xl"
          />
          
          <AnimatePresence>
            {suggestions.length > 0 && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-wrap gap-2 mt-2">
                {suggestions.map((suggestion, index) => (
                  <motion.button key={index} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setFormData({ ...formData, identity: suggestion })} className="text-[10px] font-bold px-3 py-1.5 bg-primary/10 text-primary rounded-full border border-primary/20 hover:bg-primary/20 transition-colors">
                    {suggestion}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => saveProgress(false)} disabled={isSaving || !formData.problem} className="flex-1 rounded-xl h-12 font-bold">
          <Save className="mr-2" size={18} /> Save Draft
        </Button>
        <Button onClick={handleNext} disabled={!formData.problem || !formData.identity} className="flex-[2] bg-primary hover:bg-primary/90 text-white rounded-xl h-12 font-bold">
          Begin Dissolving <ArrowRight className="ml-2" size={18} />
        </Button>
      </div>
    </div>
  );

  const renderPhase2 = () => {
    const question = loopQuestions[loopStep](formData.identity);

    return (
      <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full text-primary mb-2">
            <RotateCcw className="animate-spin-slow" size={24} />
          </div>
          <h3 className="text-xl font-serif font-bold">Phase 2: Dissolving the Identity</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">Answer intuitively. Hit ENTER to continue.</p>
        </div>

        <Card className="border-2 border-primary/20 shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-primary/5 border-b border-primary/10">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">Question {loopStep + 1} of 5</span>
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className={cn("w-2 h-2 rounded-full", i <= loopStep ? "bg-primary" : "bg-primary/20")} />
                ))}
              </div>
            </div>
            <CardTitle className="text-2xl font-serif pt-4">{question}</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <Textarea 
              autoFocus
              placeholder="Your answer..." 
              value={currentLoopResponse}
              onChange={(e) => setCurrentLoopResponse(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[120px] text-lg border-none focus-visible:ring-0 p-0 resize-none placeholder:text-muted-foreground/30"
            />
          </CardContent>
          <CardFooter className="bg-secondary/10 p-4 flex justify-between">
            <Button variant="ghost" onClick={handleLoopBack} className="text-muted-foreground hover:text-primary font-bold">
              <ArrowLeft className="mr-2" size={16} /> Back
            </Button>
            <Button onClick={handleLoopNext} disabled={!currentLoopResponse.trim()} className="bg-primary text-white rounded-xl px-8">
              {loopStep === 4 ? "Complete Loop" : "Next Question"} <ArrowRight className="ml-2" size={16} />
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  };

  const renderPhase3 = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 text-center">
      <div className="space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full text-emerald-600 mb-2">
          <Fingerprint size={32} />
        </div>
        <h3 className="text-2xl font-serif font-bold">Phase 3: Checking the Identity</h3>
        <p className="text-muted-foreground">Look back at the identity: <span className="font-bold text-foreground">"{formData.identity}"</span>.</p>
        <div className="p-6 bg-secondary/20 rounded-2xl border border-secondary/30 max-w-md mx-auto">
          <p className="text-lg italic">"Does that identity still feel solid, true, or relevant?"</p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button variant="outline" onClick={() => { setPhase(2); setLoopStep(0); }} className="rounded-xl h-12 px-8">
          <RotateCcw className="mr-2" size={18} /> It's still there, loop again
        </Button>
        <Button onClick={handleNext} className="bg-primary text-white rounded-xl h-12 px-8">
          It has dissolved/shifted <ArrowRight className="ml-2" size={18} />
        </Button>
      </div>
    </div>
  );

  const renderPhase4 = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 text-center">
      <div className="space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full text-indigo-600 mb-2">
          <Brain size={32} />
        </div>
        <h3 className="text-2xl font-serif font-bold">Phase 4: Checking the Problem</h3>
        <p className="text-muted-foreground">Now think about the original problem: <span className="font-bold text-foreground">"{formData.problem}"</span>.</p>
        <div className="p-6 bg-secondary/20 rounded-2xl border border-secondary/30 max-w-md mx-auto">
          <p className="text-lg italic">"How does that problem look or feel to you now?"</p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button variant="outline" onClick={() => setPhase(1)} className="rounded-xl h-12 px-8">
          <ArrowLeft className="mr-2" size={18} /> Re-evaluate Phase 1
        </Button>
        <Button onClick={handleNext} className="bg-primary text-white rounded-xl h-12 px-8">
          It feels different/resolved <ArrowRight className="ml-2" size={18} />
        </Button>
      </div>
    </div>
  );

  const renderPhase5 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2 mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full text-amber-600 mb-2">
          <Sparkles size={24} />
        </div>
        <h3 className="text-xl font-serif font-bold">Phase 5: Integration</h3>
        <p className="text-sm text-muted-foreground">Final reflections to ground the shift.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="awareness">What is the new awareness or perspective you're taking away?</Label>
          <Textarea id="awareness" placeholder="I realized that..." value={formData.integrationAwareness} onChange={(e) => setFormData({ ...formData, integrationAwareness: e.target.value })} onKeyDown={handleKeyDown} className="min-h-[100px] rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="action">What is one small action you can take from this new space?</Label>
          <Input id="action" placeholder="I will..." value={formData.integrationAction} onChange={(e) => setFormData({ ...formData, integrationAction: e.target.value })} onKeyDown={handleKeyDown} className="rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button onClick={() => saveProgress(true)} disabled={isSaving || !formData.integrationAwareness} className="bg-primary text-white rounded-xl h-12 font-bold">
          {isSaving ? <Loader2 className="mr-2 animate-spin" size={18} /> : <CheckCircle2 className="mr-2" size={18} />} Complete & Save
        </Button>
        <Button onClick={reset} variant="ghost" className="w-full text-muted-foreground rounded-xl h-12 font-bold">
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