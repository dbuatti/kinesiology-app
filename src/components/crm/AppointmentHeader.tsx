"use client";

import React, { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Clock, 
  Droplets, 
  FlaskConical, 
  Activity,
  ShieldAlert,
  ChevronDown,
  Wallet,
  CheckCircle2,
  Zap,
  LucideIcon,
  CreditCard,
  Info,
  AlertCircle,
  ArrowRight
} from "lucide-react";
import { format, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { APPOINTMENT_STATUSES } from "@/data/appointment-data";
import { AppointmentWithClient } from "@/types/crm";
import { calculateNeuralLoad } from "@/utils/brainstem-logic";
import { showSuccess } from "@/utils/toast";

interface VitalCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subValue?: string;
  color?: 'rose' | 'emerald' | 'blue' | 'indigo' | 'slate' | 'amber';
  onClick?: () => void;
  children?: React.ReactNode;
  tooltip?: string;
}

const VitalCard = ({ icon: Icon, label, value, subValue, color, onClick, children, tooltip }: VitalCardProps) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <div 
          onClick={onClick}
          className={cn(
            "flex-1 min-w-[120px] p-4 rounded-2xl border transition-all duration-500 group cursor-pointer relative overflow-hidden",
            color === 'rose' ? "bg-rose-50/30 border-rose-100 hover:border-rose-300" :
            color === 'emerald' ? "bg-emerald-50/30 border-emerald-100 hover:border-emerald-300" :
            color === 'blue' ? "bg-blue-50/30 border-blue-100 hover:border-blue-300" :
            color === 'amber' ? "bg-amber-50/30 border-amber-100 hover:border-amber-300" :
            "bg-slate-50/30 border-slate-100 hover:border-indigo-200"
          )}
        >
          <div className="flex items-center justify-between mb-2 relative z-10">
            <div className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-700 group-hover:scale-110 shadow-sm",
              color === 'rose' ? "bg-white text-rose-600" :
              color === 'emerald' ? "bg-white text-emerald-600" :
              color === 'blue' ? "bg-white text-blue-600" :
              color === 'amber' ? "bg-white text-amber-600" :
              "bg-white text-slate-400"
            )}>
              <Icon size={16} />
            </div>
            {children}
          </div>
          <div className="space-y-0.5 relative z-10">
            <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">{label}</p>
            <div className="flex items-baseline gap-1.5">
              <span className={cn(
                "text-lg font-black tracking-tight",
                color === 'rose' ? "text-rose-700" :
                color === 'emerald' ? "text-emerald-700" :
                color === 'blue' ? "text-blue-700" :
                color === 'amber' ? "text-amber-700" :
                "text-slate-900"
              )}>{value}</span>
              {subValue && <span className="text-[9px] font-bold text-slate-400">{subValue}</span>}
            </div>
          </div>
        </div>
      </TooltipTrigger>
      {tooltip && (
        <TooltipContent className="rounded-xl p-3 bg-slate-900 text-white border-none shadow-xl">
          <p className="text-[10px] font-bold uppercase tracking-widest">{tooltip}</p>
        </TooltipContent>
      )}
    </Tooltip>
  </TooltipProvider>
);

interface AppointmentHeaderProps {
  appointment: AppointmentWithClient;
  onSaveField: (field: string, value: any) => Promise<void>;
  onUpdate: () => void;
}

