"use client";

import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Home, Heart, Dumbbell, FlaskConical, Activity, Move, Zap, CheckCircle2, Palette, Footprints, Scale, Hand, ExternalLink, TrendingUp, History } from 'lucide-react';
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

type ActiveView = 'home' | 'kinesiology' | 'muscles' | 'previous';

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
        "h-10 px-4 rounded-xl transition-all",
        activeView === view 
          ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md" 
          : "text-slate-600 hover:bg-slate-100"
      )}
    >
      <Icon size={18} className="mr-2" />
      {label}
    </Button>
  );

  const renderHomeView = () => (
    <div className="space-y-6">
      <Card className="border-slate-200 shadow-none rounded-2xl bg-slate-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-slate-700">
            <Zap size={16} className="text-indigo-500" /> General Session Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <EditableField
            key={`acupoints-${appointmentId}`}
            field="acupoints"
            label="Acupoints"
            value={appointment.acupoints}
            placeholder="Which acupoints were used?"
            onSave={saveField}
          />
          <EditableField
            key={`notes-${appointmentId}`}
            field="notes"
            label="Session Notes (General)"
            value={appointment.notes}
            multiline
            placeholder="Session observations and notes..."
            onSave={saveField}
          />
          <EditableField
            key={`journal-${appointmentId}`}
            field="journal"
            label="Journal Entry (Practitioner Reflection)"
            value={appointment.journal}
            multiline
            className="bg-amber-50/50 p-3 rounded-xl border border-amber-100"
            placeholder="Personal reflections and insights..."
            onSave={saveField}
          />
          {appointment.notion_link && (
            <Button variant="outline" size="sm" className="w-full text-xs rounded-xl" asChild>
              <a href={appointment.notion_link} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={14} className="mr-2" /> View Notion Link
              </a>
            </Button>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="baseline" className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-12 bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="baseline" className="flex items-center gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg h-10 text-xs">
            <FlaskConical size={16} /> 1 - BASELINE
          </TabsTrigger>
          <TabsTrigger value="sympathetic" className="flex items-center gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg h-10 text-xs">
            <Heart size={16} /> 2 - SNS DOWN-REG
          </TabsTrigger>
          <TabsTrigger value="pathway" className="flex items-center gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg h-10 text-xs">
            <TrendingUp size={16} /> 3 - PATHWAY
          </TabsTrigger>
          <TabsTrigger value="calibration" className="flex items-center gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg h-10 text-xs">
            <CheckCircle2 size={16} /> 4 - CORRECTION
          </TabsTrigger>
          <TabsTrigger value="reassessment" className="flex items-center gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg h-10 text-xs">
            <Zap size={16} /> 5 - RE-ASSESSMENT
          </TabsTrigger>
        </TabsList>

        <TabsContent value="baseline" className="mt-6 space-y-6">
          <BoltTestSection
            appointmentId={appointmentId}
            initialBoltScore={appointment.bolt_score}
            onUpdate={onUpdate}
          />
          <CoherenceAssessment
            appointmentId={appointmentId}
            initialHeartRate={appointment.heart_rate}
            initialBreathRate={appointment.breath_rate}
            initialCoherenceScore={appointment.coherence_score}
            onUpdate={onUpdate}
          />
          <CogsAssessment
            appointmentId={appointmentId}
            initialSagittalNotes={appointment.sagittal_plane_notes}
            initialFrontalNotes={appointment.frontal_notes}
            initialTransverseNotes={appointment.transverse_notes}
            onUpdate={onUpdate}
          />
          <NeurologicalAssessments
            appointmentId={appointmentId}
            initialFakudaNotes={appointment.fakuda_notes}
            initialRhombergsNotes={appointment.sharpened_rhombergs_notes}
            initialFrontalLobeNotes={appointment.frontal_lobe_notes}
            onUpdate={onUpdate}
          />
        </TabsContent>

        <TabsContent value="sympathetic" className="mt-6 space-y-6">
          <SympatheticDownRegulation
            appointmentId={appointmentId}
            initialNotes={appointment.harmonic_rocking_notes}
            onSaveField={saveField}
            onUpdate={onUpdate}
          />
          <T1SympatheticReset
            appointmentId={appointmentId}
            initialNotes={appointment.t1_reset_notes}
            onSaveField={saveField}
            onUpdate={onUpdate}
          />
          <DiaphragmReset
            appointmentId={appointmentId}
            initialNotes={appointment.diaphragm_reset_notes}
            onSaveField={saveField}
            onUpdate={onUpdate}
          />
          <EditableField
            key={`notes-sympathetic-general-${appointmentId}`}
            field="additional_notes"
            label="General Sympathetic Down-Regulation Notes (Other Techniques)"
            value={appointment.additional_notes}
            multiline
            placeholder="Document other techniques used (e.g., ESR, Nociceptive Threat Assessment, Vagus Nerve stimulation)..."
            onSave={saveField}
          />
        </TabsContent>

        <TabsContent value="pathway" className="mt-6 space-y-6">
          <Card className="border-2 border-amber-200 shadow-none rounded-2xl bg-amber-50/50 p-6">
            <h3 className="text-xl font-bold text-amber-900 mb-2">Pathway Assessment(s)</h3>
            <p className="text-amber-800">Content for Pathway Assessment(s) goes here. This tab is for detailed pathway testing and analysis.</p>
          </Card>
          <EditableField
            key={`notes-pathway-${appointmentId}`}
            field="priority_pattern"
            label="Pathway Assessment Notes"
            value={appointment.priority_pattern}
            multiline
            placeholder="Document specific pathways tested and findings..."
            onSave={saveField}
          />
        </TabsContent>

        <TabsContent value="calibration" className="mt-6 space-y-6">
          <Card className="border-2 border-emerald-200 shadow-none rounded-2xl bg-emerald-50/50 p-6">
            <h3 className="text-xl font-bold text-emerald-900 mb-2">Calibration/Correction</h3>
            <p className="text-emerald-800">Content for Calibration/Correction goes here. This tab is for logging primary corrections and balancing techniques.</p>
          </Card>
          <EditableField
            key={`notes-calibration-${appointmentId}`}
            field="modes_balances"
            label="Calibration & Correction Notes"
            value={appointment.modes_balances}
            multiline
            placeholder="Document specific corrections, modes, and balances used..."
            onSave={saveField}
          />
        </TabsContent>

        <TabsContent value="reassessment" className="mt-6 space-y-6">
          <Card className="border-2 border-indigo-200 shadow-none rounded-2xl bg-indigo-50/50 p-6">
            <h3 className="text-xl font-bold text-indigo-900 mb-2">Re-Assessment & Home Reinforcement</h3>
            <p className="text-indigo-800">Content for Re-Assessment goes here. This tab is for final checks and prescribing home reinforcement.</p>
          </Card>
          <EditableField
            key={`notes-reassessment-${appointmentId}`}
            field="session_north_star"
            label="Re-Assessment & Home Reinforcement Notes"
            value={appointment.session_north_star}
            multiline
            placeholder="Document re-test results and client homework/reinforcement exercises..."
            onSave={saveField}
          />
        </TabsContent>
      </Tabs>
    </div>
  );

  const renderKinesiologyView = () => (
    <div className="space-y-8">
      <Card className="border-none shadow-lg rounded-2xl bg-white">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 rounded-t-2xl">
          <CardTitle className="text-2xl font-bold flex items-center gap-3 text-slate-900">
            <Heart size={24} className="text-red-600" /> Energetic & Emotional Assessments
          </CardTitle>
          <CardDescription>
            Luscher Colour and Emotional Assessment for {appointment.clients.name} (Session ID: {appointmentId.slice(0, 8)}...)
          </CardDescription>
        </CardHeader>
      </Card>
      <LuscherColourAssessment
        appointmentId={appointmentId}
        initialColor1={appointment.luscher_color_1}
        initialColor2={appointment.luscher_color_2}
        onSaveColors={handleSaveColors}
      />
      <EmotionAssessment
        appointmentId={appointmentId}
        initialMode={appointment.emotion_mode}
        initialPrimary={appointment.emotion_primary_selection}
        initialSecondary={appointment.emotion_secondary_selection}
        initialNotes={appointment.emotion_notes}
        onSaveField={saveField}
        onUpdate={onUpdate}
      />
    </div>
  );

  const renderMuscleView = () => (
    <div className="space-y-6">
      <Card className="border-none shadow-lg rounded-2xl bg-white">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 rounded-t-2xl">
          <CardTitle className="text-2xl font-bold flex items-center gap-3 text-slate-900">
            <Dumbbell size={24} className="text-indigo-600" /> Muscle Testing Log
          </CardTitle>
          <CardDescription>
            Logging muscle test results for {appointment.clients.name} (Session ID: {appointmentId.slice(0, 8)}...)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <MuscleTestingTab appointmentId={appointmentId} />
        </CardContent>
      </Card>
    </div>
  );

  const renderPreviousView = () => (
    <PreviousSessionSummary 
      clientId={appointment.clients.id} 
      currentAppointmentId={appointment.id} 
    />
  );

  return (
    <Card className="border-none shadow-lg rounded-2xl bg-white overflow-hidden">
      <CardHeader className="p-4 border-b border-slate-100">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
          <NavItem view="home" label="Home" Icon={Home} />
          <NavItem view="kinesiology" label="Kinesiology Tools" Icon={Heart} />
          <NavItem view="muscles" label="Muscle Testing Log" Icon={Dumbbell} />
          <NavItem view="previous" label="Previous Session" Icon={History} />
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {activeView === 'home' && renderHomeView()}
        {activeView === 'kinesiology' && renderKinesiologyView()}
        {activeView === 'muscles' && renderMuscleView()}
        {activeView === 'previous' && renderPreviousView()}
      </CardContent>
    </Card>
  );
};

export default SessionContentSwitcher;