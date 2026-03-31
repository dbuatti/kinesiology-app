"use client";

import React from "react";
import { 
  Mic, 
  MessageSquare, 
  Sparkles, 
  Volume2, 
  ArrowRight, 
  ExternalLink, 
  Briefcase,
  TrendingUp,
  Target,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Music,
  Users,
  Globe,
  Rocket,
  Heart,
  Brain
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/crm/AppLayout";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const MARKETING_TOOLS = [
  {
    id: "marketing-engine",
    label: "Marketing Engine",
    desc: "AI-powered content distribution workflow. Transform clinical wins into newsletter assets.",
    icon: Mic,
    path: "/business/marketing-engine",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
    category: "Internal Tool"
  },
  {
    id: "kit",
    label: "Kit (ConvertKit)",
    desc: "Your owned audience platform. Manage broadcasts, sequences, and subscriber growth.",
    icon: Globe,
    path: "https://app.kit.com/",
    color: "text-indigo-600",
    bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
    category: "Distribution",
    isExternal: true
  }
];

const AI_PARTNERS = [
  {
    id: "claude",
    label: "Claude Assistant",
    desc: "Primary partner for business strategy, copywriting, and clinical analysis.",
    icon: MessageSquare,
    path: "https://claude.ai/chat/e4805343-71a0-48fc-a1e0-4d2dde541a88",
    color: "text-indigo-600",
    bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
    category: "AI Partner",
    isExternal: true
  },
  {
    id: "gemini",
    label: "Gemini Assistant",
    desc: "Google's AI for research, business planning, and data organization.",
    icon: Sparkles,
    path: "https://gemini.google.com/app/5d5d4bcde141a99a",
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    category: "AI Partner",
    isExternal: true
  }
];

const LEADERSHIP_TOOLS = [
  {
    id: "insight-timer",
    label: "Insight Timer Portal",
    desc: "Connect with the world through guided meditations and teacher insights.",
    icon: Volume2,
    path: "https://teacher.insighttimer.com/login?next=%2Faudio%3Flibraryitem%3DNhUOPacb0145IEvUBJCf%26sortBy%3Dnewest%26sort_direction%3Ddesc",
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-900/20",
    category: "Teacher",
    isExternal: true
  },
  {
    id: "choir",
    label: "Resonance Choir",
    desc: "Community connection through song. Your platform for collective resonance.",
    icon: Music,
    path: "https://resonance-with-daniele.vercel.app/",
    color: "text-rose-600",
    bgColor: "bg-rose-50 dark:bg-rose-900/20",
    category: "Leader",
    isExternal: true
  }
];

