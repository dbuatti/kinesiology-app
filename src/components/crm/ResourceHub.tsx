"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Printer, 
  Globe, 
  GraduationCap, 
  Workflow, 
  BookOpen, 
  ArrowRight, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ResourceItem {
  id: string;
  label: string;
  icon: any;
  desc: string;
  path?: string;
  isExternal?: boolean;
}

interface ResourceCategory {
  id: string;
  label: string;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
  items: ResourceItem[];
}

interface ResourceHubProps {
  categories: ResourceCategory[];
}

const ResourceHub = ({ categories }: ResourceHubProps) => {
  return (
    <div className="space-y-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* FEATURED HERO CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
        <Link to="/resources/print" className="block group h-full">
          <Card className="h-full border-none shadow-2xl rounded-[3rem] bg-slate-950 text-white overflow-hidden relative cursor-pointer hover:shadow-indigo-500/10 hover:-translate-y-2 transition-all duration-700">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-slate-950 to-purple-900/40" />
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity duration-700">
              <Printer size={140} />
            </div>
            <CardContent className="p-12 relative z-10 flex flex-col justify-between h-full">
              <div className="space-y-6">
                <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 font-black text-[10px] uppercase tracking-[0.4em] px-5 py-2 backdrop-blur-md rounded-full">
                  Clinical Assets
                </Badge>
                <h2 className="text-4xl font-serif font-bold tracking-tighter leading-none">The Print Hub</h2>
                <p className="text-base font-medium text-white/60 leading-relaxed">
                  Access all landscape-optimized reference sheets and worksheets.
                </p>
              </div>
              <div className="flex items-center justify-between mt-12">
                <span className="px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-400">Central Hub</span>
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-700">
                  <ArrowRight size={28} className="text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <a href="https://fnhrefapp-ggs6ojfk.manus.space/brain-zones" target="_blank" rel="noopener noreferrer" className="block group h-full">
          <Card className="h-full border-none shadow-2xl rounded-[3rem] bg-indigo-950 text-white overflow-hidden relative cursor-pointer hover:shadow-indigo-500/10 hover:-translate-y-2 transition-all duration-700">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 to-transparent" />
            <div className="absolute top-0 right-0 p-8 opacity-20 transition-opacity duration-700">
              <Globe size={140} />
            </div>
            <CardContent className="p-12 relative z-10 flex flex-col justify-between h-full">
              <div className="space-y-6">
                <Badge className="bg-white/20 text-white border-white/30 font-black text-[10px] uppercase tracking-[0.4em] px-5 py-2 backdrop-blur-md rounded-full">Official App</Badge>
                <h2 className="text-4xl font-serif font-bold tracking-tighter leading-none">FNH Ref App</h2>
                <p className="text-base font-medium text-white/60 leading-relaxed">The official reference application by Nick Moss for brain zones.</p>
              </div>
              <div className="flex items-center justify-between mt-12">
                <span className="px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-400">External</span>
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-700">
                  <ExternalLink size={28} className="text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </a>

        <a href="https://kin-videos.vercel.app/" target="_blank" rel="noopener noreferrer" className="block group h-full">
          <Card className="h-full border-none shadow-2xl rounded-[3rem] bg-indigo-600 text-white overflow-hidden relative cursor-pointer hover:shadow-indigo-500/10 hover:-translate-y-2 transition-all duration-700">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity duration-700">
              <GraduationCap size={140} />
            </div>
            <CardContent className="p-12 relative z-10 flex flex-col justify-between h-full">
              <div className="space-y-6">
                <Badge className="bg-white/20 text-white border-white/30 font-black text-[10px] uppercase tracking-[0.4em] px-5 py-2 backdrop-blur-sm rounded-full">Regular Access</Badge>
                <h2 className="text-4xl font-serif font-bold tracking-tighter leading-none">My Study Videos</h2>
                <p className="text-base font-medium text-white/80 leading-relaxed">Quick access to your personal technique reviews.</p>
              </div>
              <div className="flex items-center justify-between mt-12">
                <span className="px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-300">Portal</span>
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-700">
                  <ExternalLink size={28} className="text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </a>

        <Link to="/peace-framework" className="block group h-full">
          <Card className="h-full border-none shadow-2xl rounded-[3rem] bg-slate-900 text-white overflow-hidden relative cursor-pointer hover:shadow-indigo-500/10 hover:-translate-y-2 transition-all duration-700">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800/50 to-transparent" />
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity duration-700">
              <Workflow size={140} />
            </div>
            <CardContent className="p-12 relative z-10 flex flex-col justify-between h-full">
              <div className="space-y-6">
                <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 font-black text-[10px] uppercase tracking-[0.4em] px-5 py-2 backdrop-blur-sm rounded-full">Methodology</Badge>
                <h2 className="text-4xl font-serif font-bold tracking-tighter leading-none">The PEACE Method</h2>
                <p className="text-base font-medium text-slate-400 leading-relaxed">The central clinical hierarchy of Functional Neuro Health.</p>
              </div>
              <div className="flex items-center justify-between mt-12">
                <div className="flex gap-2">
                  {["P", "E", "A", "C", "E"].map((letter, idx) => (
                    <span key={`${letter}-${idx}`} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center font-black text-xs text-slate-500 border border-white/5">{letter}</span>
                  ))}
                </div>
                <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-2xl group-hover:scale-110 transition-all duration-700">
                  <ArrowRight size={28} className="text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <a href="https://functional-neuro-health.notion.site/Functional-Neuro-Health-The-PEACE-Method-28beacafb4a88026b9a9ccdefa4e1de9" target="_blank" rel="noopener noreferrer" className="block group h-full">
          <Card className="h-full border-none shadow-2xl rounded-[3rem] bg-slate-900 text-white overflow-hidden relative cursor-pointer hover:shadow-indigo-500/10 hover:-translate-y-2 transition-all duration-700">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800/50 to-transparent" />
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity duration-700">
              <BookOpen size={140} />
            </div>
            <CardContent className="p-12 relative z-10 flex flex-col justify-between h-full">
              <div className="space-y-6">
                <Badge className="bg-amber-500/20 text-amber-200 border-amber-500/30 font-black text-[10px] uppercase tracking-[0.4em] px-5 py-2 backdrop-blur-sm rounded-full">External</Badge>
                <h2 className="text-4xl font-serif font-bold tracking-tighter leading-none text-slate-100">FNH Notion Manual</h2>
                <p className="text-base font-medium text-slate-400 leading-relaxed">Access the full external Notion database.</p>
              </div>
              <div className="flex items-center justify-between mt-12">
                <span className="px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-400">Notion</span>
                <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-700">
                  <ExternalLink size={28} className="text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </a>
      </div>

      {/* CATEGORY SECTIONS */}
      {categories.map((category) => (
        <div key={category.id} className="space-y-10">
          <div className="flex items-center gap-6 px-2">
            <div className={cn("w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-xl", category.bgColor, category.color)}>
              <category.icon size={32} />
            </div>
            <div className="space-y-1">
              <h2 className="text-4xl font-serif font-bold text-foreground tracking-tight">{category.label}</h2>
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest opacity-60">Clinical Domain</p>
            </div>
            <div className="flex-1 h-[2px] bg-border rounded-full ml-4 opacity-30" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {category.items.map((item) => {
              const isExternal = item.isExternal;
              const cardContent = (
                <Card className="border-none shadow-md rounded-[2.5rem] bg-card hover:shadow-xl hover:-translate-y-2 transition-all duration-500 group cursor-pointer overflow-hidden h-full border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/30">
                  <CardContent className="p-10 space-y-8">
                    <div className="flex items-start justify-between">
                      <div className={cn(
                        "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-700 group-hover:scale-110 group-hover:rotate-3 shadow-sm",
                        category.bgColor, category.color
                      )}>
                        <item.icon size={32} />
                      </div>
                      <Badge variant="secondary" className="bg-muted text-muted-foreground border-none font-black text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-full">
                        {category.label}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <h3 className="text-2xl font-bold text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors tracking-tight">
                        {item.label}
                      </h3>
                      <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                        {item.desc}
                      </p>
                    </div>

                    <div className="pt-6 flex items-center justify-between border-t border-border">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {isExternal ? 'Open External' : 'Open Tool'} 
                      </span>
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                        {isExternal ? <ExternalLink size={18} /> : <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );

              return isExternal ? (
                <a key={item.id} href={item.path} target="_blank" rel="noopener noreferrer" className="block h-full">
                  {cardContent}
                </a>
              ) : (
                <Link key={item.id} to={item.path || `/resources?tab=${item.id}`} className="block h-full">
                  {cardContent}
                </Link>
              );
            })}
          </div>
        </div>
      ))}

      {/* FOOTER PHILOSOPHY */}
      <Card className="border-none shadow-2xl rounded-[4rem] bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 p-12 opacity-10"><Sparkles size={200} /></div>
        <CardContent className="p-16 md:p-24 flex flex-col md:flex-row items-center gap-16 relative z-10">
          <div className="w-32 h-32 rounded-[2.5rem] bg-indigo-600 flex items-center justify-center shrink-0 shadow-3xl shadow-indigo-500/40 animate-float">
            <ShieldCheck size={64} className="text-white" />
          </div>
          <div className="space-y-6 text-center md:text-left">
            <h4 className="text-4xl font-serif font-bold tracking-tight">The Clinical Standard</h4>
            <p className="text-slate-400 font-medium text-xl leading-relaxed max-w-3xl">
              "Mastery is not the accumulation of knowledge, but the refinement of intuition. These resources are your map, but your presence is the compass."
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-8 pt-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={24} className="text-emerald-400" />
                <span className="text-sm font-bold text-slate-300 uppercase tracking-widest">Verified Protocols</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={24} className="text-emerald-400" />
                <span className="text-sm font-bold text-slate-300 uppercase tracking-widest">Gold Standard v2.4</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResourceHub;