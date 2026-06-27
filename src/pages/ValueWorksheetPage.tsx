
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AppLayout from '@/components/crm/AppLayout';
import {
  ChevronLeft,
  Plus,
  FileText,
  Trash2,
  Sparkles,
  Loader2,
  Calendar,
  Clock
} from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import WhereYourValueBeginsWorksheet from "@/components/worksheets/WhereYourValueBeginsWorksheet";

const ValueWorksheetPage = () => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const fetchSubmissions = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from('value_worksheet_submissions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setSubmissions(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchSubmissions(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this worksheet?")) return;
    await supabase.from('value_worksheet_submissions').delete().eq('id', id);
    toast.success("Deleted.");
    fetchSubmissions();
  };

  const getResponseCount = (formData: any) => {
    if (!formData) return 0;
    return Object.values(formData).filter(v => v !== '' && !(Array.isArray(v) && v.length === 0)).length;
  };

  if (selectedId || isCreating) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <WhereYourValueBeginsWorksheet
            submissionId={selectedId}
            onBack={() => { setSelectedId(null); setIsCreating(false); fetchSubmissions(); }}
          />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate(-1)} className="h-9 w-9 rounded-xl">
              <ChevronLeft size={18} />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-indigo-500" />
                <h1 className="text-xl font-bold text-slate-900">Where Your Value Begins</h1>
              </div>
              <p className="text-sm text-slate-500">Neuro Pro Mastery · Value & Self-Worth</p>
            </div>
          </div>
          <Button onClick={() => setIsCreating(true)} className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md">
            <Plus size={16} className="mr-2" /> New Reflection
          </Button>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
          </div>
        ) : submissions.length === 0 ? (
          <Card className="rounded-2xl border-dashed border-slate-300 bg-slate-50/50">
            <CardContent className="flex flex-col items-center gap-4 py-20">
              <Sparkles size={40} className="text-slate-300" />
              <div className="text-center">
                <h3 className="text-lg font-semibold text-slate-700">No reflections yet</h3>
                <p className="text-sm text-slate-500 mt-1">Begin exploring your relationship with value and self-worth.</p>
              </div>
              <Button onClick={() => setIsCreating(true)} className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md mt-2">
                <Plus size={16} className="mr-2" /> Start Your First Reflection
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {submissions.map(sub => (
              <Card
                key={sub.id}
                className="rounded-2xl border-slate-200 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer group"
                onClick={() => setSelectedId(sub.id)}
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm">
                        <FileText size={18} className="text-white" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-slate-900 truncate">{sub.title}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1 text-[11px] text-slate-500">
                            <Calendar size={11} />
                            {format(new Date(sub.created_at), "MMM d, yyyy")}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-slate-500">
                            <Clock size={11} />
                            {format(new Date(sub.created_at), "h:mm a")}
                          </span>
                          <Badge variant="outline" className="text-[10px] border-slate-200 text-slate-400 font-medium">
                            {getResponseCount(sub.form_data)} responses
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(sub.id)}
                        className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default ValueWorksheetPage;
