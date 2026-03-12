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
  CheckCircle2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
      <DialogContent className="sm:max-w-[600px] rounded-[2.5rem] overflow-hidden p-0 border-none shadow-2xl">
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
                <Badge className="bg-white/20 text-white border-none font-black text-[10px] uppercase tracking-widest mb-1">
                  {reflex.category} Reflex
                </Badge>
                <DialogTitle className="text-3xl font-black tracking-tight">{reflex.name}</DialogTitle>
                <DialogDescription className="text-white/80 font-medium">
                  Foundational Neurological Pattern
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 gap-6">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
              <SectionHeader icon={PlayCircle} title="Stimulus (The Trigger)" color="text-indigo-600" />
              <p className="text-sm font-bold text-slate-900 leading-relaxed">
                {reflex.stimulus}
              </p>
            </div>

            <div className="p-6 bg-rose-50 rounded-2xl border border-rose-100 space-y-3">
              <SectionHeader icon={ShieldAlert} title="Inhibition Pattern" color="text-rose-600" />
              <p className="text-sm font-bold text-rose-900 leading-relaxed">
                {reflex.inhibitionPattern}
              </p>
            </div>
          </div>

          {reflex.description && (
            <section className="space-y-2">
              <SectionHeader icon={Info} title="Description" color="text-slate-400" />
              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                {reflex.description}
              </p>
            </section>
          )}

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

          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
              <CheckCircle2 size={14} /> Integration Goal: Clear IM response
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PrimitiveReflexModal;