"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { PrimitiveReflex } from "@/data/primitive-reflex-data";
import { 
  Baby, 
  Zap, 
  Info, 
  ShieldAlert, 
  PlayCircle,
  Sparkles,
  CheckCircle2,
  Workflow,
  ListChecks,
  ArrowRight,
  Eye,
  Move,
  Clock,
  Activity
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PrimitiveReflexModalProps {
  reflex: PrimitiveReflex | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PrimitiveReflexModal = ({ 
  reflex, 
  open, 
  onOpenChange 
}: PrimitiveReflexModalProps) => {
  if (!reflex) return null;

  const SectionHeader = ({ icon: Icon, title, color }: { icon: any, title: string, color: string }) => (
    <h4 className={cn("text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 mb-3", color)}>
      <Icon size={14} /> {title}
    </h4>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[750px] max-h-[95vh] rounded-[2.5rem] overflow-hidden p-0 border-none shadow-2xl">
        <DialogHeader className="p-0">
          <div className={cn(
            "p-8 text-white transition-colors relative",
            reflex.category === 'Foundational' ? "bg-indigo-600" :
            reflex.category === 'Postural' ? "bg-emerald-600" :
            "bg-amber-600"
          )}>
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-xl">
                <Baby size={32} />
              </div>
              <div className="space-y-1">
                <div className="flex gap-2 mb-1">
                  <Badge className="bg-white/20 text-white border-none font-black text-[10px] uppercase tracking-widest">
                    {reflex.category} Reflex
                  </Badge>
                  {reflex.hierarchyLevel && (
                    <Badge variant="outline" className="border-white/40 text-white font-black text-[10px] uppercase tracking-widest">
                      Level {reflex.hierarchyLevel}
                    </Badge>
                  )}
                </div>
                <DialogTitle className="text-3xl font-black tracking-tight">{reflex.name}</DialogTitle>
                <DialogDescription className="text-white/80 font-medium">
                  Foundational Neurological Pattern
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="p-8 space-y-8 overflow-y-auto max-h-[calc(95vh-160px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100 space-y-3">
              <SectionHeader icon={ListChecks} title="How to Assess" color="text-indigo-600" />
              <p className="text-sm font-bold text-indigo-900 leading-relaxed">
                {reflex.howTo}
              </p>
            </div>

            <div className="p-6 bg-rose-50 rounded-2xl border border-rose-100 space-y-3">
              <SectionHeader icon={ShieldAlert} title="Inhibition Pattern" color="text-rose-600" />
              <p className="text-sm font-bold text-rose-900 leading-relaxed">
                {reflex.inhibitionPattern}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="space-y-4">
              <SectionHeader icon={Activity} title="Clinical Signs" color="text-slate-600" />
              <div className="flex flex-wrap gap-2">
                {reflex.clinicalSigns?.map(sign => (
                  <Badge key={sign} variant="outline" className="bg-slate-50 border-slate-200 text-slate-700 font-bold text-[10px] uppercase tracking-widest px-3 py-1">
                    {sign}
                  </Badge>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <SectionHeader icon={Clock} title="Developmental Window" color="text-slate-600" />
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-sm font-bold text-slate-900">{reflex.developmentalWindow}</p>
                <p className="text-[10px] text-slate-500 mt-1">Should be inhibited by the nervous system during this period.</p>
              </div>
            </section>
          </div>

          {reflex.name === 'Rooting Reflex' && (
            <div className="p-6 bg-amber-50 rounded-3xl border-2 border-amber-200 space-y-4">
              <SectionHeader icon={Zap} title="Correction Spotlight: Vestibular/Ocular" color="text-amber-600" />
              <div className="space-y-3">
                <p className="text-xs font-bold text-amber-900 leading-relaxed">
                  Example correction from demonstration:
                </p>
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl border border-amber-200">
                    <Eye size={16} className="text-amber-600" />
                    <p className="text-[10px] font-bold text-amber-900">Eyes UP then DOWN while holding reflex point.</p>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl border border-amber-200">
                    <Move size={16} className="text-amber-600" />
                    <p className="text-[10px] font-bold text-amber-900">Tilt head back + Nasal breathing.</p>
                  </div>
                </div>
                <p className="text-[10px] text-amber-700 italic">"Once you find the actual functional cause, it turns off straight away."</p>
              </div>
            </div>
          )}

          {reflex.fractalPartners && reflex.fractalPartners.length > 0 && (
            <section className="p-6 bg-indigo-900 text-white rounded-2xl shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><Workflow size={80} /></div>
              <SectionHeader icon={Workflow} title="Fractal Partners" color="text-indigo-300" />
              <div className="flex flex-wrap gap-2 relative z-10">
                {reflex.fractalPartners.map(partner => (
                  <Badge key={partner} className="bg-white/10 text-white border-white/20 font-black text-[10px] uppercase tracking-widest px-3 py-1">
                    {partner}
                  </Badge>
                ))}
              </div>
              <p className="text-[10px] text-indigo-200 mt-4 italic relative z-10">
                "If you correct the highest level reflex, you can knock out 3-4 others in one go because they are cascaded together."
              </p>
            </section>
          )}

          <section className="space-y-2">
            <SectionHeader icon={Info} title="Clinical Context" color="text-slate-400" />
            <p className="text-sm text-slate-600 font-medium leading-relaxed">
              {reflex.description}
            </p>
          </section>

          {reflex.pearl && (
            <section>
              <div className="p-6 bg-slate-900 text-white rounded-[2rem] shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><Sparkles size={60} /></div>
                <SectionHeader icon={Sparkles} title="Clinical Pearl" color="text-amber-400" />
                <p className="text-sm font-medium leading-relaxed relative z-10 italic">
                  "{reflex.pearl}"
                </p>
              </div>
            </section>
          )}

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
              <CheckCircle2 size={14} /> Integration Goal: Clear IM response
            </div>
            <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest text-indigo-600" onClick={() => onOpenChange(false)}>
              Close Reference
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PrimitiveReflexModal;