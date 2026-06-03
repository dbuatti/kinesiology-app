"use client";

import React, { useState, useEffect, useMemo } from "react";
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
import Breadcrumbs from "@/components/shared/Breadcrumbs";
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
  { id: 'General', icon: Lock, color: 'text-slate-500', bg: 'bg-slate-50' },
  { id: 'Meetup Question', icon: HelpCircle, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { id: 'Doubt', icon: Brain, color: 'text-rose-600', bg: 'bg-rose-50' },
  { id: 'Reflection', icon: Sparkles, color: 'text-amber-600', bg: 'bg-amber-50' },
];

const JournalPage = () => {
  const location = useLocation();
  const preselectedAppId = location.state?.appointmentId;

  const [activeTab, setActiveTab] = useState("log");
  const [reflections, setReflections] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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

  const fetchData = async () => {
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
    } catch (err) {
      console.error(err);
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
        showSuccess(`Added ${totalAdded} items to Sandbox Backlog.`);
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

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    try {
      await supabase.from('practitioner_reflections').delete().eq('id', id);
      fetchData();
      showSuccess("Entry removed.");
    } catch (err) {
      showError("Failed to delete.");
    }
  };

  const handleDeleteQuestion = async (question: any) => {
    if (!confirm("Delete this question?")) return;

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
      case 'belief': return { label: 'Limiting Beliefs', icon: ShieldAlert, color: 'text-rose-600', bg: 'bg-rose-50' };
      case 'shifting': return { label: 'Identity Shifting', icon: Fingerprint, color: 'text-indigo-600', bg: 'bg-indigo-50' };
      case 'alignment': return { label: 'Identity Alignment', icon: Target, color: 'text-emerald-600', bg: 'bg-emerald-50' };
      case 'felt_sense': return { label: 'Somatic Tracking', icon: Wind, color: 'text-blue-600', bg: 'bg-blue-50' };
      default: return null;
    }
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-700">
        <PageHeader 
          title="Practitioner Journal"
          subtitle="Private reflections and session-linked insights for clinical growth."
          icon={MessageSquare}
          breadcrumbs={[{ label: "Practice Lab", path: "/lab" }, { label: "Journal" }]}
          actions={
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={handleScanAll}
                disabled={isScanning || reflections.length === 0}
                className="rounded-xl h-12 px-6 font-bold text-xs uppercase tracking-widest border-indigo-100 text-indigo-600 hover:bg-indigo-50"
              >
                {isScanning ? <Loader2 className="animate-spin mr-2" /> : <Wand2 size={18} className="mr-2" />}
                Scan All
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleAddAllToBacklog()}
                disabled={isAddingAll || reflections.length === 0}
                className="rounded-xl h-12 px-6 font-bold text-xs uppercase tracking-widest border-emerald-100 text-emerald-600 hover:bg-emerald-50"
              >
                {isAddingAll ? <Loader2 className="animate-spin mr-2" /> : <Layers size={18} className="mr-2" />}
                Add All to Backlog
              </Button>
            </div>
          }
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-14 bg-slate-200/50 p-1.5 rounded-2xl mb-8">
            <TabsTrigger value="log" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm rounded-xl h-11 font-black uppercase tracking-wider text-[10px]">
              <BookOpen size={14} /> Journal Log
            </TabsTrigger>
            <TabsTrigger value="meetup" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm rounded-xl h-11 font-black uppercase tracking-wider text-[10px]">
              <GraduationCap size={14} /> Meetup Questions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="log" className="space-y-10 mt-0">
            <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
              <CardContent className="p-8 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setCategory(cat.id)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border-2",
                          category === cat.id 
                            ? "bg-slate-900 border-slate-900 text-white shadow-lg" 
                            : "bg-white border-slate-100 text-slate-400 hover:border-indigo-200 hover:text-indigo-600"
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
                      <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-slate-50 font-bold text-[10px] uppercase tracking-widest">
                        <div className="flex items-center gap-2">
                          <LinkIcon size={14} className="text-indigo-50" />
                          <SelectValue placeholder="Link to Session" />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
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
                  placeholder="Write your thoughts here. AI will automatically extract beliefs, identities, and goals for your Sandbox..."
                  className="min-h-[200px] rounded-[2rem] border-2 border-slate-100 focus:border-indigo-500 bg-white p-8 text-xl font-medium leading-relaxed shadow-inner resize-none transition-all"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />

                <div className="flex justify-end">
                  <Button 
                    onClick={handleSave} 
                    disabled={saving || !content.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-14 px-10 font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100"
                  >
                    {saving ? <Loader2 className="mr-2 animate-spin" /> : <Save size={18} className="mr-2" />}
                    Save & Analyze
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-6">
              {reflections.map((ref) => {
                const catInfo = CATEGORIES.find(c => c.id === ref.category) || CATEGORIES[0];
                const extractions = ref.ai_extractions || [];
                const isAnalyzing = analyzingIds.has(ref.id);
                const pendingExtractions = extractions.filter((e: any) => e.type !== 'question' && e.status !== 'added');

                return (
                  <Card key={ref.id} className="border-none shadow-md rounded-[2rem] bg-white group hover:shadow-xl transition-all duration-500 overflow-hidden">
                    <CardContent className="p-8 space-y-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-sm", catInfo.bg, catInfo.color)}>
                            <catInfo.icon size={20} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="border-none font-black text-[8px] uppercase tracking-widest p-0 text-slate-400">
                                {ref.category}
                              </Badge>
                              {ref.appointments ? (
                                <Link to={`/appointments/${ref.appointments.id}`}>
                                  <Badge className="bg-indigo-600 text-white border-none font-black text-[8px] uppercase tracking-widest px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5">
                                    <Zap size={10} className="fill-current" />
                                    Session: {ref.appointments.clients?.name}
                                  </Badge>
                                </Link>
                              ) : (
                                <Badge className="bg-slate-100 text-slate-500 border-none font-black text-[8px] uppercase tracking-widest px-3 py-1 rounded-full">
                                  Private Entry
                                </Badge>
                              )}
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-1">
                              <Calendar size={10} /> {format(new Date(ref.created_at), "MMMM d, yyyy")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isAnalyzing ? (
                            <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-black text-[10px] uppercase tracking-widest">
                              <Loader2 size={14} className="animate-spin" /> Analyzing...
                            </div>
                          ) : (
                            extractions.length === 0 && (
                              <Button variant="ghost" size="sm" onClick={() => handleAnalyze(ref)} className="h-9 px-4 rounded-xl text-indigo-600 hover:bg-indigo-50 font-black text-[10px] uppercase tracking-widest">
                                <Wand2 size={14} className="mr-2" /> Extract Insights
                              </Button>
                            )
                          )}
                          <Button variant="ghost" size="icon" className="rounded-xl text-slate-200 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all" onClick={() => handleDelete(ref.id)}>
                            <Trash2 size={18} />
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-lg font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">{ref.content}</p>

                      {extractions.length > 0 && (
                        <div className="pt-6 border-t border-slate-100 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Sparkles size={14} className="text-amber-500" />
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Extracted Sandbox Insights</p>
                            </div>
                            {pendingExtractions.length > 1 && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleAddAllToBacklog(ref.id)}
                                disabled={addingToBacklog === `all-${ref.id}`}
                                className="h-7 px-3 rounded-lg border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-black text-[10px] uppercase tracking-widest"
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
                                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group/item hover:border-indigo-200 transition-all">
                                  <div className="flex items-center gap-4 min-w-0">
                                    <div className={cn(
                                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                                      item.type === 'question' ? "bg-indigo-50 text-indigo-700" :
                                      item.type === 'belief' ? "bg-rose-50 text-rose-700" : 
                                      item.type === 'alignment' ? "bg-emerald-50 text-emerald-600" : 
                                      item.type === 'felt_sense' ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-600"
                                    )}>
                                      {item.type === 'question' ? <HelpCircle size={18} /> : 
                                       item.type === 'belief' ? <ShieldAlert size={18} /> : 
                                       item.type === 'alignment' ? <Target size={18} /> : 
                                       item.type === 'felt_sense' ? <Wind size={18} /> : <Fingerprint size={18} />}
                                    </div>
                                    <div className="min-w-0">
                                      <p className={cn(
                                        "text-sm font-bold truncate",
                                        item.status === 'added' ? "text-slate-400 line-through" : "text-slate-900"
                                      )}>
                                        {item.content}
                                      </p>
                                      {tool && item.status !== 'added' && (
                                        <div className="flex items-center gap-1.5 mt-1">
                                          <span className={cn("text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md", tool.bg, tool.color)}>
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
                                      className="h-9 px-3 rounded-xl text-indigo-600 hover:bg-indigo-100 font-black text-[9px] uppercase tracking-widest"
                                    >
                                      {isAddingThis ? <Loader2 size={12} className="animate-spin mr-1.5" /> : <PlusCircle size={14} className="mr-1.5" />}
                                      Add
                                    </Button>
                                  )}
                                  {item.status === 'added' && (
                                    <Badge className="bg-emerald-500 text-white border-none font-black text-[8px] uppercase tracking-widest px-3 py-1 rounded-full">
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
                <Card key={q.id} className="border-none shadow-md rounded-[2rem] bg-white hover:shadow-xl transition-all duration-500 overflow-hidden group">
                  <CardContent className="p-8 space-y-6">
                    <div className="flex items-start justify-between gap-8">
                      <div className="flex items-start gap-6 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-all">
                          <HelpCircle size={24} />
                        </div>
                        <div className="space-y-2 min-w-0">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="border-none font-black text-[8px] uppercase tracking-widest p-0 text-slate-400">
                              {q.source}
                            </Badge>
                            {q.clientName && (
                              <Badge className="bg-slate-100 text-slate-500 border-none font-black text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-full">
                                Client: {q.clientName}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xl font-bold leading-tight text-slate-900">
                            {q.content}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Logged {format(new Date(q.date), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteQuestion(q)}
                          className="h-11 w-11 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all"
                        >
                          <Trash2 size={20} />
                        </Button>
                        <Button 
                          onClick={() => {
                            setRespondingToId(q.id);
                            setTempResponse("");
                          }}
                          className="rounded-xl h-11 px-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 font-black text-[10px] uppercase tracking-widest"
                        >
                          <MessageCircle size={14} className="mr-2" /> Add Response
                        </Button>
                      </div>
                    </div>

                    {respondingToId === q.id && (
                      <div className="pt-6 border-t border-slate-100 space-y-4 animate-in slide-in-from-top-2 duration-300">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-indigo-600 ml-1">Teacher's Response</Label>
                          <Textarea 
                            placeholder="Type the answer or insight from the teacher here..."
                            className="min-h-[120px] rounded-2xl border-2 border-indigo-100 focus:border-indigo-500 bg-indigo-50/30 p-6 text-base font-medium leading-relaxed"
                            value={tempResponse}
                            onChange={(e) => setTempResponse(e.target.value)}
                            autoFocus
                          />
                        </div>
                        <div className="flex justify-end gap-3">
                          <Button variant="ghost" onClick={() => setRespondingToId(null)} className="rounded-xl h-10 px-4 font-bold text-xs">Cancel</Button>
                          <Button 
                            onClick={() => handleSaveResponse(q)}
                            disabled={!tempResponse.trim()}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 px-6 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-100"
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
                <div className="text-center py-32 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                  <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <CheckCircle2 size={40} className="text-emerald-500" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900">All questions answered!</h3>
                  <p className="text-slate-500 mt-2">You're fully prepped for your next meetup.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default JournalPage;