
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  GraduationCap, Brain, Zap, Activity, 
  Target, BookOpen, Trophy, Sparkles,
  ChevronRight, LayoutGrid, ListChecks,
  ShieldCheck, Workflow, Lightbulb, CheckCircle2,
  Book, HelpCircle, ArrowRightLeft, RefreshCw,
  Layers, Compass, CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import DailyMechanoChallenge from './DailyMechanoChallenge';
import JointActionExplorer from './JointActionExplorer';
import RandomJointCard from './RandomJointCard';
import MechanoTheoryDrills from './MechanoTheoryDrills';
import MechanoLessons from './MechanoLessons';
import { Progress } from '@/components/ui/progress';

type TabType = 'academy' | 'anatomy' | 'sandbox' | 'lessons' | 'drills' | 'challenge' | 'explorer';

const MechanoMasteryModule = () => {
  const [activeTab, setActiveTab] = useState<TabType>('academy');
  const [lessonProgress, setLessonProgress] = useState<Record<string, boolean>>({
    '1': false,
    '2': false,
    '3': false,
    '4': false,
    '5': false,
    '6': false
  });

  const loadProgress = () => {
    const saved = localStorage.getItem('rk_mechano_lessons_progress');
    if (saved) {
      try {
        setLessonProgress(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse lesson progress", e);
      }
    }
  };

  useEffect(() => {
    loadProgress();
    // Listen for storage changes to keep tabs in sync
    const handleStorage = () => loadProgress();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [activeTab]);

  const completedCount = useMemo(() => {
    return Object.values(lessonProgress).filter(Boolean).length;
  }, [lessonProgress]);

  const totalLessons = 6;
  const progressPercent = Math.round((completedCount / totalLessons) * 100);

  const masteryLevel = useMemo(() => {
    if (completedCount === 6) return { level: "Master", accuracy: "95%" };
    if (completedCount >= 3) return { level: "Proficient", accuracy: "80%" };
    if (completedCount >= 1) return { level: "Competent", accuracy: "65%" };
    return { level: "Novice", accuracy: "0%" };
  }, [completedCount]);

  const navigationGroups = [
    {
      title: "Overview",
      items: [
        { id: 'academy' as TabType, label: "Academy Hub", icon: LayoutGrid, desc: "Curriculum overview & daily stats" }
      ]
    },
    {
      title: "Interactive Tools",
      items: [
        { id: 'anatomy' as TabType, label: "Interactive Anatomy", icon: Layers, desc: "Clickable joint & tissue models" },
        { id: 'sandbox' as TabType, label: "Protocol Practice", icon: Compass, desc: "Generate custom clinical protocols" },
        { id: 'explorer' as TabType, label: "Joint Explorer", icon: Target, desc: "Master the joint action table" }
      ]
    },
    {
      title: "Learning & Drills",
      items: [
        { id: 'lessons' as TabType, label: "Confidence Lessons", icon: Sparkles, desc: "Bite-sized reassuring guides" },
        { id: 'drills' as TabType, label: "Theory Drills", icon: Brain, desc: "Test your neurological logic" },
        { id: 'challenge' as TabType, label: "Daily Case", icon: Trophy, desc: "Solve today's clinical scenario" }
      ]
    }
  ];

  const lessonDetails = [
    { id: '1', title: "Demystifying Ligaments (The Unconscious GPS)", desc: "Learn why ligaments are your body's silent sensors." },
    { id: '3', title: "The 3-Step Mechano Process Demystified", desc: "Master the simple, repeatable clinical loop." },
    { id: '4', title: "Overcoming Clinical Intimidation", desc: "Mindset shifts and safety guarantees." },
    { id: '5', title: "The Lovett-Brother Spinal Engine", desc: "Understand how spinal segments work in pairs." },
    { id: '6', title: "Planes of Motion & Joint Geometry", desc: "Master the three planes of motion." }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Minimalist Module Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
            <GraduationCap size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Mechano Mastery Academy</h1>
            <p className="text-slate-500 text-sm mt-0.5">Master the geometry of movement and neurological correction.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200/60 self-start md:self-auto">
          <div className="px-3 py-1 text-center border-r border-slate-200">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Accuracy</p>
            <p className="text-sm font-bold text-slate-900">{masteryLevel.accuracy}</p>
          </div>
          <div className="px-3 py-1 text-center">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Level</p>
            <p className="text-sm font-bold text-slate-900">{masteryLevel.level}</p>
          </div>
        </div>
      </div>

      {/* Main Layout: Sidebar + Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Sidebar Navigation */}
        <div className="lg:col-span-3 space-y-6 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
          {navigationGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
                {group.title}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all",
                        isActive 
                          ? "bg-slate-900 text-white shadow-sm" 
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      )}
                    >
                      <Icon size={16} className={cn("shrink-0", isActive ? "text-white" : "text-slate-400")} />
                      <div className="min-w-0">
                        <p className="text-xs font-bold leading-none">{item.label}</p>
                        <p className={cn("text-[10px] mt-1 truncate font-medium", isActive ? "text-slate-300" : "text-slate-400")}>
                          {item.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {activeTab === 'academy' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
              <div className="xl:col-span-8 space-y-8">
                {/* Core Curriculum Card */}
                <Card className="border border-slate-200 shadow-sm rounded-2xl bg-slate-900 text-white overflow-hidden relative">
                  <CardHeader className="p-8 relative z-10">
                    <Badge className="bg-white/10 text-white border-none font-bold text-[9px] uppercase tracking-wider px-3 py-0.5 mb-3 w-fit">
                      Core Curriculum
                    </Badge>
                    <CardTitle className="text-3xl font-bold tracking-tight leading-tight">
                      The Path to Clinical Mastery
                    </CardTitle>
                    <CardDescription className="text-slate-300 text-sm font-medium mt-2 max-w-xl">
                      "2 years experience ≈ 65% accuracy. 5+ years ≈ 95% clinical mastery. Stay loose in the saddle and trust the system."
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-8 pt-0 relative z-10 space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold text-slate-300">
                        <span>Academy Progress</span>
                        <span>{completedCount} / {totalLessons} Lessons Completed ({progressPercent}%)</span>
                      </div>
                      <Progress value={progressPercent} className="h-2 bg-white/10 [&>div]:bg-indigo-500" />
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button 
                        onClick={() => setActiveTab('lessons')} 
                        className="bg-white text-slate-900 hover:bg-slate-100 h-11 px-6 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm"
                      >
                        Confidence Lessons <Sparkles size={14} className="ml-1.5 text-slate-900" />
                      </Button>
                      <Button 
                        onClick={() => setActiveTab('challenge')} 
                        variant="outline" 
                        className="bg-transparent border-white/20 text-white hover:bg-white/10 h-11 px-6 rounded-xl font-bold text-xs uppercase tracking-wider"
                      >
                        Start Today's Case <ChevronRight size={16} className="ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Lessons Progress List */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-900">Lessons Progress</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {lessonDetails.map((lesson) => {
                      const isCompleted = lessonProgress[lesson.id];
                      return (
                        <div 
                          key={lesson.id}
                          onClick={() => {
                            setActiveTab('lessons');
                          }}
                          className={cn(
                            "p-4 rounded-xl border-2 transition-all flex items-center justify-between cursor-pointer group",
                            isCompleted 
                              ? "bg-emerald-50/50 border-emerald-200" 
                              : "bg-white border-slate-100 hover:border-indigo-200"
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm",
                              isCompleted ? "bg-emerald-500" : "bg-slate-100 text-slate-400"
                            )}>
                              {isCompleted ? <CheckCircle size={16} /> : <BookOpen size={16} />}
                            </div>
                            <div>
                              <p className={cn("text-sm font-bold", isCompleted ? "text-emerald-900" : "text-slate-900")}>
                                {lesson.title}
                              </p>
                              <p className="text-xs text-slate-400 mt-0.5">{lesson.desc}</p>
                            </div>
                          </div>
                          <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Unconscious Mechanoreceptive Card */}
                <div className="max-w-md mx-auto">
                  <Card className="border border-slate-200 shadow-sm rounded-2xl bg-white overflow-hidden">
                    <CardHeader className="p-6 pb-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 flex items-center justify-center mb-3">
                        <Activity size={20} />
                      </div>
                      <CardTitle className="text-lg font-bold text-slate-900">Unconscious Mechanoreceptive</CardTitle>
                      <CardDescription className="text-xs font-medium text-slate-500">85% of afferent input. Ipsilateral logic. GV16 / Cerebellum.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 pt-0 space-y-3">
                      <ul className="space-y-2.5">
                        {["Targets Cerebellum (GV16)", "Uses Ligament Stretch", "Tuning Fork or Quick Tap", "Ipsilateral Brainstem Logic"].map(item => (
                          <li key={item} className="flex items-center gap-2.5 text-xs font-medium text-slate-600">
                            <CheckCircle2 size={15} className="text-slate-900 shrink-0" /> {item}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                {/* Clinical Logic Visualizer */}
                <Card className="border border-slate-200 shadow-sm rounded-2xl bg-slate-50/50 overflow-hidden">
                  <CardHeader className="p-6">
                    <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900">
                      <ArrowRightLeft size={20} className="text-slate-700" /> Clinical Logic Flow
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { step: "Stimulate", icon: Zap, desc: "Aggravate the threat or movement." },
                        { step: "Localize", icon: Target, desc: "Find the joint and plane of motion." },
                        { step: "Calibrate", icon: RefreshCw, desc: "Apply the specific correction." }
                      ].map((item, i) => (
                        <div key={item.step} className="flex flex-col items-center text-center space-y-2 p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700">
                            <item.icon size={18} />
                          </div>
                          <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">{item.step}</h4>
                          <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="xl:col-span-4 space-y-8">
                <RandomJointCard />

                {/* Mastery Checklist */}
                <Card className="border border-slate-200 shadow-sm rounded-2xl bg-white overflow-hidden">
                  <CardHeader className="p-6">
                    <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900">
                      <ListChecks size={20} className="text-slate-700" /> Mastery Checklist
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 pt-0 space-y-4">
                    {[
                      { label: "Localization Hierarchy", desc: "Axial vs Appendicular logic." },
                      { label: "Planes of Motion", desc: "Sagittal, Frontal, Transverse." },
                      { label: "Joint Actions", desc: "Mastering the Action Table." },
                      { label: "Correction Protocols", desc: "Unconscious Mechanoreceptive." }
                    ].map((item, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="w-5 h-5 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                        </div>
                        <div>
                          <p className="font-bold text-xs text-slate-900">{item.label}</p>
                          <p className="text-[11px] text-slate-500 font-medium">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Daily Tip */}
                <Card className="border border-slate-200 shadow-sm rounded-2xl bg-slate-900 text-white overflow-hidden">
                  <CardHeader className="p-6">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Lightbulb size={18} className="text-amber-400" /> Daily Tip
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 pt-0">
                    <p className="text-slate-300 text-xs font-medium leading-relaxed italic">
                      "If the IM remains inhibited after a correction, you haven't cleared the threat—you've just found another layer. Expect 5-15 layers in complex cases."
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'lessons' && <MechanoLessons activeSubTab="lessons" />}
          {activeTab === 'anatomy' && <MechanoLessons activeSubTab="anatomy" />}
          {activeTab === 'sandbox' && <MechanoLessons activeSubTab="sandbox" />}
          {activeTab === 'drills' && <MechanoTheoryDrills />}
          {activeTab === 'challenge' && <DailyMechanoChallenge />}
          {activeTab === 'explorer' && <JointActionExplorer />}
        </div>
      </div>
    </div>
  );
};

export default MechanoMasteryModule;