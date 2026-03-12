"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, Target, Brain, Activity, 
  CheckCircle2, XCircle, RefreshCw, 
  HelpCircle, Sparkles, ShieldAlert,
  ChevronRight, Lightbulb
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MECHANO_CASES, MechanoCase } from '@/data/mechano-cases-data';

const DailyMechanoChallenge = () => {
  const [currentCase, setCurrentCase] = useState<MechanoCase | null>(null);
  const [userAnswers, setUserAnswers] = useState<Partial<MechanoCase['localization']> & { path?: string }>({});
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const generateNewCase = () => {
    const randomCase = MECHANO_CASES[Math.floor(Math.random() * MECHANO_CASES.length)];
    setCurrentCase(randomCase);
    setUserAnswers({});
    setShowResult(false);
  };

  useEffect(() => {
    generateNewCase();
  }, []);

  const checkAnswer = () => {
    if (!currentCase) return;
    
    const pathCorrect = userAnswers.path === currentCase.correctPath;
    const jointCorrect = userAnswers.joint === currentCase.localization.joint;
    
    setIsCorrect(pathCorrect && jointCorrect);
    setShowResult(true);
  };

  if (!currentCase) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <Card className="border-none shadow-2xl rounded-[2.5rem] bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-10"><Target size={120} /></div>
        <CardHeader className="p-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg">
              <Sparkles size={20} className="text-amber-400" />
            </div>
            <div>
              <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 font-black text-[8px] uppercase tracking-widest mb-1">Daily Drill</Badge>
              <CardTitle className="text-2xl font-black">Clinical Case Study</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 pt-0 space-y-8 relative z-10">
          <div className="space-y-4">
            <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">The Symptom</p>
              <p className="text-xl font-bold leading-tight">"{currentCase.symptom}"</p>
              <p className="text-sm text-slate-400 mt-2 font-medium italic">History: {currentCase.history}</p>
            </div>

            <div className="p-6 bg-amber-500/10 rounded-3xl border border-amber-500/20">
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
              <div className="space-y-4">
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest">1. Identify the Pathway</p>
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setUserAnswers({...userAnswers, path: 'Conscious'})}
                    className={cn(
                      "h-16 rounded-2xl border-2 transition-all font-black text-xs uppercase tracking-widest",
                      userAnswers.path === 'Conscious' ? "bg-blue-600 border-blue-400 text-white" : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                    )}
                  >
                    <Brain size={18} className="mr-2" /> Conscious (DCML)
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setUserAnswers({...userAnswers, path: 'Unconscious'})}
                    className={cn(
                      "h-16 rounded-2xl border-2 transition-all font-black text-xs uppercase tracking-widest",
                      userAnswers.path === 'Unconscious' ? "bg-emerald-600 border-emerald-400 text-white" : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                    )}
                  >
                    <Activity size={18} className="mr-2" /> Unconscious (SC)
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest">2. Localize the Joint</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {["Shoulder (GH Joint)", "Foot/Ankle", "Lumbar Spine", "Cervical Spine", "Hip", "Knee"].map(joint => (
                    <Button 
                      key={joint}
                      variant="outline"
                      onClick={() => setUserAnswers({...userAnswers, joint})}
                      className={cn(
                        "h-10 rounded-xl border transition-all text-[10px] font-bold",
                        userAnswers.joint === joint ? "bg-indigo-600 border-indigo-400 text-white" : "bg-white/5 border-white/10 text-slate-400"
                      )}
                    >
                      {joint}
                    </Button>
                  ))}
                </div>
              </div>

              <Button 
                disabled={!userAnswers.path || !userAnswers.joint}
                onClick={checkAnswer}
                className="w-full h-14 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 font-black text-xs uppercase tracking-widest shadow-xl"
              >
                Submit Clinical Logic
              </Button>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Correct Pathway</p>
                  <Badge className={cn("border-none font-black", currentCase.correctPath === 'Conscious' ? "bg-blue-600" : "bg-emerald-600")}>
                    {currentCase.correctPath}
                  </Badge>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Correct Localization</p>
                  <p className="text-sm font-bold">{currentCase.localization.joint} ({currentCase.localization.plane})</p>
                </div>
              </div>

              <Button 
                onClick={generateNewCase}
                className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-black text-[10px] uppercase tracking-widest"
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