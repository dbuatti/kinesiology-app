"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  GitBranch, Sparkles, Brain, Activity, CheckCircle2, 
  Zap, Info, List, RefreshCw, Eye, Dumbbell, Link as LinkIcon,
  Workflow,
  Lightbulb
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

const BrainZoneItem = ({ name, reflex, functions, indicators, laterality, lateralityColor }: any) => (
  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
    <div className="flex items-center justify-between">
      <h5 className="font-black text-slate-900">{name}</h5>
      <Badge className={lateralityColor}>{laterality}</Badge>
    </div>
    <div className="space-y-2 text-xs">
      <p><span className="font-bold text-slate-500">Reflex:</span> {reflex}</p>
      <p><span className="font-bold text-slate-500">Functions:</span> {functions}</p>
      <p><span className="font-bold text-slate-500">Indicators:</span> {indicators}</p>
    </div>
  </div>
);

const FnTheory = () => {
  const corticalZones = [
    { name: "Prefrontal Cortex", reflex: "Mid-forehead", functions: "Executive function, decision-making, emotional regulation", indicators: "Poor impulse control, chronic stress, difficulty planning", laterality: "Contralateral", color: "bg-purple-100 text-purple-700" },
    { name: "Premotor Cortex", reflex: "Just behind prefrontal", functions: "Movement planning and sequencing", indicators: "Difficulty initiating or coordinating actions", laterality: "Contralateral", color: "bg-purple-100 text-purple-700" },
    { name: "Motor Cortex (M1)", reflex: "Lateral to midline (homunculus map)", functions: "Voluntary movement control", indicators: "Weakness, tremors, fine motor deficits", laterality: "Contralateral", color: "bg-purple-100 text-purple-700" },
    { name: "Sensory Cortex (S1)", reflex: "Behind motor cortex", functions: "Sensory processing (touch, proprioception)", indicators: "Altered sensation, pain amplification", laterality: "Contralateral", color: "bg-purple-100 text-purple-700" },
    { name: "Visual Cortex", reflex: "Occipital area behind ear", functions: "Visual processing", indicators: "Visual disturbances, processing delays", laterality: "Contralateral", color: "bg-purple-100 text-purple-700" },
    { name: "Insular Cortex", reflex: "Pull forearm/eyebrow hairs", functions: "Interoception, pain perception", indicators: "Chronic pain, fatigue, body disconnection", laterality: "Contralateral", color: "bg-purple-100 text-purple-700" },
    { name: "Anterior Cingulate (ACC)", reflex: "Upper ear fold", functions: "Emotional/cognitive regulation, conflict monitoring", indicators: "Anxiety, obsessive thoughts, suffering", laterality: "Midline", color: "bg-slate-100 text-slate-700" },
  ];

  const subcorticalZones = [
    { name: "Limbic System", reflex: "Behind the ear", functions: "Emotion, memory, threat detection", indicators: "Anxiety, fear responses, avoidance", laterality: "Ipsilateral (L: Past, R: Current)", color: "bg-indigo-100 text-indigo-700" },
    { name: "Hypothalamus", reflex: "Tongue to palate", functions: "Homeostasis, hormones, stress response", indicators: "Temp dysregulation, fatigue, hormonal issues", laterality: "Midline", color: "bg-slate-100 text-slate-700" },
    { name: "Cerebellum", reflex: "GV16 (base of skull)", functions: "Motor coordination, balance, cognitive timing", indicators: "Ataxia, poor coordination, dizziness", laterality: "Ipsilateral", color: "bg-indigo-100 text-indigo-700" },
    { name: "Basal Ganglia", reflex: "GV24 (hairline midline)", functions: "Movement selection, tone control, habits", indicators: "Parkinson's-like symptoms, ADHD, rigidity", laterality: "Bilateral", color: "bg-slate-100 text-slate-700" },
    { name: "Thalamus", reflex: "Occipitalis muscles", functions: "Sensory relay to cortex", indicators: "Sensory overload, integration issues", laterality: "Midline", color: "bg-slate-100 text-slate-700" },
    { name: "Midbrain", reflex: "Stomach 2 (below eyes)", functions: "Motor/sensory integration, primitive reflexes", indicators: "Gait problems, eye movement issues", laterality: "Ipsilateral", color: "bg-indigo-100 text-indigo-700" },
    { name: "Pons", reflex: "GV17 (above GV16)", functions: "Extensor tone, vestibular processing", indicators: "Tone dysregulation, facial asymmetries", laterality: "Ipsilateral", color: "bg-indigo-100 text-indigo-700" },
    { name: "Medulla", reflex: "Jaw ramus / posterior occipital", functions: "Autonomic control (vagus, heart, breath)", indicators: "Autonomic dysregulation, whiplash", laterality: "Ipsilateral", color: "bg-indigo-100 text-indigo-700" },
  ];

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
                Mechanoreceptive & Efferent Processes
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Mechanoreceptive Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-lg rounded-[2.5rem] bg-white overflow-hidden">
          <CardHeader className="bg-blue-50 p-8">
            <SectionHeader icon={Brain} title="Mechanoreceptive Conscious" color="text-blue-600" />
            <p className="text-blue-800 font-medium">Targets the DCML pathway (15% of afferent input) to the contralateral sensory cortex (S1).</p>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <Step num={1} title="Confirm Conscious Pathway"><p>1. X-pattern facilitates → <Badge className="bg-blue-100 text-blue-700">Mechanoreceptive</Badge></p><p>2. TL opposite S1 facilitates → <Badge className="bg-blue-100 text-blue-700">Conscious (DCML)</Badge></p></Step>
            <Step num={2} title="Localize the Joint"><p>Ask: Axial or Appendicular? Upper or Lower? Left or Right? Then localize the specific joint.</p></Step>
            <Step num={3} title="Find Joint Action"><p>Challenge planes of motion (Sagittal, Frontal, Transverse) to find the priority action.</p></Step>
            <Step num={4} title="Perform Correction"><p>Place joint into priority action. Perform an isometric contraction (30-40% effort) for 3-5 seconds with nasal breathing.</p></Step>
            <Step num={5} title="Re-Assess"><p>Re-test the original pathway. Repeat for all layers until no inhibition remains.</p></Step>
          </CardContent>
        </Card>
        <Card className="border-none shadow-lg rounded-[2.5rem] bg-white overflow-hidden">
          <CardHeader className="bg-emerald-50 p-8">
            <SectionHeader icon={Activity} title="Mechanoreceptive Unconscious" color="text-emerald-600" />
            <p className="text-emerald-800 font-medium">Targets spinocerebellar tracts (85% of afferent input) to the cerebellum.</p>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <Step num={1} title="Confirm Unconscious Pathway"><p>1. X-pattern facilitates → <Badge className="bg-emerald-100 text-emerald-700">Mechanoreceptive</Badge></p><p>2. TL GV16 (cerebellum) facilitates → <Badge className="bg-emerald-100 text-emerald-700">Unconscious</Badge></p></Step>
            <Step num={2} title="Localize Joint & Ligament"><p>Hold GV16 while localizing the joint, then the specific ligament or tendon. Challenge the direction of stretch.</p></Step>
            <Step num={3} title="Perform Correction"><p>Stretch the priority ligament/tendon while holding GV16. Apply a tuning fork to the cranium or tap for 3-5 seconds.</p></Step>
            <Step num={4} title="Re-Assess"><p>Re-test the pathway. Repeat for all layers until normalized.</p></Step>
          </CardContent>
        </Card>
      </div>
      <Card className="border-none shadow-lg rounded-[2.5rem] bg-white overflow-hidden"><CardHeader className="p-8"><SectionHeader icon={List} title="Joint Action Reference Table" color="text-slate-600" /></CardHeader><CardContent className="p-8 pt-0"><JointActionTable /></CardContent></Card>

      {/* Efferent Section */}
      <Card className="border-none shadow-2xl rounded-[3.5rem] bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 p-12 opacity-5"><Sparkles size={200} /></div>
        <CardHeader className="p-12 relative z-10">
          <div className="flex items-center gap-5 mb-4">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20"><Sparkles size={32} className="text-purple-400" /></div>
            <div><CardTitle className="text-4xl font-black tracking-tight">Efferent Corrections (Top-Down)</CardTitle><CardDescription className="text-slate-400 text-xl font-medium mt-2">Integrating Brain Zones for Optimal Output</CardDescription></div>
          </div>
        </CardHeader>
        <CardContent className="p-12 pt-0 space-y-8 relative z-10">
          <Step num={1} title="Confirm Efferent Direction"><p>After stimulus causes inhibition and afferent is negative, confirm a "processing issue" (top-down) with muscle testing.</p></Step>
          <Step num={2} title="Identify Primary Brain Zone"><p>Check: Cortical or Subcortical? Localize the specific zone and lateralize (left/right) if applicable.</p></Step>
          <Step num={3} title="Identify Secondary Brain Zone"><p>Repeat the process to find the second zone in the pair (e.g., Cortical + Subcortical).</p></Step>
          <Step num={4} title="Apply Correction"><p>Hold or stimulate both zones together using one of three methods: Quick Tap (3-5s), Hold with Intention (until pulse), or Tuning Fork.</p></Step>
          <Step num={5} title="Re-Assess Pathway"><p>Return to the original stimulus and re-test the indicator muscle. Repeat if inhibition persists.</p></Step>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-lg rounded-[2.5rem] bg-white overflow-hidden">
          <CardHeader className="bg-purple-50 p-8"><SectionHeader icon={Brain} title="Cortical Brain Zones" color="text-purple-600" /><p className="text-purple-800 font-medium mt-2">Higher-level areas for conscious processing. Follows contralateral logic.</p></CardHeader>
          <CardContent className="p-8 grid grid-cols-1 gap-4">{corticalZones.map(zone => <BrainZoneItem key={zone.name} name={zone.name} reflex={zone.reflex} functions={zone.functions} indicators={zone.indicators} laterality={zone.laterality} lateralityColor={zone.color} />)}</CardContent>
        </Card>
        <Card className="border-none shadow-lg rounded-[2.5rem] bg-white overflow-hidden">
          <CardHeader className="bg-indigo-50 p-8"><SectionHeader icon={Zap} title="Subcortical Brain Zones" color="text-indigo-600" /><p className="text-indigo-800 font-medium mt-2">Deeper structures for automatic functions. Follows ipsilateral logic.</p></CardHeader>
          <CardContent className="p-8 grid grid-cols-1 gap-4">{subcorticalZones.map(zone => <BrainZoneItem key={zone.name} name={zone.name} reflex={zone.reflex} functions={zone.functions} indicators={zone.indicators} laterality={zone.laterality} lateralityColor={zone.color} />)}</CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-lg rounded-[2.5rem] bg-white overflow-hidden">
        <CardHeader className="p-8"><SectionHeader icon={Lightbulb} title="Clinical Notes & Integration" color="text-slate-600" /></CardHeader>
        <CardContent className="p-8 pt-0 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100"><h4 className="font-bold text-slate-800 mb-2">Multiple Layers</h4><p className="text-sm text-slate-600">It's normal to find 5-15+ correction layers per issue. Each layer uncovers a deeper compensation.</p></div>
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100"><h4 className="font-bold text-slate-800 mb-2">Emotional Fallback</h4><p className="text-sm text-slate-600">If no clear cortical/subcortical zones indicate, the issue is likely emotional. Switch to a full emotional process, then re-assess.</p></div>
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100"><h4 className="font-bold text-slate-800 mb-2">Nociceptive Threats</h4><p className="text-sm text-slate-600">Efferent corrections often follow or interweave with afferent ones, especially in complex pain patterns.</p></div>
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100"><h4 className="font-bold text-slate-800 mb-2">Let the System Guide</h4><p className="text-sm text-slate-600">Do not predetermine the correction. Trust the muscle testing feedback to reveal the priority.</p></div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FnTheory;