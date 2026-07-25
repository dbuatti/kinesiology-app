
import { useState, useEffect, useMemo } from "react";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  MessageSquare, 
  Sparkles, 
  Trash2, 
  Loader2, 
  Plus, 
  History, 
  Brain, 
  HelpCircle,
  Save,
  Calendar,
  Link as LinkIcon,
  User,
  X,
  Wand2,
  Fingerprint,
  ShieldAlert,
  PlusCircle,
  CheckCircle2,
  Clock,
  Zap,
  ChevronRight,
  GraduationCap,
  ArrowRight,
  RotateCcw,
  Target,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Lock,
  Activity,
  Wind,
  Layers
} from "lucide-react";
import { format } from "date-fns";
import { showSuccess, showError } from "@/utils/toast";
import AppLayout from "@/components/crm/AppLayout";

import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useLocation } from "react-router-dom";
import PageHeader from "@/components/shared/PageHeader";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { id: 'General', icon: Lock, color: 'text-muted-foreground', bg: 'bg-muted' },
  { id: 'Meetup Question', icon: HelpCircle, color: 'text-chart-primary', bg: 'bg-muted' },
  { id: 'Doubt', icon: Brain, color: 'text-chart-destructive', bg: 'bg-muted' },
  { id: 'Reflection', icon: Sparkles, color: 'text-muted-foreground', bg: 'bg-muted' },
];

