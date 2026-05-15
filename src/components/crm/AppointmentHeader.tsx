"use client";

import React, { useState, useMemo } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
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
import { showSuccess } from "@/utils/toast";

interface AppointmentHeaderProps {
  appointment: AppointmentWithClient;
  onSaveField: (field: string, value: any) => Promise<void>;
  onUpdate: () => void;
}

const AppointmentHeader = ({ appointment, onSaveField, onUpdate }: AppointmentHeaderProps) => {
  const neuralLoad = useMemo(() => {
    const nuclei = calculateBrainstemTone(appointment.priority_pattern || null);
    return Math.round(nuclei.reduce((sum, n) => sum + n.threatLevel, 0) / 4);
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
    <div className="space-y-8">
      {/* ROW 1: APPOINTMENT METADATA */}
      <div className="flex flex-wrap items-center gap-8 border-b border-border pb-8">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Calendar size={16} className="text-primary" />
          <span className="text-[10px] font-bold uppercase tracking-widest">{format(appointment.date, "EEEE, MMMM DO, YYYY")}</span>
        </div>
        <div className="flex items-center gap-3 text-muted-foreground">
          <Clock size={16} className="text-primary" />
          <span className="text-[10px] font-bold uppercase tracking-widest">{format(appointment.date, "h:mm A")}</span>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Status</span>
          <Select value={appointment.status} onValueChange={(newStatus) => onSaveField('status', newStatus)}>
            <SelectTrigger className={cn(
              "h-10 w-auto min-w-[160px] text-[10px] font-bold uppercase tracking-widest border-border bg-background rounded-none",
              appointment.status === 'Completed' ? "text-success border-success" : "text-primary"
            )}>
              <SelectValue placeholder={appointment.status} />
            </SelectTrigger>
            <SelectContent className="rounded-none border border-border bg-background">
              {APPOINTMENT_STATUSES.map(status => (
                <SelectItem 
                  key={status} 
                  value={status}
                  className="text-[10px] font-bold uppercase tracking-widest py-3 px-4 focus:bg-muted"
                >
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="ml-auto">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
            ID: {appointment.display_id || appointment.id.slice(0,8)}
          </span>
        </div>
      </div>

      {/* ROW 2: CLINICAL VITALS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 border border-border">
        <div className="p-8 border-r border-border last:border-r-0 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 border border-border flex items-center justify-center text-primary">
              <ShieldAlert size={18} />
            </div>
            <div className={cn(
              "w-2 h-2", 
              neuralLoad > 50 ? "bg-destructive" : "bg-primary"
            )} />
          </div>
          <div className="space-y-1">
            <p className="text-[8px] font-bold uppercase text-muted-foreground tracking-widest">Neural Load</p>
            <p className="text-2xl font-bold uppercase tracking-tight">{neuralLoad}%</p>
          </div>
        </div>

        <div 
          onClick={handlePaymentClick}
          className="p-8 border-r border-border last:border-r-0 flex flex-col gap-4 cursor-pointer hover:bg-muted transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 border border-border flex items-center justify-center text-primary">
              <CreditCard size={18} />
            </div>
            {appointment.is_paid && (
              <div className={cn(
                "w-2 h-2", 
                appointment.payment_received ? "bg-success" : "bg-destructive"
              )} />
            )}
          </div>
          <div className="space-y-1">
            <p className="text-[8px] font-bold uppercase text-muted-foreground tracking-widest">Billing</p>
            <p className="text-2xl font-bold uppercase tracking-tight">
              {!appointment.is_paid ? "FREE" : (appointment.payment_received ? "PAID" : `$${appointment.price_amount || 50}`)}
            </p>
          </div>
        </div>

        <div className="p-8 border-r border-border last:border-r-0 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 border border-border flex items-center justify-center text-primary">
              <Droplets size={18} />
            </div>
            <Switch 
              checked={appointment.hydrated || false} 
              onCheckedChange={(checked) => onSaveField('hydrated', checked)} 
              className="data-[state=checked]:bg-success data-[state=unchecked]:bg-destructive" 
            />
          </div>
          <div className="space-y-1">
            <p className="text-[8px] font-bold uppercase text-muted-foreground tracking-widest">Hydration</p>
            <p className="text-2xl font-bold uppercase tracking-tight">
              {appointment.hydrated ? "PASS" : "NEEDS WATER"}
            </p>
          </div>
        </div>
      </div>

      {/* ROW 3: ALERT STRIP */}
      {alerts.length > 0 && (
        <div className="space-y-0 border border-border">
          {alerts.map((alert, i) => (
            <div key={i} className={cn(
              "flex items-center gap-6 p-6 border-b border-border last:border-b-0",
              alert.type === 'critical' ? "bg-destructive/10" : "bg-destructive/5"
            )}>
              <alert.icon size={20} className="text-destructive shrink-0" />
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-destructive">{alert.label}</span>
                <span className="text-sm font-bold uppercase tracking-tight">{alert.reason}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AppointmentHeader;