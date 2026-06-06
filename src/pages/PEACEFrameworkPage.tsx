
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Search, 
  ShieldCheck, 
  Workflow, 
  CheckCircle2, 
  Sparkles,
  Zap,
  Activity,
  Heart,
  Layers,
  Lightbulb
} from "lucide-react";
import AppLayout from "@/components/crm/AppLayout";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { cn } from "@/lib/utils";

const PEACEFrameworkPage = () => {
  return (
    <AppLayout>
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Breadcrumbs items={[{ label: "Resources", path: "/resources" }, { label: "The PEACE Framework" }]} />

        {/* Hero Section */}
        <div className="relative rounded-[3.5rem] overflow-hidden bg-slate-950 text-white p-12 shadow-2xl group border border-slate-800">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-slate-950 to-purple-900/40" />
          <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <BookOpen size={200} />
          </div>
          
          <div className="relative z-10 flex flex-col items-start space-y-6">
            <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 font-black text-[10px] uppercase tracking-[0.3em] px-4 py-1">
              FNH Living Manual • 2026 Gold Standard
            </Badge>
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter">The PEACE Method</h1>
            <p className="text-xl text-slate-300 font-medium max-w-2xl leading-relaxed">
              The central organising framework of Functional Neuro Health. 
            </p>
            <div className="p-6 bg-white/5 border border-white/10 rounded-3xl mt-4 max-w-3xl backdrop-blur-md">
              <p className="text-lg italic font-medium text-indigo-100">
                "Follow the process, not your preference. Let the system reveal its own order. One correction in the right sequence is worth ten done in the wrong one."
              </p>
            </div>
          </div>
        </div>

        {/* The 5 Steps */}
        <div className="space-y-8">
          <div className="flex items-center gap-4 px-2">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg">
              <Workflow size={24} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900">The Five Steps</h2>
              <p className="text-slate-500 font-medium">A living, non-linear process for holistic integration.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {[
              { letter: 'P', name: 'Preliminary Assessment', desc: 'Listen before you act. Gather the story, run the baseline, and identify how the system is currently organised.', icon: Search, color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { letter: 'E', name: 'Ease the System', desc: 'Create safety before change. A nervous system in threat cannot reorganise — ease must come before correction.', icon: Heart, color: 'text-rose-600', bg: 'bg-rose-50' },
              { letter: 'A', name: 'Align the Hierarchy', desc: 'Find the keystone — the true priority that the nervous system wants to address first.', icon: Layers, color: 'text-amber-600', bg: 'bg-amber-50' },
              { letter: 'C', name: 'Correct', desc: 'Facilitate the primary change. This is where the system resets and re-organises itself.', icon: Zap, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { letter: 'E', name: 'Embed', desc: 'Stabilise and integrate so change becomes lasting transformation. Vital for structural and primitive reflex work.', icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
            ].map((step) => (
              <Card key={step.name} className="border-none shadow-lg rounded-[2.5rem] bg-white overflow-hidden group hover:-translate-y-1 transition-all">
                <CardHeader className={`${step.bg} p-6 border-b border-slate-50 relative overflow-hidden`}>
                  <div className="absolute -right-4 -bottom-4 opacity-10"><step.icon size={100} /></div>
                  <div className={cn("text-5xl font-black mb-2 opacity-20 group-hover:opacity-100 transition-opacity", step.color)}>
                    {step.letter}
                  </div>
                  <CardTitle className="text-lg font-black text-slate-900 leading-tight">
                    {step.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-sm text-slate-600 font-medium leading-relaxed">
                    {step.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* The Clinical Hierarchy */}
        <div className="space-y-8 pt-8">
          <div className="flex items-center gap-4 px-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
              <Layers size={24} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900">The Clinical Hierarchy</h2>
              <p className="text-slate-500 font-medium">When symptoms appear, they are often the downstream expression of a higher-level disorganisation.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-2 border-purple-200 shadow-xl rounded-[2.5rem] bg-purple-50 overflow-hidden">
              <CardHeader className="p-8 pb-4">
                <Badge className="bg-purple-600 text-white w-max mb-3 text-[10px] font-black uppercase tracking-widest px-3 py-1">Asterisk Tier</Badge>
                <CardTitle className="text-2xl font-black text-purple-900">Energetic & Emotional Gate</CardTitle>
                <CardDescription className="text-purple-700 font-medium">Check these first. If they are off, they distort every correction below.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <ul className="space-y-3">
                  {['Emotional charge', 'Assemblage Point', 'Hara Line', 'Heart Wall'].map(item => (
                    <li key={item} className="flex items-center gap-3 text-sm font-bold text-purple-800">
                      <Sparkles size={18} className="text-purple-500" /> {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-indigo-200 shadow-xl rounded-[2.5rem] bg-indigo-50 overflow-hidden">
              <CardHeader className="p-8 pb-4">
                <Badge className="bg-indigo-600 text-white w-max mb-3 text-[10px] font-black uppercase tracking-widest px-3 py-1">1° Primary Tier</Badge>
                <CardTitle className="text-2xl font-black text-indigo-900">Neurological Foundation</CardTitle>
                <CardDescription className="text-indigo-700 font-medium">Neural core — fast, tangible change. Clear these survival loops before rechecking.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <ul className="space-y-3">
                  {['Primitive Reflexes', 'Nociception', 'Cranial Nerves', 'Eye Systems'].map((item, i) => (
                    <li key={item} className="flex items-center gap-3 text-sm font-bold text-indigo-800">
                      <span className="w-5 h-5 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center text-[10px] font-black">{i + 1}</span> {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-emerald-200 shadow-xl rounded-[2.5rem] bg-emerald-50 overflow-hidden">
              <CardHeader className="p-8 pb-4">
                <Badge className="bg-emerald-600 text-white w-max mb-3 text-[10px] font-black uppercase tracking-widest px-3 py-1">2° Secondary Tier</Badge>
                <CardTitle className="text-2xl font-black text-emerald-900">Immune & Physiological Layer</CardTitle>
                <CardDescription className="text-emerald-700 font-medium">Internal regulation. The immune system is a slave system — it reacts to threat.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <ul className="space-y-3">
                  {['Immune Vials (TH1/TH2/TH17/TH9)', 'Infections', 'Krebs Cycle', 'Organ/Gland Balance'].map(item => (
                    <li key={item} className="flex items-center gap-3 text-sm font-bold text-emerald-800">
                      <Activity size={18} className="text-emerald-500" /> {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-amber-200 shadow-xl rounded-[2.5rem] bg-amber-50 overflow-hidden">
              <CardHeader className="p-8 pb-4">
                <Badge className="bg-amber-600 text-white w-max mb-3 text-[10px] font-black uppercase tracking-widest px-3 py-1">3° Tertiary Tier</Badge>
                <CardTitle className="text-2xl font-black text-amber-900">Peripheral & Structural Layer</CardTitle>
                <CardDescription className="text-amber-700 font-medium">Integration anchors. Finish with these to lock in corrections made above.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <ul className="space-y-3">
                  {['Ileocecal Valve (ICV)', 'Cranial Bones', 'Musculoskeletal'].map(item => (
                    <li key={item} className="flex items-center gap-3 text-sm font-bold text-amber-800">
                      <CheckCircle2 size={18} className="text-amber-500" /> {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="p-8 bg-slate-900 text-white rounded-[2.5rem] flex items-start gap-6 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl shrink-0">
              <Lightbulb size={32} />
            </div>
            <div className="space-y-2">
              <h4 className="text-xl font-black text-indigo-400">Mastery Principle</h4>
              <p className="text-slate-300 font-medium leading-relaxed italic text-lg">
                "Aligning the hierarchy is not about doing more — it's about knowing when to stop. The system heals in order of priority, not in order of your curiosity. Find the keystone, correct it well, and the rest will follow."
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default PEACEFrameworkPage;