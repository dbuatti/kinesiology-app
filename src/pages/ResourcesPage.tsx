"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  BookOpen, 
  Footprints, 
  Brain, 
  Activity, 
  ArrowRight, 
  Zap, 
  Move, 
  Droplets, 
  Target, 
  Layers, 
  Sparkles, 
  Clock, 
  RefreshCw, 
  Youtube, 
  ShieldCheck, 
  GraduationCap, 
  Lightbulb, 
  Compass, 
  Workflow, 
  ImageIcon, 
  Trophy,
  LayoutGrid,
  Search
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Breadcrumbs from "@/components/crm/Breadcrumbs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// Import all resource components
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

const RESOURCE_CATEGORIES = [
  {
    id: "foundations",
    title: "Foundations & Theory",
    description: "Core program materials and neurological theory.",
    color: "text-indigo-600 bg-indigo-50",
    items: [
      { id: "intention", title: "North Star", icon: Compass, desc: "Intention & Commitment" },
      { id: "foundations", title: "Foundations", icon: GraduationCap, desc: "Practitioner Journey" },
      { id: "theory", title: "FN Theory", icon: Workflow, desc: "Functional Neuro Logic" },
      { id: "mechano", title: "Mechano Mastery", icon: Trophy, desc: "Joint & Action Drills" },
    ]
  },
  {
    id: "reference",
    title: "Clinical Reference",
    description: "Anatomical maps and reflex point locations.",
    color: "text-rose-600 bg-rose-50",
    items: [
      { id: "brain", title: "Brain Reflexes", icon: Brain, desc: "Cortical & Subcortical" },
      { id: "ligaments", title: "Ligaments", icon: ImageIcon, desc: "Custom Reference Charts" },
      { id: "spinal", title: "Spinal", icon: Move, desc: "Lovett-Brother Logic" },
      { id: "acupoints", title: "Acupoints", icon: Target, desc: "TCM Point Locations" },
    ]
  },
  {
    id: "tcm",
    title: "TCM & Meridians",
    description: "Traditional Chinese Medicine tools and cycles.",
    color: "text-emerald-600 bg-emerald-50",
    items: [
      { id: "clock", title: "Meridian Clock", icon: Clock, desc: "Peak Activity Times" },
      { id: "elements", title: "5 Elements", icon: RefreshCw, desc: "Sheng & Ko Cycles" },
      { id: "channels", title: "Channels", icon: Layers, desc: "Meridian Details" },
    ]
  },
  {
    id: "practice",
    title: "Practice Tools",
    description: "Clinical aids and educational resources.",
    color: "text-amber-600 bg-amber-50",
    items: [
      { id: "logic", title: "Clinical Logic", icon: Lightbulb, desc: "Hierarchy of Correction" },
      { id: "cheatsheet", title: "Cheat Sheets", icon: Zap, desc: "Clinical Complaints" },
      { id: "video", title: "Video Library", icon: Youtube, desc: "Technique Demos" },
      { id: "lymphatic", title: "Lymphatic", icon: Droplets, desc: "Drainage Protocols" },
      { id: "vestibular", title: "Vestibular", icon: Footprints, desc: "Balance Assessments" },
    ]
  }
];

const ResourcesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "hub";
  const [searchQuery, setSearchQuery] = useState("");

  const allItems = RESOURCE_CATEGORIES.flatMap(cat => cat.items);
  const filteredItems = searchQuery 
    ? allItems.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.desc.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : null;

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="p-4 md:p-8 max-w-full mx-auto space-y-8 pb-24">
      <Breadcrumbs items={[{ label: "Resources" }]} />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <Badge className="bg-indigo-100 text-indigo-600 border-indigo-200 font-black text-[10px] uppercase tracking-[0.3em] px-4 py-1">
            Integrated Healer
          </Badge>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Resource Hub</h1>
          <p className="text-slate-500 font-medium text-lg">Clinical tools, reference maps, and educational materials.</p>
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input 
            placeholder="Search resources..." 
            className="pl-12 bg-white border-slate-200 rounded-2xl h-12 shadow-sm font-medium focus:ring-2 focus:ring-indigo-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="sticky top-0 z-30 bg-slate-50/95 backdrop-blur-sm py-4 -mx-4 px-4 border-b border-slate-200 mb-8">
          <div className="overflow-x-auto no-scrollbar">
            <TabsList className="flex w-max h-auto p-1.5 bg-slate-200/50 rounded-2xl gap-1">
              <TabsTrigger value="hub" className="rounded-xl py-2.5 px-6 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-widest">
                <LayoutGrid size={16} className="mr-2" /> All Resources
              </TabsTrigger>
              {RESOURCE_CATEGORIES.map(cat => (
                <div key={cat.id} className="flex items-center gap-1 px-2 border-l border-slate-300/50 first:border-none">
                  {cat.items.map(item => (
                    <TabsTrigger 
                      key={item.id} 
                      value={item.id} 
                      className="rounded-xl py-2.5 px-4 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm font-bold text-[10px] uppercase tracking-widest"
                    >
                      <item.icon size={14} className="mr-2" /> {item.title}
                    </TabsTrigger>
                  ))}
                </div>
              ))}
            </TabsList>
          </div>
        </div>

        {/* Hub View */}
        <TabsContent value="hub" className="mt-0 space-y-12 animate-in fade-in duration-500">
          {searchQuery && filteredItems ? (
            <div className="space-y-6">
              <h2 className="text-xl font-black text-slate-900 px-2">Search Results for "{searchQuery}"</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredItems.map(item => (
                  <button 
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className="p-6 rounded-[2rem] bg-white border-2 border-slate-100 hover:border-indigo-500 hover:shadow-xl transition-all text-left group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <item.icon size={24} />
                    </div>
                    <h3 className="font-black text-slate-900 text-lg">{item.title}</h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">{item.desc}</p>
                  </button>
                ))}
              </div>
              {filteredItems.length === 0 && (
                <div className="text-center py-20 bg-slate-100 rounded-[3rem] border-2 border-dashed border-slate-200">
                  <Search size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500 font-bold">No resources found matching your search.</p>
                </div>
              )}
            </div>
          ) : (
            RESOURCE_CATEGORIES.map(category => (
              <div key={category.id} className="space-y-6">
                <div className="flex items-center gap-4 px-2">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-sm", category.color)}>
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">{category.title}</h2>
                    <p className="text-sm text-slate-500 font-medium">{category.description}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {category.items.map(item => (
                    <button 
                      key={item.id}
                      onClick={() => handleTabChange(item.id)}
                      className="p-8 rounded-[2.5rem] bg-white border-2 border-slate-100 hover:border-indigo-500 hover:shadow-2xl transition-all text-left group relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-700">
                        <item.icon size={80} />
                      </div>
                      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform", category.color)}>
                        <item.icon size={28} />
                      </div>
                      <h3 className="font-black text-slate-900 text-xl">{item.title}</h3>
                      <p className="text-sm text-slate-500 font-medium mt-2 leading-relaxed">{item.desc}</p>
                      <div className="mt-6 flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                        Open Tool <ArrowRight size={12} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </TabsContent>

        {/* Individual Resource Contents */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
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

          <TabsContent value="mechano"><MechanoMastery /></TabsContent>
          <TabsContent value="theory"><FnTheory /></TabsContent>
          <TabsContent value="clock"><MeridianClock /></TabsContent>
          <TabsContent value="logic" className="space-y-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="border-none shadow-lg rounded-[3rem] bg-slate-900 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 p-10 opacity-10"><Lightbulb size={150} /></div>
                <CardHeader className="p-10">
                  <CardTitle className="text-3xl font-black flex items-center gap-4"><Zap size={32} className="text-amber-400" /> The Hierarchy of Correction</CardTitle>
                  <CardDescription className="text-slate-400 text-lg font-medium mt-2">Clinical reasoning follows a specific neurological order.</CardDescription>
                </CardHeader>
                <CardContent className="p-10 pt-0 space-y-4 relative z-10">
                  {[
                    { step: 1, title: "Safety First", desc: "Address SNS dominance before deep work." },
                    { step: 2, title: "Foundations", desc: "Check Primitive Reflexes and Cranial Nerves." },
                    { step: 3, title: "Input (Afferent)", desc: "Calibrate Mechanoreceptors and Vestibular systems." },
                    { step: 4, title: "Output (Efferent)", desc: "Integrate Cortical and Subcortical processing." }
                  ].map((item) => (
                    <div key={item.step} className="flex gap-5 p-5 bg-white/5 rounded-2xl border border-white/10">
                      <span className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-black text-lg shrink-0">{item.step}</span>
                      <div>
                        <h4 className="font-black text-indigo-300 uppercase tracking-widest text-xs mb-1">{item.title}</h4>
                        <p className="text-sm text-slate-300 font-medium leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <div className="space-y-8">
                <Card className="border-none shadow-lg rounded-[2.5rem] bg-white overflow-hidden">
                  <CardHeader className="bg-indigo-50 p-8"><CardTitle className="text-xl font-black flex items-center gap-3 text-indigo-900">Contralateral vs Ipsilateral</CardTitle></CardHeader>
                  <CardContent className="p-8 space-y-6">
                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                      <h4 className="font-black text-indigo-600 text-xs uppercase tracking-widest mb-2">Cortical Logic (Contralateral)</h4>
                      <p className="text-sm text-slate-600 leading-relaxed font-medium">The Cortex controls the opposite side of the body.</p>
                    </div>
                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                      <h4 className="font-black text-rose-600 text-xs uppercase tracking-widest mb-2">Subcortical Logic (Ipsilateral)</h4>
                      <p className="text-sm text-slate-600 leading-relaxed font-medium">The Brainstem & Cerebellum control the same side of the body.</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="brain"><BrainReflexReference /></TabsContent>
          <TabsContent value="ligaments"><LigamentReference /></TabsContent>
          <TabsContent value="foundations" className="space-y-10">
            <Card className="border-none shadow-lg rounded-[2.5rem] bg-white overflow-hidden">
              <div className="bg-indigo-600 p-8 text-white">
                <h3 className="text-2xl font-black flex items-center gap-3"><ShieldCheck size={28} /> The Practitioner's Journey</h3>
              </div>
              <CardContent className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-center space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">2 Years Experience</p>
                    <p className="text-5xl font-black text-indigo-600">65%</p>
                  </div>
                  <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100 text-center space-y-2">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">5+ Years Experience</p>
                    <p className="text-5xl font-black text-indigo-600">95%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="cheatsheet"><ClinicalCheatSheet /></TabsContent>
          <TabsContent value="video"><VideoLibrary /></TabsContent>
          <TabsContent value="elements"><FiveElementCycle /></TabsContent>
          <TabsContent value="channels"><TcmChannelReference /></TabsContent>
          <TabsContent value="acupoints"><AcupointReference /></TabsContent>
          <TabsContent value="spinal"><SpinalSegmentReference /></TabsContent>
          <TabsContent value="vestibular">
            <Card className="border-none shadow-lg rounded-3xl overflow-hidden bg-white">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-8 text-white">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center"><Footprints size={32} /></div>
                  <CardTitle className="text-3xl font-black">Fukuda Step Test</CardTitle>
                </div>
              </div>
              <CardContent className="p-8">
                <p className="text-slate-600 leading-relaxed">Examines labyrinthine function by triggering vestibulospinal reflexes.</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="lymphatic">
            <Card className="border-none shadow-lg rounded-3xl overflow-hidden bg-white">
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-8 text-white">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center"><Droplets size={32} /></div>
                  <CardTitle className="text-3xl font-black">Lymphatic System Assessment</CardTitle>
                </div>
              </div>
              <CardContent className="p-8">
                <p className="text-slate-600 leading-relaxed">"Drainage Precedes Supply" — Addressing lymphatic stasis.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default ResourcesPage;