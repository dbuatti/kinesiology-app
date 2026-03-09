"use client";

import React, { useState } from "react";
import { PRIMITIVE_REFLEXES, PrimitiveReflex } from "@/data/primitive-reflex-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  Zap, 
  Info, 
  Activity, 
  Sparkles,
  Baby,
  PlayCircle,
  ShieldAlert,
  Workflow,
  ShieldCheck,
  Brain,
  ChevronRight,
  ListChecks
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

const PrimitiveReflexReference = () => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | 'All'>('All');

  const filteredReflexes = PRIMITIVE_REFLEXES.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) || 
                         r.stimulus.toLowerCase().includes(search.toLowerCase()) ||
                         r.inhibitionPattern.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || r.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', 'Foundational', 'Postural', 'Tactile'];

  return (
    <div className="space-y-12">
      {/* Theory & Process Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-lg rounded-[2.5rem] bg-slate-900 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-10 opacity-5"><Workflow size={150} /></div>
          <CardHeader className="p-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Baby size={24} />
              </div>
              <div>
                <CardTitle className="text-3xl font-black">The Base Language of the Brain</CardTitle>
                <CardDescription className="text-slate-400 text-lg font-medium mt-1">Understanding Primitive Reflexes in Clinical Practice.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-10 pt-0 space-y-6 relative z-10">
            <p className="text-slate-300 leading-relaxed font-medium">
              Primitive reflexes are the foundational OS of the nervous system. They set up our movement and postural patterns, directly affecting cognitive and emotional development. While they typically disappear as the brain matures, retained reflexes can cause long-term physical and emotional health challenges.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
                <h4 className="font-black text-indigo-400 text-xs uppercase tracking-widest mb-2">Sensory-Motor Role</h4>
                <p className="text-xs text-slate-400 leading-relaxed">Essential for navigating the world and developing complex motor skills.</p>
              </div>
              <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
                <h4 className="font-black text-rose-400 text-xs uppercase tracking-widest mb-2">Retained Reflexes</h4>
                <p className="text-xs text-slate-400 leading-relaxed">Dis-inhibited reflexes often correlate with chronic health and emotional issues.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg rounded-[2.5rem] bg-indigo-50 border-2 border-indigo-100 overflow-hidden">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-xl font-black flex items-center gap-3 text-indigo-900">
              <ListChecks size={24} className="text-indigo-600" /> Assessment Process
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-0 space-y-4">
            {[
              { step: 1, title: "Stimulate & Assess", desc: "Trigger the reflex and test the specific muscle pattern." },
              { step: 2, title: "Switch to IM", desc: "Test a clear Indicator Muscle; it should now inhibit." },
              { step: 3, title: "Find Pathway", desc: "Ask for Afferent or Efferent correction direction." },
              { step: 4, title: "Correct & Re-test", desc: "Apply correction and immediately re-assess the reflex." }
            ].map((item) => (
              <div key={item.step} className="flex gap-4 items-start">
                <span className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5">{item.step}</span>
                <div>
                  <h5 className="font-black text-indigo-900 text-xs uppercase tracking-tight">{item.title}</h5>
                  <p className="text-[10px] text-indigo-700 font-medium leading-tight">{item.desc}</p>
                </div>
              </div>
            ))}
            <div className="pt-4 border-t border-indigo-200">
              <p className="text-[10px] text-indigo-600 font-bold italic">"Usually 1-3 corrections are needed to re-integrate the reflex."</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              placeholder="Search reflexes (e.g. Moro, ATNR, Babinski)..." 
              className="pl-12 bg-white border-slate-200 rounded-2xl h-14 shadow-sm font-medium focus:ring-2 focus:ring-indigo-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            {categories.map(cat => (
              <Button 
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "rounded-xl h-14 px-6 font-black text-[10px] uppercase tracking-widest whitespace-nowrap transition-all",
                  selectedCategory === cat ? "bg-slate-900 shadow-lg" : "border-slate-200 bg-white hover:bg-slate-50"
                )}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredReflexes.map(reflex => (
            <Card key={reflex.id} className="border-none shadow-lg rounded-[2.5rem] bg-white hover:shadow-2xl transition-all group overflow-hidden">
              <CardHeader className={cn(
                "pb-6 border-b transition-colors relative",
                reflex.category === 'Foundational' ? "bg-indigo-50/50 border-indigo-100" :
                reflex.category === 'Postural' ? "bg-emerald-50/50 border-emerald-100" :
                "bg-amber-50/50 border-amber-100"
              )}>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex gap-2 mb-2">
                      <Badge className={cn(
                        "border-none font-black text-[8px] uppercase tracking-widest",
                        reflex.category === 'Foundational' ? "bg-indigo-100 text-indigo-700" :
                        reflex.category === 'Postural' ? "bg-emerald-100 text-emerald-700" :
                        "bg-amber-100 text-amber-700"
                      )}>
                        {reflex.category} Reflex
                      </Badge>
                    </div>
                    <CardTitle className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {reflex.name}
                    </CardTitle>
                  </div>
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shadow-sm text-white",
                    reflex.category === 'Foundational' ? "bg-indigo-600" :
                    reflex.category === 'Postural' ? "bg-emerald-600" :
                    "bg-amber-600"
                  )}>
                    <Baby size={24} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <PlayCircle size={12} className="text-indigo-500" /> Stimulus
                    </p>
                    <p className="text-sm font-bold text-slate-900 leading-relaxed">{reflex.stimulus}</p>
                  </div>
                  <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                    <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <ShieldAlert size={12} /> Inhibition Pattern
                    </p>
                    <p className="text-sm font-bold text-rose-900 leading-relaxed">{reflex.inhibitionPattern}</p>
                  </div>
                </div>

                {reflex.pearl && (
                  <div className="p-5 bg-amber-50 rounded-3xl border border-amber-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><Sparkles size={40} className="text-amber-600" /></div>
                    <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <Info size={14} /> Clinical Pearl
                    </p>
                    <p className="text-xs text-amber-900 font-bold leading-relaxed italic">
                      "{reflex.pearl}"
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PrimitiveReflexReference;