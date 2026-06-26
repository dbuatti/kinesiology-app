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
  CheckCircle2,
  Brain,
  Heart,
  Info,
  Shield,
  Dumbbell,
  Baby
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { fetchMasteryStats, MasteryStat, MasteryCategory } from "@/utils/mastery-stats";
import { setWeeklyFocus } from "@/utils/weekly-focus";
import MasteryItemCard from "@/components/crm/MasteryItemCard";

import AppLayout from "@/components/crm/AppLayout";
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/utils/toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/shared/PageHeader";

// Assessment Components
import { CranialNerveAssessment } from "@/components/crm/CranialNerveAssessment";
import { PrimitiveReflexAssessment } from "@/components/crm/PrimitiveReflexAssessment";
import { BrainZoneAssessment } from "@/components/crm/BrainZoneAssessment";
import { MuscleAssessment } from "@/components/crm/MuscleAssessment";
import EmotionsProtocolReference from "@/components/crm/EmotionsProtocolReference";
import MechanoreceptiveAssessment from "@/components/crm/MechanoreceptiveAssessment";
import HeartWallProtocol from "@/components/crm/HeartWallProtocol";

// Modal Components
import MuscleInfoModal from "@/components/crm/MuscleInfoModal";
import PrimitiveReflexModal from "@/components/crm/PrimitiveReflexModal";
import BrainReflexModal from "@/components/crm/BrainReflexModal";

