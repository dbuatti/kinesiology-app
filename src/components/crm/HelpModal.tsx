"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Keyboard, MousePointer2, Zap, Info, Command } from "lucide-react";
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

  const features = [
    { 
      title: "Auto-Saving Notes", 
      desc: "Most fields (Goal, Issue, Notes) save automatically as you type. Look for the 'Saved' indicator.",
      icon: Zap 
    },
    { 
      title: "Session Timer", 
      desc: "When a session is active today, a fixed header appears to help you track the 5 phases of a balance.",
      icon: MousePointer2 
    },
    { 
      title: "Procedure Tracking", 
      desc: "BOLT and Coherence tests are automatically tracked in your 'Procedures' page to monitor your clinical practice.",
      icon: Info 
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto rounded-3xl">
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

        <div className="space-y-6 py-4">
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
              {features.map((f) => (
                <Card key={f.title} className="border-none shadow-sm bg-indigo-50/50">
                  <CardContent className="p-4 flex gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm flex-shrink-0">
                      <f.icon size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{f.title}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed mt-1">{f.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HelpModal;