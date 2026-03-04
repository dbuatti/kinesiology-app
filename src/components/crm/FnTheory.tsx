"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  GitBranch, Sparkles, Brain, Activity, CheckCircle2, 
  Zap, Info, List, RefreshCw, Eye, Dumbbell, Link as LinkIcon,
  Workflow
} from 'lucide-react';

const SectionHeader = ({ icon: Icon, title, color }: { icon: React.ElementType, title: string, color: string }) => (
  <h3 className={`text-2xl font-black flex items-center gap-3 ${color}`}>
    <Icon size={28} /> {title}
  </h3>
);

const Step = ({ num, title, children }: { num: number, title: string, children: React.ReactNode }) => (
  <div className="flex gap-5">
    <div className="flex flex-col items-center gap-2">
      <span className="w-10 h-10 rounded-full bg-indigo-600 text-white shadow-lg flex items-center justify-center font-black text-lg shrink-0 border-4 border-indigo-200">
        {num}
      </span>
      <div className="h-full w-0.5 bg-slate-200 rounded-full" />
    </div>
    <div className="pb-8">
      <h4 className="font-black text-slate-900 text-lg mb-2">{title}</h4>
      <div className="text-slate-600 font-medium space-y-2">{children}</div>
    </div>
  </div>
);

const JointActionTable = () => {
  const data = [
    { joint: "Cranium", sagittal: "Flexion, Extension", frontal: "Lateral Flexion", transverse: "Rotation" },
    { joint: "Jaw", sagittal: "Protrusion, Retraction", frontal: "Lateral Deviation", transverse: "-" },
    { joint: "Cervical Spine", sagittal: "Flexion, Extension", frontal: "Lateral Flexion", transverse: "Rotation" },
    { joint: "Thoracic Spine", sagittal: "Flexion, Extension", frontal: "Lateral Flexion", transverse: "Rotation" },
    { joint: "Lumbar Spine", sagittal: "Flexion, Extension", frontal: "Lateral Flexion", transverse: "Rotation" },
    { joint: "Pelvis", sagittal: "Anterior Tilt, Posterior Tilt", frontal: "Hike up, Drop down", transverse: "L Rotation, R Rotation" },
    { joint: "Sacrum", sagittal: "Nutation, Counter Nutation", frontal: "-", transverse: "-" },
    { joint: "Hip", sagittal: "Flexion, Extension", frontal: "Adduction, Abduction", transverse: "Internal Rotation, External Rotation" },
    { joint: "Knee", sagittal: "Flexion, Extension", frontal: "-", transverse: "Tibial Internal Rotation, Tibial External Rotation" },
    { joint: "Foot/Ankle", sagittal: "Dorsiflexion, Plantar Flexion", frontal: "Eversion, Inversion", transverse: "Abduction, Adduction, Internal Rotation, External Rotation" },
    { joint: "Shoulder (GH Joint)", sagittal: "Flexion, Extension", frontal: "Adduction, Abduction", transverse: "Internal Rotation, External Rotation" },
    { joint: "Scapula", sagittal: "Elevation, Depression", frontal: "Upward Rotation, Downwards Rotation", transverse: "Protraction, Retraction" },
    { joint: "Elbow", sagittal: "Flexion, Extension", frontal: "-", transverse: "Pronation (Internal Rotation), Supination (External Rotation)" },
    { joint: "Wrist", sagittal: "Flexion, Extension", frontal: "Radial Deviation, Ulnar Deviation", transverse: "-" },
    { joint: "Hand/Fingers", sagittal: "Palm Extension, Finger Extension, Palm Flexion, Finger Flexion", frontal: "Finger Adduction, Finger Abduction", transverse: "-" }
  ];

  return (
    <div className="overflow-x-auto bg-white rounded-2xl border border-slate-100 shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="p-4 text-left font-black text-slate-500 text-[10px] uppercase tracking-widest">Joint</th>
            <th className="p-4 text-left font-black text-blue-500 text-[10px] uppercase tracking-widest">Sagittal Plane</th>
            <th className="p-4 text-left font-black text-green-500 text-[10px] uppercase tracking-widest">Frontal Plane</th>
            <th className="p-4 text-left font-black text-orange-500 text-[10px] uppercase tracking-widest">Transverse Plane</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-t border-slate-100">
              <td className="p-4 font-bold text-slate-800">{row.joint}</td>
              <td className="p-4 text-slate-600">{row.sagittal}</td>
              <td className="p-4 text-slate-600">{row.frontal}</td>
              <td className="p-4 text-slate-600">{row.transverse}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const FnTheory = () => {
  return (
    <div className="space-y-12">
      <Card className="border-none shadow-2xl rounded-[3.5rem] bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 p-12 opacity-5"><Workflow size={200} /></div>
        <CardHeader className="p-12 relative z-10">
          <div className="flex items-center gap-5 mb-4">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
              <GitBranch size={32} className="text-indigo-400" />
            </div>
            <div>
              <CardTitle className="text-4xl font-black tracking-tight">Functional Neuro Approach</CardTitle>
              <CardDescription className="text-slate-400 text-xl font-medium mt-2">
                Mechanoreceptive Conscious & Unconscious Processes
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-12 pt-0 space-y-6 relative z-10">
          <p className="text-lg text-slate-300 leading-relaxed">
            In the Functional Neuro Approach, mechanoreceptive afferent corrections address sensory input issues from joints, muscles, ligaments, and fascia. The goal is to fill "sensory gaps" that place the nervous system on high alert, resetting tone and reducing threat.
          </p>
          <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
            <h4 className="font-black text-indigo-300 uppercase tracking-widest text-xs mb-3">Key Principles</h4>
            <ul className="space-y-3 text-sm text-slate-300 font-medium">
              <li className="flex items-start gap-3"><CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" /> <span><strong>Indicator Response:</strong> Muscle inhibition signals the need for correction.</span></li>
              <li className="flex items-start gap-3"><CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" /> <span><strong>X-Pattern Test:</strong> Confirms mechanoreceptive involvement.</span></li>
              <li className="flex items-start gap-3"><CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" /> <span><strong>Re-Assessment:</strong> Always re-test the original pathway after correction.</span></li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Conscious Process */}
        <Card className="border-none shadow-lg rounded-[2.5rem] bg-white overflow-hidden">
          <CardHeader className="bg-blue-50 p-8">
            <SectionHeader icon={Brain} title="Mechanoreceptive Conscious" color="text-blue-600" />
            <p className="text-blue-800 font-medium">Targets the DCML pathway (15% of afferent input) to the contralateral sensory cortex (S1).</p>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <Step num={1} title="Confirm Conscious Pathway">
              <p>After pathway stimulus causes inhibition:</p>
              <p>1. X-pattern facilitates → <Badge className="bg-blue-100 text-blue-700">Mechanoreceptive</Badge></p>
              <p>2. TL opposite S1 facilitates → <Badge className="bg-blue-100 text-blue-700">Conscious (DCML)</Badge></p>
            </Step>
            <Step num={2} title="Localize the Joint">
              <p>Ask: Axial or Appendicular? Upper or Lower? Left or Right? Then localize the specific joint (e.g., hip, knee).</p>
              <p className="text-xs italic text-slate-500">Note: The joint may not be related to the symptom site.</p>
            </Step>
            <Step num={3} title="Find Joint Action">
              <p>Challenge planes of motion (Sagittal, Frontal, Transverse) to find the priority action. Use the table below for reference.</p>
            </Step>
            <Step num={4} title="Perform Correction">
              <p>Place joint into priority action. Perform an isometric contraction (30-40% effort) for 3-5 seconds while incorporating nasal breathing.</p>
            </Step>
            <Step num={5} title="Re-Assess">
              <p>Re-test the original pathway. Repeat the process for all layers until no inhibition remains (often 5-15+ layers).</p>
            </Step>
          </CardContent>
        </Card>

        {/* Unconscious Process */}
        <Card className="border-none shadow-lg rounded-[2.5rem] bg-white overflow-hidden">
          <CardHeader className="bg-emerald-50 p-8">
            <SectionHeader icon={Activity} title="Mechanoreceptive Unconscious" color="text-emerald-600" />
            <p className="text-emerald-800 font-medium">Targets spinocerebellar tracts (85% of afferent input) to the cerebellum.</p>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <Step num={1} title="Confirm Unconscious Pathway">
              <p>After pathway stimulus causes inhibition:</p>
              <p>1. X-pattern facilitates → <Badge className="bg-emerald-100 text-emerald-700">Mechanoreceptive</Badge></p>
              <p>2. TL GV16 (cerebellum) facilitates → <Badge className="bg-emerald-100 text-emerald-700">Unconscious</Badge></p>
            </Step>
            <Step num={2} title="Localize Joint & Ligament">
              <p>Hold GV16 while localizing the joint, then the specific ligament or tendon. Challenge the direction of stretch.</p>
            </Step>
            <Step num={3} title="Perform Correction">
              <p>Stretch the priority ligament/tendon while holding GV16. Apply a tuning fork to the cranium or tap for 3-5 seconds.</p>
            </Step>
            <Step num={4} title="Re-Assess">
              <p>Re-test the pathway. Repeat for all layers until normalized.</p>
            </Step>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-lg rounded-[2.5rem] bg-white overflow-hidden">
        <CardHeader className="p-8">
          <SectionHeader icon={List} title="Joint Action Reference Table" color="text-slate-600" />
        </CardHeader>
        <CardContent className="p-8 pt-0">
          <JointActionTable />
        </CardContent>
      </Card>
    </div>
  );
};

export default FnTheory;