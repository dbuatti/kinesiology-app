
import React, { useState, useEffect } from 'react';
import AngerFlowWorksheet from '@/components/worksheets/AngerFlowWorksheet';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Plus, History, Calendar, ArrowRight, Loader2, RefreshCw, Trash2, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/crm/AppLayout';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { showSuccess, showError } from "@/utils/toast";

const AngerFlowWorksheetPage = () => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase.from('anger_flow_submissions').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setSubmissions(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSubmissions(); }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Delete this entry?")) return;
    try {
      await supabase.from('anger_flow_submissions').delete().eq('id', id);
      showSuccess("Entry deleted.");
      fetchSubmissions();
    } catch (err) {
      showError("Failed to delete.");
    }
  };

  if (selectedId || isCreating) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto pt-6 print:hidden">
          <Button variant="ghost" onClick={() => { setSelectedId(null); setIsCreating(false); fetchSubmissions(); }} className="flex items-center gap-2 text-slate-600">
            <ChevronLeft className="w-4 h-4" /> Back to History
          </Button>
        </div>
        <AngerFlowWorksheet submissionId={selectedId} onBack={() => { setSelectedId(null); setIsCreating(false); fetchSubmissions(); }} />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/resources')} className="flex items-center gap-2 text-slate-600">
            <ChevronLeft className="w-4 h-4" /> Back to Resources
          </Button>
          <Button onClick={() => setIsCreating(true)} className="bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold shadow-lg">
            <Plus size={18} className="mr-2" /> New Reflection
          </Button>
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Anger & Flow</h1>
          <p className="text-slate-500 font-medium text-lg">Week 8: Reclaiming expression and self-acceptance.</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading History...</p>
          </div>
        ) : submissions.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {submissions.map((sub) => (
              <Card key={sub.id} onClick={() => setSelectedId(sub.id)} className="border-none shadow-md hover:shadow-xl transition-all cursor-pointer group rounded-[2rem] overflow-hidden bg-white">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FileText size={24} />
                    </div>
                    <div>
                      <h3 className="font-black text-lg text-slate-900 group-hover:text-emerald-600 transition-colors">{sub.title || 'Untitled Reflection'}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400"><Calendar size={14} /> {format(new Date(sub.created_at), "MMM d, yyyy")}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="rounded-xl text-slate-300 hover:text-rose-600 opacity-0 group-hover:opacity-100" onClick={(e) => handleDelete(e, sub.id)}><Trash2 size={18} /></Button>
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-600 group-hover:text-white transition-all"><ArrowRight size={20} /></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
            <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-emerald-300"><RefreshCw size={40} /></div>
            <h3 className="text-xl font-black text-slate-900">No reflections yet</h3>
            <p className="text-slate-500 mt-2 mb-8 max-w-xs mx-auto">Start your Week 8 awareness exercise to begin tracking your transition into flow.</p>
            <Button onClick={() => setIsCreating(true)} className="bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold h-12 px-8">Create First Entry</Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default AngerFlowWorksheetPage;