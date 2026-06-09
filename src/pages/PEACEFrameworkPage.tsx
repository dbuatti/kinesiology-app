
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
 <div className="relative rounded-xl overflow-hidden bg-card border border-border text-white p-12 shadow-sm group border border-border">
 <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-card to-muted/40" />
 <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700">
 <BookOpen size={200} />
 </div>
 
 <div className="relative z-10 flex flex-col items-start space-y-6">
 <Badge className="bg-muted0/20 text-chart-primary border-primary/30 font-semibold text-[10px] uppercase tracking-wider px-4 py-1">
 FNH Living Manual • 2026 Gold Standard
 </Badge>
 <h1 className="text-5xl md:text-6xl font-semibold tracking-tighter">The PEACE Method</h1>
 <p className="text-xl text-muted-foreground/60 font-medium max-w-2xl leading-relaxed">
 The central organising framework of Functional Neuro Health. 
 </p>
 <div className="p-6 bg-card/5 border border-white/10 rounded-3xl mt-4 max-w-3xl backdrop-blur-md">
 <p className="text-lg italic font-medium text-muted-foreground/40">
 "Follow the process, not your preference. Let the system reveal its own order. One correction in the right sequence is worth ten done in the wrong one."
 </p>
 </div>
 </div>
 </div>

 {/* The 5 Steps */}
 <div className="space-y-8">
 <div className="flex items-center gap-4 px-2">
 <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
 <Workflow size={24} />
 </div>
 <div>
 <h2 className="text-3xl font-semibold text-foreground">The Five Steps</h2>
 <p className="text-muted-foreground font-medium">A living, non-linear process for holistic integration.</p>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
 {[
 { letter: 'P', name: 'Preliminary Assessment', desc: 'Listen before you act. Gather the story, run the baseline, and identify how the system is currently organised.', icon: Search, color: 'text-chart-primary', bg: 'bg-muted' },
 { letter: 'E', name: 'Ease the System', desc: 'Create safety before change. A nervous system in threat cannot reorganise — ease must come before correction.', icon: Heart, color: 'text-chart-destructive', bg: 'bg-muted' },
 { letter: 'A', name: 'Align the Hierarchy', desc: 'Find the keystone — the true priority that the nervous system wants to address first.', icon: Layers, color: 'text-muted-foreground', bg: 'bg-muted' },
 { letter: 'C', name: 'Correct', desc: 'Facilitate the primary change. This is where the system resets and re-organises itself.', icon: Zap, color: 'text-chart-emerald', bg: 'bg-muted' },
 { letter: 'E', name: 'Embed', desc: 'Stabilise and integrate so change becomes lasting transformation. Vital for structural and primitive reflex work.', icon: ShieldCheck, color: 'text-chart-primary', bg: 'bg-muted' },
 ].map((step) => (
 <Card key={step.name} className="border-none shadow-sm rounded-xl bg-card overflow-hidden group hover:-translate-y-1 transition-all">
 <CardHeader className={`${step.bg} p-6 border-b border-border relative overflow-hidden`}>
 <div className="absolute -right-4 -bottom-4 opacity-10"><step.icon size={100} /></div>
 <div className={cn("text-5xl font-semibold mb-2 opacity-20 group-hover:opacity-100 transition-opacity", step.color)}>
 {step.letter}
 </div>
 <CardTitle className="text-lg font-semibold text-foreground leading-tight">
 {step.name}
 </CardTitle>
 </CardHeader>
 <CardContent className="p-6">
 <p className="text-sm text-muted-foreground font-medium leading-relaxed">
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
 <div className="w-12 h-12 rounded-xl bg-card text-card-foreground border border-border flex items-center justify-center shadow-sm">
 <Layers size={24} />
 </div>
 <div>
 <h2 className="text-3xl font-semibold text-foreground">The Clinical Hierarchy</h2>
 <p className="text-muted-foreground font-medium">When symptoms appear, they are often the downstream expression of a higher-level disorganisation.</p>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
 <Card className="border-2 border-border shadow-sm rounded-xl bg-muted overflow-hidden">
 <CardHeader className="p-8 pb-4">
 <Badge className="bg-primary text-primary-foreground w-max mb-3 text-[10px] font-semibold uppercase tracking-wider px-3 py-1">Asterisk Tier</Badge>
 <CardTitle className="text-2xl font-semibold text-foreground">Energetic & Emotional Gate</CardTitle>
 <CardDescription className="text-muted-foreground font-medium">Check these first. If they are off, they distort every correction below.</CardDescription>
 </CardHeader>
 <CardContent className="p-8 pt-0">
 <ul className="space-y-3">
 {['Emotional charge', 'Assemblage Point', 'Hara Line', 'Heart Wall'].map(item => (
 <li key={item} className="flex items-center gap-3 text-sm font-medium text-foreground">
 <Sparkles size={18} className="text-muted-foreground" /> {item}
 </li>
 ))}
 </ul>
 </CardContent>
 </Card>

 <Card className="border-2 border-border shadow-sm rounded-xl bg-muted overflow-hidden">
 <CardHeader className="p-8 pb-4">
 <Badge className="bg-primary text-primary-foreground w-max mb-3 text-[10px] font-semibold uppercase tracking-wider px-3 py-1">1° Primary Tier</Badge>
 <CardTitle className="text-2xl font-semibold text-foreground">Neurological Foundation</CardTitle>
 <CardDescription className="text-chart-primary font-medium">Neural core — fast, tangible change. Clear these survival loops before rechecking.</CardDescription>
 </CardHeader>
 <CardContent className="p-8 pt-0">
 <ul className="space-y-3">
 {['Primitive Reflexes', 'Nociception', 'Cranial Nerves', 'Eye Systems'].map((item, i) => (
 <li key={item} className="flex items-center gap-3 text-sm font-medium text-foreground">
 <span className="w-5 h-5 rounded-full bg-muted text-chart-primary flex items-center justify-center text-[10px] font-semibold">{i + 1}</span> {item}
 </li>
 ))}
 </ul>
 </CardContent>
 </Card>

 <Card className="border-2 border-border shadow-sm rounded-xl bg-muted overflow-hidden">
 <CardHeader className="p-8 pb-4">
 <Badge className="bg-primary text-primary-foreground w-max mb-3 text-[10px] font-semibold uppercase tracking-wider px-3 py-1">2° Secondary Tier</Badge>
 <CardTitle className="text-2xl font-semibold text-foreground">Immune & Physiological Layer</CardTitle>
 <CardDescription className="text-chart-emerald font-medium">Internal regulation. The immune system is a slave system — it reacts to threat.</CardDescription>
 </CardHeader>
 <CardContent className="p-8 pt-0">
 <ul className="space-y-3">
 {['Immune Vials (TH1/TH2/TH17/TH9)', 'Infections', 'Krebs Cycle', 'Organ/Gland Balance'].map(item => (
 <li key={item} className="flex items-center gap-3 text-sm font-medium text-foreground">
 <Activity size={18} className="text-chart-emerald" /> {item}
 </li>
 ))}
 </ul>
 </CardContent>
 </Card>

 <Card className="border-2 border-border shadow-sm rounded-xl bg-muted overflow-hidden">
 <CardHeader className="p-8 pb-4">
 <Badge className="bg-muted text-muted-foreground w-max mb-3 text-[10px] font-semibold uppercase tracking-wider px-3 py-1">3° Tertiary Tier</Badge>
 <CardTitle className="text-2xl font-semibold text-foreground">Peripheral & Structural Layer</CardTitle>
 <CardDescription className="text-muted-foreground font-medium">Integration anchors. Finish with these to lock in corrections made above.</CardDescription>
 </CardHeader>
 <CardContent className="p-8 pt-0">
 <ul className="space-y-3">
 {['Ileocecal Valve (ICV)', 'Cranial Bones', 'Musculoskeletal'].map(item => (
 <li key={item} className="flex items-center gap-3 text-sm font-medium text-foreground">
 <CheckCircle2 size={18} className="text-muted-foreground" /> {item}
 </li>
 ))}
 </ul>
 </CardContent>
 </Card>
 </div>

 <div className="p-8 bg-card text-card-foreground border border-border rounded-xl flex items-start gap-6 shadow-sm">
 <div className="w-16 h-16 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm shrink-0">
 <Lightbulb size={32} />
 </div>
 <div className="space-y-2">
 <h4 className="text-xl font-semibold text-chart-primary">Mastery Principle</h4>
 <p className="text-muted-foreground/60 font-medium leading-relaxed italic text-lg">
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