import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
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
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

type Phase = 1 | 2 | 3 | 4 | 5;

interface FormData {
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

  const progress = (phase / 5) * 100;

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
      toast.error("Failed to generate identity suggestions. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNext = () => {
    if (phase < 5) setPhase((p) => (p + 1) as Phase);
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

  // Phase 2 Loop Logic
  const loopQuestions = [
    (prev: string) => `What is the ${prev || formData.identity}?`,
    (prev: string) => `Where did the ${prev} come from?`,
    (prev: string) => `What is the ${prev} made of?`,
    (prev: string) => `What is the ${prev} trying to do?`,
    (prev: string) => `What is the ${prev} now?`,
  ];

  const handleLoopNext = () => {
    if (currentLoopResponse.trim() === '') return;
    
    const newResponses = [...formData.loopResponses, currentLoopResponse];
    setFormData({ ...formData, loopResponses: newResponses });
    
    if (loopStep < 4) {
      setLoopStep(loopStep + 1);
      setCurrentLoopResponse('');
    } else {
      // End of one loop iteration
      // In a real scenario, we might ask if they want to loop again or move to Phase 3
      setPhase(3);
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
              {isGenerating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              <span className="text-xs font-bold">Magic Suggest</span>
            </Button>
          </div>
          <Input
            id="identity"
            placeholder="e.g. The Failure, The Victim, The Perfectionist"
            value={formData.identity}
            onChange={(e) => setFormData({ ...formData, identity: e.target.value })}
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
                      setFormData({ ...formData, identity: suggestion });
                      toast.success(`Identity set to "${suggestion}"`, { duration: 2000 });
                    }}
                    className="text-[10px] font-bold px-3 py-1.5 bg-primary/10 text-primary rounded-full border border-primary/20 hover:bg-primary/20 transition-colors"
                  >
                    {suggestion}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-[10px] text-muted-foreground italic">Tip: Try to find a label that encapsulates the 'version' of you that experiences this.</p>
        </div>
      </div>
      <Button 
        onClick={handleNext} 
        disabled={!formData.problem || !formData.identity}
        className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl h-12 font-bold"
      >
        Begin Dissolving <ArrowRight className="ml-2" size={18} />
      </Button>
    </div>
  );

  const renderPhase2 = () => {
    const lastResponse = formData.loopResponses[formData.loopResponses.length - 1] || formData.identity;
    const question = loopQuestions[loopStep](lastResponse);

    return (
      <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full text-primary mb-2">
            <RotateCcw className="animate-spin-slow" size={24} />
          </div>
          <h3 className="text-xl font-serif font-bold">Phase 2: Dissolving the Identity</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Answer these questions intuitively. Don't overthink. Let the answers arise from your felt sense.
          </p>
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
              className="min-h-[120px] text-lg border-none focus-visible:ring-0 p-0 resize-none placeholder:text-muted-foreground/30"
            />
          </CardContent>
          <CardFooter className="bg-secondary/10 p-4 flex justify-end">
            <Button 
              onClick={handleLoopNext}
              disabled={!currentLoopResponse.trim()}
              className="bg-primary text-white rounded-xl px-8"
            >
              {loopStep === 4 ? "Complete Loop" : "Next Question"} <ArrowRight className="ml-2" size={16} />
            </Button>
          </CardFooter>
        </Card>

        <div className="flex justify-center">
          <Button variant="ghost" onClick={() => { setLoopStep(0); setFormData({...formData, loopResponses: []}); }} className="text-xs text-muted-foreground">
            <RotateCcw size={12} className="mr-2" /> Restart Loop
          </Button>
        </div>
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
        <p className="text-muted-foreground">
          Look back at the identity you started with: <span className="font-bold text-foreground">"{formData.identity}"</span>.
        </p>
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
        <p className="text-muted-foreground">
          Now think about the original problem: <span className="font-bold text-foreground">"{formData.problem}"</span>.
        </p>
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
          <Textarea 
            id="awareness" 
            placeholder="I realized that..." 
            value={formData.integrationAwareness}
            onChange={(e) => setFormData({ ...formData, integrationAwareness: e.target.value })}
            className="min-h-[100px] rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="action">What is one small action you can take from this new space?</Label>
          <Input 
            id="action" 
            placeholder="I will..." 
            value={formData.integrationAction}
            onChange={(e) => setFormData({ ...formData, integrationAction: e.target.value })}
            className="rounded-xl"
          />
        </div>
      </div>

      <Card className="bg-emerald-500/10 border-emerald-500/20 rounded-2xl">
        <CardContent className="p-6 flex items-center gap-4">
          <CheckCircle2 className="text-emerald-500 shrink-0" size={24} />
          <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
            Process complete. You have successfully navigated the identity shift. Take a deep breath and allow this new state to settle.
          </p>
        </CardContent>
      </Card>

      <Button 
        onClick={reset} 
        variant="outline"
        className="w-full border-primary text-primary hover:bg-primary/5 rounded-xl h-12 font-bold"
      >
        <RotateCcw className="mr-2" size={18} /> Start New Session
      </Button>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8 space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-serif font-bold tracking-tight">Identity Shifting</h1>
            <p className="text-muted-foreground">Interactive Sandbox Tool</p>
          </div>
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
        </div>
        <Progress value={progress} className="h-2 bg-secondary" />
      </div>

      <div className="min-h-[400px]">
        {phase === 1 && renderPhase1()}
        {phase === 2 && renderPhase2()}
        {phase === 3 && renderPhase3()}
        {phase === 4 && renderPhase4()}
        {phase === 5 && renderPhase5()}
      </div>

      {/* Footer Info */}
      <div className="mt-12 pt-8 border-t border-secondary/30 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
        <div className="flex items-center gap-2">
          <Zap size={12} />
          <span>Sandbox Environment</span>
        </div>
        <div className="flex items-center gap-2">
          <MessageSquare size={12} />
          <span>Local State Only</span>
        </div>
        <div className="flex items-center gap-2">
          <Fingerprint size={12} />
          <span>Identity Shifting v1.0</span>
        </div>
      </div>
    </div>
  );
};

export default IdentityShiftingTool;