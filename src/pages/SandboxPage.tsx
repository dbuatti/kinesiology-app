
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
  RefreshCw,
  Archive,
  CheckCircle,
  MoreHorizontal,
  Activity,
  Check,
  X,
  ArrowRightLeft
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppLayout from "@/components/crm/AppLayout";

import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import IdentityHistoryList from "@/components/crm/IdentityHistoryList";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";
import PageHeader from "@/components/shared/PageHeader";

const TOOLS = [
  {
    id: "shifting",
    label: "Identity Shifting",
    desc: "Dissolve problematic constructs and return to the neutral observer.",
    icon: Fingerprint,
    path: "/sandbox/identity-shifting",
     color: "text-chart-primary",
      bgColor: "bg-muted",
      category: "Dissolving"
    },
    {
      id: "alignment",
      label: "Identity Alignment",
      desc: "Reconsolidate neural pathways to align with your target identity.",
      icon: Target,
      path: "/sandbox/identity-alignment",
      color: "text-chart-emerald",
      bgColor: "bg-muted",
      category: "Integration"
    },
    {
      id: "beliefs",
      label: "Limiting Beliefs",
      desc: "Extract and dissolve the core beliefs holding patterns in place.",
      icon: ShieldAlert,
      path: "/sandbox/limiting-beliefs",
      color: "text-chart-destructive",
      bgColor: "bg-muted",
      category: "Extraction"
    },
    {
      id: "fractals",
      label: "Fractal Analysis",
      desc: "Map the hierarchical structure of your internal constructs.",
      icon: Layers,
      path: "/sandbox/fractals",
      color: "text-chart-primary",
      bgColor: "bg-muted",
    category: "Analysis"
  }
];

type SortOption = 'priority' | 'newest' | 'oldest' | 'type' | 'progress';

interface SandboxPageProps {
  isNested?: boolean;
}

const SandboxPage = ({ isNested = false }: SandboxPageProps) => {
  const { isPrivate } = usePrivacyMode();
  const [backlog, setBacklog] = useState<any[]>([]);
  const [sessionCounts, setSessionCounts] = useState<Record<string, number>>({});
  const [drafts, setDrafts] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [isPrioritizing, setIsPrioritizing] = useState(false);
  const [isAcceptingAll, setIsAcceptingAll] = useState(false);
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('priority');
  const [activeTab, setActiveTab] = useState("active");

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: backlogData, error: backlogError } = await supabase
        .from('identity_backlog')
        .select('*');

      if (backlogError) throw backlogError;

      const [shiftingRes, alignmentRes, beliefsRes] = await Promise.all([
        supabase.from('identity_shifting_sessions').select('backlog_id, is_complete'),
        supabase.from('identity_alignment_sessions').select('backlog_id, is_complete'),
        supabase.from('limiting_belief_sessions').select('backlog_id, is_complete')
      ]);

      const allSessions = [
        ...(shiftingRes.data || []),
        ...(alignmentRes.data || []),
        ...(beliefsRes.data || [])
      ];

      const counts: Record<string, number> = {};
      const draftMap: Record<string, boolean> = {};

      allSessions.forEach(s => {
        if (s.backlog_id) {
          counts[s.backlog_id] = (counts[s.backlog_id] || 0) + 1;
          if (!s.is_complete) draftMap[s.backlog_id] = true;
        }
      });

      setBacklog(backlogData || []);
      setSessionCounts(counts);
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
    const filtered = backlog.filter(item => {
      if (activeTab === 'active') return item.status === 'pending';
      if (activeTab === 'suggested') return item.status === 'suggested';
      if (activeTab === 'archive') return item.status === 'integrated';
      return false;
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'priority') return (b.priority_score || 0) - (a.priority_score || 0);
      if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === 'type') return a.type.localeCompare(b.type);
      if (sortBy === 'progress') return (sessionCounts[b.id] || 0) - (sessionCounts[a.id] || 0);
      return 0;
    });
  }, [backlog, sortBy, activeTab, sessionCounts]);

  const handlePrioritize = async () => {
    setIsPrioritizing(true);
    try {
      const { data, error } = await supabase.functions.invoke('prioritize-backlog');
      if (error) throw error;
      showSuccess("AI has re-analyzed and prioritized your active map.");
      fetchData();
      setSortBy('priority');
    } catch (err: any) {
      showError(err.message || "Failed to prioritize.");
    } finally {
      setIsPrioritizing(false);
    }
  };

  const handleAcceptAllSuggestions = async () => {
    const suggestedIds = backlog
      .filter(item => item.status === 'suggested')
      .map(item => item.id);

    if (suggestedIds.length === 0) return;

    setIsAcceptingAll(true);
    try {
      const { error } = await supabase
        .from('identity_backlog')
        .update({ status: 'pending' })
        .in('id', suggestedIds);

      if (error) throw error;
      showSuccess(`Added ${suggestedIds.length} identities to your active map.`);
      fetchData();
    } catch (err) {
      showError("Failed to accept all suggestions.");
    } finally {
      setIsAcceptingAll(false);
    }
  };

  const handleRescanItem = async (item: any) => {
    setScanningId(item.id);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-single-identity', {
        body: { content: item.content }
      });

      if (error) throw error;

      const { error: updateError } = await supabase
        .from('identity_backlog')
        .update({
          type: data.type,
          priority_reasoning: data.reasoning,
          polarity_insight: data.polarity_insight
        })
        .eq('id', item.id);

      if (updateError) throw updateError;

      showSuccess(`"${item.content}" re-analyzed and updated.`);
      fetchData();
    } catch (err: any) {
      showError(err.message || "Rescan failed.");
    } finally {
      setScanningId(null);
    }
  };

  const handleAcceptSuggestion = async (id: string) => {
    try {
      const { error } = await supabase
        .from('identity_backlog')
        .update({ status: 'pending' })
        .eq('id', id);

      if (error) throw error;
      showSuccess("Identity added to active map.");
      fetchData();
    } catch (err) {
      showError("Failed to accept suggestion.");
    }
  };

  const handleMarkIntegrated = async (id: string) => {
    if (!confirm("Are you sure you have truly processed this for good? It will move to your Archive.")) return;

    try {
      const { error } = await supabase
        .from('identity_backlog')
        .update({ status: 'integrated' })
        .eq('id', id);

      if (error) throw error;
      showSuccess("Identity integrated and archived.");
      fetchData();
    } catch (err) {
      showError("Failed to update status.");
    }
  };

  const handleReactivate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('identity_backlog')
        .update({ status: 'pending' })
        .eq('id', id);

      if (error) throw error;
      showSuccess("Identity reactivated.");
      fetchData();
    } catch (err) {
      showError("Failed to reactivate.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this identity from your map?")) return;
    try {
      const { error } = await supabase.from('identity_backlog').delete().eq('id', id);
      if (error) throw error;
      setBacklog(prev => prev.filter(item => item.id !== id));
      showSuccess("Removed from map.");
    } catch (err) {
      showError("Failed to remove.");
    }
  };

  const getRecommendation = (item: any) => {
    if (item.type === 'alignment') {
      return { tool: 'Identity Alignment', path: '/sandbox/identity-alignment', icon: Target, color: 'text-chart-emerald', bg: 'bg-muted' };
    }
    if (item.type === 'belief') {
      return { tool: 'Limiting Beliefs', path: '/sandbox/limiting-beliefs', icon: ShieldAlert, color: 'text-chart-destructive', bg: 'bg-muted' };
    }
    return { tool: 'Identity Shifting', path: '/sandbox/identity-shifting', icon: Fingerprint, color: 'text-chart-primary', bg: 'bg-muted' };
  };

  const IdentityCard = ({ item }: { item: any }) => {
    const rec = getRecommendation(item);
    const count = sessionCounts[item.id] || 0;
    const isWIP = drafts[item.id];
    const isIntegrated = item.status === 'integrated';
    const isSuggested = item.status === 'suggested';
    
    const progressValue = isIntegrated ? 100 : Math.min(count * 25, 100);
    const progressLabel = isIntegrated ? "Integrated" : count === 0 ? "New" : count === 1 ? "Initiated" : count < 4 ? "Processing" : "Deep Work";
    const isScanning = scanningId === item.id;

    return (
      <div className={cn(
        "flex flex-col md:flex-row md:items-center justify-between p-6 bg-card rounded-xl border transition-all gap-6 group",
        item.priority_score > 80 ? "border-indigo-200 shadow-md" : "border-border",
        isWIP && "border-border bg-muted/5",
        isSuggested && "border-dashed border-border bg-muted/10",
        isScanning && "opacity-70 grayscale"
      )}>
        <div className="flex items-center gap-6 flex-1 min-w-0">
          <div className="relative shrink-0">
            <div className={cn(
              "w-14 h-14 rounded-xl flex items-center justify-center shadow-inner transition-transform group-hover:scale-110",
              isIntegrated ? "bg-primary text-primary-foreground" :
              isSuggested ? "bg-chart-primary/10 text-chart-primary" :
              rec.tool === 'Limiting Beliefs' ? "bg-muted text-chart-destructive" :
              rec.tool === 'Identity Alignment' ? "bg-muted text-chart-emerald" : "bg-muted text-chart-primary"
            )}>
              {isScanning ? <Loader2 size={28} className="animate-spin" /> :
               isIntegrated ? <CheckCircle size={28} /> :
               isSuggested ? <Sparkles size={28} /> :
               rec.tool === 'Limiting Beliefs' ? <ShieldAlert size={28} /> :
               rec.tool === 'Identity Alignment' ? <Target size={28} /> : <Fingerprint size={28} />}
            </div>
            {!isIntegrated && !isSuggested && item.priority_score > 0 && (
              <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-semibold border-2 border-background shadow-sm">
                {item.priority_score}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <p className={cn("font-semibold text-xl text-foreground truncate", isIntegrated && "text-muted-foreground")}>"{item.content}"</p>
              {isWIP && <Badge className="bg-muted text-muted-foreground border-none font-semibold text-[10px] uppercase tracking-wider px-3 py-1 rounded-full animate-pulse">Work in Progress</Badge>}
              {isSuggested && <Badge className="bg-primary text-primary-foreground border-none font-semibold text-[10px] uppercase tracking-wider px-3 py-1 rounded-full">AI Insight</Badge>}
            </div>
            
            {isSuggested ? (
              <p className="text-sm text-muted-foreground font-medium italic leading-relaxed">
                {item.priority_reasoning || "AI suggested this based on your recent session patterns."}
              </p>
            ) : (
              <div className="flex items-center gap-6">
                <div className="flex-1 max-w-[150px] space-y-1.5">
                  <div className="flex justify-between text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <span>{progressLabel}</span>
                    <span>{count} Sessions</span>
                  </div>
                  <Progress value={progressValue} className={cn("h-1.5 bg-muted", isIntegrated ? "[&>div]:bg-chart-emerald" : "[&>div]:bg-chart-primary")} />
                </div>
                <div className="h-6 w-px bg-border" />
                <span className="text-[10px] font-medium text-muted-foreground uppercase flex items-center gap-1.5">
                  <Calendar size={12} /> {format(new Date(item.created_at), "MMM d, yyyy")}
                </span>
              </div>
            )}
            
            {!isIntegrated && (item.priority_reasoning || item.polarity_insight) && (
              <div className="space-y-3 pt-2">
                {item.priority_reasoning && (
                  <p className="text-xs text-muted-foreground font-medium italic leading-relaxed">
                    {item.priority_reasoning}
                  </p>
                )}
                {item.polarity_insight && (
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-xl border border-border/50">
                    <ArrowRightLeft size={14} className="text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-xs font-medium text-muted-foreground leading-tight">
                      <span className="uppercase text-[10px] font-semibold opacity-60 mr-2">Polarity:</span>
                      {item.polarity_insight}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          {isSuggested ? (
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleDelete(item.id)}
                className="h-11 px-5 rounded-xl text-muted-foreground/60 hover:text-chart-destructive hover:bg-muted font-medium text-[10px] uppercase tracking-wider"
              >
                <X size={18} className="mr-2" /> Dismiss
              </Button>
              <Button 
                onClick={() => handleAcceptSuggestion(item.id)}
                className="h-11 px-8 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-[10px] uppercase tracking-wider shadow-sm"
              >
                <Check size={18} className="mr-2" /> Accept & Add
              </Button>
            </div>
          ) : (
            <>
              {!isIntegrated && (
                <div className={cn("hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl border border-transparent", rec.bg)}>
                  <rec.icon size={14} className={rec.color} />
                  <span className={cn("text-[10px] font-semibold uppercase tracking-wider", rec.color)}>{rec.tool}</span>
                </div>
              )}
              
              <div className="flex items-center gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl text-muted-foreground hover:bg-muted">
                      <MoreHorizontal size={22} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-xl p-2 shadow-3xl border-none bg-card">
                    {isIntegrated ? (
                      <DropdownMenuItem onClick={() => handleReactivate(item.id)} className="rounded-xl py-3 px-5 cursor-pointer flex items-center gap-4">
                        <RefreshCw size={18} className="text-chart-primary" /> Reactivate
                      </DropdownMenuItem>
                    ) : (
                      <>
                        <DropdownMenuItem onClick={() => handleRescanItem(item)} disabled={isScanning} className="rounded-xl py-3 px-5 cursor-pointer flex items-center gap-4">
                          <Wand2 size={18} className="text-chart-primary" /> Rescan with AI
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleMarkIntegrated(item.id)} className="rounded-xl py-3 px-5 cursor-pointer flex items-center gap-4 text-chart-emerald font-medium">
                          <CheckCircle2 size={18} /> Mark Integrated
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuItem onClick={() => handleDelete(item.id)} className="text-destructive focus:text-destructive rounded-xl py-3 px-5 cursor-pointer flex items-center gap-4">
                      <Trash2 size={18} /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {!isIntegrated && (
                  <Button
                    className={cn(
                      "h-11 px-8 rounded-xl font-medium text-[10px] uppercase tracking-wider shadow-sm transition-all",
                      isWIP ? "bg-muted text-muted-foreground" : "bg-primary hover:bg-primary/90 text-primary-foreground"
                    )}
                    asChild
                  >
                    <Link to={rec.path} state={{ prefill: item.content, backlogId: item.id, reflectionId: item.reflection_id }}>
                      {isWIP ? <><RefreshCw size={16} className="mr-2 animate-spin-slow" /> Continue</> : <>Process <ChevronRight size={16} className="ml-1" /></>}
                    </Link>
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  const content = (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {!isNested && (
        <>


          <PageHeader 
            title="Identity Map"
            subtitle="Track the evolution and integration of your internal constructs."
            icon={Sparkles}
            actions={
              <Button onClick={handlePrioritize} disabled={isPrioritizing || backlog.length === 0} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-14 px-10 font-semibold text-xs uppercase tracking-wider shadow-sm">
                {isPrioritizing ? <Loader2 className="mr-2 animate-spin" /> : <Wand2 size={20} className="mr-2" />}
                AI Prioritize
              </Button>
            }
          />
        </>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {TOOLS.map((tool) => (
          <Link key={tool.id} to={tool.path} className="block group">
            <Card className="border-none shadow-md rounded-xl bg-card hover:shadow-sm hover:-translate-y-1 transition-all duration-300 h-full overflow-hidden">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-sm", tool.bgColor, tool.color)}>
                    <tool.icon size={28} />
                  </div>
                  <Badge variant="secondary" className="bg-muted text-muted-foreground border-none font-semibold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full">{tool.category}</Badge>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-foreground group-hover:text-chart-primary transition-colors">{tool.label}</h3>
                  <p className="text-sm text-muted-foreground font-medium leading-relaxed">{tool.desc}</p>
                </div>
                <div className="pt-4 flex items-center justify-between border-t border-border">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-chart-primary transition-colors">Launch Tool</span>
                  <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all"><ArrowRight size={18} /></div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="space-y-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 px-2">
            <TabsList className="bg-muted/50 p-1.5 rounded-xl h-14 border border-border">
              <TabsTrigger value="active" className="rounded-xl px-8 h-11 data-[state=active]:bg-card data-[state=active]:text-chart-primary data-[state=active]:shadow-sm transition-all font-medium text-xs uppercase tracking-wider"><Zap className="mr-2" size={16} /> Active Map</TabsTrigger>
              <TabsTrigger value="suggested" className="rounded-xl px-8 h-11 data-[state=active]:bg-card data-[state=active]:text-chart-primary data-[state=active]:shadow-sm transition-all font-medium text-xs uppercase tracking-wider">
                <Sparkles className="mr-2" size={16} /> Suggested
                {backlog.filter(i => i.status === 'suggested').length > 0 && (
                  <span className="ml-2 w-2 h-2 rounded-full bg-chart-destructive animate-pulse" />
                )}
              </TabsTrigger>
              <TabsTrigger value="archive" className="rounded-xl px-8 h-11 data-[state=active]:bg-card data-[state=active]:text-chart-primary data-[state=active]:shadow-sm transition-all font-medium text-xs uppercase tracking-wider"><Archive className="mr-2" size={16} /> Integrated</TabsTrigger>
              <TabsTrigger value="history" className="rounded-xl px-8 h-11 data-[state=active]:bg-card data-[state=active]:text-chart-primary data-[state=active]:shadow-sm transition-all font-medium text-xs uppercase tracking-wider"><History className="mr-2" size={16} /> Session History</TabsTrigger>
            </TabsList>

            {activeTab === 'suggested' && sortedBacklog.length > 0 && (
              <Button 
                onClick={handleAcceptAllSuggestions}
                disabled={isAcceptingAll}
                className="h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-[10px] uppercase tracking-wider shadow-sm"
              >
                {isAcceptingAll ? <Loader2 className="mr-2 animate-spin" /> : <CheckCircle2 size={18} className="mr-2" />}
                Accept All Suggestions
              </Button>
            )}

            {activeTab !== 'history' && activeTab !== 'suggested' && (
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handlePrioritize}
                  disabled={isPrioritizing || sortedBacklog.length === 0}
                  className="h-11 px-5 rounded-xl text-chart-primary hover:bg-muted font-medium text-[10px] uppercase tracking-wider"
                >
                  {isPrioritizing ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Wand2 size={16} className="mr-2" />}
                  Reanalyze Map
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-xl h-11 px-5 border-border font-medium text-[10px] uppercase tracking-wider">
                      <ArrowDownWideNarrow size={16} className="mr-2" /> Sort: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-xl p-2 shadow-3xl border-none bg-card">
                    <DropdownMenuItem onClick={() => setSortBy('priority')} className="rounded-xl py-3 px-5 cursor-pointer flex items-center gap-4"><TrendingUp size={18} className="text-chart-primary" /> AI Priority</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('progress')} className="rounded-xl py-3 px-5 cursor-pointer flex items-center gap-4"><Activity size={18} className="text-chart-emerald" /> Most Worked</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('newest')} className="rounded-xl py-3 px-5 cursor-pointer flex items-center gap-4"><Calendar size={18} className="text-chart-primary" /> Newest First</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('type')} className="rounded-xl py-3 px-5 cursor-pointer flex items-center gap-4"><Layers size={18} className="text-muted-foreground" /> By Tool Type</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          <TabsContent value="active" className="mt-0 focus-visible:ring-0">
            {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-chart-primary" size={48} /></div> : sortedBacklog.length > 0 ? (
              <div className="space-y-4">
                {sortedBacklog.map((item) => <IdentityCard key={item.id} item={item} />)}
              </div>
            ) : (
              <div className="text-center py-32 bg-muted/30 rounded-xl border-2 border-dashed border-border">
                <div className="w-20 h-20 bg-card rounded-xl flex items-center justify-center mx-auto mb-6 shadow-sm"><Zap className="text-muted-foreground" size={40} /></div>
                <p className="text-foreground font-semibold text-2xl">Your map is clear</p>
                <p className="text-muted-foreground mt-2 font-medium">Add identities or beliefs from the dashboard to track them here.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="suggested" className="mt-0 focus-visible:ring-0">
            {sortedBacklog.length > 0 ? (
              <div className="space-y-4">
                <Alert className="bg-muted border-border rounded-xl mb-8 p-6">
                  <Info className="h-5 w-5 text-chart-primary" />
                  <AlertDescription className="text-base text-foreground font-medium">
                    These insights were extracted by AI from your recent sessions. Review them and add the ones that resonate to your active map.
                  </AlertDescription>
                </Alert>
                {sortedBacklog.map((item) => <IdentityCard key={item.id} item={item} />)}
              </div>
            ) : (
              <div className="text-center py-32 bg-muted/30 rounded-xl border-2 border-dashed border-border">
                <div className="w-20 h-20 bg-card rounded-xl flex items-center justify-center mx-auto mb-6 shadow-sm"><Sparkles className="text-muted-foreground" size={40} /></div>
                <p className="text-foreground font-semibold text-2xl">No suggestions yet</p>
                <p className="text-muted-foreground mt-2 font-medium">Complete a session and run a "Deep Scan" to see AI insights here.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="archive" className="mt-0 focus-visible:ring-0">
            {sortedBacklog.length > 0 ? (
              <div className="space-y-4">
                {sortedBacklog.map((item) => <IdentityCard key={item.id} item={item} />)}
              </div>
            ) : (
              <div className="text-center py-32 bg-muted/30 rounded-xl border-2 border-dashed border-border">
                <div className="w-20 h-20 bg-card rounded-xl flex items-center justify-center mx-auto mb-6 shadow-sm"><Archive className="text-muted-foreground" size={40} /></div>
                <p className="text-foreground font-semibold text-2xl">No integrated identities yet</p>
                <p className="text-muted-foreground mt-2 font-medium">Mark an active identity as "Integrated" to move it here.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-0 focus-visible:ring-0">
            <IdentityHistoryList />
          </TabsContent>
        </Tabs>
      </div>

      <Card className="border border-border shadow-sm rounded-xl bg-card text-foreground overflow-hidden relative">
        <div className="absolute top-0 right-0 p-12 opacity-10"><Brain size={200} /></div>
        <CardContent className="p-12 md:p-16 flex flex-col md:flex-row items-center gap-12 relative z-10">
          <div className="w-28 h-28 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-sm"><Zap size={56} className="text-primary-foreground" /></div>
          <div className="space-y-4">
            <h4 className="text-3xl font-semibold tracking-tight">The Identity Lab</h4>
            <p className="text-muted-foreground font-medium text-xl leading-relaxed max-w-3xl">"The self is not a fixed entity, but a collection of constructs. In the Sandbox, we treat these constructs as hypotheses to be tested, dissolved, and aligned with our highest intentions."</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return isNested ? content : <AppLayout>{content}</AppLayout>;
};

export default SandboxPage;