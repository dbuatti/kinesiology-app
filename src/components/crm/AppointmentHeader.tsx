"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Clock, 
  Droplets, 
  Star, 
  FlaskConical, 
  Activity,
  User,
  ChevronRight
} from "lucide-react";
import { format, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import { calculateAge, getStarSign } from "@/utils/crm-utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { APPOINTMENT_STATUSES } from "@/data/appointment-data";
import { AppointmentWithClient } from "@/types/crm";
import QuickAssessmentModal from "./QuickAssessmentModal";

interface AppointmentHeaderProps {
  appointment: AppointmentWithClient;
  onSaveField: (field: string, value: any) => Promise<void>;
  onUpdate: () => void;
}

const AppointmentHeader = ({ appointment, onSaveField, onUpdate }: AppointmentHeaderProps) => {
  const [assessmentModal, setAssessmentModal] = useState<{ open: boolean; type: 'bolt' | 'coherence' } | null>(null);
  const clientBorn = appointment.clients.born ? new Date(appointment.clients.born) : null;
  const isSessionToday = isToday(appointment.date);

  return (
    <div className="p-8 border-b border-slate-100 bg-white">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="flex items-start gap-6">
          <div className="relative group">
            <div className="w-20 h-20 rounded-[2rem] bg-indigo-600 text-white flex items-center justify-center text-3xl font-black shadow-2xl shadow-indigo-200 group-hover:scale-105 transition-transform duration-500">
              {appointment.clients.name.charAt(0)}
            </div>
            {isSessionToday && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 border-4 border-white rounded-full animate-pulse" />
            )}
          </div>
          
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary" className="font-black bg-slate-100 border-none text-slate-500 text-[9px] uppercase tracking-widest px-3 py-1 rounded-lg">
                {appointment.display_id || appointment.id.slice(0, 8)}
              </Badge>
              <Badge className="bg-indigo-600 text-white border-none font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-lg">
                {appointment.tag}
              </Badge>
              <Select value={appointment.status} onValueChange={(newStatus) => onSaveField('status', newStatus)}>
                <SelectTrigger className={cn(
                  "h-7 w-[120px] text-[9px] font-black uppercase tracking-widest border-slate-200 shadow-sm bg-white rounded-lg",
                  appointment.status === 'Completed' ? "text-emerald-600" : "text-indigo-600"
                )}>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-2xl p-1">
                  {APPOINTMENT_STATUSES.map(status => (
                    <SelectItem key={status} value={status} className="rounded-lg text-[10px] font-bold uppercase tracking-wider">{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              {appointment.clients.name}
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-300 hover:text-indigo-600" asChild>
                <a href={`/clients/${appointment.clients.id}`}><ChevronRight size={20} /></a>
              </Button>
            </h1>
            
            <div className="flex flex-wrap items-center gap-6 text-sm font-bold text-slate-500">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-indigo-400" /> 
                {format(appointment.date, "EEEE, MMM d")}
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-indigo-400" /> 
                {format(appointment.date, "h:mm a")}
              </div>
              {clientBorn && (
                <div className="flex items-center gap-4 border-l border-slate-200 pl-6">
                  <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">
                    {calculateAge(clientBorn)} yrs
                  </span>
                  <span className="flex items-center gap-1.5 text-amber-600 font-black text-[10px] uppercase tracking-widest">
                    <Star size={14} className="fill-amber-500" /> {getStarSign(clientBorn)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 lg:justify-end">
          {isSessionToday && appointment.status !== 'Completed' && (
            <div className="flex gap-2 mr-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="h-10 rounded-xl border-indigo-100 bg-indigo-50/50 text-indigo-600 hover:bg-indigo-100 font-black text-[10px] uppercase tracking-widest px-4"
                onClick={() => setAssessmentModal({ open: true, type: 'bolt' })}
              >
                <FlaskConical size={14} className="mr-2" /> Log BOLT
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="h-10 rounded-xl border-rose-100 bg-rose-50/50 text-rose-600 hover:bg-rose-100 font-black text-[10px] uppercase tracking-widest px-4"
                onClick={() => setAssessmentModal({ open: true, type: 'coherence' })}
              >
                <Activity size={14} className="mr-2" /> Log COH
              </Button>
            </div>
          )}

          <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 shadow-sm",
              appointment.hydrated ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
            )}>
              <Droplets size={20} />
            </div>
            <div className="pr-2">
              <Label htmlFor="hydration-toggle" className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-0.5">
                Hydration
              </Label>
              <div className="flex items-center gap-3">
                <span className={cn("text-xs font-black", appointment.hydrated ? "text-emerald-600" : "text-rose-600")}>
                  {appointment.hydrated ? "PASSED" : "ATTENTION"}
                </span>
                <Switch 
                  id="hydration-toggle" 
                  checked={appointment.hydrated || false} 
                  onCheckedChange={(checked) => onSaveField('hydrated', checked)} 
                  className="data-[state=checked]:bg-emerald-500 scale-90" 
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {assessmentModal && (
        <QuickAssessmentModal 
          open={assessmentModal.open}
          onOpenChange={(open) => !open && setAssessmentModal(null)}
          clientId={appointment.clients.id}
          clientName={appointment.clients.name}
          type={assessmentModal.type}
          onComplete={onUpdate}
        />
      )}
    </div>
  );
};

export default AppointmentHeader;