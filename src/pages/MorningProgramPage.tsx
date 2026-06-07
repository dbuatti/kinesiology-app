
import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/crm/AppLayout';
import Breadcrumbs from '@/components/shared/Breadcrumbs';
import PractitionerGrounding from '@/components/crm/PractitionerGrounding';
import HeartMathBreathing from '@/components/crm/HeartMathBreathing';
import PractitionerVitals from '@/components/crm/PractitionerVitals';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Sun, 
  Coffee, 
  Wind, 
  Activity, 
  CheckCircle2, 
  RotateCcw, 
  Sparkles,
  Info,
  ArrowRight,
  ShieldCheck,
  Zap,
  Brain,
  Target,
  ChevronRight,
  Play,
  Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isToday } from 'date-fns';
import { showSuccess } from '@/utils/toast';
import { motion, AnimatePresence } from 'framer-motion';

const STORAGE_KEY = "antigravity_morning_program";

const RITUAL_STEPS = [
  { id: 'grounding', label: 'Grounding & Presence', icon: Wind, color: 'text-indigo-600', bg: 'bg-indigo-50', desc: '60s centering to shift into a neutral clinical state.' },
  { id: 'physiology', label: 'Physiological Readiness', icon: Coffee, color: 'text-amber-600', bg: 'bg-amber-50', desc: 'L-Theanine, hydration, and nutritional support.' },
  { id: 'movement', label: 'Neurological Wake-up', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50', desc: 'Qigong: Dragon Whips Its Tail (2-3 mins).' },
  { id: 'centering', label: 'Switching Check', icon: Zap, color: 'text-rose-600', bg: 'bg-rose-50', desc: 'Check K27 points to ensure you are not neurologically switched.' },
  { id: 'coherence', label: 'Heart-Brain Coherence', icon: Sparkles, color: 'text-blue-600', bg: 'bg-blue-50', desc: '4/6 HeartMath rhythm to sync your autonomic system.' },
  { id: 'vitals', label: 'Self-Monitoring', icon: Target, color: 'text-purple-600', bg: 'bg-purple-50', desc: 'Log your own BOLT and Coherence scores.' },
];

const MorningProgramPage = () => {
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [ritualMode, setRitualMode] = useState<string | null>(null);
  const [intention, setIntention] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const { tasks, date, intention: savedIntention } = JSON.parse(saved);
        if (isToday(new Date(date))) {
          setCompletedTasks(tasks);
          setIntention(savedIntention || "");
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (e) {}
    }
  }, []);

  const saveState = (tasks: string[], newIntention?: string) => {
    const state = { 
      tasks, 
      date: new Date().toISOString(),
      intention: newIntention !== undefined ? newIntention : intention
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  };

  const toggleTask = (id: string) => {
    const newTasks = completedTasks.includes(id)
      ? completedTasks.filter(t => t !== id)
      : [...completedTasks, id];
    
    setCompletedTasks(newTasks);
    saveState(newTasks);
    
    if (newTasks.length === RITUAL_STEPS.length) {
      showSuccess("Morning Program Complete! You are ready for your day.");
    }
  };

  const handleIntentionSave = (val: string) => {
    setIntention(val);
    saveState(completedTasks, val);
  };

  const resetProgram = () => {
    if (confirm("Reset your morning progress?")) {
      setCompletedTasks([]);
      setIntention("");
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const progress = (completedTasks.length / RITUAL_STEPS.length) * 100;

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-700 space-y-12">
        <Breadcrumbs items={[{ label: "Practice Lab", path: "/lab" }, { label: "Morning Program" }]} />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-[2rem] bg-amber-500 text-white flex items-center justify-center shadow-2xl shadow-amber-200 dark:shadow-amber-900/20">
              <Sun size={40} className="fill-current" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">Morning Ritual</h1>
              <p className="text-muted-foreground font-medium mt-1 text-lg">Establish your clinical state before the first session.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={resetProgram} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-600">
              <RotateCcw size={14} className="mr-2" /> Reset Daily
            </Button>
          </div>
        </div>

        {/* Daily Intention Card */}
        <Card className="border-none shadow-xl rounded-[3rem] bg-indigo-900 text-white overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-transparent" />
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700"><Sparkles size={150} /></div>
          <CardContent className="p-10 relative z-10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                <Target size={20} className="text-indigo-300" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-[0.3em] text-indigo-300">Daily Intention</h3>
            </div>
            <textarea 
              value={intention}
              onChange={(e) => handleIntentionSave(e.target.value)}
              placeholder="What is your primary focus as a practitioner today?"
              className="w-full bg-transparent border-none focus:ring-0 text-2xl md:text-3xl font-serif italic placeholder:text-indigo-400/50 resize-none min-h-[100px]"
            />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Ritual Steps Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">The Protocol</h3>
              <Badge variant="outline" className="font-bold border-indigo-100 text-indigo-600">{completedTasks.length} / {RITUAL_STEPS.length} Done</Badge>
            </div>

            <div className="space-y-3">
              {RITUAL_STEPS.map((step) => (
                <div 
                  key={step.id}
                  onClick={() => toggleTask(step.id)}
                  className={cn(
                    "p-6 rounded-[2.5rem] border-2 transition-all duration-500 cursor-pointer flex items-center justify-between group",
                    completedTasks.includes(step.id) 
                      ? "bg-emerald-50 border-emerald-200 shadow-sm" 
                      : "bg-white border-slate-100 hover:border-indigo-200"
                  )}
                >
                  <div className="flex items-center gap-5">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm",
                      completedTasks.includes(step.id) ? "bg-emerald-500 text-white" : cn("bg-slate-50", step.color)
                    )}>
                      <step.icon size={24} />
                    </div>
                    <div className="space-y-0.5">
                      <span className={cn(
                        "font-black text-base transition-all",
                        completedTasks.includes(step.id) ? "text-emerald-900" : "text-slate-900"
                      )}>
                        {step.label}
                      </span>
                      <p className="text-[10px] font-medium text-slate-400 leading-tight max-w-[200px]">{step.desc}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {['grounding', 'coherence', 'vitals'].includes(step.id) && !completedTasks.includes(step.id) && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => { e.stopPropagation(); setRitualMode(step.id); }}
                        className="h-8 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50"
                      >
                        <Play size={12} className="mr-1.5 fill-current" /> Launch
                      </Button>
                    )}
                    <div className={cn(
                      "w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all",
                      completedTasks.includes(step.id) ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-200 group-hover:border-indigo-400"
                    )}>
                      {completedTasks.includes(step.id) && <CheckCircle2 size={18} />}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-8 bg-slate-900 text-white rounded-[3rem] shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10"><Info size={100} /></div>
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-3 text-amber-400">
                  <Activity size={20} />
                  <h4 className="font-black text-xs uppercase tracking-widest">Qigong: Dragon Whips Its Tail</h4>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-medium">
                  Stand with feet shoulder-width apart. Gently rotate your torso from side to side, letting your arms swing freely and tap your lower back and abdomen. This stimulates the kidneys and wakes up the spinal cord.
                </p>
                <div className="pt-2 flex items-center gap-2 text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                  <CheckCircle2 size={12} /> 2-3 Minutes Recommended
                </div>
              </div>
            </div>
          </div>

          {/* Active Tool Column */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {ritualMode ? (
                <motion.div 
                  key="ritual-tool"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-sm font-black text-indigo-600 uppercase tracking-[0.3em]">Active Ritual Tool</h3>
                    <Button variant="ghost" size="sm" onClick={() => setRitualMode(null)} className="text-slate-400 hover:text-rose-600">
                      <XIcon className="w-4 h-4 mr-2" /> Exit Tool
                    </Button>
                  </div>

                  {ritualMode === 'grounding' && (
                    <PractitionerGrounding 
                      onComplete={() => { toggleTask('grounding'); setRitualMode(null); }} 
                      onCancel={() => setRitualMode(null)}
                    />
                  )}
                  {ritualMode === 'coherence' && (
                    <HeartMathBreathing 
                      onComplete={() => { toggleTask('coherence'); setRitualMode(null); }}
                      onCancel={() => setRitualMode(null)}
                    />
                  )}
                  {ritualMode === 'vitals' && (
                    <PractitionerVitals 
                      onComplete={() => { toggleTask('vitals'); setRitualMode(null); }}
                    />
                  )}
                </motion.div>
              ) : (
                <motion.div 
                  key="ritual-overview"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-8"
                >
                  <div className="p-10 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center text-center space-y-6">
                    <div className="w-20 h-20 rounded-[2rem] bg-white flex items-center justify-center text-slate-200 shadow-sm">
                      <Lock size={40} />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black text-slate-900">Ritual Focus</h3>
                      <p className="text-slate-500 font-medium max-w-xs mx-auto">
                        Select a tool from the protocol list to begin your focused preparation.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {['grounding', 'coherence', 'vitals'].map(id => (
                        <div key={id} className={cn(
                          "w-3 h-3 rounded-full transition-all duration-500",
                          completedTasks.includes(id) ? "bg-emerald-500" : "bg-slate-200"
                        )} />
                      ))}
                    </div>
                  </div>

                  <div className="p-10 bg-indigo-50 rounded-[3rem] border-2 border-indigo-100 flex items-start gap-8">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl shrink-0">
                      <ShieldCheck size={32} />
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-xl font-black text-indigo-900">The Practitioner's State</h4>
                      <p className="text-indigo-700 font-medium leading-relaxed italic text-lg">
                        "Your state is the most powerful tool in the room. If you are not grounded and coherent, you cannot accurately read the client's system. Be your own No.1 client first."
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

function XIcon({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
}

export default MorningProgramPage;