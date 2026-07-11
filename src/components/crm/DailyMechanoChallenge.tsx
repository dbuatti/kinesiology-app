
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, Target, Brain, Activity, 
  CheckCircle2, XCircle, RefreshCw, 
  HelpCircle, Sparkles, ShieldAlert,
  ChevronRight, ChevronLeft, Lightbulb,
  Trophy, Award
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MECHANO_CASES, MechanoCase } from '@/data/mechano-cases-data';
import { Progress } from '@/components/ui/progress';
import { showSuccess, showError } from '@/utils/toast';

const DailyMechanoChallenge = () => {
  const [currentCase, setCurrentCase] = useState<MechanoCase | null>(null);
  const [challengeStep, setChallengeStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [userAnswers, setUserAnswers] = useState<Partial<MechanoCase['localization']> & { path?: string }>({});
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [streak, setStreak] = useState(() => {
    const saved = localStorage.getItem('rk_mechano_challenge_streak');
    return saved ? parseInt(saved) : 0;
  });

  const generateNewCase = () => {
    const randomCase = MECHANO_CASES[Math.floor(Math.random() * MECHANO_CASES.length)];
    setCurrentCase(randomCase);
    setUserAnswers({});
    setChallengeStep(1);
    setShowResult(false);
  };

  useEffect(() => {
    generateNewCase();
  }, []);

  const handleSelectAnswer = (field: string, value: string) => {
    setUserAnswers(prev => ({ ...prev, [field]: value }));
    if (challengeStep < 5) {
      setChallengeStep(prev => (prev + 1) as any);
    }
  };

  const checkAnswer = () => {
    if (!currentCase) return;
    
    const skeletonCorrect = userAnswers.skeleton === currentCase.localization.skeleton;
    const regionCorrect = userAnswers.region === currentCase.localization.region;
    const jointCorrect = userAnswers.joint === currentCase.localization.joint;
    const planeCorrect = userAnswers.plane === currentCase.localization.plane;

    const correct = skeletonCorrect && regionCorrect && jointCorrect && planeCorrect;
    
    setIsCorrect(correct);
    setShowResult(true);

    if (correct) {
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      localStorage.setItem('rk_mechano_challenge_streak', nextStreak.toString());
      showSuccess("Correct! Your clinical reasoning is spot on.");
    } else {
      setStreak(0);
      localStorage.setItem('rk_mechano_challenge_streak', '0');
      showError("Incorrect. Review the clinical logic breakdown.");
    }
  };

  if (!currentCase) return null;

  const progress = (challengeStep / 5) * 100;

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <Card className="border-none shadow-sm rounded-xl bg-card text-card-foreground overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-10"><Target size={120} /></div>
        <CardHeader className="p-8 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-sm">
                <Sparkles size={20} className="text-primary-foreground" />
              </div>
              <div>
                <Badge className="bg-chart-primary/10 text-chart-primary border-chart-primary/20 font-semibold text-[10px] uppercase tracking-wider mb-1 rounded-full">Daily Drill</Badge>
                <CardTitle className="text-2xl font-semibold">Clinical Case Study</CardTitle>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-muted px-4 py-1.5 rounded-xl border border-border">
              <Trophy size={14} className="text-muted-foreground fill-muted-foreground" />
              <span className="text-xs font-semibold uppercase tracking-wider">Streak: {streak}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 pt-0 space-y-8 relative z-10">
          <div className="space-y-4">
            <div className="p-6 bg-muted rounded-xl border border-border">
              <p className="text-[10px] font-semibold text-chart-primary uppercase tracking-wider mb-2">The Presenting Symptom</p>
              <p className="text-xl font-medium leading-tight">"{currentCase.symptom}"</p>
              <p className="text-sm text-muted-foreground mt-2 font-medium italic">History: {currentCase.history}</p>
            </div>

            <div className="p-6 bg-muted rounded-xl border border-border">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                <ShieldAlert size={14} /> Diagnostic Clue
              </p>
              <p className="text-sm font-medium text-foreground leading-relaxed">
                {currentCase.diagnosticClue}
              </p>
            </div>
          </div>

          {!showResult ? (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <span>Clinical Reasoning Flow</span>
                  <span>Step {challengeStep} of 6</span>
                </div>
                <Progress value={progress} className="h-1.5 bg-muted [&>div]:bg-chart-primary" />
              </div>

              {/* Step 1: Skeleton Type */}
              {challengeStep === 1 && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">1. Identify the Skeleton Type</p>
                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      variant="outline" 
                      onClick={() => handleSelectAnswer('skeleton', 'Axial')}
                      className="h-20 rounded-xl border-2 border-border bg-muted hover:bg-muted/80 text-muted-foreground font-semibold text-xs uppercase tracking-wider"
                    >
                      Axial (Spine/Skull)
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleSelectAnswer('skeleton', 'Appendicular')}
                      className="h-20 rounded-xl border-2 border-border bg-muted hover:bg-muted/80 text-muted-foreground font-semibold text-xs uppercase tracking-wider"
                    >
                      Appendicular (Limbs)
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Region */}
              {challengeStep === 2 && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">2. Identify the Body Region</p>
                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      variant="outline" 
                      onClick={() => handleSelectAnswer('region', 'Upper')}
                      className="h-20 rounded-xl border-2 border-border bg-muted hover:bg-muted/80 text-muted-foreground font-semibold text-xs uppercase tracking-wider"
                    >
                      Upper Body (Above T12)
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleSelectAnswer('region', 'Lower')}
                      className="h-20 rounded-xl border-2 border-border bg-muted hover:bg-muted/80 text-muted-foreground font-semibold text-xs uppercase tracking-wider"
                    >
                      Lower Body (Below T12)
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Joint */}
              {challengeStep === 3 && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">3. Localize the Joint</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {["Shoulder (GH Joint)", "Foot/Ankle", "Lumbar Spine", "Cervical Spine", "Hip", "Knee", "Jaw (TMJ)", "Pelvis"].map(joint => (
                      <Button 
                        key={joint}
                        variant="outline"
                        onClick={() => handleSelectAnswer('joint', joint)}
                        className="h-12 rounded-xl border border-border bg-muted hover:bg-muted/80 text-muted-foreground text-[10px] font-medium"
                      >
                        {joint}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4: Plane of Motion */}
              {challengeStep === 4 && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">4. Identify the Plane of Motion</p>
                  <div className="grid grid-cols-3 gap-4">
                    {["Sagittal", "Frontal", "Transverse"].map(plane => (
                      <Button 
                        key={plane}
                        variant="outline"
                        onClick={() => handleSelectAnswer('plane', plane)}
                        className="h-16 rounded-xl border-2 border-border bg-muted hover:bg-muted/80 text-muted-foreground font-semibold text-xs uppercase tracking-wider"
                      >
                        {plane}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 5: Review & Submit */}
              {challengeStep === 5 && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">5. Review Your Clinical Logic</p>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="p-4 bg-muted rounded-xl border border-border">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase">Skeleton</span>
                      <p className="font-medium text-sm mt-1">{userAnswers.skeleton}</p>
                    </div>
                    <div className="p-4 bg-muted rounded-xl border border-border">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase">Region</span>
                      <p className="font-medium text-sm mt-1">{userAnswers.region}</p>
                    </div>
                    <div className="p-4 bg-muted rounded-xl border border-border">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase">Joint</span>
                      <p className="font-medium text-sm mt-1">{userAnswers.joint}</p>
                    </div>
                    <div className="p-4 bg-muted rounded-xl border border-border col-span-2">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase">Plane of Motion</span>
                      <p className="font-medium text-sm mt-1">{userAnswers.plane}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      variant="ghost" 
                      onClick={() => setChallengeStep(4)}
                      className="flex-1 h-14 rounded-xl text-muted-foreground hover:text-foreground"
                    >
                      <ChevronLeft size={18} className="mr-2" /> Back
                    </Button>
                    <Button 
                      onClick={checkAnswer}
                      className="flex-[2] h-14 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-xs uppercase tracking-wider shadow-sm"
                    >
                      Submit Clinical Logic
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6 animate-in zoom-in-95 duration-500">
              <div className={cn(
                "p-8 rounded-xl border-4 text-center space-y-4",
                isCorrect ? "bg-chart-emerald/10 border-chart-emerald/50" : "bg-chart-destructive/10 border-chart-destructive/50"
              )}>
                <div className="w-16 h-16 rounded-full bg-card mx-auto flex items-center justify-center shadow-sm">
                  {isCorrect ? <CheckCircle2 size={40} className="text-chart-emerald" /> : <XCircle size={40} className="text-chart-destructive" />}
                </div>
                <h3 className="text-2xl font-semibold">{isCorrect ? "Clinical Mastery!" : "Logic Refinement Needed"}</h3>
                <p className="text-muted-foreground/60 font-medium leading-relaxed">
                  {currentCase.logicExplanation}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-muted rounded-xl border border-border">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Correct Joint</p>
                  <p className="text-sm font-medium">{currentCase.localization.joint}</p>
                </div>
                <div className="p-4 bg-muted rounded-xl border border-border col-span-2 sm:col-span-1">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Correct Plane</p>
                  <p className="text-sm font-medium">{currentCase.localization.plane}</p>
                </div>
              </div>

              <Button 
                onClick={generateNewCase}
                className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 font-semibold text-[10px] uppercase tracking-wider text-primary-foreground"
              >
                <RefreshCw size={16} className="mr-2" /> Next Case Study
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyMechanoChallenge;