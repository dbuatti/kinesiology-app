"use client";

import React, { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, Move, Save, Loader2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { Textarea } from "@/components/ui/textarea";

interface CogsAssessmentProps {
  appointmentId: string;
  initialSagittalNotes: string | null | undefined;
  initialFrontalNotes: string | null | undefined;
  initialTransverseNotes: string | null | undefined;
  onUpdate: () => void;
}

const CogsAssessment = ({ 
  appointmentId, 
  initialSagittalNotes,
  initialFrontalNotes,
  initialTransverseNotes,
  onUpdate 
}: CogsAssessmentProps) => {
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  const [sagittalNotes, setSagittalNotes] = useState(initialSagittalNotes || '');
  const [frontalNotes, setFrontalNotes] = useState(initialFrontalNotes || '');
  const [transverseNotes, setTransverseNotes] = useState(initialTransverseNotes || '');

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ 
          sagittal_plane_notes: sagittalNotes || null,
          frontal_plane_notes: frontalNotes || null,
          transverse_plane_notes: transverseNotes || null,
        })
        .eq("id", appointmentId);

      if (error) throw error;
      showSuccess("ROM saved!");
      onUpdate();
    } catch (error: any) {
      showError("Failed to save.");
    } finally {
      setLoading(false);
    }
  };

  const hasSavedNotes = initialSagittalNotes || initialFrontalNotes || initialTransverseNotes;

  return (
    <div className="bg-white border border-slate-100 overflow-hidden transition-all">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className={cn(
            "h-10 flex items-center justify-between px-4 cursor-pointer transition-all",
            isOpen ? "bg-slate-900 text-white" : "hover:bg-slate-50",
            hasSavedNotes && !isOpen && "bg-purple-50"
          )}>
            <div className="flex items-center gap-3">
              <Move size={14} className={cn(isOpen ? "text-purple-400" : "text-primary")} />
              <span className="text-[11px] font-black uppercase tracking-widest">ROM (Cogs)</span>
            </div>
            <div className="flex items-center gap-3">
              {hasSavedNotes && (
                <span className="text-[9px] font-black uppercase tracking-widest text-purple-600">Recorded</span>
              )}
              <ChevronDown size={14} className={cn("transition-transform duration-300", isOpen && "rotate-180")} />
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-4 border-t border-slate-100 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Sagittal</label>
                <Textarea value={sagittalNotes} onChange={(e) => setSagittalNotes(e.target.value)} className="min-h-[60px] rounded-none text-xs" placeholder="Flex/Ext..." />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Frontal</label>
                <Textarea value={frontalNotes} onChange={(e) => setFrontalNotes(e.target.value)} className="min-h-[60px] rounded-none text-xs" placeholder="Lateral..." />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Transverse</label>
                <Textarea value={transverseNotes} onChange={(e) => setTransverseNotes(e.target.value)} className="min-h-[60px] rounded-none text-xs" placeholder="Rotation..." />
              </div>
            </div>
            <Button onClick={handleSave} disabled={loading} className="w-full h-8 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest">
              {loading ? <Loader2 size={12} className="animate-spin" /> : "Save ROM"}
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default CogsAssessment;