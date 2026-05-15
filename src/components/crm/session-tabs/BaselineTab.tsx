"use client";

import React from 'react';
import BoltTestSection from '../BoltTestSection';
import CoherenceAssessment from '../CoherenceAssessment';
import CogsAssessment from '../CogsAssessment';
import NeurologicalAssessments from '../NeurologicalAssessments';
import LymphaticAssessment from '../LymphaticAssessment';
import EditableField from '@/components/shared/EditableField';
import { AppointmentWithClient } from '@/types/crm';
import { Target, ClipboardList, Activity, ShieldAlert, Compass, Droplets, Brain } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface BaselineTabProps {
  appointment: AppointmentWithClient;
  onUpdate: () => void;
  saveField: (field: string, value: any) => Promise<void>;
}

const BaselineTab = ({ appointment, onUpdate, saveField }: BaselineTabProps) => {
  return (
    <div className="space-y-12">
      {/* 1. INTAKE SECTION: GOAL & CONCERN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
          <CardContent className="p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
                <Compass size={20} />
              </div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Session Goal</h3>
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
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
          <CardContent className="p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-sm">
                <ClipboardList size={20} />
              </div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Primary Concern</h3>
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
          </CardContent>
        </Card>
      </div>

      {/* 2. BASELINE VITALS */}
      <div className="space-y-6">
        <div className="flex items-center gap-4 px-2">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
            <Activity size={20} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Baseline Vitals</h2>
          <div className="flex-1 h-px bg-slate-100" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
      </div>

      {/* 3. GLOBAL ASSESSMENTS */}
      <div className="space-y-6">
        <div className="flex items-center gap-4 px-2">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
            <ShieldAlert size={20} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Global Assessments</h2>
          <div className="flex-1 h-px bg-slate-100" />
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