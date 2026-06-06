
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
    const saved = localStorage.getItem('antigravity_mechano_challenge_streak');
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
    if (challengeStep < 6) {
      setChallengeStep(prev => (prev + 1) as any);
    }
  };

  const checkAnswer = () => {
    if (!currentCase) return;
    
    const pathCorrect = userAnswers.path === currentCase.correctPath;
    const skeletonCorrect = userAnswers.skeleton === currentCase.localization.skeleton;
    const regionCorrect = userAnswers.region === currentCase.localization.region;
    const jointCorrect = userAnswers.joint === currentCase.localization.joint;
    const planeCorrect = userAnswers.plane === currentCase.localization.plane;

    const correct = pathCorrect && skeletonCorrect && regionCorrect && jointCorrect && planeCorrect;
    
    setIsCorrect(correct);
    setShowResult(true);

    if (correct) {
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      localStorage.setItem('antigravity_mechano_challenge_streak', nextStreak.toString());
      showSuccess("Correct! Your clinical reasoning is spot on.");
    } else {
      setStreak(0);
      localStorage.setItem('antigravity_mechano_challenge_streak', '0');
      showError("Incorrect. Review the clinical logic breakdown.");
    }
  };

  if (!currentCase) return null;

  const progress = (challengeStep / 6) * 100;

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <Card className="border-none shadow-2xl rounded-[3rem] bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-10"><Target size={120} /></div>
        <CardHeader className="p-8 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg">
                <Sparkles size={20} className="text-amber-400" />
              </div>
              <div>
                <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 font-black text-[8px] uppercase tracking-widest mb-1 rounded-full">Daily Drill</Badge>
                <CardTitle className="text-2xl font-black">Clinical Case Study</CardTitle>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-xl border border-white/10">
              <Trophy size={14} className="text-amber-400 fill-amber-400" />
              <span className="text-xs font-black uppercase tracking-widest">Streak: {streak}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 pt-0 space-y-8 relative z-10">
          <div className="space-y-4">
            <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">The Presenting Symptom</p>
              <p className="text-xl font-bold leading-tight">"{currentCase.symptom}"</p>
              <p className="text-sm text-slate-400 mt-2 font-medium italic">History: {currentCase.history}</p>
            </div>

            <div className="p-6 bg-amber-500/10 rounded-[2rem] border border-amber-500/20">
              <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <ShieldAlert size={14} /> Diagnostic Clue
              </p>
              <p className="text-sm font-bold text-amber-100 leading-relaxed">
                {currentCase.diagnosticClue}
              </p>
            </div>
          </div>

          {!showResult ? (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span>Clinical Reasoning Flow</span>
                  <span>Step {challengeStep} of 6</span>
                </div>
                <Progress value={progress} className="h-1.5 bg-white/10 [&>div]:bg-indigo-500" />
              </div>

              {/* Step 1: Pathway */}
              {challengeStep === 1 && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <p className="text-sm font-black text-slate-400 uppercase tracking-widest">1. Identify the Pathway</p>
                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      variant="outline" 
                      onClick={() => handleSelectAnswer('path', 'Conscious')}
                      className="h-20 rounded-2xl border-2 border-white/10 bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-widest"
                    >
                      <Brain size={18} className="mr-2 text-blue-400" /> Conscious (DCML)
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleSelectAnswer('path', 'Unconscious')}
                      className="h-20 rounded-2xl border-2 border-white/10 bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-widest"
                    >
                      <Activity size={18} className="mr-2 text-emerald-400" /> Unconscious (SC)
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Skeleton Type */}
              {challengeStep === 2 && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <p className="text-sm font-black text-slate-400 uppercase tracking-widest">2. Identify the Skeleton Type</p>
                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      variant="outline" 
                      onClick={() => handleSelectAnswer('skeleton', 'Axial')}
                      className="h-20 rounded-2xl border-2 border-white/10 bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-widest"
                    >
                      Axial (Spine/Skull)
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleSelectAnswer('skeleton', 'Appendicular')}
                      className="h-20 rounded-2xl border-2 border-white/10 bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-widest"
                    >
                      Appendicular (Limbs)
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Region */}
              {challengeStep === 3 && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <p className="text-sm font-black text-slate-400 uppercase tracking-widest">3. Identify the Body Region</p>
                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      variant="outline" 
                      onClick={() => handleSelectAnswer('region', 'Upper')}
                      className="h-20 rounded-2xl border-2 border-white/10 bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-widest"
                    >
                      Upper Body (Above T12)
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleSelectAnswer('region', 'Lower')}
                      className="h-20 rounded-2xl border-2 border-white/10 bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-widest"
                    >
                      Lower Body (Below T12)
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 4: Joint */}
              {challengeStep === 4 && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <p className="text-sm font-black text-slate-400 uppercase tracking-widest">4. Localize the Joint</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {["Shoulder (GH Joint)", "Foot/Ankle", "Lumbar Spine", "Cervical Spine", "Hip", "Knee", "Jaw (TMJ)", "Pelvis"].map(joint => (
                      <Button 
                        key={joint}
                        variant="outline"
                        onClick={() => handleSelectAnswer('joint', joint)}
                        className="h-12 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold"
                      >
                        {joint}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 5: Plane of Motion */}
              {challengeStep === 5 && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <p className="text-sm font-black text-slate-400 uppercase tracking-widest">5. Identify the Plane of Motion</p>
                  <div className="grid grid-cols-3 gap-4">
                    {["Sagittal", "Frontal", "Transverse"].map(plane => (
                      <Button 
                        key={plane}
                        variant="outline"
                        onClick={() => handleSelectAnswer('plane', plane)}
                        className="h-16 rounded-2xl border-2 border-white/10 bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-widest"
                      >
                        {plane}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 6: Review & Submit */}
              {challengeStep === 6 && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <p className="text-sm font-black text-slate-400 uppercase tracking-widest">6. Review Your Clinical Logic</p>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                      <span className="text-[8px] font-black text-slate-500 uppercase">Pathway</span>
                      <p className="font-bold text-sm mt-1">{userAnswers.path}</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                      <span className="text-[8px] font-black text-slate-500 uppercase">Skeleton</span>
                      <p className="font-bold text-sm mt-1">{userAnswers.skeleton}</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                      <span className="text-[8px] font-black text-slate-500 uppercase">Region</span>
                      <p className="font-bold text-sm mt-1">{userAnswers.region}</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                      <span className="text-[8px] font-black text-slate-500 uppercase">Joint</span>
                      <p className="font-bold text-sm mt-1">{userAnswers.joint}</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10 col-span-2">
                      <span className="text-[8px] font-black text-slate-500 uppercase">Plane of Motion</span>
                      <p className="font-bold text-sm mt-1">{userAnswers.plane}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      variant="ghost" 
                      onClick={() => setChallengeStep(5)}
                      className="flex-1 h-14 rounded-2xl text-slate-400 hover:text-white"
                    >
                      <ChevronLeft size={18} className="mr-2" /> Back
                    </Button>
                    <Button 
                      onClick={checkAnswer}
                      className="flex-[2] h-14 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 font-black text-xs uppercase tracking-widest shadow-xl"
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
                "p-8 rounded-[2rem] border-4 text-center space-y-4",
                isCorrect ? "bg-emerald-500/10 border-emerald-500/50" : "bg-rose-500/10 border-rose-500/50"
              )}>
                <div className="w-16 h-16 rounded-full bg-white mx-auto flex items-center justify-center shadow-lg">
                  {isCorrect ? <CheckCircle2 size={40} className="text-emerald-500" /> : <XCircle size={40} className="text-rose-500" />}
                </div>
                <h3 className="text-2xl font-black">{isCorrect ? "Clinical Mastery!" : "Logic Refinement Needed"}</h3>
                <p className="text-slate-300 font-medium leading-relaxed">
                  {currentCase.logicExplanation}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Correct Pathway</p>
                  <Badge className={cn("border-none font-black rounded-full", currentCase.correctPath === 'Conscious' ? "bg-blue-600" : "bg-emerald-600")}>
                    {currentCase.correctPath}
                  </Badge>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Correct Joint</p>
                  <p className="text-sm font-bold">{currentCase.localization.joint}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 col-span-2 sm:col-span-1">
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Correct Plane</p>
                  <p className="text-sm font-bold">{currentCase.localization.plane}</p>
                </div>
              </div>

              <Button 
                onClick={generateNewCase}
                className="w-full h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black text-[10px] uppercase tracking-widest"
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