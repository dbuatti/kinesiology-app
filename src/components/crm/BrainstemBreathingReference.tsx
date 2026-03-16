"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wind, Zap, Layers, Activity, Info, ShieldAlert, Eye, Volume2, ArrowDownCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const BRAINSTEM_BREATHING = [
  {
    region: "Midbrain",
    nerves: "CN III, IV",
    tone: "Flexors",
    description: "The top of the brainstem. Controls reflexive threat responses and convergence.",
    patterns: [
      { 
        name: "Breath Holds", 
        desc: "Hold breath after a normal exhalation. Stop at the first definite desire to breathe.",
        howTo: "Exhale normally, plug nose, and hold. This increases CO2 and reduces midbrain threat."
      },
      { 
        name: "Air Hunger", 
        desc: "Breathe 'light to right' (Oxygen Advantage style).",
        howTo: "Breathe so quietly and shallowly that you feel a slight, tolerable need for more air."
      },
      {
        name: "Convergence Drill",
        desc: "Combine breathing with eye movement.",
        howTo: "Perform air hunger while looking at the tip of the nose to maximize midbrain activation."
      }
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
    description: "The middle brainstem. Primary regulator of extensor tone and vestibular processing.",
    patterns: [
      { 
        name: "Biots Breathing", 
        desc: "Quick, shallow breaths with mouth open.",
        howTo: "Pant lightly like a dog, keeping the breath high in the chest and the mouth open."
      },
      { 
        name: "Deep Inhalation", 
        desc: "Full expansion of the ribcage.",
        howTo: "Focus on a 4-6 second inhale, expanding the ribs 360 degrees. Stimulates extensor tone."
      },
      { 
        name: "Slow Rhythmic", 
        desc: "4-6 breaths per minute.",
        howTo: "Breathe in for 5s, out for 5s. Calms the SNS via the pontine nuclei."
      }
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
    description: "The lower brainstem. Controls autonomic vitals (heart/breath) and flexor tone.",
    patterns: [
      { 
        name: "Forced Exhalation", 
        desc: "Active push of air out.",
        howTo: "Exhale through pursed lips, using abdominal muscles to push every last bit of air out."
      },
      { 
        name: "Blocked Inhalation", 
        desc: "Attempt to inhale against a closed airway.",
        howTo: "Plug nose and close mouth. Try to inhale sharply for 2-3 seconds. Creates a strong medullary signal."
      },
      {
        name: "Vocalizations",
        desc: "Humming or 'Aaah' sounds.",
        howTo: "Make a low-pitched hum during a long exhalation to stimulate the Vagus nerve (CN X)."
      }
    ],
    color: "bg-rose-600",
    light: "bg-rose-50",
    border: "border-rose-200",
    text: "text-rose-700"
  }
];

const BrainstemBreathingReference = () => {
  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="p-8 bg-slate-900 text-white rounded-[3rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10"><Wind size={150} /></div>
        <div className="relative z-10 space-y-4">
          <Badge className="bg-teal-500 text-white border-none font-black text-[10px] uppercase tracking-[0.3em] px-4 py-1">Neurological Input</Badge>
          <h3 className="text-3xl font-black flex items-center gap-3">
            <Wind size={32} className="text-teal-400" /> Brainstem Breathing Rehab
          </h3>
          <p className="text-slate-400 font-medium text-lg leading-relaxed max-w-3xl">
            Breathing is the most direct way to influence brainstem nuclei. Use these patterns to re-strengthen pathways after a correction or to shift systemic motor tone.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {BRAINSTEM_BREATHING.map((item) => (
          <Card key={item.region} className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden group hover:shadow-2xl transition-all duration-500">
            <div className={cn("p-8 text-white", item.color)}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-2xl font-black">{item.region}</h4>
                <Badge className="bg-white/20 text-white border-none font-black text-[10px] uppercase tracking-widest px-3 py-1">
                  {item.tone} Tone
                </Badge>
              </div>
              <p className="text-xs font-bold opacity-90 uppercase tracking-[0.2em] mb-4">{item.nerves}</p>
              <p className="text-xs font-medium leading-relaxed opacity-80">{item.description}</p>
            </div>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-6">
                {item.patterns.map((p) => (
                  <div key={p.name} className={cn("p-5 rounded-2xl border-2 transition-all group/item", item.light, item.border)}>
                    <div className="flex items-center justify-between mb-2">
                      <p className={cn("text-sm font-black uppercase tracking-tight", item.text)}>{p.name}</p>
                      <Info size={14} className={cn("opacity-40", item.text)} />
                    </div>
                    <p className="text-xs text-slate-700 font-bold mb-3 leading-relaxed">{p.desc}</p>
                    <div className="p-3 bg-white/60 rounded-xl border border-white/80">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">How to perform:</p>
                      <p className="text-[11px] text-slate-600 font-medium leading-relaxed">{p.howTo}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="border-none shadow-lg rounded-[2.5rem] bg-indigo-900 text-white overflow-hidden">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-xl font-black flex items-center gap-3">
              <ArrowDownCircle size={24} className="text-indigo-400" /> Tone Relationship Guide
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-0 space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <h5 className="font-black text-blue-400 text-xs uppercase tracking-widest mb-2">Flexor Dominance?</h5>
                <p className="text-sm text-slate-300">If client is slumped or "curled in," prioritize <strong>Pons (Extensor)</strong> breathing like Biots or Deep Inhalation.</p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <h5 className="font-black text-rose-400 text-xs uppercase tracking-widest mb-2">Extensor Dominance?</h5>
                <p className="text-sm text-slate-300">If client is rigid or "arched back," prioritize <strong>Medulla/Midbrain (Flexor)</strong> breathing like Forced Exhalation or Breath Holds.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="p-8 bg-blue-50 rounded-[2.5rem] border-2 border-blue-100 flex items-start gap-6">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xl shrink-0">
            <ShieldAlert size={32} />
          </div>
          <div className="space-y-2">
            <h4 className="text-xl font-black text-blue-900">Clinical Safety Note</h4>
            <p className="text-blue-800 font-medium leading-relaxed italic">
              "Nerves are like muscles—they can be overstimulated. If a client feels dizzy, agitated, or their heart rate spikes, stop the drill immediately. Always start with the 'Minimum Effective Dose' (usually 3-5 reps) and re-test the indicator muscle."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrainstemBreathingReference;