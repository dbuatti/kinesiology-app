"use client";

import React from 'react';
import { 
  Heart, 
  ShieldCheck, 
  History, 
  Zap, 
  Eye, 
  Activity, 
  Sparkles,
  CheckCircle2,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { 
    id: 1, 
    title: "ESR Indicator Check", 
    desc: "Hold Frontal Lobe (ESR) points (GB14) to see if the system is ready for emotional work.",
    icon: Activity,
    color: "text-indigo-600",
    bg: "bg-indigo-50"
  },
  { 
    id: 2, 
    title: "Permission Check", 
    desc: "Always ask: 'Do we have permission to correct this?' If denied, perform Harmonic Rocking first.",
    icon: ShieldCheck,
    color: "text-blue-600",
    bg: "bg-blue-50"
  },
  { 
    id: 3, 
    title: "Timeline Selection", 
    desc: "Determine if the stress is Current (happening now) or Historic (past event).",
    icon: History,
    color: "text-purple-600",
    bg: "bg-purple-50"
  },
  { 
    id: 4, 
    title: "Timeline Regression", 
    desc: "If historic, narrow down the specific age and month of origin using the indicator muscle.",
    icon: Zap,
    color: "text-amber-600",
    bg: "bg-amber-50"
  },
  { 
    id: 5, 
    title: "Primary Emotion", 
    desc: "Identify the core feeling: Hurt (Fire), Worry (Earth), Sadness (Metal), Fear (Water), or Anger (Wood).",
    icon: Heart,
    color: "text-rose-600",
    bg: "bg-rose-50"
  },
  { 
    id: 6, 
    title: "Priority Organ", 
    desc: "Find the organ acting as a surrogate for the charge (e.g., Liver for Anger, Kidney for Fear).",
    icon: Activity,
    color: "text-emerald-600",
    bg: "bg-emerald-50"
  },
  { 
    id: 7, 
    title: "Energy Polarity", 
    desc: "Challenge for Energy IN (+) or Energy OUT (-). Usually OUT to release stress.",
    icon: Zap,
    color: "text-orange-600",
    bg: "bg-orange-50"
  },
  { 
    id: 8, 
    title: "Eye Position", 
    desc: "Identify the sensory access point (Visual, Auditory, or Kinesthetic) using NLP logic.",
    icon: Eye,
    color: "text-cyan-600",
    bg: "bg-cyan-50"
  },
  { 
    id: 9, 
    title: "Correction & Upload", 
    desc: "Hold ESR + Pulse Point + Eye Position. Replay stress until shift, then upload positive state.",
    icon: Sparkles,
    color: "text-indigo-600",
    bg: "bg-indigo-50"
  }
];

const EmotionsProtocolReference = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {STEPS.map((step) => (
          <div 
            key={step.id} 
            className="p-5 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-sm shadow-sm",
                step.bg, step.color
              )}>
                {step.id}
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-sm uppercase tracking-tight group-hover:text-indigo-600 transition-colors">
                  {step.title}
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  {step.desc}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
          <Info size={20} />
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clinical Note</p>
          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            The shift occurs when the client can distinguish between the 'me' (the observer) and the 'not-me' (the identity/emotion). Always wait for a clear parasympathetic response (sigh, yawn, or gurgle) before finishing.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmotionsProtocolReference;