"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wind, Zap, Layers, Activity, Info, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const BRAINSTEM_BREATHING = [
  {
    region: "Midbrain",
    nerves: "CN III, IV",
    tone: "Flexors",
    patterns: [
      { name: "Breath Holds", desc: "Hold after normal exhalation." },
      { name: "Air Hunger", desc: "Breathe 'light to right' (Oxygen Advantage style)." }
    ],
    color: "bg-amber-500",
    light: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700"
  },
  {
    region: "Pons",
    nerves: "CN V, VI, VII, VIII",
    tone: "Extensors",
    patterns: [
      { name: "Slow Breathing", desc: "4-6 breaths per minute." },
      { name: "Deep Inhalation", desc: "Full expansion of the ribcage." },
      { name: "Biots Breathing", desc: "Quick, shallow breaths with mouth open." }
    ],
    color: "bg-indigo-600",
    light: "bg-indigo-50",
    border: "border-indigo-200",
    text: "text-indigo-700"
  },
  {
    region: "Medulla",
    nerves: "CN IX, X, XI, XII",
    tone: "Flexors",
    patterns: [
      { name: "Forced Exhalation", desc: "Active push of air out." },
      { name: "Blocked Inhalation", desc: "Attempt to inhale against a closed airway." }
    ],
    color: "bg-rose-600",
    light: "bg-rose-50",
    border: "border-rose-200",
    text: "text-rose-700"
  }
];

const BrainstemBreathingReference = () => {
  return (
    <div className="space-y-8">
      <div className="p-6 bg-slate-900 text-white rounded-[2.5rem] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10"><Wind size={120} /></div>
        <div className="relative z-10 space-y-4">
          <h3 className="text-2xl font-black flex items-center gap-3">
            <Wind size={28} className="text-teal-400" /> Brainstem Breathing Rehab
          </h3>
          <p className="text-slate-400 font-medium leading-relaxed max-w-2xl">
            Breathing is a powerful input to the brainstem. Use these specific patterns to re-strengthen cranial nerve pathways after correction.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {BRAINSTEM_BREATHING.map((item) => (
          <Card key={item.region} className="border-none shadow-lg rounded-[2rem] bg-white overflow-hidden group">
            <div className={cn("p-6 text-white", item.color)}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xl font-black">{item.region}</h4>
                <Badge className="bg-white/20 text-white border-none font-black text-[8px] uppercase tracking-widest">
                  {item.tone}
                </Badge>
              </div>
              <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">{item.nerves}</p>
            </div>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                {item.patterns.map((p) => (
                  <div key={p.name} className={cn("p-4 rounded-2xl border-2 transition-all", item.light, item.border)}>
                    <p className={cn("text-xs font-black uppercase tracking-widest mb-1", item.text)}>{p.name}</p>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">{p.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="p-6 bg-blue-50 rounded-[2rem] border-2 border-blue-100 flex items-start gap-5">
        <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-blue-600 shrink-0">
          <ShieldAlert size={24} />
        </div>
        <div className="space-y-1">
          <h5 className="font-black text-blue-900 text-xs uppercase tracking-widest">Clinical Safety Note</h5>
          <p className="text-sm text-blue-700 font-medium leading-relaxed italic">
            "Nerves are like muscles—they can be overstimulated. Always start with the minimum effective dose and monitor for signs of autonomic fatigue (increased heart rate, agitation)."
          </p>
        </div>
      </div>
    </div>
  );
};

export default BrainstemBreathingReference;