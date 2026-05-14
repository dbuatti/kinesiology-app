"use client";

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppointment } from "@/hooks/useAppointment";
import { CranialNerveAssessment } from "@/components/crm/CranialNerveAssessment";
import { PrimitiveReflexAssessment } from "@/components/crm/PrimitiveReflexAssessment";
import { BrainZoneAssessment } from "@/components/crm/BrainZoneAssessment";
import { MuscleAssessment } from "@/components/crm/MuscleAssessment";
import EmotionsProtocolReference from "@/components/crm/EmotionsProtocolReference";
import MechanoreceptiveAssessment from "@/components/crm/MechanoreceptiveAssessment";
import HeartWallProtocol from "@/components/crm/HeartWallProtocol";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, Brain, Loader2, Zap, FileText, Heart, 
  Activity, Shield, Layers, Dumbbell, RefreshCw,
  Eye, EyeOff, Save, ShieldCheck, LayoutGrid,
  ChevronRight, Settings2, Sparkles, Globe, ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const SHOW_IMAGES_KEY = "fnh_protocols_show_images";
const REMEMBER_KEY = "fnh_protocols_remember_settings";

const PROTOCOLS = [
  { id: "cranial-nerves", label: "Nerves", icon: Zap, color: "text-rose-500", bg: "bg-rose-50" },
  { id: "primitive-reflexes", label: "Reflexes", icon: RefreshCw, color: "text-indigo-500", bg: "bg-indigo-50" },
  { id: "brain-zones", label: "Zones", icon: Brain, color: "text-purple-500", bg: "bg-purple-50" },
  { id: "muscles", label: "Muscles", icon: Dumbbell, color: "text-emerald-500", bg: "bg-emerald-50" },
  { id: "mechanoreceptive", label: "Mechano", icon: Activity, color: "text-blue-500", bg: "bg-blue-50" },
  { id: "emotions", label: "Emotions", icon: Heart, color: "text-rose-600", bg: "bg-rose-50" },
  { id: "heart-wall", label: "Heart Wall", icon: Shield, color: "text-slate-600", bg: "bg-slate-50" },
];

