"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Move, 
  Zap, 
  Activity, 
  Brain, 
  Shield, 
  Link as LinkIcon,
  Dumbbell,
  Layers,
  Info,
  CheckCircle2,
  ArrowRight,
  Compass,
  Lightbulb,
  Sparkles,
  Search,
  List
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import JointActionTableModal from './JointActionTableModal';

const MechanoBible = () => {
  const [tableOpen, setTableOpen] = useState(false);

  const consciousExamples = [
    {
      title: "Chronic Low Back Pain",
      joint: "L4/L5 Lumbar",
      action: "Isometric Extension",
      logic: "Contralateral S1",
      localization: "Axial -> Lower -> Midline -> L4/L5",
      plane: "Sagittal",
      protocol: "Hold the sensory cortex representation for the opposite side of the low back. Perform a 30% isometric extension for 60s."
    },
    {
      title: "Shoulder Impingement",
      joint: "GH Joint",
      action: "Isometric External Rotation",
      logic: "Contralateral M1/S1",
      localization: "Appendicular -> Upper -> Right -> GH Joint",
      plane: "Transverse",
      protocol: "Identify the restricted rotation. Hold the opposite motor strip zone while the client performs a light isometric hold."
    },
    {
      title: "Ankle Instability",
      joint: "Talocrural",
      action: "Isometric Dorsiflexion",
      logic: "Contralateral S1 (Foot Map)",
      localization: "Appendicular -> Lower -> Left -> Ankle",
      plane: "Sagittal",
      protocol: "Reset the 'smudged' sensory map by providing clear, conscious resistance in the plane of greatest restriction."
    }
  ];

  const unconsciousExamples = [
    {
      title: "Old Ankle Sprain",
      tissue: "ATFL Ligament",
      stimulus: "Ligament Stretch",
      logic: "Ipsilateral GV16",
      localization: "Appendicular -> Lower -> Right -> Ankle",
      protocol: "Hold GV16 (Cerebellum) while stretching the ATFL. Apply a tuning fork to the cranium for 5s to clear the threat."
    },
    {
      title: "Whiplash History",
      tissue: "Cervical Ligaments",
      stimulus: "Posterior Stretch",
      logic: "Ipsilateral GV16",
      localization: "Axial -> Upper -> Midline -> C3/C4",
      protocol: "Gently stretch the posterior cervical ligaments while holding the base of the skull. Use simultaneous tapping to reset."
    },
    {
      title: "Knee Instability",
      tissue: "MCL (Medial Collateral)",
      stimulus: "Valgus Stress Stretch",
      logic: "Ipsilateral GV16",
      localization: "Appendicular -> Lower -> Left -> Knee",
      protocol: "Challenge the MCL with a light stretch. Hold GV16 to update the cerebellum's unconscious map of knee stability."
    }
  ];

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Hero Section */}
      <Card className="border-none shadow-2xl rounded-[3.5rem] bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 p-12 opacity-5"><BookOpen size={200} /></div>
        <CardHeader className="p-12 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/40">
                <BookOpen size={32} className="text-white" />
              </div>
              <div>
                <CardTitle className="text-4xl font-black tracking-tight">The Mechano Bible</CardTitle>
                <CardDescription className="text-slate-400 text-xl font-medium mt-2">
                  Your definitive guide to joints, tissues, and the geometry of movement.
                </CardDescription>
              </div>
            </div>
            <Button 
              onClick={() => setTableOpen(true)}
              className="bg-white text-indigo-600 hover:bg-indigo-50 h-14 px-8 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl"
            >
              <List size={20} className="mr-2" /> Quick Access: Action Table
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Localization Process */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-lg rounded-[2.5rem] bg-white overflow-hidden">
          <CardHeader className="bg-indigo-50 p-8">
            <CardTitle className="text-xl font-black flex items-center gap-3 text-indigo-900">
              <Search size={24} /> 1. Localization Hierarchy
            </CardTitle>
            <CardDescription className="text-indigo-700 font-medium">Follow this order to isolate the priority joint.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="space-y-4">
              {[
                { label: "Skeleton Type", value: "Axial vs. Appendicular" },
                { label: "Region", value: "Upper vs. Lower" },
                { label: "Laterality", value: "Left vs. Right" },
                { label: "Specific Joint", value: "e.g. L4/L5, GH Joint, Talocrural" }
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-xs">{i + 1}</span>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{step.label}</p>
                    <p className="text-sm font-bold text-slate-900">{step.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg rounded-[2.5rem] bg-white overflow-hidden">
          <CardHeader className="bg-emerald-50 p-8">
            <CardTitle className="text-xl font-black flex items-center gap-3 text-emerald-900">
              <Move size={24} /> 2. Finding Joint Action
            </CardTitle>
            <CardDescription className="text-emerald-700 font-medium">Utilize planes of motion to speed up the process.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="p-6 bg-emerald-900 text-white rounded-[2rem] shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10"><Zap size={80} /></div>
              <p className="text-sm font-bold leading-relaxed relative z-10">
                "Once the joint is found, utilize the Action Table. To speed it up, ask the body for the <strong>Plane of Motion</strong> first."
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {["Sagittal", "Frontal", "Transverse"].map(plane => (
                <div key={plane} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Plane</p>
                  <p className="text-xs font-black text-slate-900">{plane}</p>
                </div>
              ))}
            </div>
            <Button variant="outline" onClick={() => setTableOpen(true)} className="w-full h-12 rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold">
              View Action Table Reference
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Clinical Examples Section */}
      <div className="space-y-8">
        <h3 className="text-2xl font-black text-slate-900 px-2 flex items-center gap-3">
          <Sparkles size={28} className="text-indigo-600" /> Clinical Examples
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Conscious Examples */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-4">
              <Brain size={20} className="text-blue-600" />
              <h4 className="font-black text-blue-900 uppercase tracking-widest text-sm">Conscious (DCML)</h4>
            </div>
            {consciousExamples.map((ex, i) => (
              <Card key={i} className="border-none shadow-md rounded-2xl bg-white overflow-hidden border-l-4 border-blue-500">
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <h5 className="font-black text-slate-900 text-lg">{ex.title}</h5>
                    <Badge className="bg-blue-50 text-blue-700 border-none text-[8px] font-black uppercase">{ex.logic}</Badge>
                  </div>
                  
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Localization Path</p>
                    <p className="text-xs font-bold text-indigo-600">{ex.localization}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Plane</p>
                      <p className="font-bold text-slate-700">{ex.plane}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Action</p>
                      <p className="font-bold text-slate-700">{ex.action}</p>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-slate-50">
                    <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">Protocol</p>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">{ex.protocol}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Unconscious Examples */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-4">
              <Activity size={20} className="text-emerald-600" />
              <h4 className="font-black text-emerald-900 uppercase tracking-widest text-sm">Unconscious (Spinocerebellar)</h4>
            </div>
            {unconsciousExamples.map((ex, i) => (
              <Card key={i} className="border-none shadow-md rounded-2xl bg-white overflow-hidden border-l-4 border-emerald-500">
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <h5 className="font-black text-slate-900 text-lg">{ex.title}</h5>
                    <Badge className="bg-emerald-50 text-emerald-700 border-none text-[8px] font-black uppercase">{ex.logic}</Badge>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Localization Path</p>
                    <p className="text-xs font-bold text-emerald-600">{ex.localization}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Tissue</p>
                      <p className="font-bold text-slate-700">{ex.tissue}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Stimulus</p>
                      <p className="font-bold text-slate-700">{ex.stimulus}</p>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-slate-50">
                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Protocol</p>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">{ex.protocol}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* The Players: Ligaments vs Tendons */}
      <div className="space-y-6">
        <h3 className="text-2xl font-black text-slate-900 px-2 flex items-center gap-3">
          <Layers size={28} className="text-indigo-600" /> The Tissues: Ligaments vs. Tendons
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="border-none shadow-lg rounded-[2.5rem] bg-white overflow-hidden group hover:shadow-xl transition-all">
            <div className="h-3 bg-emerald-500" />
            <CardHeader className="p-8">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-black text-slate-900">Ligaments</CardTitle>
                <Shield size={32} className="text-emerald-500" />
              </div>
              <p className="text-emerald-600 font-black text-[10px] uppercase tracking-widest">Bone to Bone</p>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <p className="text-sm font-bold text-emerald-900">
                  Primary role: Unconscious Mechanoreception (85% of total input).
                </p>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-600 font-medium">Act as "Sensors" that tell the cerebellum where the joint is in space.</p>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-600 font-medium">When stretched or injured, they send a "Threat" signal to the brain.</p>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-600 font-medium"><strong>Correction:</strong> Stretch the ligament while holding GV16 (Cerebellum).</p>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg rounded-[2.5rem] bg-white overflow-hidden group hover:shadow-xl transition-all">
            <div className="h-3 bg-rose-500" />
            <CardHeader className="p-8">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-black text-slate-900">Tendons</CardTitle>
                <LinkIcon size={32} className="text-rose-500" />
              </div>
              <p className="text-rose-600 font-black text-[10px] uppercase tracking-widest">Muscle to Bone</p>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                <p className="text-sm font-bold text-rose-900">
                  Primary role: Force transmission and tension sensing (GTOs).
                </p>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-rose-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-600 font-medium">House the Golgi Tendon Organs (GTOs) which monitor muscle tension.</p>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-rose-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-600 font-medium">Protect the muscle from tearing by inhibiting it if tension is too high.</p>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-rose-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-600 font-medium"><strong>Correction:</strong> Isometric contraction (30-40%) to reset the GTO threshold.</p>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* The Map: Planes of Motion */}
      <div className="space-y-6">
        <h3 className="text-2xl font-black text-slate-900 px-2 flex items-center gap-3">
          <Compass size={28} className="text-indigo-600" /> The Map: Planes of Motion
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { 
              title: "Sagittal", 
              color: "bg-blue-600", 
              light: "bg-blue-50", 
              border: "border-blue-100",
              text: "text-blue-700",
              desc: "Divides body into Left & Right.", 
              movements: ["Flexion", "Extension", "Anterior/Posterior Tilt"],
              logic: "Forward and backward movement."
            },
            { 
              title: "Frontal", 
              color: "bg-emerald-600", 
              light: "bg-emerald-50", 
              border: "border-emerald-100",
              text: "text-emerald-700",
              desc: "Divides body into Front & Back.", 
              movements: ["Abduction", "Adduction", "Lateral Flexion", "Inversion/Eversion"],
              logic: "Side-to-side movement."
            },
            { 
              title: "Transverse", 
              color: "bg-orange-600", 
              light: "bg-orange-50", 
              border: "border-orange-100",
              text: "text-orange-700",
              desc: "Divides body into Top & Bottom.", 
              movements: ["Internal Rotation", "External Rotation", "Pronation/Supination"],
              logic: "Twisting and rotational movement."
            }
          ].map((plane) => (
            <Card key={plane.title} className="border-none shadow-lg rounded-[2rem] bg-white overflow-hidden">
              <div className={cn("p-6 text-white", plane.color)}>
                <h4 className="text-xl font-black">{plane.title} Plane</h4>
                <p className="text-xs font-bold opacity-80 mt-1">{plane.desc}</p>
              </div>
              <CardContent className="p-6 space-y-4">
                <div className={cn("p-3 rounded-xl border", plane.light, plane.border)}>
                  <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1", plane.text)}>Core Logic</p>
                  <p className="text-sm font-bold text-slate-800">{plane.logic}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Key Movements</p>
                  <div className="flex flex-wrap gap-1.5">
                    {plane.movements.map(m => (
                      <Badge key={m} variant="secondary" className="bg-slate-100 text-slate-600 border-none text-[10px] font-bold">
                        {m}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Clinical Dictionary */}
      <Card className="border-none shadow-lg rounded-[2.5rem] bg-white overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-slate-100 p-8">
          <CardTitle className="text-2xl font-black flex items-center gap-3">
            <Activity size={28} className="text-indigo-600" /> Clinical Dictionary
          </CardTitle>
          <CardDescription className="font-medium">Common movement terms used in the Mechano process.</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { term: "Flexion", def: "Decreasing the angle between two bones (bending)." },
              { term: "Extension", def: "Increasing the angle between two bones (straightening)." },
              { term: "Abduction", def: "Moving a limb away from the midline of the body." },
              { term: "Adduction", def: "Moving a limb towards the midline of the body." },
              { term: "Internal Rotation", def: "Rotating a limb towards the center of the body." },
              { term: "External Rotation", def: "Rotating a limb away from the center of the body." },
              { term: "Pronation", def: "Rotating the forearm so the palm faces down." },
              { term: "Supination", def: "Rotating the forearm so the palm faces up." },
              { term: "Inversion", def: "Turning the sole of the foot inwards." },
              { term: "Eversion", def: "Turning the sole of the foot outwards." },
              { term: "Anterior Tilt", def: "Tilting the pelvis forward (arching the back)." },
              { term: "Posterior Tilt", def: "Tilting the pelvis backward (tucking the tail)." }
            ].map((item) => (
              <div key={item.term} className="space-y-1">
                <h5 className="font-black text-indigo-600 text-sm uppercase tracking-tight">{item.term}</h5>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">{item.def}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pro Tip */}
      <div className="p-8 bg-amber-50 rounded-[2.5rem] border-2 border-amber-100 flex items-start gap-6">
        <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xl shrink-0">
          <Lightbulb size={32} />
        </div>
        <div className="space-y-2">
          <h4 className="text-xl font-black text-amber-900">Practitioner Pro-Tip</h4>
          <p className="text-amber-800 font-medium leading-relaxed">
            If you're struggling to find the restricted action, ask the client to perform the movement that causes their pain. Observe which plane they are moving in. The restriction is often in the <strong>opposite</strong> action or a different plane entirely. The brain is a master of compensation—look where the movement <em>isn't</em> happening.
          </p>
        </div>
      </div>

      <JointActionTableModal open={tableOpen} onOpenChange={setTableOpen} />
    </div>
  );
};

export default MechanoBible;