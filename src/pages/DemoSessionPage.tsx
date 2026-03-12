"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Calendar, Clock, User, Droplets,
  Copy, Check, History, MoreHorizontal, Star, Play, AlertTriangle, Trash2, Brain, PanelRightClose, PanelRightOpen, ClipboardList
} from "lucide-react";
import { format, subDays } from "date-fns";
import { showSuccess } from "@/utils/toast";
import { cn } from "@/lib/utils";
import EditableField from "@/components/crm/EditableField";
import SessionTimer from "@/components/crm/SessionTimer";
import AppLayout from "@/components/crm/AppLayout";
import SessionContentSwitcher from "@/components/crm/SessionContentSwitcher";
import { calculateAge, getStarSign } from "@/utils/crm-utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { APPOINTMENT_STATUSES } from "@/data/appointment-data";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Breadcrumbs from "@/components/crm/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { generateSessionSummary } from "@/utils/summary-generator";
import BrainstemToneMap from "@/components/crm/BrainstemToneMap";
import AppointmentContextCards from "@/components/crm/AppointmentContextCards";
import { TCM_CHANNELS } from "@/data/tcm-channel-data";
import PreviousSessionInsightsBar from "@/components/crm/PreviousSessionInsightsBar";

const DemoSessionPage = () => {
  const [showSidebar, setShowSidebar] = useState(true);
  
  // Mock history to show the evolution tracker
  const mockHistory = useMemo(() => [
    {
      id: "hist-1",
      date: subDays(new Date(), 14).toISOString(),
      goal: "Initial assessment of chronic fatigue",
      issue: "Low energy, poor sleep, brain fog",
      bolt_score: 12,
      coherence_score: 2.1,
      priority_pattern: JSON.stringify({
        primitiveReflexes: { "Fear Paralysis": "Inhibited", "Moro Reflex": "Inhibited" },
        cranialNerves: { "CN X: Vagus": "Inhibited" }
      })
    },
    {
      id: "hist-2",
      date: subDays(new Date(), 7).toISOString(),
      goal: "Integrate foundational reflexes",
      issue: "Still experiencing brain fog, but sleep improved",
      bolt_score: 18,
      coherence_score: 3.5,
      priority_pattern: JSON.stringify({
        primitiveReflexes: { "Fear Paralysis": "Clear", "Moro Reflex": "Inhibited" },
        cranialNerves: { "CN X: Vagus": "Inhibited", "CN V: Trigeminal": "Inhibited" }
      })
    }
  ], []);

  const [appointment, setAppointment] = useState<any>({
    id: "00000000-0000-0000-0000-000000000000",
    display_id: "DEMO-001",
    clientId: "demo-client-id",
    date: new Date(),
    tag: "Kinesiology",
    status: "Scheduled",
    goal: "Resolve chronic right-sided neck pain and brain fog",
    issue: "Client reports 7/10 pain during cervical rotation. History of whiplash 2 years ago.",
    acupoints: "GV20, KI27, BL10",
    notes: "This is a demo session. Findings are pre-populated to show the Brainstem Tone Map and History Tracker.",
    hydrated: true,
    priority_pattern: JSON.stringify({
      primitiveReflexes: { "Fear Paralysis": "Clear", "Moro Reflex": "Clear" },
      cranialNerves: {
        "CN III: Oculomotor": "Inhibited",
        "CN V: Trigeminal": "Inhibited",
        "CN X: Vagus": "Inhibited"
      },
      muscles: {
        "Psoas": "Inhibited",
        "Supraspinatus": "Inhibited"
      }
    }),
    bolt_score: 18,
    coherence_score: 4.2,
    clients: {
      id: "demo-client-id",
      name: "Arthur Dent",
      born: "1982-05-25"
    }
  });

  const currentPeakMeridian = TCM_CHANNELS.find(c => c.id === "HT"); // Mock peak

  const [isFixedHeaderActive, setIsFixedHeaderActive] = useState(false);
  const [copied, setCopied] = useState(false);

  const saveField = async (field: string, value: any) => {
    setAppointment((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleCopySummary = () => {
    const summary = generateSessionSummary(appointment);
    navigator.clipboard.writeText(summary);
    showSuccess("Summary copied (Demo Mode)");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clientBorn = appointment.clients.born ? new Date(appointment.clients.born) : null;

  return (
    <>
      <SessionTimer 
        appointmentDate={appointment.date} 
        status={appointment.status} 
        onFixedHeaderChange={setIsFixedHeaderActive} 
      />
      <AppLayout hasFixedHeader={isFixedHeaderActive}>
        <div className="flex flex-col gap-6 max-w-[1600px] mx-auto">
          <Alert className="bg-amber-50 border-amber-200 rounded-2xl">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <AlertDescription className="text-sm text-amber-900 font-bold">
              DEMO MODE: Explore the Brainstem Tone Map (Sidebar) and Neurological Evolution (History Tab).
            </AlertDescription>
          </Alert>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <Breadcrumbs items={[{ label: "Dashboard", path: "/" }, { label: "Demo Session" }]} className="mb-0" />
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className={cn("h-10 px-4 font-bold text-xs rounded-xl", showSidebar ? "bg-indigo-600 text-white" : "bg-white")}
                onClick={() => setShowSidebar(!showSidebar)}
              >
                {showSidebar ? <PanelRightClose size={16} className="mr-2" /> : <PanelRightOpen size={16} className="mr-2" />}
                {showSidebar ? "Hide Sidebar" : "Show Sidebar"}
              </Button>
              <Button variant="outline" size="sm" className="bg-white rounded-xl border-indigo-200 text-indigo-600 h-10 px-4 font-bold text-xs" onClick={handleCopySummary}>
                {copied ? <Check size={16} className="mr-2 text-emerald-500" /> : <Copy size={16} className="mr-2" />}
                Copy Summary
              </Button>
            </div>
          </div>

          <PreviousSessionInsightsBar 
            clientId="demo-client-id" 
            currentAppointmentId={appointment.id} 
            manualData={mockHistory[1]}
          />

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            <div className={cn(showSidebar ? "xl:col-span-8" : "xl:col-span-12", "space-y-8 transition-all duration-500")}>
              <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/30">
                  <div className="flex items-start gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-2xl font-black shadow-xl">A</div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="font-bold bg-white border-slate-200 text-slate-600">{appointment.display_id}</Badge>
                        <Badge className="bg-indigo-600 text-white border-none">{appointment.tag}</Badge>
                      </div>
                      <h1 className="text-3xl font-black text-slate-900">{appointment.clients.name}</h1>
                      <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
                        <Calendar size={16} className="text-indigo-400" /> {format(appointment.date, "EEEE, MMMM d")}
                        {clientBorn && <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md text-[10px] font-black uppercase ml-2">{calculateAge(clientBorn)} yrs</span>}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <EditableField field="goal" label="Session Goal" value={appointment.goal} onSave={saveField} className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100" />
                  <EditableField field="issue" label="Main Concern" value={appointment.issue} onSave={saveField} className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100" />
                </div>
              </Card>

              <SessionContentSwitcher 
                appointment={appointment} 
                onUpdate={() => {}} 
                saveField={saveField} 
                history={[...mockHistory, appointment]} 
              />
            </div>

            {showSidebar && (
              <div className="xl:col-span-4 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 px-2">
                    <Brain size={18} className="text-indigo-600" />
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">Brainstem Tone Map</h3>
                  </div>
                  <BrainstemToneMap priorityPattern={appointment.priority_pattern} />
                </div>
                <AppointmentContextCards appointment={appointment} currentPeakMeridian={currentPeakMeridian} onSaveField={saveField} />
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    </>
  );
};

export default DemoSessionPage;