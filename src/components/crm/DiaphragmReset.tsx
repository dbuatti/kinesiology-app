"use client";

import React, { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, Wind, RotateCcw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { Textarea } from "@/components/ui/textarea";

interface DiaphragmResetProps {
  appointmentId: string;
  initialNotes: string | null | undefined;
  onSaveField: (field: string, value: string | null) => Promise<void>;
  onUpdate: () => void;
}

const DiaphragmReset = ({ 
  appointmentId, 
  initialNotes, 
  onSaveField,
  onUpdate
}: DiaphragmResetProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!confirm("Reset notes?")) return;
    setLoading(true);
    try {
      await supabase.from("appointments").update({ diaphragm_reset_notes: null }).eq("id", appointmentId);
      showSuccess("Reset complete.");
      onUpdate();
    } catch (error: any) {
      showError("Failed to reset.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-100 overflow-hidden transition-all">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className={cn(
            "h-10 flex items-center justify-between px-4 cursor-pointer transition-all",
            isOpen ? "bg-slate-900 text-white" : "hover:bg-slate-50",
            initialNotes && !isOpen && "bg-blue-50"
          )}>
            <div className="flex items-center gap-3">
              <Wind size={14} className={cn(isOpen ? "text-blue-400" : "text-primary")} />
              <span className="text-[11px] font-black uppercase tracking-widest">Diaphragm Reset</span>
            </div>
            <div className="flex items-center gap-3">
              {initialNotes && (
                <span className="text-[9px] font-black uppercase tracking-widest text-blue-600">Recorded</span>
              )}
              <ChevronDown size={14} className={cn("transition-transform duration-300", isOpen && "rotate-180")} />
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-4 border-t border-slate-100 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
            <Textarea 
              value={initialNotes || ""} 
              onChange={(e) => onSaveField('diaphragm_reset_notes', e.target.value)}
              className="min-h-[80px] rounded-none text-xs" 
              placeholder="Tender points, breath shift..." 
            />
            <Button variant="ghost" size="sm" onClick={handleReset} className="h-8 text-[9px] font-black uppercase tracking-widest text-rose-600">
              {loading ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} className="mr-1" />} Reset
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default DiaphragmReset;