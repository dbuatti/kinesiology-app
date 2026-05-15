"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Zap, Trophy, ShieldCheck, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import MeridianClock from "../MeridianClock";

interface LibraryDashboardProps {
  morningProgress: number;
}

const LibraryDashboard = ({ morningProgress }: LibraryDashboardProps) => {
  const missions = [
    { label: "Daily Quiz", status: 'pending', icon: Zap },
    { label: "Protocol Study", status: 'pending', icon: BookOpen },
    { label: "Mastery Check", status: 'pending', icon: Trophy },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <Card className="border-none shadow-2xl shadow-indigo-500/10 rounded-[2.5rem] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl overflow-hidden">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-2 text-center md:text-left">
              <Badge className="bg-amber-600 text-white border-none font-black text-[9px] uppercase tracking-[0.3em] px-3 py-1">
                Daily Mission
              </Badge>
              <h2 className="text-3xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">
                Your focus for <span className="text-amber-600">today</span>.
              </h2>
              <p className="text-sm text-slate-500 font-medium">Complete these tasks to maintain clinical excellence.</p>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              {missions.map((m, i) => (
                <div key={i} className={cn(
                  "flex items-center gap-3 px-5 py-3 rounded-2xl border-2 transition-all duration-500",
                  m.status === 'done'
                    ? "bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400"
                    : "bg-slate-50 border-slate-100 text-slate-400 dark:bg-slate-800/50 dark:border-slate-800"
                )}>
                  <m.icon size={18} className={cn(m.status === 'done' ? "text-emerald-500" : "text-slate-300")} />
                  <span className="text-xs font-black uppercase tracking-widest">{m.label}</span>
                  {m.status === 'done' && <Check size={14} className="ml-1 text-emerald-500" />}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-10">
          <div className="p-10 bg-indigo-600 text-white rounded-[2.5rem] shadow-md relative overflow-hidden">
            <div className="relative z-10 space-y-6">
              <div className="space-y-2">
                <Badge className="bg-white/20 text-white border-none font-bold text-[10px] uppercase tracking-[0.3em] px-3 py-1">
                  Knowledge Mastery
                </Badge>
                <h2 className="text-4xl font-serif font-bold tracking-tight">
                  The Knowledge Oracle.
                </h2>
                <p className="text-lg text-indigo-100 font-medium max-w-xl">
                  Sharpen your clinical intuition with infinite practice questions across Anatomy, TCM, and FNH protocols.
                </p>
              </div>
              <Button asChild className="bg-white text-indigo-600 hover:bg-indigo-50 h-12 px-8 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg">
                <Link to="/practice/quiz">Start Infinite Quiz <Zap size={16} className="ml-2 fill-current" /></Link>
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white px-1">Clinical Reference</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link to="/resources" className="block group">
                <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-[2rem] bg-white dark:bg-slate-900 hover:border-indigo-300 transition-all h-full">
                  <CardContent className="p-6 space-y-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800 text-indigo-600 flex items-center justify-center border border-slate-100 dark:border-slate-700 group-hover:scale-110 transition-transform">
                      <BookOpen size={18} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Clinical Bible</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                      The definitive guide to joints, muscles, and the geometry of movement.
                    </p>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/peace-framework" className="block group">
                <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-[2rem] bg-white dark:bg-slate-900 hover:border-indigo-300 transition-all h-full">
                  <CardContent className="p-6 space-y-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800 text-rose-600 flex items-center justify-center border border-slate-100 dark:border-slate-700 group-hover:scale-110 transition-transform">
                      <ShieldCheck size={18} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">PEACE Framework</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                      Master the central clinical hierarchy of Functional Neuro Health.
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <MeridianClock />
          
          <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-[2rem] bg-white dark:bg-slate-900 overflow-hidden group">
            <CardHeader className="p-6 pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                <Trophy size={20} className="text-indigo-600" /> Mastery Tracker
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                Track your proficiency across all loggable clinical components.
              </p>
              <Button asChild className="w-full bg-slate-900 text-white h-10 rounded-xl font-bold text-[10px] uppercase tracking-widest">
                <Link to="/practice/procedures">View My Mastery</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LibraryDashboard;