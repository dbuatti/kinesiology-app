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
  Sparkles,
  Brain,
  Zap,
  MessageSquare,
  Loader2,
  History,
  Save,
  FileText,
  Trash2,
  Clock,
  ShieldAlert,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import LimitingBeliefsReport from './LimitingBeliefsReport';

type Step = 1 | 2 | 3 | 4 | 5;

interface FormData {
  id?: string;
  problem: string;
  feltSense: string;
  limitingBelief: string;
  positiveBelief: string;
  dissolveLog: { type: 'A' | 'B', response: string }[];
  checkBeliefResult: boolean | null;
  checkProblemResult: boolean | null;
  integrationAwareness: string;
  integrationAction: string;
}

const LimitingBeliefsTool = () => {
  const [step, setStep] = useState<Step>(1);
  const [formData, setFormData] = useState<FormData>({
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

  const [currentLoopType, setCurrentLoopType] = useState<'A' | 'B'>('A');
  const [currentLoopResponse, setCurrentLoopResponse] = useState('');
  const [pastSessions, setPastSessions] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [viewingReportId, setViewingReportId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const progress = (step / 5) * 100;

  useEffect(() => {
    fetchPastSessions();
  }, []);

  const fetchPastSessions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('limiting_belief_sessions')
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
        felt_sense: formData.feltSense,
        limiting_belief: formData.limitingBelief,
        positive_belief: formData.positiveBelief,
        dissolve_log: formData.dissolveLog,
        check_belief_result: formData.checkBeliefResult,
        check_problem_result: formData.checkProblemResult,
        integration_awareness: formData.integrationAwareness,
        integration_action: formData.integrationAction,
        is_complete: isComplete,
        current_step: step
      };

      let error;
      if (formData.id) {
        const { error: updateError } = await supabase
          .from('limiting_belief_sessions')
          .update(payload)
          .eq('id', formData.id);
        error = updateError;
      } else {
        const { data, error: insertError } = await supabase
          .from('limiting_belief_sessions')
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
    toast.info(session.is_complete ? "Viewing completed session." : "Resuming draft session.");
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

  const handleNext = () => {
    if (step < 5) {
      const nextStep = (step + 1) as Step;
      setStep(nextStep);
      saveProgress(false);
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
    setCurrentLoopResponse('');
  };

  const handleLoopNext = () => {
    if (currentLoopResponse.trim() === '') return;
    
    const newLog = [...formData.dissolveLog, { type: currentLoopType, response: currentLoopResponse }];
    setFormData({ ...formData, dissolveLog: newLog });
    
    setCurrentLoopResponse('');
    setCurrentLoopType(currentLoopType === 'A' ? 'B' : 'A');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (step === 1 && formData.problem && formData.feltSense) {
        e.preventDefault();
        handleNext();
      } else if (step === 2 && formData.limitingBelief && formData.positiveBelief) {
        e.preventDefault();
        handleNext();
      } else if (step === 3 && currentLoopResponse.trim()) {
        e.preventDefault();
        handleLoopNext();
      }
    }
  };

  const renderStep1 = () => (
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
        <div className="space-y-2">
          <Label htmlFor="feltSense">Where do you feel it in your body? (The Felt Sense)</Label>
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
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => saveProgress(false)} disabled={isSaving || !formData.problem} className="flex-1 rounded-xl h-12 font-bold">
          <Save className="mr-2" size={18} /> Save Draft
        </Button>
        <Button onClick={handleNext} disabled={!formData.problem || !formData.feltSense} className="flex-[2] bg-primary hover:bg-primary/90 text-white rounded-xl h-12 font-bold">
          Next: Extract Beliefs <ArrowRight className="ml-2" size={18} />
        </Button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="limitingBelief">What is the Limiting Belief? (I am...)</Label>
          <Input 
            id="limitingBelief" 
            placeholder="e.g. I am not good enough" 
            value={formData.limitingBelief}
            onChange={(e) => setFormData({ ...formData, limitingBelief: e.target.value })}
            onKeyDown={handleKeyDown}
            className="rounded-xl"
          />
          <p className="text-[10px] text-muted-foreground italic">Identify the identity statement that explains the felt sense.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="positiveBelief">What is the desired Positive Belief? (I am...)</Label>
          <Input 
            id="positiveBelief" 
            placeholder="e.g. I am capable and worthy" 
            value={formData.positiveBelief}
            onChange={(e) => setFormData({ ...formData, positiveBelief: e.target.value })}
            onKeyDown={handleKeyDown}
            className="rounded-xl"
          />
          <p className="text-[10px] text-muted-foreground italic">What would you rather believe about yourself in this situation?</p>
        </div>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={handleBack} className="flex-1 rounded-xl h-12 font-bold">
          <ArrowLeft className="mr-2" size={18} /> Back
        </Button>
        <Button onClick={handleNext} disabled={!formData.limitingBelief || !formData.positiveBelief} className="flex-[2] bg-primary hover:bg-primary/90 text-white rounded-xl h-12 font-bold">
          Begin Dissolving Loop <ArrowRight className="ml-2" size={18} />
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => {
    const currentBelief = currentLoopType === 'A' ? formData.limitingBelief : formData.positiveBelief;
    const colorClass = currentLoopType === 'A' ? "text-rose-600 bg-rose-50 border-rose-100" : "text-emerald-600 bg-emerald-50 border-emerald-100";

    return (
      <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full text-primary mb-2">
            <RefreshCw className="animate-spin-slow" size={24} />
          </div>
          <h3 className="text-xl font-serif font-bold">Step 3: Dissolving Loop</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">Alternate between the beliefs until you feel a shift in identity.</p>
        </div>

        <Card className={cn("border-2 shadow-xl rounded-3xl overflow-hidden transition-colors duration-500", currentLoopType === 'A' ? "border-rose-200" : "border-emerald-200")}>
          <CardHeader className={cn("border-b transition-colors duration-500", currentLoopType === 'A' ? "bg-rose-50/50 border-rose-100" : "bg-emerald-50/50 border-emerald-100")}>
            <div className="flex justify-between items-center">
              <span className={cn("text-[10px] font-black uppercase tracking-widest", currentLoopType === 'A' ? "text-rose-500" : "text-emerald-500")}>
                Part {currentLoopType}: {currentLoopType === 'A' ? "Limiting" : "Positive"}
              </span>
              <Badge variant="outline" className={cn("font-bold", colorClass)}>
                {formData.dissolveLog.length} cycles completed
              </Badge>
            </div>
            <CardTitle className="text-2xl font-serif pt-4">
              "I am {currentBelief}"
            </CardTitle>
            <CardDescription>
              {currentLoopType === 'A' 
                ? "Notice how this feels in your body. What comes up?" 
                : "Now step into this truth. What do you notice now?"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <Textarea 
              autoFocus
              placeholder="Describe what you notice..." 
              value={currentLoopResponse}
              onChange={(e) => setCurrentLoopResponse(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[120px] text-lg border-none focus-visible:ring-0 p-0 resize-none placeholder:text-muted-foreground/30"
            />
          </CardContent>
          <CardFooter className="bg-secondary/10 p-4 flex justify-between">
            <Button variant="ghost" onClick={handleBack} className="text-muted-foreground hover:text-primary font-bold">
              <ArrowLeft className="mr-2" size={16} /> Back
            </Button>
            <div className="flex gap-2">
              <Button onClick={handleLoopNext} disabled={!currentLoopResponse.trim()} className={cn("text-white rounded-xl px-8", currentLoopType === 'A' ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700")}>
                Next Part <ArrowRight className="ml-2" size={16} />
              </Button>
              {formData.dissolveLog.length >= 2 && (
                <Button onClick={handleNext} variant="outline" className="rounded-xl border-primary text-primary font-bold">
                  I feel a shift
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>

        {formData.dissolveLog.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center">Recent Log</p>
            <div className="flex flex-wrap justify-center gap-2">
              {formData.dissolveLog.slice(-4).map((log, i) => (
                <Badge key={i} variant="secondary" className={cn("text-[10px]", log.type === 'A' ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700")}>
                  {log.type}: {log.response.substring(0, 20)}...
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderStep4 = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 text-center">
      <div className="space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full text-indigo-600 mb-2">
          <ShieldAlert size={32} />
        </div>
        <h3 className="text-2xl font-serif font-bold">Step 4: Verification</h3>
        <p className="text-muted-foreground">Let's check the results of the shift.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        <Card className="p-6 space-y-4 border-2 hover:border-primary/30 transition-colors">
          <p className="text-sm font-bold">Does the Limiting Belief still feel true?</p>
          <p className="text-xs italic text-muted-foreground">"I am {formData.limitingBelief}"</p>
          <div className="flex gap-2 justify-center">
            <Button 
              variant={formData.checkBeliefResult === false ? "default" : "outline"} 
              onClick={() => setFormData({ ...formData, checkBeliefResult: false })}
              className="flex-1 rounded-xl"
            >
              No / Shifted
            </Button>
            <Button 
              variant={formData.checkBeliefResult === true ? "destructive" : "outline"} 
              onClick={() => setFormData({ ...formData, checkBeliefResult: true })}
              className="flex-1 rounded-xl"
            >
              Yes / Still Solid
            </Button>
          </div>
        </Card>

        <Card className="p-6 space-y-4 border-2 hover:border-primary/30 transition-colors">
          <p className="text-sm font-bold">Does the original problem still feel the same?</p>
          <p className="text-xs italic text-muted-foreground">"{formData.problem}"</p>
          <div className="flex gap-2 justify-center">
            <Button 
              variant={formData.checkProblemResult === false ? "default" : "outline"} 
              onClick={() => setFormData({ ...formData, checkProblemResult: false })}
              className="flex-1 rounded-xl"
            >
              No / Different
            </Button>
            <Button 
              variant={formData.checkProblemResult === true ? "destructive" : "outline"} 
              onClick={() => setFormData({ ...formData, checkProblemResult: true })}
              className="flex-1 rounded-xl"
            >
              Yes / Same
            </Button>
          </div>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
        <Button variant="outline" onClick={() => setStep(3)} className="rounded-xl h-12 px-8">
          <RotateCcw className="mr-2" size={18} /> Need more dissolving
        </Button>
        <Button 
          onClick={handleNext} 
          disabled={formData.checkBeliefResult === null || formData.checkProblemResult === null}
          className="bg-primary text-white rounded-xl h-12 px-8"
        >
          Continue to Integration <ArrowRight className="ml-2" size={18} />
        </Button>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2 mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full text-amber-600 mb-2">
          <Sparkles size={24} />
        </div>
        <h3 className="text-xl font-serif font-bold">Step 5: Integration</h3>
        <p className="text-sm text-muted-foreground">Final reflections to ground the shift.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="awareness">What is the new awareness or perspective you're taking away?</Label>
          <Textarea id="awareness" placeholder="I realized that..." value={formData.integrationAwareness} onChange={(e) => setFormData({ ...formData, integrationAwareness: e.target.value })} className="min-h-[100px] rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="action">What is one small action you can take from this new space?</Label>
          <Input id="action" placeholder="I will..." value={formData.integrationAction} onChange={(e) => setFormData({ ...formData, integrationAction: e.target.value })} className="rounded-xl" />
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
                        <p className="text-[10px] text-slate-500">Step {session.current_step} • {new Date(session.created_at).toLocaleDateString()}</p>
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
                          <Badge variant="secondary" className="text-[8px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 border-none">{session.limiting_belief}</Badge>
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
    return <LimitingBeliefsReport session={session} onBack={() => setViewingReportId(null)} />;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8 space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-serif font-bold tracking-tight">Limiting Beliefs Shifting</h1>
            <p className="text-muted-foreground">Interactive Sandbox Tool</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)} className="rounded-full h-8 px-3 text-xs gap-1.5">
              <History size={14} /> {showHistory ? "Back to Tool" : "History & Drafts"}
            </Button>
            {!showHistory && (
              <div className="text-right">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Step {step} of 5</span>
                <p className="text-sm font-bold text-primary">
                  {step === 1 && "Problem & Feeling"}
                  {step === 2 && "Belief Extraction"}
                  {step === 3 && "Dissolving Loop"}
                  {step === 4 && "Verification"}
                  {step === 5 && "Integration"}
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