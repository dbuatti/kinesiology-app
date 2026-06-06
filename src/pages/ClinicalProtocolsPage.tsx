
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
  ChevronRight, Settings2, Sparkles, Globe, ExternalLink,
  PanelLeftClose, PanelLeftOpen, ClipboardCheck
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
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
        <div className="w-16 h-16 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white font-black text-2xl shadow-2xl animate-bounce">
          A
        </div>
        <div className="flex items-center gap-2 text-muted-foreground font-black text-[10px] uppercase tracking-[0.3em]">
          <Loader2 className="animate-spin" size={14} /> Loading Protocols
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="container mx-auto p-12 text-center space-y-6">
        <div className="w-20 h-20 bg-rose-50 rounded-[2rem] flex items-center justify-center mx-auto text-rose-500 shadow-xl">
          <Shield size={40} />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-slate-900">Appointment not found</h1>
          <p className="text-slate-500 font-medium">The requested session could not be located in the database.</p>
        </div>
        <Button onClick={() => navigate("/appointments")} className="bg-indigo-600 hover:bg-indigo-700 rounded-xl h-12 px-8 font-bold">
          Back to Appointments
        </Button>
      </div>
    );
  }

  const activeProtocol = PROTOCOLS.find(p => p.id === activeTab);

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* 1. Slim Vertical Navigation Rail */}
      <aside className="w-20 md:w-24 bg-slate-950 flex flex-col items-center py-8 gap-6 z-50 shrink-0 shadow-2xl">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate(`/appointments/${id}`)}
          className="h-12 w-12 rounded-2xl bg-white/5 text-white hover:bg-white/10 mb-4 transition-all hover:scale-110"
        >
          <ChevronLeft size={24} />
        </Button>

        <div className="flex-1 flex flex-col gap-3 w-full px-2">
          {PROTOCOLS.map((p) => {
            const isActive = activeTab === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setActiveTab(p.id)}
                className={cn(
                  "flex flex-col items-center justify-center py-4 rounded-2xl transition-all duration-500 group relative",
                  isActive 
                    ? "bg-indigo-600 text-white shadow-xl scale-105" 
                    : "text-slate-500 hover:text-white hover:bg-white/5"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 w-1 h-8 bg-white rounded-r-full" />
                )}
                <p.icon size={22} className={cn("transition-transform duration-500", isActive ? "scale-110" : "group-hover:scale-110", !isActive && p.color)} />
                <span className="text-[8px] font-black uppercase tracking-widest mt-2 text-center px-1">
                  {p.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-auto flex flex-col gap-6 items-center">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-colors cursor-pointer">
            <Settings2 size={20} />
          </div>
          <Badge variant="outline" className="border-white/10 text-slate-500 font-black text-[7px] uppercase tracking-widest px-2 py-0.5 rounded-none rotate-90 mb-6">
            Clinical Rail
          </Badge>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50/30">
        {/* Top Settings Header */}
        <header className="h-20 border-b border-slate-100 flex items-center justify-between px-10 bg-white shrink-0 shadow-sm z-40">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg",
                activeProtocol?.bg.replace('bg-', 'bg-').replace('-50', '-600') || "bg-indigo-600"
              )}>
                {React.createElement(activeProtocol?.icon || Brain, { size: 24 })}
              </div>
              <div>
                <h2 className="text-2xl font-serif font-bold text-slate-900 tracking-tight leading-none">
                  {activeProtocol?.label}
                </h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">Protocol v2.4 • Clinical Standard</p>
              </div>
            </div>
            <div className="h-8 w-px bg-slate-100 mx-2" />
            <Button 
              asChild
              variant="ghost" 
              size="sm" 
              className="h-10 px-4 rounded-xl text-indigo-600 hover:bg-indigo-50 font-black text-[10px] uppercase tracking-widest"
            >
              <a href="https://fnhrefapp-ggs6ojfk.manus.space/brain-zones" target="_blank" rel="noopener noreferrer">
                <Globe size={16} className="mr-2" /> Official App <ExternalLink size={12} className="ml-1.5 opacity-50" />
              </a>
            </Button>
          </div>

          <div className="flex items-center gap-10">
            <div className="flex items-center gap-8">
              <div className="flex items-center space-x-3">
                <Switch 
                  id="show-images-global" 
                  checked={showImages} 
                  onCheckedChange={setShowImages}
                  className="data-[state=checked]:bg-indigo-600"
                />
                <Label htmlFor="show-images-global" className="text-[10px] font-black uppercase tracking-widest text-slate-500 cursor-pointer flex items-center gap-2">
                  {showImages ? <Eye size={16} className="text-indigo-600" /> : <EyeOff size={16} />}
                  Images
                </Label>
              </div>
            </div>

            <div className="h-10 w-px bg-slate-100" />

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Client</p>
                <p className="text-sm font-bold text-slate-900">{appointment.clients.name}</p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-lg shadow-inner border border-indigo-100">
                {appointment.clients.name.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Assessment Area */}
        <main className="flex-1 overflow-y-auto p-10 md:p-16 custom-scrollbar">
          <div className="max-w-5xl mx-auto">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
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
            <div className="mt-24 pt-16 border-t border-slate-200">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xl">
                    <ClipboardCheck size={28} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-serif font-bold text-slate-900 tracking-tight">Integration Summary</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">Session Notes & Homework</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-11 px-6 rounded-xl text-indigo-600 hover:bg-indigo-50 font-black text-[10px] uppercase tracking-widest border border-indigo-100">
                  <Sparkles size={16} className="mr-2" /> AI Clinical Assist
                </Button>
              </div>
              <textarea 
                className="w-full min-h-[250px] bg-white border-2 border-slate-100 rounded-[2.5rem] p-10 text-lg font-medium leading-relaxed focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-inner placeholder:text-slate-200"
                placeholder="Document the primary correction and prescribed homework here..."
              />
              <div className="mt-6 flex justify-end">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-14 px-12 font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100">
                  <Save size={18} className="mr-2" /> Save Integration
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}