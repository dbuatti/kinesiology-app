"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { 
  Compass, 
  ShieldCheck, 
  List, 
  Zap, 
  ClipboardCheck, 
  ChevronDown, 
  ChevronUp,
  Activity,
  Brain,
  Heart
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface DocumentSidebarProps {
  activeSection: string;
  scrollTo: (id: string) => void;
  openGuides: Record<string, boolean>;
  toggleGuide: (title: string) => void;
}

export const OUTLINE_ITEMS = [
  { id: "p-sec", label: "P — Preliminary", icon: Compass },
  { id: "e-sec", label: "E — Ease System", icon: ShieldCheck },
  { id: "a-sec", label: "A — Align Hierarchy", icon: List },
  { id: "c-sec", label: "C — Correct (Wizard)", icon: Zap },
  { id: "e2-sec", label: "E — Embed (Homework)", icon: ClipboardCheck },
];

export const CORRECTIONS_GUIDE = [
  {
    title: "T1 Sympathetic Reset",
    icon: Zap,
    color: "text-amber-600 bg-amber-50",
    steps: [
      "Palpate bilateral anterior first rib (T1) to find restricted/tender side.",
      "Test contralateral Psoas muscle (should be inhibited).",
      "Move ipsilateral shoulder into external rotation.",
      "Hold 45-90s until tenderness dissolves. Re-assess Psoas."
    ]
  },
  {
    title: "Diaphragm Reset",
    icon: Activity,
    color: "text-blue-600 bg-blue-50",
    steps: [
      "Challenge tender points either side of sternum.",
      "Palpate neck at C4 level (usually opposite to tender point).",
      "Move ribcage superiorly towards neck. Hold 45-90s.",
      "Release very slowly. Observe for deep sigh or yawn."
    ]
  },
  {
    title: "Vagus Nerve Process",
    icon: Brain,
    color: "text-purple-600 bg-purple-50",
    steps: [
      "Hold Occiput-Atlas or Auricular reflex point.",
      "Challenge Organ/Gland + Polarity + Spinal Match.",
      "Apply Medulla Breathing (Blocked Inhale/Forced Exhale) for 30s.",
      "Re-test vagal function and indicator muscle."
    ]
  },
  {
    title: "Harmonic Rocking",
    icon: Heart,
    color: "text-rose-600 bg-rose-50",
    steps: [
      "Place one hand on belly button, other on Kidney 27 points.",
      "Rock gently for 3 minutes to down-regulate the SNS.",
      "Observe for parasympathetic shift (sigh, yawn, gurgle)."
    ]
  }
];

const DocumentSidebar = ({ activeSection, scrollTo, openGuides, toggleGuide }: DocumentSidebarProps) => {
  return (
    <aside className="w-80 shrink-0 sticky top-20 max-h-[calc(100vh-240px)] overflow-y-auto p-6 bg-slate-50 border border-slate-200 rounded-[2rem] space-y-8 print:hidden custom-scrollbar">
      {/* Document Outline */}
      <div className="space-y-3">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-1">Document Outline</p>
        <div className="space-y-1">
          {OUTLINE_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold rounded-xl transition-all text-left border-l-2",
                  isActive 
                    ? "bg-indigo-50 border-indigo-600 text-indigo-600 font-black" 
                    : "border-transparent text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/30"
                )}
              >
                <item.icon size={14} className={isActive ? "text-indigo-600" : "text-slate-400"} />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-px bg-slate-200" />

      {/* Corrections Guide */}
      <div className="space-y-4">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-1">Corrections Guide</p>
        <div className="space-y-3">
          {CORRECTIONS_GUIDE.map((guide) => {
            const isOpen = !!openGuides[guide.title];
            return (
              <Collapsible key={guide.title} open={isOpen} onOpenChange={() => toggleGuide(guide.title)}>
                <CollapsibleTrigger asChild>
                  <button className="w-full flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 transition-all text-left">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", guide.color)}>
                        <guide.icon size={14} />
                      </div>
                      <span className="text-xs font-bold text-slate-800 truncate">{guide.title}</span>
                    </div>
                    {isOpen ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2 pl-2 pr-1 animate-in slide-in-from-top-1 duration-200">
                  <div className="p-3 bg-white border border-slate-100 rounded-xl space-y-2">
                    {guide.steps.map((step, idx) => (
                      <div key={idx} className="flex gap-2 items-start text-[10px] leading-relaxed text-slate-600">
                        <span className="font-black text-indigo-600 shrink-0">{idx + 1}.</span>
                        <p className="font-medium">{step}</p>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </div>
    </aside>
  );
};

export default DocumentSidebar;