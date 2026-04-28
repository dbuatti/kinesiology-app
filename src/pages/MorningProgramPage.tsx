"use client";

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/crm/AppLayout';
import Breadcrumbs from '@/components/shared/Breadcrumbs';
import PractitionerGrounding from '@/components/crm/PractitionerGrounding';
import HeartMathBreathing from '@/components/crm/HeartMathBreathing';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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
  ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isToday } from 'date-fns';
import { showSuccess } from '@/utils/toast';
import PageHeader from '@/components/shared/PageHeader';

const STORAGE_KEY = "antigravity_morning_program";

const TASKS = [
  { id: 'grounding', label: 'Grounding & Presence', icon: Wind, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { id: 'supplements', label: 'L-Theanine Ritual', icon: Coffee, color: 'text-amber-600', bg: 'bg-amber-50' },
  { id: 'qigong', label: 'Dragon Whips Its Tail', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { id: 'breathing', label: 'Heart-Focused Breathing', icon: Sparkles, color: 'text-rose-600', bg: 'bg-rose-50' },
];

const MorningProgramPage = () => {
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [lastReset, setLastReset] = useState<string>("");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const { tasks, date } = JSON.parse(saved);
        if (isToday(new Date(date))) {
          setCompletedTasks(tasks);
          setLastReset(date);
        } else {
          // Daily reset
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (e) {
        console.error("Failed to load morning program state", e);
      }
    }
  }, []);

  const toggleTask = (id: string) => {
    const newTasks = completedTasks.includes(id)
      ? completedTasks.filter(t => t !== id)
      : [...completedTasks, id];
    
    setCompletedTasks(newTasks);
    const state = { tasks: newTasks, date: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    
    if (newTasks.length === TASKS.length) {
      showSuccess("Morning Program Complete! You are ready for your day.");
    }
  };

  const resetProgram = () => {
    if (confirm("Reset your morning progress?")) {
      setCompletedTasks([]);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const progress = (completedTasks.length / TASKS.length) * 100;

  return (
    <AppLayout variant="workspace">
      <div className="space-y-10 animate-in fade-in duration-700">
        <PageHeader 
          title="Morning Program"
          subtitle="Establish your clinical state before the first session."
          icon={Sun}
          iconClassName="bg-amber-500"
          breadcrumbs={[{ label: "Practice" }, { label: "Morning Program" }]}
          actions={
            <Button variant="ghost" onClick={resetProgram} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-600">
              <RotateCcw size={14} className="mr-2" /> Reset Daily
            </Button>
          }
        />

        {/* Progress Bar */}
        <div className="space-y-3 px-2">
          <div className="flex justify-between items-end">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Daily Readiness</p>
            <p className="text-sm font-black text-indigo-600">{completedTasks.length} / {TASKS.length} Complete</p>
          </div>
          <Progress value={progress} className="h-2 bg-slate-100 [&>div]:bg-indigo-600" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Checklist Column */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] px-2">The Checklist</h3>
            <div className="space-y-3">
              {TASKS.map((task) => (
                <div 
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className={cn(
                    "p-5 rounded-[2rem] border-2 transition-all duration-500 cursor-pointer flex items-center justify-between group",
                    completedTasks.includes(task.id) 
                      ? "bg-emerald-50 border-emerald-200 shadow-sm" 
                      : "bg-white border-slate-100 hover:border-indigo-200"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                      completedTasks.includes(task.id) ? "bg-emerald-500 text-white" : cn("bg-slate-50", task.color)
                    )}>
                      <task.icon size={20} />
                    </div>
                    <span className={cn(
                      "font-bold text-sm transition-all",
                      completedTasks.includes(task.id) ? "text-emerald-900" : "text-slate-700"
                    )}>
                      {task.label}
                    </span>
                  </div>
                  <div className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                    completedTasks.includes(task.id) ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-200 group-hover:border-indigo-400"
                  )}>
                    {completedTasks.includes(task.id) && <CheckCircle2 size={16} />}
                  </div>
                </div>
              ))}
            </div>

            <Card className="border-none shadow-lg rounded-[2.5rem] bg-slate-900 text-white overflow-hidden mt-8">
              <CardContent className="p-8 space-y-4">
                <div className="flex items-center gap-3 text-amber-400">
                  <Info size={20} />
                  <h4 className="font-black text-xs uppercase tracking-widest">Qigong: Dragon Whips Its Tail</h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  Stand with feet shoulder-width apart. Gently rotate your torso from side to side, letting your arms swing freely and tap your lower back and abdomen. This stimulates the kidneys and wakes up the spinal cord.
                </p>
                <div className="pt-2 flex items-center gap-2 text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                  <CheckCircle2 size={12} /> 2-3 Minutes Recommended
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tools Column */}
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-4">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] px-2">Active Tools</h3>
              <PractitionerGrounding />
              <HeartMathBreathing />
            </div>

            <div className="p-8 bg-indigo-50 rounded-[2.5rem] border-2 border-indigo-100 flex items-start gap-6">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl shrink-0">
                <ShieldCheck size={32} />
              </div>
              <div className="space-y-2">
                <h4 className="text-xl font-black text-indigo-900">The Practitioner's State</h4>
                <p className="text-indigo-700 font-medium leading-relaxed italic">
                  "Your state is the most powerful tool in the room. If you are not grounded and coherent, you cannot accurately read the client's system. Be your own No.1 client first."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default MorningProgramPage;