const JournalPage = () => {
  const location = useLocation();
  const preselectedAppId = location.state?.appointmentId;

  const [activeTab, setActiveTab] = useState("log");
  const [reflections, setReflections] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isAddingAll, setIsAddingAll] = useState(false);
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("General");
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(preselectedAppId || null);
  
  const [analyzingIds, setAnalyzingIds] = useState<Set<string>>(new Set());
  const [addingToBacklog, setAddingToBacklog] = useState<string | null>(null);
  
  const [respondingToId, setRespondingToId] = useState<string | null>(null);
  const [tempResponse, setTempResponse] = useState("");
  const [confirmAction, setConfirmAction] = useState<{callback: () => void; title: string; description: string} | null>(null);

  const fetchData = async () => {
    setError(null);
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [refRes, appRes] = await Promise.all([
        supabase
          .from('practitioner_reflections')
          .select('*, appointments(id, name, date, clients(name))')
          .order('created_at', { ascending: false }),
        supabase
          .from('appointments')
          .select('id, name, date, clients(name)')
          .order('date', { ascending: false })
          .limit(20)
      ]);

      if (refRes.error) throw refRes.error;
      if (appRes.error) throw appRes.error;

      setReflections(refRes.data || []);
      setAppointments(appRes.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load journal data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const meetupQuestions = useMemo(() => {
    const questions: any[] = [];
    reflections.forEach(ref => {
      if (ref.category === 'Meetup Question') {
        questions.push({
          id: `manual-${ref.id}`,
          reflectionId: ref.id,
          content: ref.content,
          date: ref.created_at,
          source: 'Manual Entry',
          status: ref.response ? 'asked' : 'pending',
          response: ref.response,
          clientName: ref.appointments?.clients?.name
        });
      }
      const extractions = ref.ai_extractions || [];
      extractions.forEach((ext: any, idx: number) => {
        if (ext.type === 'question') {
          questions.push({
            id: `ai-${ref.id}-${idx}`,
            reflectionId: ref.id,
            content: ext.content,
            date: ref.created_at,
            source: 'AI Extracted',
            status: ext.status || 'pending',
            response: ext.response,
            clientName: ref.appointments?.clients?.name,
            extractionIndex: idx
          });
        }
      });
    });
    return questions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [reflections]);

  const pendingQuestions = useMemo(() => meetupQuestions.filter(q => q.status === 'pending'), [meetupQuestions]);

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from('practitioner_reflections')
        .insert({
          user_id: user.id,
          content: content.trim(),
          category,
          appointment_id: selectedAppointmentId === "none" ? null : selectedAppointmentId
        })
        .select()
        .single();

      if (error) throw error;

      showSuccess("Journal entry saved. Analysing for insights...");
      setContent("");
      if (data) handleAnalyze(data);
      fetchData();
    } catch (err: any) {
      showError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAnalyze = async (reflection: any) => {
    setAnalyzingIds(prev => new Set(prev).add(reflection.id));
    try {
      const { data, error } = await supabase.functions.invoke('analyze-reflections', {
        body: { content: reflection.content }
      });

      if (error) throw error;

      if (data?.extractions && data.extractions.length > 0) {
        await supabase
          .from('practitioner_reflections')
          .update({ ai_extractions: data.extractions })
          .eq('id', reflection.id);
        
        fetchData();
        return data.extractions.length;
      }
      return 0;
    } catch (err: any) {
      console.error(err);
      return 0;
    } finally {
      setAnalyzingIds(prev => {
        const next = new Set(prev);
        next.delete(reflection.id);
        return next;
      });
    }
  };

  const handleScanAll = async () => {
    const unanalyzed = reflections.filter(r => !r.ai_extractions || r.ai_extractions.length === 0);
    if (unanalyzed.length === 0) {
      showSuccess("All entries have already been analysed.");
      return;
    }

    setIsScanning(true);
    let totalExtracted = 0;
    try {
      for (const ref of unanalyzed) {
        const count = await handleAnalyze(ref);
        totalExtracted += count;
      }
      showSuccess(`Scan complete! Extracted ${totalExtracted} new insights across ${unanalyzed.length} entries.`);
    } catch (err) {
      showError("Failed to complete full scan.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleAddToBacklog = async (reflectionId: string, item: any, index: number) => {
    setAddingToBacklog(`${reflectionId}-${index}`);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const dbType = item.type === 'belief' ? 'belief' : (item.type === 'alignment' || item.type === 'goal' ? 'alignment' : 'shifting');

      const { error } = await supabase
        .from('identity_backlog')
        .insert({
          user_id: user.id,
          content: item.content,
          type: dbType, 
          status: 'pending',
          reflection_id: reflectionId
        });

      if (error) throw error;

      const reflection = reflections.find(r => r.id === reflectionId);
      if (reflection) {
        const newExtractions = [...reflection.ai_extractions];
        newExtractions[index].status = 'added';
        
        await supabase
          .from('practitioner_reflections')
          .update({ ai_extractions: newExtractions })
          .eq('id', reflectionId);
      }

      fetchData();
    } catch (err: any) {
      showError(err.message);
    } finally {
      setAddingToBacklog(null);
    }
  };

  const handleAddAllToBacklog = async (reflectionId?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setIsAddingAll(true);
    try {
      let totalAdded = 0;
      const targetReflections = reflectionId 
        ? reflections.filter(r => r.id === reflectionId)
        : reflections;

      for (const ref of targetReflections) {
        if (!ref.ai_extractions) continue;

        const itemsToAdd = ref.ai_extractions.filter((item: any) => 
          item.type !== 'question' && item.status !== 'added'
        );

        if (itemsToAdd.length === 0) continue;

        const inserts = itemsToAdd.map((item: any) => ({
          user_id: user.id,
          content: item.content,
          type: item.type === 'belief' ? 'belief' : (item.type === 'alignment' || item.type === 'goal' ? 'alignment' : 'shifting'),
          status: 'pending',
          reflection_id: ref.id
        }));

        const { error } = await supabase.from('identity_backlog').insert(inserts);
        if (error) throw error;

        const newExtractions = ref.ai_extractions.map((item: any) => {
          if (item.type !== 'question' && item.status !== 'added') {
            return { ...item, status: 'added' };
          }
          return item;
        });

        await supabase
          .from('practitioner_reflections')
          .update({ ai_extractions: newExtractions })
          .eq('id', ref.id);
        
        totalAdded += itemsToAdd.length;
      }

      if (totalAdded > 0) {
        showSuccess(`Added ${totalAdded} items to Identity Backlog.`);
        fetchData();
      } else {
        showSuccess("No new items to add.");
      }
    } catch (err: any) {
      showError(err.message);
    } finally {
      setIsAddingAll(false);
    }
  };

  const handleSaveResponse = async (question: any) => {
    if (!tempResponse.trim()) return;
    try {
      if (question.id.startsWith('manual-')) {
        const { error } = await supabase.from('practitioner_reflections').update({ response: tempResponse.trim() }).eq('id', question.reflectionId);
        if (error) throw error;
      } else {
        const reflection = reflections.find(r => r.id === question.reflectionId);
        if (reflection) {
          const newExtractions = [...reflection.ai_extractions];
          newExtractions[question.extractionIndex].status = 'asked';
          newExtractions[question.extractionIndex].response = tempResponse.trim();
          const { error } = await supabase.from('practitioner_reflections').update({ ai_extractions: newExtractions }).eq('id', reflection.id);
          if (error) throw error;
        }
      }
      showSuccess("Response logged.");
      setRespondingToId(null);
      setTempResponse("");
      fetchData();
    } catch (err) {
      showError("Failed to save response.");
    }
  };

  const executeDeleteEntry = async (id: string) => {
    try {
      await supabase.from('practitioner_reflections').delete().eq('id', id);
      fetchData();
      showSuccess("Entry removed.");
    } catch (err) {
      showError("Failed to delete.");
    }
  };

  const executeDeleteQuestion = async (question: any) => {
    try {
      if (question.id.startsWith('manual-')) {
        await supabase.from('practitioner_reflections').delete().eq('id', question.reflectionId);
      } else {
        const reflection = reflections.find(r => r.id === question.reflectionId);
        if (reflection) {
          const newExtractions = [...reflection.ai_extractions];
          newExtractions.splice(question.extractionIndex, 1);
          const { error } = await supabase
            .from('practitioner_reflections')
            .update({ ai_extractions: newExtractions })
            .eq('id', reflection.id);
          if (error) throw error;
        }
      }
      showSuccess("Question removed.");
      fetchData();
    } catch (err) {
      showError("Failed to delete question.");
    }
  };

  const getToolRecommendation = (type: string) => {
    switch (type) {
      case 'belief': return { label: 'Limiting Beliefs', icon: ShieldAlert, color: 'text-chart-destructive', bg: 'bg-muted' };
      case 'shifting': return { label: 'Identity Shifting', icon: Fingerprint, color: 'text-chart-primary', bg: 'bg-muted' };
      case 'alignment': return { label: 'Identity Alignment', icon: Target, color: 'text-chart-emerald', bg: 'bg-muted' };
      case 'felt_sense': return { label: 'Somatic Tracking', icon: Wind, color: 'text-chart-primary', bg: 'bg-muted' };
      default: return null;
    }
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-700">
        <PageHeader 
          title="Journal"
          subtitle="Private reflections and session-linked insights for clinical growth."
          icon={MessageSquare}

          actions={
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={handleScanAll}
                disabled={isScanning || reflections.length === 0}
                className="rounded-xl h-12 px-6 font-medium text-xs uppercase tracking-wider border-indigo-100 text-chart-primary hover:bg-muted"
              >
                {isScanning ? <Loader2 className="animate-spin mr-2" /> : <Wand2 size={18} className="mr-2" />}
                Scan All
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleAddAllToBacklog()}
                disabled={isAddingAll || reflections.length === 0}
                className="rounded-xl h-12 px-6 font-medium text-xs uppercase tracking-wider border-border text-chart-emerald hover:bg-muted"
              >
                {isAddingAll ? <Loader2 className="animate-spin mr-2" /> : <Layers size={18} className="mr-2" />}
                Add All to Backlog
              </Button>
            </div>
          }
        />

        {loading ? (
          <div className="p-24 flex flex-col items-center justify-center gap-6 bg-muted rounded-xl">
            <Loader2 className="animate-spin text-chart-primary" size={48} />
            <p className="text-chart-primary font-semibold text-xs uppercase tracking-wider">Loading journal...</p>
          </div>
        ) : error ? (
          <div className="p-24 flex flex-col items-center justify-center gap-6 bg-muted rounded-xl">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <span className="text-2xl font-semibold text-chart-destructive">!</span>
            </div>
            <p className="text-chart-destructive font-semibold text-xs uppercase tracking-wider text-center">Failed to load journal</p>
            <p className="text-muted-foreground text-xs text-center max-w-md">{error}</p>
            <Button onClick={fetchData} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl font-medium text-xs">
              <RotateCcw size={14} className="mr-2" /> Retry
            </Button>
          </div>
        ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-14 bg-muted/50 p-1.5 rounded-xl mb-8">
            <TabsTrigger value="log" className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:text-chart-primary data-[state=active]:shadow-sm rounded-xl h-11 font-semibold uppercase tracking-wider text-[10px]">
              <BookOpen size={14} /> Journal Log
            </TabsTrigger>
            <TabsTrigger value="meetup" className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:text-chart-primary data-[state=active]:shadow-sm rounded-xl h-11 font-semibold uppercase tracking-wider text-[10px]">
              <GraduationCap size={14} /> Meetup Questions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="log" className="space-y-10 mt-0">
            <Card className="border-none shadow-sm rounded-xl bg-card overflow-hidden">
              <CardContent className="p-8 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setCategory(cat.id)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-[10px] font-semibold uppercase tracking-wider transition-all flex items-center gap-2 border-2",
                          category === cat.id 
                            ? "bg-primary border-primary text-primary-foreground shadow-sm" 
                            : "bg-card border-border text-muted-foreground hover:border-border hover:text-foreground"
                        )}
                      >
                        <cat.icon size={14} />
                        {cat.id}
                      </button>
                    ))}
                  </div>

                  <div className="w-full md:w-64">
                    <Select 
                      value={selectedAppointmentId || "none"} 
                      onValueChange={(v) => setSelectedAppointmentId(v === "none" ? null : v)}
                    >
                      <SelectTrigger className="h-10 rounded-xl border-border bg-muted font-medium text-[10px] uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <LinkIcon size={14} className="text-muted-foreground/40" />
                          <SelectValue placeholder="Link to Session" />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-none shadow-sm p-2">
                        <SelectItem value="none" className="rounded-xl">Private (No Session)</SelectItem>
                        {appointments.map(app => (
                          <SelectItem key={app.id} value={app.id} className="rounded-xl">
                            {app.clients?.name} ({format(new Date(app.date), "MMM d")})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Textarea 
                  placeholder="Write your thoughts here. AI will automatically extract beliefs, identities, and goals for Identity Work..."
                  className="min-h-[200px] rounded-xl border-2 border-border focus:border-primary bg-card p-8 text-xl font-medium leading-relaxed shadow-inner resize-none transition-all"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />

                <div className="flex justify-end">
                  <Button 
                    onClick={handleSave} 
                    disabled={saving || !content.trim()}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-14 px-10 font-semibold text-xs uppercase tracking-wider shadow-sm"
                  >
                    {saving ? <Loader2 className="mr-2 animate-spin" /> : <Save size={18} className="mr-2" />}
                    Save & Analyze
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-6">
              {reflections.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3">
                    <BookOpen size={20} className="text-muted-foreground" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">No journal entries</h3>
                  <p className="text-xs text-muted-foreground max-w-[240px]">Start writing to capture your thoughts and reflections.</p>
                </div>
              ) : reflections.map((ref) => {
                const catInfo = CATEGORIES.find(c => c.id === ref.category) || CATEGORIES[0];
                const extractions = ref.ai_extractions || [];
                const isAnalyzing = analyzingIds.has(ref.id);
                const pendingExtractions = extractions.filter((e: any) => e.type !== 'question' && e.status !== 'added');

                return (
                  <Card key={ref.id} className="border-none shadow-md rounded-xl bg-card group hover:shadow-sm transition-all duration-500 overflow-hidden">
                    <CardContent className="p-8 space-y-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-sm", catInfo.bg, catInfo.color)}>
                            <catInfo.icon size={20} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="border-none font-semibold text-[10px] uppercase tracking-wider p-0 text-muted-foreground">
                                {ref.category}
                              </Badge>
                              {ref.appointments ? (
                                <Link to={`/appointments/${ref.appointments.id}`}>
                                  <Badge className="bg-primary text-primary-foreground border-none font-semibold text-[10px] uppercase tracking-wider px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5">
                                    <Zap size={10} className="fill-current" />
                                    Session: {ref.appointments.clients?.name}
                                  </Badge>
                                </Link>
                              ) : (
                                <Badge className="bg-muted text-muted-foreground border-none font-semibold text-[10px] uppercase tracking-wider px-3 py-1 rounded-full">
                                  Private Entry
                                </Badge>
                              )}
                            </div>
                            <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1 mt-1">
                              <Calendar size={10} /> {format(new Date(ref.created_at), "MMMM d, yyyy")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isAnalyzing ? (
                            <div className="flex items-center gap-2 px-4 py-2 bg-muted text-chart-primary rounded-xl font-semibold text-[10px] uppercase tracking-wider">
                              <Loader2 size={14} className="animate-spin" /> Analyzing...
                            </div>
                          ) : (
                            extractions.length === 0 && (
                              <Button variant="ghost" size="sm" onClick={() => handleAnalyze(ref)} className="h-9 px-4 rounded-xl text-chart-primary hover:bg-muted font-semibold text-[10px] uppercase tracking-wider">
                                <Wand2 size={14} className="mr-2" /> Extract Insights
                              </Button>
                            )
                          )}
                          <Button variant="ghost" size="icon" className="rounded-xl text-muted-foreground hover:text-chart-destructive opacity-0 group-hover:opacity-100 transition-all" onClick={() => setConfirmAction({callback: () => executeDeleteEntry(ref.id), title: "Delete Entry", description: "Delete this entry?"})}>
                            <Trash2 size={18} />
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-lg font-medium text-foreground leading-relaxed whitespace-pre-wrap">{ref.content}</p>

                      {extractions.length > 0 && (
                        <div className="pt-6 border-t border-border space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Sparkles size={14} className="text-muted-foreground" />
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Extracted Insights</p>
                            </div>
                            {pendingExtractions.length > 1 && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleAddAllToBacklog(ref.id)}
                                disabled={addingToBacklog === `all-${ref.id}`}
                                className="h-7 px-3 rounded-lg border-border text-chart-primary hover:bg-muted font-semibold text-[10px] uppercase tracking-wider"
                              >
                                {addingToBacklog === `all-${ref.id}` ? <Loader2 size={10} className="animate-spin mr-1.5" /> : <Layers size={10} className="mr-1.5" />}
                                Add All to Backlog
                              </Button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {extractions.map((item: any, i: number) => {
                              const tool = getToolRecommendation(item.type);
                              const isAddingThis = addingToBacklog === `${ref.id}-${i}`;

                              return (
                                <div key={i} className="flex items-center justify-between p-4 bg-muted rounded-xl border border-border group/item hover:border-border transition-all">
                                  <div className="flex items-center gap-4 min-w-0">
                                    <div className={cn(
                                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                                      item.type === 'question' ? "bg-chart-primary/10 text-chart-primary" :
                                      item.type === 'belief' ? "bg-chart-destructive/10 text-chart-destructive" : 
                                      item.type === 'alignment' ? "bg-muted text-chart-emerald" : 
                                      item.type === 'felt_sense' ? "bg-muted text-chart-primary" : "bg-muted text-muted-foreground"
                                    )}>
                                      {item.type === 'question' ? <HelpCircle size={18} /> : 
                                       item.type === 'belief' ? <ShieldAlert size={18} /> : 
                                       item.type === 'alignment' ? <Target size={18} /> : 
                                       item.type === 'felt_sense' ? <Wind size={18} /> : <Fingerprint size={18} />}
                                    </div>
                                    <div className="min-w-0">
                                      <p className={cn(
                                        "text-sm font-medium truncate",
                                        item.status === 'added' ? "text-muted-foreground line-through" : "text-foreground"
                                      )}>
                                        {item.content}
                                      </p>
                                      {tool && item.status !== 'added' && (
                                        <div className="flex items-center gap-1.5 mt-1">
                                          <span className={cn("text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md", tool.bg, tool.color)}>
                                            For {tool.label}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  {item.type !== 'question' && item.status !== 'added' && (
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={() => handleAddToBacklog(ref.id, item, i)}
                                      disabled={isAddingThis}
                                      className="h-9 px-3 rounded-xl text-chart-primary hover:bg-muted font-semibold text-[10px] uppercase tracking-wider"
                                    >
                                      {isAddingThis ? <Loader2 size={12} className="animate-spin mr-1.5" /> : <PlusCircle size={14} className="mr-1.5" />}
                                      Add
                                    </Button>
                                  )}
                                  {item.status === 'added' && (
                                    <Badge className="bg-primary text-primary-foreground border-none font-semibold text-[10px] uppercase tracking-wider px-3 py-1 rounded-full">
                                      <CheckCircle2 size={10} className="mr-1" /> Added
                                    </Badge>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="meetup" className="space-y-8 mt-0">
            <div className="grid grid-cols-1 gap-4">
              {pendingQuestions.map((q) => (
                <Card key={q.id} className="border-none shadow-md rounded-xl bg-card hover:shadow-sm transition-all duration-500 overflow-hidden group">
                  <CardContent className="p-8 space-y-6">
                    <div className="flex items-start justify-between gap-8">
                      <div className="flex items-start gap-6 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-muted text-chart-primary flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-all">
                          <HelpCircle size={24} />
                        </div>
                        <div className="space-y-2 min-w-0">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="border-none font-semibold text-[10px] uppercase tracking-wider p-0 text-muted-foreground">
                              {q.source}
                            </Badge>
                            {q.clientName && (
                              <Badge className="bg-muted text-muted-foreground border-none font-semibold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full">
                                Client: {q.clientName}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xl font-medium leading-tight text-foreground">
                            {q.content}
                          </p>
                          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                            Logged {format(new Date(q.date), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost"
                          size="icon"
                          onClick={() => setConfirmAction({callback: () => executeDeleteQuestion(q), title: "Delete Question", description: "Delete this question?"})}
                          className="h-11 w-11 rounded-xl text-muted-foreground hover:text-chart-destructive hover:bg-muted transition-all"
                        >
                          <Trash2 size={20} />
                        </Button>
                        <Button 
                          onClick={() => {
                            setRespondingToId(q.id);
                            setTempResponse("");
                          }}
                          className="rounded-xl h-11 px-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm font-semibold text-[10px] uppercase tracking-wider"
                        >
                          <MessageCircle size={14} className="mr-2" /> Add Response
                        </Button>
                      </div>
                    </div>

                    {respondingToId === q.id && (
                      <div className="pt-6 border-t border-border space-y-4 animate-in slide-in-from-top-2 duration-300">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-semibold uppercase tracking-wider text-chart-primary ml-1">Teacher's Response</Label>
                          <Textarea 
                            placeholder="Type the answer or insight from the teacher here..."
                            className="min-h-[120px] rounded-xl border-2 border-border focus:border-primary bg-muted/30 p-6 text-base font-medium leading-relaxed"
                            value={tempResponse}
                            onChange={(e) => setTempResponse(e.target.value)}
                            autoFocus
                          />
                        </div>
                        <div className="flex justify-end gap-3">
                          <Button variant="ghost" onClick={() => setRespondingToId(null)} className="rounded-xl h-10 px-4 font-medium text-xs">Cancel</Button>
                          <Button 
                            onClick={() => handleSaveResponse(q)}
                            disabled={!tempResponse.trim()}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-10 px-6 font-semibold text-[10px] uppercase tracking-wider shadow-sm"
                          >
                            Save & Archive
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {pendingQuestions.length === 0 && (
                <div className="text-center py-32 bg-muted rounded-xl border-2 border-dashed border-border">
                  <div className="w-20 h-20 bg-card rounded-xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <CheckCircle2 size={40} className="text-chart-emerald" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">All questions answered!</h3>
                  <p className="text-muted-foreground mt-2">You're fully prepped for your next meetup.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        )}
      </div>

      <ConfirmDialog
        open={confirmAction !== null}
        onOpenChange={(open) => { if (!open) setConfirmAction(null); }}
        title={confirmAction?.title ?? ""}
        description={confirmAction?.description}
        onConfirm={() => {
          confirmAction?.callback();
          setConfirmAction(null);
        }}
      />
    </AppLayout>
  );
};

export default JournalPage;