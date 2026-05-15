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
  LucideIcon,
  User,
  CreditCard,
  Info,
  AlertCircle,
  ArrowRight
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
            "flex-1 min-w-[140px] p-4 rounded-2xl border transition-all duration-500 group cursor-pointer relative overflow-hidden",
            color === 'rose' ? "bg-rose-50/30 border-rose-100 hover:border-rose-300" :
            color === 'emerald' ? "bg-emerald-50/30 border-emerald-100 hover:border-emerald-300" :
            color === 'blue' ? "bg-blue-50/30 border-blue-100 hover:border-blue-300" :
            color === 'amber' ? "bg-amber-50/30 border-amber-100 hover:border-amber-300" :
            "bg-slate-50/30 border-slate-100 hover:border-indigo-200"
          )}
        >
          <div className="flex items-center justify-between mb-3 relative z-10">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-700 group-hover:scale-110 shadow-sm",
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
            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</p>
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
          
          <div className={cn(
            "absolute -right-4 -bottom-4 w-16 h-16 rounded-full blur-2xl opacity-10 transition-all duration-700 group-hover:scale-150",
            color === 'rose' ? "bg-rose-400" :
            color === 'emerald' ? "bg-emerald-400" :
            color === 'blue' ? "bg-blue-400" :
            color === 'amber' ? "bg-amber-400" :
            "bg-indigo-400"
          )} />
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
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        {/* CLIENT INFO SECTION */}
        <div className="flex items-center gap-6 min-w-0">
          <div className="relative shrink-0 group">
            <div className="absolute inset-0 bg-indigo-600 rounded-3xl blur-2xl opacity-10 group-hover:opacity-30 transition-all duration-700" />
            <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-slate-900 text-white flex items-center justify-center text-3xl md:text-4xl font-black shadow-2xl transition-all duration-700 group-hover:scale-105 group-hover:rotate-3">
              {appointment.clients.name.charAt(0)}
            </div>
            {isSessionToday && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-rose-500 border-2 border-white dark:border-slate-900 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                <Zap size={12} className="text-white fill-current" />
              </div>
            )}
          </div>
          
          <div className="space-y-3 min-w-0">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 dark:text-white tracking-tighter truncate leading-none">
                  {appointment.clients.name}
                </h1>
                <Link to={`/clients/${appointment.clients.id}`}>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all">
                    <ExternalLink size={16} />
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="h-6 px-3 text-[8px] font-black border-indigo-100 text-indigo-600 bg-indigo-50/50 rounded-lg">
                  {appointment.display_id || "SESSION"}
                </Badge>
                {clientBorn && (
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {calculateAge(clientBorn)} YEARS OLD
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <button 
                  onClick={() => setRescheduleOpen(true)}
                  className="flex items-center gap-2 px-3 py-1 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-all group"
                >
                  <Calendar size={14} className="text-indigo-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{format(appointment.date, "EEE, MMM d")}</span>
                </button>
                <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
                <button 
                  onClick={() => setRescheduleOpen(true)}
                  className="flex items-center gap-2 px-3 py-1 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-all group"
                >
                  <Clock size={14} className="text-indigo-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{format(appointment.date, "h:mm a")}</span>
                </button>
              </div>

              <Select value={appointment.status} onValueChange={(newStatus) => onSaveField('status', newStatus)}>
                <SelectTrigger className={cn(
                  "h-10 w-[140px] text-[9px] font-black uppercase tracking-[0.2em] border-slate-200 bg-white rounded-xl shadow-sm transition-all",
                  appointment.status === 'Completed' ? "text-emerald-600 border-emerald-100 bg-emerald-50/30" : "text-indigo-600"
                )}>
                  <SelectValue placeholder="Status" />
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
          </div>
        </div>

        {/* VITALS GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full lg:w-auto">
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
            value={appointment.hydrated ? "PASS" : "FAIL"} 
            color={appointment.hydrated ? 'blue' : 'rose'}
            tooltip="Hydration status affects neurological testing accuracy."
          >
            <Switch 
              checked={appointment.hydrated || false} 
              onCheckedChange={(checked) => onSaveField('hydrated', checked)} 
              className="data-[state=checked]:bg-blue-500 data-[state=unchecked]:bg-rose-400 scale-75" 
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
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto rounded-[2.5rem] p-0 border-none shadow-3xl">
          <div className="p-10">
            <DialogHeader className="mb-8">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl">
                  <CalendarClock size={28} />
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