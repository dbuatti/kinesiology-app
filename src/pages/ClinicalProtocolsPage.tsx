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
  Eye, EyeOff, Save, ShieldCheck
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const SHOW_IMAGES_KEY = "fnh_protocols_show_images";
const REMEMBER_KEY = "fnh_protocols_remember_settings";

export default function ClinicalProtocolsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { appointment, loading, updatePriorityPattern, saveField } = useAppointment(id);
  const [activeTab, setActiveTab] = React.useState("cranial-nerves");

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
    <div className="min-h-screen bg-white p-4 md:p-6">
      <div className="max-w-full mx-auto space-y-6">
        {/* Global Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner print:hidden">
          <div className="flex items-center gap-6">
            <div className="flex items-center space-x-3">
              <Switch 
                id="show-images-global" 
                checked={showImages} 
                onCheckedChange={setShowImages}
                className="data-[state=checked]:bg-indigo-600"
              />
              <Label htmlFor="show-images-global" className="text-[10px] font-black uppercase tracking-widest text-slate-600 cursor-pointer flex items-center gap-2">
                {showImages ? <Eye size={14} className="text-indigo-600" /> : <EyeOff size={14} className="text-slate-400" />}
                Show Reference Images
              </Label>
            </div>

            <div className="flex items-center space-x-3 border-l border-slate-200 pl-6">
              <Switch 
                id="remember-settings" 
                checked={rememberSettings} 
                onCheckedChange={setRememberSettings}
                className="data-[state=checked]:bg-emerald-600"
              />
              <Label htmlFor="remember-settings" className="text-[10px] font-black uppercase tracking-widest text-slate-600 cursor-pointer flex items-center gap-2">
                <ShieldCheck size={14} className={rememberSettings ? "text-emerald-600" : "text-slate-400"} />
                Remember Settings
              </Label>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-white border-slate-200 text-slate-400 font-black text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-full">
              Clinical Mode
            </Badge>
          </div>
        </div>

        {/* Top Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-8 overflow-x-auto no-scrollbar">
            <TabsList className="inline-flex h-12 items-center justify-center rounded-xl bg-slate-100/50 p-1 text-muted-foreground border border-slate-200">
              <TabsTrigger 
                value="cranial-nerves" 
                className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
              >
                <Zap className="h-3.5 w-3.5 mr-2 text-rose-500" />
                Nerves
              </TabsTrigger>
              <TabsTrigger 
                value="primitive-reflexes" 
                className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-2 text-indigo-500" />
                Reflexes
              </TabsTrigger>
              <TabsTrigger 
                value="brain-zones" 
                className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
              >
                <Brain className="h-3.5 w-3.5 mr-2 text-purple-500" />
                Zones
              </TabsTrigger>
              <TabsTrigger 
                value="muscles" 
                className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
              >
                <Dumbbell className="h-3.5 w-3.5 mr-2 text-emerald-500" />
                Muscles
              </TabsTrigger>
              <TabsTrigger 
                value="mechanoreceptive" 
                className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
              >
                <Activity className="h-3.5 w-3.5 mr-2 text-blue-500" />
                Mechano
              </TabsTrigger>
              <TabsTrigger 
                value="emotions" 
                className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
              >
                <Heart className="h-3.5 w-3.5 mr-2 text-rose-600" />
                Emotions
              </TabsTrigger>
              <TabsTrigger 
                value="heart-wall" 
                className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
              >
                <Shield className="h-3.5 w-3.5 mr-2 text-slate-600" />
                Heart Wall
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="cranial-nerves" className="mt-0 focus-visible:ring-0 animate-in fade-in duration-300">
            <CranialNerveAssessment 
              appointmentId={id!} 
              priorityPattern={appointment.priority_pattern}
              updatePriorityPattern={updatePriorityPattern}
              showImages={showImages}
            />
          </TabsContent>
          
          <TabsContent value="primitive-reflexes" className="mt-0 focus-visible:ring-0 animate-in fade-in duration-300">
            <PrimitiveReflexAssessment 
              appointmentId={id!} 
              priorityPattern={appointment.priority_pattern}
              updatePriorityPattern={updatePriorityPattern}
            />
          </TabsContent>

          <TabsContent value="brain-zones" className="mt-0 focus-visible:ring-0 animate-in fade-in duration-300">
            <BrainZoneAssessment 
              priorityPattern={appointment.priority_pattern}
              updatePriorityPattern={updatePriorityPattern}
              showImages={showImages}
            />
          </TabsContent>

          <TabsContent value="muscles" className="mt-0 focus-visible:ring-0 animate-in fade-in duration-300">
            <MuscleAssessment 
              priorityPattern={appointment.priority_pattern}
              updatePriorityPattern={updatePriorityPattern}
              showImages={showImages}
            />
          </TabsContent>

          <TabsContent value="mechanoreceptive" className="mt-0 focus-visible:ring-0 animate-in fade-in duration-300">
            <MechanoreceptiveAssessment 
              appointmentId={id!}
              onSave={(summary) => saveField('modes_balances', summary)}
            />
          </TabsContent>

          <TabsContent value="emotions" className="mt-0 focus-visible:ring-0 animate-in fade-in duration-300">
            <EmotionsProtocolReference />
          </TabsContent>

          <TabsContent value="heart-wall" className="mt-0 focus-visible:ring-0 animate-in fade-in duration-300">
            <HeartWallProtocol />
          </TabsContent>
        </Tabs>

        {/* Summary Section */}
        <div className="mt-12 pt-8 border-t border-slate-100 print:mt-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText size={16} className="text-slate-400" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Clinical Summary & Integration</h3>
          </div>
          <textarea 
            className="w-full min-h-[150px] bg-transparent border-none outline-none resize-none text-sm leading-[28px] font-medium placeholder:text-slate-300"
            style={{
              backgroundImage: 'linear-gradient(to bottom, transparent 27px, #f1f5f9 27px)',
              backgroundSize: '100% 28px',
              backgroundAttachment: 'local'
            }}
            placeholder="Type your clinical summary here..."
          />
        </div>
      </div>

      {/* Floating Back Button */}
      <div className="fixed bottom-6 left-6 print:hidden">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => navigate(`/appointments/${id}`)}
          className="h-10 w-10 rounded-full shadow-lg bg-white border-slate-200 text-slate-400 hover:text-indigo-600"
        >
          <ChevronLeft size={18} />
        </Button>
      </div>
    </div>
  );
}