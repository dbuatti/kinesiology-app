"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Move, Zap, RefreshCw, Info, 
  Dumbbell, Search, ChevronRight,
  Layers, Activity, Brain, Lightbulb
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Badge } from "@/components/ui/badge";

const JOINTS = [
  { 
    name: "Cervical Spine", 
    type: "Axial", 
    actions: {
      Sagittal: ["Flexion", "Extension"],
      Frontal: ["Lateral Flexion (L/R)"],
      Transverse: ["Rotation (L/R)"]
    },
    pearl: "Organizes the head around the horizon. Key for righting reflexes."
  },
  { 
    name: "Shoulder (GH Joint)", 
    type: "Appendicular", 
    actions: {
      Sagittal: ["Flexion", "Extension"],
      Frontal: ["Abduction", "Adduction"],
      Transverse: ["Internal Rotation", "External Rotation"]
    },
    pearl: "Most mobile joint. Slaved to the Scapula and Thoracic spine."
  },
  { 
    name: "Pelvis", 
    type: "Axial", 
    actions: {
      Sagittal: ["Anterior Tilt", "Posterior Tilt"],
      Frontal: ["Hip Hike (L/R)", "Pelvic Drop"],
      Transverse: ["Rotation (L/R)"]
    },
    pearl: "The 'Engine Room' of gait. Connects the upper and lower kinetic chains."
  },
  { 
    name: "Foot/Ankle", 
    type: "Appendicular", 
    actions: {
      Sagittal: ["Dorsiflexion", "Plantar Flexion"],
      Frontal: ["Inversion", "Eversion"],
      Transverse: ["Internal Rotation", "External Rotation"]
    },
    pearl: "Primary source of proprioceptive input for the cerebellum."
  }
];

const JointActionExplorer = () => {
  const [search, setSearch] = useState("");
  const [selectedJoint, setSelectedJoint] = useState(JOINTS[0]);

  const filtered = JOINTS.filter(j => j.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Sidebar List */}
      <div className="lg:col-span-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <Input 
            placeholder="Search joints..." 
            className="pl-10 h-11 rounded-xl border-slate-200 bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
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
                  <p className={cn("text-[8px] font-black uppercase tracking-widest mt-0.5", selectedJoint.name === joint.name ? "text-indigo-200" : "text-slate-400")}>
                    {joint.type} Skeleton
                  </p>
                </div>
                <ChevronRight size={16} className={cn("transition-transform", selectedJoint.name === joint.name ? "translate-x-1" : "text-slate-300")} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Detail View */}
      <Card className="lg:col-span-8 border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-slate-100 p-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg">
              <Move size={24} />
            </div>
            <div>
              <CardTitle className="text-2xl font-black text-slate-900">{selectedJoint.name}</CardTitle>
              <CardDescription className="font-bold text-[10px] uppercase tracking-widest text-indigo-600">Geometry of Action</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(selectedJoint.actions).map(([plane, actions]) => (
              <div key={plane} className="space-y-3">
                <div className="flex items-center gap-2">
                  {plane === 'Sagittal' ? <Zap size={14} className="text-blue-500" /> :
                   plane === 'Frontal' ? <Move size={14} className="text-emerald-500" /> :
                   <RefreshCw size={14} className="text-orange-500" />}
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{plane} Plane</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {actions.map(action => (
                    <Badge key={action} variant="secondary" className="bg-slate-100 text-slate-700 border-none font-bold text-[10px] px-3 py-1.5 rounded-lg">
                      {action}
                    </Badge>
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