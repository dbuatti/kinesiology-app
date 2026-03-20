import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Target, TrendingUp, Loader2, 
  Activity, Zap, 
  Trophy, Sparkles, Search,
  GraduationCap, ShieldCheck,
  AlertCircle, RefreshCw,
  Lightbulb,
  ArrowRight,
  FilterX,
  CheckCircle2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { fetchMasteryStats, MasteryStat, MasteryCategory } from "@/utils/mastery-stats";
import { setWeeklyFocus } from "@/utils/weekly-focus";
import MasteryItemCard from "@/components/crm/MasteryItemCard";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import AppLayout from "@/components/crm/AppLayout";
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/utils/toast";

const ProceduresPage = () => {
  const [stats, setStats] = useState<MasteryStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [committing, setCommitting] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<MasteryCategory | 'All'>('All');
  const [sortBy, setSortBy] = useState<'most' | 'least' | 'dysfunction'>('most');

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
    
    // Calculate practice priorities (items with 0 logs or high dysfunction)
    const priorities = [...stats]
      .sort((a, b) => {
        // Prioritize items with 0 logs first
        if (a.count === 0 && b.count > 0) return -1;
        if (b.count === 0 && a.count > 0) return 1;
        // Then sort by dysfunction rate
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
        <Breadcrumbs items={[{ label: "Clinical Mastery" }]} />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-indigo-200 dark:shadow-indigo-900/20">
              <Trophy size={32} />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight text-foreground">Clinical Mastery</h1>
              <p className="text-muted-foreground font-medium mt-1 text-lg">Real-time tally of every reflex, muscle, and technique logged.</p>
            </div>
          </div>
          <Button onClick={loadStats} variant="outline" className="rounded-xl h-12 px-6 font-bold border-indigo-100 text-indigo-600 hover:bg-indigo-50">
            <RefreshCw size={18} className="mr-2" /> Refresh Data
          </Button>
        </div>

        {/* Practice Priority Suggestion */}
        {summary.priorities.length > 0 && (
          <Card className="border-none shadow-xl rounded-[2.5rem] bg-indigo-50 dark:bg-indigo-950/20 border-2 border-indigo-100 dark:border-indigo-900/30 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-700">
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
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-12 px-8 font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-200"
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

          {sortBy === 'least' && (
            <Alert className="bg-rose-50 border-rose-200 rounded-2xl animate-in slide-in-from-top-2">
              <AlertCircle className="h-5 w-5 text-rose-600" />
              <AlertDescription className="text-sm text-rose-900 font-bold">
                PRACTICE PRIORITY: Surfacing items with the lowest log counts. Focus your study sessions on these components this week.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredStats.map((stat) => (
              <MasteryItemCard key={stat.id} stat={stat} />
            ))}
          </div>

          {filteredStats.length === 0 && (
            <div className="text-center py-32 bg-muted/30 rounded-[3rem] border-2 border-dashed border-border">
              <div className="mx-auto w-20 h-20 bg-card rounded-3xl flex items-center justify-center mb-6 shadow-xl">
                 <Search className="text-muted-foreground" size={32} />
              </div>
              <p className="text-foreground font-black text-xl">No components found</p>
              <p className="text-muted-foreground mt-2 mb-8 font-medium">Try adjusting your search or filters.</p>
              <Button variant="outline" className="h-12 px-8 border-border hover:bg-card rounded-2xl font-bold" onClick={() => { setSearch(""); setActiveCategory("All"); setSortBy("most"); }}>Reset Dashboard</Button>
            </div>
          )}
        </div>

        <div className="p-8 bg-indigo-900 text-white rounded-[3rem] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-10"><GraduationCap size={200} /></div>
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge className="bg-indigo-50 text-white border-none font-black text-[10px] uppercase tracking-[0.3em] px-4 py-1">Clinical Philosophy</Badge>
              <h2 className="text-4xl font-black tracking-tight leading-tight">The Path to Mastery is <br/>Paved with Repetition.</h2>
              <p className="text-indigo-200 text-lg font-medium leading-relaxed">
                "2 years experience ≈ 65% accuracy. 5+ years ≈ 95% clinical mastery. This dashboard tracks your journey to that 95% threshold by ensuring no reflex or muscle is left unpracticed."
              </p>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-indigo-300">Master (11+)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-indigo-500" />
                  <span className="text-xs font-bold text-indigo-300">Proficient (6-10)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-xs font-bold text-indigo-300">Competent (3-5)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <span className="text-xs font-bold text-indigo-300">Novice (0-2)</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
                <h4 className="font-black text-indigo-400 text-xs uppercase tracking-widest mb-2">Top Dysfunction</h4>
                <p className="text-2xl font-black">{stats.sort((a,b) => b.dysfunctionRate - a.dysfunctionRate)[0]?.name || 'N/A'}</p>
                <p className="text-[10px] text-indigo-300 mt-1">Most common clinical finding</p>
              </div>
              <div className="p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
                <h4 className="font-black text-indigo-400 text-xs uppercase tracking-widest mb-2">Most Practiced</h4>
                <p className="text-2xl font-black">{stats[0]?.name || 'N/A'}</p>
                <p className="text-[10px] text-indigo-300 mt-1">Your strongest clinical area</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ProceduresPage;