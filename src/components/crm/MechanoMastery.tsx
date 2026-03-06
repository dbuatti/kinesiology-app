"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  Zap, 
  RefreshCw, 
  ChevronRight, 
  ChevronLeft, 
  Dumbbell, 
  Target, 
  Sparkles,
  HelpCircle,
  RotateCcw,
  CheckCircle2,
  Activity,
  Lightbulb,
  BookOpen,
  ExternalLink,
  Search,
  Youtube,
  GraduationCap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MECHANO_FLASHCARDS, MECHANO_RESOURCES } from '@/data/mechano-quiz-data';

const JOINTS = ["Cervical", "Thoracic", "Lumbar", "Pelvis", "Hip", "Knee", "Ankle", "Shoulder", "Elbow", "Wrist"];
const PLANES = ["Sagittal", "Frontal", "Transverse"];
const ACTIONS: Record<string, string[]> = {
  "Sagittal": ["Flexion", "Extension", "Anterior Tilt", "Posterior Tilt"],
  "Frontal": ["Lateral Flexion", "Adduction", "Abduction", "Inversion", "Eversion"],
  "Transverse": ["Internal Rotation", "External Rotation", "Pronation", "Supination"]
};

const MechanoMastery = () => {
  const [activeTab, setActiveTab] = useState<'flashcards' | 'simulator' | 'research'>('flashcards');
  
  // Flashcard State
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Simulator State
  const [scenario, setScenario] = useState<{ joint: string, plane: string, type: 'Conscious' | 'Unconscious' } | null>(null);
  const [showSolution, setShowSolution] = useState(false);

  const generateScenario = () => {
    const joint = JOINTS[Math.floor(Math.random() * JOINTS.length)];
    const plane = PLANES[Math.floor(Math.random() * PLANES.length)];
    const type = Math.random() > 0.5 ? 'Conscious' : 'Unconscious';
    setScenario({ joint, plane, type });
    setShowSolution(false);
  };

  const handleResearchJoint = (joint: string) => {
    const query = encodeURIComponent(`${joint} joint mechanoreceptors functional neurology`);
    window.open(`https://www.google.com/search?q=${query}`, '_blank');
  };

  const currentCard = MECHANO_FLASHCARDS[cardIndex];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-center">
        <div className="bg-slate-200/50 p-1.5 rounded-2xl flex flex-wrap justify-center gap-1">
          <Button 
            variant={activeTab === 'flashcards' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('flashcards')}
            className={cn("rounded-xl h-10 px-6 font-bold text-[10px] uppercase tracking-widest", activeTab === 'flashcards' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500")}
          >
            <Brain size={16} className="mr-2" /> Theory Flashcards
          </Button>
          <Button 
            variant={activeTab === 'simulator' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('simulator')}
            className={cn("rounded-xl h-10 px-6 font-bold text-[10px] uppercase tracking-widest", activeTab === 'simulator' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500")}
          >
            <Zap size={16} className="mr-2" /> Clinical Simulator
          </Button>
          <Button 
            variant={activeTab === 'research' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('research')}
            className={cn("rounded-xl h-10 px-6 font-bold text-[10px] uppercase tracking-widest", activeTab === 'research' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500")}
          >
            <BookOpen size={16} className="mr-2" /> Research & Practice
          </Button>
        </div>
      </div>

      {activeTab === 'flashcards' && (
        <div className="max-w-xl mx-auto space-y-8">
          <div 
            className="perspective-1000 h-[350px] cursor-pointer group"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <div className={cn(
              "relative w-full h-full transition-all duration-500 preserve-3d",
              isFlipped ? "rotate-y-180" : ""
            )}>
              {/* Front */}
              <Card className="absolute inset-0 backface-hidden border-none shadow-2xl rounded-[2.5rem] bg-white flex flex-col items-center justify-center p-10 text-center">
                <Badge className="absolute top-6 left-6 bg-indigo-50 text-indigo-600 border-none font-black text-[8px] uppercase tracking-widest">
                  {currentCard.category}
                </Badge>
                <HelpCircle size={48} className="text-indigo-200 mb-6" />
                <h3 className="text-2xl font-black text-slate-900 leading-tight">
                  {currentCard.question}
                </h3>
                <p className="mt-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">
                  Click to reveal answer
                </p>
              </Card>

              {/* Back */}
              <Card className="absolute inset-0 backface-hidden rotate-y-180 border-none shadow-2xl rounded-[2.5rem] bg-indigo-600 text-white flex flex-col items-center justify-center p-10 text-center">
                <Sparkles size={48} className="text-indigo-300 mb-6" />
                <p className="text-xl font-bold leading-relaxed">
                  {currentCard.answer}
                </p>
                <p className="mt-8 text-[10px] font-black text-indigo-300 uppercase tracking-[0.3em]">
                  Click to flip back
                </p>
              </Card>
            </div>
          </div>

          <div className="flex items-center justify-between px-4">
            <Button 
              variant="ghost" 
              onClick={() => { setCardIndex(prev => Math.max(0, prev - 1)); setIsFlipped(false); }}
              disabled={cardIndex === 0}
              className="rounded-xl font-bold"
            >
              <ChevronLeft size={20} className="mr-2" /> Previous
            </Button>
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
              {cardIndex + 1} / {MECHANO_FLASHCARDS.length}
            </span>
            <Button 
              variant="ghost" 
              onClick={() => { setCardIndex(prev => Math.min(MECHANO_FLASHCARDS.length - 1, prev + 1)); setIsFlipped(false); }}
              disabled={cardIndex === MECHANO_FLASHCARDS.length - 1}
              className="rounded-xl font-bold"
            >
              Next <ChevronRight size={20} className="ml-2" />
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'simulator' && (
        <div className="max-w-3xl mx-auto space-y-8">
          {!scenario ? (
            <Card className="border-none shadow-lg rounded-[2.5rem] bg-white p-12 text-center space-y-6">
              <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto text-indigo-600 shadow-inner">
                <Zap size={40} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900">Scenario Simulator</h3>
                <p className="text-slate-500 font-medium mt-2">Generate a random clinical finding to test your localization and correction logic.</p>
              </div>
              <Button 
                onClick={generateScenario}
                className="bg-indigo-600 hover:bg-indigo-700 h-14 px-10 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-200"
              >
                Generate Random Scenario
              </Button>
            </Card>
          ) : (
            <div className="space-y-8 animate-in zoom-in-95 duration-300">
              <Card className="border-none shadow-2xl rounded-[3rem] bg-slate-900 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 p-10 opacity-10"><Activity size={150} /></div>
                <CardHeader className="p-10">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
                      <Target size={24} className="text-amber-400" />
                    </div>
                    <div>
                      <Badge className={cn(
                        "border-none font-black text-[8px] uppercase tracking-widest mb-1",
                        scenario.type === 'Conscious' ? "bg-blue-500" : "bg-emerald-500"
                      )}>
                        {scenario.type} Priority
                      </Badge>
                      <CardTitle className="text-3xl font-black">Clinical Finding</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-10 pt-0 space-y-8 relative z-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Priority Joint</p>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleResearchJoint(scenario.joint)}
                          className="h-6 px-2 text-[8px] font-black uppercase tracking-widest text-indigo-400 hover:text-white hover:bg-white/10"
                        >
                          <Search size={10} className="mr-1" /> Research
                        </Button>
                      </div>
                      <p className="text-2xl font-black text-white">{scenario.joint}</p>
                    </div>
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Restricted Plane</p>
                      <p className="text-2xl font-black text-white">{scenario.plane}</p>
                    </div>
                  </div>

                  <div className="p-8 bg-indigo-600 rounded-[2rem] shadow-xl">
                    <h4 className="text-lg font-black mb-4 flex items-center gap-2">
                      <HelpCircle size={20} /> Your Challenge:
                    </h4>
                    <ul className="space-y-3 text-indigo-100 font-medium">
                      <li className="flex items-start gap-3">
                        <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">1</span>
                        What are the possible actions for this joint in the {scenario.plane} plane?
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">2</span>
                        What is the specific correction protocol for a <span className="text-white font-black underline">{scenario.type}</span> priority?
                      </li>
                    </ul>
                  </div>

                  <div className="flex gap-4">
                    <Button 
                      onClick={() => setShowSolution(!showSolution)}
                      className="flex-1 h-12 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-black text-[10px] uppercase tracking-widest"
                    >
                      {showSolution ? "Hide Logic" : "Reveal Clinical Logic"}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={generateScenario}
                      className="h-12 w-12 rounded-xl border-white/20 bg-white/5 text-white hover:bg-white/10"
                    >
                      <RefreshCw size={20} />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {showSolution && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-4 duration-500">
                  <Card className="border-none shadow-lg rounded-[2.5rem] bg-white overflow-hidden">
                    <CardHeader className="bg-slate-50 border-b border-slate-100">
                      <CardTitle className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Dumbbell size={16} className="text-indigo-500" /> Possible Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="flex flex-wrap gap-2">
                        {ACTIONS[scenario.plane].map(action => (
                          <Badge key={action} variant="secondary" className="bg-indigo-50 text-indigo-700 border-none font-bold px-3 py-1.5 rounded-lg">
                            {action}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-lg rounded-[2.5rem] bg-white overflow-hidden">
                    <CardHeader className="bg-slate-50 border-b border-slate-100">
                      <CardTitle className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Lightbulb size={16} className="text-amber-500" /> Correction Logic
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      {scenario.type === 'Conscious' ? (
                        <div className="space-y-3">
                          <p className="text-sm font-bold text-slate-700">DCML / Contralateral Logic:</p>
                          <ul className="text-xs text-slate-500 space-y-2 list-disc list-inside">
                            <li>Hold <span className="font-bold text-indigo-600">Contralateral</span> M1/S1 brain zones.</li>
                            <li>Perform 30-40% isometric contraction in the restricted action.</li>
                            <li>Hold for 30-90 seconds with nasal breathing.</li>
                          </ul>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-sm font-bold text-slate-700">Spinocerebellar / Ipsilateral Logic:</p>
                          <ul className="text-xs text-slate-500 space-y-2 list-disc list-inside">
                            <li>Hold <span className="font-bold text-emerald-600">GV16</span> (Cerebellum).</li>
                            <li>Stretch the priority ligament/tendon of the {scenario.joint}.</li>
                            <li>Apply tuning fork to cranium or tap for 3-5 seconds.</li>
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'research' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {MECHANO_RESOURCES.map((res) => (
            <Card key={res.url} className="border-none shadow-lg rounded-[2rem] bg-white hover:shadow-xl transition-all group overflow-hidden flex flex-col">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <Badge className={cn(
                    "border-none font-black text-[8px] uppercase tracking-widest mb-2",
                    res.type === 'Video' ? "bg-rose-100 text-rose-700" :
                    res.type === 'Research' ? "bg-indigo-100 text-indigo-700" :
                    "bg-emerald-100 text-emerald-700"
                  )}>
                    {res.type}
                  </Badge>
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                    {res.type === 'Video' ? <Youtube size={18} /> : <BookOpen size={18} />}
                  </div>
                </div>
                <CardTitle className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {res.title}
                </CardTitle>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{res.source}</p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <p className="text-sm text-slate-600 leading-relaxed font-medium mb-6">
                  {res.description}
                </p>
                <Button 
                  asChild
                  className="w-full bg-slate-900 hover:bg-indigo-600 h-11 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg transition-all"
                >
                  <a href={res.url} target="_blank" rel="noopener noreferrer">
                    Open Resource <ExternalLink size={14} className="ml-2" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}

          <Card className="border-2 border-dashed border-slate-200 shadow-none rounded-[2rem] bg-slate-50/50 flex flex-col items-center justify-center p-8 text-center group hover:border-indigo-300 hover:bg-indigo-50/30 transition-all">
            <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-300 group-hover:text-indigo-400 transition-all mb-4">
              <GraduationCap size={24} />
            </div>
            <h3 className="text-sm font-black text-slate-400 group-hover:text-indigo-900 transition-colors uppercase tracking-widest">Deepen Your Practice</h3>
            <p className="text-xs text-slate-400 mt-2">Research specific joints or pathways to build clinical intuition.</p>
          </Card>
        </div>
      )}

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
};

export default MechanoMastery;