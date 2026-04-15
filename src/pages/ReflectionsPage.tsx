"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  CheckCircle2
} from "lucide-react";
import { format } from "date-fns";
import { showSuccess, showError } from "@/utils/toast";
import AppLayout from "@/components/crm/AppLayout";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link, useLocation } from "react-router-dom";

const CATEGORIES = [
  { id: 'General', icon: MessageSquare, color: 'text-slate-500', bg: 'bg-slate-50' },
  { id: 'Meetup Question', icon: HelpCircle, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { id: 'Doubt', icon: Brain, color: 'text-rose-600', bg: 'bg-rose-50' },
  { id: 'Reflection', icon: Sparkles, color: 'text-amber-600', bg: 'bg-amber-50' },
];

const ReflectionsPage = () => {
  const location = useLocation();
  const preselectedAppId = location.state?.appointmentId;

  const [reflections, setReflections] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("General");
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(preselectedAppId || null);
  
  // AI Analysis State
  const [analyzingIds, setAnalyzingIds] = useState<Set<string>>(new Set());
  const [addingToBacklog, setAddingToBacklog] = useState<string | null>(null);

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

      showSuccess("Reflection saved. Analyzing for insights...");
      setContent("");
      setSelectedAppointmentId(null);
      
      // Trigger background analysis immediately
      if (data) {
        handleAnalyze(data);
      }
      
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

      if (error) {
        // Try to parse the error message from the function response
        let errorMsg = "AI Analysis failed.";
        try {
          const body = await error.context.json();
          errorMsg = body.details || body.error || errorMsg;
        } catch (e) {}
        
        showError(errorMsg);
        console.error("Analysis error:", error);
        return;
      }

      if (data?.extractions && data.extractions.length > 0) {
        // Persist the extractions to the database
        await supabase
          .from('practitioner_reflections')
          .update({ ai_extractions: data.extractions })
          .eq('id', reflection.id);
        
        // Refresh local state to show the new items
        setReflections(prev => prev.map(r => 
          r.id === reflection.id ? { ...r, ai_extractions: data.extractions } : r
        ));
        
        showSuccess(`AI found ${data.extractions.length} potential identities/beliefs.`);
      } else {
        showSuccess("Analysis complete: No specific identities or beliefs detected.");
      }
    } catch (err: any) {
      console.error("Background analysis failed:", err);
      showError("An unexpected error occurred during analysis.");
    } finally {
      setAnalyzingIds(prev => {
        const next = new Set(prev);
        next.delete(reflection.id);
        return next;
      });
    }
  };

  const handleAddToBacklog = async (reflectionId: string, item: any) => {
    setAddingToBacklog(`${reflectionId}-${item.content}`);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('identity_backlog')
        .insert({
          user_id: user.id,
          content: item.content,
          type: item.type,
          status: 'pending'
        });

      if (error) throw error;

      showSuccess(`"${item.content}" added to your Sandbox Backlog.`);
      
      // Update the local reflection state to remove the item from the "suggested" list
      setReflections(prev => prev.map(r => {
        if (r.id === reflectionId) {
          return {
            ...r,
            ai_extractions: r.ai_extractions.filter((i: any) => i.content !== item.content)
          };
        }
        return r;
      }));

      // Also update the DB to reflect it's been handled
      const reflection = reflections.find(r => r.id === reflectionId);
      if (reflection) {
        const remaining = reflection.ai_extractions.filter((i: any) => i.content !== item.content);
        await supabase
          .from('practitioner_reflections')
          .update({ ai_extractions: remaining })
          .eq('id', reflectionId);
      }

    } catch (err: any) {
      showError(err.message);
    } finally {
      setAddingToBacklog(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this reflection?")) return;
    try {
      const { error } = await supabase
        .from('practitioner_reflections')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setReflections(reflections.filter(r => r.id !== id));
      showSuccess("Reflection removed.");
    } catch (err) {
      showError("Failed to delete.");
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-700">
        <Breadcrumbs items={[{ label: "Practitioner Log" }]} />

        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Practitioner Reflections</h1>
          <p className="text-slate-500 font-medium text-lg">A private space to process sessions, prep for meetups, and express doubts.</p>
        </div>

        {/* Input Section */}
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
                      <LinkIcon size={14} className="text-indigo-500" />
                      <SelectValue placeholder="Link to Session" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                    <SelectItem value="none" className="rounded-xl">No Session Linked</SelectItem>
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
              placeholder="What's on your mind? Post-session thoughts, questions for the next meetup, or clinical doubts..."
              className="min-h-[200px] rounded-[2rem] border-2 border-slate-100 focus:border-indigo-500 p-8 text-xl font-medium leading-relaxed shadow-inner resize-none"
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
                Save to Log
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* History Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <History size={24} className="text-indigo-500" /> Your Log History
            </h2>
            <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-none font-black">
              {reflections.length} Entries
            </Badge>
          </div>

          {loading ? (
            <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>
          ) : reflections.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {reflections.map((ref) => {
                const catInfo = CATEGORIES.find(c => c.id === ref.category) || CATEGORIES[0];
                const linkedApp = ref.appointments;
                const currentExtractions = ref.ai_extractions || [];
                const isAnalyzing = analyzingIds.has(ref.id);

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
                              {linkedApp && (
                                <Link to={`/appointments/${linkedApp.id}`}>
                                  <Badge className="bg-indigo-50 text-indigo-600 border-none font-black text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-md hover:bg-indigo-100 transition-colors">
                                    <LinkIcon size={8} className="mr-1" /> {linkedApp.clients?.name}
                                  </Badge>
                                </Link>
                              )}
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                              <Calendar size={10} /> {format(new Date(ref.created_at), "MMMM d, yyyy • h:mm a")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isAnalyzing ? (
                            <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-black text-[10px] uppercase tracking-widest">
                              <Loader2 size={14} className="animate-spin" />
                              Analyzing...
                            </div>
                          ) : (
                            currentExtractions.length === 0 && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleAnalyze(ref)}
                                className="h-9 px-4 rounded-xl text-indigo-600 hover:bg-indigo-50 font-black text-[10px] uppercase tracking-widest"
                              >
                                <Wand2 size={14} className="mr-2" />
                                PULL Insights
                              </Button>
                            )
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="rounded-xl text-slate-200 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all"
                            onClick={() => handleDelete(ref.id)}
                          >
                            <Trash2 size={18} />
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-lg font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {ref.content}
                      </p>

                      {/* AI Extractions Display */}
                      {currentExtractions.length > 0 && (
                        <div className="pt-6 border-t border-slate-100 space-y-4 animate-in slide-in-from-top-2 duration-500">
                          <div className="flex items-center gap-2">
                            <Sparkles size={14} className="text-amber-500" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Extracted for Backlog</p>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {currentExtractions.map((item: any, i: number) => (
                              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group/item">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className={cn(
                                    "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                                    item.type === 'identity' ? "bg-indigo-100 text-indigo-600" : "bg-rose-100 text-rose-700"
                                  )}>
                                    {item.type === 'identity' ? <Fingerprint size={14} /> : <ShieldAlert size={14} />}
                                  </div>
                                  <p className="text-xs font-bold text-slate-700 truncate">"{item.content}"</p>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  disabled={addingToBacklog === `${ref.id}-${item.content}`}
                                  onClick={() => handleAddToBacklog(ref.id, item)}
                                  className="h-7 px-2 rounded-lg text-indigo-600 hover:bg-indigo-100 font-black text-[8px] uppercase tracking-widest"
                                >
                                  {addingToBacklog === `${ref.id}-${item.content}` ? <Loader2 size={10} className="animate-spin" /> : <PlusCircle size={10} className="mr-1" />}
                                  Add to Backlog
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-32 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <MessageSquare size={40} className="text-slate-200" />
              </div>
              <h3 className="text-xl font-black text-slate-900">Your log is empty</h3>
              <p className="text-slate-500 mt-2">Start capturing your clinical journey above.</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default ReflectionsPage;