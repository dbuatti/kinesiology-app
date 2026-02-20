"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FlaskConical, Activity, Loader2, CheckCircle2 } from "lucide-react";
import BoltTimer from "./BoltTimer";
import CoherenceAssessment from "./CoherenceAssessment";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { format } from "date-fns";

interface QuickAssessmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
  type: 'bolt' | 'coherence';
  onComplete: () => void;
}

const QuickAssessmentModal = ({ 
  open, 
  onOpenChange, 
  clientId, 
  clientName,
  type,
  onComplete 
}: QuickAssessmentModalProps) => {
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveResult = async (data: any) => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const now = new Date();
      const typeLabel = type === 'bolt' ? 'BOLT' : 'Coherence';

      // Create a "Quick Assessment" appointment record automatically
      const { error } = await supabase
        .from('appointments')
        .insert({
          user_id: user.id,
          client_id: clientId,
          date: now.toISOString(),
          tag: "Quick Assessment",
          status: "Completed",
          name: `${typeLabel} Assessment - ${format(now, "MMM d")}`,
          ...data
        });

      if (error) throw error;

      showSuccess(`${typeLabel} result saved for ${clientName}`);
      onComplete();
      onOpenChange(false);
    } catch (err: any) {
      showError(err.message || "Failed to save assessment");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-[2rem]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${type === 'bolt' ? 'bg-indigo-600' : 'bg-rose-600'}`}>
              {type === 'bolt' ? <FlaskConical size={24} /> : <Activity size={24} />}
            </div>
            Quick {type === 'bolt' ? 'BOLT' : 'Coherence'} Test
          </DialogTitle>
          <DialogDescription className="font-medium">
            Performing assessment for <span className="text-slate-900 font-bold">{clientName}</span>. This will create a new record in the client's history.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {type === 'bolt' ? (
            <BoltTimer 
              initialScore={null} 
              onScoreRecorded={(score) => handleSaveResult({ bolt_score: score })}
              isSaving={isSaving}
            />
          ) : (
            <div className="space-y-4">
              <CoherenceAssessment 
                appointmentId="temp"
                initialHeartRate={null}
                initialBreathRate={null}
                initialCoherenceScore={null}
                onUpdate={() => {}}
                onSave={(data) => handleSaveResult(data)}
              />
              <p className="text-[10px] text-slate-400 text-center italic">
                Note: Use the "Save Result" button inside the tool to log the findings.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickAssessmentModal;