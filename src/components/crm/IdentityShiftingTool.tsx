
import { useState, useEffect } from 'react';
import ConfirmDialog from "@/components/shared/ConfirmDialog";
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
  Wand2,
  Quote,
  ArrowRightLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import IdentityShiftingReport from './IdentityShiftingReport';
import JournalRefresher from './JournalRefresher';
import BacklogSelector from './BacklogSelector';

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

interface IdentityShiftingToolProps {
  singlePage?: boolean;
  clientId?: string;
  appointmentId?: string;
}

const IdentityShiftingTool = ({ singlePage = false, clientId, appointmentId }: IdentityShiftingToolProps = {}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const prefillData = location.state?.prefill;
  const backlogId = location.state?.backlogId;
  const reflectionId = location.state?.reflectionId;

  const [phase, setPhase] = useState<Phase>(1);
  const [currentBacklogId, setCurrentBacklogId] = useState<string | null>(backlogId || null);
  const [backlogItem, setBacklogItem] = useState<any>(null);
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const progress = (phase / 5) * 100;

  useEffect(() => {
    fetchPastSessions();
    if (currentBacklogId) {
      fetchBacklogItem(currentBacklogId);
      checkForDraft(currentBacklogId);
    }
  }, [currentBacklogId, clientId]);

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
      .from('identity_shifting_sessions')
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

    let query = supabase
      .from('identity_shifting_sessions')
      .select('*');

    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    const { data, error } = await query
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

  const handleBacklogSelect = (item: any) => {
    setCurrentBacklogId(item.id);
    setFormData(prev => ({ ...prev, identity: item.content }));
    reset();
  };

  const executeDeleteSession = async () => {
    setShowDeleteConfirm(false);
    if (!deleteTargetId) return;

    try {
      const { error } = await supabase
        .from('identity_shifting_sessions')
        .delete()
        .eq('id', deleteTargetId);

      if (error) throw error;
      toast.success("Session deleted.");
      if (formData.id === deleteTargetId) reset();
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
        backlog_id: currentBacklogId || null,
        client_id: clientId || null,
        appointment_id: appointmentId || null,
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
    navigate('/identity-map');
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
      if (singlePage) scrollTo('shift-phase-2');
    }
  };

  const handleNext = () => {
    if (phase < 5) {
      const nextPhase = (phase + 1) as Phase;
      setPhase(nextPhase);
      saveProgress(false, {}, nextPhase);
      if (singlePage) scrollTo(`shift-phase-${nextPhase}`);
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
      if (singlePage) scrollTo('shift-phase-2');
    } else {
      if (singlePage) {
        setPhase(4);
        scrollTo('shift-phase-4');
      } else {
        handleNext();
      }
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

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const renderPhase1 = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {backlogItem && (
        <div className="p-3 bg-muted dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-900/30 space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><Quote size={120} /></div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary text-white flex items-center justify-center">
              <History size={12} />
            </div>
            <h4 className="text-xs font-semibold text-indigo-900 dark:text-indigo-100 uppercase tracking-wider">Source Context</h4>
          </div>
          <div className="space-y-3 relative z-10">
            {backlogItem.practitioner_reflections?.content && (
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">Original Journal Entry</p>
                <p className="text-sm font-medium text-muted-foreground dark:text-muted-foreground leading-relaxed line-clamp-4 italic">
                  "{backlogItem.practitioner_reflections.content}"
                </p>
              </div>
            )}
            
            {backlogItem.priority_reasoning && (
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">AI Reasoning</p>
                <p className="text-sm font-medium text-indigo-800 dark:text-indigo-200 leading-relaxed">
                  {backlogItem.priority_reasoning}
                </p>
              </div>
            )}
            
            {backlogItem.polarity_insight && (
              <div className="flex items-start gap-2 p-3 bg-white/50 dark:bg-slate-900/50 rounded-xl border border-indigo-200 dark:border-indigo-900/30">
                <ArrowRightLeft size={14} className="text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider mb-1">Polarity Insight</p>
                  <p className="text-xs font-medium text-indigo-900 dark:text-indigo-100">{backlogItem.polarity_insight}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="space-y-3">
          <Label className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground ml-1">1. The Challenge</Label>
          <Textarea 
            placeholder="What is the problem or pattern you're facing?" 
            value={formData.problem}
            onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
            className="min-h-[56px] rounded-xl border border-border focus:border-indigo-500 bg-white p-3 text-sm font-medium leading-relaxed resize-none transition-all"
          />
        </div>
        
        <div className="space-y-3">
          <div className="space-y-3">
            <Label className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground ml-1">2. Primary Emotion</Label>
            <Input 
              placeholder="Fear, Worry, Anger, etc." 
              value={formData.emotion}
              onChange={(e) => setFormData({ ...formData, emotion: e.target.value })}
              className="h-9 rounded-lg border border-border px-4 text-sm font-medium bg-white"
            />
          </div>
          <div className="space-y-3">
            <Label className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground ml-1">3. Felt Sense</Label>
            <Input 
              placeholder="Where is it in the body?" 
              value={formData.feltSense}
              onChange={(e) => setFormData({ ...formData, feltSense: e.target.value })}
              className="h-9 rounded-lg border border-border px-4 text-sm font-medium bg-white"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">4. Stuck Identity</Label>
            <div className="flex items-center gap-2">
              <BacklogSelector type="shifting" onSelect={handleBacklogSelect} currentValue={formData.identity} />
              <Button variant="ghost" size="sm" onClick={handleGenerateIdentity} disabled={isGenerating} className="h-8 text-chart-primary hover:bg-muted gap-1 font-semibold text-[9px] uppercase tracking-wider rounded-lg border border-indigo-100">
                {isGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                Suggest
              </Button>
            </div>
          </div>
          <Input
            placeholder="Who are you being when you have this problem?"
            value={formData.identity}
            onChange={(e) => setFormData({ ...formData, identity: e.target.value })}
            className="h-9 rounded-lg border border-border px-4 text-sm font-medium bg-white"
          />
          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => setFormData({ ...formData, identity: s })} className="text-[10px] font-medium px-3 py-1.5 bg-muted text-chart-primary rounded-full border border-indigo-100 hover:bg-chart-primary/10 transition-all">
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {!singlePage && (
      <div className="pt-4 flex gap-3">
        <Button variant="outline" onClick={() => saveProgress(false)} disabled={isSaving} className="flex-1 rounded-lg h-9 font-semibold text-[10px] uppercase tracking-wider border-border">
          <Save className="mr-1.5" size={14} /> Save Draft
        </Button>
        <Button onClick={handleNext} className="flex-[2] bg-primary hover:bg-primary/90 text-white rounded-lg h-9 font-semibold text-[10px] uppercase tracking-wider">
          Begin Dissolving <ArrowRight className="ml-1.5" size={14} />
        </Button>
      </div>
      )}
    </div>
  );

  const renderPhase2 = () => {
    if (loopStep === 5) {
      return (
        <div className="space-y-6 animate-in zoom-in-95 duration-500 text-center py-10">
          <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center mx-auto mb-6">
            <RefreshCw className="text-chart-primary" size={20} />
          </div>
          <div className="space-y-3">
            <h3 className="text-lg font-serif font-medium">Check Identity</h3>
            <p className="text-sm text-muted-foreground">"Can you still feel yourself being <span className="text-chart-primary font-medium">"{loopContext || formData.identity}"</span>?"</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button variant="outline" onClick={() => handleCheckIdentity(true)} className="h-9 px-6 rounded-lg border border-indigo-100 text-chart-primary font-semibold text-[10px] uppercase tracking-wider hover:bg-muted">
              Yes, it's still there
            </Button>
            <Button onClick={() => handleCheckIdentity(false)} className="h-9 px-6 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold text-[10px] uppercase tracking-wider">
              No, it has dissolved
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center text-center space-y-6 py-6 animate-in fade-in zoom-in-95 duration-500">
        <div className="w-full max-w-md space-y-3">
          <div className="flex justify-between text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            <span>Dissolving Identity</span>
            <span>Step {loopStep + 1} of 5</span>
          </div>
          <Progress value={((loopStep + 1) / 5) * 100} className="h-1 bg-muted [&>div]:bg-primary" />
        </div>

        <div className="space-y-4 w-full max-w-3xl">
          <h2 className="text-base font-serif font-medium leading-tight text-foreground">
            {getLoopQuestion()}
          </h2>

          <div className="w-full relative">
            <textarea 
              autoFocus
              className="w-full bg-transparent text-base text-center border-none focus:ring-0 placeholder:text-slate-200 resize-none min-h-[56px] font-medium"
              placeholder="First thing that comes up..."
              value={currentLoopResponse}
              onChange={(e) => setCurrentLoopResponse(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleLoopNext())}
            />
            <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent mt-3" />
          </div>
        </div>

        <div className="flex gap-4 items-center">
          <Button variant="ghost" onClick={handleLoopBack} className="text-muted-foreground uppercase tracking-wider text-[10px] font-semibold hover:text-chart-primary hover:bg-transparent">
            <ArrowLeft className="mr-1.5" size={12} /> Back
          </Button>
          <Button 
            onClick={handleLoopNext} 
            disabled={isGenerating}
            className="bg-primary hover:bg-primary/90 text-white rounded-full px-6 h-8 font-semibold uppercase tracking-wider text-[10px] transition-all hover:scale-105"
          >
            Continue <ArrowRight className="ml-1.5" size={14} />
          </Button>
        </div>

        <div className="pt-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-full text-[9px] font-semibold text-indigo-400 uppercase tracking-wider">
            <Info size={12} /> Keep answers brief and intuitive
          </div>
        </div>
      </div>
    );
  };

  const renderPhase3 = () => (
    <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-500 py-1">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-8 h-8 bg-chart-primary/10 rounded-lg text-chart-primary">
          <ShieldCheck size={16} />
        </div>
        <h3 className="text-base font-serif font-medium">Checking Identity</h3>
        <p className="text-sm text-muted-foreground">Testing the stability of the shift across time and space.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 max-w-lg mx-auto">
        <div className="p-3 rounded-xl border border-border bg-card space-y-3">
          <p className="text-sm font-medium text-center leading-relaxed">"Do you think you might feel yourself being <span className="text-chart-primary">"{formData.identity}"</span> in the future?"</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => handlePhase3Check(true, `${formData.identity} in the future`)} className="flex-1 h-8 rounded-lg border-destructive bg-destructive/10 text-destructive font-semibold text-[10px] uppercase tracking-wider">Yes</Button>
            <Button variant="outline" onClick={() => handlePhase3Check(false, '')} className="flex-1 h-8 rounded-lg border-chart-emerald bg-chart-emerald/10 text-chart-emerald font-semibold text-[10px] uppercase tracking-wider">No</Button>
          </div>
        </div>

        <div className="p-3 rounded-xl border border-border bg-card space-y-3">
          <p className="text-sm font-medium text-center leading-relaxed">"Is there any scenario in which you might still feel yourself being <span className="text-chart-primary">"{formData.identity}"</span>?"</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => handlePhase3Check(true, `${formData.identity} in that scenario`)} className="flex-1 h-8 rounded-lg border-destructive bg-destructive/10 text-destructive font-semibold text-[10px] uppercase tracking-wider">Yes</Button>
            <Button variant="outline" onClick={() => handlePhase3Check(false, '')} className="flex-1 h-8 rounded-lg border-chart-emerald bg-chart-emerald/10 text-chart-emerald font-semibold text-[10px] uppercase tracking-wider">No</Button>
          </div>
        </div>
      </div>

      {!singlePage && (
      <div className="flex justify-center pt-3">
        <Button onClick={handleNext} className="bg-primary hover:bg-primary/90 text-white rounded-lg h-8 px-10 font-semibold text-[10px] uppercase tracking-wider">
          Move to Phase 4 <ArrowRight className="ml-1.5" size={14} />
        </Button>
      </div>
      )}
    </div>
  );

  const renderPhase4 = () => (
    <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-500 text-center py-2">
      <div className="space-y-2">
        <div className="inline-flex items-center justify-center w-8 h-8 bg-muted rounded-lg text-muted-foreground">
          <Zap size={16} />
        </div>
        <h3 className="text-base font-serif font-medium">Re-assessing the Problem</h3>
        <p className="text-sm text-muted-foreground">"Feel <span className="text-foreground font-medium">"{formData.problem}"</span>... does it still feel like a problem?"</p>
      </div>
      {!singlePage && (
      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-3">
        <Button variant="outline" onClick={() => { reset(); setPhase(1); }} className="h-8 px-6 rounded-lg border border-rose-200 text-chart-destructive font-semibold text-[10px] uppercase tracking-wider hover:bg-muted">
          Yes, start new process
        </Button>
        <Button onClick={handleNext} className="h-8 px-6 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold text-[10px] uppercase tracking-wider">
          No, it's clear
        </Button>
      </div>
      )}
    </div>
  );

  const renderPhase5 = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 py-1">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-7 h-7 bg-chart-emerald/10 rounded-lg text-chart-emerald">
          <Sparkles size={14} />
        </div>
        <h3 className="text-base font-serif font-medium">Conscious Integration</h3>
        <p className="text-sm text-muted-foreground">Final reflections to ground the new state.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-3">
          <h4 className="text-[9px] font-semibold uppercase tracking-[0.3em] text-muted-foreground px-2 border-l-2 border-indigo-500">Awareness</h4>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground ml-1">1. How do you feel about the problem now?</Label>
              <Input value={formData.feelingsNow} onChange={e => setFormData({...formData, feelingsNow: e.target.value})} className="rounded-lg h-9 border border-border px-4 text-sm font-medium bg-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground ml-1">2. What are you more conscious of now than before?</Label>
              <Input value={formData.moreConsciousOf} onChange={e => setFormData({...formData, moreConsciousOf: e.target.value})} className="rounded-lg h-9 border border-border px-4 text-sm font-medium bg-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground ml-1">3. What's your new intention?</Label>
              <Input value={formData.newIntention} onChange={e => setFormData({...formData, newIntention: e.target.value})} className="rounded-lg h-9 border border-border px-4 text-sm font-medium bg-white" />
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-3 border-t border-border">
          <h4 className="text-[9px] font-semibold uppercase tracking-[0.3em] text-muted-foreground px-2 border-l-2 border-emerald-500">Action & Next Steps</h4>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground ml-1">1. How are you going to put that intention or awareness into action?</Label>
              <Input value={formData.actionPlan} onChange={e => setFormData({...formData, actionPlan: e.target.value})} className="rounded-lg h-9 border border-border px-4 text-sm font-medium bg-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground ml-1">2. What is the No.1 thing to do to make that happen?</Label>
              <Input value={formData.no1Thing} onChange={e => setFormData({...formData, no1Thing: e.target.value})} className="rounded-lg h-9 border border-border px-4 text-sm font-medium bg-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-3">
        <Button 
          onClick={handleDeepScan} 
          disabled={isAnalyzing}
          variant="outline"
          className="flex-1 h-8 rounded-lg border-indigo-200 text-chart-primary font-semibold text-[10px] uppercase tracking-wider hover:bg-muted"
        >
          {isAnalyzing ? <Loader2 className="mr-1.5 animate-spin" size={12} /> : <Wand2 className="mr-1.5" size={12} />} Scan for Deeper Patterns
        </Button>
        <Button onClick={() => saveProgress(true)} disabled={isSaving} className="flex-[2] bg-primary hover:bg-primary/90 text-white rounded-lg h-8 font-semibold text-[10px] uppercase tracking-wider">
          {isSaving ? <Loader2 className="mr-1.5 animate-spin" size={12} /> : <CheckCircle2 className="mr-1.5" size={12} />} Complete &amp; Save Session
        </Button>
        <Button onClick={reset} variant="ghost" className="flex-1 text-muted-foreground rounded-lg h-8 font-medium hover:bg-muted">
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
          <h3 className="text-sm font-serif font-medium">Session History</h3>
          <Button variant="ghost" size="sm" onClick={() => setShowHistory(false)} className="rounded-lg font-medium text-[10px] uppercase tracking-wider">Close</Button>
        </div>
        
        {activeDrafts.length > 0 && (
          <div className="space-y-3">
            <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-1.5">
              <Clock size={12} /> Active Drafts
            </p>
            <div className="grid grid-cols-1 gap-3">
              {activeDrafts.map((session) => (
                <div key={session.id} className="p-3 bg-white rounded-xl border border-amber-100 hover:border-amber-400 transition-all cursor-pointer group flex items-center justify-between" onClick={() => loadSession(session)}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                      <Zap size={14} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-sm text-foreground truncate">{session.problem}</h4>
                      <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">Phase {session.current_phase} • {new Date(session.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground/60 hover:text-chart-destructive" onClick={(e) => { e.stopPropagation(); setDeleteTargetId(session.id); setShowDeleteConfirm(true); }}><Trash2 size={14} /></Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-[0.3em]">Completed Sessions</p>
          {completedSessions.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground bg-muted rounded-xl border border-dashed border-border">
              <History className="mx-auto mb-3 opacity-20" size={40} />
              <p className="font-medium text-sm">No completed sessions yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {completedSessions.map((session) => (
                <div key={session.id} className="p-3 bg-white rounded-xl border border-border hover:border-indigo-400 transition-all cursor-pointer group flex items-center justify-between" onClick={() => setViewingReportId(session.id)}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-chart-primary group-hover:bg-primary group-hover:text-white transition-colors">
                      <FileText size={14} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-sm text-foreground truncate">{session.problem}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="text-[9px] font-semibold uppercase tracking-wider bg-muted text-muted-foreground border-none px-1.5 py-0">{session.identity}</Badge>
                        <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">{new Date(session.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground/60 hover:text-chart-destructive opacity-0 group-hover:opacity-100 transition-all" onClick={(e) => { e.stopPropagation(); setDeleteTargetId(session.id); setShowDeleteConfirm(true); }}><Trash2 size={14} /></Button>
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-white transition-all"><ArrowRight size={14} /></div>
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
      {!singlePage && (
        <div className="mb-6 space-y-3">
          <div className="flex justify-between items-end">
            <div className="space-y-0.5">
              <h2 className="text-[9px] font-semibold uppercase tracking-[0.3em] text-chart-primary">Phase {phase} of 5</h2>
              <p className="text-sm font-semibold text-foreground">
                {phase === 1 && "Isolating the Identity"}
                {phase === 2 && "Dissolving the Construct"}
                {phase === 3 && "Checking Stability"}
                {phase === 4 && "Re-assessing Problem"}
                {phase === 5 && "Conscious Integration"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {reflectionId && <JournalRefresher reflectionId={reflectionId} />}
              <Button variant="ghost" size="sm" onClick={handleLeave} className="rounded-lg h-8 px-3 text-[9px] font-semibold uppercase tracking-wider gap-1 text-muted-foreground hover:bg-muted">
                <ArrowLeft size={12} /> Leave
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowHistory(!showHistory)} className="rounded-lg h-8 px-3 text-[9px] font-semibold uppercase tracking-wider gap-1 text-muted-foreground hover:bg-muted">
                <History size={12} /> {showHistory ? "Tool" : "History"}
              </Button>
              {formData.id && !showHistory && (
                <Button variant="ghost" size="sm" onClick={() => saveProgress(false)} disabled={isSaving} className="rounded-lg h-8 px-3 text-[9px] font-semibold uppercase tracking-wider gap-1 text-chart-primary hover:bg-muted">
                  {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
                </Button>
              )}
            </div>
          </div>
          {!showHistory && <Progress value={progress} className="h-1 bg-muted [&>div]:bg-primary" />}
        </div>
      )}

      <div className={singlePage ? "space-y-8" : "min-h-[500px]"}>
        {showHistory ? renderHistory() : (
          singlePage ? (
            <div className="space-y-4">
              <section id="shift-phase-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-3.5 h-3.5 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[8px] font-semibold">1</span>
                  <h3 className="text-[10px] font-semibold text-foreground uppercase tracking-wider">Isolating the Identity</h3>
                </div>
                {renderPhase1()}
              </section>
              <section id="shift-phase-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-3.5 h-3.5 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[8px] font-semibold">2</span>
                  <h3 className="text-[10px] font-semibold text-foreground uppercase tracking-wider">Dissolving the Construct</h3>
                </div>
                {renderPhase2()}
              </section>
              <section id="shift-phase-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-3.5 h-3.5 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[8px] font-semibold">3</span>
                  <h3 className="text-[10px] font-semibold text-foreground uppercase tracking-wider">Checking Stability</h3>
                </div>
                {renderPhase3()}
              </section>
              <section id="shift-phase-4">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-3.5 h-3.5 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[8px] font-semibold">4</span>
                  <h3 className="text-[10px] font-semibold text-foreground uppercase tracking-wider">Re-assessing Problem</h3>
                </div>
                {renderPhase4()}
              </section>
              <section id="shift-phase-5">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-3.5 h-3.5 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[8px] font-semibold">5</span>
                  <h3 className="text-[10px] font-semibold text-foreground uppercase tracking-wider">Conscious Integration</h3>
                </div>
                {renderPhase5()}
              </section>
            </div>
          ) : (
            <>
              {phase === 1 && renderPhase1()}
              {phase === 2 && renderPhase2()}
              {phase === 3 && renderPhase3()}
              {phase === 4 && renderPhase4()}
              {phase === 5 && renderPhase5()}
            </>
          )
        )}
      </div>
      <ConfirmDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm} title="Delete session?" description="This cannot be undone." confirmLabel="Delete" onConfirm={executeDeleteSession} />
    </div>
  );
};

export default IdentityShiftingTool;