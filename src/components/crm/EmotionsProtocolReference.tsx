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
  Info,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

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
    desc: "Find the organ acting as a surrogate for the charge. Challenge the following pairs:",
    icon: Activity,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    details: [
      { label: "Wood", items: "Liver / Gallbladder" },
      { label: "Fire", items: "Heart / Small Intestine" },
      { label: "Earth", items: "Spleen / Stomach" },
      { label: "Metal", items: "Lung / Large Intestine" },
      { label: "Water", items: "Kidney / Bladder" }
    ]
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
    title: "Eye Position (NLP Logic)", 
    desc: "Identify the sensory access point for the stress:",
    icon: Eye,
    color: "text-cyan-600",
    bg: "bg-cyan-50",
    details: [
      { label: "Up & Left", items: "Visual Memory", sub: "Seeing a scene from the past." },
      { label: "Horizontal Left", items: "Auditory Memory", sub: "Hearing sounds or words from the past." },
      { label: "Down & Left", items: "Internal Monologue", sub: "What you say to yourself (e.g. 'I am not good enough')." },
      { label: "Up & Right", items: "Visual Constructed", sub: "Predicting what you think you will see." },
      { label: "Horizontal Right", items: "Auditory Constructed", sub: "Predicting what you think you will hear." },
      { label: "Down & Right", items: "Kinesthetic / Felt Sense", sub: "Physical sensation or body association." }
    ]
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
    <div className="space-y-6 animate-in fade-in duration-500 max-w-3xl mx-auto">
      <div className="grid grid-cols-1 gap-4">
        {STEPS.map((step) => (
          <div 
            key={step.id} 
            className="p-6 rounded-[2rem] border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-start gap-6">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-black text-lg shadow-sm transition-transform group-hover:scale-110",
                step.bg, step.color
              )}>
                {step.id}
              </div>
              <div className="space-y-3 flex-1">
                <h4 className="font-black text-slate-900 text-lg uppercase tracking-tight group-hover:text-indigo-600 transition-colors">
                  {step.title}
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  {step.desc}
                </p>
                
                {step.details && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    {step.details.map((detail, idx) => (
                      <div key={idx} className="flex flex-col p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="bg-white border-slate-200 text-[8px] font-black uppercase tracking-widest px-1.5 py-0">
                            {detail.label}
                          </Badge>
                          <span className="text-[11px] font-bold text-slate-900">{detail.items}</span>
                        </div>
                        {detail.sub && (
                          <p className="text-[10px] text-slate-500 font-medium leading-tight italic">
                            {detail.sub}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-8 bg-slate-900 text-white rounded-[2.5rem] border border-slate-800 flex items-start gap-6 shadow-xl">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shrink-0">
          <Info size={24} />
        </div>
        <div className="space-y-2">
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Clinical Mastery Note</p>
          <p className="text-sm text-slate-300 font-medium leading-relaxed">
            The shift occurs when the client can distinguish between the 'me' (the observer) and the 'not-me' (the identity/emotion). 
            <strong> Always wait for a clear parasympathetic response:</strong> Yawning, Sighing, Swallowing, Gurgling, or a spontaneous Deep Breath before proceeding to the Positive Upload.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmotionsProtocolReference;