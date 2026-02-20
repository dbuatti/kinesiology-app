"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import EditableField from "./EditableField";
import { AppointmentWithClient } from "@/types/crm"; // Updated import

interface AppointmentContextCardsProps {
  appointment: AppointmentWithClient;
  currentPeakMeridian: any;
  onSaveField: (field: string, value: any) => Promise<void>;
}

const AppointmentContextCards = ({ appointment, currentPeakMeridian, onSaveField }: AppointmentContextCardsProps) => {
  return (
    <div className="space-y-8">
      {currentPeakMeridian && (
        <Card className={cn(
          "border-none shadow-xl rounded-[2.5rem] text-white overflow-hidden relative group",
          currentPeakMeridian.color.split(' ')[0]
        )}>
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <Zap size={120} />
          </div>
          <CardContent className="p-8 space-y-4 relative z-10">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">Current Peak Meridian</p>
              <Badge className="bg-white/20 text-white border-none font-black text-[9px] uppercase tracking-widest">TCM Clock</Badge>
            </div>
            <div>
              <h3 className="text-3xl font-black tracking-tight">{currentPeakMeridian.name}</h3>
              <p className="text-xs font-bold opacity-90 mt-1">{currentPeakMeridian.peakTime}</p>
            </div>
            <div className="pt-4 border-t border-white/10">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">Core Emotions</p>
              <div className="flex flex-wrap gap-1.5">
                {currentPeakMeridian.emotions.slice(0, 3).map((e: string) => (
                  <Badge key={e} variant="outline" className="bg-white/10 border-white/20 text-white text-[9px] font-bold">{e}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-none shadow-lg rounded-[2.5rem] bg-slate-900 text-white overflow-hidden">
        <CardContent className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Session Context</p>
            <ExternalLink size={16} className="text-slate-700" />
          </div>
          <div className="space-y-4">
            <EditableField 
              key={`acupoints-${appointment.id}`} 
              field="acupoints" 
              label="Acupoints" 
              value={appointment.acupoints} 
              placeholder="Points used..." 
              onSave={onSaveField as any} 
              className="bg-white/5 border-white/10 p-4 rounded-2xl"
            />
            <div className="space-y-4">
              <EditableField 
                key={`journal-${appointment.id}`} 
                field="journal" 
                label="Practitioner Reflection" 
                value={appointment.journal} 
                multiline 
                className="bg-amber-500/10 border-amber-500/20 p-4 rounded-2xl" 
                placeholder="Personal insights..." 
                onSave={onSaveField as any} 
              />
              {appointment.notion_link && (
                <Button variant="outline" size="sm" className="w-full h-12 rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10 font-bold text-xs" asChild>
                  <a href={appointment.notion_link} target="_blank" rel="noopener noreferrer">
                    <ExternalLink size={16} className="mr-2" /> View Notion Link
                  </a>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentContextCards;