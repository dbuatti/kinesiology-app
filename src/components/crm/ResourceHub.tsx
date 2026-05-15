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
  ChevronRight
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
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Featured Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <Link to="/resources/print" className="block group h-full">
          <Card className="h-full border-none shadow-2xl rounded-[3rem] bg-slate-900 text-white overflow-hidden relative cursor-pointer hover:shadow-3xl hover:-translate-y-1 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-slate-950 to-purple-900/40" />
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Printer size={120} />
            </div>
            <CardContent className="p-8 relative z-10 flex flex-col justify-between h-full">
              <div className="space-y-4">
                <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 font-black text-[10px] uppercase tracking-[0.3em] px-3 py-1 backdrop-blur-sm">
                  Clinical Assets
                </Badge>
                <h2 className="text-3xl font-black tracking-tighter leading-none">The Print Hub</h2>
                <p className="text-sm font-medium text-white/80 leading-relaxed">
                  Access all landscape-optimized reference sheets and worksheets.
                </p>
              </div>
              <div className="flex items-center justify-between mt-8">
                <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-300">Central Hub</span>
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                  <ArrowRight size={20} className="text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <a href="https://fnhrefapp-ggs6ojfk.manus.space/brain-zones" target="_blank" rel="noopener noreferrer" className="block group h-full">
          <Card className="h-full border-none shadow-xl rounded-[3rem] bg-indigo-900 text-white overflow-hidden relative cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 to-transparent" />
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Globe size={120} />
            </div>
            <CardContent className="p-8 relative z-10 flex flex-col justify-between h-full">
              <div className="space-y-4">
                <Badge className="bg-white/20 text-white border-white/30 font-black text-[10px] uppercase tracking-[0.3em] px-3 py-1 backdrop-blur-sm">Official App</Badge>
                <h2 className="text-3xl font-black tracking-tighter leading-none">FNH Ref App</h2>
                <p className="text-sm font-medium text-white/80 leading-relaxed">The official reference application by Nick Moss for brain zones.</p>
              </div>
              <div className="flex items-center justify-between mt-8">
                <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-300">External</span>
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                  <ExternalLink size={20} className="text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </a>

        <a href="https://kin-videos.vercel.app/" target="_blank" rel="noopener noreferrer" className="block group h-full">
          <Card className="h-full border-none shadow-xl rounded-[3rem] bg-indigo-600 text-white overflow-hidden relative cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <GraduationCap size={120} />
            </div>
            <CardContent className="p-8 relative z-10 flex flex-col justify-between h-full">
              <div className="space-y-4">
                <Badge className="bg-white/20 text-white border-white/30 font-black text-[10px] uppercase tracking-[0.3em] px-3 py-1 backdrop-blur-sm">Regular Access</Badge>
                <h2 className="text-3xl font-black tracking-tighter leading-none">My Study Videos</h2>
                <p className="text-sm font-medium text-white/80 leading-relaxed">Quick access to your personal technique reviews.</p>
              </div>
              <div className="flex items-center justify-between mt-8">
                <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-300">Portal</span>
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                  <ExternalLink size={20} className="text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </a>

        <Link to="/peace-framework" className="block group h-full">
          <Card className="h-full border-none shadow-xl rounded-[3rem] bg-slate-900 text-white overflow-hidden relative cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800/50 to-transparent" />
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Workflow size={120} />
            </div>
            <CardContent className="p-8 relative z-10 flex flex-col justify-between h-full">
              <div className="space-y-4">
                <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 font-black text-[10px] uppercase tracking-[0.3em] px-4 py-1 backdrop-blur-sm">Methodology</Badge>
                <h2 className="text-3xl font-black tracking-tighter leading-none">The PEACE Method</h2>
                <p className="text-sm font-medium text-slate-400 leading-relaxed">The central clinical hierarchy of Functional Neuro Health.</p>
              </div>
              <div className="flex items-center justify-between mt-8">
                <div className="flex gap-1">
                  {["P", "E", "A", "C", "E"].map((letter, idx) => (
                    <span key={`${letter}-${idx}`} className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center font-black text-[8px] text-slate-500">{letter}</span>
                  ))}
                </div>
                <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-lg group-hover:scale-110 transition-all duration-500">
                  <ArrowRight size={20} className="text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <a href="https://functional-neuro-health.notion.site/Functional-Neuro-Health-The-PEACE-Method-28beacafb4a88026b9a9ccdefa4e1de9" target="_blank" rel="noopener noreferrer" className="block group h-full">
          <Card className="h-full border-none shadow-xl rounded-[3rem] bg-slate-900 text-white overflow-hidden relative cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800/50 to-transparent" />
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <BookOpen size={120} />
            </div>
            <CardContent className="p-8 relative z-10 flex flex-col justify-between h-full">
              <div className="space-y-4">
                <Badge className="bg-amber-500/20 text-amber-200 border-amber-500/30 font-black text-[10px] uppercase tracking-[0.3em] px-3 py-1 backdrop-blur-sm">External</Badge>
                <h2 className="text-3xl font-black tracking-tighter leading-none text-slate-100">FNH Notion Manual</h2>
                <p className="text-sm font-medium text-slate-400 leading-relaxed">Access the full external Notion database.</p>
              </div>
              <div className="flex items-center justify-between mt-8">
                <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-300">Notion</span>
                <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                  <ExternalLink size={20} className="text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </a>
      </div>

      {/* Category Sections */}
      {categories.map((category) => (
        <div key={category.id} className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-sm", category.bgColor, category.color)}>
              <category.icon size={20} />
            </div>
            <h2 className="text-2xl font-black text-foreground tracking-tight">{category.label}</h2>
            <div className="flex-1 h-[2px] bg-border rounded-full ml-4" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {category.items.map((item) => {
              const isExternal = item.isExternal;
              const cardContent = (
                <Card className="border-none shadow-md rounded-[2.5rem] bg-card hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer overflow-hidden h-full">
                  <CardContent className="p-8 space-y-4">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-sm",
                      category.bgColor, category.color
                    )}>
                      <item.icon size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{item.label}</h3>
                      <p className="text-xs text-muted-foreground font-medium mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                    <div className="pt-2 flex items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {isExternal ? 'Open External' : 'Open Tool'} 
                      {isExternal ? <ExternalLink size={12} className="ml-1" /> : <ChevronRight size={12} className="ml-1 group-hover:translate-x-1 transition-transform" />}
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
    </div>
  );
};

export default ResourceHub;