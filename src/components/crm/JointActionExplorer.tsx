"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Move, Zap, RefreshCw, 
  Search, ChevronRight,
  Lightbulb, Brain, Activity, Info,
  GraduationCap, CheckCircle2, XCircle, Play, RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { JOINT_ACTION_LIBRARY, JointData } from '@/data/joint-action-data';
import { showSuccess, showError } from '@/utils/toast';

const JointActionExplorer = () => {
  const [search, setSearch] = useState("");
  const [selectedJoint, setSelectedJoint] = useState<JointData>(JOINT_ACTION_LIBRARY[0]);
  
  // Quiz Mode State
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [quizJoint, setQuizJoint] = useState<JointData | null>(null);
  const [quizPlane, setQuizPlane] = useState<'Sagittal' | 'Frontal' | 'Transverse'>('Sagittal');
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizTotal, setQuizTotal] = useState(0);

  const filtered = JOINT_ACTION_LIBRARY.filter(j => 
    j.name.toLowerCase().includes(search.toLowerCase()) ||
    j.type.toLowerCase().includes(search.toLowerCase()) ||
    j.region.toLowerCase().includes(search.toLowerCase())
  );

  // Generate a random quiz question
  const startNewQuizQuestion = () => {
    const randomJoint = JOINT_ACTION_LIBRARY[Math.floor(Math.random() * JOINT_ACTION_LIBRARY.length)];
    const planes: ('Sagittal' | 'Frontal' | 'Transverse')[] = ['Sagittal', 'Frontal', 'Transverse'];
    
    // Find a plane that actually has actions (not just "-")
    let validPlane = planes[Math.floor(Math.random() * planes.length)];
    let attempts = 0;
    while (randomJoint.actions[validPlane][0]?.label === '-' && attempts < 10) {
      validPlane = planes[Math.floor(Math.random() * planes.length)];
      attempts++;
    }

    setQuizJoint(randomJoint);
    setQuizPlane(validPlane);
    setSelectedAnswers([]);
    setQuizSubmitted(false);
  };

  const handleToggleQuizMode = () => {
    if (!isQuizMode) {
      startNewQuizQuestion();
    }
    setIsQuizMode(!isQuizMode);
  };

  const handleToggleAnswer = (label: string) => {
    if (quizSubmitted) return;
    setSelectedAnswers(prev => 
      prev.includes(label) ? prev.filter(a => a !== label) : [...prev, label]
    );
  };

  // Get all possible actions across the entire library for distractor options
  const allPossibleActions = useMemo(() => {
    const actions = new Set<string>();
    JOINT_ACTION_LIBRARY.forEach(j => {
      Object.values(j.actions).forEach(planeActions => {
        planeActions.forEach(a => {
          if (a.label !== '-') actions.add(a.label);
        });
      });
    });
    return Array.from(actions);
  }, []);

  // Generate multiple choice options for the quiz
  const quizOptions = useMemo(() => {
    if (!quizJoint || !quizPlane) return [];
    
    const correctAnswers = quizJoint.actions[quizPlane]
      .map(a => a.label)
      .filter(l => l !== '-');

    const distractors = allPossibleActions.filter(a => !correctAnswers.includes(a));
    const shuffledDistractors = [...distractors].sort(() => 0.5 - Math.random()).slice(0, 4);
    
    return [...correctAnswers, ...shuffledDistractors].sort(() => 0.5 - Math.random());
  }, [quizJoint, quizPlane, allPossibleActions]);

  const handleSubmitQuiz = () => {
    if (!quizJoint || !quizPlane) return;

    const correctAnswers = quizJoint.actions[quizPlane]
      .map(a => a.label)
      .filter(l => l !== '-');

    const isCorrect = 
      selectedAnswers.length === correctAnswers.length &&
      selectedAnswers.every(a => correctAnswers.includes(a));

    setQuizSubmitted(true);
    setQuizTotal(prev => prev + 1);

    if (isCorrect) {
      setQuizScore(prev => prev + 1);
      showSuccess("Spot on! Excellent clinical geometry.");
    } else {
      showError("Incorrect. Review the correct actions below.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
        <div className="space-y-1">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Joint Action Explorer</h3>
          <p className="text-xs text-slate-500 font-medium">Master the planes of motion and joint actions.</p>
        </div>
        <Button 
          onClick={handleToggleQuizMode}
          className={cn(
            "rounded-xl h-10 px-6 font-black text-[10px] uppercase tracking-widest shadow-sm transition-all",
            isQuizMode ? "bg-rose-600 hover:bg-rose-700 text-white" : "bg-indigo-600 hover:bg-indigo-700 text-white"
          )}
        >
          {isQuizMode ? <XCircle size={14} className="mr-2" /> : <GraduationCap size={14} className="mr-2" />}
          {isQuizMode ? "Exit Quiz Mode" : "Test My Knowledge"}
        </Button>
      </div>

      {!isQuizMode ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-300">
          {/* Sidebar List */}
          <div className="lg:col-span-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <Input 
                placeholder="Search 15 joints..." 
                className="pl-10 h-11 rounded-2xl border-slate-200 bg-white"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <ScrollArea className="h-[600px] pr-4 rounded-2xl">
              <div className="space-y-2">
                {filtered.map(joint => (
                  <button
                    key={joint.name}
                    onClick={() => setSelectedJoint(joint)}
                    className={cn(
                      "w-full p-4 rounded-2xl border-2 text-left transition-all group",
                      selectedJoint.name === joint.name 
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-lg" 
                        : "bg-white border-slate-100 hover:border-indigo-200 text-slate-600"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-black text-sm">{joint.name}</p>
                        <div className="flex gap-1 mt-1">
                          <Badge className={cn(
                            "border-none font-black text-[6px] uppercase tracking-widest px-1.5 py-0 rounded-full",
                            selectedJoint.name === joint.name ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400"
                          )}>
                            {joint.type}
                          </Badge>
                          <Badge className={cn(
                            "border-none font-black text-[6px] uppercase tracking-widest px-1.5 py-0 rounded-full",
                            selectedJoint.name === joint.name ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400"
                          )}>
                            {joint.region}
                          </Badge>
                        </div>
                      </div>
                      <ChevronRight size={16} className={cn("transition-transform", selectedJoint.name === joint.name ? "translate-x-1" : "text-slate-300")} />
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Detail View */}
          <Card className="lg:col-span-8 border-none shadow-xl rounded-[3rem] bg-white overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100 p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                    <Move size={24} />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-black text-slate-900">{selectedJoint.name}</CardTitle>
                    <CardDescription className="font-bold text-[10px] uppercase tracking-widest text-indigo-600">
                      {selectedJoint.type} Skeleton • {selectedJoint.region} Body
                    </CardDescription>
                  </div>
                </div>
                <Badge className="bg-indigo-100 text-indigo-700 border-none font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-full">
                  Clinical Reference
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-10">
              {/* Detailed Actions with How-To */}
              <div className="space-y-8">
                {Object.entries(selectedJoint.actions).map(([plane, actions]) => (
                  <div key={plane} className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                      {plane === 'Sagittal' ? <Zap size={16} className="text-blue-500" /> :
                       plane === 'Frontal' ? <Move size={16} className="text-emerald-500" /> :
                       <RefreshCw size={16} className="text-orange-500" />}
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">{plane} Plane Actions</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {actions.map((action, idx) => (
                        <div key={idx} className={cn(
                          "p-4 rounded-2xl border-2 transition-all",
                          action.label === '-' ? "bg-slate-50 border-slate-100 opacity-50" : "bg-white border-slate-50 hover:border-indigo-100 shadow-sm"
                        )}>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-none font-black text-[10px] uppercase tracking-widest rounded-full">
                              {action.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-600 font-medium leading-relaxed">
                            {action.howTo}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 bg-indigo-50 rounded-[2rem] border-2 border-indigo-100 flex items-start gap-5">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-indigo-600 shrink-0">
                  <Lightbulb size={24} />
                </div>
                <div className="space-y-1">
                  <h5 className="font-black text-indigo-900 text-xs uppercase tracking-widest">Clinical Pearl</h5>
                  <p className="text-sm text-indigo-700 font-medium leading-relaxed">
                    "{selectedJoint.pearl}"
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-slate-900 text-white rounded-[2rem] space-y-3">
                  <div className="flex items-center gap-2 text-blue-400">
                    <Brain size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Conscious Logic</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Hold <span className="text-white font-bold">Contralateral S1</span>. Perform 30-40% isometric hold in the restricted action for 60s.
                  </p>
                </div>
                <div className="p-5 bg-slate-900 text-white rounded-[2rem] space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Activity size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Unconscious Logic</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Hold <span className="text-white font-bold">Ipsilateral GV16</span>. Stretch the priority ligament and apply tuning fork to cranium.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Quiz Mode UI */
        <div className="max-w-3xl mx-auto space-y-6 animate-in zoom-in-95 duration-300">
          <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
            <CardHeader className="bg-indigo-900 text-white p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <GraduationCap size={20} className="text-indigo-300" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-black">Joint Action Quiz</CardTitle>
                    <CardDescription className="text-indigo-200">Test your knowledge of joint actions and planes of motion.</CardDescription>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Score</p>
                  <p className="text-2xl font-black">{quizScore} / {quizTotal}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              {quizJoint && quizPlane && (
                <div className="space-y-6">
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">The Question</p>
                    <h3 className="text-2xl font-black text-slate-900">
                      Which of the following are valid actions for the <span className="text-indigo-600">"{quizJoint.name}"</span> in the <span className="text-indigo-600">"{quizPlane}"</span> plane?
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">Select all that apply, then click Submit.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {quizOptions.map((option) => {
                      const isSelected = selectedAnswers.includes(option);
                      const isCorrectAnswer = quizJoint.actions[quizPlane].some(a => a.label === option);
                      
                      return (
                        <button
                          key={option}
                          onClick={() => handleToggleAnswer(option)}
                          disabled={quizSubmitted}
                          className={cn(
                            "p-4 rounded-xl border-2 text-left transition-all font-bold text-sm flex items-center justify-between",
                            quizSubmitted
                              ? isCorrectAnswer
                                ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                                : isSelected
                                  ? "bg-rose-50 border-rose-500 text-rose-700"
                                  : "bg-slate-50 border-slate-100 text-slate-400"
                              : isSelected
                                ? "bg-indigo-50 border-indigo-600 text-indigo-900"
                                : "bg-white border-slate-100 hover:border-indigo-200 text-slate-600"
                          )}
                        >
                          <span>{option}</span>
                          {quizSubmitted && isCorrectAnswer && <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />}
                          {quizSubmitted && isSelected && !isCorrectAnswer && <XCircle size={16} className="text-rose-500 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {quizSubmitted && (
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4 animate-in fade-in duration-500">
                      <h4 className="font-black text-xs uppercase tracking-widest text-slate-500">Correct Actions & Explanations:</h4>
                      <div className="space-y-3">
                        {quizJoint.actions[quizPlane]
                          .filter(a => a.label !== '-')
                          .map((action, idx) => (
                            <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200 text-xs">
                              <span className="font-black text-indigo-600 uppercase">{action.label}</span>
                              <p className="text-slate-600 font-medium mt-1">{action.howTo}</p>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    {!quizSubmitted ? (
                      <Button 
                        onClick={handleSubmitQuiz}
                        disabled={selectedAnswers.length === 0}
                        className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest shadow-lg"
                      >
                        Submit Answer
                      </Button>
                    ) : (
                      <Button 
                        onClick={startNewQuizQuestion}
                        className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest shadow-lg"
                      >
                        Next Question <ChevronRight size={16} className="ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default JointActionExplorer;