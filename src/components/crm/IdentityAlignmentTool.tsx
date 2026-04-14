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
  Shield,
  Activity,
  Target,
  Anchor
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import IdentityAlignmentReport from './IdentityAlignmentReport';

type Phase = 1 | 2 | 3 | 4;

interface ReconsolidationEntry {
  resistance: string;
  metabolized: string;
}

interface FormData {
  goal: string;
  targetIdentity: string;
  somaticSensations: string;
  emotionalStates: string;
  reconsolidationData: ReconsolidationEntry[];
  presentCheck: string;
  futureCheck: string;
  finalAnchor: string;
}

const IdentityAlignmentTool = () => {
  const [phase, setPhase] = useState<Phase>(1);
  const [formData, setFormData] = useState<FormData>({
    goal: '',
    targetIdentity: '',
    somaticSensations: '',
    emotionalStates: '',
    reconsolidationData: [],
    presentCheck: '',
    futureCheck: '',
    finalAnchor: '',
  });

  const [currentResistance, setCurrentResistance] = useState('');
  const [currentMetabolized, setCurrentMetabolized] = useState('');
  const [pastSessions, setPastSessions] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [viewingReportId, setViewingReportId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const progress = (phase / 4) * 100;

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
        body: {
          goal: formData.goal,
          type: 'target'
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

  const saveSession = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in to save sessions.");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('identity_alignment_sessions')
        .insert({
          user_id: user.id,
          goal: formData.goal,
          target_identity: formData.targetIdentity,
          somatic_sensations: formData.somaticSensations,
          emotional_states: formData.emotionalStates,
          reconsolidation_data: formData.reconsolidationData,
          present_check: formData.presentCheck,
          future_check: formData.futureCheck,
          final_anchor: formData.finalAnchor,
        });

      if (error) throw error;
      toast.success("Session saved successfully!");
      fetchPastSessions();
    } catch (error) {
      console.error("Error saving session:", error);
      toast.error("Failed to save session.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = () => {
    if (phase < 4) setPhase((p) => (p + 1) as Phase);
  };

  const handleBack = () => {
    if (phase > 1) setPhase((p) => (p - 1) as Phase);
  };

  const addReconsolidationEntry = () => {
    if (!currentResistance || !currentMetabolized) return;
    setFormData({
      ...formData,
      reconsolidationData: [
        ...formData.reconsolidationData,
        { resistance: currentResistance, metabolized: currentMetabolized }
      ]
    });
    setCurrentResistance('');
    setCurrentMetabolized('');
    toast.success("Resistance metabolized and added to loop.");
  };

  const reset = () => {
    setPhase(1);
    setFormData({
      goal: '',
      targetIdentity: '',
      somaticSensations: '',
      emotionalStates: '',
      reconsolidationData: [],
      presentCheck: '',
      futureCheck: '',
      finalAnchor: '',
    });
    setCurrentResistance('');
    setCurrentMetabolized('');
    setSuggestions([]);
  };

  const renderPhase1 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2 mb-4">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full text-primary mb-2">
          <Target size={24} />
        </div>
        <h3 className="text-xl font-serif font-bold">Phase 1: Setup & Extraction</h3>
        <p className="text-sm text-muted-foreground">Define your goal and the identity required to achieve it.</p>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="goal">What is your primary goal or desired outcome?</Label>
          <Textarea 
            id="goal" 
            placeholder="e.g. Building a successful practice, achieving optimal health..." 
            value={formData.goal}
            onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
            className="min-h-[100px] rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="targetIdentity">What is the Target Identity that naturally achieves this goal?</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGenerateTargetIdentity}
              disabled={isGenerating || !formData.goal}
              className="h-8 px-2 text-primary hover:text-primary/80 hover:bg-primary/10 gap-1.5"
            >
              {isGenerating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              <span className="text-xs font-bold">Magic Suggest</span>
            </Button>
          </div>
          <Input 
            id="targetIdentity" 
            placeholder="e.g. The Confident Practitioner, The Vital Leader" 
            value={formData.targetIdentity}
            onChange={(e) => setFormData({ ...formData, targetIdentity: e.target.value })}
            className="rounded-xl"
          />

          <AnimatePresence>
            {suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-wrap gap-2 mt-2"
              >
                {suggestions.map((suggestion, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setFormData({ ...formData, targetIdentity: suggestion });
                      toast.success(`Target Identity set to "${suggestion}"`, { duration: 2000 });
                    }}
                    className="text-[10px] font-bold px-3 py-1.5 bg-primary/10 text-primary rounded-full border border-primary/20 hover:bg-primary/20 transition-colors"
                  >
                    {suggestion}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-[10px] text-muted-foreground italic">Tip: This is the version of you for whom the goal is already a reality.</p>
        </div>
      </div>
      <Button 
        onClick={handleNext} 
        disabled={!formData.goal || !formData.targetIdentity}
        className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl h-12 font-bold"
      >
        Move to Somatic Mapping <ArrowRight className="ml-2" size={18} />
      </Button>
    </div>
  );

  const renderPhase2 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2 mb-4">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full text-indigo-600 mb-2">
          <Activity size={24} />
        </div>
        <h3 className="text-xl font-serif font-bold">Phase 2: Somatic Mapping</h3>
        <p className="text-sm text-muted-foreground">Connect the identity to your physical and emotional experience.</p>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="somatic">What are the physical sensations of this Target Identity?</Label>
          <Textarea 
            id="somatic" 
            placeholder="e.g. Expansion in chest, grounded feet, steady breath..." 
            value={formData.somaticSensations}
            onChange={(e) => setFormData({ ...formData, somaticSensations: e.target.value })}
            className="min-h-[100px] rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="emotions">What are the core emotional states of this identity?</Label>
          <Input 
            id="emotions" 
            placeholder="e.g. Peace, Certainty, Joy, Focus" 
            value={formData.emotionalStates}
            onChange={(e) => setFormData({ ...formData, emotionalStates: e.target.value })}
            className="rounded-xl"
          />
        </div>
      </div>
      <div className="flex gap-4">
        <Button variant="outline" onClick={handleBack} className="flex-1 rounded-xl h-12 font-bold">
          <ArrowLeft className="mr-2" size={18} /> Back
        </Button>
        <Button 
          onClick={handleNext} 
          disabled={!formData.somaticSensations || !formData.emotionalStates}
          className="flex-[2] bg-primary hover:bg-primary/90 text-white rounded-xl h-12 font-bold"
        >
          Begin Reconsolidation <ArrowRight className="ml-2" size={18} />
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
        <h3 className="text-xl font-serif font-bold">Phase 3: Neural Reconsolidation Loop</h3>
        <p className="text-sm text-muted-foreground">Surface and metabolize any resistance to the new identity.</p>
      </div>

      <Card className="border-2 border-amber-500/20 bg-amber-500/5 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <MessageSquare size={16} className="text-amber-600" />
            Metabolize Resistance
          </CardTitle>
          <CardDescription>Identify a "but" or a "what if" that arises when you step into the Target Identity.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">The Resistance (The "But...")</Label>
            <Input 
              placeholder="e.g. But I don't have enough experience yet..." 
              value={currentResistance}
              onChange={(e) => setCurrentResistance(e.target.value)}
              className="rounded-xl bg-white dark:bg-slate-950"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">The Metabolized Truth (The Shift)</Label>
            <Input 
              placeholder="e.g. Experience is built through the actions of this identity..." 
              value={currentMetabolized}
              onChange={(e) => setCurrentMetabolized(e.target.value)}
              className="rounded-xl bg-white dark:bg-slate-950"
            />
          </div>
          <Button 
            onClick={addReconsolidationEntry}
            disabled={!currentResistance || !currentMetabolized}
            variant="outline"
            className="w-full border-amber-500/50 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 rounded-xl"
          >
            <Plus className="mr-2" size={16} /> Add to Loop
          </Button>
        </CardContent>
      </Card>

      {formData.reconsolidationData.length > 0 && (
        <div className="space-y-3">
          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Metabolized Resistance ({formData.reconsolidationData.length})</Label>
          <div className="space-y-2">
            {formData.reconsolidationData.map((entry, i) => (
              <div key={i} className="p-3 bg-secondary/20 rounded-xl border border-secondary/30 text-xs flex justify-between items-start gap-4">
                <div>
                  <p className="font-bold text-rose-600 dark:text-rose-400 mb-1">Resistance: {entry.resistance}</p>
                  <p className="text-emerald-600 dark:text-emerald-400">Shift: {entry.metabolized}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 text-muted-foreground hover:text-rose-600"
                  onClick={() => {
                    const newData = [...formData.reconsolidationData];
                    newData.splice(i, 1);
                    setFormData({ ...formData, reconsolidationData: newData });
                  }}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <Button variant="outline" onClick={handleBack} className="flex-1 rounded-xl h-12 font-bold">
          <ArrowLeft className="mr-2" size={18} /> Back
        </Button>
        <Button 
          onClick={handleNext} 
          disabled={formData.reconsolidationData.length === 0}
          className="flex-[2] bg-primary hover:bg-primary/90 text-white rounded-xl h-12 font-bold"
        >
          Move to Testing <ArrowRight className="ml-2" size={18} />
        </Button>
      </div>
    </div>
  );

  const renderPhase4 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2 mb-4">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full text-emerald-600 mb-2">
          <CheckCircle2 size={24} />
        </div>
        <h3 className="text-xl font-serif font-bold">Phase 4: Testing & Anchoring</h3>
        <p className="text-sm text-muted-foreground">Verify the shift and anchor the new identity.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="present">Present Check: How does the original goal feel right now?</Label>
          <Input 
            id="present" 
            placeholder="e.g. It feels inevitable, simple, already done..." 
            value={formData.presentCheck}
            onChange={(e) => setFormData({ ...formData, presentCheck: e.target.value })}
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="future">Future Check: Imagine a future challenge. How does this identity handle it?</Label>
          <Input 
            id="future" 
            placeholder="e.g. With calm authority and clear steps..." 
            value={formData.futureCheck}
            onChange={(e) => setFormData({ ...formData, futureCheck: e.target.value })}
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="anchor">Final Anchor: What is the somatic anchor of inevitability?</Label>
          <Input 
            id="anchor" 
            placeholder="e.g. A deep breath and a slight smile..." 
            value={formData.finalAnchor}
            onChange={(e) => setFormData({ ...formData, finalAnchor: e.target.value })}
            className="rounded-xl"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Button 
          onClick={saveSession} 
          disabled={isSaving || !formData.presentCheck || !formData.futureCheck || !formData.finalAnchor}
          className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl h-12 font-bold"
        >
          {isSaving ? <Loader2 className="mr-2 animate-spin" size={18} /> : <Save className="mr-2" size={18} />}
          Complete & Save Session
        </Button>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleBack} className="flex-1 rounded-xl h-12 font-bold">
            <ArrowLeft className="mr-2" size={18} /> Back
          </Button>
          <Button variant="ghost" onClick={reset} className="flex-1 rounded-xl h-12 font-bold text-muted-foreground">
            <RotateCcw className="mr-2" size={18} /> Reset
          </Button>
        </div>
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-serif font-bold">Past Alignment Sessions</h3>
        <Button variant="ghost" size="sm" onClick={() => setShowHistory(false)}>Close</Button>
      </div>
      
      {pastSessions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <History className="mx-auto mb-4 opacity-20" size={48} />
          <p>No past sessions found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {pastSessions.map((session) => (
            <Card 
              key={session.id} 
              className="hover:border-primary/50 transition-all cursor-pointer group rounded-2xl overflow-hidden"
              onClick={() => setViewingReportId(session.id)}
            >
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Anchor size={20} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 truncate">{session.goal}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-[8px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 border-none">
                        {session.target_identity}
                      </Badge>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(session.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all"
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (!confirm("Delete this session?")) return;
                      await supabase.from('identity_alignment_sessions').delete().eq('id', session.id);
                      fetchPastSessions();
                    }}
                  >
                    <Trash2 size={16} />
                  </Button>
                  <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                    <ArrowRight size={18} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  if (viewingReportId) {
    const session = pastSessions.find(s => s.id === viewingReportId);
    return (
      <IdentityAlignmentReport 
        session={session} 
        onBack={() => setViewingReportId(null)} 
      />
    );
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="rounded-full h-8 px-3 text-xs gap-1.5"
            >
              <History size={14} />
              {showHistory ? "Back to Tool" : "History"}
            </Button>
            {!showHistory && (
              <div className="text-right">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Phase {phase} of 4</span>
                <p className="text-sm font-bold text-primary">
                  {phase === 1 && "Setup"}
                  {phase === 2 && "Somatic"}
                  {phase === 3 && "Reconsolidation"}
                  {phase === 4 && "Testing"}
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
          </>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-12 pt-8 border-t border-secondary/30 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
        <div className="flex items-center gap-2">
          <Shield size={12} />
          <span>Autonomic Safety Protocol</span>
        </div>
        <div className="flex items-center gap-2">
          <Brain size={12} />
          <span>Neural Reconsolidation</span>
        </div>
        <div className="flex items-center gap-2">
          <Fingerprint size={12} />
          <span>Identity Alignment v1.0</span>
        </div>
      </div>
    </div>
  );
};

export default IdentityAlignmentTool;