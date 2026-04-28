"use client";

import React from 'react';
import { 
  Heart, 
  Shield, 
  Layers, 
  Zap, 
  CheckCircle2, 
  Info, 
  ArrowRight, 
  Search,
  Target,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const STEPS = [
  { 
    id: 1, 
    title: "Discovery & Permission", 
    desc: "Ask the body: 'Do you have a Heart Wall?' If yes, ask: 'Can we release an emotion from the Heart Wall now?'",
    icon: Search,
    color: "text-rose-600",
    bg: "bg-rose-50"
  },
  { 
    id: 2, 
    title: "Material Identification", 
    desc: "Identify the symbolic material of the wall (e.g., Wood, Stone, Metal, Glass). This represents the subconscious 'protection' strategy.",
    icon: Layers,
    color: "text-indigo-600",
    bg: "bg-indigo-50"
  },
  { 
    id: 3, 
    title: "Thickness & Size", 
    desc: "Quantify the barrier. Ask for the thickness (e.g., miles, inches) or size. This helps the conscious mind grasp the scale of the protection.",
    icon: Target,
    color: "text-amber-600",
    bg: "bg-amber-50"
  },
  { 
    id: 4, 
    title: "Emotion Identification", 
    desc: "Use the Emotion Chart to identify the specific trapped emotion currently acting as a 'brick' in the wall.",
    icon: Heart,
    color: "text-rose-500",
    bg: "bg-rose-50"
  },
  { 
    id: 5, 
    title: "The Release", 
    desc: "Swipe 3 times (or 10 for inherited) along the Governing Meridian (from forehead to base of neck) while intending to release the emotion.",
    icon: Zap,
    color: "text-emerald-600",
    bg: "bg-emerald-50"
  },
  { 
    id: 6, 
    title: "Verification", 
    desc: "Re-test the indicator muscle. Ask: 'Did we release that emotion?' and 'Is there another emotion we can release now?'",
    icon: CheckCircle2,
    color: "text-blue-600",
    bg: "bg-blue-50"
  }
];

const HeartWallProtocol = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="border-b border-slate-100 pb-6 mb-8">
        <h1 className="text-3xl font-serif font-bold text-slate-900">Heart Wall Protocol</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Subconscious Barrier Release Process</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-4">
          {STEPS.map((step) => (
            <div 
              key={step.id} 
              className="p-5 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex items-start gap-6">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-sm shadow-sm transition-transform group-hover:scale-105",
                  step.bg, step.color
                )}>
                  {step.id}
                </div>
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="font-serif font-bold text-xl text-slate-900">
                      {step.title}
                    </h4>
                    <Badge variant="outline" className="border-slate-100 text-slate-400 font-black text-[7px] uppercase tracking-widest px-1.5 py-0 rounded-none">
                      Step {step.id}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    {step.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-5 space-y-8">
          <div className="sticky top-8 space-y-8">
            <Card className="border-none shadow-xl rounded-[2.5rem] bg-slate-900 text-white overflow-hidden">
              <CardHeader className="p-6 pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-2">
                  <Shield size={14} /> The Protective Mechanism
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-sm font-medium leading-relaxed text-slate-300 italic">
                    "A Heart Wall is a subconscious barrier made of trapped emotional energy, designed to protect the heart from further injury. While it serves a purpose in crisis, it eventually leads to isolation and numbness."
                  </p>
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Common Materials</p>
                  <div className="flex flex-wrap gap-2">
                    {["Granite", "Steel", "Wood", "Glass", "Energy Field", "Plastic"].map(m => (
                      <Badge key={m} className="bg-white/10 text-white border-none text-[8px] font-black uppercase">{m}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="p-6 bg-rose-50 rounded-[2rem] border-2 border-rose-100 flex items-start gap-6">
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-rose-600 shadow-sm shrink-0">
                <Sparkles size={24} />
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black text-rose-600 uppercase tracking-[0.3em]">Clinical Note</p>
                <p className="text-sm text-slate-600 font-medium leading-relaxed italic">
                  "The material and size are symbolic representations. Don't get stuck on the logic—trust the first thing the client's subconscious provides. The release is in the acknowledgement."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeartWallProtocol;