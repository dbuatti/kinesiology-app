"use client";

import React from 'react';
import BoltTestSection from '../BoltTestSection';
import CoherenceAssessment from '../CoherenceAssessment';
import CogsAssessment from '../CogsAssessment';
import NeurologicalAssessments from '../NeurologicalAssessments';
import LymphaticAssessment from '../LymphaticAssessment';
import EditableField from '@/components/shared/EditableField';
import { AppointmentWithClient } from '@/types/crm';
import { Target, ClipboardList, Activity, Brain, Wind, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BaselineTabProps {
  appointment: AppointmentWithClient;
  onUpdate: () => void;
  saveField: (field: string, value: any) => Promise<void>;
}

const BaselineTab = ({ appointment, onUpdate, saveField }: BaselineTabProps) => {
  return (
    <div className="space-y-10">
      {/* Intake Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Target size={16} />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Session Goal</span>
          </div>
          <EditableField 
            key={`goal-${appointment.id}`} 
            field="goal" 
            label="What is the primary goal?" 
            value={appointment.goal} 
            placeholder="e.g. Reduce neck pain, improve sleep..." 
            onSave={saveField} 
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm min-h-[100px]" 
          />
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <ClipboardList size={16} />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Primary Concern</span>
          </div>
          <EditableField 
            key={`issue-${appointment.id}`} 
            field="issue" 
            label="Main Concern / Issue" 
            value={appointment.issue} 
            placeholder="Describe the current symptoms..." 
            onSave={saveField} 
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm min-h-[100px]" 
          />
        </div>
      </div>

      {/* Assessments Grid */}
      <div className="space-y-6">
        <div className="flex items-center gap-4 px-2">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
            <Activity size={20} />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight">Baseline Assessments</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Establish the current neurological state</p>
          </div>
          <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800 ml-4" />
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="space-y-6">
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
          
          <div className="space-y-6">
            <CogsAssessment 
              appointmentId={appointment.id} 
              initialSagittalNotes={appointment.sagittal_plane_notes} 
              initialFrontalNotes={appointment.frontal_plane_notes} 
              initialTransverseNotes={appointment.transverse_plane_notes} 
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

        <div className="pt-4">
          <NeurologicalAssessments 
            appointmentId={appointment.id} 
            initialFakudaNotes={appointment.fakuda_notes} 
            initialRhombergsNotes={appointment.sharpened_rhombergs_notes} 
            initialFrontalLobeNotes={appointment.frontal_lobe_notes} 
            initialRightingReflexNotes={appointment.righting_reflex_notes}
            onUpdate={onUpdate} 
          />
        </div>
      </div>
    </div>
  );
};

export default BaselineTab;