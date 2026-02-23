"use client";

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Home, Heart, Dumbbell, FlaskConical, Activity, Move, Zap, CheckCircle2, TrendingUp, History, Footprints, Droplets } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppointmentWithClient } from '@/types/crm';
import BoltTestSection from './BoltTestSection';
import CoherenceAssessment from './CoherenceAssessment';
import CogsAssessment from './CogsAssessment';
import NeurologicalAssessments from './NeurologicalAssessments';
import SympatheticDownRegulation from './SympatheticDownRegulation';
import T1SympatheticReset from './T1SympatheticReset';
import EditableField from './EditableField';
import LuscherColourAssessment from './LuscherColourAssessment';
import MuscleTestingTab from './MuscleTestingTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EmotionAssessment from './EmotionAssessment';
import DiaphragmReset from './DiaphragmReset';
import VagusNerveProcess from './VagusNerveProcess';
import PreviousSessionSummary from './PreviousSessionSummary';
import GaitReflexAssessment from './GaitReflexAssessment';
import LymphaticAssessment from './LymphaticAssessment';
import PathwayAssessmentWizard from './PathwayAssessmentWizard';
import NociceptiveThreatAssessment from './NociceptiveThreatAssessment';

type ActiveView = 'home' | 'kinesiology' | 'muscles' | 'gait' | 'previous';

interface SessionContentSwitcherProps {
  appointment: AppointmentWithClient;
  onUpdate: () => void;
  saveField: (field: string, value: string | boolean | null | string[]) => Promise<void>;
}

