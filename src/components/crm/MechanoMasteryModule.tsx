"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  GraduationCap, Brain, Zap, Activity, 
  Target, BookOpen, Trophy, Sparkles,
  ChevronRight, LayoutGrid, ListChecks,
  ShieldCheck, Workflow, Lightbulb, CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import DailyMechanoChallenge from './DailyMechanoChallenge';
import JointActionExplorer from './JointActionExplorer';
import MechanoBible from './MechanoBible';
import RandomJointCard from './RandomJointCard';

const MechanoMasteryModule = () => {
  const [activeTab, setActiveTab] = useState<'academy' | 'challenge' | 'explorer' | 'bible'>('academy');

  const NavButton = ({ id, label, icon: Icon }: any) => (
    <Button
      variant={activeTab === id ? 'default' : 'ghost'}
      onClick={() => setActiveTab(id)}
      className={cn(
        "flex-1 h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all",
        activeTab === id 
          ? "bg-indigo-600 text-white shadow-xl shadow-indigo-200" 
          : "text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"
      )}
    >
      <Icon size={18} className="mr-2" />
      {label}
    </Button>
  );

  return (
    <div className="space-y-10">
      {/* Module Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-indigo-200">
            <GraduationCap size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900">Mechano Mastery Academy</h1>
            <p className="text-slate-500 font-medium text-lg mt-1">Master the geometry of movement and neurological correction.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
          <div className="px-4 py-2 text-center border-r border-slate-100">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Accuracy</p>
            <p className="text-xl font-black text-indigo-600">95%</p>
          </div>
          <div className="px-4 py-2 text-center">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Level</p>
            <p className="text-xl font-black text-emerald-600">Master</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-3 p-2 bg-slate-100 rounded-[2rem] border border-slate-200">
        <NavButton id="academy" label="Academy Hub" icon={LayoutGrid} />
        <NavButton id="challenge" label="Daily Drill" icon={Trophy} />
        <NavButton id="explorer" label="Joint Explorer" icon={Target} />
        <NavButton id="bible" label="The Bible" icon={BookOpen} />
      </div>

      {/* Content Area */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        {activeTab === 'academy' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
              <Card className="border-none shadow-xl rounded-[3rem] bg-slate-900 text-white overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-transparent" />
                <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700"><Workflow size={200} /></div>
                <CardHeader className="p-12 relative z-10">
                  <Badge className="bg-indigo-500 text-white border-none font-black text-[10px] uppercase tracking-[0.3em] px-4 py-1 mb-4">Core Curriculum</Badge>
                  <CardTitle className="text-5xl font-black tracking-tighter leading-none">The Path to <br/>Clinical Mastery</CardTitle>
                  <CardDescription className="text-slate-400 text-xl font-medium mt-4 max-w-xl">
                    "2 years experience ≈ 65% accuracy. 5+ years ≈ 95% clinical mastery. Stay loose in the saddle and trust the system."
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-12 pt-0 relative z-10">
                  <Button onClick={() => setActiveTab('challenge')} className="bg-white text-slate-900 hover:bg-indigo-50 h-14 px-10 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl">
                    Start Today's Drill <ChevronRight size={18} className="ml-2" />
                  </Button>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="border-none shadow-lg rounded-[2.5rem] bg-white overflow-hidden group hover:shadow-2xl transition-all">
                  <CardHeader className="p-8 pb-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <Brain size={24} />
                    </div>
                    <CardTitle className="text-2xl font-black">Conscious (DCML)</CardTitle>
                    <CardDescription className="font-medium">15% of afferent input. Contralateral logic.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-8 pt-0 space-y-4">
                    <ul className="space-y-3">
                      {["Targets S1 Sensory Cortex", "Uses Isometric Contractions", "30-40% Effort / 60-90s", "Nasal Breathing Required"].map(item => (
                        <li key={item} className="flex items-center gap-3 text-sm font-bold text-slate-600">
                          <CheckCircle2 size={18} className="text-blue-500" /> {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-lg rounded-[2.5rem] bg-white overflow-hidden group hover:shadow-2xl transition-all">
                  <CardHeader className="p-8 pb-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                      <Activity size={24} />
                    </div>
                    <CardTitle className="text-2xl font-black">Unconscious (SC)</CardTitle>
                    <CardDescription className="font-medium">85% of afferent input. Ipsilateral logic.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-8 pt-0 space-y-4">
                    <ul className="space-y-3">
                      {["Targets Cerebellum (GV16)", "Uses Ligament/Tendon Stretch", "Tuning Fork or Quick Tap", "Ipsilateral Brainstem Logic"].map(item => (
                        <li key={item} className="flex items-center gap-3 text-sm font-bold text-slate-600">
                          <CheckCircle2 size={18} className="text-emerald-500" /> {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-8">
              <RandomJointCard />

              <Card className="border-none shadow-lg rounded-[2.5rem] bg-indigo-50 border-2 border-indigo-100">
                <CardHeader className="p-8">
                  <CardTitle className="text-xl font-black flex items-center gap-3 text-indigo-900">
                    <ListChecks size={24} /> Mastery Checklist
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-6">
                  {[
                    { label: "Localization Hierarchy", desc: "Axial vs Appendicular logic." },
                    { label: "Planes of Motion", desc: "Sagittal, Frontal, Transverse." },
                    { label: "Joint Actions", desc: "Mastering the Action Table." },
                    { label: "Correction Protocols", desc: "Conscious vs Unconscious." }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="w-6 h-6 rounded-full bg-white border-2 border-indigo-200 flex items-center justify-center shrink-0 mt-1">
                        <div className="w-2 h-2 rounded-full bg-indigo-600" />
                      </div>
                      <div>
                        <p className="font-black text-sm text-indigo-900">{item.label}</p>
                        <p className="text-xs text-indigo-600/70 font-medium">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-none shadow-lg rounded-[2.5rem] bg-slate-900 text-white overflow-hidden">
                <CardHeader className="p-8">
                  <CardTitle className="text-xl font-black flex items-center gap-3">
                    <Lightbulb size={24} className="text-amber-400" /> Daily Tip
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-0">
                  <p className="text-slate-400 font-medium leading-relaxed italic">
                    "If the IM remains inhibited after a correction, you haven't cleared the threat—you've just found another layer. Expect 5-15 layers in complex cases."
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'challenge' && <DailyMechanoChallenge />}
        {activeTab === 'explorer' && <JointActionExplorer />}
        {activeTab === 'bible' && <MechanoBible />}
      </div>
    </div>
  );
};

export default MechanoMasteryModule;