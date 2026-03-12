"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Move, Zap, RefreshCw, 
  Search, ChevronRight,
  Lightbulb, Brain, Activity, Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { JOINT_ACTION_LIBRARY, JointData } from '@/data/joint-action-data';

const JointActionExplorer = () => {
  const [search, setSearch] = useState("");
  const [selectedJoint, setSelectedJoint] = useState<JointData>(JOINT_ACTION_LIBRARY[0]);

  const filtered = JOINT_ACTION_LIBRARY.filter(j => 
    j.name.toLowerCase().includes(search.toLowerCase()) ||
    j.type.toLowerCase().includes(search.toLowerCase()) ||
    j.region.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Sidebar List */}
      <div className="lg:col-span-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <Input 
            placeholder="Search 15 joints..." 
            className="pl-10 h-11 rounded-xl border-slate-200 bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-2">
            {filtered.map(joint => (
              <button
                key={joint.name}
                onClick={() => setSelectedJoint(joint)}
                className={cn(
                  "w-full p-4 rounded-2xl border-2 text-left transition-all group",
                  selectedJoint.name === joint.name 
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-lg" 
                    : "bg-white border-slate-100 hover:border-indigo-200 text-slate-600"
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-black text-sm">{joint.name}</p>
                    <div className="flex gap-1 mt-1">
                      <Badge className={cn(
                        "border-none font-black text-[6px] uppercase tracking-widest px-1.5 py-0",
                        selectedJoint.name === joint.name ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400"
                      )}>
                        {joint.type}
                      </Badge>
                      <Badge className={cn(
                        "border-none font-black text-[6px] uppercase tracking-widest px-1.5 py-0",
                        selectedJoint.name === joint.name ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400"
                      )}>
                        {joint.region}
                      </Badge>
                    </div>
                  </div>
                  <ChevronRight size={16} className={cn("transition-transform", selectedJoint.name === joint.name ? "translate-x-1" : "text-slate-300")} />
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Detail View */}
      <Card className="lg:col-span-8 border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-slate-100 p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                <Move size={24} />
              </div>
              <div>
                <CardTitle className="text-2xl font-black text-slate-900">{selectedJoint.name}</CardTitle>
                <CardDescription className="font-bold text-[10px] uppercase tracking-widest text-indigo-600">
                  {selectedJoint.type} Skeleton • {selectedJoint.region} Body
                </CardDescription>
              </div>
            </div>
            <Badge className="bg-indigo-100 text-indigo-700 border-none font-black text-[10px] uppercase tracking-widest px-3 py-1">
              Clinical Reference
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-10">
          {/* Detailed Actions with How-To */}
          <div className="space-y-8">
            {Object.entries(selectedJoint.actions).map(([plane, actions]) => (
              <div key={plane} className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  {plane === 'Sagittal' ? <Zap size={16} className="text-blue-500" /> :
                   plane === 'Frontal' ? <Move size={16} className="text-emerald-500" /> :
                   <RefreshCw size={16} className="text-orange-500" />}
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">{plane} Plane Actions</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {actions.map((action, idx) => (
                    <div key={idx} className={cn(
                      "p-4 rounded-2xl border-2 transition-all",
                      action.label === '-' ? "bg-slate-50 border-slate-100 opacity-50" : "bg-white border-slate-50 hover:border-indigo-100 shadow-sm"
                    )}>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-none font-black text-[10px] uppercase tracking-widest">
                          {action.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed">
                        {action.howTo}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 bg-indigo-50 rounded-[2rem] border-2 border-indigo-100 flex items-start gap-5">
            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-indigo-600 shrink-0">
              <Lightbulb size={24} />
            </div>
            <div className="space-y-1">
              <h5 className="font-black text-indigo-900 text-xs uppercase tracking-widest">Clinical Pearl</h5>
              <p className="text-sm text-indigo-700 font-medium leading-relaxed italic">
                "{selectedJoint.pearl}"
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-slate-900 text-white rounded-3xl space-y-3">
              <div className="flex items-center gap-2 text-blue-400">
                <Brain size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Conscious Logic</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Hold <span className="text-white font-bold">Contralateral S1</span>. Perform 30-40% isometric hold in the restricted action for 60s.
              </p>
            </div>
            <div className="p-5 bg-slate-900 text-white rounded-3xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <Activity size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Unconscious Logic</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Hold <span className="text-white font-bold">Ipsilateral GV16</span>. Stretch the priority ligament and apply tuning fork to cranium.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default JointActionExplorer;