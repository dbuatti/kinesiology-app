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
  UserCircle,
  AlertCircle,
  ChevronDown
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

  const isPaymentDue = appointment.is_paid && !appointment.payment_received;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="relative group">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-2xl font-black shadow-xl shadow-indigo-100 dark:shadow-indigo-900/20 group-hover:scale-105 transition-transform duration-500">
              {appointment.clients.name.charAt(0)}
            </div>
            {isSessionToday && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 border-2 border-background rounded-full animate-pulse" />
            )}
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-foreground tracking-tighter">
                {appointment.clients.name}
              </h1>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-slate-300 hover:text-indigo-600 hover:bg-indigo-50" asChild>
                <a href={`/clients/${appointment.clients.id}`}><UserCircle size={20} /></a>
              </Button>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar size={14} className="text-indigo-400" /> 
                {format(appointment.date, "MMM d")}
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={14} className="text-indigo-400" /> 
                {format(appointment.date, "h:mm a")}
              </div>
              <Badge variant="secondary" className="font-black bg-slate-100 dark:bg-slate-800 border-none text-muted-foreground text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-md">
                {appointment.tag}
              </Badge>
              <Select value={appointment.status} onValueChange={(newStatus) => onSaveField('status', newStatus)}>
                <SelectTrigger className={cn(
                  "h-6 w-[100px] text-[8px] font-black uppercase tracking-widest border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 rounded-md",
                  appointment.status === 'Completed' ? "text-emerald-600" : "text-indigo-600"
                )}>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-2xl p-1">
                  {APPOINTMENT_STATUSES.map(status => (
                    <SelectItem 
                      key={status} 
                      value={status}
                      className="rounded-lg text-[9px] font-bold uppercase tracking-wider py-2 px-3 cursor-pointer"
                    >
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Compact Vitals Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-500",
            neuralLoad > 50 ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"
          )}>
            <ShieldAlert size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Load: {neuralLoad}%</span>
          </div>

          <div className={cn(
            "flex items-center gap-3 px-3 py-1.5 rounded-xl border transition-all duration-500",
            appointment.is_paid 
              ? (appointment.payment_received ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-amber-50 border-amber-200 text-amber-700")
              : "bg-slate-50 border-slate-200 text-slate-400"
          )}>
            <div className="flex items-center gap-1.5">
              <DollarSign size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">
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

          <div className={cn(
            "flex items-center gap-3 px-3 py-1.5 rounded-xl border transition-all duration-500",
            appointment.hydrated ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-rose-50 border-rose-200 text-rose-700"
          )}>
            <div className="flex items-center gap-1.5">
              <Droplets size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">
                {appointment.hydrated ? "HYDRATED" : "DEHYDRATED"}
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