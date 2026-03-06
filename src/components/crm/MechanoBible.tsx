"use client";

import React from 'react';
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
  Lightbulb
} from 'lucide-react';
import { cn } from '@/lib/utils';

const MechanoBible = () => {
  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Hero Section */}
      <Card className="border-none shadow-2xl rounded-[3.5rem] bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 p-12 opacity-5"><BookOpen size={200} /></div>
        <CardHeader className="p-12 relative z-10">
          <div className="flex items-center gap-5 mb-4">
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
        </CardHeader>
      </Card>

      {/* The Rule of Action */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-lg rounded-[2.5rem] bg-indigo-600 text-white overflow-hidden">
          <CardContent className="p-10 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                <Zap size={24} className="text-amber-300" />
              </div>
              <h3 className="text-2xl font-black">The Rule of Action</h3>
            </div>
            <p className="text-xl font-bold leading-relaxed italic">
              "Joints act, muscles and tissues react."
            </p>
            <p className="text-indigo-100 leading-relaxed">
              In Functional Neurology, we don't just fix muscles. We calibrate the <strong>Joint Action</strong>. The brain prioritizes the safety and accuracy of a joint's movement over the status of any single muscle. If a joint action is perceived as a threat, the brain will inhibit (weaken) the surrounding muscles to prevent movement.
            </p>
            <div className="flex gap-4 pt-4">
              <div className="flex-1 p-4 bg-white/10 rounded-2xl border border-white/10">
                <p className="text-[10px] font-black uppercase tracking-widest mb-1">The Goal</p>
                <p className="text-sm font-bold">Restore high-fidelity feedback from the joint to the brain.</p>
              </div>
              <div className="flex-1 p-4 bg-white/10 rounded-2xl border border-white/10">
                <p className="text-[10px] font-black uppercase tracking-widest mb-1">The Result</p>
                <p className="text-sm font-bold">Immediate normalization of muscle tone and strength.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg rounded-[2.5rem] bg-white overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-100">
            <CardTitle className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Brain size={16} className="text-indigo-500" /> The Hierarchy
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-4">
            {[
              { step: 1, label: "Joint Action", desc: "The primary priority" },
              { step: 2, label: "Ligaments", desc: "Unconscious stability" },
              { step: 3, label: "Tendons", desc: "Force transmission" },
              { step: 4, label: "Muscles", desc: "The reactive slaves" }
            ].map((item) => (
              <div key={item.step} className="flex items-center gap-4">
                <span className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs border border-indigo-100">
                  {item.step}
                </span>
                <div>
                  <p className="font-black text-slate-900 text-sm">{item.label}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">{item.desc}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
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
    </div>
  );
};

export default MechanoBible;