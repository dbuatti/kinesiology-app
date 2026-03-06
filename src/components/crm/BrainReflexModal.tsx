"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { BrainReflexPoint } from "@/data/brain-reflex-data";
import { 
  Brain, 
  Zap, 
  Info, 
  Target, 
  Sparkles, 
  Activity, 
  Layers,
  MapPin,
  MousePointer2,
  ShieldAlert,
  Hand,
  PlayCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface BrainReflexModalProps {
  point: BrainReflexPoint | null;
  primaryUrl: string | null;
  secondaryUrl: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BrainReflexModal = ({ 
  point, 
  primaryUrl, 
  secondaryUrl, 
  open, 
  onOpenChange 
}: BrainReflexModalProps) => {
  if (!point) return null;

  const SectionHeader = ({ icon: Icon, title, color }: { icon: any, title: string, color: string }) => (
    <h4 className={cn("text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 mb-3", color)}>
      <Icon size={14} /> {title}
    </h4>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[95vh] rounded-[3rem] overflow-hidden p-0 border-none shadow-2xl">
        <DialogHeader className="p-0">
          <div className={cn(
            "p-10 text-white transition-colors relative",
            point.category === 'Cortical' ? "bg-purple-600" :
            point.category === 'Subcortical' ? "bg-indigo-600" :
            "bg-emerald-600"
          )}>
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-[2rem] flex items-center justify-center shadow-xl">
                {point.category === 'Cortical' ? <Brain size={40} /> : 
                 point.category === 'Subcortical' ? <Layers size={40} /> : 
                 <Zap size={40} />}
              </div>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Badge className="bg-white/20 text-white border-none font-black text-[10px] uppercase tracking-widest">
                    {point.category}
                  </Badge>
                  <Badge variant="outline" className="border-white/40 text-white font-black text-[10px] uppercase tracking-widest">
                    {point.lateralization} Logic
                  </Badge>
                </div>
                <DialogTitle className="text-4xl font-black tracking-tight">{point.name}</DialogTitle>
                <DialogDescription className="text-white/80 font-medium text-lg">
                  Neurological Assessment Protocol
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="p-10 space-y-12 overflow-y-auto max-h-[calc(95vh-180px)]">
          {/* Delineated Reflex vs Stimulus */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 bg-indigo-50 rounded-[2.5rem] border-2 border-indigo-100 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none"><Hand size={100} /></div>
              <SectionHeader icon={Hand} title="1. Reflex Point (Touch)" color="text-indigo-600" />
              <p className="text-xl font-black text-indigo-900 leading-tight relative z-10">
                {point.location}
              </p>
              <p className="text-xs text-indigo-700 font-medium leading-relaxed relative z-10">
                Touch or Therapy Localize (TL) this point while testing a clear indicator muscle.
              </p>
            </div>

            <div className="p-8 bg-amber-50 rounded-[2.5rem] border-2 border-amber-100 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none"><PlayCircle size={100} /></div>
              <SectionHeader icon={PlayCircle} title="2. Stimulus (Action)" color="text-amber-600" />
              <p className="text-xl font-black text-amber-900 leading-tight relative z-10">
                {point.stimulus || point.technique || "Standard challenge protocol."}
              </p>
              <p className="text-xs text-amber-700 font-medium leading-relaxed relative z-10">
                Perform this action to challenge the nerve pathway while holding the reflex point.
              </p>
            </div>
          </div>

          {/* Image Showcase */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <SectionHeader icon={Brain} title="Brain Region / Anatomy" color="text-slate-600" />
              <div className="aspect-video rounded-[2.5rem] bg-slate-50 border-2 border-slate-100 overflow-hidden flex items-center justify-center group relative shadow-inner">
                {primaryUrl ? (
                  <img src={primaryUrl} alt="Brain Anatomy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                ) : (
                  <div className="text-center p-8">
                    <Brain size={48} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Anatomy Image</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <SectionHeader icon={Target} title="Reflex Point Location" color="text-slate-600" />
              <div className="aspect-video rounded-[2.5rem] bg-slate-50 border-2 border-slate-100 overflow-hidden flex items-center justify-center group relative shadow-inner">
                {secondaryUrl ? (
                  <img src={secondaryUrl} alt="Reflex Point" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                ) : (
                  <div className="text-center p-8">
                    <Target size={48} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Reflex Image</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Clinical Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-8">
              {point.acupoint && (
                <section>
                  <SectionHeader icon={Zap} title="Associated Acupoint" color="text-amber-600" />
                  <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 flex items-center justify-between">
                    <span className="text-2xl font-black text-amber-900">{point.acupoint}</span>
                    <Badge className="bg-amber-600 text-white border-none font-black text-[10px] uppercase tracking-widest">TCM Link</Badge>
                  </div>
                </section>
              )}
              
              <section>
                <SectionHeader icon={ShieldAlert} title="Lateralization Logic" color="text-rose-500" />
                <div className="p-6 bg-rose-50 rounded-3xl border border-rose-100">
                  <p className="text-sm font-bold text-rose-900 leading-relaxed">
                    This region follows <span className="text-rose-600 font-black underline">{point.lateralization}</span> control. 
                    {point.lateralization === 'Contralateral' 
                      ? " Dysfunction on the left side of the body typically relates to the right hemisphere of this region."
                      : " Dysfunction on one side of the body typically relates to the same side of this brain region."}
                  </p>
                </div>
              </section>
            </div>

            <div className="space-y-8">
              <section>
                <SectionHeader icon={Sparkles} title="Clinical Pearl" color="text-purple-600" />
                <div className="p-8 bg-slate-900 text-white rounded-[2.5rem] shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-10"><Sparkles size={80} /></div>
                  <p className="text-lg font-medium leading-relaxed relative z-10 italic">
                    "{point.pearl || "This region plays a critical role in the neurological hierarchy of threat and movement."}"
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BrainReflexModal;