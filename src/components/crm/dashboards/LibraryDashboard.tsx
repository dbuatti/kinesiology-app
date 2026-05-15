"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
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
    <div className="space-y-8">
      {/* MISSION CRITICAL TASKS */}
      <div className="border border-border p-8 bg-background">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8">
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Knowledge Mastery</p>
            <h2 className="text-2xl font-medium uppercase tracking-tight">Daily Mission</h2>
          </div>

          <div className="flex flex-wrap gap-0 border border-border">
            {missions.map((m, i) => (
              <div key={i} className={cn(
                "flex items-center gap-3 px-6 py-4 border-r border-border last:border-r-0 transition-colors",
                m.status === 'done'
                  ? "bg-success/10 text-success"
                  : "bg-background text-muted-foreground"
              )}>
                <m.icon size={16} />
                <span className="text-[10px] font-bold uppercase tracking-widest">{m.label}</span>
                {m.status === 'done' && <Check size={14} className="ml-1" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <div className="p-10 bg-primary text-primary-foreground border border-border">
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Knowledge Mastery</p>
                <h2 className="text-4xl font-medium uppercase tracking-tight">The Knowledge Oracle</h2>
                <p className="text-lg opacity-80 max-w-xl">
                  Sharpen your clinical intuition with infinite practice questions across Anatomy, TCM, and FNH protocols.
                </p>
              </div>
              <Button asChild className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 h-12 px-8 font-bold text-[10px] uppercase tracking-widest">
                <Link to="/practice/quiz">Start Infinite Quiz <Zap size={16} className="ml-2 fill-current" /></Link>
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-medium uppercase tracking-tight">Clinical Reference</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-border">
              <Link to="/resources" className="p-8 border-r border-border last:border-r-0 hover:bg-muted transition-colors group">
                <div className="space-y-4">
                  <div className="w-10 h-10 border border-border flex items-center justify-center text-primary">
                    <BookOpen size={18} />
                  </div>
                  <h3 className="text-lg font-medium uppercase tracking-tight">Clinical Bible</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    The definitive guide to joints, muscles, and the geometry of movement.
                  </p>
                </div>
              </Link>
              <Link to="/peace-framework" className="p-8 border-r border-border last:border-r-0 hover:bg-muted transition-colors group">
                <div className="space-y-4">
                  <div className="w-10 h-10 border border-border flex items-center justify-center text-primary">
                    <ShieldCheck size={18} />
                  </div>
                  <h3 className="text-lg font-medium uppercase tracking-tight">PEACE Framework</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Master the central clinical hierarchy of Functional Neuro Health.
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <MeridianClock />
          
          <div className="border border-border bg-background">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-medium uppercase tracking-tight flex items-center gap-3">
                <Trophy size={18} className="text-primary" /> Mastery Tracker
              </h3>
            </div>
            <div className="p-6 space-y-6">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Track your proficiency across all loggable clinical components.
              </p>
              <Button asChild className="w-full bg-primary text-primary-foreground h-12 font-bold text-[10px] uppercase tracking-widest">
                <Link to="/practice/procedures">View My Mastery</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LibraryDashboard;