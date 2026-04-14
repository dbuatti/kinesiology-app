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
  DollarSign,
  UserCircle,
  ChevronDown,
  CalendarClock
} from "lucide-react";
import { format, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import { calculateAge } from "@/utils/crm-utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { APPOINTMENT_STATUSES } from "@/data/appointment-data";
import { AppointmentWithClient } from "@/types/crm";
import QuickAssessmentModal from "./QuickAssessmentModal";
import AppointmentForm from "./AppointmentForm";
import { calculateBrainstemTone } from "@/utils/brainstem-logic";
import { showSuccess } from "@/utils/toast";

interface AppointmentHeaderProps {
  appointment: AppointmentWithClient;
  onSaveField: (field: string, value: any) => Promise<void>;
  onUpdate: () => void;
}

const AppointmentHeader = ({ appointment, onSaveField, onUpdate }: AppointmentHeaderProps) => {
  const [assessmentModal, setAssessmentModal] = useState<{ open: boolean; type: 'bolt' | 'coherence' } | null>(null);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const clientBorn = appointment.clients.born ? new Date(appointment.clients.born) : null;
  const isSessionToday = isToday(appointment.date);

  const neuralLoad = useMemo(() => {
    const nuclei = calculateBrainstemTone(appointment.priority_pattern || null);
    return Math.round(nuclei.reduce((sum, n) => sum + n.threatLevel, 0) / 4);
  }, [appointment.priority_pattern]);

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
        <div className="flex items-center gap-3 md:gap-5">
          <div className="relative group shrink-0">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-xl md:text-2xl font-black shadow-xl">
              {appointment.clients.name.charAt(0)}
            </div>
            {isSessionToday && (
              <span className="absolute -top-1 -right-1 w-3 h-3 md:w-4 md:h-4 bg-rose-500 border-2 border-background rounded-full animate-pulse" />
            )}
          </div>
          
          <div className="space-y-0.5 md:space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-3xl font-black text-foreground tracking-tighter truncate">
                {appointment.clients.name}
              </h1>
              <Button variant="ghost" size="icon" className="h-7 w-7 md:h-8 md:w-8 rounded-lg md:rounded-xl text-slate-300 hover:text-indigo-600" asChild>
                <a href={`/clients/${appointment.clients.id}`}><UserCircle size={18} /></a>
              </Button>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 md:gap-4 text-[10px] md:text-xs font-bold text-muted-foreground">
              <button 
                onClick={() => setRescheduleOpen(true)}
                className="flex items-center gap-1 hover:text-indigo-600 transition-colors group"
              >
                <Calendar size={12} className="text-indigo-400 group-hover:scale-110 transition-transform" /> 
                {format(appointment.date, "MMM d")}
              </button>
              <button 
                onClick={() => setRescheduleOpen(true)}
                className="flex items-center gap-1 hover:text-indigo-600 transition-colors group"
              >
                <Clock size={12} className="text-indigo-400 group-hover:scale-110 transition-transform" /> 
                {format(appointment.date, "h:mm a")}
              </button>
              <Select value={appointment.status} onValueChange={(newStatus) => onSaveField('status', newStatus)}>
                <SelectTrigger className={cn(
                  "h-5 md:h-6 w-[80px] md:w-[100px] text-[7px] md:text-[8px] font-black uppercase tracking-widest border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-md",
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
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setRescheduleOpen(true)}
                className="h-5 md:h-6 px-2 text-[7px] md:text-[8px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 rounded-md"
              >
                <CalendarClock size={10} className="mr-1" /> Reschedule
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className={cn(
            "flex items-center gap-1.5 px-2 py-1 md:px-3 md:py-1.5 rounded-lg md:rounded-xl border transition-all",
            neuralLoad > 50 ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"
          )}>
            <ShieldAlert size={12} className="md:w-3.5 md:h-3.5" />
            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">Load: {neuralLoad}%</span>
          </div>

          <div className={cn(
            "flex items-center gap-2 px-2 py-1 md:px-3 md:py-1.5 rounded-lg md:rounded-xl border transition-all",
            appointment.is_paid
              ? (appointment.payment_received ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-amber-50 border-amber-200 text-amber-700")
              : "bg-slate-50 border-slate-200 text-slate-400"
          )}>
            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">
              {!appointment.is_paid ? "FREE" : (appointment.payment_received ? "PAID" : `DUE ${appointment.price_amount ? `$${appointment.price_amount}` : ''}`)}
            </span>
            <Switch
              checked={appointment.payment_received || false}
              onCheckedChange={(checked) => onSaveField('payment_received', checked)}
              disabled={!appointment.is_paid}
              className="data-[state=checked]:bg-emerald-500 scale-[0.6] md:scale-75"
            />
          </div>

          <div className={cn(
            "flex items-center gap-2 px-2 py-1 md:px-3 md:py-1.5 rounded-lg md:rounded-xl border transition-all",
            appointment.hydrated ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-rose-50 border-rose-200 text-rose-700"
          )}>
            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">
              {appointment.hydrated ? "HYDRATED" : "DEHYDRATED"}
            </span>
            <Switch 
              checked={appointment.hydrated || false} 
              onCheckedChange={(checked) => onSaveField('hydrated', checked)} 
              className="data-[state=checked]:bg-blue-500 scale-[0.6] md:scale-75" 
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

      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto rounded-[2rem] p-0">
          <div className="p-8">
            <DialogHeader className="mb-6">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                  <CalendarClock size={24} />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black">Reschedule Session</DialogTitle>
                  <DialogDescription className="font-medium">Update the date, time, or details for this session.</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <AppointmentForm 
              existingAppointment={appointment}
              onSuccess={() => {
                setRescheduleOpen(false);
                onUpdate();
              }} 
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppointmentHeader;