
import EmptyState from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { useState, useEffect } from 'react';
import AppLayout from '@/components/crm/AppLayout';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

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

const STORAGE_KEY = "rk_morning_program";

const RITUAL_STEPS = [
  { id: 'grounding', label: 'Grounding & Presence', icon: Wind, color: 'text-primary', bg: 'bg-primary/10', desc: '60s centering to shift into a neutral clinical state.' },
  { id: 'physiology', label: 'Physiological Readiness', icon: Coffee, color: 'text-primary', bg: 'bg-primary/10', desc: 'L-Theanine, hydration, and nutritional support.' },
  { id: 'movement', label: 'Neurological Wake-up', icon: Activity, color: 'text-chart-emerald', bg: 'bg-chart-emerald/10', desc: 'Qigong: Dragon Whips Its Tail (2-3 mins).' },
  { id: 'centering', label: 'Switching Check', icon: Zap, color: 'text-chart-destructive', bg: 'bg-chart-destructive/10', desc: 'Check K27 points to ensure you are not neurologically switched.' },
  { id: 'coherence', label: 'Heart-Brain Coherence', icon: Sparkles, color: 'text-chart-primary', bg: 'bg-chart-primary/10', desc: '4/6 HeartMath rhythm to sync your autonomic system.' },
  { id: 'vitals', label: 'Self-Monitoring', icon: Target, color: 'text-chart-primary', bg: 'bg-chart-primary/10', desc: 'Log your own BOLT and Coherence scores.' },
];

const MorningProgramPage = () => {
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [ritualMode, setRitualMode] = useState<string | null>(null);
  const [intention, setIntention] = useState("");
  const [showResetConfirm, setShowResetConfirm] = useState(false);

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

  const executeReset = () => {
    setShowResetConfirm(false);
    setCompletedTasks([]);
    setIntention("");
    localStorage.removeItem(STORAGE_KEY);
  };

  const progress = (completedTasks.length / RITUAL_STEPS.length) * 100;

  return (
    <AppLayout>
      <div className="w-full py-6 animate-in fade-in duration-700 space-y-6">


        <PageHeader
          icon={Sun}
          title="Morning Program"
          subtitle="Establish your clinical state before the first session."
          actions={
            <Button variant="ghost" onClick={() => setShowResetConfirm(true)} className="text-[11px] font-semibold text-muted-foreground hover:text-chart-destructive">
              <RotateCcw size={14} className="mr-2" /> Reset Daily
            </Button>
          }
        />

        {/* Daily Intention Card */}
        <Card className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(80%_120%_at_0%_0%,hsl(var(--chart-amber)/0.14),transparent_60%),radial-gradient(70%_120%_at_100%_0%,hsl(var(--primary)/0.10),transparent_60%)]" />
          <CardContent className="relative z-10 space-y-4 p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background">
                <Target size={15} className="text-chart-amber" />
              </div>
              <h3 className="text-[13px] font-medium text-muted-foreground">Today’s intention</h3>
            </div>
            <textarea 
              value={intention}
              onChange={(e) => handleIntentionSave(e.target.value)}
              placeholder="What is your primary focus as a practitioner today?"
              className="min-h-[88px] w-full resize-none border-none bg-transparent font-serif text-2xl italic leading-snug text-foreground outline-none placeholder:text-muted-foreground/50 focus:ring-0 md:text-[30px]"
            />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Ritual Steps Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[15px] font-semibold tracking-tight text-foreground">The protocol</h3>
              <Badge variant="outline" className="font-medium border-border text-primary">{completedTasks.length} / {RITUAL_STEPS.length} Done</Badge>
            </div>

            <div className="space-y-3">
              {RITUAL_STEPS.map((step) => (
                <div 
                  key={step.id}
                  onClick={() => toggleTask(step.id)}
                  className={cn(
                    "p-6 rounded-xl border-2 transition-all duration-500 cursor-pointer flex items-center justify-between group",
                    completedTasks.includes(step.id) 
                      ? "bg-chart-emerald/10 border-chart-emerald/30 shadow-sm" 
                      : "bg-card border-border hover:border-primary/30"
                  )}
                >
                  <div className="flex items-center gap-5">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 shadow-sm",
                      completedTasks.includes(step.id) ? "bg-chart-emerald text-primary-foreground" : cn("bg-muted", step.color)
                    )}>
                      <step.icon size={24} />
                    </div>
                    <div className="space-y-0.5">
                      <span className={cn(
                        "font-semibold text-base transition-all",
                        completedTasks.includes(step.id) ? "text-foreground" : "text-foreground"
                      )}>
                        {step.label}
                      </span>
                      <p className="text-[10px] font-medium text-muted-foreground leading-tight max-w-[200px]">{step.desc}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {['grounding', 'coherence', 'vitals'].includes(step.id) && !completedTasks.includes(step.id) && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => { e.stopPropagation(); setRitualMode(step.id); }}
                        className="h-8 px-3 rounded-lg text-[11px] font-semibold text-primary hover:bg-primary/10"
                      >
                        <Play size={12} className="mr-1.5 fill-current" /> Launch
                      </Button>
                    )}
                    <div className={cn(
                      "w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all",
                      completedTasks.includes(step.id) ? "bg-chart-emerald border-chart-emerald text-primary-foreground" : "border-border group-hover:border-primary"
                    )}>
                      {completedTasks.includes(step.id) && <CheckCircle2 size={18} />}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-8 bg-foreground text-background rounded-xl shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10"><Info size={100} /></div>
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-3 text-primary">
                  <Activity size={20} />
                  <h4 className="font-semibold text-xs uppercase tracking-wider">Qigong: Dragon Whips Its Tail</h4>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                  Stand with feet shoulder-width apart. Gently rotate your torso from side to side, letting your arms swing freely and tap your lower back and abdomen. This stimulates the kidneys and wakes up the spinal cord.
                </p>
                <div className="pt-2 flex items-center gap-2 text-[10px] font-semibold text-chart-emerald uppercase tracking-wider">
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
                    <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Active Ritual Tool</h3>
                    <Button variant="ghost" size="sm" onClick={() => setRitualMode(null)} className="text-muted-foreground hover:text-chart-destructive">
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
                  <div className="rounded-2xl border border-dashed border-foreground/15 bg-card/60">
                    <EmptyState
                      icon={Lock}
                      title="Ritual focus"
                      description="Choose a step from the protocol to begin your focused preparation."
                    />
                  </div>

                  <div className="p-10 bg-primary/10 rounded-xl border-2 border-primary/20 flex items-start gap-8">
                    <div className="w-16 h-16 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm shrink-0">
                      <ShieldCheck size={32} />
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-xl font-semibold text-foreground">The Practitioner's State</h4>
                      <p className="text-foreground font-medium leading-relaxed italic text-lg">
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

      <ConfirmDialog
        open={showResetConfirm}
        onOpenChange={setShowResetConfirm}
        title="Reset Morning Program"
        description="Reset your morning progress?"
        onConfirm={executeReset}
      />
    </AppLayout>
  );
};

function XIcon({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
}

export default MorningProgramPage;
