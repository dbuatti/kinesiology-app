"use client";

import React, { useMemo } from "react";
import { 
  Calendar, 
  Clock, 
  Droplets, 
  ShieldAlert, 
  CreditCard, 
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { APPOINTMENT_STATUSES } from "@/data/appointment-data";
import { AppointmentWithClient } from "@/types/crm";
import { calculateBrainstemTone } from "@/utils/brainstem-logic";
import { Badge } from "@/components/ui/badge";

interface AppointmentHeaderProps {
  appointment: AppointmentWithClient;
  onSaveField: (field: string, value: any) => Promise<void>;
  onUpdate: () => void;
}

const AppointmentHeader = ({ appointment, onSaveField }: AppointmentHeaderProps) => {
  const neuralLoad = useMemo(() => {
    const nuclei = calculateBrainstemTone(appointment.priority_pattern || null);
    return Math.round(nuclei.reduce((sum, n) => sum + n.threatLevel, 0) / 4);
  }, [appointment.priority_pattern]);

  return (
    <div className="h-14 border-b border-border bg-white flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-primary" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-600">
            {format(appointment.date, "MMM d, yyyy")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-primary" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-600">
            {format(appointment.date, "h:mm a")}
          </span>
        </div>
        
        <div className="h-6 w-px bg-border" />

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <ShieldAlert size={14} className={cn(neuralLoad > 50 ? "text-destructive" : "text-primary")} />
            <span className="text-[11px] font-black uppercase tracking-widest">Load: {neuralLoad}%</span>
          </div>
          <div className="flex items-center gap-2">
            <CreditCard size={14} className={cn(appointment.payment_received ? "text-success" : "text-destructive")} />
            <span className="text-[11px] font-black uppercase tracking-widest">
              {appointment.payment_received ? "PAID" : "DUE"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Select value={appointment.status} onValueChange={(newStatus) => onSaveField('status', newStatus)}>
          <SelectTrigger className="h-8 w-32 text-[10px] font-black uppercase tracking-widest border-slate-200 rounded-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-none border-2 border-slate-900">
            {APPOINTMENT_STATUSES.map(status => (
              <SelectItem key={status} value={status} className="text-[10px] font-bold uppercase py-2">{status}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Badge variant="outline" className="rounded-none border-slate-200 text-slate-400 font-mono text-[9px] px-2 py-0.5">
          {appointment.display_id || appointment.id.slice(0,8)}
        </Badge>
      </div>
    </div>
  );
};

export default AppointmentHeader;