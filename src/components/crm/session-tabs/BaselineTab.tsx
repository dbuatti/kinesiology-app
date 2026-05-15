"use client";

import React from 'react';
import BoltTestSection from '../BoltTestSection';
import CoherenceAssessment from '../CoherenceAssessment';
import CogsAssessment from '../CogsAssessment';
import NeurologicalAssessments from '../NeurologicalAssessments';
import LymphaticAssessment from '../LymphaticAssessment';
import EditableField from '@/components/shared/EditableField';
import { AppointmentWithClient } from '@/types/crm';
import { Target, ClipboardList, Activity, ShieldAlert, Compass, AlertTriangle } from 'lucide-react';
import { cn } from "@/lib/utils";

interface BaselineTabProps {
  appointment: AppointmentWithClient;
  onUpdate: () => void;
  saveField: (field: string, value: any) => Promise<void>;
}

const BaselineTab = ({ appointment, onUpdate, saveField }: BaselineTabProps) => {
  return (
    <div className="space-y-4">
      {/* 1. INTAKE SECTION: COMPACT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-secondary/30 rounded-none space-y-3">
          <div className="flex items-center gap-2">
            <Compass size={14} className="text-primary" />
            <h3 className="text-[11px] font-black uppercase tracking-widest">Session Goal</h3>
          </div>
          <EditableField 
            key={`goal-${appointment.id}`} 
            field="goal" 
            label="" 
            value={appointment.goal} 
            multiline
            placeholder="Primary objective..." 
            onSave={saveField} 
            className="border-none p-0 shadow-none bg-transparent text-sm font-bold italic" 
          />
        </div>

        <div className="p-4 bg-secondary/30 rounded-none space-y-3">
          <div className="flex items-center gap-2">
            <ClipboardList size={14} className="text-primary" />
            <h3 className="text-[11px] font-black uppercase tracking-widest">Primary Concern</h3>
          </div>
          <EditableField 
            key={`issue-${appointment.id}`} 
            field="issue" 
            label="" 
            value={appointment.issue} 
            multiline
            placeholder="Presenting symptoms..." 
            onSave={saveField} 
            className="border-none p-0 shadow-none bg-transparent text-sm font-bold italic" 
          />
        </div>
      </div>

      {/* 2. BASELINE VITALS: COMPACT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BoltTestSection 
          appointmentId={appointment.id} 
          initialBoltScore={appointment.bolt_score} 
          onUpdate={onUpdate} 
        />
        <CoherenceAssessment 
          appointmentId={appointment.id} 
          initialHeartRate={appointment.heart_rate} 
          initialBreathRate={appointment.breath_rate} 
          initialCoherenceScore={appointment.coherence_score} 
          onUpdate={onUpdate} 
        />
      </div>

      {/* 3. GLOBAL ASSESSMENTS: ACCORDION STYLE */}
      <div className="space-y-2">
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
  );
};

export default BaselineTab;