// Data for Modals
import { BRAIN_REFLEX_POINTS } from "@/data/brain-reflex-data";
import { PRIMITIVE_REFLEXES } from "@/data/primitive-reflex-data";

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

  // Modal States
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [selectedReflex, setSelectedReflex] = useState<any | null>(null);
  const [selectedBrainPoint, setSelectedBrainPoint] = useState<any | null>(null);
  const [customImages, setCustomImages] = useState<Record<string, any>>({});

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await fetchMasteryStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to load mastery stats", err);
      showError("Failed to load mastery statistics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    fetchCustomizations();
  }, []);

  const fetchCustomizations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('brain_reflex_customizations')
        .select('reflex_id, image_url, secondary_image_url, tertiary_image_url')
        .eq('user_id', user.id);
      
      const mapping: Record<string, any> = {};
      data?.forEach(item => { 
        const timestamp = Date.now();
        mapping[item.reflex_id] = {
          primaryUrl: item.image_url ? `${item.image_url}?t=${timestamp}` : null,
          secondaryUrl: item.secondary_image_url ? `${item.secondary_image_url}?t=${timestamp}` : null,
          tertiaryUrl: item.tertiary_image_url ? `${item.tertiary_image_url}?t=${timestamp}` : null
        };
      });
      setCustomImages(mapping);
    } catch (err) {
      console.error("Failed to fetch customizations:", err);
    }
  };

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

  const handleItemClick = (stat: MasteryStat) => {
    if (stat.category === 'Muscles') {
      setSelectedMuscle(stat.name);
    } else if (stat.category === 'Reflexes') {
      const reflex = PRIMITIVE_REFLEXES.find(r => r.name === stat.name);
      if (reflex) setSelectedReflex(reflex);
    } else if (stat.category === 'Brain Zones') {
      // This includes Cranial Nerves as they are mapped in BRAIN_REFLEX_POINTS
      const point = BRAIN_REFLEX_POINTS.find(p => p.id === stat.id || p.name.startsWith(stat.name));
      if (point) setSelectedBrainPoint(point);
    }
  };

  const handleShowNerveInfo = (nerveId: number) => {
    const point = BRAIN_REFLEX_POINTS.find(p => p.id === `cn${nerveId}`);
    if (point) {
      setSelectedBrainPoint(point);
    }
  };

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
      <Loader2 className="animate-spin text-chart-primary" size={48} />
    </div>
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader 
          title="Procedures"
          subtitle="Clinical mastery tracking, protocol proficiency, and interactive reference."
          icon={Trophy}
          actions={
            <Button onClick={loadStats} variant="outline" className="rounded-xl h-12 px-6 font-medium border-chart-primary/20 text-chart-primary hover:bg-chart-primary/10">
              <RefreshCw size={18} className="mr-2" /> Refresh Data
            </Button>
          }
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-4">
            <TabsList className="grid w-full grid-cols-2 h-14 bg-muted p-1.5 rounded-xl">
              <TabsTrigger value="mastery" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-chart-primary data-[state=active]:shadow-sm rounded-xl h-11 font-semibold uppercase tracking-wider text-[10px]">
                <TrendingUp size={14} /> Clinical Mastery
              </TabsTrigger>
              <TabsTrigger value="reference" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-chart-primary data-[state=active]:shadow-sm rounded-xl h-11 font-semibold uppercase tracking-wider text-[10px]">
                <Zap size={14} /> Protocol Reference
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="mastery" className="space-y-6 mt-0 animate-in fade-in duration-500">
            {/* Practice Priority Suggestion */}
            {summary.priorities.length > 0 && (
              <Card className="border-none shadow-sm rounded-xl bg-chart-primary/10 border-2 border-chart-primary/20 overflow-hidden">
                <CardHeader className="p-5 pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-xl font-semibold flex items-center gap-3 text-foreground">
                          <Lightbulb size={24} className="text-chart-primary" /> Focus on this this week
                        </CardTitle>
                        <Badge className="bg-chart-primary text-white border-none font-semibold text-[10px] uppercase tracking-wider px-3 py-1 rounded-full">
                          Study Priority
                        </Badge>
                      </div>
                      <CardDescription className="text-muted-foreground font-medium text-base mt-1">
                        Based on your clinical logs, these components require more practice or have high dysfunction rates.
                      </CardDescription>
                    </div>
                    <Button 
                      onClick={handleCommitFocus}
                      disabled={committing}
                      className="bg-primary hover:bg-primary/90 text-white rounded-xl h-12 px-8 font-medium text-xs uppercase tracking-wider shadow-sm"
                    >
                      {committing ? <Loader2 className="mr-2 animate-spin" /> : <CheckCircle2 size={18} className="mr-2" />}
                      Commit to this Focus
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-5 pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {summary.priorities.map((item) => (
                      <div 
                        key={item.id} 
                        onClick={() => handleItemClick(item)}
                        className="p-5 bg-card rounded-xl border border-chart-primary/20 flex items-center justify-between group hover:shadow-sm transition-all cursor-pointer"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-foreground truncate">{item.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className={cn(
                              "text-[10px] font-semibold uppercase border-none px-1.5 py-0",
                              item.count === 0 ? "bg-chart-destructive/10 text-chart-destructive" : "bg-chart-primary/10 text-chart-primary"
                            )}>
                              {item.count === 0 ? 'Unpracticed' : item.masteryLevel}
                            </Badge>
                            <span className="text-[10px] font-medium text-muted-foreground uppercase">{item.count} Logs</span>
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center text-muted-foreground group-hover:text-chart-primary transition-all">
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
              <Card className="border-none shadow-sm rounded-xl bg-chart-primary text-white overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-700"><Sparkles size={80} /></div>
                <CardContent className="p-6 space-y-1 relative z-10">
                  <p className="text-[10px] font-semibold text-white/70 uppercase tracking-wider">Total Components</p>
                  <p className="text-4xl font-semibold">{summary.total}</p>
                  <p className="text-xs text-white/50 font-medium">Registry of all loggable items</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm rounded-xl bg-chart-emerald text-white overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-700"><ShieldCheck size={80} /></div>
                <CardContent className="p-6 space-y-1 relative z-10">
                  <p className="text-[10px] font-semibold text-white/70 uppercase tracking-wider">Mastered Items</p>
                  <p className="text-4xl font-semibold">{summary.masters}</p>
                  <p className="text-xs text-white/50 font-medium">11+ logs recorded</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm rounded-xl bg-chart-destructive text-white overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-700"><AlertCircle size={80} /></div>
                <CardContent className="p-6 space-y-1 relative z-10">
                  <p className="text-[10px] font-semibold text-white/70 uppercase tracking-wider">Unpracticed Items</p>
                  <p className="text-4xl font-semibold">{summary.novices}</p>
                  <p className="text-xs text-white/50 font-medium">Items with 0-2 logs</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm rounded-xl bg-card overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-700"><Activity size={80} /></div>
                <CardContent className="p-6 space-y-1 relative z-10">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Total Clinical Logs</p>
                  <p className="text-4xl font-semibold text-foreground">{summary.totalLogs}</p>
                  <p className="text-xs text-muted-foreground font-medium">Cumulative experience</p>
                </CardContent>
              </Card>
            </div>

            {/* Filters and Search */}
            <div className="space-y-6">
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border border-border shadow-sm">
                <div className="relative flex-1 w-full max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input 
                    placeholder="Search components..." 
                    className="pl-12 bg-muted/50 border-none h-12 rounded-lg font-medium"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
                    {['All', 'Muscles', 'Reflexes', 'Brain Zones', 'Techniques'].map((cat) => (
                      <Button 
                        key={cat}
                        variant={activeCategory === cat ? 'default' : 'ghost'} 
                        size="sm" 
                        onClick={() => setActiveCategory(cat as any)}
                        className={cn(
                          "rounded-md h-9 px-4 font-medium text-[10px] uppercase tracking-wider", 
                          activeCategory === cat ? "bg-card text-chart-primary shadow-sm hover:bg-card" : "text-muted-foreground"
                        )}
                      >
                        {cat}
                      </Button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
                    <Button 
                      variant={sortBy === 'most' ? 'default' : 'ghost'} 
                      size="sm" 
                      onClick={() => setSortBy('most')}
                      className={cn("rounded-md h-9 px-3 font-medium text-[10px] uppercase tracking-wider", sortBy === 'most' ? "bg-card text-chart-primary shadow-sm" : "text-muted-foreground")}
                    >
                      Most Logged
                    </Button>
                    <Button 
                      variant={sortBy === 'least' ? 'default' : 'ghost'} 
                      size="sm" 
                      onClick={() => setSortBy('least')}
                      className={cn("rounded-md h-9 px-3 font-medium text-[10px] uppercase tracking-wider", sortBy === 'least' ? "bg-card text-chart-destructive shadow-sm" : "text-muted-foreground")}
                    >
                      Least Logged
                    </Button>
                    <Button 
                      variant={sortBy === 'dysfunction' ? 'default' : 'ghost'} 
                      size="sm" 
                      onClick={() => setSortBy('dysfunction')}
                      className={cn("rounded-md h-9 px-3 font-medium text-[10px] uppercase tracking-wider", sortBy === 'dysfunction' ? "bg-card text-chart-primary shadow-sm" : "text-muted-foreground")}
                    >
                      High Dysfunction
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredStats.map((stat) => (
                  <MasteryItemCard 
                    key={stat.id} 
                    stat={stat} 
                    onClick={() => handleItemClick(stat)}
                  />
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reference" className="mt-0 animate-in fade-in duration-500">
            <div className="bg-card rounded-xl border border-border shadow-sm p-5 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-5">
                <div className="space-y-1">
                  <h2 className="text-3xl font-semibold text-foreground tracking-tight">Protocol Practice</h2>
                  <p className="text-muted-foreground font-medium">Interactive reference for clinical assessments. (Practice Mode: No data is saved to a client).</p>
                </div>
                <Badge className="bg-chart-primary text-white border-none font-semibold text-[10px] uppercase tracking-wider px-4 py-1.5 rounded-full shadow-sm">
                  Reference Only
                </Badge>
              </div>

              <Tabs value={protocolTab} onValueChange={setProtocolTab} className="w-full">
                <div className="mb-5 overflow-x-auto">
                  <TabsList className="inline-flex h-12 items-center rounded-xl bg-muted p-1 text-muted-foreground border border-border">
                    <TabsTrigger 
                      value="cranial-nerves" 
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-xs font-medium uppercase tracking-wider transition-all data-[state=active]:bg-white data-[state=active]:text-chart-primary data-[state=active]:shadow-sm"
                    >
                      <Brain className="h-4 w-4 mr-1.5" />
                      Nerves
                    </TabsTrigger>
                    <TabsTrigger 
                      value="primitive-reflexes" 
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-xs font-medium uppercase tracking-wider transition-all data-[state=active]:bg-white data-[state=active]:text-chart-primary data-[state=active]:shadow-sm"
                    >
                      <Zap className="h-4 w-4 mr-1.5" />
                      Reflexes
                    </TabsTrigger>
                    <TabsTrigger 
                      value="brain-zones" 
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-xs font-medium uppercase tracking-wider transition-all data-[state=active]:bg-white data-[state=active]:text-chart-primary data-[state=active]:shadow-sm"
                    >
                      <Activity className="h-4 w-4 mr-1.5" />
                      Brain Zones
                    </TabsTrigger>
                    <TabsTrigger 
                      value="muscles" 
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-xs font-medium uppercase tracking-wider transition-all data-[state=active]:bg-white data-[state=active]:text-chart-primary data-[state=active]:shadow-sm"
                    >
                      <Dumbbell className="h-4 w-4 mr-1.5" />
                      Muscles
                    </TabsTrigger>
                    <TabsTrigger 
                      value="mechanoreceptive" 
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-xs font-medium uppercase tracking-wider transition-all data-[state=active]:bg-white data-[state=active]:text-chart-primary data-[state=active]:shadow-sm"
                    >
                      <Activity className="h-4 w-4 mr-1.5" />
                      Mechano
                    </TabsTrigger>
                    <TabsTrigger 
                      value="emotions" 
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-xs font-medium uppercase tracking-wider transition-all data-[state=active]:bg-white data-[state=active]:text-chart-primary data-[state=active]:shadow-sm"
                    >
                      <Heart className="h-4 w-4 mr-1.5" />
                      Emotions
                    </TabsTrigger>
                    <TabsTrigger 
                      value="heart-wall" 
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-xs font-medium uppercase tracking-wider transition-all data-[state=active]:bg-white data-[state=active]:text-chart-primary data-[state=active]:shadow-sm"
                    >
                      <Shield className="h-4 w-4 mr-1.5" />
                      Heart Wall
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <div className="animate-in slide-in-from-bottom-4 duration-500">
                  <TabsContent value="cranial-nerves" className="mt-0 focus-visible:ring-0">
                    <CranialNerveAssessment 
                      appointmentId={SANDBOX_ID} 
                      priorityPattern={null}
                      updatePriorityPattern={async () => {}}
                      showImages={true}
                      onShowInfo={handleShowNerveInfo}
                    />
                  </TabsContent>
                  
                  <TabsContent value="primitive-reflexes" className="mt-0 focus-visible:ring-0">
                    <PrimitiveReflexAssessment 
                      appointmentId={SANDBOX_ID} 
                      priorityPattern={null}
                      updatePriorityPattern={async () => {}}
                    />
                  </TabsContent>

                  <TabsContent value="brain-zones" className="mt-0 focus-visible:ring-0">
                    <BrainZoneAssessment 
                      priorityPattern={null}
                      updatePriorityPattern={async () => {}}
                      showImages={true}
                    />
                  </TabsContent>

                  <TabsContent value="muscles" className="mt-0 focus-visible:ring-0">
                    <MuscleAssessment 
                      priorityPattern={null}
                      updatePriorityPattern={async () => {}}
                      showImages={true}
                    />
                  </TabsContent>

                  <TabsContent value="mechanoreceptive" className="mt-0 focus-visible:ring-0">
                    <MechanoreceptiveAssessment 
                      appointmentId={SANDBOX_ID}
                      onSave={(summary) => {}}
                    />
                  </TabsContent>

                  <TabsContent value="emotions" className="mt-0 focus-visible:ring-0">
                    <EmotionsProtocolReference />
                  </TabsContent>

                  <TabsContent value="heart-wall" className="mt-0 focus-visible:ring-0">
                    <HeartWallProtocol />
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <MuscleInfoModal 
        muscleName={selectedMuscle}
        open={!!selectedMuscle}
        onOpenChange={(open) => !open && setSelectedMuscle(null)}
      />

      <PrimitiveReflexModal 
        reflex={selectedReflex}
        open={!!selectedReflex}
        onOpenChange={(open) => !open && setSelectedReflex(null)}
      />

      <BrainReflexModal 
        point={selectedBrainPoint}
        primaryUrl={selectedBrainPoint ? customImages[selectedBrainPoint.id]?.primaryUrl : null}
        secondaryUrl={selectedBrainPoint ? customImages[selectedBrainPoint.id]?.secondaryUrl : null}
        tertiaryUrl={selectedBrainPoint ? customImages[selectedBrainPoint.id]?.tertiaryUrl : null}
        open={!!selectedBrainPoint}
        onOpenChange={(open) => !open && setSelectedBrainPoint(null)}
      />
    </AppLayout>
  );
};

export default ProceduresPage;