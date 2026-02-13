"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Home, Heart, Dumbbell, FlaskConical, Activity, Move, Zap, CheckCircle2, TrendingUp, History, Footprints, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppointmentWithClient } from '@/pages/AppointmentDetailPage';
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
import PreviousSessionSummary from './PreviousSessionSummary';
import GaitReflexAssessment from './GaitReflexAssessment';
import LymphaticAssessment from './LymphaticAssessment';

type ActiveView = 'home' | 'kinesiology' | 'muscles' | 'gait' | 'previous';

interface SessionContentSwitcherProps {
  appointment: AppointmentWithClient;
  onUpdate: () => void;
  saveField: (field: string, value: string | boolean | null | string[]) => Promise<void>;
}

const SessionContentSwitcher = ({ appointment, onUpdate, saveField }: SessionContentSwitcherProps) => {
  const [activeView, setActiveView] = useState<ActiveView>('home');
  const appointmentId = appointment.id;

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
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="baseline" className="w-full">
            <TabsList className="grid w-full grid-cols-5 h-14 bg-slate-200/50 p-1.5 rounded-2xl">
              <TabsTrigger value="baseline" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm rounded-xl h-11 text-[10px] font-black uppercase tracking-wider">
                <FlaskConical size={14} /> 1. Baseline
              </TabsTrigger>
              <TabsTrigger value="sympathetic" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm rounded-xl h-11 text-[10px] font-black uppercase tracking-wider">
                <Heart size={14} /> 2. SNS
              </TabsTrigger>
              <TabsTrigger value="pathway" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm rounded-xl h-11 text-[10px] font-black uppercase tracking-wider">
                <TrendingUp size={14} /> 3. Pathway
              </TabsTrigger>
              <TabsTrigger value="calibration" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm rounded-xl h-11 text-[10px] font-black uppercase tracking-wider">
                <CheckCircle2 size={14} /> 4. Correction
              </TabsTrigger>
              <TabsTrigger value="reassessment" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm rounded-xl h-11 text-[10px] font-black uppercase tracking-wider">
                <Zap size={14} /> 5. Re-Test
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
              <EditableField key={`notes-sympathetic-general-${appointmentId}`} field="additional_notes" label="Other SNS Techniques" value={appointment.additional_notes} multiline placeholder="ESR, Vagus Nerve, etc..." onSave={saveField as any} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm" />
            </TabsContent>

            <TabsContent value="pathway" className="mt-6 space-y-6">
              <EditableField key={`notes-pathway-${appointmentId}`} field="priority_pattern" label="Pathway Assessment Notes" value={appointment.priority_pattern} multiline placeholder="Document specific pathways tested and findings..." onSave={saveField as any} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm min-h-[300px]" />
            </TabsContent>

            <TabsContent value="calibration" className="mt-6 space-y-6">
              <EditableField key={`notes-calibration-${appointmentId}`} field="modes_balances" label="Calibration & Correction Notes" value={appointment.modes_balances} multiline placeholder="Document specific corrections, modes, and balances used..." onSave={saveField as any} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm min-h-[300px]" />
            </TabsContent>

            <TabsContent value="reassessment" className="mt-6 space-y-6">
              <EditableField key={`notes-reassessment-${appointmentId}`} field="session_north_star" label="Re-Assessment & Home Reinforcement" value={appointment.session_north_star} multiline placeholder="Document re-test results and client homework..." onSave={saveField as any} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm min-h-[300px]" />
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm rounded-2xl bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Zap size={16} className="text-indigo-500" /> Session Context
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <EditableField key={`acupoints-${appointmentId}`} field="acupoints" label="Acupoints" value={appointment.acupoints} placeholder="Points used..." onSave={saveField as any} />
              <EditableField key={`notes-${appointmentId}`} field="notes" label="General Notes" value={appointment.notes} multiline placeholder="Observations..." onSave={saveField as any} />
              <EditableField key={`journal-${appointmentId}`} field="journal" label="Practitioner Reflection" value={appointment.journal} multiline className="bg-amber-50/50 p-4 rounded-xl border border-amber-100" placeholder="Personal insights..." onSave={saveField as any} />
              {appointment.notion_link && (
                <Button variant="outline" size="sm" className="w-full text-xs rounded-xl" asChild>
                  <a href={appointment.notion_link} target="_blank" rel="noopener noreferrer">
                    <ExternalLink size={14} className="mr-2" /> View Notion Link
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
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