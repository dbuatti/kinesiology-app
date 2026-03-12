"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Move, Zap, RefreshCw, 
  Dumbbell, Search, ChevronRight,
  Lightbulb, Brain, Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const JOINTS = [
  { 
    name: "Cranium", 
    type: "Axial", 
    region: "Upper",
    actions: {
      Sagittal: ["Flexion", "Extension"],
      Frontal: ["Lateral Flexion"],
      Transverse: ["Rotation"]
    },
    pearl: "Organizes the 'Top-Down' neurological tone. Essential for cranial nerve health."
  },
  { 
    name: "Jaw (TMJ)", 
    type: "Axial", 
    region: "Upper",
    actions: {
      Sagittal: ["Protrusion", "Retraction"],
      Frontal: ["Lateral Deviation"],
      Transverse: ["-"]
    },
    pearl: "Deeply connected to the Pelvis and the Vagus nerve (Medulla)."
  },
  { 
    name: "Cervical Spine", 
    type: "Axial", 
    region: "Upper",
    actions: {
      Sagittal: ["Flexion", "Extension"],
      Frontal: ["Lateral Flexion (L/R)"],
      Transverse: ["Rotation (L/R)"]
    },
    pearl: "Organizes the head around the horizon. Key for righting reflexes."
  },
  { 
    name: "Thoracic Spine", 
    type: "Axial", 
    region: "Upper",
    actions: {
      Sagittal: ["Flexion", "Extension"],
      Frontal: ["Lateral Flexion (L/R)"],
      Transverse: ["Rotation (L/R)"]
    },
    pearl: "Primary site for rotation. Essential for ribcage mobility and breathing."
  },
  { 
    name: "Lumbar Spine", 
    type: "Axial", 
    region: "Lower",
    actions: {
      Sagittal: ["Flexion", "Extension"],
      Frontal: ["Lateral Flexion (L/R)"],
      Transverse: ["Rotation (Minimal)"]
    },
    pearl: "Designed for stability. Often compensates for poor hip or thoracic mobility."
  },
  { 
    name: "Pelvis", 
    type: "Axial", 
    region: "Lower",
    actions: {
      Sagittal: ["Anterior Tilt", "Posterior Tilt"],
      Frontal: ["Hip Hike (L/R)", "Pelvic Drop"],
      Transverse: ["Rotation (L/R)"]
    },
    pearl: "The 'Engine Room' of gait. Connects the upper and lower kinetic chains."
  },
  { 
    name: "Sacrum", 
    type: "Axial", 
    region: "Lower",
    actions: {
      Sagittal: ["Nutation", "Counter-Nutation"],
      Frontal: ["-"],
      Transverse: ["-"]
    },
    pearl: "The keystone of the pelvis. Movement is subtle but neurologically vital."
  },
  { 
    name: "Shoulder (GH Joint)", 
    type: "Appendicular", 
    region: "Upper",
    actions: {
      Sagittal: ["Flexion", "Extension"],
      Frontal: ["Abduction", "Adduction"],
      Transverse: ["Internal Rotation", "External Rotation"]
    },
    pearl: "Most mobile joint. Slaved to the Scapula and Thoracic spine."
  },
  { 
    name: "Scapula", 
    type: "Appendicular", 
    region: "Upper",
    actions: {
      Sagittal: ["Elevation", "Depression"],
      Frontal: ["Upward Rotation", "Downward Rotation"],
      Transverse: ["Protraction", "Retraction"]
    },
    pearl: "The foundation of shoulder function. Must glide freely over the ribs."
  },
  { 
    name: "Elbow", 
    type: "Appendicular", 
    region: "Upper",
    actions: {
      Sagittal: ["Flexion", "Extension"],
      Frontal: ["-"],
      Transverse: ["Pronation", "Supination"]
    },
    pearl: "A hinge joint that allows for complex hand orientation."
  },
  { 
    name: "Wrist", 
    type: "Appendicular", 
    region: "Upper",
    actions: {
      Sagittal: ["Flexion", "Extension"],
      Frontal: ["Radial Deviation", "Ulnar Deviation"],
      Transverse: ["-"]
    },
    pearl: "Essential for fine motor control and upper limb integration."
  },
  { 
    name: "Hand/Fingers", 
    type: "Appendicular", 
    region: "Upper",
    actions: {
      Sagittal: ["Palm Extension", "Finger Extension", "Palm Flexion", "Finger Flexion"],
      Frontal: ["Finger Adduction", "Finger Abduction"],
      Transverse: ["-"]
    },
    pearl: "High density of mechanoreceptors. Direct link to the motor cortex."
  },
  { 
    name: "Hip", 
    type: "Appendicular", 
    region: "Lower",
    actions: {
      Sagittal: ["Flexion", "Extension"],
      Frontal: ["Abduction", "Adduction"],
      Transverse: ["Internal Rotation", "External Rotation"]
    },
    pearl: "Deep ball-and-socket joint. Essential for power and locomotion."
  },
  { 
    name: "Knee", 
    type: "Appendicular", 
    region: "Lower",
    actions: {
      Sagittal: ["Flexion", "Extension"],
      Frontal: ["-"],
      Transverse: ["Tibial Internal Rotation", "Tibial External Rotation"]
    },
    pearl: "Stability is key. Often compensates for hip or ankle dysfunction."
  },
  { 
    name: "Foot/Ankle", 
    type: "Appendicular", 
    region: "Lower",
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

  const filtered = JOINTS.filter(j => 
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
                    <Badge key={action} variant="secondary" className={cn(
                      "border-none font-bold text-[10px] px-3 py-1.5 rounded-lg",
                      action === '-' ? "bg-slate-50 text-slate-300" : "bg-slate-100 text-slate-700"
                    )}>
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