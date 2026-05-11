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
  CalendarClock,
  Wallet,
  CheckCircle2,
  ExternalLink,
  Zap,
  LucideIcon
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

interface VitalCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subValue?: string;
  color?: 'rose' | 'emerald' | 'blue' | 'indigo' | 'slate';
  onClick?: () => void;
  children?: React.ReactNode;
}

const VitalCard = ({ icon: Icon, label, value, subValue, color, onClick, children }: VitalCardProps) => (
  <div 
    onClick={onClick}
    className={cn(
      "flex-1 min-w-[120px] p-3 rounded-2xl border transition-all duration-300 group cursor-pointer",
      color === 'rose' ? "bg-rose-50/30 border-rose-100 hover:border-rose-300" :
      color === 'emerald' ? "bg-emerald-50/30 border-emerald-100 hover:border-emerald-300" :
      color === 'blue' ? "bg-blue-50/30 border-blue-100 hover:border-blue-300" :
      "bg-white border-slate-100 hover:border-indigo-200"
    )}
  >
    <div className="flex items-center justify-between mb-1.5">
      <div className={cn(
        "w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-500 group-hover:scale-110",
        color === 'rose' ? "bg-rose-100 text-rose-600" :
        color === 'emerald' ? "bg-emerald-100 text-emerald-600" :
        color === 'blue' ? "bg-blue-100 text-blue-600" :
        "bg-slate-50 text-slate-400"
      )}>
        <Icon size={14} />
      </div>
      {children}
    </div>
    <div className="space-y-0.5">
      <p className="text-[7px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className={cn(
          "text-base font-black tracking-tight",
          color === 'rose' ? "text-rose-700" :
          color === 'emerald' ? "text-emerald-700" :
          color === 'blue' ? "text-blue-700" :
          "text-slate-900"
        )}>{value}</span>
        {subValue && <span className="text-[9px] font-bold text-slate-400">{subValue}</span>}
      </div>
    </div>
  </div>
);

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
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-[1.5rem] bg-indigo-600 text-white flex items-center justify-center text-2xl md:text-3xl font-black shadow-xl shadow-indigo-200 dark:shadow-none">
              {appointment.clients.name.charAt(0)}
            </div>
            {isSessionToday && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 border-2 border-background rounded-full animate-pulse" />
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
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all">
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
                  <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-50 group-hover:scale-110 transition-all shadow-sm">
                    <Calendar size={14} />
                  </div>
                  <span className="text-xs font-bold text-slate-600">{format(appointment.date, "EEEE, MMM d")}</span>
                </button>
                <button 
                  onClick={() => setRescheduleOpen(true)}
                  className="flex items-center gap-2 hover:text-indigo-600 transition-all group"
                >
                  <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-50 group-hover:scale-110 transition-all shadow-sm">
                    <Clock size={14} />
                  </div>
                  <span className="text-xs font-bold text-slate-600">{format(appointment.date, "h:mm a")}</span>
                </button>
              </div>

              <div className="h-4 w-px bg-slate-100 hidden md:block" />

              <div className="flex items-center gap-2">
                <Select value={appointment.status} onValueChange={(newStatus) => onSaveField('status', newStatus)}>
                  <SelectTrigger className={cn(
                    "h-8 w-[130px] text-[10px] font-black uppercase tracking-widest border-slate-200 bg-white rounded-lg shadow-sm",
                    appointment.status === 'Completed' ? "text-emerald-600 border-emerald-100" : "text-indigo-600"
                  )}>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-3xl p-1">
                    {APPOINTMENT_STATUSES.map(status => (
                      <SelectItem 
                        key={status} 
                        value={status}
                        className="rounded-lg text-[9px] font-bold uppercase tracking-wider py-2 px-4 cursor-pointer"
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

        <div className="flex flex-wrap items-center gap-3 p-2 bg-slate-100/50 rounded-[1.5rem] border border-slate-100 shadow-inner">
          <VitalCard 
            icon={ShieldAlert} 
            label="Neural Load" 
            value={`${neuralLoad}%`} 
            color={neuralLoad > 50 ? 'rose' : 'indigo'}
          >
            <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", neuralLoad > 50 ? "bg-rose-500" : "bg-indigo-400")} />
          </VitalCard>

          <VitalCard 
            icon={Wallet} 
            label="Billing" 
            value={!appointment.is_paid ? "FREE" : (appointment.payment_received ? "PAID" : `$${appointment.price_amount || 50}`)} 
            color={appointment.is_paid ? (appointment.payment_received ? 'emerald' : 'rose') : 'slate'}
            onClick={handlePaymentClick}
          >
            {appointment.is_paid && (
              <div className={cn("w-1.5 h-1.5 rounded-full", appointment.payment_received ? "bg-emerald-500" : "bg-rose-500")} />
            )}
          </VitalCard>

          <VitalCard 
            icon={Droplets} 
            label="Hydration" 
            value={appointment.hydrated ? "OPTIMAL" : "THREAT"} 
            color={appointment.hydrated ? 'blue' : 'rose'}
          >
            <Switch 
              checked={appointment.hydrated || false} 
              onCheckedChange={(checked) => onSaveField('hydrated', checked)} 
              className="data-[state=checked]:bg-blue-500 data-[state=unchecked]:bg-rose-400 scale-[0.6]" 
            />
          </VitalCard>
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
          <div className="p-10">
            <DialogHeader className="mb-8">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl">
                  <CalendarClock size={28} />
                </div>
                <div>
                  <DialogTitle className="text-3xl font-black">Reschedule Session</DialogTitle>
                  <DialogDescription className="text-base font-medium">Update the date, time, or details for this session.</DialogDescription>
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