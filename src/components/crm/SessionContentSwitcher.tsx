"use client";

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Home, Heart, Dumbbell, Footprints, History, GitBranch } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppointmentWithClient } from '@/types/crm';
import BaselineTab from './session-tabs/BaselineTab';
import SympatheticTab from './session-tabs/SympatheticTab';
import EditableField from './EditableField';
import LuscherColourAssessment from './LuscherColourAssessment';
import MuscleTestingTab from './MuscleTestingTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EmotionAssessment from './EmotionAssessment';
import PreviousSessionSummary from './PreviousSessionSummary';
import GaitReflexAssessment from './GaitReflexAssessment';
import PathwayAssessment from './PathwayAssessment';
import NociceptiveThreatAssessment from './NociceptiveThreatAssessment';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

type ActiveView = 'home' | 'kinesiology' | 'muscles' | 'gait' | 'previous';

interface SessionContentSwitcherProps {
  appointment: AppointmentWithClient;
  onUpdate: () => void;
  saveField: (field: string, value: any) => Promise<void>;
}

const SessionContentSwitcher = ({ appointment, onUpdate, saveField }: SessionContentSwitcherProps) => {
  const [activeView, setActiveView] = useState<ActiveView>('home');
  
  const tabStatus = useMemo(() => ({
    baseline: !!(appointment.bolt_score || appointment.coherence_score || appointment.sagittal_plane_notes || appointment.fakuda_notes || appointment.lymphatic_priority_zone),
    sympathetic: !!(appointment.harmonic_rocking_notes || appointment.t1_reset_notes || appointment.diaphragm_reset_notes || appointment.vagus_nerve_notes || appointment.additional_notes),
    pathway: !!appointment.priority_pattern,
    calibration: !!appointment.modes_balances,
    reassessment: !!appointment.session_north_star
  }), [appointment]);

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
      <Tabs defaultValue="baseline" className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-14 bg-slate-200/50 p-1.5 rounded-2xl">
          {['baseline', 'sympathetic', 'pathway', 'calibration', 'reassessment'].map((tab, i) => (
            <TabsTrigger key={tab} value={tab} className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm rounded-xl h-11 text-[10px] font-black uppercase tracking-wider relative">
              {i + 1}. {tab}
              {(tabStatus as any)[tab] && <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-indigo-500 rounded-full" />}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="baseline" className="mt-6">
          <BaselineTab appointment={appointment} onUpdate={onUpdate} saveField={saveField} />
        </TabsContent>

        <TabsContent value="sympathetic" className="mt-6">
          <SympatheticTab appointment={appointment} onUpdate={onUpdate} saveField={saveField} />
        </TabsContent>

        <TabsContent value="pathway" className="mt-6">
          <PathwayAssessment 
            initialValue={appointment.priority_pattern || undefined} 
            onSave={(s) => saveField('priority_pattern', s)} 
          />
        </TabsContent>

        <TabsContent value="calibration" className="mt-6">
          <Card className="border-none shadow-lg rounded-[2.5rem] bg-white overflow-hidden">
            <CardHeader className="p-8">
              <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">Nociceptive Threat Assessment</CardTitle>
              <CardDescription className="text-slate-500 font-medium">
                A step-by-step wizard to identify and clear layers of neurological threat.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <NociceptiveThreatAssessment
                onSave={(summary) => saveField('modes_balances', summary)}
                initialValue={appointment.modes_balances || undefined}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reassessment" className="mt-6">
          <EditableField field="session_north_star" label="Re-Assessment & Home Reinforcement" value={appointment.session_north_star} multiline placeholder="Document re-test results..." onSave={saveField} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm min-h-[300px]" />
        </TabsContent>
      </Tabs>
    </div>
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
        {activeView === 'kinesiology' && (
          <div className="space-y-8">
            <LuscherColourAssessment appointmentId={appointment.id} initialColor1={appointment.luscher_color_1} initialColor2={appointment.luscher_color_2} onSaveColors={(c1, c2) => { saveField('luscher_color_1', c1); return saveField('luscher_color_2', c2); }} />
            <EmotionAssessment appointmentId={appointment.id} initialMode={appointment.emotion_mode} initialPrimary={appointment.emotion_primary_selection} initialSecondary={appointment.emotion_secondary_selection} initialNotes={appointment.emotion_notes} onSaveField={saveField} onUpdate={onUpdate} />
          </div>
        )}
        {activeView === 'muscles' && <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"><MuscleTestingTab appointmentId={appointment.id} /></div>}
        {activeView === 'gait' && <GaitReflexAssessment appointmentId={appointment.id} initialNotes={appointment.gait_notes} onSaveField={saveField} />}
        {activeView === 'previous' && <PreviousSessionSummary clientId={appointment.clients.id} currentAppointmentId={appointment.id} />}
      </div>
    </div>
  );
};

export default SessionContentSwitcher;