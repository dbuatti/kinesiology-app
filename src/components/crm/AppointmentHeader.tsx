"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, Droplets, Star } from "lucide-react";
import { format } from "date-fns";
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
import { AppointmentWithClient } from "@/pages/AppointmentDetailPage";

interface AppointmentHeaderProps {
  appointment: AppointmentWithClient;
  onSaveField: (field: string, value: any) => Promise<void>;
}

const AppointmentHeader = ({ appointment, onSaveField }: AppointmentHeaderProps) => {
  const clientBorn = appointment.clients.born ? new Date(appointment.clients.born) : null;

  return (
    <div className="p-8 border-b border-slate-100 bg-slate-50/30">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-[2rem] bg-indigo-600 text-white flex items-center justify-center text-3xl font-black shadow-2xl shadow-indigo-200">
            {appointment.clients.name.charAt(0)}
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary" className="font-black bg-white border-slate-200 text-slate-600 text-[10px] uppercase tracking-widest">
                {appointment.display_id || appointment.id.slice(0, 8)}
              </Badge>
              <Badge className="bg-indigo-600 text-white border-none font-black text-[10px] uppercase tracking-widest">
                {appointment.tag}
              </Badge>
              <Select value={appointment.status} onValueChange={(newStatus) => onSaveField('status', newStatus)}>
                <SelectTrigger className={cn(
                  "h-8 w-[130px] text-[10px] font-black uppercase tracking-widest border-slate-200 shadow-sm bg-white rounded-xl",
                  appointment.status === 'Completed' ? "text-emerald-600" : "text-indigo-600"
                )}>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                  {APPOINTMENT_STATUSES.map(status => (
                    <SelectItem key={status} value={status} className="rounded-xl">{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">{appointment.clients.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-slate-500">
              <div className="flex items-center gap-1.5">
                <Calendar size={16} className="text-indigo-400" /> 
                {format(appointment.date, "EEEE, MMM d")}
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={16} className="text-indigo-400" /> 
                {format(appointment.date, "h:mm a")}
              </div>
              {clientBorn && (
                <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
                  <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md text-[10px] font-black uppercase">
                    {calculateAge(clientBorn)} yrs
                  </span>
                  <span className="flex items-center gap-1 text-amber-600 font-black text-[10px] uppercase tracking-widest">
                    <Star size={12} className="fill-amber-500" /> {getStarSign(clientBorn)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-4">
          <div className="flex items-center gap-4 p-4 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-inner",
              appointment.hydrated ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
            )}>
              <Droplets size={24} />
            </div>
            <div className="pr-2">
              <Label htmlFor="hydration-toggle" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1">
                Hydration
              </Label>
              <div className="flex items-center gap-3">
                <span className="text-sm font-black text-slate-700">
                  {appointment.hydrated ? "PASSED" : "ATTENTION"}
                </span>
                <Switch 
                  id="hydration-toggle" 
                  checked={appointment.hydrated || false} 
                  onCheckedChange={(checked) => onSaveField('hydrated', checked)} 
                  className="data-[state=checked]:bg-emerald-500" 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentHeader;