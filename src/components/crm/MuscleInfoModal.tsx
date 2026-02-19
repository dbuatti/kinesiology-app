"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { getMuscleInfo } from "@/data/muscle-info-data";
import { 
  Dumbbell, 
  Activity, 
  Zap, 
  Info, 
  MapPin, 
  Heart, 
  Apple,
  Move
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MuscleInfoModalProps {
  muscleName: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MuscleInfoModal = ({ muscleName, open, onOpenChange }: MuscleInfoModalProps) => {
  if (!muscleName) return null;
  
  const info = getMuscleInfo(muscleName);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] rounded-[2.5rem] overflow-hidden p-0 border-none shadow-2xl">
        <div className="bg-indigo-600 p-8 text-white">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg">
              <Dumbbell size={32} />
            </div>
            <div>
              <DialogTitle className="text-3xl font-black tracking-tight">{info.name}</DialogTitle>
              <div className="flex gap-2 mt-2">
                <Badge className="bg-white/20 text-white border-none font-bold text-[10px] uppercase tracking-widest">
                  {info.meridian}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                <Heart size={10} /> Associated Organ
              </p>
              <p className="text-lg font-black text-indigo-900">{info.organ}</p>
            </div>
            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
              <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                <Activity size={10} /> Meridian
              </p>
              <p className="text-lg font-black text-rose-900">{info.meridian}</p>
            </div>
          </div>

          <section className="space-y-3">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Move size={14} className="text-indigo-500" /> Testing Position
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl border border-slate-100">
              {info.testingPosition}
            </p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="space-y-3">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Zap size={14} className="text-amber-500" /> Neurolymphatic
              </h4>
              <p className="text-xs text-slate-600 font-bold leading-relaxed">
                {info.neurolymphatic}
              </p>
            </section>
            <section className="space-y-3">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Zap size={14} className="text-blue-500" /> Neurovascular
              </h4>
              <p className="text-xs text-slate-600 font-bold leading-relaxed">
                {info.neurovascular}
              </p>
            </section>
          </div>

          {info.nutrition && (
            <section className="space-y-3 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Apple size={14} className="text-emerald-500" /> Nutritional Support
              </h4>
              <p className="text-sm text-emerald-700 font-black">
                {info.nutrition}
              </p>
            </section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MuscleInfoModal;