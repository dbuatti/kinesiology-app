
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  User, Activity, ShieldAlert, Heart, 
  Briefcase, MapPin, Calendar, Info,
  AlertCircle, Zap, Brain, Wind
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ClientContextTabProps {
  appointment: any;
}

const ClientContextTab = ({ appointment }: ClientContextTabProps) => {
  const client = appointment.clients;
  
  // Prioritize appointment-specific data, fallback to client profile
  const stressLevel = appointment.current_stress_level ?? client.current_stress_level;
  const sleepQuality = appointment.sleep_quality ?? client.sleep_quality;
  const digestiveHealth = appointment.digestive_health ?? client.digestive_health;
  const medications = appointment.medications_supplements ?? client.medications_supplements;

  const Section = ({ icon: Icon, title, children, color }: any) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-2">
        <Icon size={14} className={color} />
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</h4>
      </div>
      <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
        {children}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-8">
          <Section icon={Activity} title="Medical History & Injuries" color="text-rose-500">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {client.medical_history || "No medical history recorded."}
            </p>
          </Section>

          <Section icon={Zap} title="Medications & Supplements" color="text-amber-500">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {medications || "No medications recorded."}
            </p>
          </Section>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 bg-indigo-50 dark:bg-indigo-900/20 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/30">
              <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2">Stress Level</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{stressLevel || "—"}</span>
                <span className="text-xs font-bold text-indigo-400">/ 10</span>
              </div>
            </div>
            <div className="p-5 bg-emerald-50 dark:bg-emerald-900/20 rounded-[2rem] border border-emerald-100 dark:border-emerald-900/30">
              <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-2">Sleep Quality</p>
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{sleepQuality || "Not set"}</p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <Section icon={ShieldAlert} title="Safety & Emergency" color="text-rose-600">
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase">Contact Name</p>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{client.emergency_contact_name || "Not provided"}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase">Contact Phone</p>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{client.emergency_contact_phone || "Not provided"}</p>
              </div>
            </div>
          </Section>

          <Section icon={Info} title="Background Context" color="text-indigo-500">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase">Occupation</p>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{client.occupation || "Not set"}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase">Referral Source</p>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{client.referral_source || "Not set"}</p>
              </div>
            </div>
          </Section>

          <div className="p-6 bg-slate-900 text-white rounded-[2.5rem] shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10"><Brain size={80} /></div>
            <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <AlertCircle size={14} /> Practitioner Insight
            </h4>
            <p className="text-sm font-medium text-slate-300 leading-relaxed italic relative z-10">
              "Use this context to identify potential emotional triggers or structural patterns before starting the balance."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientContextTab;