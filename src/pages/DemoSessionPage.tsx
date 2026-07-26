
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
import EditableField from "@/components/shared/EditableField";
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

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { generateSessionSummary } from "@/utils/summary-generator";
import BrainstemToneMap from "@/components/crm/BrainstemToneMap";
import AppointmentContextCards from "@/components/crm/AppointmentContextCards";
import { TCM_CHANNELS } from "@/data/tcm-channel-data";
import PreviousSessionInsightsBar from "@/components/crm/PreviousSessionInsightsBar";
import WeeklyFocusBanner from "@/components/crm/WeeklyFocusBanner";

const DemoSessionPage = () => {
 // Changed to false by default
 const [showSidebar, setShowSidebar] = useState(false);
 
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

 const [copied, setCopied] = useState(false);

 const saveField = async (field: string, value: any) => {
 setAppointment((prev: any) => ({ ...prev, [field]: value }));
 };

 const updatePriorityPattern = async (category: string, itemName: string, status: 'Clear' | 'Inhibited' | null, side?: 'L' | 'R') => {
 const currentPattern = JSON.parse(appointment.priority_pattern || "{}");
 if (!currentPattern[category]) currentPattern[category] = {};
 if (status === null) delete currentPattern[category][itemName];
 else currentPattern[category][itemName] = status;
 setAppointment((prev: any) => ({ ...prev, priority_pattern: JSON.stringify(currentPattern) }));
 };

 const handleJumpToCalibrate = (itemName: string) => {
 const event = new CustomEvent('jump-to-calibrate', { detail: { itemName } });
 window.dispatchEvent(event);
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
 sessionId={appointment.id}
 appointmentDate={appointment.date} 
 status={appointment.status} 
 clientName={appointment.clients.name}
 />
 <AppLayout>
 <div className="flex flex-col gap-6 max-w-[1600px] mx-auto">
 <Alert className="bg-muted border-border rounded-xl">
 <AlertTriangle className="h-5 w-5 text-muted-foreground" />
 <AlertDescription className="text-sm text-rose-900 font-medium">
 DEMO MODE: Explore the Brainstem Tone Map (Sidebar) and Neurological Evolution (History Tab).
 </AlertDescription>
 </Alert>

 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">


 <div className="flex items-center gap-2">
 <Button 
 variant="outline" 
 size="sm" 
  className={cn("h-10 px-4 font-medium text-xs rounded-xl transition-all", showSidebar ? "bg-primary text-primary-foreground border-indigo-600" : "bg-background border-border text-muted-foreground hover:bg-muted")}
 onClick={() => setShowSidebar(!showSidebar)}
 >
 {showSidebar ? <PanelRightClose size={16} className="mr-2" /> : <PanelRightOpen size={16} className="mr-2" />}
 {showSidebar ? "Hide Sidebar" : "Show Sidebar"}
 </Button>
 <Button variant="outline" size="sm" className="bg-background rounded-xl border-border text-chart-primary h-10 px-4 font-medium text-xs" onClick={handleCopySummary}>
 {copied ? <Check size={16} className="mr-2 text-chart-emerald" /> : <Copy size={16} className="mr-2" />}
 Copy Summary
 </Button>
 </div>
 </div>

 <WeeklyFocusBanner 
 appointmentId={appointment.id}
 priorityPattern={appointment.priority_pattern}
 onSaveField={saveField}
 onJumpToCalibrate={handleJumpToCalibrate}
 />

 <PreviousSessionInsightsBar manualData={mockHistory[1]} />

 <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
 <div className={cn(showSidebar ? "xl:col-span-8" : "xl:col-span-12", "space-y-8 transition-all duration-500")}>
 <Card className="border-none shadow-sm rounded-xl bg-background overflow-hidden">
 <div className="p-6 border-b border-border bg-muted/30">
 <div className="flex items-start gap-5">
 <div className="w-16 h-16 rounded-xl bg-primary text-primary-foreground flex items-center justify-center text-2xl font-semibold shadow-sm">A</div>
 <div className="space-y-2">
 <div className="flex items-center gap-3">
 <Badge variant="secondary" className="font-medium bg-background border-border text-muted-foreground">{appointment.display_id}</Badge>
 <Badge className="bg-primary text-primary-foreground border-none">{appointment.tag}</Badge>
 </div>
 <h1 className="text-3xl font-semibold text-foreground">{appointment.clients.name}</h1>
 <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
 <Calendar size={16} className="text-primary/70" /> {format(appointment.date, "EEEE, MMMM d")}
 {clientBorn && <span className="bg-chart-primary/10 text-chart-primary px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase ml-2">{calculateAge(clientBorn)} yrs</span>}
 </div>
 </div>
 </div>
 </div>
 <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
 <EditableField field="goal" label="Session Goal" value={appointment.goal} onSave={saveField} className="bg-muted/50 p-4 rounded-xl border border-border" />
 <EditableField field="issue" label="Main Concern" value={appointment.issue} onSave={saveField} className="bg-muted/50 p-4 rounded-xl border border-border" />
 </div>
 </Card>

 <SessionContentSwitcher 
 appointment={appointment} 
 onUpdate={() => {}} 
 saveField={saveField} 
 updatePriorityPattern={updatePriorityPattern}
 history={[...mockHistory, appointment]} 
 showSidebar={showSidebar}
 onToggleSidebar={() => setShowSidebar(!showSidebar)}
 onClonePrevious={() => showSuccess("Clone simulated (Demo Mode)")}
 onPrint={() => window.print()}
 onCopySummary={handleCopySummary}
 onDelete={() => showSuccess("Delete simulated (Demo Mode)")}
 isCopied={copied}
 />
 </div>

 {showSidebar && (
 <div className="xl:col-span-4 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
 <div className="space-y-4">
 <div className="flex items-center gap-2 px-2">
 <Brain size={18} className="text-chart-primary" />
 <h3 className="text-sm font-semibold text-muted-foreground/60 uppercase tracking-wider">Brainstem Tone Map</h3>
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