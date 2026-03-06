"use client";

import React, { useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  BookOpen, 
  Footprints, 
  Brain, 
  Activity, 
  Info, 
  ArrowRight, 
  Zap, 
  Move, 
  Droplets, 
  Target, 
  Heart, 
  Layers, 
  Sparkles, 
  Clock, 
  RefreshCw, 
  Youtube, 
  ShieldCheck, 
  ShieldAlert,
  GraduationCap, 
  Lightbulb, 
  Compass, 
  Workflow, 
  ImageIcon, 
  Trophy,
  LayoutGrid,
  ChevronRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Breadcrumbs from "@/components/crm/Breadcrumbs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// Component Imports
import AcupointReference from "@/components/crm/AcupointReference";
import SpinalSegmentReference from "@/components/crm/SpinalSegmentReference";
import TcmChannelReference from "@/components/crm/TcmChannelReference";
import MeridianClock from "@/components/crm/MeridianClock";
import FiveElementCycle from "@/components/crm/FiveElementCycle";
import ClinicalCheatSheet from "@/components/crm/ClinicalCheatSheet";
import VideoLibrary from "@/components/crm/VideoLibrary";
import BrainReflexReference from "@/components/crm/BrainReflexReference";
import FnTheory from "@/components/crm/FnTheory";
import LigamentReference from "@/components/crm/LigamentReference";
import MechanoMastery from "@/components/crm/MechanoMastery";
import MechanoBible from "@/components/crm/MechanoBible";

const CATEGORIES = [
  {
    id: "foundations",
    label: "Foundations",
    icon: GraduationCap,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-100",
    items: [
      { id: "intention", label: "North Star Process", icon: Compass, desc: "Define your core intention and commitment." },
      { id: "bible", label: "Mechano Bible", icon: BookOpen, desc: "Definitive guide to joints and movement geometry." },
      { id: "theory", label: "FN Theory", icon: Workflow, desc: "Functional Neurology approach and principles." },
      { id: "foundations", label: "Foundations", icon: ShieldCheck, desc: "The practitioner's journey and accuracy baseline." },
    ]
  },
  {
    id: "clinical",
    label: "Clinical Reference",
    icon: Activity,
    color: "text-rose-600",
    bgColor: "bg-rose-50",
    borderColor: "border-rose-100",
    items: [
      { id: "brain", label: "Brain Reflexes", icon: Brain, desc: "Challenge specific cortical and subcortical regions." },
      { id: "ligaments", label: "Ligaments", icon: ImageIcon, desc: "Custom reference images for mechanoreceptive work." },
      { id: "cheatsheet", label: "Cheat Sheets", icon: Zap, desc: "Rapid clinical insights for common complaints." },
      { id: "video", label: "Video Library", icon: Youtube, desc: "Curated collection of technique demonstrations." },
    ]
  },
  {
    id: "tcm",
    label: "TCM & Meridians",
    icon: Layers,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-100",
    items: [
      { id: "clock", label: "Meridian Clock", icon: Clock, desc: "Interactive TCM peak activity reference." },
      { id: "elements", label: "5 Elements", icon: RefreshCw, desc: "Sheng and Ko cycle relationships." },
      { id: "channels", label: "Channels", icon: Layers, desc: "Detailed meridian and emotion mapping." },
      { id: "acupoints", label: "Acupoints", icon: Target, desc: "Primary point locations and clinical functions." },
    ]
  },
  {
    id: "tools",
    label: "Practice Tools",
    icon: Zap,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-100",
    items: [
      { id: "mechano", label: "Mechano Mastery", icon: Trophy, desc: "Theory flashcards and clinical simulator." },
      { id: "logic", label: "Clinical Logic", icon: Lightbulb, desc: "The hierarchy of neurological correction." },
      { id: "spinal", label: "Spinal", icon: Move, desc: "Spinal segment and Lovett-Brother associations." },
      { id: "vestibular", label: "Vestibular", icon: Footprints, desc: "Fukuda Step Test and balance protocols." },
      { id: "lymphatic", label: "Lymphatic", icon: Droplets, desc: "Drainage protocols and counterstrain points." },
    ]
  }
];

const ResourcesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "hub";

  const activeCategory = useMemo(() => {
    if (activeTab === "hub") return null;
    return CATEGORIES.find(cat => cat.items.some(item => item.id === activeTab));
  }, [activeTab]);

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <div className="p-4 md:p-8 max-w-full mx-auto space-y-8">
      <Breadcrumbs items={[{ label: "Resources" }]} />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Badge className="bg-indigo-100 text-indigo-600 border-indigo-200 font-black text-[10px] uppercase tracking-[0.3em] px-4 py-1 mb-2">
            Integrated Healer
          </Badge>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Resources & Exercises</h1>
          <p className="text-slate-500 font-medium mt-1 text-lg">Tools for your transformation journey and clinical practice.</p>
        </div>
        {activeTab !== "hub" && (
          <Button 
            variant="outline" 
            onClick={() => handleTabChange("hub")}
            className="rounded-xl border-slate-200 bg-white hover:bg-slate-50 font-bold text-xs uppercase tracking-widest h-12 px-6"
          >
            <LayoutGrid size={18} className="mr-2" /> Back to Hub
          </Button>
        )}
      </div>

      {activeTab === "hub" ? (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {CATEGORIES.map((category) => (
            <div key={category.id} className="space-y-6">
              <div className="flex items-center gap-3 px-2">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-sm", category.bgColor, category.color)}>
                  <category.icon size={20} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{category.label}</h2>
                <div className="flex-1 h-[2px] bg-slate-100 rounded-full ml-4" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {category.items.map((item) => (
                  <Card 
                    key={item.id} 
                    className="border-none shadow-md rounded-[2rem] bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer overflow-hidden"
                    onClick={() => handleTabChange(item.id)}
                  >
                    <CardContent className="p-8 space-y-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-sm",
                        category.bgColor, category.color
                      )}>
                        <item.icon size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{item.label}</h3>
                        <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">{item.desc}</p>
                      </div>
                      <div className="pt-2 flex items-center text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-600 transition-colors">
                        Open Tool <ChevronRight size={12} className="ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <div className="overflow-x-auto pb-4">
            <TabsList className={cn(
              "flex w-max h-auto p-1.5 rounded-2xl gap-1",
              activeCategory?.bgColor || "bg-slate-200/50"
            )}>
              {activeCategory?.items.map((item) => (
                <TabsTrigger 
                  key={item.id} 
                  value={item.id} 
                  className="rounded-xl py-2.5 px-6 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-widest"
                >
                  <item.icon size={16} className="mr-2" /> {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Foundations */}
            <TabsContent value="intention">
              <Card className="border-none shadow-lg rounded-[2.5rem] bg-indigo-600 text-white overflow-hidden">
                <CardHeader className="p-10">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                      <Compass size={32} className="text-indigo-300" />
                    </div>
                    <div>
                      <CardTitle className="text-3xl font-black">North Star Worksheet</CardTitle>
                      <CardDescription className="text-indigo-200 text-lg mt-1">Define your core intention and commitment.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-10 pt-0">
                  <p className="text-indigo-100 mb-6">This interactive worksheet is a dedicated space for deep reflection. Click below to open the worksheet in a full-page view.</p>
                  <Button asChild className="bg-white text-indigo-600 hover:bg-indigo-50 h-12 px-8 rounded-xl font-bold">
                    <Link to="/north-star">Open North Star Worksheet <ArrowRight className="ml-2" size={16} /></Link>
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="bible"><MechanoBible /></TabsContent>
            <TabsContent value="theory"><FnTheory /></TabsContent>
            <TabsContent value="foundations">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 border-none shadow-lg rounded-[2.5rem] bg-white overflow-hidden">
                  <div className="bg-indigo-600 p-8 text-white">
                    <h3 className="text-2xl font-black flex items-center gap-3"><ShieldCheck size={28} /> The Practitioner's Journey</h3>
                    <p className="text-indigo-100 mt-2 font-medium">Understanding the evolution of clinical accuracy and muscle testing.</p>
                  </div>
                  <CardContent className="p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-center space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">2 Years Experience</p>
                        <p className="text-5xl font-black text-indigo-600">65%</p>
                        <p className="text-sm font-bold text-slate-700">Accuracy Baseline</p>
                      </div>
                      <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100 text-center space-y-2">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">5+ Years Experience</p>
                        <p className="text-5xl font-black text-indigo-600">95%</p>
                        <p className="text-sm font-bold text-slate-700">Clinical Mastery</p>
                      </div>
                    </div>
                    <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100">
                      <h4 className="font-bold text-amber-900 mb-2 flex items-center gap-2"><Info size={18} /> Practitioner Insight</h4>
                      <p className="text-sm text-amber-800 leading-relaxed italic">"I always second guess myself, even after 12 years. You have no idea the biases going on in your mind. Stay loose in the saddle and respond to what is happening in front of you."</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-lg rounded-[2.5rem] bg-slate-900 text-white overflow-hidden">
                  <CardHeader className="p-8"><CardTitle className="text-xl font-black flex items-center gap-3"><Brain size={24} className="text-purple-400" /> Neurological Hierarchy</CardTitle></CardHeader>
                  <CardContent className="p-8 pt-0 space-y-6">
                    <div className="space-y-4">
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/10"><p className="text-xs font-black text-purple-400 uppercase tracking-widest mb-2">The Rule of Action</p><p className="text-lg font-bold leading-tight">"Joints act, muscles and tissues react."</p></div>
                      <p className="text-sm text-slate-400 leading-relaxed">Joint actions are more important than muscles and fascia. They are "slaves" to the joint. The cerebellum is always paying attention to the joint action first.</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Clinical Reference */}
            <TabsContent value="brain"><BrainReflexReference /></TabsContent>
            <TabsContent value="ligaments"><LigamentReference /></TabsContent>
            <TabsContent value="cheatsheet"><ClinicalCheatSheet /></TabsContent>
            <TabsContent value="video"><VideoLibrary /></TabsContent>

            {/* TCM & Meridians */}
            <TabsContent value="clock"><MeridianClock /></TabsContent>
            <TabsContent value="elements"><FiveElementCycle /></TabsContent>
            <TabsContent value="channels"><TcmChannelReference /></TabsContent>
            <TabsContent value="acupoints"><AcupointReference /></TabsContent>

            {/* Practice Tools */}
            <TabsContent value="mechano"><MechanoMastery /></TabsContent>
            <TabsContent value="logic">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="border-none shadow-lg rounded-[3rem] bg-slate-900 text-white overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-10 opacity-10"><Lightbulb size={150} /></div>
                  <CardHeader className="p-10">
                    <CardTitle className="text-3xl font-black flex items-center gap-4"><Zap size={32} className="text-amber-400" /> The Hierarchy of Correction</CardTitle>
                    <CardDescription className="text-slate-400 text-lg font-medium mt-2">Clinical reasoning follows a specific neurological order to ensure lasting results.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-10 pt-0 space-y-4 relative z-10">
                    <div className="space-y-4">
                      {[
                        { step: 1, title: "Safety First", desc: "Address SNS dominance (Harmonic Rocking, Diaphragm) before deep work." },
                        { step: 2, title: "Foundations", desc: "Check Primitive Reflexes and Cranial Nerves. They are the brain's OS." },
                        { step: 3, title: "Input (Afferent)", desc: "Calibrate Mechanoreceptors and Vestibular systems to clear 'threat'." },
                        { step: 4, title: "Output (Efferent)", desc: "Integrate Cortical and Subcortical processing for motor control." }
                      ].map((item) => (
                        <div key={item.step} className="flex gap-5 p-5 bg-white/5 rounded-2xl border border-white/10">
                          <span className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-black text-lg shrink-0">{item.step}</span>
                          <div><h4 className="font-black text-indigo-300 uppercase tracking-widest text-xs mb-1">{item.title}</h4><p className="text-sm text-slate-300 font-medium leading-relaxed">{item.desc}</p></div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <div className="space-y-8">
                  <Card className="border-none shadow-lg rounded-[2.5rem] bg-white overflow-hidden">
                    <CardHeader className="bg-indigo-50 p-8"><CardTitle className="text-xl font-black flex items-center gap-3 text-indigo-900"><ShieldAlert size={24} /> Contralateral vs Ipsilateral</CardTitle></CardHeader>
                    <CardContent className="p-8 space-y-6">
                      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100"><h4 className="font-black text-indigo-600 text-xs uppercase tracking-widest mb-2">Cortical Logic (Contralateral)</h4><p className="text-sm text-slate-600 leading-relaxed font-medium">The <strong>Cortex</strong> (PFC, M1, S1) controls the opposite side of the body. If the left side is dysfunctional, check the right cortex.</p></div>
                      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100"><h4 className="font-black text-rose-600 text-xs uppercase tracking-widest mb-2">Subcortical Logic (Ipsilateral)</h4><p className="text-sm text-slate-600 leading-relaxed font-medium">The <strong>Brainstem & Cerebellum</strong> control the same side of the body. If the left side is dysfunctional, check the left cerebellum.</p></div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="spinal"><SpinalSegmentReference /></TabsContent>
            <TabsContent value="vestibular">
              <Card className="border-none shadow-lg rounded-3xl overflow-hidden bg-white">
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-8 text-white">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center"><Footprints size={32} /></div>
                    <div><CardTitle className="text-3xl font-black">Fukuda Step Test</CardTitle></div>
                  </div>
                  <p className="text-emerald-50 text-lg max-w-2xl leading-relaxed">Examines labyrinthine function by triggering vestibulospinal reflexes.</p>
                </div>
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-2 space-y-10">
                      <section className="space-y-4">
                        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2"><Info size={20} className="text-emerald-600" /> Purpose & Context</h3>
                        <p className="text-slate-600 leading-relaxed">The Unterberger (Fukuda) test is best implemented as a diagnostic method to isolate <strong>peripheral labyrinthine dysfunction</strong>.</p>
                      </section>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="lymphatic">
              <Card className="border-none shadow-lg rounded-3xl overflow-hidden bg-white">
                <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-8 text-white">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center"><Droplets size={32} /></div>
                    <div><CardTitle className="text-3xl font-black">Lymphatic System Assessment</CardTitle></div>
                  </div>
                  <p className="text-blue-50 text-lg max-w-2xl leading-relaxed">"Drainage Precedes Supply" — Addressing lymphatic stasis to reduce neural inflammation.</p>
                </div>
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-2 space-y-10">
                      <section className="space-y-4">
                        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2"><Info size={20} className="text-blue-600" /> Philosophy & Theory</h3>
                        <p className="text-slate-600 leading-relaxed">The lymphatic system is the body's primary waste removal network.</p>
                      </section>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      )}
    </div>
  );
};

export default ResourcesPage;