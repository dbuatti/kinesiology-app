"use client";

import React, { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Clock, 
  Droplets, 
  Star, 
  FlaskConical, 
  Activity,
  ChevronRight,
  ShieldAlert,
  Copy,
  Check,
  DollarSign,
  UserCircle
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
import { calculateBrainstemTone } from "@/utils/brainstem-logic";
import { showSuccess } from "@/utils/toast";

interface AppointmentHeaderProps {
  appointment: AppointmentWithClient;
  onSaveField: (field: string, value: any) => Promise<void>;
  onUpdate: () => void;
}

const AppointmentHeader = ({ appointment, onSaveField, onUpdate }: AppointmentHeaderProps) => {
  const [assessmentModal, setAssessmentModal] = useState<{ open: boolean; type: 'bolt' | 'coherence' } | null>(null);
  const [idCopied, setIdCopied] = useState(false);
  const clientBorn = appointment.clients.born ? new Date(appointment.clients.born) : null;
  const isSessionToday = isToday(appointment.date);

  const neuralLoad = useMemo(() => {
    const nuclei = calculateBrainstemTone(appointment.priority_pattern || null);
    return Math.round(nuclei.reduce((sum, n) => sum + n.threatLevel, 0) / 4);
  }, [appointment.priority_pattern]);

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    const id = appointment.display_id || appointment.id;
    navigator.clipboard.writeText(id);
    setIdCopied(true);
    showSuccess("Session ID copied");
    setTimeout(() => setIdCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="flex items-start gap-6">
          <div className="relative group">
            <div className="w-24 h-24 rounded-[2.5rem] bg-indigo-600 text-white flex items-center justify-center text-4xl font-black shadow-2xl shadow-indigo-200 dark:shadow-indigo-900/20 group-hover:scale-105 transition-transform duration-500">
              {appointment.clients.name.charAt(0)}
            </div>
            {isSessionToday && (
              <span className="absolute -top-1 -right-1 w-6 h-6 bg-rose-500 border-4 border-background rounded-full animate-pulse" />
            )}
          </div>
          
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <button 
                onClick={handleCopyId}
                className="group/id flex items-center gap-1.5"
              >
                <Badge variant="secondary" className="font-black bg-slate-100 dark:bg-slate-800 border-none text-muted-foreground text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-lg group-hover/id:bg-indigo-50 group-hover/id:text-indigo-600 transition-colors">
                  {appointment.display_id || appointment.id.slice(0, 8)}
                  {idCopied ? <Check size={10} className="ml-1 text-emerald-500" /> : <Copy size={10} className="ml-1 opacity-0 group-hover/id:opacity-100 transition-opacity" />}
                </Badge>
              </button>
              <Badge className="bg-indigo-600 text-white border-none font-black text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-lg shadow-sm">
                {appointment.tag}
              </Badge>
              <Select value={appointment.status} onValueChange={(newStatus) => onSaveField('status', newStatus)}>
                <SelectTrigger className={cn(
                  "h-7 w-[120px] text-[9px] font-black uppercase tracking-widest border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 rounded-lg",
                  appointment.status === 'Completed' ? "text-emerald-600" : "text-indigo-600"
                )}>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl p-1">
                  {APPOINTMENT_STATUSES.map(status => (
                    <SelectItem 
                      key={status} 
                      value={status}
                      className="rounded-xl text-[10px] font-bold uppercase tracking-wider py-2.5 px-4 cursor-pointer"
                    >
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1">
              <h1 className="text-5xl font-black text-foreground tracking-tighter flex items-center gap-4">
                {appointment.clients.name}
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl text-slate-300 hover:text-indigo-600 hover:bg-indigo-50" asChild>
                  <a href={`/clients/${appointment.clients.id}`}><UserCircle size={28} /></a>
                </Button>
              </h1>
              
              <div className="flex flex-wrap items-center gap-6 text-sm font-bold text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-indigo-400" /> 
                  {format(appointment.date, "EEEE, MMMM d")}
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-indigo-400" /> 
                  {format(appointment.date, "h:mm a")}
                </div>
                {clientBorn && (
                  <div className="flex items-center gap-4 border-l border-border pl-6">
                    <span className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider">
                      {calculateAge(clientBorn)} yrs
                    </span>
                    <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-black text-[10px] uppercase tracking-widest">
                      <Star size={16} className="fill-amber-500" /> {getStarSign(clientBorn)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Vitals Bar */}
        <div className="flex flex-wrap items-center gap-3 lg:justify-end">
          <div className={cn(
            "flex flex-col justify-center px-6 py-3 rounded-[2rem] border-2 transition-all duration-500 min-w-[140px]",
            neuralLoad > 50 ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"
          )}>
            <p className="text-[8px] font-black uppercase tracking-[0.3em] opacity-60 mb-1">Neural Load</p>
            <div className="flex items-center gap-3">
              <ShieldAlert size={20} className={neuralLoad > 50 ? "text-rose-600" : "text-emerald-600"} />
              <span className="text-2xl font-black leading-none">{neuralLoad}%</span>
            </div>
          </div>

          <div className={cn(
            "flex flex-col justify-center px-6 py-3 rounded-[2rem] border-2 transition-all duration-500 min-w-[140px]",
            appointment.is_paid 
              ? (appointment.payment_received ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-amber-50 border-amber-200 text-amber-700")
              : "bg-slate-50 border-slate-200 text-slate-400"
          )}>
            <p className="text-[8px] font-black uppercase tracking-[0.3em] opacity-60 mb-1">Payment</p>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <DollarSign size={18} className={appointment.is_paid ? (appointment.payment_received ? "text-emerald-600" : "text-amber-600") : "text-slate-400"} />
                <span className="text-sm font-black">
                  {!appointment.is_paid ? "FREE" : (appointment.payment_received ? "PAID" : "DUE")}
                </span>
              </div>
              <Switch 
                checked={appointment.payment_received || false} 
                onCheckedChange={(checked) => onSaveField('payment_received', checked)} 
                disabled={!appointment.is_paid}
                className="data-[state=checked]:bg-emerald-500 scale-75" 
              />
            </div>
          </div>

          <div className={cn(
            "flex flex-col justify-center px-6 py-3 rounded-[2rem] border-2 transition-all duration-500 min-w-[140px]",
            appointment.hydrated ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-rose-50 border-rose-200 text-rose-700"
          )}>
            <p className="text-[8px] font-black uppercase tracking-[0.3em] opacity-60 mb-1">Hydration</p>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Droplets size={18} className={appointment.hydrated ? "text-blue-600" : "text-rose-600"} />
                <span className="text-sm font-black">
                  {appointment.hydrated ? "PASS" : "FAIL"}
                </span>
              </div>
              <Switch 
                checked={appointment.hydrated || false} 
                onCheckedChange={(checked) => onSaveField('hydrated', checked)} 
                className="data-[state=checked]:bg-blue-500 scale-75" 
              />
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