"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { 
  BookOpen, 
  Footprints, 
  Scale, 
  Brain, 
  Wind, 
  Activity, 
  ExternalLink, 
  Info, 
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  FileText,
  Search,
  Zap,
  XCircle,
  Move,
  Droplets,
  Target,
  Heart,
  Layers,
  Sparkles,
  Dumbbell,
  Clock,
  RefreshCw,
  Youtube,
  TrendingUp,
  ShieldCheck,
  GraduationCap,
  Crosshair,
  Lightbulb,
  ShieldAlert,
  Compass,
  GitBranch,
  Eye,
  Workflow,
  ImageIcon,
  Trophy
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Breadcrumbs from "@/components/crm/Breadcrumbs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
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

const ResourcesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "intention";

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
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setSearchParams({ tab: v })} className="w-full">
        <div className="overflow-x-auto pb-4">
          <TabsList className="flex w-max h-auto p-1.5 bg-slate-200/50 rounded-2xl gap-1">
            <TabsTrigger value="intention" className="rounded-xl py-2.5 px-6 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-widest">
              <Compass size={16} className="mr-2" /> North Star Process
            </TabsTrigger>
            <TabsTrigger value="mechano" className="rounded-xl py-2.5 px-6 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-widest">
              <Trophy size={16} className="mr-2" /> Mechano Mastery
            </TabsTrigger>
            <TabsTrigger value="theory" className="rounded-xl py-2.5 px-6 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-widest">
              <Workflow size={16} className="mr-2" /> FN Theory
            </TabsTrigger>
            <TabsTrigger value="clock" className="rounded-xl py-2.5 px-6 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-widest">
              <Clock size={16} className="mr-2" /> Meridian Clock
            </TabsTrigger>
            <TabsTrigger value="logic" className="rounded-xl py-2.5 px-6 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-widest">
              <Lightbulb size={16} className="mr-2" /> Clinical Logic
            </TabsTrigger>
            <TabsTrigger value="brain" className="rounded-xl py-2.5 px-6 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-widest">
              <Brain size={16} className="mr-2" /> Brain Reflexes
            </TabsTrigger>
            <TabsTrigger value="ligaments" className="rounded-xl py-2.5 px-6 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-widest">
              <ImageIcon size={16} className="mr-2" /> Ligaments
            </TabsTrigger>
            <TabsTrigger value="foundations" className="rounded-xl py-2.5 px-6 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-widest">
              <GraduationCap size={16} className="mr-2" /> Foundations
            </TabsTrigger>
            <TabsTrigger value="cheatsheet" className="rounded-xl py-2.5 px-6 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-widest">
              <Zap size={16} className="mr-2" /> Cheat Sheets
            </TabsTrigger>
            <TabsTrigger value="video" className="rounded-xl py-2.5 px-6 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-widest">
              <Youtube size={16} className="mr-2" /> Video Library
            </TabsTrigger>
            <TabsTrigger value="elements" className="rounded-xl py-2.5 px-6 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-widest">
              <RefreshCw size={16} className="mr-2" /> 5 Elements
            </TabsTrigger>
            <TabsTrigger value="channels" className="rounded-xl py-2.5 px-6 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-widest">
              <Layers size={16} className="mr-2" /> Channels
            </TabsTrigger>
            <TabsTrigger value="acupoints" className="rounded-xl py-2.5 px-6 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-widest">
              <Target size={16} className="mr-2" /> Acupoints
            </TabsTrigger>
            <TabsTrigger value="spinal" className="rounded-xl py-2.5 px-6 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-widest">
              <Move size={16} className="mr-2" /> Spinal
            </TabsTrigger>
            <TabsTrigger value="vestibular" className="rounded-xl py-2.5 px-6 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-widest">
              <Footprints size={16} className="mr-2" /> Vestibular
            </TabsTrigger>
            <TabsTrigger value="lymphatic" className="rounded-xl py-2.5 px-6 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-widest">
              <Droplets size={16} className="mr-2" /> Lymphatic
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="intention" className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="border-none shadow-lg rounded-[2.5rem] bg-indigo-600 text-white overflow-hidden">
            <CardHeader className="p-10">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                  <Compass size={32} className="text-indigo-300" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-black">North Star Worksheet</CardTitle>
                  <CardDescription className="text-indigo-200 text-lg mt-1">
                    Define your core intention and commitment.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-10 pt-0">
              <p className="text-indigo-100 mb-6">
                This interactive worksheet is a dedicated space for deep reflection. It's designed to be a focused experience. Click below to open the worksheet in a full-page view.
              </p>
              <Button asChild className="bg-white text-indigo-600 hover:bg-indigo-50 h-12 px-8 rounded-xl font-bold">
                <Link to="/north-star">
                  Open North Star Worksheet <ArrowRight className="ml-2" size={16} />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mechano" className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <MechanoMastery />
        </TabsContent>

        <TabsContent value="theory" className="mt-8 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <FnTheory />
        </TabsContent>

        <TabsContent value="clock" className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <MeridianClock />
        </TabsContent>

        <TabsContent value="logic" className="mt-8 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-none shadow-lg rounded-[3rem] bg-slate-900 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 p-10 opacity-10"><Lightbulb size={150} /></div>
              <CardHeader className="p-10">
                <CardTitle className="text-3xl font-black flex items-center gap-4">
                  <Zap size={32} className="text-amber-400" /> The Hierarchy of Correction
                </CardTitle>
                <CardDescription className="text-slate-400 text-lg font-medium mt-2">
                  Clinical reasoning follows a specific neurological order to ensure lasting results.
                </CardDescription>
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
                      <div>
                        <h4 className="font-black text-indigo-300 uppercase tracking-widest text-xs mb-1">{item.title}</h4>
                        <p className="text-sm text-slate-300 font-medium leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-8">
              <Card className="border-none shadow-lg rounded-[2.5rem] bg-white overflow-hidden">
                <CardHeader className="bg-indigo-50 p-8">
                  <CardTitle className="text-xl font-black flex items-center gap-3 text-indigo-900">
                    <ShieldAlert size={24} /> Contralateral vs Ipsilateral
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <h4 className="font-black text-indigo-600 text-xs uppercase tracking-widest mb-2">Cortical Logic (Contralateral)</h4>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">
                      The <strong>Cortex</strong> (PFC, M1, S1) controls the opposite side of the body. If the left side is dysfunctional, check the right cortex.
                    </p>
                  </div>
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <h4 className="font-black text-rose-600 text-xs uppercase tracking-widest mb-2">Subcortical Logic (Ipsilateral)</h4>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">
                      The <strong>Brainstem & Cerebellum</strong> control the same side of the body. If the left side is dysfunctional, check the left cerebellum.
                    </p>
                  </div>
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <h4 className="font-black text-purple-600 text-xs uppercase tracking-widest mb-2">Limbic Lateralization</h4>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">
                      <strong>Left Limbic:</strong> Historical/past trauma. <strong>Right Limbic:</strong> Current emotional processing.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-lg rounded-[2.5rem] bg-indigo-600 text-white overflow-hidden">
                <CardContent className="p-8 space-y-4">
                  <div className="flex items-center gap-3">
                    <Sparkles size={24} className="text-teal-300" />
                    <h4 className="text-lg font-black">The Rule of Action</h4>
                  </div>
                  <p className="text-indigo-100 font-medium leading-relaxed italic">
                    "Joints act, muscles and tissues react. The cerebellum is always paying attention to the joint action first. Calibrate the joint to fix the muscle."
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="brain" className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <BrainReflexReference />
        </TabsContent>

        <TabsContent value="ligaments" className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <LigamentReference />
        </TabsContent>

        <TabsContent value="foundations" className="mt-8 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 border-none shadow-lg rounded-[2.5rem] bg-white overflow-hidden">
              <div className="bg-indigo-600 p-8 text-white">
                <h3 className="text-2xl font-black flex items-center gap-3">
                  <ShieldCheck size={28} /> The Practitioner's Journey
                </h3>
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
                  <h4 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
                    <Info size={18} /> Practitioner Insight
                  </h4>
                  <p className="text-sm text-amber-800 leading-relaxed italic">
                    "I always second guess myself, even after 12 years. You have no idea the biases going on in your mind. Stay loose in the saddle and respond to what is happening in front of you."
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg rounded-[2.5rem] bg-slate-900 text-white overflow-hidden">
              <CardHeader className="p-8">
                <CardTitle className="text-xl font-black flex items-center gap-3">
                  <Brain size={24} className="text-purple-400" /> Neurological Hierarchy
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-6">
                <div className="space-y-4">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                    <p className="text-xs font-black text-purple-400 uppercase tracking-widest mb-2">The Rule of Action</p>
                    <p className="text-lg font-bold leading-tight">"Joints act, muscles and tissues react."</p>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Joint actions are more important than muscles and fascia. They are "slaves" to the joint. The cerebellum is always paying attention to the joint action first.
                  </p>
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-xs font-black text-rose-400 uppercase tracking-widest mb-2">Pandora's Box</p>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      Neurological work brings up and clears deeper layers of compensation. As you create safety for the system, deeper emotional layers will surface.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cheatsheet" className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <ClinicalCheatSheet />
        </TabsContent>

        <TabsContent value="video" className="mt-8">
          <VideoLibrary />
        </TabsContent>

        <TabsContent value="elements" className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <FiveElementCycle />
        </TabsContent>

        <TabsContent value="channels" className="mt-8">
          <TcmChannelReference />
        </TabsContent>

        <TabsContent value="acupoints" className="mt-8">
          <AcupointReference />
        </TabsContent>

        <TabsContent value="spinal" className="mt-8">
          <SpinalSegmentReference />
        </TabsContent>

        <TabsContent value="vestibular" className="mt-8 space-y-8">
          <Card className="border-none shadow-lg rounded-3xl overflow-hidden bg-white">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-8 text-white">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                  <Footprints size={32} />
                </div>
                <div>
                  <div className="flex gap-2 mb-1">
                    <Badge className="bg-emerald-400/30 text-white border-none">Assessment Protocol</Badge>
                    <Badge className="bg-white/20 text-white border-none">Unterberger Test</Badge>
                  </div>
                  <CardTitle className="text-3xl font-black">Fukuda Step Test</CardTitle>
                </div>
              </div>
              <p className="text-emerald-50 text-lg max-w-2xl leading-relaxed">
                Examines labyrinthine function by triggering vestibulospinal reflexes. Used to isolate peripheral vestibular dysfunction and postural instability.
              </p>
            </div>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-10">
                  <section className="space-y-4">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <Info size={20} className="text-emerald-600" /> Purpose & Context
                    </h3>
                    <p className="text-slate-600 leading-relaxed">
                      The Unterberger (Fukuda) test is best implemented as a diagnostic method to isolate <strong>peripheral labyrinthine dysfunction</strong> in ambulatory individuals. It is most useful for patients at an advanced stage of vestibular rehabilitation where isolating nuanced balance mechanisms is required.
                    </p>
                  </section>

                  <section className="space-y-4">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <CheckCircle2 size={20} className="text-emerald-600" /> How to Perform
                    </h3>
                    <div className="grid gap-4">
                      {[
                        { step: 1, text: "Stand in a designated area (ideally marked with 0.5m and 1.0m concentric circles divided by 30° angles)." },
                        { step: 2, text: "Blindfold the patient (or close eyes) and instruct them to hold both arms straight out anteriorly." },
                        { step: 3, text: "Instruct the patient to step in place for 50 or 100 paces at a rhythmic, brisk walking pace." },
                        { step: 4, text: "Observe for body sway, trajectory length, and the final angle of rotation from the starting line." }
                      ].map((item) => (
                        <div key={item.step} className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <span className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold shrink-0">{item.step}</span>
                          <p className="text-slate-700 font-medium">{item.text}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                <div className="space-y-6">
                  <Card className="border-2 border-emerald-100 bg-emerald-50/50 rounded-3xl shadow-none">
                    <CardHeader>
                      <CardTitle className="text-lg font-bold text-emerald-900">Results Assessment</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 bg-white rounded-2xl border border-emerald-100">
                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">50 Steps</p>
                        <p className="text-lg font-bold text-slate-900">Angle {">"} 30°</p>
                        <p className="text-lg font-bold text-slate-900">Displacement {">"} 0.5m</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lymphatic" className="mt-8 space-y-8">
          <Card className="border-none shadow-lg rounded-3xl overflow-hidden bg-white">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-8 text-white">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                  <Droplets size={32} />
                </div>
                <div>
                  <div className="flex gap-2 mb-1">
                    <Badge className="bg-blue-400/30 text-white border-none">Drainage Protocol</Badge>
                    <Badge className="bg-white/20 text-white border-none">Counterstrain</Badge>
                  </div>
                  <CardTitle className="text-3xl font-black">Lymphatic System Assessment</CardTitle>
                </div>
              </div>
              <p className="text-blue-50 text-lg max-w-2xl leading-relaxed">
                "Drainage Precedes Supply" — Addressing lymphatic stasis to reduce neural inflammation and systemic toxicity.
              </p>
            </div>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-10">
                  <section className="space-y-4">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <Info size={20} className="text-blue-600" /> Philosophy & Theory
                    </h3>
                    <p className="text-slate-600 leading-relaxed">
                      The lymphatic system is the body's primary waste removal network. When stagnant, it leads to <strong>Neural Inflammation</strong> and the accumulation of inflammatory cytokines.
                    </p>
                  </section>

                  <section className="space-y-4">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <CheckCircle2 size={20} className="text-blue-600" /> Counterstrain Technique
                    </h3>
                    <div className="grid gap-4">
                      {[
                        { step: 1, title: "Identify Suture Side", text: "Palpate the cranial sutures to find the side of greatest tenderness." },
                        { step: 2, title: "Test Indicator Muscle", text: "Find a strong IM that weakens when the tender zone is touched (TL)." },
                        { step: 3, title: "Position for Comfort", text: "Move the body into a position of maximum comfort until tenderness reduces by 70%." },
                        { step: 4, title: "Hold & Breathe", text: "Maintain for 45 to 90 seconds with deep diaphragmatic breathing." }
                      ].map((item) => (
                        <div key={item.step} className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold shrink-0">{item.step}</span>
                          <div>
                            <p className="font-bold text-slate-900 mb-1">{item.title}</p>
                            <p className="text-slate-600 text-sm leading-relaxed">{item.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                <div className="space-y-6">
                  <Card className="border-2 border-blue-100 bg-blue-50/50 rounded-3xl shadow-none">
                    <CardHeader>
                      <CardTitle className="text-lg font-bold text-blue-900">Priority Zones</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 bg-white rounded-2xl border border-blue-100">
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">1. Cervical (Neck)</p>
                        <p className="text-xs text-slate-500">Clears the head and brain (Glymphatics).</p>
                      </div>
                      <div className="p-4 bg-white rounded-2xl border border-blue-100">
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">2. Thoracic (Chest)</p>
                        <p className="text-xs text-slate-500">The main drainage point for the entire body.</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ResourcesPage;