
import React, { useMemo } from 'react';
import BoltTestSection from '../BoltTestSection';
import CoherenceAssessment from '../CoherenceAssessment';
import CogsAssessment from '../CogsAssessment';
import NeurologicalAssessments from '../NeurologicalAssessments';
import LymphaticAssessment from '../LymphaticAssessment';
import EditableField from '@/components/shared/EditableField';
import { AppointmentWithClient } from '@/types/crm';
import { Target, ClipboardList, Activity, ShieldAlert, Compass, AlertTriangle, Info } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from "@/lib/utils";

interface BaselineTabProps {
  appointment: AppointmentWithClient;
  history?: any[];
  onUpdate: () => void;
  saveField: (field: string, value: any) => Promise<void>;
}

const BaselineTab = ({ appointment, history = [], onUpdate, saveField }: BaselineTabProps) => {
  const previousSession = history.length >= 2 ? history[1] : null;
  const lastSessionDate = previousSession?.date;
  const daysSinceLast = lastSessionDate ? differenceInDays(new Date(), new Date(lastSessionDate)) : 0;
  const isStale = daysSinceLast > 30;

  return (
    <div className="space-y-12">
      {isStale && (
        <Alert className="bg-muted border-border rounded-xl animate-in slide-in-from-top-2 duration-500">
          <AlertTriangle className="h-5 w-5 text-muted-foreground" />
          <AlertDescription className="text-sm text-foreground font-medium">
            It has been over {Math.floor(daysSinceLast / 30)} months since the last session. Baseline findings and CO2 tolerance may have shifted significantly.
          </AlertDescription>
        </Alert>
      )}

      {/* 1. INTAKE SECTION: GOAL & CONCERN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={cn(
          "rounded-xl p-6 transition-all duration-500",
          !appointment.goal ? "bg-muted border border-dashed border-border" : "bg-card border border-border"
        )}>
          <div className="flex items-center gap-3 mb-4">
            <Compass size={18} className="text-muted-foreground" />
            <h3 className="text-xs font-semibold text-muted-foreground">Session Goal</h3>
          </div>
          <EditableField 
            key={`goal-${appointment.id}`} 
            field="goal" 
            label="What is the primary objective?" 
            value={appointment.goal} 
            multiline
            placeholder="e.g. Resolve chronic neck pain, improve sleep quality..." 
            onSave={saveField} 
            className="border-none p-0 shadow-none bg-transparent" 
          />
        </div>

        <div className={cn(
          "rounded-xl p-6 transition-all duration-500",
          !appointment.issue ? "bg-muted border border-dashed border-border" : "bg-card border border-border"
        )}>
          <div className="flex items-center gap-3 mb-4">
            <ClipboardList size={18} className="text-muted-foreground" />
            <h3 className="text-xs font-semibold text-muted-foreground">Primary Concern</h3>
          </div>
          <EditableField 
            key={`issue-${appointment.id}`} 
            field="issue" 
            label="Main Concern / Presenting Symptoms" 
            value={appointment.issue} 
            multiline
            placeholder="Describe the current symptoms and history..." 
            onSave={saveField} 
            className="border-none p-0 shadow-none bg-transparent" 
          />
        </div>
      </div>

      {/* 2. BASELINE VITALS */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-3 border-b border-border">
          <Activity size={18} className="text-muted-foreground" />
          <h2 className="text-lg font-bold text-foreground tracking-tight">Baseline Vitals</h2>
        </div>
        
        <div className="space-y-4">
          <BoltTestSection 
            appointmentId={appointment.id} 
            initialBoltScore={appointment.bolt_score} 
            onUpdate={onUpdate}
            history={history}
          />
          <CoherenceAssessment 
            appointmentId={appointment.id} 
            initialHeartRate={appointment.heart_rate} 
            initialBreathRate={appointment.breath_rate} 
            initialCoherenceScore={appointment.coherence_score} 
            onUpdate={onUpdate} 
          />
        </div>
      </div>

      {/* 3. GLOBAL ASSESSMENTS */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-3 border-b border-border">
          <ShieldAlert size={18} className="text-muted-foreground" />
          <h2 className="text-lg font-bold text-foreground tracking-tight">Global Assessments</h2>
        </div>

        <div className="space-y-4">
          <CogsAssessment 
            appointmentId={appointment.id} 
            initialSagittalNotes={appointment.sagittal_plane_notes} 
            initialFrontalNotes={appointment.frontal_plane_notes} 
            initialTransverseNotes={appointment.transverse_plane_notes} 
            onUpdate={onUpdate} 
          />
          <NeurologicalAssessments 
            appointmentId={appointment.id} 
            initialFakudaNotes={appointment.fakuda_notes} 
            initialRhombergsNotes={appointment.sharpened_rhombergs_notes} 
            initialFrontalLobeNotes={appointment.frontal_lobe_notes} 
            initialRightingReflexNotes={appointment.righting_reflex_notes}
            onUpdate={onUpdate} 
          />
          <LymphaticAssessment
            appointmentId={appointment.id}
            initialSutureSide={appointment.lymphatic_suture_side}
            initialPriorityZone={appointment.lymphatic_priority_zone}
            initialNotes={appointment.lymphatic_notes}
            onSaveField={saveField}
          />
        </div>
      </div>
    </div>
  );
};

export default BaselineTab;