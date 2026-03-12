"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { List, Move, Zap, RefreshCw, Info } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { JOINT_ACTION_LIBRARY } from "@/data/joint-action-data";

interface JointActionTableModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const JointActionTableModal = ({ open, onOpenChange }: JointActionTableModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] rounded-[2.5rem] overflow-hidden p-0 border-none shadow-2xl">
        <DialogHeader className="p-8 bg-slate-900 text-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg">
              <List size={28} className="text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black">Joint Action Reference</DialogTitle>
              <DialogDescription className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">
                Geometry of Movement & Planes of Motion
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-8">
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-6 flex items-start gap-3">
            <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-900 font-medium leading-relaxed">
              <strong>Clinical Tip:</strong> To speed up localization, ask the body for the <strong>Plane of Motion</strong> (Sagittal, Frontal, or Transverse) before testing specific actions.
            </p>
          </div>

          <ScrollArea className="h-[50vh] rounded-2xl border border-slate-100 shadow-inner">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 sticky top-0 z-10">
                <tr>
                  <th className="p-4 text-left font-black text-slate-500 text-[10px] uppercase tracking-widest">Joint</th>
                  <th className="p-4 text-left font-black text-blue-500 text-[10px] uppercase tracking-widest flex items-center gap-1.5">
                    <Zap size={12} /> Sagittal
                  </th>
                  <th className="p-4 text-left font-black text-emerald-500 text-[10px] uppercase tracking-widest">
                    <Move size={12} className="inline mr-1.5" /> Frontal
                  </th>
                  <th className="p-4 text-left font-black text-orange-500 text-[10px] uppercase tracking-widest">
                    <RefreshCw size={12} className="inline mr-1.5" /> Transverse
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {JOINT_ACTION_LIBRARY.map((joint, i) => (
                  <tr key={i} className="border-t border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-black text-slate-900">{joint.name}</td>
                    <td className="p-4 text-slate-600 font-medium">
                      {joint.actions.Sagittal.map(a => a.label).join(', ')}
                    </td>
                    <td className="p-4 text-slate-600 font-medium">
                      {joint.actions.Frontal.map(a => a.label).join(', ')}
                    </td>
                    <td className="p-4 text-slate-600 font-medium">
                      {joint.actions.Transverse.map(a => a.label).join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JointActionTableModal;