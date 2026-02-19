"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getMuscleInfo } from "@/data/muscle-info-data";
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
  RefreshCw
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MuscleInfoModalProps {
  muscleName: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MuscleInfoModal = ({ muscleName, open, onOpenChange }: MuscleInfoModalProps) => {
  if (!muscleName) return null;
  
  const info = getMuscleInfo(muscleName);

  const SectionHeader = ({ icon: Icon, title, color }: { icon: any, title: string, color: string }) => (
    <h4 className={cn("text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 mb-3", color)}>
      <Icon size={14} /> {title}
    </h4>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] rounded-[2.5rem] overflow-hidden p-0 border-none shadow-2xl">
        <div className="bg-indigo-600 p-8 text-white">
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
                  <Badge className="bg-indigo-500 text-white border-none font-bold text-[10px] uppercase tracking-widest">
                    Myotome: {info.myotome}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-10 max-h-[70vh] overflow-y-auto">
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