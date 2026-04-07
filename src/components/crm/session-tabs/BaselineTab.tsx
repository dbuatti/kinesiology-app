"use client";

import React from 'react';
import BoltTestSection from '../BoltTestSection';
import CoherenceAssessment from '../CoherenceAssessment';
import CogsAssessment from '../CogsAssessment';
import NeurologicalAssessments from '../NeurologicalAssessments';
import LymphaticAssessment from '../LymphaticAssessment';
import EditableField from '@/components/shared/EditableField';
import { AppointmentWithClient } from '@/types/crm';
import { Target, ClipboardList } from 'lucide-react';

interface BaselineTabProps {
  appointment: AppointmentWithClient;
  onUpdate: () => void;
  saveField: (field: string, value: any) => Promise<void>;
}

const BaselineTab = ({ appointment, onUpdate, saveField }: BaselineTabProps) => {
  return (
    <div className="space-y-8">
      {/* Intake Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-2">
            <Target size={14} className="text-indigo-500" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Session Goal</span>
          </div>
          <EditableField 
            key={`goal-${appointment.id}`} 
            field="goal" 
            label="What is the primary goal?" 
            value={appointment.goal} 
            placeholder="e.g. Reduce neck pain, improve sleep..." 
            onSave={saveField} 
            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm" 
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-2">
            <ClipboardList size={14} className="text-rose-500" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Primary Concern</span>
          </div>
          <EditableField 
            key={`issue-${appointment.id}`} 
            field="issue" 
            label="Main Concern / Issue" 
            value={appointment.issue} 
            placeholder="Describe the current symptoms..." 
            onSave={saveField} 
            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm" 
          />
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-3 px-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Baseline Assessments</span>
          <div className="flex-1 h-px bg-slate-100" />
        </div>
        
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