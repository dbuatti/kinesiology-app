"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Keyboard, MousePointer2, Zap, Info, Command, Clock, Target, CheckCircle2, AlertTriangle, Home } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface HelpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const HelpModal = ({ open, onOpenChange }: HelpModalProps) => {
  const shortcuts = [
    { key: "⌘ + K", desc: "Global Search (Clients & Sessions)" },
    { key: "⌘ + N", desc: "Add New Client" },
    { key: "⌘ + B", desc: "Book New Session" },
    { key: "⌘ + D", desc: "Go to Dashboard" },
    { key: "⌘ + 1", desc: "Go to Clients List" },
    { key: "⌘ + 2", desc: "Go to Appointments List" },
    { key: "⌘ + P", desc: "Go to Procedure Tracker" },
  ];

  const stages = [
    { name: "Goal Setting", time: "22m", icon: Target, color: "text-indigo-600" },
    { name: "Activation", time: "23m", icon: Zap, color: "text-blue-600" },
    { name: "Correction", time: "35m", icon: CheckCircle2, color: "text-emerald-600" },
    { name: "Challenge", time: "5m", icon: AlertTriangle, color: "text-amber-600" },
    { name: "Home Reinforcement", time: "5m", icon: Home, color: "text-rose-600" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Keyboard size={24} className="text-white" />
            </div>
            Help & Shortcuts
          </DialogTitle>
          <DialogDescription>
            Master Antigravity CRM with these quick tips and keyboard shortcuts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 py-4">
          <section>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Clock size={14} /> Session Timer Stages (90m Total)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              {stages.map((s) => (
                <div key={s.name} className="flex flex-col items-center text-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <s.icon size={20} className={cn("mb-2", s.color)} />
                  <span className="text-[10px] font-bold text-slate-900 leading-tight mb-1">{s.name}</span>
                  <span className="text-[10px] font-black text-slate-400">{s.time}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 mt-3 italic text-center">
              The timer bar appears automatically for sessions scheduled for today.
            </p>
          </section>

          <section>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Command size={14} /> Keyboard Shortcuts
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {shortcuts.map((s) => (
                <div key={s.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-sm text-slate-600">{s.desc}</span>
                  <kbd className="px-2 py-1 bg-white border border-slate-200 rounded-md text-[10px] font-mono font-bold text-slate-900 shadow-sm">
                    {s.key}
                  </kbd>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Pro Tips</h3>
            <div className="space-y-3">
              <Card className="border-none shadow-sm bg-indigo-50/50">
                <CardContent className="p-4 flex gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm flex-shrink-0">
                    <Zap size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Auto-Saving Notes</h4>
                    <p className="text-xs text-slate-600 leading-relaxed mt-1">Most fields (Goal, Issue, Notes) save automatically as you type. Look for the 'Saved' indicator.</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm bg-indigo-50/50">
                <CardContent className="p-4 flex gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm flex-shrink-0">
                    <Info size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Procedure Tracking</h4>
                    <p className="text-xs text-slate-600 leading-relaxed mt-1">BOLT and Coherence tests are automatically tracked in your 'Procedures' page to monitor your clinical practice.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
};

import { cn } from "@/lib/utils";
export default HelpModal;