const BusinessHubPage = () => {
  const ToolCard = ({ tool }: { tool: any }) => {
    const content = (
      <Card className="border-none shadow-md rounded-[2.5rem] bg-card hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer overflow-hidden h-full">
        <CardContent className="p-8 space-y-6">
          <div className="flex items-start justify-between">
            <div className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-sm",
              tool.bgColor, tool.color
            )}>
              <tool.icon size={28} />
            </div>
            <Badge variant="secondary" className="bg-muted text-muted-foreground border-none font-black text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-full">
              {tool.category}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-black text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {tool.label}
            </h3>
            <p className="text-sm text-muted-foreground font-medium leading-relaxed">
              {tool.desc}
            </p>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-border">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-indigo-600 transition-colors">
              {tool.isExternal ? 'Open External' : 'Launch Tool'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-indigo-600 group-hover:text-white transition-all">
              {tool.isExternal ? <ExternalLink size={16} /> : <ArrowRight size={18} />}
            </div>
          </div>
        </CardContent>
      </Card>
    );

    return tool.isExternal ? (
      <a key={tool.id} href={tool.path} target="_blank" rel="noopener noreferrer" className="block h-full">
        {content}
      </a>
    ) : (
      <Link key={tool.id} to={tool.path} className="block h-full">
        {content}
      </Link>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
        <Breadcrumbs items={[{ label: "Business Hub" }]} />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-600 text-white flex items-center justify-center shadow-2xl shadow-emerald-100 dark:shadow-emerald-900/20">
              <Briefcase size={32} />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight text-foreground">Business Hub</h1>
              <p className="text-muted-foreground font-medium mt-1 text-lg">Strategic tools for practice growth and global connection.</p>
            </div>
          </div>
        </div>

        {/* Strategy Card */}
        <Card className="border-none shadow-2xl rounded-[3rem] bg-slate-900 text-white overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 via-slate-950 to-indigo-900/40" />
          <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <TrendingUp size={200} />
          </div>
          <CardContent className="p-10 md:p-14 relative z-10">
            <div className="max-w-2xl space-y-6">
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 font-black text-[10px] uppercase tracking-[0.3em] px-4 py-1">
                Practice Growth Strategy
              </Badge>
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight">
                Own Your Audience. <br/>Connect with the World.
              </h2>
              <p className="text-lg text-slate-300 font-medium leading-relaxed">
                Move people from "Rented Land" (Social Media) to "Owned Land" (Your Kit Email List) through high-value clinical insights and collective resonance.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-400" />
                  <span className="text-sm font-bold text-slate-200">Kit Integration Active</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-400" />
                  <span className="text-sm font-bold text-slate-200">AI Marketing Engine Ready</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section: Marketing & Distribution (Primary Priority) */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm">
              <Rocket size={20} />
            </div>
            <h2 className="text-2xl font-black text-foreground tracking-tight">Marketing & Distribution</h2>
            <div className="flex-1 h-[2px] bg-border rounded-full ml-4" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {MARKETING_TOOLS.map(tool => <ToolCard key={tool.id} tool={tool} />)}
          </div>
        </div>

        {/* Section: AI Strategy Partners (Secondary Priority) */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
              <Brain size={20} />
            </div>
            <h2 className="text-2xl font-black text-foreground tracking-tight">AI Strategy Partners</h2>
            <div className="flex-1 h-[2px] bg-border rounded-full ml-4" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {AI_PARTNERS.map(tool => <ToolCard key={tool.id} tool={tool} />)}
          </div>
        </div>

        {/* Section: Teacher & Leader Development (Lower Priority) */}
        <div className="space-y-6 pt-8 border-t border-border">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-sm">
              <Users size={20} />
            </div>
            <h2 className="text-2xl font-black text-foreground tracking-tight opacity-60">Teacher & Leader Development</h2>
            <div className="flex-1 h-[2px] bg-border rounded-full ml-4 opacity-30" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 opacity-80 hover:opacity-100 transition-opacity">
            {LEADERSHIP_TOOLS.map(tool => <ToolCard key={tool.id} tool={tool} />)}
          </div>
        </div>

        {/* Quick Tips */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-border">
          <Card className="border-none shadow-lg rounded-[2rem] bg-card p-6 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Target size={20} />
            </div>
            <h4 className="font-black text-slate-900">Capture Wins</h4>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Every time a client has a breakthrough, log it in the "Wins Vault" within the Marketing Engine. These are your best content hooks.
            </p>
          </Card>
          <Card className="border-none shadow-lg rounded-[2rem] bg-emerald-50 text-emerald-600 flex items-center justify-center p-6 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-white text-emerald-600 flex items-center justify-center shadow-sm">
              <Zap size={20} />
            </div>
            <div className="space-y-1">
              <h4 className="font-black text-emerald-900">Batch Content</h4>
              <p className="text-xs text-emerald-700 leading-relaxed font-medium">
                Use the AI Studio to turn one clinical insight into a Kit Broadcast, a LinkedIn post, and an Instagram carousel in seconds.
              </p>
            </div>
          </Card>
          <Card className="border-none shadow-lg rounded-[2rem] bg-rose-50 text-rose-600 flex items-center justify-center p-6 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-white text-rose-600 flex items-center justify-center shadow-sm">
              <Heart size={20} />
            </div>
            <div className="space-y-1">
              <h4 className="font-black text-rose-900">Collective Resonance</h4>
              <p className="text-xs text-rose-700 leading-relaxed font-medium">
                Your choir and teacher profiles are not separate from your practice—they are the top of your funnel for global connection.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default BusinessHubPage;