export default function ClinicalProtocolsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { appointment, loading, updatePriorityPattern, saveField } = useAppointment(id);
  const [activeTab, setActiveTab] = useState("cranial-nerves");

  // Global UI Settings
  const [showImages, setShowImages] = useState(() => {
    const saved = localStorage.getItem(SHOW_IMAGES_KEY);
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [rememberSettings, setRememberSettings] = useState(() => {
    const saved = localStorage.getItem(REMEMBER_KEY);
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    if (rememberSettings) {
      localStorage.setItem(SHOW_IMAGES_KEY, JSON.stringify(showImages));
      localStorage.setItem(REMEMBER_KEY, JSON.stringify(rememberSettings));
    } else {
      localStorage.removeItem(SHOW_IMAGES_KEY);
      localStorage.removeItem(REMEMBER_KEY);
    }
  }, [showImages, rememberSettings]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Loading Protocols...</p>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="container mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold">Appointment not found</h1>
        <Button onClick={() => navigate("/appointments")} className="mt-4">
          Back to Appointments
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* 1. Slim Vertical Navigation Rail */}
      <aside className="w-20 md:w-24 bg-slate-900 flex flex-col items-center py-6 gap-4 z-50 shrink-0">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate(`/appointments/${id}`)}
          className="h-12 w-12 rounded-2xl bg-white/10 text-white hover:bg-white/20 mb-4"
        >
          <ChevronLeft size={24} />
        </Button>

        <div className="flex-1 flex flex-col gap-2 w-full px-2">
          {PROTOCOLS.map((p) => {
            const isActive = activeTab === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setActiveTab(p.id)}
                className={cn(
                  "flex flex-col items-center justify-center py-3 rounded-2xl transition-all duration-300 group",
                  isActive 
                    ? "bg-indigo-600 text-white shadow-lg scale-105" 
                    : "text-slate-500 hover:text-white hover:bg-white/5"
                )}
              >
                <p.icon size={20} className={cn("transition-transform duration-500", isActive ? "scale-110" : "group-hover:scale-110", !isActive && p.color)} />
                <span className="text-[8px] font-black uppercase tracking-widest mt-1.5 text-center px-1">
                  {p.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-auto flex flex-col gap-4 items-center">
          <Badge variant="outline" className="border-white/20 text-white font-black text-[7px] uppercase tracking-widest px-1.5 py-0 rounded-none rotate-90 mb-4">
            Clinical
          </Badge>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Settings Header */}
        <header className="h-16 border-b border-slate-100 flex items-center justify-between px-8 bg-white shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {PROTOCOLS.find(p => p.id === activeTab)?.label}
              </h2>
              <Badge className="bg-slate-100 text-slate-500 border-none font-black text-[8px] uppercase tracking-widest">
                Protocol v2.4
              </Badge>
            </div>
            <div className="h-6 w-px bg-slate-100 mx-2" />
            <Button 
              asChild
              variant="ghost" 
              size="sm" 
              className="h-9 px-3 rounded-xl text-indigo-600 hover:bg-indigo-50 font-black text-[9px] uppercase tracking-widest"
            >
              <a href="https://fnhrefapp-ggs6ojfk.manus.space/brain-zones" target="_blank" rel="noopener noreferrer">
                <Globe size={14} className="mr-2" /> Official App <ExternalLink size={10} className="ml-1 opacity-50" />
              </a>
            </Button>
          </div>

          <div className="flex items-center gap-8">
            <div className="flex items-center space-x-3">
              <Switch 
                id="show-images-global" 
                checked={showImages} 
                onCheckedChange={setShowImages}
                className="data-[state=checked]:bg-indigo-600"
              />
              <Label htmlFor="show-images-global" className="text-[9px] font-black uppercase tracking-widest text-slate-400 cursor-pointer flex items-center gap-2">
                {showImages ? <Eye size={14} className="text-indigo-600" /> : <EyeOff size={14} />}
                Images
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Switch 
                id="remember-settings" 
                checked={rememberSettings} 
                onCheckedChange={setRememberSettings}
                className="data-[state=checked]:bg-emerald-600"
              />
              <Label htmlFor="remember-settings" className="text-[9px] font-black uppercase tracking-widest text-slate-400 cursor-pointer flex items-center gap-2">
                <ShieldCheck size={14} className={rememberSettings ? "text-emerald-600" : ""} />
                Remember
              </Label>
            </div>

            <div className="h-8 w-px bg-slate-100" />

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Client</p>
                <p className="text-xs font-bold text-slate-900">{appointment.clients.name}</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm">
                {appointment.clients.name.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Assessment Area */}
        <main className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar">
          <div className="max-w-5xl mx-auto">
            <div className="animate-in fade-in duration-500">
              {activeTab === "cranial-nerves" && (
                <CranialNerveAssessment 
                  appointmentId={id!} 
                  priorityPattern={appointment.priority_pattern}
                  updatePriorityPattern={updatePriorityPattern}
                  showImages={showImages}
                />
              )}
              
              {activeTab === "primitive-reflexes" && (
                <PrimitiveReflexAssessment 
                  appointmentId={id!} 
                  priorityPattern={appointment.priority_pattern}
                  updatePriorityPattern={updatePriorityPattern}
                />
              )}

              {activeTab === "brain-zones" && (
                <BrainZoneAssessment 
                  priorityPattern={appointment.priority_pattern}
                  updatePriorityPattern={updatePriorityPattern}
                  showImages={showImages}
                />
              )}

              {activeTab === "muscles" && (
                <MuscleAssessment 
                  priorityPattern={appointment.priority_pattern}
                  updatePriorityPattern={updatePriorityPattern}
                  showImages={showImages}
                />
              )}

              {activeTab === "mechanoreceptive" && (
                <MechanoreceptiveAssessment 
                  appointmentId={id!}
                  onSave={(summary) => saveField('modes_balances', summary)}
                />
              )}

              {activeTab === "emotions" && (
                <EmotionsProtocolReference />
              )}

              {activeTab === "heart-wall" && (
                <HeartWallProtocol />
              )}
            </div>

            {/* Persistent Summary Area */}
            <div className="mt-20 pt-12 border-t border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Integration Summary</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Session Notes & Homework</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50">
                  <Sparkles size={14} className="mr-2" /> AI Assist
                </Button>
              </div>
              <textarea 
                className="w-full min-h-[200px] bg-slate-50/50 border-none rounded-[2rem] p-8 text-base font-medium leading-relaxed focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-300"
                placeholder="Document the primary correction and prescribed homework here..."
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}