const SessionContentSwitcher = ({ appointment, onUpdate, saveField }: SessionContentSwitcherProps) => {
  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [pathwayTool, setPathwayTool] = useState<'standard' | 'nociceptive'>('standard');
  const appointmentId = appointment.id;

  const tabStatus = useMemo(() => ({
    baseline: !!(appointment.bolt_score || appointment.coherence_score || appointment.sagittal_plane_notes || appointment.fakuda_notes || appointment.lymphatic_priority_zone),
    sympathetic: !!(appointment.harmonic_rocking_notes || appointment.t1_reset_notes || appointment.diaphragm_reset_notes || appointment.vagus_nerve_notes || appointment.additional_notes),
    pathway: !!appointment.priority_pattern,
    calibration: !!appointment.modes_balances,
    reassessment: !!appointment.session_north_star
  }), [appointment]);

  const handleSaveColors = async (color1: string | null, color2: string | null) => {
    await saveField('luscher_color_1', color1);
    await saveField('luscher_color_2', color2);
  };

  const NavItem = ({ view, label, Icon }: { view: ActiveView, label: string, Icon: React.ElementType }) => (
    <Button
      variant="ghost"
      onClick={() => setActiveView(view)}
      className={cn(
        "h-12 px-6 rounded-2xl transition-all font-bold text-sm",
        activeView === view 
          ? "bg-white text-indigo-600 shadow-sm border border-slate-100" 
          : "text-slate-500 hover:bg-white/50 hover:text-slate-900"
      )}
    >
      <Icon size={18} className="mr-2" />
      {label}
    </Button>
  );

  const renderHomeView = () => (
    <div className="space-y-12">
      <div className="space-y-6">
        <Tabs defaultValue="baseline" className="w-full">
          <TabsList className="grid w-full grid-cols-5 h-14 bg-slate-200/50 p-1.5 rounded-2xl">
            <TabsTrigger value="baseline" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm rounded-xl h-11 text-[10px] font-black uppercase tracking-wider relative">
              <FlaskConical size={14} /> 1. Baseline
              {tabStatus.baseline && <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-indigo-500 rounded-full" />}
            </TabsTrigger>
            <TabsTrigger value="sympathetic" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm rounded-xl h-11 text-[10px] font-black uppercase tracking-wider relative">
              <Heart size={14} /> 2. SNS
              {tabStatus.sympathetic && <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-indigo-500 rounded-full" />}
            </TabsTrigger>
            <TabsTrigger value="pathway" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm rounded-xl h-11 text-[10px] font-black uppercase tracking-wider relative">
              <TrendingUp size={14} /> 3. Pathway
              {tabStatus.pathway && <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-indigo-500 rounded-full" />}
            </TabsTrigger>
            <TabsTrigger value="calibration" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm rounded-xl h-11 text-[10px] font-black uppercase tracking-wider relative">
              <CheckCircle2 size={14} /> 4. Correction
              {tabStatus.calibration && <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-indigo-500 rounded-full" />}
            </TabsTrigger>
            <TabsTrigger value="reassessment" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm rounded-xl h-11 text-[10px] font-black uppercase tracking-wider relative">
              <Zap size={14} /> 5. Re-Test
              {tabStatus.reassessment && <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-indigo-500 rounded-full" />}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="baseline" className="mt-6 space-y-6">
            <BoltTestSection appointmentId={appointmentId} initialBoltScore={appointment.bolt_score} onUpdate={onUpdate} />
            <CoherenceAssessment appointmentId={appointmentId} initialHeartRate={appointment.heart_rate} initialBreathRate={appointment.breath_rate} initialCoherenceScore={appointment.coherence_score} onUpdate={onUpdate} />
            <CogsAssessment appointmentId={appointmentId} initialSagittalNotes={appointment.sagittal_plane_notes} initialFrontalNotes={appointment.frontal_plane_notes} initialTransverseNotes={appointment.transverse_plane_notes} onUpdate={onUpdate} />
            <NeurologicalAssessments appointmentId={appointmentId} initialFakudaNotes={appointment.fakuda_notes} initialRhombergsNotes={appointment.sharpened_rhombergs_notes} initialFrontalLobeNotes={appointment.frontal_lobe_notes} onUpdate={onUpdate} />
            <LymphaticAssessment
              appointmentId={appointmentId}
              initialSutureSide={appointment.lymphatic_suture_side}
              initialPriorityZone={appointment.lymphatic_priority_zone}
              initialNotes={appointment.lymphatic_notes}
              onSaveField={saveField as any}
            />
          </TabsContent>

          <TabsContent value="sympathetic" className="mt-6 space-y-6">
            <SympatheticDownRegulation appointmentId={appointmentId} initialNotes={appointment.harmonic_rocking_notes} onSaveField={saveField as any} onUpdate={onUpdate} />
            <T1SympatheticReset appointmentId={appointmentId} initialNotes={appointment.t1_reset_notes} onSaveField={saveField as any} onUpdate={onUpdate} />
            <DiaphragmReset appointmentId={appointmentId} initialNotes={appointment.diaphragm_reset_notes} onSaveField={saveField as any} onUpdate={onUpdate} />
            <VagusNerveProcess appointmentId={appointmentId} initialNotes={appointment.vagus_nerve_notes} onSaveField={saveField as any} onUpdate={onUpdate} />
            <EditableField key={`notes-sympathetic-general-${appointmentId}`} field="additional_notes" label="Other SNS Techniques" value={appointment.additional_notes} multiline placeholder="ESR, Vagus Nerve, etc..." onSave={saveField as any} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm" />
          </TabsContent>

          <TabsContent value="pathway" className="mt-6 space-y-6">
            <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl w-fit mb-4">
              <Button
                variant={pathwayTool === 'standard' ? 'white' : 'ghost'}
                size="sm"
                onClick={() => setPathwayTool('standard')}
                className={cn(
                  "rounded-lg font-bold text-xs h-8 px-4",
                  pathwayTool === 'standard' ? "bg-white shadow-sm text-indigo-600" : "text-slate-500"
                )}
              >
                Standard Wizard
              </Button>
              <Button
                variant={pathwayTool === 'nociceptive' ? 'white' : 'ghost'}
                size="sm"
                onClick={() => setPathwayTool('nociceptive')}
                className={cn(
                  "rounded-lg font-bold text-xs h-8 px-4",
                  pathwayTool === 'nociceptive' ? "bg-white shadow-sm text-orange-600" : "text-slate-500"
                )}
              >
                Nociceptive Threat
              </Button>
            </div>

            {pathwayTool === 'standard' ? (
              <PathwayAssessmentWizard
                initialValue={appointment.priority_pattern || undefined}
                onSave={(summary) => saveField('priority_pattern', summary)}
              />
            ) : (
              <NociceptiveThreatAssessment
                initialValue={appointment.priority_pattern || undefined}
                onSave={(summary) => saveField('priority_pattern', summary)}
              />
            )}
            <EditableField key={`notes-pathway-${appointmentId}`} field="priority_pattern" label="Pathway Assessment Notes" value={appointment.priority_pattern} multiline placeholder="Document specific pathways tested and findings..." onSave={saveField as any} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm min-h-[200px]" />
          </TabsContent>

          <TabsContent value="calibration" className="mt-6 space-y-6">
            <EditableField key={`notes-calibration-${appointmentId}`} field="modes_balances" label="Calibration & Correction Notes" value={appointment.modes_balances} multiline placeholder="Document specific corrections, modes, and balances used..." onSave={saveField as any} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm min-h-[300px]" />
          </TabsContent>

          <TabsContent value="reassessment" className="mt-6 space-y-6">
            <EditableField key={`notes-reassessment-${appointmentId}`} field="session_north_star" label="Re-Assessment & Home Reinforcement" value={appointment.session_north_star} multiline placeholder="Document re-test results and client homework..." onSave={saveField as any} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm min-h-[300px]" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );

  const renderKinesiologyView = () => (
    <div className="space-y-8">
      <LuscherColourAssessment appointmentId={appointmentId} initialColor1={appointment.luscher_color_1} initialColor2={appointment.luscher_color_2} onSaveColors={handleSaveColors} />
      <EmotionAssessment appointmentId={appointmentId} initialMode={appointment.emotion_mode} initialPrimary={appointment.emotion_primary_selection} initialSecondary={appointment.emotion_secondary_selection} initialNotes={appointment.emotion_notes} onSaveField={saveField as any} onUpdate={onUpdate} />
    </div>
  );

  const renderMuscleView = () => (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-50 bg-slate-50/50">
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <Dumbbell size={20} className="text-indigo-600" /> Muscle Testing Log
        </h2>
      </div>
      <div className="p-6">
        <MuscleTestingTab appointmentId={appointmentId} />
      </div>
    </div>
  );

  const renderGaitView = () => (
    <GaitReflexAssessment appointmentId={appointmentId} initialNotes={appointment.gait_notes} onSaveField={saveField as any} />
  );

  const renderPreviousView = () => (
    <PreviousSessionSummary clientId={appointment.clients.id} currentAppointmentId={appointment.id} />
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 bg-slate-200/30 p-2 rounded-2xl border border-slate-200/50">
        <NavItem view="home" label="Session Flow" Icon={Home} />
        <NavItem view="kinesiology" label="Kinesiology Tools" Icon={Heart} />
        <NavItem view="muscles" label="Muscle Log" Icon={Dumbbell} />
        <NavItem view="gait" label="Gait Integration" Icon={Footprints} />
        <NavItem view="previous" label="Previous Session" Icon={History} />
      </div>
      
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeView === 'home' && renderHomeView()}
        {activeView === 'kinesiology' && renderKinesiologyView()}
        {activeView === 'muscles' && renderMuscleView()}
        {activeView === 'gait' && renderGaitView()}
        {activeView === 'previous' && renderPreviousView()}
      </div>
    </div>
  );
};

export default SessionContentSwitcher;