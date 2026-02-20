"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getMuscleInfo } from "@/data/muscle-info-data";
import { getChannelByName } from "@/data/tcm-channel-data";
import { VAGUS_ASSOCIATIONS } from "@/data/vagus-data";
import { isMeridianPeakNow } from "@/utils/crm-utils";
import { 
  Dumbbell, 
  Activity, 
  Zap, 
  Info, 
  Heart, 
  Apple,
  Move,
  Brain,
  AlertCircle,
  Link as LinkIcon,
  RefreshCw,
  Clock,
  Layers,
  ArrowRightLeft
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MuscleInfoModalProps {
  muscleName: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MuscleInfoModal = ({ muscleName, open, onOpenChange }: MuscleInfoModalProps) => {
  const [currentTime, setCurrentTime] = useState(new Date().getHours());

  useEffect(() => {
    if (open) {
      setCurrentTime(new Date().getHours());
    }
  }, [open]);

  const info = useMemo(() => muscleName ? getMuscleInfo(muscleName) : null, [muscleName]);
  const channel = useMemo(() => info?.meridian ? getChannelByName(info.meridian) : undefined, [info]);

  // Find Lovett-Brother Partner
  const lovettPartner = useMemo(() => {
    if (!muscleName) return null;
    const association = VAGUS_ASSOCIATIONS.find(a => a.muscle.toLowerCase() === muscleName.toLowerCase());
    if (!association) return null;
    
    const partnerAssoc = VAGUS_ASSOCIATIONS.find(a => a.spinalSegment === association.reciprocatingSegment);
    return {
      segment: association.spinalSegment,
      partnerSegment: association.reciprocatingSegment,
      partnerMuscle: partnerAssoc?.muscle || "Unknown",
      partnerOrgan: partnerAssoc?.organ || "Unknown"
    };
  }, [muscleName]);

  if (!muscleName || !info) return null;

  const isPeak = channel ? isMeridianPeakNow(channel.peakTime, currentTime) : false;

  const SectionHeader = ({ icon: Icon, title, color }: { icon: any, title: string, color: string }) => (
    <h4 className={cn("text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 mb-3", color)}>
      <Icon size={14} /> {title}
    </h4>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[750px] rounded-[2.5rem] overflow-hidden p-0 border-none shadow-2xl">
        <div className={cn("p-8 text-white transition-colors relative", channel ? channel.color.split(' ')[0] : "bg-indigo-600")}>
          {isPeak && (
            <div className="absolute top-6 right-6 animate-pulse">
              <Badge className="bg-white text-slate-900 border-none font-black text-[8px] uppercase tracking-widest px-2 py-0.5">
                <Zap size={10} className="mr-1 fill-amber-400 text-amber-400" /> Peak Now
              </Badge>
            </div>
          )}
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg">
              <Dumbbell size={32} />
            </div>
            <div>
              <DialogTitle className="text-3xl font-black tracking-tight">{info.name}</DialogTitle>
              <div className="flex gap-2 mt-2">
                <Badge className="bg-white/20 text-white border-none font-bold text-[10px] uppercase tracking-widest">
                  {info.meridian || 'General'} Meridian
                </Badge>
                {info.myotome && (
                  <Badge className="bg-white/20 text-white border-none font-bold text-[10px] uppercase tracking-widest">
                    Myotome: {info.myotome}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-10 max-h-[70vh] overflow-y-auto">
          {/* Lovett-Brother Partner */}
          {lovettPartner && (
            <section className="animate-in fade-in slide-in-from-top-2 duration-500">
              <SectionHeader icon={ArrowRightLeft} title="Spinal / Lovett-Brother Relationship" color="text-rose-600" />
              <div className="p-5 bg-rose-50 rounded-2xl border-2 border-rose-100 flex items-center justify-between gap-6">
                <div className="text-center flex-1">
                  <p className="text-[10px] font-black text-rose-400 uppercase mb-1">Current Segment</p>
                  <p className="text-2xl font-black text-rose-900">{lovettPartner.segment}</p>
                  <p className="text-[10px] font-bold text-rose-600">{muscleName}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-rose-200">
                  <RefreshCw size={20} className="text-rose-400" />
                </div>
                <div className="text-center flex-1">
                  <p className="text-[10px] font-black text-rose-400 uppercase mb-1">Lovett Partner</p>
                  <p className="text-2xl font-black text-rose-900">{lovettPartner.partnerSegment}</p>
                  <p className="text-[10px] font-bold text-rose-600">{lovettPartner.partnerMuscle}</p>
                </div>
              </div>
              <p className="text-[10px] text-rose-700 font-medium mt-2 italic text-center">
                Dysfunction in {muscleName} often reciprocates in the {lovettPartner.partnerMuscle}.
              </p>
            </section>
          )}

          {/* Meridian Insights */}
          {channel && (
            <section>
              <SectionHeader icon={Layers} title="Meridian Insights" color="text-indigo-600" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={cn(
                  "p-5 rounded-2xl border space-y-3 transition-all",
                  isPeak ? "bg-amber-50 border-amber-200 shadow-inner" : "bg-indigo-50 border-indigo-100"
                )}>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Peak Activity</p>
                    <Clock size={14} className={isPeak ? "text-amber-500" : "text-indigo-400"} />
                  </div>
                  <p className={cn("text-lg font-black", isPeak ? "text-amber-900" : "text-indigo-900")}>{channel.peakTime}</p>
                  <p className="text-xs text-indigo-700 leading-relaxed font-medium">
                    {channel.description}
                  </p>
                </div>
                <div className="p-5 bg-rose-50 rounded-2xl border border-rose-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Emotional Context</p>
                    <Heart size={14} className="text-rose-400" />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {channel.emotions.slice(0, 8).map(e => (
                      <Badge key={e} variant="outline" className="bg-white border-rose-100 text-rose-600 text-[9px] font-bold">
                        {e}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Clinical Indications */}
          {info.clinicalIndications && (
            <section>
              <SectionHeader icon={AlertCircle} title="Clinical Indications" color="text-rose-500" />
              <div className="p-5 bg-rose-50 rounded-2xl border border-rose-100">
                <p className="text-sm font-bold text-rose-900 leading-relaxed">
                  {info.clinicalIndications}
                </p>
              </div>
            </section>
          )}

          {/* Function & Kinetic Chain */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {info.function && (
              <section>
                <SectionHeader icon={Move} title="Primary Function" color="text-indigo-500" />
                <p className="text-sm text-slate-700 font-medium leading-relaxed">
                  {info.function}
                </p>
              </section>
            )}
            {info.kineticChain && (
              <section>
                <SectionHeader icon={LinkIcon} title="Kinetic Chain" color="text-blue-500" />
                <p className="text-sm text-slate-700 font-medium leading-relaxed">
                  {info.kineticChain}
                </p>
              </section>
            )}
          </div>

          {/* Neurological Section */}
          <section className="space-y-4">
            <SectionHeader icon={Brain} title="Neurological Control" color="text-purple-500" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {info.brainstemControl && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Brainstem Control</p>
                  <p className="text-sm font-bold text-slate-900">{info.brainstemControl}</p>
                </div>
              )}
              {info.nerveSupply && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Nerve Supply</p>
                  <p className="text-sm font-bold text-slate-900">{info.nerveSupply}</p>
                </div>
              )}
            </div>
          </section>

          {/* Structural Section */}
          {(info.ligamentsJoints || info.spinalFixation) && (
            <section className="space-y-4">
              <SectionHeader icon={Zap} title="Structural & Mechanical" color="text-amber-500" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {info.ligamentsJoints && (
                  <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
                    <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">Ligaments / Joints</p>
                    <p className="text-xs font-bold text-slate-800 leading-relaxed">{info.ligamentsJoints}</p>
                  </div>
                )}
                {info.spinalFixation && (
                  <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
                    <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">Spinal Fixation</p>
                    <p className="text-sm font-black text-slate-900">{info.spinalFixation}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Physiological & Nutritional */}
          <section className="space-y-4">
            <SectionHeader icon={Activity} title="Physiological & Nutritional" color="text-emerald-500" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {info.organGland && (
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Organ / Gland</p>
                  <p className="text-sm font-black text-emerald-900">{info.organGland}</p>
                </div>
              )}
              {info.nutrition && (
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <Apple size={10} /> Nutritional Support
                  </p>
                  <p className="text-xs font-bold text-emerald-900 leading-relaxed">{info.nutrition}</p>
                </div>
              )}
            </div>
          </section>

          {/* Testing & Reflexes */}
          <section className="space-y-4 pt-6 border-t border-slate-100">
            <SectionHeader icon={Info} title="Testing & Reflexes" color="text-slate-400" />
            <div className="space-y-4">
              {info.testingPosition && (
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Testing Position</p>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed italic">
                    {info.testingPosition}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {info.neurolymphatic && (
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Neurolymphatic</p>
                    <p className="text-xs text-slate-700 font-bold">{info.neurolymphatic}</p>
                  </div>
                )}
                {info.neurovascular && (
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Neurovascular</p>
                    <p className="text-xs text-slate-700 font-bold">{info.neurovascular}</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MuscleInfoModal;