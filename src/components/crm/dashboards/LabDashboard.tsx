"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Sun, MessageSquare, Fingerprint, Target, ShieldAlert, Layers, ArrowRight, Clock, Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import IdentitySmartTool from "../IdentitySmartTool";
import Scratchpad from "../Scratchpad";

interface LabDashboardProps {
  morningProgress: number;
  lastJournalDate: string | null;
}

const LabDashboard = ({ morningProgress, lastJournalDate }: LabDashboardProps) => {
  const missions = [
    { label: "Morning Program", status: morningProgress === 100 ? 'done' : 'pending', icon: Sun },
    { label: "Journal Entry", status: 'pending', icon: MessageSquare },
    { label: "Identity Work", status: 'pending', icon: Fingerprint },
  ];

  return (
    <div className="space-y-8">
      {/* MISSION CRITICAL TASKS */}
      <div className="border border-border p-8 bg-background">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8">
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Personal Integration</p>
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
          <div className="border border-border p-8 bg-background">
            <div className="max-w-2xl space-y-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Daily Ritual</p>
              <h2 className="text-3xl font-medium uppercase tracking-tight">Establish Your State</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Complete your morning program to ensure you are grounded, coherent, and ready for clinical work.
              </p>
              <div className="flex items-center gap-8 pt-4">
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground">
                    <span>Progress</span>
                    <span className="text-primary">{morningProgress}%</span>
                  </div>
                  <Progress value={morningProgress} className="h-1 bg-muted [&>div]:bg-primary" />
                </div>
                <Button asChild className="bg-primary text-primary-foreground h-12 px-8 font-bold text-[10px] uppercase tracking-widest">
                  <Link to="/morning-program">Open Program</Link>
                </Button>
              </div>
            </div>
          </div>

          <IdentitySmartTool />
          <Scratchpad />
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="border border-border bg-background">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-medium uppercase tracking-tight flex items-center gap-3">
                <MessageSquare size={18} className="text-primary" /> Practitioner Journal
              </h3>
            </div>
            <div className="p-6 space-y-6">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Capture your clinical doubts, breakthroughs, and reflections.
              </p>
              {lastJournalDate && (
                <div className="p-3 bg-muted border border-border flex items-center gap-3">
                  <Clock size={14} className="text-primary" />
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Last entry: {formatDistanceToNow(new Date(lastJournalDate)).toUpperCase()} AGO</p>
                </div>
              )}
              <Button asChild className="w-full bg-primary text-primary-foreground h-12 font-bold text-[10px] uppercase tracking-widest">
                <Link to="/practice/journal">Open Journal</Link>
              </Button>
            </div>
          </div>

          <div className="border border-border bg-background">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-medium uppercase tracking-tight flex items-center gap-3">
                <Layers size={18} className="text-primary" /> The Lab (Sandbox)
              </h3>
            </div>
            <div className="p-0">
              {[
                { label: "Identity Shifting", path: "/sandbox/identity-shifting", icon: Fingerprint },
                { label: "Identity Alignment", path: "/sandbox/identity-alignment", icon: Target },
                { label: "Limiting Beliefs", path: "/sandbox/limiting-beliefs", icon: ShieldAlert }
              ].map(tool => (
                <Link key={tool.path} to={tool.path} className="flex items-center justify-between p-6 border-b border-border last:border-b-0 hover:bg-muted transition-colors group">
                  <div className="flex items-center gap-4">
                    <tool.icon size={16} className="text-muted-foreground group-hover:text-primary" />
                    <span className="text-xs font-bold uppercase tracking-tight text-muted-foreground group-hover:text-primary">{tool.label}</span>
                  </div>
                  <ArrowRight size={14} className="text-muted-foreground group-hover:text-primary" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabDashboard;