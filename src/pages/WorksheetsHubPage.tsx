"use client";

import React from "react";
import { Link } from "react-router-dom";
import { 
  Compass, 
  ShieldCheck, 
  Palette, 
  RefreshCw, 
  FileText, 
  ChevronRight,
  Sparkles,
  Heart,
  Brain,
  Zap,
  CheckCircle2,
  PlayCircle,
  Briefcase
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/components/crm/AppLayout";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const WORKSHEETS = [
  {
    id: "business-model",
    label: "FNH Business Model",
    desc: "Transition from hourly to program-based practice. Calculate LCV and forecast growth.",
    icon: Briefcase,
    path: "/resources/worksheets/business-model",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
    category: "Business Strategy"
  },
  {
    id: "north-star",
    label: "Setting Your North Star",
    desc: "Define your core intention, commitment, and the version of yourself you are becoming.",
    icon: Compass,
    path: "/resources/worksheets/north-star",
    color: "text-indigo-600",
    bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
    category: "Foundational"
  },
  {
    id: "inner-awareness",
    label: "Inner Awareness & Sovereignty",
    desc: "Daily practice for tracking triggers, projections, and reclaiming your personal state.",
    icon: ShieldCheck,
    path: "/resources/worksheets/inner-awareness",
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    category: "Daily Practice"
  },
  {
    id: "week-3",
    label: "Week 3: Releasing Curses",
    desc: "A deep dive into releasing generational trauma, inherited shame, and secret society agreements.",
    icon: Zap,
    path: "/resources/worksheets/week-3",
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-900/20",
    category: "Program Content"
  },
  {
    id: "fear-creativity",
    label: "Fear & Creativity",
    desc: "Identify how fear manifests in the body and mind to unblock your creative expression.",
    icon: Palette,
    path: "/resources/worksheets/fear-creativity",
    color: "text-rose-600",
    bgColor: "bg-rose-50 dark:bg-rose-900/20",
    category: "Integration"
  },
  {
    id: "anger-flow",
    label: "Week 8: Anger & Flow",
    desc: "Reclaiming expression and self-acceptance by clearing toxic anger from the Wood element.",
    icon: RefreshCw,
    path: "/resources/worksheets/anger-flow",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
    category: "Program Content",
    videoUrl: "https://share.descript.com/view/gDxcvRrEKGw?t=448.630353&autoplay=1"
  }
];

const WorksheetsHubPage = () => {
  return (
    <AppLayout>
      <div className="space-y-10">
        <Breadcrumbs 
          items={[
            { label: "Resources", path: "/resources" },
            { label: "Worksheets" }
          ]} 
        />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-indigo-200 dark:shadow-indigo-900/20">
              <FileText size={32} />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight text-foreground">Worksheets & Reflections</h1>
              <p className="text-muted-foreground font-medium mt-1 text-lg">Tools for personal integration and practitioner development.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {WORKSHEETS.map((ws) => (
            <div key={ws.id} className="flex flex-col h-full">
              <Link to={ws.path} className="block group flex-1">
                <Card className="border-none shadow-md rounded-[2.5rem] bg-card hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full overflow-hidden">
                  <CardContent className="p-8 space-y-6">
                    <div className="flex items-start justify-between">
                      <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-sm",
                        ws.bgColor, ws.color
                      )}>
                        <ws.icon size={28} />
                      </div>
                      <Badge variant="secondary" className="bg-muted text-muted-foreground border-none font-black text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-full">
                        {ws.category}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-xl font-black text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{ws.label}</h3>
                      <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                        {ws.desc}
                      </p>
                    </div>

                    <div className="pt-4 flex items-center justify-between border-t border-border">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-indigo-600 transition-colors">
                        Open Worksheet
                      </span>
                      <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <ChevronRight size={18} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              {ws.videoUrl && (
                <div className="mt-3 px-4">
                  <Button variant="ghost" size="sm" asChild className="w-full rounded-xl h-9 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50">
                    <a href={ws.videoUrl} target="_blank" rel="noopener noreferrer">
                      <PlayCircle size={14} className="mr-2" /> Watch Lesson Recording
                    </a>
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>

        <Card className="border-none shadow-lg rounded-[3rem] bg-slate-900 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-12 opacity-10"><Sparkles size={150} /></div>
          <CardContent className="p-10 md:p-14 flex flex-col md:flex-row items-center gap-10 relative z-10">
            <div className="w-24 h-24 rounded-[2rem] bg-indigo-600 flex items-center justify-center shrink-0 shadow-2xl shadow-indigo-500/40">
              <Brain size={48} className="text-white" />
            </div>
            <div className="space-y-4">
              <h4 className="text-2xl font-black">The Power of Reflection</h4>
              <p className="text-slate-400 font-medium text-lg leading-relaxed">
                "Awareness is the first step of integration. These worksheets are designed to help you name the patterns, reduce their power, and step into your full sovereignty as a healer."
              </p>
              <div className="flex gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  <span className="text-xs font-bold text-slate-300">Auto-saving progress</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  <span className="text-xs font-bold text-slate-300">Print-ready layouts</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default WorksheetsHubPage;