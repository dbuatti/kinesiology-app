"use client";

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Fingerprint, 
  Target, 
  ShieldAlert, 
  ArrowRight, 
  Plus, 
  Clock, 
  CheckCircle2, 
  Trash2,
  Sparkles,
  Brain,
  Zap,
  History,
  Loader2,
  Lightbulb,
  ChevronRight,
  Layers
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/components/crm/AppLayout";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { format } from "date-fns";

const TOOLS = [
  {
    id: "shifting",
    label: "Identity Shifting",
    desc: "Dissolve problematic constructs and return to the neutral observer.",
    icon: Fingerprint,
    path: "/sandbox/identity-shifting",
    color: "text-indigo-600",
    bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
    category: "Dissolving"
  },
  {
    id: "alignment",
    label: "Identity Alignment",
    desc: "Reconsolidate neural pathways to align with your target identity.",
    icon: Target,
    path: "/sandbox/identity-alignment",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
    category: "Integration"
  },
  {
    id: "beliefs",
    label: "Limiting Beliefs",
    desc: "Extract and dissolve the core beliefs holding patterns in place.",
    icon: ShieldAlert,
    path: "/sandbox/limiting-beliefs",
    color: "text-rose-600",
    bgColor: "bg-rose-50 dark:bg-rose-900/20",
    category: "Extraction"
  }
];

const SandboxPage = () => {
  const [backlog, setBacklog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBacklog = async () => {
    try {
      const { data, error } = await supabase
        .from('identity_backlog')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBacklog(data || []);
    } catch (err) {
      console.error("Error fetching backlog:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBacklog();
  }, []);

  const getRecommendation = (item: any) => {
    const content = item.content.toLowerCase();
    
    if (item.type === 'goal' || content.includes('want to') || content.includes('become') || content.includes('future')) {
      return {
        tool: 'Identity Alignment',
        path: '/sandbox/identity-alignment',
        icon: Target,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50 dark:bg-emerald-900/20'
      };
    }

    if (item.type === 'belief' || content.startsWith('i am')) {
      return {
        tool: 'Limiting Beliefs',
        path: '/sandbox/limiting-beliefs',
        icon: ShieldAlert,
        color: 'text-rose-600',
        bg: 'bg-rose-50 dark:bg-rose-900/20'
      };
    }

    return {
      tool: 'Identity Shifting',
      path: '/sandbox/identity-shifting',
      icon: Fingerprint,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50 dark:bg-indigo-900/20'
    };
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('identity_backlog')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setBacklog(prev => prev.filter(item => item.id !== id));
      showSuccess("Item removed from backlog.");
    } catch (err) {
      showError("Failed to remove item.");
    }
  };

  return (
    <AppLayout variant="wide">
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Breadcrumbs items={[{ label: "Sandbox Hub" }]} />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-indigo-200 dark:shadow-indigo-900/20">
              <Sparkles size={32} />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight text-foreground">Identity Sandbox</h1>
              <p className="text-muted-foreground font-medium mt-1 text-lg">A laboratory for self-inquiry and neural reconsolidation.</p>
            </div>
          </div>
        </div>

        {/* Tool Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TOOLS.map((tool) => (
            <Link key={tool.id} to={tool.path} className="block group">
              <Card className="border-none shadow-md rounded-[2.5rem] bg-card hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full overflow-hidden">
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
                      Launch Tool
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <ArrowRight size={18} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Backlog Section - Redesigned as Thin Rows */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-lg">
                <History size={20} />
              </div>
              <h2 className="text-2xl font-black text-foreground tracking-tight">Identity Backlog</h2>
            </div>
            <Badge variant="outline" className="font-bold border-border">
              {backlog.length} Pending Items
            </Badge>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
          ) : backlog.length > 0 ? (
            <div className="space-y-2">
              {backlog.map((item) => {
                const rec = getRecommendation(item);
                return (
                  <div 
                    key={item.id} 
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-card rounded-2xl border border-border group hover:shadow-md hover:border-indigo-200 transition-all gap-4"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                        item.type === 'belief' ? "bg-rose-50 text-rose-600" : 
                        item.type === 'goal' ? "bg-emerald-50 text-emerald-600" : "bg-indigo-50 text-indigo-600"
                      )}>
                        {item.type === 'belief' ? <ShieldAlert size={20} /> : 
                         item.type === 'goal' ? <Target size={20} /> : <Fingerprint size={20} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-base text-foreground truncate">"{item.content}"</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <Badge variant="outline" className="text-[7px] font-black uppercase border-none bg-muted px-1.5 py-0">
                            {item.type || 'identity'}
                          </Badge>
                          <span className="text-[8px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                            <Clock size={10} /> {format(new Date(item.created_at), "MMM d, yyyy")}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className={cn(
                        "hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-transparent",
                        rec.bg
                      )}>
                        <rec.icon size={12} className={rec.color} />
                        <span className={cn("text-[9px] font-black uppercase tracking-widest", rec.color)}>
                          {rec.tool}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 rounded-xl text-muted-foreground hover:text-rose-600 hover:bg-rose-50"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                        <Button 
                          className="h-9 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100"
                          asChild
                        >
                          <Link to={rec.path} state={{ prefill: item.content, backlogId: item.id }}>
                            Process <ChevronRight size={14} className="ml-1" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 bg-muted/30 rounded-[3rem] border-2 border-dashed border-border">
              <div className="w-16 h-16 bg-card rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Zap className="text-muted-foreground" size={32} />
              </div>
              <p className="text-foreground font-black text-xl">Your backlog is clear</p>
              <p className="text-muted-foreground mt-1 font-medium">Add identities or beliefs from the dashboard to track them for later.</p>
            </div>
          )}
        </div>

        {/* Philosophy Card */}
        <Card className="border-none shadow-lg rounded-[3rem] bg-slate-900 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-12 opacity-10"><Brain size={150} /></div>
          <CardContent className="p-10 md:p-14 flex flex-col md:flex-row items-center gap-10 relative z-10">
            <div className="w-24 h-24 rounded-[2rem] bg-indigo-600 flex items-center justify-center shrink-0 shadow-2xl shadow-indigo-500/40">
              <Zap size={48} className="text-white" />
            </div>
            <div className="space-y-4">
              <h4 className="text-2xl font-black">The Identity Lab</h4>
              <p className="text-slate-400 font-medium text-lg leading-relaxed">
                "The self is not a fixed entity, but a collection of constructs. In the Sandbox, we treat these constructs as hypotheses to be tested, dissolved, and aligned with our highest intentions."
              </p>
              <div className="flex gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  <span className="text-xs font-bold text-slate-300">Somatic-first protocols</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  <span className="text-xs font-bold text-slate-300">Neural reconsolidation</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default SandboxPage;