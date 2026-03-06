"use client";

import React, { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { getMuscleInfo } from "@/data/muscle-info-data";
import { getChannelByName } from "@/data/tcm-channel-data";
import { VAGUS_ASSOCIATIONS } from "@/data/vagus-data";
import { 
  Brain, 
  Zap, 
  Activity, 
  Heart, 
  RefreshCw, 
  ArrowRight, 
  AlertCircle,
  Lightbulb,
  ShieldAlert,
  Layers
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { MuscleStatus } from "@/data/muscle-data";

interface ClinicalReasoningModalProps {
  muscleName: string | null;
  status: MuscleStatus['value'] | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ClinicalReasoningModal = ({ muscleName, status, open, onOpenChange }: ClinicalReasoningModalProps) => {
  const info = useMemo(() => muscleName ? getMuscleInfo(muscleName) : null, [muscleName]);
  
  const lovettPartner = useMemo(() => {
    if (!muscleName) return null;
    const association = VAGUS_ASSOCIATIONS.find(a => a.muscle.toLowerCase() === muscleName.toLowerCase());
    if (!association) return null;
    const partnerAssoc = VAGUS_ASSOCIATIONS.find(a => a.spinalSegment === association.reciprocatingSegment);
    return {
      segment: association.spinalSegment,
      partnerSegment: association.reciprocatingSegment,
      partnerMuscle: partnerAssoc?.muscle || "Unknown",
    };
  }, [muscleName]);

  if (!muscleName || !status || !info) return null;

  const getReasoningSteps = () => {
    const steps = [];
    
    if (status === 'Inhibition') {
      steps.push({
        title: "Meridian Sedation",
        desc: `The ${info.meridian} meridian may be over-active. Check sedation points or the 'Mother' element in the Sheng cycle.`,
        icon: Layers,
        color: "text-blue-600 bg-blue-50"
      });
      steps.push({
        title: "Neurolymphatic Clearance",
        desc: `Check the specific NL points for ${muscleName}. Stagnation here often causes immediate inhibition.`,
        icon: Activity,
        color: "text-emerald-600 bg-emerald-50"
      });
    } else if (status === 'Hypertonic') {
      steps.push({
        title: "Meridian Tonification",
        desc: `The ${info.meridian} meridian may be deficient. Check tonification points or the 'Grandmother' in the Ko cycle.`,
        icon: Zap,
        color: "text-amber-600 bg-amber-50"
      });
      steps.push({
        title: "Neurovascular Hold",
        desc: `Hold the NV points (usually on the cranium) to restore blood flow and calm the hypertonic response.`,
        icon: Heart,
        color: "text-rose-600 bg-rose-50"
      });
    } else if (status === 'Switching') {
      steps.push({
        title: "Neurological Centering",
        desc: "Systemic confusion. Check K27 (Switching), Central/Governing meridians, and Hydration immediately.",
        icon: RefreshCw,
        color: "text-purple-600 bg-purple-50"
      });
    }

    if (lovettPartner) {
      steps.push({
        title: "Lovett-Brother Reciprocation",
        desc: `Check ${lovettPartner.partnerMuscle} (${lovettPartner.partnerSegment}). Spinal tension at one end often inhibits the other.`,
        icon: Brain,
        color: "text-indigo-600 bg-indigo-50"
      });
    }

    return steps;
  };

  const reasoningSteps = getReasoningSteps();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
        <div className="p-8 bg-slate-900 text-white">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg">
              <Lightbulb size={28} className="text-amber-400" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black">Clinical Reasoning</DialogTitle>
              <DialogDescription className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">
                Diagnostic Assistant for {muscleName}
              </DialogDescription>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
            <Badge className={cn(
              "border-none font-black text-[10px] uppercase tracking-widest px-3 py-1",
              status === 'Inhibition' ? "bg-red-500" : status === 'Hypertonic' ? "bg-amber-500" : "bg-purple-500"
            )}>
              {status}
            </Badge>
            <p className="text-sm font-medium text-slate-300">
              Systemic response detected. Follow the hierarchy below to identify the priority correction.
            </p>
          </div>
        </div>

        <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
          <div className="space-y-4">
            {reasoningSteps.map((step, i) => (
              <div key={i} className="flex gap-5 p-5 rounded-2xl border-2 border-slate-50 hover:border-indigo-100 transition-all group">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform", step.color)}>
                  <step.icon size={24} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-slate-900 text-sm uppercase tracking-tight">{step.title}</h4>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 bg-amber-50 rounded-[2rem] border-2 border-amber-100">
            <div className="flex items-center gap-3 mb-3">
              <ShieldAlert size={20} className="text-amber-600" />
              <h4 className="font-black text-amber-900 text-xs uppercase tracking-widest">Practitioner Note</h4>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed italic font-medium">
              "If multiple muscles in the {info.meridian || 'same'} meridian are {status.toLowerCase()}, prioritize the Meridian balance first. If this is the only dysfunctional muscle, look for local mechanical or reflex issues."
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClinicalReasoningModal;