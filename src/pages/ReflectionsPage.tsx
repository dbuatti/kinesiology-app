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
  Calendar
} from "lucide-react";
import { format } from "date-fns";
import { showSuccess, showError } from "@/utils/toast";
import AppLayout from "@/components/crm/AppLayout";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { id: 'General', icon: MessageSquare, color: 'text-slate-500', bg: 'bg-slate-50' },
  { id: 'Meetup Question', icon: HelpCircle, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { id: 'Doubt', icon: Brain, color: 'text-rose-600', bg: 'bg-rose-50' },
  { id: 'Reflection', icon: Sparkles, color: 'text-amber-600', bg: 'bg-amber-50' },
];

const ReflectionsPage = () => {
  const [reflections, setReflections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("General");

  const fetchReflections = async () => {
    try {
      const { data, error } = await supabase
        .from('practitioner_reflections')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReflections(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReflections();
  }, []);

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('practitioner_reflections')
        .insert({
          user_id: user.id,
          content: content.trim(),
          category
        });

      if (error) throw error;

      showSuccess("Reflection saved to your log.");
      setContent("");
      fetchReflections();
    } catch (err: any) {
      showError(err.message);
    } finally {
      setSaving(false);
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
            <div className="grid grid-cols-1 gap-4">
              {reflections.map((ref) => {
                const catInfo = CATEGORIES.find(c => c.id === ref.category) || CATEGORIES[0];
                return (
                  <Card key={ref.id} className="border-none shadow-md rounded-[2rem] bg-white group hover:shadow-xl transition-all duration-500">
                    <CardContent className="p-8 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-sm", catInfo.bg, catInfo.color)}>
                            <catInfo.icon size={20} />
                          </div>
                          <div>
                            <Badge variant="outline" className="border-none font-black text-[8px] uppercase tracking-widest p-0 text-slate-400">
                              {ref.category}
                            </Badge>
                            <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                              <Calendar size={10} /> {format(new Date(ref.created_at), "MMMM d, yyyy • h:mm a")}
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="rounded-xl text-slate-200 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all"
                          onClick={() => handleDelete(ref.id)}
                        >
                          <Trash2 size={18} />
                        </Button>
                      </div>
                      <p className="text-lg font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {ref.content}
                      </p>
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