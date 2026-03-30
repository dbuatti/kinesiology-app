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
  ChevronRight,
  Eye,
  Timer,
  CheckCircle2,
  Baby,
  Palette,
  FileText,
  Volume2,
  Calculator,
  Wind,
  Hand,
  ExternalLink,
  Dumbbell
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SIGNS_OF_SHIFT } from "@/data/emotion-data";

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
import MechanoMasteryModule from "@/components/crm/MechanoMasteryModule";
import MechanoBible from "@/components/crm/MechanoBible";
import RightingReflexesAssessment from "@/components/crm/RightingReflexesAssessment";
import CranialNerveReference from "@/components/crm/CranialNerveReference";
import PrimitiveReflexReference from "@/components/crm/PrimitiveReflexReference";
import CranialNerveHomeworkTool from "@/components/crm/CranialNerveHomeworkTool";
import BrainstemBreathingReference from "@/components/crm/BrainstemBreathingReference";
import AppLayout from "@/components/crm/AppLayout";
import PulsePointReference from "@/components/crm/PulsePointReference";
import HandPolarityReference from "@/components/crm/HandPolarityReference";
import MuscleReference from "@/components/crm/MuscleReference";

const CATEGORIES = [
  {
    id: "foundations",
    label: "Foundations",
    icon: GraduationCap,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
    borderColor: "border-indigo-100 dark:border-indigo-900/30",
    items: [
      { id: "mechano-academy", label: "Mechano Academy", icon: Trophy, desc: "Daily clinical drills and mastery tools." },
      { id: "bible", label: "Mechano Bible", icon: BookOpen, desc: "Definitive guide to joints and movement geometry." },
      { id: "theory", label: "FN Theory", icon: Workflow, desc: "Functional Neurology approach and principles." },
    ]
  },
  {
    id: "worksheets",
    label: "Worksheets",
    icon: FileText,
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-900/20",
    borderColor: "border-purple-100 dark:border-purple-900/30",
    items: [
      { id: "north-star", label: "North Star", icon: Compass, desc: "Define your core intention and commitment.", path: "/resources/worksheets/north-star" },
      { id: "inner-awareness", label: "Inner Awareness", icon: ShieldCheck, desc: "Daily practice for sovereignty and state.", path: "/resources/worksheets/inner-awareness" },
      { id: "week-3", label: "Week 3: Curses", icon: ShieldCheck, desc: "Releasing generational trauma imprints.", path: "/resources/worksheets/week-3" },
      { id: "fear-creativity", label: "Fear & Creativity", icon: Palette, desc: "Awareness of fear in the body and mind.", path: "/resources/worksheets/fear-creativity" },
      { id: "anger-flow", label: "Anger & Flow", icon: RefreshCw, desc: "Week 8: Reclaiming expression and self-acceptance.", path: "/resources/worksheets/anger-flow" },
    ]
  },
  {
    id: "clinical",
    label: "Clinical Reference",
    icon: Activity,
    color: "text-rose-600",
    bgColor: "bg-rose-50 dark:bg-rose-900/20",
    borderColor: "border-rose-100 dark:border-rose-900/30",
    items: [
      { id: "muscles", label: "Muscle Reference", icon: Dumbbell, desc: "Manage reference images and clinical details for all muscles." },
      { id: "primitive", label: "Primitive Reflexes", icon: Baby, desc: "Foundational OS of the nervous system." },
      { id: "cranial", label: "Cranial Nerves", icon: Zap, desc: "12 nerves, nuclei, and assessment protocols." },
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
    bgColor: "bg-emerald-50 dark:bg-indigo-900/20",
    borderColor: "border-emerald-100 dark:border-emerald-900/30",
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
    bgColor: "bg-amber-50 dark:bg-amber-900/20",
    borderColor: "border-amber-100 dark:border-amber-900/30",
    items: [
      { id: "emotional-theory", label: "Emotional Theory", icon: Heart, desc: "The 9-step Neuro-Emotional hierarchy." },
      { id: "rehab-calc", label: "Rehab Calc", icon: Calculator, desc: "Calculate 70% threshold for nerve homework." },
      { id: "brainstem-breath", label: "Brainstem Breath", icon: Wind, desc: "Breathing patterns for Midbrain, Pons, Medulla." },
      { id: "logic", label: "Clinical Logic", icon: Lightbulb, desc: "The hierarchy of neurological correction." },
      { id: "spinal", label: "Spinal", icon: Move, desc: "Spinal segment and Lovett-Brother associations." },
      { id: "lymphatic", label: "Lymphatic", icon: Droplets, desc: "Drainage protocols and counterstrain points." },
      { id: "postural", label: "Postural Reflexes", icon: RefreshCw, desc: "Ocular and Labyrinthine righting reflexes." },
    ]
  }
];

const PEACE_METHOD_URL = "https://functional-neuro-health.notion.site/Functional-Neuro-Health-The-PEACE-Method-28beacafb4a88026b9a9ccdefa4e1de9";

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
    <AppLayout>
      <div className="p-4 md:p-8 max-w-full mx-auto space-y-8">
        <Breadcrumbs items={[{ label: "Resources" }]} />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <Badge className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50 font-black text-[10px] uppercase tracking-[0.3em] px-4 py-1 mb-2">
              Integrated Healer
            </Badge>
            <h1 className="text-4xl font-black tracking-tight text-foreground">Knowledge Base</h1>
            <p className="text-muted-foreground font-medium mt-1 text-lg">Tools for your transformation journey and clinical practice.</p>
          </div>
          {activeTab !== "hub" && (
            <Button 
              variant="outline" 
              onClick={() => handleTabChange("hub")}
              className="rounded-xl border-border bg-card hover:bg-muted font-bold text-xs uppercase tracking-widest h-12 px-6"
            >
              <LayoutGrid size={18} className="mr-2" /> Back to Hub
            </Button>
          )}
        </div>

        {activeTab === "hub" ? (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* PEACE Method Featured Resource */}
            <a href={PEACE_METHOD_URL} target="_blank" rel="noopener noreferrer" className="block group">
              <Card className="border-none shadow-2xl rounded-[3rem] bg-gradient-to-br from-indigo-600 via-purple-600 to-rose-600 text-white overflow-hidden relative cursor-pointer hover:shadow-3xl hover:-translate-y-1 transition-all duration-500">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />
                <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:opacity-20 transition-opacity">
                  <BookOpen size={200} />
                </div>
                <CardContent className="p-10 md:p-14 relative z-10">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-6 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <Badge className="bg-white/20 text-white border-white/30 font-black text-[10px] uppercase tracking-[0.3em] px-4 py-1.5 backdrop-blur-sm">
                          Mastery Edition
                        </Badge>
                        <Badge className="bg-amber-400/20 text-amber-200 border-amber-400/30 font-black text-[10px] uppercase tracking-[0.3em] px-4 py-1.5 backdrop-blur-sm">
                          2025 Gold Standard
                        </Badge>
                      </div>
                      <div className="space-y-3">
                        <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-none">
                          The PEACE Method
                        </h2>
                        <p className="text-xl md:text-2xl font-medium text-white/80 max-w-2xl leading-relaxed">
                          Living Practitioner Reference Guide — your single source of truth for the FNH clinical framework.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-4 pt-2">
                        {["P — Preliminary", "E — Ease", "A — Align", "C — Correct", "E — Embed"].map((step) => (
                          <span key={step} className="text-[10px] font-black uppercase tracking-widest text-white/60 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                            {step}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-4 md:items-end">
                      <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                        <ExternalLink size={36} className="text-white" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60 group-hover:text-white transition-colors">
                        Open in Notion →
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </a>

            {CATEGORIES.map((category) => (
              <div key={category.id} className="space-y-6">
                <div className="flex items-center gap-3 px-2">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-sm", category.bgColor, category.color)}>
                    <category.icon size={20} />
                  </div>
                  <h2 className="text-2xl font-black text-foreground tracking-tight">{category.label}</h2>
                  <div className="flex-1 h-[2px] bg-border rounded-full ml-4" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {category.items.map((item) => (
                    <Link 
                      key={item.id} 
                      to={(item as any).path || `/resources?tab=${item.id}`}
                      className="block"
                    >
                      <Card 
                        className="border-none shadow-md rounded-[2rem] bg-card hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer overflow-hidden h-full"
                      >
                        <CardContent className="p-8 space-y-4">
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-sm",
                            category.bgColor, category.color
                          )}>
                            <item.icon size={24} />
                          </div>
                          <div>
                            <h3 className="text-lg font-black text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{item.label}</h3>
                            <p className="text-xs text-muted-foreground font-medium mt-1 leading-relaxed">{item.desc}</p>
                          </div>
                          <div className="pt-2 flex items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            Open Tool <ChevronRight size={12} className="ml-1 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
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
                activeCategory?.bgColor || "bg-muted"
              )}>
                {activeCategory?.items.map((item) => (
                  <TabsTrigger 
                    key={item.id} 
                    value={item.id} 
                    className="rounded-xl py-2.5 px-6 data-[state=active]:bg-card data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-widest"
                  >
                    <item.icon size={16} className="mr-2" /> {item.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {/* Foundations */}
              <TabsContent value="mechano-academy"><MechanoMasteryModule /></TabsContent>
              <TabsContent value="bible"><MechanoBible /></TabsContent>
              <TabsContent value="theory"><FnTheory /></TabsContent>

              {/* Clinical Reference */}
              <TabsContent value="muscles"><MuscleReference /></TabsContent>
              <TabsContent value="primitive"><PrimitiveReflexReference /></TabsContent>
              <TabsContent value="cranial"><CranialNerveReference /></TabsContent>
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
              <TabsContent value="emotional-theory">
                <div className="space-y-12">
                  <Card className="border-none shadow-2xl rounded-[3.5rem] bg-slate-900 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-12 opacity-5"><Heart size={200} /></div>
                    <CardHeader className="p-12 relative z-10">
                      <div className="flex items-center gap-5 mb-4">
                        <div className="w-16 h-16 bg-rose-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-rose-500/40">
                          <Heart size={32} className="text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-4xl font-black tracking-tight">Neuro-Emotional Integration</CardTitle>
                          <CardDescription className="text-slate-400 text-xl font-medium mt-2">
                            Remapping the physiological association to emotional stress.
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <Card className="lg:col-span-2 border-none shadow-lg rounded-[2.5rem] bg-card overflow-hidden">
                      <CardHeader className="p-8 bg-rose-50 dark:bg-rose-900/20">
                        <h3 className="text-2xl font-black flex items-center gap-3 text-rose-900 dark:text-rose-100">
                          <Info size={28} /> The 9-Step Hierarchy
                        </h3>
                      </CardHeader>
                      <CardContent className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[
                            { s: 1, t: "ESR Indicator Check", d: "Hold forehead points (GB14) to see if the system is ready." },
                            { s: 2, t: "Permission Check", d: "Always ask for permission before starting deep emotional work." },
                            { s: 3, t: "Timeline Selection", d: "Determine if the stress is Current or Historic." },
                            { s: 4, t: "Timeline Regression", d: "Narrow down the specific age and month of origin." },
                            { s: 5, t: "Primary Emotion", d: "Identify the core feeling (Hurt, Worry, Sadness, Fear, Anger)." },
                            { s: 6, t: "Priority Organ", d: "Find the organ acting as a surrogate for the charge." },
                            { s: 7, t: "Energy Polarity", d: "Challenge for Energy IN (+) or Energy OUT (-)." },
                            { s: 8, t: "Eye Position", d: "Identify the sensory access point (NLP logic)." },
                            { s: 9, t: "Correction & Upload", d: "Hold ESR + Pulse Point + Eye Position + Replay Stress + Positive Upload." }
                          ].map(step => (
                            <div key={step.s} className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                              <span className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center font-black text-xs shrink-0">{step.s}</span>
                              <div>
                                <h4 className="font-black text-slate-900 dark:text-slate-100 text-xs uppercase tracking-tight">{step.t}</h4>
                                <p className="text-[10px] text-slate-500 font-medium leading-tight mt-1">{step.d}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <div className="space-y-8">
                      <PulsePointReference />
                      <HandPolarityReference />
                      
                      <Card className="border-none shadow-lg rounded-[2.5rem] bg-indigo-900 text-white overflow-hidden">
                        <CardHeader className="p-8 pb-4">
                          <CardTitle className="text-xl font-black flex items-center gap-3">
                            <Brain size={24} className="text-indigo-400" /> Why it Works
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 pt-0 space-y-4">
                          <p className="text-sm text-slate-300 leading-relaxed">
                            "Talk therapy often fails because it doesn't go to the depths of the physiology to clear the circuit. We are bringing blood flow back to the <strong>Frontal Lobe</strong> while remapping the <strong>Limbic</strong> response."
                          </p>
                          <div className="pt-4 border-t border-white/10">
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Signs of Shift</p>
                            <div className="flex flex-wrap gap-2">
                              {SIGNS_OF_SHIFT.map(s => (
                                <Badge key={s} className="bg-white/10 text-white border-none text-[8px] font-black uppercase">{s}</Badge>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="rehab-calc"><CranialNerveHomeworkTool /></TabsContent>
              <TabsContent value="brainstem-breath"><BrainstemBreathingReference /></TabsContent>
              <TabsContent value="logic">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <Card className="border-none shadow-lg rounded-[3rem] bg-slate-900 dark:bg-slate-950 text-white overflow-hidden relative">
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
                    <Card className="border-none shadow-lg rounded-[2.5rem] bg-card overflow-hidden">
                      <CardHeader className="bg-indigo-50 dark:bg-indigo-900/20 p-8"><CardTitle className="text-xl font-black flex items-center gap-3 text-indigo-900 dark:text-indigo-100"><ShieldAlert size={24} /> Contralateral vs Ipsilateral</CardTitle></CardHeader>
                      <CardContent className="p-8 space-y-6">
                        <div className="p-5 bg-muted/30 rounded-2xl border border-border"><h4 className="font-black text-indigo-600 dark:text-indigo-400 text-xs uppercase tracking-widest mb-2">Cortical Logic (Contralateral)</h4><p className="text-sm text-muted-foreground leading-relaxed font-medium">The <strong>Cortex</strong> (PFC, M1, S1) controls the opposite side of the body. If the left side is dysfunctional, check the right cortex.</p></div>
                        <div className="p-5 bg-muted/30 rounded-2xl border border-border"><h4 className="font-black text-rose-600 dark:text-rose-400 text-xs uppercase tracking-widest mb-2">Subcortical Logic (Ipsilateral)</h4><p className="text-sm text-muted-foreground leading-relaxed font-medium">The <strong>Brainstem & Cerebellum</strong> control the same side of the body. If the left side is dysfunctional, check the left cerebellum.</p></div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="spinal"><SpinalSegmentReference /></TabsContent>
              <TabsContent value="lymphatic">
                <Card className="border-none shadow-lg rounded-3xl overflow-hidden bg-card">
                  <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-8 text-white">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center"><Droplets size={32} /></div>
                      <div><CardTitle className="text-3xl font-black">Lymphatic System Assessment</CardTitle></div>
                    </div>
                    <p className="text-blue-50 text-lg max-w-2xl leading-relaxed font-medium">"Drainage Precedes Supply" — Addressing lymphatic stasis to reduce neural inflammation.</p>
                  </div>
                  <CardContent className="p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                      <div className="lg:col-span-2 space-y-10">
                        <section className="space-y-4">
                          <h3 className="text-xl font-bold text-foreground flex items-center gap-2"><Info size={20} className="text-blue-600" /> Philosophy & Theory</h3>
                          <p className="text-muted-foreground leading-relaxed font-medium">The lymphatic system is the body's primary waste removal network.</p>
                        </section>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="postural">
                <div className="space-y-12">
                  <Card className="border-none shadow-2xl rounded-[3.5rem] bg-slate-900 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-12 opacity-5"><RefreshCw size={200} /></div>
                    <CardHeader className="p-12 relative z-10">
                      <div className="flex items-center gap-5 mb-4">
                        <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                          <RefreshCw size={32} className="text-blue-400" />
                        </div>
                        <div>
                          <CardTitle className="text-4xl font-black tracking-tight">Postural Righting Reflexes</CardTitle>
                          <CardDescription className="text-slate-400 text-xl font-medium mt-2">
                            The Horizon of the Nervous System
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <Card className="lg:col-span-2 border-none shadow-lg rounded-[2.5rem] bg-card overflow-hidden">
                      <CardHeader className="p-8 bg-indigo-50 dark:bg-indigo-900/20">
                        <h3 className="text-2xl font-black flex items-center gap-3 text-indigo-900 dark:text-indigo-100">
                          <Info size={28} /> Theory & Clinical Significance
                        </h3>
                      </CardHeader>
                      <CardContent className="p-8 space-y-8">
                        <div className="space-y-4">
                          <p className="text-lg font-medium text-muted-foreground leading-relaxed">
                            Righting reflexes are the "next lot" of reflexes that take over once primitive reflexes integrate (usually around 1-2 years). They represent the architecture of the nervous system's ability to organize the head around the eyes and the horizon.
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-3xl border border-blue-100 dark:border-blue-900/30">
                              <h4 className="font-black text-blue-900 dark:text-blue-100 flex items-center gap-2 mb-2">
                                <Eye size={18} /> Ocular Righting
                              </h4>
                              <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                                The ability to keep the head level using visual input. Tested with eyes open on a distant target.
                              </p>
                            </div>
                            <div className="p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-3xl border border-emerald-100 dark:border-emerald-900/30">
                              <h4 className="font-black text-emerald-900 dark:text-emerald-100 flex items-center gap-2 mb-2">
                                <Activity size={18} /> Labyrinthine Righting
                              </h4>
                              <p className="text-sm text-emerald-800 dark:text-emerald-200 font-medium">
                                The vestibular system's ability to organize the head without vision. Tested with eyes closed.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="p-6 bg-amber-50 dark:bg-amber-900/10 rounded-3xl border border-amber-100 dark:border-amber-900/30">
                          <h4 className="font-bold text-amber-900 dark:text-amber-100 mb-2 flex items-center gap-2">
                            <ShieldAlert size={18} /> When to Assess?
                          </h4>
                          <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed font-medium">
                            Prioritize these reflexes in cases of chronic head, neck, shoulder, or back pain that is non-responsive to standard rehab. Also critical for clients experiencing vertigo or motion sickness.
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-none shadow-lg rounded-[2.5rem] bg-slate-900 dark:bg-slate-950 text-white overflow-hidden">
                      <CardHeader className="p-8">
                        <CardTitle className="text-xl font-black flex items-center gap-3">
                          <Zap size={24} className="text-amber-400" /> Correction Logic
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-8 pt-0 space-y-6">
                        <div className="space-y-4">
                          <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                            <p className="text-xs font-black text-amber-400 uppercase tracking-widest mb-2">The Hierarchy</p>
                            <p className="text-sm font-bold leading-tight">Primitive → Postural → Fine Motor</p>
                          </div>
                          <p className="text-sm text-slate-400 leading-relaxed font-medium">
                            If a righting reflex is dysfunctional, it is typically an <strong>Afferent (Mechanoreceptive)</strong> priority.
                          </p>
                          <div className="space-y-3">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Required Tools</p>
                            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                              <Timer size={16} className="text-indigo-400" />
                              <span className="text-xs font-bold">128Hz Tuning Fork</span>
                            </div>
                          </div>
                          <div className="pt-4 border-t border-white/10">
                            <p className="text-xs text-slate-400 italic">"Clearing the primitive reflexes first often clears the righting reflexes automatically."</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-3 mb-6 px-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                        <Target size={20} />
                      </div>
                      <h3 className="text-2xl font-black text-foreground">Interactive Assessment Tool</h3>
                    </div>
                    <RightingReflexesAssessment 
                      appointmentId="temp" 
                      initialNotes={null} 
                      onUpdate={() => {}} 
                    />
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        )}
      </div>
    </AppLayout>
  );
};

export default ResourcesPage;