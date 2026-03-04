"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  Compass, 
  Target, 
  Heart, 
  Wind, 
  Printer, 
  ArrowRight, 
  ChevronLeft,
  ChevronRight,
  Quote,
  Brain,
  Shield,
  CheckCircle2,
  Save,
  RotateCcw,
  Clock,
  Zap
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { showSuccess } from "@/utils/toast";

const STORAGE_KEY = "antigravity_north_star_data";

const STEPS = [
  {
    id: "part1",
    title: "Part 1: Why Are You Here?",
    description: "Connect with the deeper pull calling you to transformation.",
    questions: [
      { id: "q1_1", label: "What called you to this program?", sub: "Go beyond the surface reason. What was the deeper pull?" },
      { id: "q1_2", label: "What patterns or emotions are you tired of carrying?", sub: "What keeps showing up in your life that you're ready to release?" },
      { id: "q1_3", label: "If you're being completely honest, what are you avoiding or hiding from?", sub: "What part of yourself have you been unwilling to look at?" }
    ],
    icon: Sparkles,
    color: "bg-indigo-600"
  },
  {
    id: "part2",
    title: "Part 2: What Are You Ready to Release?",
    description: "Identify the stories and emotions that no longer serve you.",
    questions: [
      { id: "q2_1", label: "What emotions have been running your life?", sub: "Shame, fear, guilt, anger, control, perfectionism, people-pleasing?" },
      { id: "q2_2", label: "What stories about yourself are you ready to let go of?", sub: "\"I'm not good enough,\" \"I'm too much,\" \"I'm a burden\"..." },
      { id: "q2_3", label: "What would your life look like if these patterns no longer controlled you?", sub: "Paint the picture. Be specific." }
    ],
    icon: Wind,
    color: "bg-blue-600"
  },
  {
    id: "part3",
    title: "Part 3: Who Do You Want to Become?",
    description: "Visualize the version of yourself waiting on the other side.",
    questions: [
      { id: "q3_1", label: "On the other side of this work, who are you?", sub: "How do you show up? How do you feel in your body?" },
      { id: "q3_2", label: "What qualities or traits do you want to embody?", sub: "Confidence, trust, presence, authenticity, courage, compassion?" },
      { id: "q3_3", label: "How will your relationships, work, and health shift?", sub: "Describe the tangible changes in your daily life." }
    ],
    icon: Brain,
    color: "bg-purple-600"
  },
  {
    id: "part4",
    title: "Part 4: Your Commitment",
    description: "Establish the support and actions required for your growth.",
    questions: [
      { id: "q4_1", label: "What are you willing to do to make this happen?", sub: "Daily journaling, somatic practices, showing up to calls?" },
      { id: "q4_2", label: "What will you do when resistance shows up?", sub: "Identify your strategy for when things get difficult." },
      { id: "q4_3", label: "What support do you need to stay committed?", sub: "From yourself, the community, or others in your life?" }
    ],
    icon: Shield,
    color: "bg-amber-600"
  },
  {
    id: "part5",
    title: "Part 5: Your Intention Statement",
    description: "Distill your journey into a single, powerful North Star.",
    questions: [
      { id: "intention", label: "My intention for the Integrated Healer Program is:", sub: "This is your anchor for the next 12 weeks." }
    ],
    icon: Target,
    color: "bg-emerald-600"
  }
];

