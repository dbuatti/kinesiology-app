"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Mic, 
  Smartphone, 
  Brain, 
  Mail, 
  Target,
  Laptop,
  Repeat,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Workflow,
  FileText,
  Clock,
  Sparkles,
  Link as LinkIcon,
  Send
} from "lucide-react";
import AppLayout from "@/components/crm/AppLayout";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { cn } from "@/lib/utils";

const MarketingEnginePage = () => {
  return (
    <AppLayout>
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
        <Breadcrumbs items={[{ label: "Business Tools" }, { label: "The 45-Minute AI Marketing Engine" }]} />

        {/* Hero Section */}
        <div className="relative rounded-[3.5rem] overflow-hidden bg-slate-950 text-white p-12 shadow-2xl group border border-slate-800">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 via-slate-950 to-teal-900/40" />
          <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <Mic size={200} />
          </div>
          
          <div className="relative z-10 flex flex-col items-start space-y-6">
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 font-black text-[10px] uppercase tracking-[0.3em] px-4 py-1">
              Business Operating System
            </Badge>
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter leading-tight">The 45-Minute AI <br />Marketing Engine</h1>
            <p className="text-xl text-slate-300 font-medium max-w-2xl leading-relaxed">
              Voice → AI → Notion → Email System Workflow.
            </p>
            <div className="p-6 bg-white/5 border border-white/10 rounded-3xl mt-4 max-w-3xl backdrop-blur-md">
              <div className="flex items-start gap-4">
                <Lightbulb className="text-emerald-400 shrink-0 mt-1" size={24} />
                <p className="text-lg italic font-medium text-emerald-100">
                  "You do not need more time to market. You need a system that captures thinking in motion and converts it into assets."
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Strategic Foundation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h2 className="text-2xl font-black flex items-center gap-3 text-slate-900">
              <LinkIcon size={24} className="text-indigo-600" /> Renting vs. Owning
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <Card className="border-2 border-rose-100 shadow-sm bg-rose-50/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-black text-rose-900">Rented Land (Social Media)</CardTitle>
                </CardHeader>
                <CardContent className="text-sm font-medium text-rose-800 space-y-2">
                  <p>Instagram, LinkedIn, YouTube, TikTok.</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Don't control distribution</li>
                    <li>Subject to algorithm shifts</li>
                    <li>Can lose reach overnight</li>
                  </ul>
                </CardContent>
              </Card>
              <Card className="border-2 border-emerald-100 shadow-sm bg-emerald-50/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-black text-emerald-900">Owned Land (Email List)</CardTitle>
                </CardHeader>
                <CardContent className="text-sm font-medium text-emerald-800 space-y-2">
                  <p>Mailchimp or similar platforms.</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Own the relationship</li>
                    <li>Control communication</li>
                    <li>Build long-term trust + conversion</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-black flex items-center gap-3 text-slate-900">
              <Target size={24} className="text-indigo-600" /> Strategic Objective
            </h2>
            <Card className="border-none shadow-lg rounded-3xl bg-indigo-900 text-white h-full">
              <CardContent className="p-8 flex flex-col justify-center h-full space-y-6">
                <p className="text-indigo-200 font-medium">Every piece of content should:</p>
                <ol className="space-y-4">
                  <li className="flex items-center gap-3"><span className="w-8 h-8 rounded-full bg-indigo-800 flex items-center justify-center font-black">1</span> <strong>Capture attention</strong> (social media)</li>
                  <li className="flex items-center gap-3"><span className="w-8 h-8 rounded-full bg-indigo-800 flex items-center justify-center font-black">2</span> <strong>Build trust</strong> (story, insight, value)</li>
                  <li className="flex items-center gap-3"><span className="w-8 h-8 rounded-full bg-indigo-800 flex items-center justify-center font-black">3</span> <strong>Redirect</strong> → email list</li>
                  <li className="flex items-center gap-3"><span className="w-8 h-8 rounded-full bg-indigo-800 flex items-center justify-center font-black">4</span> <strong>Nurture deeply</strong> (via email)</li>
                </ol>
                <div className="p-4 bg-white/10 rounded-2xl border border-white/20 mt-4">
                  <p className="text-sm font-bold text-indigo-100">
                    Social media is not the destination. It is the bridge to your email ecosystem.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* The 4-Phase Workflow */}
        <div className="space-y-8 pt-8 border-t border-slate-200">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <h2 className="text-4xl font-black text-slate-900">The 4-Phase Workflow</h2>
            <p className="text-slate-500 font-medium text-lg">Transform a 20-minute walk into a week's worth of content in under 45 minutes total.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { 
                step: 1, time: "15-20 mins", title: "Walking Capture", icon: Mic, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200",
                desc: "Extract ideas without friction.",
                bullets: ["Go for a walk (no podcasts)", "Open Claude (voice mode)", "Speak a story or insight", "Prompt for 3 emails"]
              },
              { 
                step: 2, time: "Instant", title: "Invisible Handoff", icon: Workflow, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200",
                desc: "Remove manual organisation.",
                bullets: ["Claude connected to Notion via MCP", "Auto-creates Weekly Content Sheet", "Assigns dates and tags automatically"]
              },
              { 
                step: 3, time: "10-15 mins", title: "Desktop Refinement", icon: Laptop, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200",
                desc: "Restore human precision.",
                bullets: ["Check voice alignment", "Verify accuracy (links/offers)", "Fix structural flow", "Add specific context/CTAs"]
              },
              { 
                step: 4, time: "10-15 mins", title: "Distribution", icon: Send, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200",
                desc: "Deploy into owned system.",
                bullets: ["Open Mailchimp", "Paste email copy & subject lines", "Select audience", "Schedule send"]
              }
            ].map((phase) => (
              <Card key={phase.step} className={cn("border-2 shadow-lg rounded-3xl relative overflow-hidden", phase.border)}>
                <div className="absolute top-0 right-0 p-4 opacity-5"><phase.icon size={80} /></div>
                <CardHeader className={cn("pb-4", phase.bg)}>
                  <div className="flex justify-between items-start mb-2">
                    <span className={cn("w-8 h-8 rounded-full flex items-center justify-center font-black text-white", phase.color.replace('text', 'bg'))}>{phase.step}</span>
                    <Badge variant="outline" className={cn("bg-white font-black text-[10px] uppercase tracking-widest", phase.color)}><Clock size={12} className="mr-1" /> {phase.time}</Badge>
                  </div>
                  <CardTitle className={cn("text-xl font-black", phase.color)}>{phase.title}</CardTitle>
                  <CardDescription className="font-bold text-slate-600">{phase.desc}</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <ul className="space-y-3">
                    {phase.bullets.map((b, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm font-medium text-slate-700">
                        <CheckCircle2 size={16} className={cn("shrink-0 mt-0.5", phase.color)} /> {b}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Prompt & Execution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-8">
          <Card className="lg:col-span-2 border-none shadow-xl rounded-[3rem] bg-slate-900 text-white overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-2xl font-black flex items-center gap-3 text-amber-400">
                <Mic size={28} /> The Voice Prompt
              </CardTitle>
              <CardDescription className="text-slate-400 font-medium">Speak this into Claude while walking.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <div className="p-6 bg-white/10 rounded-2xl border border-white/20">
                <p className="text-xl font-bold leading-relaxed italic text-amber-50">
                  "I've got a story about <span className="text-amber-300">[experience]</span>. 
                  The insight is <span className="text-amber-300">[lesson]</span>. 
                  Turn this into 3 emails: Monday, Wednesday, Friday. 
                  Include subject lines + preview text."
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="p-4 bg-black/20 rounded-xl text-center border border-white/5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Monday</p>
                  <p className="font-bold text-sm">Story / Insight</p>
                </div>
                <div className="p-4 bg-black/20 rounded-xl text-center border border-white/5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Wednesday</p>
                  <p className="font-bold text-sm">Value / Education</p>
                </div>
                <div className="p-4 bg-black/20 rounded-xl text-center border border-white/5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Friday</p>
                  <p className="font-bold text-sm">Offer / CTA</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl rounded-[3rem] bg-amber-50 border-2 border-amber-100">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xl font-black flex items-center gap-3 text-amber-900">
                <AlertTriangle size={24} className="text-amber-600" /> Common Pitfalls
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-4">
              {[
                { title: "Over-editing", desc: "Kills momentum. Don't rewrite everything." },
                { title: "Skipping walks", desc: "Removes your best creative source." },
                { title: "Treating AI like Google", desc: "Talk to it like a collaborative partner." },
                { title: "No Call-To-Action", desc: "Emails that lead nowhere don't convert." }
              ].map((p, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                  <div>
                    <p className="font-bold text-amber-900 text-sm">{p.title}</p>
                    <p className="text-xs text-amber-700 font-medium">{p.desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Training AI */}
        <div className="p-8 bg-indigo-50 rounded-[3rem] border-2 border-indigo-100 flex flex-col md:flex-row items-center gap-8">
          <div className="w-24 h-24 rounded-[2rem] bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xl">
            <Brain size={48} />
          </div>
          <div className="space-y-3">
            <h3 className="text-2xl font-black text-indigo-900">Training Your AI (Critical Layer)</h3>
            <p className="text-indigo-800 font-medium leading-relaxed">
              The quality of your AI equals the quality of your feedback loop. Reduce editing time over weeks by explicitly feeding it your history (past emails, posts, notes) and defining your style (sentence length, tone, language rules). Each time you edit, you are training it.
            </p>
          </div>
        </div>

      </div>
    </AppLayout>
  );
};

export default MarketingEnginePage;