const AppointmentHeader = ({ appointment, onSaveField, onUpdate }: AppointmentHeaderProps) => {
  const neuralLoad = useMemo(() => {
    return calculateNeuralLoad(appointment.priority_pattern || null);
  }, [appointment.priority_pattern]);

  const handlePaymentClick = () => {
    if (!appointment.is_paid) {
      onSaveField('is_paid', true);
      showSuccess("Billing enabled for this session");
    } else {
      onSaveField('payment_received', !appointment.payment_received);
    }
  };

  const alerts = useMemo(() => {
    const list = [];
    if (!appointment.hydrated) list.push({ type: 'warning', label: 'Hydration Priority', reason: 'Systemic conductivity low. Recommend water + electrolytes.', icon: Droplets });
    if (appointment.bolt_score && appointment.bolt_score < 25) list.push({ type: 'critical', label: 'Low CO2 Tolerance', reason: 'BOLT score below functional threshold. Prioritize breathing recovery.', icon: AlertCircle });
    return list;
  }, [appointment.hydrated, appointment.bolt_score]);

  return (
    <div className="space-y-6">
      {/* ROW 1: APPOINTMENT METADATA */}
      <div className="flex flex-wrap items-center gap-6 px-2">
        <div className="flex items-center gap-2 text-slate-500">
          <Calendar size={14} className="text-indigo-400" />
          <span className="text-xs font-bold">{format(appointment.date, "EEEE, MMMM do, yyyy")}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-500">
          <Clock size={14} className="text-indigo-400" />
          <span className="text-xs font-bold">{format(appointment.date, "h:mm a")}</span>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status:</span>
          <Select value={appointment.status} onValueChange={(newStatus) => onSaveField('status', newStatus)}>
            <SelectTrigger className={cn(
              "h-8 w-auto min-w-[140px] text-[9px] font-black uppercase tracking-[0.15em] border-slate-200 bg-white rounded-lg shadow-sm transition-all px-3",
              appointment.status === 'Completed' ? "text-emerald-600 border-emerald-100 bg-emerald-50/30" : "text-indigo-600"
            )}>
              <div className="flex items-center gap-2">
                <div className={cn("w-1.5 h-1.5 rounded-full", appointment.status === 'Completed' ? "bg-emerald-500" : "bg-indigo-500")} />
                <SelectValue placeholder={appointment.status}>
                  {appointment.status}
                </SelectValue>
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-none shadow-3xl p-2 bg-white dark:bg-slate-900">
              {APPOINTMENT_STATUSES.map(status => (
                <SelectItem 
                  key={status} 
                  value={status}
                  className="rounded-xl text-[9px] font-black uppercase tracking-widest py-2.5 px-4 cursor-pointer"
                >
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="ml-auto">
          <Badge variant="outline" className="text-[9px] font-mono text-slate-300 border-slate-100 uppercase tracking-widest">
            ID: {appointment.display_id || appointment.id.slice(0,8)}
          </Badge>
        </div>
      </div>

      {/* ROW 2: CLINICAL VITALS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <VitalCard 
          icon={ShieldAlert} 
          label="Neural Load" 
          value={`${neuralLoad}%`} 
          color={neuralLoad > 50 ? 'rose' : 'indigo'}
          tooltip="Calculated threat level based on brainstem nuclei inhibition."
        >
          <div className={cn(
            "w-1.5 h-1.5 rounded-full shadow-lg", 
            neuralLoad > 50 ? "bg-rose-500 animate-pulse" : "bg-indigo-400"
          )} />
        </VitalCard>

        <VitalCard 
          icon={CreditCard} 
          label="Billing" 
          value={!appointment.is_paid ? "FREE" : (appointment.payment_received ? "PAID" : `$${appointment.price_amount || 50}`)} 
          color={appointment.is_paid ? (appointment.payment_received ? 'emerald' : 'rose') : 'slate'}
          onClick={handlePaymentClick}
          tooltip="Click to toggle payment status or enable billing."
        >
          {appointment.is_paid && (
            <div className={cn(
              "w-1.5 h-1.5 rounded-full", 
              appointment.payment_received ? "bg-emerald-500" : "bg-rose-500 animate-pulse"
            )} />
          )}
        </VitalCard>

        <VitalCard 
          icon={Droplets} 
          label="Hydration" 
          value={appointment.hydrated ? "PASS" : "Needs Water"} 
          color={appointment.hydrated ? 'blue' : 'amber'}
          tooltip="Hydration status affects neurological testing accuracy."
        >
          <Switch 
            checked={appointment.hydrated || false} 
            onCheckedChange={(checked) => onSaveField('hydrated', checked)} 
            className="data-[state=checked]:bg-blue-500 data-[state=unchecked]:bg-amber-400 scale-[0.6]" 
          />
        </VitalCard>
      </div>

      {/* ROW 3: ALERT STRIP */}
      {alerts.length > 0 && (
        <div className="space-y-2 animate-in slide-in-from-top-2 duration-500">
          {alerts.map((alert, i) => (
            <div key={i} className={cn(
              "flex items-center gap-3 p-3 rounded-xl border-2",
              alert.type === 'critical' ? "bg-rose-50 border-rose-100 text-rose-700" : "bg-amber-50 border-amber-100 text-amber-700"
            )}>
              <alert.icon size={16} className={cn("shrink-0", alert.type === 'critical' ? "text-rose-500" : "text-amber-500")} />
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest">{alert.label}:</span>
                <span className="text-xs font-bold">{alert.reason}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AppointmentHeader;