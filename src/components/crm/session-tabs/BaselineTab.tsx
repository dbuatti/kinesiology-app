"use client";

import React from 'react';
import BoltTestSection from '../BoltTestSection';
import CoherenceAssessment from '../CoherenceAssessment';
import CogsAssessment from '../CogsAssessment';
import NeurologicalAssessments from '../NeurologicalAssessments';
import LymphaticAssessment from '../LymphaticAssessment';
import { AppointmentWithClient } from '@/types/crm';

interface BaselineTabProps {
  appointment: AppointmentWithClient;
  onUpdate: () => void;
  saveField: (field: string, value: any) => Promise<void>;
}

const BaselineTab = ({ appointment, onUpdate, saveField }: BaselineTabProps) => {
  return (
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
  );
};

export default BaselineTab;