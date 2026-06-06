
import React, { useMemo } from 'react';
import BoltTestSection from '../BoltTestSection';
import CoherenceAssessment from '../CoherenceAssessment';
import CogsAssessment from '../CogsAssessment';
import NeurologicalAssessments from '../NeurologicalAssessments';
import LymphaticAssessment from '../LymphaticAssessment';
import EditableField from '@/components/shared/EditableField';
import { AppointmentWithClient } from '@/types/crm';
import { Target, ClipboardList, Activity, ShieldAlert, Compass, AlertTriangle, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { differenceInDays } from 'date-fns';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

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
        <Alert className="bg-rose-50 border-rose-200 rounded-2xl animate-in slide-in-from-top-2 duration-500">
          <AlertTriangle className="h-5 w-5 text-rose-600" />
          <AlertDescription className="text-sm text-rose-900 font-bold">
            CLINICAL CONSIDERATION: It has been over {Math.floor(daysSinceLast / 30)} months since the last session. Baseline findings and CO2 tolerance may have shifted significantly.
          </AlertDescription>
        </Alert>
      )}

      {/* 1. INTAKE SECTION: GOAL & CONCERN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className={cn(
          "border-none shadow-sm rounded-[2rem] overflow-hidden transition-all duration-500",
          !appointment.goal ? "bg-indigo-50/50 ring-2 ring-indigo-100" : "bg-white"
        )}>
          <CardContent className="p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm",
                  !appointment.goal ? "bg-indigo-600 text-white" : "bg-indigo-50 text-indigo-600"
                )}>
                  <Compass size={20} />
                </div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Session Goal</h3>
              </div>
              {!appointment.goal && (
                <Badge className="bg-indigo-600 text-white border-none font-black text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-full">
                  Required
                </Badge>
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
              className="border-none p-0 shadow-none bg-transparent" 
            />
          </CardContent>
        </Card>

        <Card className={cn(
          "border-none shadow-sm rounded-[2rem] overflow-hidden transition-all duration-500",
          !appointment.issue ? "bg-rose-50/50 ring-2 ring-rose-100" : "bg-white"
        )}>
          <CardContent className="p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm",
                  !appointment.issue ? "bg-rose-600 text-white" : "bg-rose-50 text-rose-600"
                )}>
                  <ClipboardList size={20} />
                </div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Primary Concern</h3>
              </div>
              {!appointment.issue && (
                <Badge className="bg-rose-600 text-white border-none font-black text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-full">
                  Required
                </Badge>
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