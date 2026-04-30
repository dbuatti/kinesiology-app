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
  CalendarClock,
  Cake,
  Wallet,
  CheckCircle2,
  User,
  ExternalLink
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
import { Link } from "react-router-dom";

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

  const handlePaymentClick = () => {
    if (!appointment.is_paid) {
      onSaveField('is_paid', true);
      showSuccess("Billing enabled for this session");
    } else {
      onSaveField('payment_received', !appointment.payment_received);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="flex items-start gap-5">
          <div className="relative shrink-0">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-[2rem] bg-indigo-600 text-white flex items-center justify-center text-2xl md:text-3xl font-black shadow-2xl shadow-indigo-200 dark:shadow-none">
              {appointment.clients.name.charAt(0)}
            </div>
            {isSessionToday && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 border-4 border-background rounded-full animate-pulse" />
            )}
          </div>
          
          <div className="space-y-2 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tighter truncate">
                {appointment.clients.name}
              </h1>
              <div className="flex items-center gap-2">
                {clientBorn && (
                  <Badge variant="outline" className="h-6 px-2 text-[10px] font-black border-indigo-100 text-indigo-600 bg-indigo-50/50 rounded-lg">
                    {calculateAge(clientBorn)} yrs
                  </Badge>
                )}
                <Link to={`/clients/${appointment.clients.id}`}>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all">
                    <ExternalLink size={18} />
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setRescheduleOpen(true)}
                  className="flex items-center gap-2 hover:text-indigo-600 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-50 group-hover:scale-110 transition-all">
                    <Calendar size={14} />
                  </div>
                  <span className="text-xs font-bold text-slate-600">{format(appointment.date, "EEEE, MMM d")}</span>
                </button>
                <button 
                  onClick={() => setRescheduleOpen(true)}
                  className="flex items-center gap-2 hover:text-indigo-600 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-50 group-hover:scale-110 transition-all">
                    <Clock size={14} />
                  </div>
                  <span className="text-xs font-bold text-slate-600">{format(appointment.date, "h:mm a")}</span>
                </button>
              </div>

              <div className="h-4 w-px bg-slate-100 hidden md:block" />

              <div className="flex items-center gap-3">
                <Select value={appointment.status} onValueChange={(newStatus) => onSaveField('status', newStatus)}>
                  <SelectTrigger className={cn(
                    "h-9 w-[130px] text-[10px] font-black uppercase tracking-widest border-slate-200 bg-white rounded-xl shadow-sm",
                    appointment.status === 'Completed' ? "text-emerald-600 border-emerald-100" : "text-indigo-600"
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
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-slate-50/50 p-2 rounded-[2rem] border border-slate-100">
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-2xl border transition-all shadow-sm",
            neuralLoad > 50 ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-white border-slate-100 text-slate-600"
          )}>
            <ShieldAlert size={16} className={cn(neuralLoad > 50 ? "text-rose-500" : "text-indigo-400")} />
            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Neural Load</span>
              <span className="text-sm font-black tabular-nums">{neuralLoad}%</span>
            </div>
          </div>

          <button 
            onClick={handlePaymentClick}
            className={cn(
              "flex items-center gap-3 px-4 py-2 rounded-2xl border transition-all group shadow-sm",
              appointment.is_paid
                ? (appointment.payment_received ? "bg-emerald-600 border-emerald-600 text-white" : "bg-white border-amber-200 text-amber-700 hover:border-amber-400")
                : "bg-white border-slate-100 text-slate-400 hover:border-indigo-200 hover:text-indigo-600"
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
              appointment.payment_received ? "bg-white/20" : "bg-slate-50 group-hover:bg-indigo-50"
            )}>
              {appointment.payment_received ? <CheckCircle2 size={16} /> : <Wallet size={16} className={cn(!appointment.is_paid ? "text-slate-300" : "text-amber-500")} />}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Billing</span>
              <span className="text-xs font-black">
                {!appointment.is_paid ? "FREE" : (appointment.payment_received ? "PAID" : `DUE: $${appointment.price_amount || 50}`)}
              </span>
            </div>
          </button>

          <div className={cn(
            "flex items-center gap-3 px-4 py-2 rounded-2xl border transition-all shadow-sm",
            appointment.hydrated ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-rose-200 text-rose-600"
          )}>
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
              appointment.hydrated ? "bg-white/20" : "bg-rose-50"
            )}>
              <Droplets size={16} className={cn(appointment.hydrated ? "text-white" : "text-rose-500")} />
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Hydration</span>
              <span className="text-xs font-black">{appointment.hydrated ? "OPTIMAL" : "THREAT"}</span>
            </div>
            <Switch 
              checked={appointment.hydrated || false} 
              onCheckedChange={(checked) => onSaveField('hydrated', checked)} 
              className="data-[state=checked]:bg-blue-400 data-[state=unchecked]:bg-rose-200 scale-75" 
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
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto rounded-[2.5rem] p-0">
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