const InteractiveIntentionWorksheet = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setFormData(JSON.parse(saved));
    }
    setIsLoaded(true);
  }, []);

  const handleInputChange = (id: string, value: string) => {
    const newData = { ...formData, [id]: value };
    setFormData(newData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to clear your entire worksheet? This cannot be undone.")) {
      setFormData({});
      localStorage.removeItem(STORAGE_KEY);
      setCurrentStep(0);
      showSuccess("Worksheet reset.");
    }
  };

  if (!isLoaded) return null;

  const stepData = STEPS[currentStep];
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="relative rounded-[3.5rem] overflow-hidden bg-slate-950 text-white p-12 shadow-2xl group border border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-slate-950 to-purple-900/40" />
        <div className="relative z-10 flex flex-col items-center text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-2xl">
            <Compass size={32} className="text-indigo-400" />
          </div>
          <div className="space-y-2">
            <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 font-black text-[10px] uppercase tracking-[0.3em] px-4 py-1">
              Practitioner Development
            </Badge>
            <h1 className="text-4xl font-black tracking-tighter">Setting Your North Star</h1>
            <p className="text-lg text-slate-400 font-medium max-w-xl mx-auto italic">
              "The deeper you work, the higher you rise."
            </p>
          </div>
        </div>
        
        {/* Progress Bar Overlay */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-white/5">
          <div 
            className="h-full bg-indigo-500 transition-all duration-700 ease-out" 
            style={{ width: `${progress}%` }} 
          />
        </div>
      </div>

      {/* Step Navigation Tabs */}
      <div className="flex justify-between items-center gap-2 overflow-x-auto pb-2 px-2">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setCurrentStep(i)}
            className={cn(
              "flex-1 min-w-[120px] p-3 rounded-2xl border-2 transition-all text-left group",
              currentStep === i 
                ? "bg-white border-indigo-600 shadow-lg scale-105" 
                : "bg-slate-100 border-transparent hover:bg-white hover:border-slate-200"
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={cn(
                "text-[8px] font-black uppercase tracking-widest",
                currentStep === i ? "text-indigo-600" : "text-slate-400"
              )}>Part {i + 1}</span>
              {s.questions.every(q => formData[q.id]?.length > 10) && (
                <CheckCircle2 size={12} className="text-emerald-500" />
              )}
            </div>
            <p className={cn(
              "text-[10px] font-bold truncate",
              currentStep === i ? "text-slate-900" : "text-slate-500"
            )}>
              {s.title.split(': ')[1]}
            </p>
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Side: Context & Tips */}
        <div className="lg:col-span-1 space-y-6">
          <Card className={cn("border-none shadow-lg rounded-[2.5rem] text-white overflow-hidden relative h-full", stepData.color)}>
             <div className="absolute top-0 right-0 p-6 opacity-10"><stepData.icon size={100} /></div>
             <CardHeader className="relative z-10">
               <CardTitle className="text-xl font-black">{stepData.title}</CardTitle>
               <CardDescription className="text-white/80 font-medium">{stepData.description}</CardDescription>
             </CardHeader>
             <CardContent className="relative z-10 space-y-6">
               <div className="p-4 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-sm">
                 <p className="text-xs font-medium leading-relaxed italic">
                   Take a few deep breaths. Don't overthink. Let your truth emerge.
                 </p>
               </div>
               
               <div className="space-y-4">
                 <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Practitioner Tips</p>
                 <div className="flex gap-3">
                   <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                     <Target size={14} />
                   </div>
                   <p className="text-[10px] font-bold leading-tight">Be specific about the emotions you feel in your body.</p>
                 </div>
               </div>
             </CardContent>
          </Card>
        </div>

        {/* Right Side: Questions */}
        <div className="lg:col-span-3 space-y-8">
          <div className="grid grid-cols-1 gap-8">
            {stepData.questions.map((question) => (
              <div key={question.id} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-1">
                  <label className="text-lg font-black text-slate-900">{question.label}</label>
                  <p className="text-sm text-slate-500 font-medium">{question.sub}</p>
                </div>
                <Textarea 
                  className="min-h-[150px] rounded-[2rem] border-2 border-slate-100 focus:border-indigo-500 bg-white p-8 text-lg font-medium leading-relaxed shadow-inner resize-none transition-all"
                  placeholder="Write freely here..."
                  value={formData[question.id] || ""}
                  onChange={(e) => handleInputChange(question.id, e.target.value)}
                />
              </div>
            ))}
          </div>

          {/* Step Actions */}
          <div className="flex items-center justify-between pt-10 border-t border-slate-100">
            <Button
              variant="ghost"
              onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
              disabled={currentStep === 0}
              className="rounded-xl h-12 px-6 font-bold"
            >
              <ChevronLeft size={20} className="mr-2" /> Previous Part
            </Button>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleReset}
                className="rounded-xl h-12 px-4 border-slate-200 text-slate-400 hover:text-rose-600"
              >
                <RotateCcw size={18} />
              </Button>

              {currentStep < STEPS.length - 1 ? (
                <Button
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  className="bg-indigo-600 hover:bg-indigo-700 h-12 px-10 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100"
                >
                  Next Step <ChevronRight size={20} className="ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    showSuccess("Worksheet complete! Remember this is your North Star.");
                    window.print();
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 h-12 px-10 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-100"
                >
                  <Printer size={18} className="mr-2" /> Finish & Print
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Examples & Guidance Section */}
      {currentStep === 4 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in zoom-in-95 duration-700">
          <Card className="border-none shadow-lg rounded-[2.5rem] bg-indigo-50 border-2 border-indigo-100">
            <CardHeader>
              <CardTitle className="text-indigo-900 flex items-center gap-2">
                <Sparkles size={20} /> Example Intentions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                "I am here to release the shame that has kept me small and step fully into my power as a healer and leader.",
                "I commit to facing the fear and guilt I've been avoiding so I can show up authentically in my relationships and work.",
                "I am ready to stop performing and start being—to release perfectionism and embrace my messy, beautiful humanity."
              ].map((ex, i) => (
                <div key={i} className="p-4 bg-white rounded-2xl border border-indigo-100 text-sm italic text-indigo-700 font-medium">
                  "{ex}"
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg rounded-[2.5rem] bg-slate-900 text-white overflow-hidden">
            <CardHeader>
              <CardTitle className="text-xl font-black flex items-center gap-2">
                <Compass size={20} className="text-amber-400" /> How to Use Your Intention
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <Clock size={20} className="text-amber-400" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Daily Practice</h4>
                  <p className="text-xs text-slate-400 mt-1">Read your intention every morning before you begin your clinical day or journaling.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <Zap size={20} className="text-amber-400" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">When Resistance Shows Up</h4>
                  <p className="text-xs text-slate-400 mt-1">Ask: "What would the version of me who has realized this intention do right now?"</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default InteractiveIntentionWorksheet;