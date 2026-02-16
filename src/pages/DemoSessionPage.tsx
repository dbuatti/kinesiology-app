"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Calendar, Clock, User, Droplets,
  Copy, Check, History, MoreHorizontal, Star, Play, AlertTriangle, Trash2
} from "lucide-react";
import { format } from "date-fns";
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

const DemoSessionPage = () => {
  // Mock initial data
  const [appointment, setAppointment] = useState<any>({
    id: "demo-session-id",
    display_id: "DEMO-001",
    clientId: "demo-client-id",
    date: new Date(),
    tag: "Kinesiology",
    status: "Scheduled",
    goal: "Assess the new UI layout and test component interactions",
    issue: "Need a safe environment to debug without database side-effects",
    acupoints: "GV20, KI27",
    notes: "This is a demo session. Changes made here are stored in local component state only.",
    hydrated: true,
    clients: {
      id: "demo-client-id",
      name: "Demo Client",
      born: "1990-01-01"
    }
  });

  const [isFixedHeaderActive, setIsFixedHeaderActive] = useState(false);
  const [copied, setCopied] = useState(false);

  const saveField = async (field: string, value: any) => {
    console.log(`[Demo Mode] Saving ${field}:`, value);
    setAppointment((prev: any) => ({ ...prev, [field]: value }));
    // We don't show success toasts for every keystroke in demo mode to keep it clean,
    // but we'll log it to the console for debugging.
  };

  const handleStartSession = () => {
    saveField('date', new Date());
    showSuccess("Demo session started!");
  };

  const handleCompleteSession = () => {
    saveField('status', 'Completed');
    showSuccess("Demo session marked as Completed!");
  };

  const handleCopySummary = () => {
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
        onCompleteSession={handleCompleteSession}
      />
      <AppLayout hasFixedHeader={isFixedHeaderActive}>
        <div className="flex flex-col gap-6">
          <Alert className="bg-amber-50 border-amber-200 rounded-2xl">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <AlertDescription className="text-sm text-amber-900 font-bold">
              DEMO MODE: You are viewing a sandbox session. No data will be saved to the database. 
              Some deep-nested components (like Muscle Log) may appear empty as they require real database IDs.
            </AlertDescription>
          </Alert>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <Breadcrumbs 
              items={[
                { label: "Debug", path: "/debug" },
                { label: "Demo Session" }
              ]} 
              className="mb-0"
            />
            <div className="flex items-center gap-2">
              {!isFixedHeaderActive && appointment.status === 'Scheduled' && (
                <Button 
                  variant="default" 
                  size="sm" 
                  className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-lg shadow-rose-100"
                  onClick={handleStartSession}
                >
                  <Play size={16} className="mr-2 fill-current" />
                  Start Demo Session
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-white rounded-xl border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                onClick={handleCopySummary}
              >
                {copied ? <Check size={16} className="mr-2 text-emerald-500" /> : <Copy size={16} className="mr-2" />}
                {copied ? "Copied!" : "Copy Summary"}
              </Button>
              <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-xl"><MoreHorizontal size={20} /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => showSuccess("Deleted (Demo Mode)")}>
                          <Trash2 size={16} className="mr-2" /> Delete Demo
                      </DropdownMenuItem>
                  </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/30">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="secondary" className="font-bold bg-white border-slate-200 text-slate-600">{appointment.display_id}</Badge>
                    <Badge className="bg-indigo-600 text-white border-none">{appointment.tag}</Badge>
                    <Select value={appointment.status} onValueChange={(newStatus) => saveField('status', newStatus)}>
                      <SelectTrigger className={cn("h-8 w-[130px] text-xs font-bold border-slate-200 shadow-sm bg-white", appointment.status === 'Completed' ? "text-emerald-600" : "text-indigo-600")}>
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>{APPOINTMENT_STATUSES.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight">Demo Practice Session</h1>
                  <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-500">
                    <div className="flex items-center gap-1.5"><Calendar size={16} className="text-indigo-400" /> {format(appointment.date, "EEEE, MMMM d, yyyy")}</div>
                    <div className="flex items-center gap-1.5"><Clock size={16} className="text-indigo-400" /> {format(appointment.date, "h:mm a")}</div>
                    <div className="flex items-center gap-1.5 text-indigo-600 font-bold">
                      <User size={16} /> {appointment.clients.name}
                    </div>
                    {clientBorn && (
                      <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
                        <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md text-[10px] font-black uppercase">{calculateAge(clientBorn)} yrs</span>
                        <span className="flex items-center gap-1 text-amber-600 font-bold text-[10px] uppercase tracking-wider">
                          <Star size={12} className="fill-amber-500" /> {getStarSign(clientBorn)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                  <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors", appointment.hydrated ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600")}>
                      <Droplets size={20} />
                    </div>
                    <div className="pr-2">
                      <Label htmlFor="hydration-toggle" className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Hydration</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-700">{appointment.hydrated ? "Passed" : "Needs Attention"}</span>
                        <Switch id="hydration-toggle" checked={appointment.hydrated || false} onCheckedChange={(checked) => saveField('hydrated', checked)} className="data-[state=checked]:bg-emerald-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              <EditableField field="goal" label="Session Goal" value={appointment.goal} placeholder="What is the primary goal?" onSave={saveField} className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100" />
              <EditableField field="issue" label="Main Concern / Issue" value={appointment.issue} placeholder="Describe the concern..." onSave={saveField} className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100" />
            </div>
          </Card>

          <SessionContentSwitcher 
            appointment={appointment} 
            onUpdate={() => console.log("[Demo Mode] Refresh requested")} 
            saveField={saveField} 
          />
        </div>
      </AppLayout>
    </>
  );
};

export default DemoSessionPage;