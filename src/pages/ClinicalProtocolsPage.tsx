
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
  ChevronLeft, Brain, Loader2, Zap, Heart, 
  Activity, Shield, Dumbbell, RefreshCw,
  Eye, EyeOff, Save,
  Settings2, Sparkles, Globe, ExternalLink,
  ClipboardCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const SHOW_IMAGES_KEY = "fnh_protocols_show_images";
const REMEMBER_KEY = "fnh_protocols_remember_settings";

const PROTOCOLS = [
  { id: "cranial-nerves", label: "Nerves", icon: Zap, color: "text-chart-destructive", bg: "bg-chart-destructive/10" },
  { id: "primitive-reflexes", label: "Reflexes", icon: RefreshCw, color: "text-chart-primary", bg: "bg-chart-primary/10" },
  { id: "brain-zones", label: "Zones", icon: Brain, color: "text-chart-primary", bg: "bg-chart-primary/10" },
  { id: "muscles", label: "Muscles", icon: Dumbbell, color: "text-chart-emerald", bg: "bg-chart-emerald/10" },
  { id: "mechanoreceptive", label: "Mechano", icon: Activity, color: "text-chart-primary", bg: "bg-chart-primary/10" },
  { id: "emotions", label: "Emotions", icon: Heart, color: "text-chart-destructive", bg: "bg-chart-destructive/10" },
  { id: "heart-wall", label: "Heart Wall", icon: Shield, color: "text-muted-foreground", bg: "bg-muted" },
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
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-muted">
        <div className="w-16 h-16 bg-chart-primary rounded-xl flex items-center justify-center text-white font-semibold text-2xl shadow-sm animate-bounce">
          A
        </div>
        <div className="flex items-center gap-2 text-muted-foreground font-semibold text-[10px] uppercase tracking-wider">
          <Loader2 className="animate-spin" size={14} /> Loading Protocols
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="container mx-auto p-12 text-center space-y-6">
        <div className="w-20 h-20 bg-chart-destructive/10 rounded-xl flex items-center justify-center mx-auto text-chart-destructive shadow-sm">
          <Shield size={40} />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-foreground">Appointment not found</h1>
          <p className="text-muted-foreground font-medium">The requested session could not be located in the database.</p>
        </div>
        <Button onClick={() => navigate("/appointments")} className="bg-primary hover:bg-primary/90 rounded-xl h-12 px-8 font-medium">
          Back to Appointments
        </Button>
      </div>
    );
  }

  const activeProtocol = PROTOCOLS.find(p => p.id === activeTab);

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* 1. Slim Vertical Navigation Rail */}
      <aside className="w-20 md:w-24 bg-foreground flex flex-col items-center py-8 gap-6 z-50 shrink-0 shadow-sm">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate(`/appointments/${id}`)}
          className="h-12 w-12 rounded-xl bg-white/5 text-white hover:bg-white/10 mb-4 transition-all hover:scale-110"
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
                  "flex flex-col items-center justify-center py-4 rounded-xl transition-all duration-500 group relative",
                  isActive 
                    ? "bg-chart-primary text-white shadow-sm scale-105" 
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 w-1 h-8 bg-white rounded-r-full" />
                )}
                <p.icon size={22} className={cn("transition-transform duration-500", isActive ? "scale-110" : "group-hover:scale-110", !isActive && p.color)} />
                <span className="text-[10px] font-semibold uppercase tracking-wider mt-2 text-center px-1">
                  {p.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-auto flex flex-col gap-6 items-center">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-muted-foreground hover:text-white transition-colors cursor-pointer">
            <Settings2 size={20} />
          </div>
          <Badge variant="outline" className="border-white/10 text-muted-foreground font-semibold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-none rotate-90 mb-6">
            Clinical Rail
          </Badge>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-muted/30">
        {/* Top Settings Header */}
        <header className="h-20 border-b border-border flex items-center justify-between px-10 bg-white shrink-0 shadow-sm z-40">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm",
                activeProtocol?.bg.replace(/\/\d+$/, '') || "bg-chart-primary"
              )}>
                {React.createElement(activeProtocol?.icon || Brain, { size: 24 })}
              </div>
              <div>
                <h2 className="text-2xl font-serif font-medium text-foreground tracking-tight leading-none">
                  {activeProtocol?.label}
                </h2>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-1.5">Protocol v2.4 • Clinical Standard</p>
              </div>
            </div>
            <div className="h-8 w-px bg-border mx-2" />
            <Button 
              asChild
              variant="ghost" 
              size="sm" 
              className="h-10 px-4 rounded-xl text-chart-primary hover:bg-chart-primary/10 font-semibold text-[10px] uppercase tracking-wider"
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
                  className="data-[state=checked]:bg-chart-primary"
                />
                <Label htmlFor="show-images-global" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer flex items-center gap-2">
                  {showImages ? <Eye size={16} className="text-chart-primary" /> : <EyeOff size={16} />}
                  Images
                </Label>
              </div>
            </div>

            <div className="h-10 w-px bg-border" />

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Active Client</p>
                <p className="text-sm font-medium text-foreground">{appointment.clients.name}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-chart-primary/10 text-chart-primary flex items-center justify-center font-semibold text-lg shadow-inner border border-chart-primary/20">
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
            <div className="mt-24 pt-16 border-t border-border">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-xl bg-foreground text-white flex items-center justify-center shadow-sm">
                    <ClipboardCheck size={28} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-serif font-medium text-foreground tracking-tight">Integration Summary</h3>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-1">Session Notes & Homework</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-11 px-6 rounded-xl text-chart-primary hover:bg-chart-primary/10 font-semibold text-[10px] uppercase tracking-wider border border-chart-primary/20">
                  <Sparkles size={16} className="mr-2" /> AI Clinical Assist
                </Button>
              </div>
              <textarea 
                className="w-full min-h-[250px] bg-white border-2 border-border rounded-xl p-10 text-lg font-medium leading-relaxed focus:ring-4 focus:ring-chart-primary/10 focus:border-chart-primary transition-all shadow-inner placeholder:text-muted-foreground/30"
                placeholder="Document the primary correction and prescribed homework here..."
              />
              <div className="mt-6 flex justify-end">
                <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl h-14 px-12 font-semibold text-xs uppercase tracking-wider shadow-sm">
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