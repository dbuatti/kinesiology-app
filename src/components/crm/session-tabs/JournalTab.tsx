
import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  MessageSquare, 
  Sparkles, 
  Save, 
  Loader2, 
  History, 
  Brain, 
  Zap, 
  Target, 
  ShieldAlert, 
  Wind,
  CheckCircle2,
  Wand2,
  Trash2,
  ExternalLink
} from "lucide-react";
import { format } from "date-fns";
import { showSuccess, showError } from "@/utils/toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface JournalTabProps {
  appointmentId: string;
  clientName: string;
}

const JournalTab = ({ appointmentId, clientName }: JournalTabProps) => {
  const [reflections, setReflections] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  const fetchReflections = async () => {
    try {
      const { data, error } = await supabase
        .from('practitioner_reflections')
        .select('*')
        .eq('appointment_id', appointmentId)
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
  }, [appointmentId]);

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
          category: 'Reflection',
          appointment_id: appointmentId
        })
        .select()
        .single();

      if (error) throw error;

      showSuccess("Reflection saved. Analysing...");
      setContent("");
      if (data) handleAnalyze(data);
      fetchReflections();
    } catch (err: any) {
      showError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAnalyze = async (reflection: any) => {
    setAnalyzingId(reflection.id);
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
        
        fetchReflections();
      }
    } catch (err) {
      console.error("AI Analysis failed:", err);
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this reflection?")) return;
    try {
      await supabase.from('practitioner_reflections').delete().eq('id', id);
      setReflections(prev => prev.filter(r => r.id !== id));
      showSuccess("Reflection removed.");
    } catch (err) {
      showError("Failed to delete.");
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-sm">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-xl font-medium text-foreground">Practitioner Reflection</h2>
              <p className="text-xs text-muted-foreground font-medium">Private insights for this session with {clientName}.</p>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild className="rounded-xl h-10 px-4 font-bold text-[10px] uppercase tracking-widest border-indigo-100 text-indigo-600 hover:bg-indigo-50">
            <Link to="/practice/journal">
              <ExternalLink size={14} className="mr-2" /> View Full Journal
            </Link>
          </Button>
        </div>

        <Card className="border-none shadow-sm rounded-xl bg-card overflow-hidden">
          <CardContent className="p-8 space-y-4">
            <Textarea 
              placeholder="What did you notice? Any doubts, breakthroughs, or patterns for Identity Work?"
              className="min-h-[150px] rounded-xl border-2 border-border focus:border-indigo-500 p-6 text-lg font-medium leading-relaxed shadow-inner resize-none"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <div className="flex justify-between items-center">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Brain size={14} className="text-indigo-400" /> AI will extract identity insights automatically
              </p>
              <Button 
                onClick={handleSave} 
                disabled={saving || !content.trim()}
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl h-12 px-8 font-medium text-[10px] uppercase tracking-wider shadow-sm"
              >
                {saving ? <Loader2 className="mr-2 animate-spin" /> : <Save size={18} className="mr-2" />}
                Log Reflection
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-2">
            <History size={16} /> Session Journal History
          </h3>
          <Badge variant="secondary" className="bg-slate-100 text-muted-foreground border-none font-bold">
            {reflections.length} Entries
          </Badge>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-indigo-500" /></div>
        ) : reflections.length > 0 ? (
          <div className="space-y-4">
            {reflections.map((ref) => (
              <Card key={ref.id} className="border-none shadow-sm rounded-xl bg-card group hover:shadow-md transition-all">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-medium text-indigo-600 uppercase tracking-widest">
                        {format(new Date(ref.created_at), "MMM d, yyyy • h:mm a")}
                      </span>
                      {analyzingId === ref.id && (
                        <Badge className="bg-indigo-50 text-indigo-600 border-none animate-pulse">
                          <Loader2 size={10} className="mr-1 animate-spin" /> Analyzing
                        </Badge>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-200 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all" onClick={() => handleDelete(ref.id)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                  
                  <p className="text-sm font-medium text-slate-700 leading-relaxed italic">"{ref.content}"</p>

                  {ref.ai_extractions?.length > 0 && (
                    <div className="pt-4 border-t border-slate-50 flex flex-wrap gap-2">
                      {ref.ai_extractions.map((ext: any, i: number) => (
                        <Badge key={i} variant="outline" className={cn(
                          "text-[8px] font-medium uppercase tracking-widest px-2 py-0.5 rounded-md border-none",
                          ext.type === 'belief' ? "bg-rose-50 text-rose-600" :
                          ext.type === 'shifting' ? "bg-indigo-50 text-indigo-600" :
                          ext.type === 'alignment' ? "bg-emerald-50 text-emerald-600" : "bg-muted text-muted-foreground"
                        )}>
                          {ext.type}: {ext.content}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-muted rounded-xl border-2 border-dashed border-border">
            <p className="text-sm text-muted-foreground font-medium">No reflections logged for this session yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default JournalTab;