"use client";

import React, { useState } from "react";
import { PRIMITIVE_REFLEXES, PrimitiveReflex } from "@/data/primitive-reflex-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  RotateCcw, 
  Zap, 
  Info, 
  Activity, 
  ShieldAlert,
  PlayCircle,
  Sparkles,
  Baby
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const PrimitiveReflexReference = () => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | 'All'>('All');

  const filteredReflexes = PRIMITIVE_REFLEXES.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) || 
                         r.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || r.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', 'Foundational', 'Postural', 'Tactile'];

  return (
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
                  <Badge className={cn(
                    "border-none font-black text-[8px] uppercase tracking-widest mb-2",
                    reflex.category === 'Foundational' ? "bg-indigo-100 text-indigo-700" :
                    reflex.category === 'Postural' ? "bg-emerald-100 text-emerald-700" :
                    "bg-amber-100 text-amber-700"
                  )}>
                    {reflex.category} Reflex
                  </Badge>
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
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                {reflex.description}
              </p>

              <div className="grid grid-cols-1 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <Activity size={12} /> Assessment
                  </p>
                  <p className="text-sm font-bold text-slate-900">{reflex.assessment}</p>
                </div>
                <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                  <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <Zap size={12} /> Correction
                  </p>
                  <p className="text-sm font-bold text-indigo-900">{reflex.correction}</p>
                </div>
              </div>

              {reflex.pearl && (
                <div className="p-5 bg-amber-50 rounded-3xl border border-amber-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10"><Sparkles size={40} className="text-amber-600" /></div>
                  <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Info size={14} /> Clinical Pearl
                  </p>
                  <p className="text-xs text-amber-900 font-bold leading-relaxed">
                    {reflex.pearl}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PrimitiveReflexReference;