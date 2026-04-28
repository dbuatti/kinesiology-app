import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Target, 
  TrendingUp, 
  Loader2, 
  Activity, 
  Zap, 
  Trophy, 
  Sparkles, 
  Search,
  GraduationCap, 
  ShieldCheck,
  AlertCircle, 
  RefreshCw,
  Lightbulb,
  ArrowRight,
  FilterX,
  CheckCircle2,
  Brain,
  Heart,
  FileText,
  Info
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { fetchMasteryStats, MasteryStat, MasteryCategory } from "@/utils/mastery-stats";
import { setWeeklyFocus } from "@/utils/weekly-focus";
import MasteryItemCard from "@/components/crm/MasteryItemCard";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import AppLayout from "@/components/crm/AppLayout";
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/utils/toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Assessment Components for the second tab
import { CranialNerveAssessment } from "@/components/crm/CranialNerveAssessment";
import { PrimitiveReflexAssessment } from "@/components/crm/PrimitiveReflexAssessment";
import EmotionsProtocolReference from "@/components/crm/EmotionsProtocolReference";
import MechanoreceptiveAssessment from "@/components/crm/MechanoreceptiveAssessment";

const SANDBOX_ID = "00000000-0000-0000-0000-000000000000";

const ProceduresPage = () => {
  const [stats, setStats] = useState<MasteryStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [committing, setCommitting] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<MasteryCategory | 'All'>('All');
  const [sortBy, setSortBy] = useState<'most' | 'least' | 'dysfunction'>('most');
  const [activeTab, setActiveTab] = useState("mastery");
  const [protocolTab, setProtocolTab] = useState("cranial-nerves");

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await fetchMasteryStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to load mastery stats", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStats(); }, []);

  const filteredStats = useMemo(() => {
    return stats
      .filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
        const matchesCat = activeCategory === 'All' || s.category === activeCategory;
        return matchesSearch && matchesCat;
      })
      .sort((a, b) => {
        if (sortBy === 'most') return b.count - a.count;
        if (sortBy === 'least') return a.count - b.count;
        return b.dysfunctionRate - a.dysfunctionRate;
      });
  }, [stats, search, activeCategory, sortBy]);

  const summary = useMemo(() => {
    const total = stats.length;
    const masters = stats.filter(s => s.masteryLevel === 'Master').length;
    const novices = stats.filter(s => s.masteryLevel === 'Novice').length;
    const totalLogs = stats.reduce((sum, s) => sum + s.count, 0);
    
    const priorities = [...stats]
      .sort((a, b) => {
        if (a.count === 0 && b.count > 0) return -1;
        if (b.count === 0 && a.count > 0) return 1;
        return b.dysfunctionRate - a.dysfunctionRate;
      })
      .slice(0, 3);

    return { total, masters, novices, totalLogs, priorities };
  }, [stats]);

  const handleCommitFocus = async () => {
    setCommitting(true);
    try {
      const items = summary.priorities.map(p => p.name);
      await setWeeklyFocus(items);
      showSuccess("Weekly focus committed! You'll see these reminders in your sessions.");
    } catch (err) {
      showError("Failed to save weekly focus.");
    } finally {
      setCommitting(false);
    }
  };

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="animate-spin text-indigo-500" size={48} />
    </div>
  );

  return (
    <AppLayout variant="wide">
      <div className="space-y-10">
        <Breadcrumbs items={[{ label: "Protocols & Mastery" }]} />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-indigo-200 dark:shadow-indigo-900/20">
              <Trophy size={32} />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight text-foreground">Protocols Hub</h1>
              <p className="text-muted-foreground font-medium mt-1 text-lg">Clinical mastery tracking and interactive protocol reference.</p>
            </div>
          </div>
          <Button onClick={loadStats} variant="outline" className="rounded-xl h-12 px-6 font-bold border-indigo-100 text-indigo-600 hover:bg-indigo-50">
            <RefreshCw size={18} className="mr-2" /> Refresh Data
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-14 bg-slate-200/50 p-1.5 rounded-2xl mb-8">
            <TabsTrigger value="mastery" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm rounded-xl h-11 font-black uppercase tracking-wider text-[10px]">
              <TrendingUp size={14} /> Clinical Mastery
            </TabsTrigger>
            <TabsTrigger value="reference" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm rounded-xl h-11 font-black uppercase tracking-wider text-[10px]">
              <Zap size={14} /> Protocol Reference
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mastery" className="space-y-10 mt-0 animate-in fade-in duration-500">
            {/* Practice Priority Suggestion */}
            {summary.priorities.length > 0 && (
              <Card className="border-none shadow-xl rounded-[2.5rem] bg-indigo-50 dark:bg-indigo-950/20 border-2 border-indigo-100 dark:border-indigo-900/30 overflow-hidden">
                <CardHeader className="p-8 pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-xl font-black flex items-center gap-3 text-indigo-900 dark:text-indigo-100">
                          <Lightbulb size={24} className="text-amber-500" /> Focus on this this week
                        </CardTitle>
                        <Badge className="bg-indigo-600 text-white border-none font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-full">
                          Study Priority
                        </Badge>
                      </div>
                      <CardDescription className="text-indigo-700 dark:text-indigo-300 font-medium text-base mt-1">
                        Based on your clinical logs, these components require more practice or have high dysfunction rates.
                      </CardDescription>
                    </div>
                    <Button 
                      onClick={handleCommitFocus}
                      disabled={committing}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-12 px-8 font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-100"
                    >
                      {committing ? <Loader2 className="mr-2 animate-spin" /> : <CheckCircle2 size={18} className="mr-2" />}
                      Commit to this Focus
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-8 pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {summary.priorities.map((item) => (
                      <div key={item.id} className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-between group hover:shadow-md transition-all">
                        <div className="min-w-0">
                          <p className="font-black text-sm text-slate-900 dark:text-slate-100 truncate">{item.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className={cn(
                              "text-[8px] font-black uppercase border-none px-1.5 py-0",
                              item.count === 0 ? "bg-rose-50 text-rose-600" : "bg-indigo-50 text-indigo-600"
                            )}>
                              {item.count === 0 ? 'Unpracticed' : item.masteryLevel}
                            </Badge>
                            <span className="text-[8px] font-bold text-slate-400 uppercase">{item.count} Logs</span>
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-all">
                          <ArrowRight size={16} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Mastery Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-none shadow-lg rounded-3xl bg-indigo-900 text-white overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-700"><Sparkles size={80} /></div>
                <CardContent className="p-6 space-y-1 relative z-10">
                  <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Total Components</p>
                  <p className="text-4xl font-black">{summary.total}</p>
                  <p className="text-xs text-indigo-200 font-medium">Registry of all loggable items</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-lg rounded-3xl bg-emerald-600 text-white overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-700"><ShieldCheck size={80} /></div>
                <CardContent className="p-6 space-y-1 relative z-10">
                  <p className="text-[10px] font-black text-emerald-200 uppercase tracking-widest">Mastered Items</p>
                  <p className="text-4xl font-black">{summary.masters}</p>
                  <p className="text-xs text-emerald-100 font-medium">11+ logs recorded</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-lg rounded-3xl bg-rose-600 text-white overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-700"><AlertCircle size={80} /></div>
                <CardContent className="p-6 space-y-1 relative z-10">
                  <p className="text-[10px] font-black text-rose-200 uppercase tracking-widest">Unpracticed Items</p>
                  <p className="text-4xl font-black">{summary.novices}</p>
                  <p className="text-xs text-rose-100 font-medium">Items with 0-2 logs</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-lg rounded-3xl bg-card overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-700"><Activity size={80} /></div>
                <CardContent className="p-6 space-y-1 relative z-10">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Clinical Logs</p>
                  <p className="text-4xl font-black text-foreground">{summary.totalLogs}</p>
                  <p className="text-xs text-muted-foreground font-medium">Cumulative experience</p>
                </CardContent>
              </Card>
            </div>

            {/* Filters and Search */}
            <div className="space-y-6">
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-card p-4 rounded-[2rem] border border-border shadow-sm">
                <div className="relative flex-1 w-full max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input 
                    placeholder="Search components..." 
                    className="pl-12 bg-muted/50 border-none h-12 rounded-xl font-medium"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1 bg-muted p-1 rounded-xl">
                    {['All', 'Muscles', 'Reflexes', 'Brain Zones', 'Techniques'].map((cat) => (
                      <Button 
                        key={cat}
                        variant={activeCategory === cat ? 'default' : 'ghost'} 
                        size="sm" 
                        onClick={() => setActiveCategory(cat as any)}
                        className={cn(
                          "rounded-lg h-9 px-4 font-bold text-[10px] uppercase tracking-widest", 
                          activeCategory === cat ? "bg-card text-indigo-600 shadow-sm hover:bg-card" : "text-muted-foreground"
                        )}
                      >
                        {cat}
                      </Button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1 bg-muted p-1 rounded-xl">
                    <Button 
                      variant={sortBy === 'most' ? 'default' : 'ghost'} 
                      size="sm" 
                      onClick={() => setSortBy('most')}
                      className={cn("rounded-lg h-9 px-3 font-bold text-[10px] uppercase tracking-widest", sortBy === 'most' ? "bg-card text-indigo-600 shadow-sm" : "text-muted-foreground")}
                    >
                      Most Logged
                    </Button>
                    <Button 
                      variant={sortBy === 'least' ? 'default' : 'ghost'} 
                      size="sm" 
                      onClick={() => setSortBy('least')}
                      className={cn("rounded-lg h-9 px-3 font-bold text-[10px] uppercase tracking-widest", sortBy === 'least' ? "bg-card text-rose-600 shadow-sm" : "text-muted-foreground")}
                    >
                      Least Logged
                    </Button>
                    <Button 
                      variant={sortBy === 'dysfunction' ? 'default' : 'ghost'} 
                      size="sm" 
                      onClick={() => setSortBy('dysfunction')}
                      className={cn("rounded-lg h-9 px-3 font-bold text-[10px] uppercase tracking-widest", sortBy === 'dysfunction' ? "bg-card text-amber-600 shadow-sm" : "text-muted-foreground")}
                    >
                      High Dysfunction
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredStats.map((stat) => (
                  <MasteryItemCard key={stat.id} stat={stat} />
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reference" className="mt-0 animate-in fade-in duration-500">
            <div className="bg-card rounded-[3rem] border border-border shadow-xl p-8 md:p-12">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div className="space-y-1">
                  <h2 className="text-3xl font-black text-foreground tracking-tight">Protocol Sandbox</h2>
                  <p className="text-muted-foreground font-medium">Interactive reference for clinical assessments. (Sandbox Mode: No data is saved to a client).</p>
                </div>
                <Badge className="bg-amber-500 text-white border-none font-black text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg shadow-amber-100">
                  Reference Only
                </Badge>
              </div>

              <Tabs value={protocolTab} onValueChange={setProtocolTab} className="w-full">
                <div className="flex justify-center mb-10">
                  <TabsList className="inline-flex h-14 items-center justify-center rounded-2xl bg-slate-100/50 p-1.5 text-muted-foreground border border-slate-200">
                    <TabsTrigger 
                      value="cranial-nerves" 
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-xl px-8 py-3 text-xs font-black uppercase tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-lg"
                    >
                      <Brain className="h-4 w-4 mr-2" />
                      Cranial Nerves
                    </TabsTrigger>
                    <TabsTrigger 
                      value="primitive-reflexes" 
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-xl px-8 py-3 text-xs font-black uppercase tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-lg"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Primitive Reflexes
                    </TabsTrigger>
                    <TabsTrigger 
                      value="mechanoreceptive" 
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-xl px-8 py-3 text-xs font-black uppercase tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-lg"
                    >
                      <Activity className="h-4 w-4 mr-2" />
                      Mechanoreceptive
                    </TabsTrigger>
                    <TabsTrigger 
                      value="emotions" 
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-xl px-8 py-3 text-xs font-black uppercase tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-lg"
                    >
                      <Heart className="h-4 w-4 mr-2" />
                      Emotions
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <div className="animate-in slide-in-from-bottom-4 duration-500">
                  <TabsContent value="cranial-nerves" className="mt-0 focus-visible:ring-0">
                    <CranialNerveAssessment 
                      appointmentId={SANDBOX_ID} 
                      priorityPattern={null}
                      updatePriorityPattern={async () => {}}
                    />
                  </TabsContent>
                  
                  <TabsContent value="primitive-reflexes" className="mt-0 focus-visible:ring-0">
                    <PrimitiveReflexAssessment 
                      appointmentId={SANDBOX_ID} 
                      priorityPattern={null}
                      updatePriorityPattern={async () => {}}
                    />
                  </TabsContent>

                  <TabsContent value="mechanoreceptive" className="mt-0 focus-visible:ring-0">
                    <MechanoreceptiveAssessment 
                      appointmentId={SANDBOX_ID}
                      onSave={(summary) => console.log("Sandbox Save:", summary)}
                    />
                  </TabsContent>

                  <TabsContent value="emotions" className="mt-0 focus-visible:ring-0">
                    <EmotionsProtocolReference />
                  </TabsContent>
                </div>
              </Tabs>

              <div className="mt-16 p-8 bg-slate-900 text-white rounded-[2.5rem] flex items-start gap-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10"><Info size={100} /></div>
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl shrink-0">
                  <GraduationCap size={32} />
                </div>
                <div className="space-y-2 relative z-10">
                  <h4 className="text-xl font-black text-indigo-400">Clinical Sandbox</h4>
                  <p className="text-slate-300 font-medium leading-relaxed italic text-lg">
                    "Use this space to review protocols, study stimuli, and practice your clinical reasoning without affecting client records. Mastery is built in the quiet moments between sessions."
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default ProceduresPage;