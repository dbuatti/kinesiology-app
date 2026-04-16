"use client";

import React, { useState, useEffect, useMemo } from 'react';
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
  Layers, 
  Wand2, 
  TrendingUp, 
  Info, 
  ArrowDownWideNarrow, 
  Calendar, 
  LayoutGrid, 
  PlayCircle,
  RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppLayout from "@/components/crm/AppLayout";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { format } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import IdentityHistoryList from "@/components/crm/IdentityHistoryList";

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

type SortOption = 'priority' | 'newest' | 'oldest' | 'type';

const SandboxPage = () => {
  const [backlog, setBacklog] = useState<any[]>([]);
  const [drafts, setDrafts] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [isPrioritizing, setIsPrioritizing] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('priority');
  const [activeTab, setActiveTab] = useState("backlog");

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [backlogRes, shiftingRes, alignmentRes, beliefsRes] = await Promise.all([
        supabase.from('identity_backlog').select('*').eq('status', 'pending'),
        supabase.from('identity_shifting_sessions').select('backlog_id').eq('is_complete', false).not('backlog_id', 'is', null),
        supabase.from('identity_alignment_sessions').select('backlog_id').eq('is_complete', false).not('backlog_id', 'is', null),
        supabase.from('limiting_belief_sessions').select('backlog_id').eq('is_complete', false).not('backlog_id', 'is', null)
      ]);

      if (backlogRes.error) throw backlogRes.error;
      setBacklog(backlogRes.data || []);

      // Map backlog IDs that have active drafts
      const draftMap: Record<string, boolean> = {};
      [...(shiftingRes.data || []), ...(alignmentRes.data || []), ...(beliefsRes.data || [])].forEach(s => {
        if (s.backlog_id) draftMap[s.backlog_id] = true;
      });
      setDrafts(draftMap);

    } catch (err) {
      console.error("Error fetching sandbox data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const sortedBacklog = useMemo(() => {
    return [...backlog].sort((a, b) => {
      if (sortBy === 'priority') {
        return (b.priority_score || 0) - (a.priority_score || 0);
      }
      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortBy === 'type') {
        return a.type.localeCompare(b.type);
      }
      return 0;
    });
  }, [backlog, sortBy]);

  const handlePrioritize = async () => {
    setIsPrioritizing(true);
    try {
      const { data, error } = await supabase.functions.invoke('prioritize-backlog');
      if (error) throw error;
      showSuccess("AI has re-prioritized your backlog based on your journal history.");
      fetchData();
      setSortBy('priority');
    } catch (err: any) {
      showError(err.message || "Failed to prioritize backlog.");
    } finally {
      setIsPrioritizing(false);
    }
  };

  const handleClearAll = async () => {
    if (backlog.length === 0) return;
    if (!confirm(`Are you sure you want to delete all ${backlog.length} items from your backlog? This cannot be undone.`)) return;

    setIsClearing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('identity_backlog')
        .delete()
        .eq('user_id', user.id)
        .eq('status', 'pending');

      if (error) throw error;
      
      showSuccess("Backlog cleared.");
      setBacklog([]);
    } catch (err: any) {
      showError(err.message || "Failed to clear backlog.");
    } finally {
      setIsClearing(false);
    }
  };

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
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost"
              onClick={handleClearAll}
              disabled={isClearing || backlog.length === 0}
              className="h-14 px-6 rounded-2xl font-black text-xs uppercase tracking-widest text-rose-600 hover:bg-rose-50"
            >
              {isClearing ? <Loader2 className="animate-spin" /> : <Trash2 size={18} className="mr-2" />}
              Clear Backlog
            </Button>
            <Button 
              onClick={handlePrioritize}
              disabled={isPrioritizing || backlog.length === 0}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-14 px-8 font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100"
            >
              {isPrioritizing ? <Loader2 className="mr-2 animate-spin" /> : <Wand2 size={18} className="mr-2" />}
              Prioritize with AI
            </Button>
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

        {/* Backlog & History Section */}
        <div className="space-y-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 px-2">
              <TabsList className="bg-slate-200/50 p-1 rounded-2xl h-12 border border-slate-200">
                <TabsTrigger 
                  value="backlog" 
                  className="rounded-xl px-8 h-10 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all font-bold text-xs uppercase tracking-widest"
                >
                  <Zap className="mr-2" size={16} />
                  Backlog
                </TabsTrigger>
                <TabsTrigger 
                  value="history" 
                  className="rounded-xl px-8 h-10 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all font-bold text-xs uppercase tracking-widest"
                >
                  <History className="mr-2" size={16} />
                  History
                </TabsTrigger>
              </TabsList>

              {activeTab === 'backlog' && (
                <div className="flex items-center gap-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="rounded-xl h-10 px-4 border-border font-bold text-[10px] uppercase tracking-widest">
                        <ArrowDownWideNarrow size={14} className="mr-2" />
                        Sort: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-2xl p-2 shadow-2xl border-none bg-card">
                      <DropdownMenuItem onClick={() => setSortBy('priority')} className="rounded-xl py-2.5 px-4 cursor-pointer flex items-center gap-3">
                        <TrendingUp size={14} className="text-indigo-500" /> AI Priority
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy('newest')} className="rounded-xl py-2.5 px-4 cursor-pointer flex items-center gap-3">
                        <Calendar size={14} className="text-emerald-500" /> Newest First
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy('oldest')} className="rounded-xl py-2.5 px-4 cursor-pointer flex items-center gap-3">
                        <Clock size={14} className="text-slate-500" /> Oldest First
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy('type')} className="rounded-xl py-2.5 px-4 cursor-pointer flex items-center gap-3">
                        <Layers size={14} className="text-purple-500" /> By Tool Type
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  <Badge variant="outline" className="font-bold border-border h-10 px-4 rounded-xl">
                    {backlog.length} Pending Items
                  </Badge>
                </div>
              )}
            </div>

            <TabsContent value="backlog" className="mt-0 focus-visible:ring-0">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="animate-spin text-indigo-600" size={32} />
                </div>
              ) : sortedBacklog.length > 0 ? (
                <div className="space-y-2">
                  {sortedBacklog.map((item) => {
                    const rec = getRecommendation(item);
                    const hasPriority = item.priority_score > 0;
                    const isWIP = drafts[item.id];

                    return (
                      <div 
                        key={item.id} 
                        className={cn(
                          "flex flex-col md:flex-row md:items-center justify-between p-4 bg-card rounded-2xl border transition-all gap-4 group",
                          hasPriority ? "border-indigo-200 shadow-sm" : "border-border",
                          isWIP && "border-amber-200 bg-amber-50/10"
                        )}
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="relative">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                              item.type === 'belief' ? "bg-rose-50 text-rose-600" : 
                              item.type === 'goal' ? "bg-emerald-50 text-emerald-600" : "bg-indigo-50 text-indigo-600"
                            )}>
                              {item.type === 'belief' ? <ShieldAlert size={20} /> : 
                               item.type === 'goal' ? <Target size={20} /> : <Fingerprint size={20} />}
                            </div>
                            {hasPriority && (
                              <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[8px] font-black border-2 border-background shadow-lg">
                                {item.priority_score}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-3">
                              <p className="font-bold text-base text-foreground truncate">"{item.content}"</p>
                              {item.priority_reasoning && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button className="text-indigo-400 hover:text-indigo-600 transition-colors">
                                        <Lightbulb size={14} />
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs p-4 rounded-xl bg-slate-900 text-white border-none shadow-2xl">
                                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">AI Reasoning</p>
                                      <p className="text-xs font-medium leading-relaxed">{item.priority_reasoning}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                              {isWIP && (
                                <Badge className="bg-amber-500 text-white border-none font-black text-[7px] uppercase tracking-widest px-1.5 py-0 rounded-full animate-pulse">
                                  WIP
                                </Badge>
                              )}
                            </div>
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
                              className={cn(
                                "h-9 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 transition-all",
                                isWIP 
                                  ? "bg-amber-500 hover:bg-amber-600 text-white" 
                                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
                              )}
                              asChild
                            >
                              <Link to={rec.path} state={{ prefill: item.content, backlogId: item.id, reflectionId: item.reflection_id }}>
                                {isWIP ? (
                                  <><RefreshCw size={14} className="mr-2 animate-spin-slow" /> Continue</>
                                ) : (
                                  <>Process <ChevronRight size={14} className="ml-1" /></>
                                )}
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
            </TabsContent>

            <TabsContent value="history" className="mt-0 focus-visible:ring-0">
              <IdentityHistoryList />
            </TabsContent>
          </Tabs>
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