
import React, { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Calendar, 
  Clock, 
  Droplets, 
  ShieldAlert,
  CreditCard,
  AlertCircle,
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar size={13} />
          <span className="text-xs font-medium">{format(appointment.date, "EEE, MMM do, yyyy")}</span>
        </div>
        <span className="text-muted-foreground/30">·</span>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock size={13} />
          <span className="text-xs font-medium">{format(appointment.date, "h:mm a")}</span>
        </div>

        <span className="w-px h-4 bg-border mx-1" />

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Status:</span>
          <Select value={appointment.status} onValueChange={(newStatus) => onSaveField('status', newStatus)}>
            <SelectTrigger className={cn(
              "h-7 w-auto min-w-[120px] text-xs font-medium border-border bg-card rounded-lg transition-all px-2.5",
              appointment.status === 'Completed' ? "text-muted-foreground" : "text-foreground"
            )}>
              <div className="flex items-center gap-1.5">
                <div className={cn("w-1.5 h-1.5 rounded-full", appointment.status === 'Completed' ? "bg-muted-foreground" : "bg-muted-foreground")} />
                <SelectValue placeholder={appointment.status}>
                  {appointment.status}
                </SelectValue>
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-lg border-border shadow-md p-1 bg-card">
              {APPOINTMENT_STATUSES.map(status => (
                <SelectItem 
                  key={status} 
                  value={status}
                  className="rounded-md text-xs font-medium py-1.5 px-3 cursor-pointer"
                >
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground/50 border-border rounded-md px-2 py-0">
          ID: {appointment.display_id || appointment.id.slice(0,8)}
        </Badge>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-muted text-muted-foreground text-xs font-medium">
                <ShieldAlert size={12} />
                {neuralLoad}%
              </div>
            </TooltipTrigger>
            <TooltipContent className="rounded-lg p-2 bg-foreground text-background border-none shadow-md">
              <p className="text-xs">Threat level based on brainstem nuclei inhibition</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={handlePaymentClick} className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border text-xs font-medium transition-colors",
                appointment.is_paid && appointment.payment_received ? "bg-muted text-muted-foreground" :
                appointment.is_paid ? "bg-muted text-muted-foreground" :
                "bg-muted text-muted-foreground"
              )}>
                <CreditCard size={12} />
                {!appointment.is_paid ? "Free" : appointment.payment_received ? "Paid" : `$${appointment.price_amount || 50}`}
              </button>
            </TooltipTrigger>
            <TooltipContent className="rounded-lg p-2 bg-foreground text-background border-none shadow-md">
              <p className="text-xs">Click to toggle payment status</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-muted text-muted-foreground text-xs font-medium">
          <Droplets size={12} />
          {appointment.hydrated ? "Hydrated" : "Needs Water"}
          <Switch 
            checked={appointment.hydrated || false} 
            onCheckedChange={(checked) => onSaveField('hydrated', checked)} 
            className="scale-[0.55] origin-right ml-0.5 data-[state=checked]:bg-muted-foreground data-[state=unchecked]:bg-muted-foreground/30" 
          />
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="flex flex-wrap gap-2 animate-in slide-in-from-top-2 duration-500">
          {alerts.map((alert, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted text-muted-foreground text-xs">
              <alert.icon size={14} className="shrink-0 text-muted-foreground" />
              <span className="font-medium">{alert.label}:</span>
              <span>{alert.reason}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AppointmentHeader;
