"use client";

import React, { useMemo } from 'react';
import BoltTestSection from '../BoltTestSection';
import CoherenceAssessment from '../CoherenceAssessment';
import CogsAssessment from '../CogsAssessment';
import NeurologicalAssessments from '../NeurologicalAssessments';
import LymphaticAssessment from '../LymphaticAssessment';
import EditableField from '@/components/shared/EditableField';
import { AppointmentWithClient } from '@/types/crm';
import { Target, ClipboardList, Activity, ShieldAlert, Compass, AlertTriangle } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { cn } from "@/lib/utils";

interface BaselineTabProps {
  appointment: AppointmentWithClient;
  onUpdate: () => void;
  saveField: (field: string, value: any) => Promise<void>;
}

const BaselineTab = ({ appointment, onUpdate, saveField }: BaselineTabProps) => {
  const lastSessionDate = appointment.clients?.born; // Placeholder for actual last session date logic
  const daysSinceLast = lastSessionDate ? differenceInDays(new Date(), new Date(lastSessionDate)) : 0;
  const isStale = daysSinceLast > 30;

  return (
    <div className="space-y-12">
      {isStale && (
        <div className="bg-destructive/10 border border-destructive p-6 flex items-center gap-6">
          <AlertTriangle className="h-6 w-6 text-destructive" />
          <p className="text-sm text-destructive font-bold uppercase tracking-tight">
            CLINICAL CONSIDERATION: It has been over {Math.floor(daysSinceLast / 30)} months since the last session. Baseline findings and CO2 tolerance may have shifted significantly.
          </p>
        </div>
      )}

      {/* 1. INTAKE SECTION: GOAL & CONCERN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-border">
        <div className={cn(
          "p-8 border-r border-border last:border-r-0 transition-colors",
          !appointment.goal ? "bg-primary/5" : "bg-background"
        )}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3 text-primary">
              <Compass size={18} />
              <h3 className="text-[10px] font-bold uppercase tracking-widest">Session Goal</h3>
            </div>
            {!appointment.goal && (
              <span className="bg-primary text-primary-foreground px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest">
                Required
              </span>
            )}
          </div>
          <EditableField 
            key={`goal-${appointment.id}`} 
            field="goal" 
            label={!appointment.goal ? "Required before proceeding" : "What is the primary objective?"} 
            value={appointment.goal} 
            multiline
            placeholder="e.g. Resolve chronic neck pain, improve sleep quality..." 
            onSave={saveField} 
            className="border-none p-0 shadow-none bg-transparent text-lg font-medium uppercase tracking-tight" 
          />
        </div>

        <div className={cn(
          "p-8 border-r border-border last:border-r-0 transition-colors",
          !appointment.issue ? "bg-destructive/5" : "bg-background"
        )}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3 text-primary">
              <ClipboardList size={18} />
              <h3 className="text-[10px] font-bold uppercase tracking-widest">Primary Concern</h3>
            </div>
            {!appointment.issue && (
              <span className="bg-destructive text-destructive-foreground px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest">
                Required
              </span>
            )}
          </div>
          <EditableField 
            key={`issue-${appointment.id}`} 
            field="issue" 
            label={!appointment.issue ? "Required before proceeding" : "Main Concern / Presenting Symptoms"} 
            value={appointment.issue} 
            multiline
            placeholder="Describe the current symptoms and history..." 
            onSave={saveField} 
            className="border-none p-0 shadow-none bg-transparent text-lg font-medium uppercase tracking-tight" 
          />
        </div>
      </div>

      {/* 2. BASELINE VITALS */}
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 border border-border flex items-center justify-center text-primary">
            <Activity size={20} />
          </div>
          <h2 className="text-2xl font-medium uppercase tracking-tight">Baseline Vitals</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-border">
          <div className="border-r border-border last:border-r-0">
            <BoltTestSection 
              appointmentId={appointment.id} 
              initialBoltScore={appointment.bolt_score} 
              onUpdate={onUpdate} 
            />
          </div>
          <div className="border-r border-border last:border-r-0">
            <CoherenceAssessment 
              appointmentId={appointment.id} 
              initialHeartRate={appointment.heart_rate} 
              initialBreathRate={appointment.breath_rate} 
              initialCoherenceScore={appointment.coherence_score} 
              onUpdate={onUpdate} 
            />
          </div>
        </div>
      </div>

      {/* 3. GLOBAL ASSESSMENTS */}
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 border border-border flex items-center justify-center text-primary">
            <ShieldAlert size={20} />
          </div>
          <h2 className="text-2xl font-medium uppercase tracking-tight">Global Assessments</h2>
        </div>

        <div className="space-y-0 border border-border">
          <div className="border-b border-border">
            <CogsAssessment 
              appointmentId={appointment.id} 
              initialSagittalNotes={appointment.sagittal_plane_notes} 
              initialFrontalNotes={appointment.frontal_plane_notes} 
              initialTransverseNotes={appointment.transverse_plane_notes} 
              onUpdate={onUpdate} 
            />
          </div>
          <div className="border-b border-border">
            <NeurologicalAssessments 
              appointmentId={appointment.id} 
              initialFakudaNotes={appointment.fakuda_notes} 
              initialRhombergsNotes={appointment.sharpened_rhombergs_notes} 
              initialFrontalLobeNotes={appointment.frontal_lobe_notes} 
              initialRightingReflexNotes={appointment.righting_reflex_notes}
              onUpdate={onUpdate} 
            />
          </div>
          <div className="border-b border-border last:border-b-0">
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
    </div>
  );
};

export default BaselineTab;