"use client";

import React, { useState } from "react";
import { CLINICAL_COMPLAINTS, ClinicalComplaint } from "@/data/clinical-complaints-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Zap, Brain, Activity, Move, Info, AlertCircle, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const ClinicalCheatSheet = () => {
  const [search, setSearch] = useState("");

  const filtered = CLINICAL_COMPLAINTS.filter(c => 
    c.complaint.toLowerCase().includes(search.toLowerCase()) ||
    c.insights.toLowerCase().includes(search.toLowerCase()) ||
    c.priorityMuscles.some(m => m.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      <div className="relative max-w-2xl mx-auto">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <Input 
          placeholder="Search by complaint (e.g. Back Pain, Fatigue)..." 
          className="pl-12 bg-white border-slate-200 rounded-2xl h-14 shadow-lg font-medium focus:ring-2 focus:ring-indigo-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {filtered.map((item) => (
          <Card key={item.complaint} className="border-none shadow-lg rounded-[2.5rem] bg-white hover:shadow-2xl transition-all group overflow-hidden">
            <CardHeader className="pb-4 bg-slate-50/50 border-b border-slate-100">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <Badge className={cn(
                    "border-none font-black text-[9px] uppercase tracking-widest mb-2",
                    item.category === 'Structural' ? "bg-blue-100 text-blue-700" :
                    item.category === 'Emotional' ? "bg-rose-100 text-rose-700" :
                    item.category === 'Neurological' ? "bg-purple-100 text-purple-700" :
                    "bg-emerald-100 text-emerald-700"
                  )}>
                    {item.category} Focus
                  </Badge>
                  <CardTitle className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {item.complaint}
                  </CardTitle>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-indigo-600">
                  <Zap size={24} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Activity size={14} className="text-indigo-500" /> Priority Muscles
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {item.priorityMuscles.map(m => (
                      <Badge key={m} variant="secondary" className="bg-indigo-50 text-indigo-700 border-none text-[10px] font-bold">
                        {m}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Move size={14} className="text-emerald-500" /> Meridians
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {item.priorityMeridians.map(m => (
                      <Badge key={m} variant="secondary" className="bg-emerald-50 text-emerald-700 border-none text-[10px] font-bold">
                        {m}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-5 bg-amber-50 rounded-3xl border border-amber-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><Brain size={40} className="text-amber-600" /></div>
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Info size={14} /> Clinical Insight
                </p>
                <p className="text-sm text-amber-900 font-bold leading-relaxed">
                  {item.insights}
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Key Reflex Points</p>
                <div className="flex flex-wrap gap-2">
                  {item.reflexPoints.map(p => (
                    <span key={p} className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                      <CheckCircle2 size={12} className="text-emerald-500" /> {p}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-32 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
          <Search size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-black text-slate-900">No complaints found</h3>
          <p className="text-slate-500 mt-2">Try searching for a different symptom or complaint.</p>
        </div>
      )}
    </div>
  );
};

export default ClinicalCheatSheet;