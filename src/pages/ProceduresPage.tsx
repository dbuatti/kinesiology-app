import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Target, Plus, TrendingUp, Loader2, 
  FlaskConical, Brain, Activity, Zap, Footprints, 
  Scale, Hand, Heart, Move, Wind, Droplets 
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";
import MusclePracticeStats from "@/components/crm/MusclePracticeStats";
import { fetchLatestProcedureScores, LatestProcedureScores } from "@/utils/procedure-stats";
import ProcedureCard from "@/components/crm/ProcedureCard";
import Breadcrumbs from "@/components/crm/Breadcrumbs";
import { Progress } from "@/components/ui/progress";

const ICON_OPTIONS = [
  { value: 'flask', label: 'Flask', icon: FlaskConical },
  { value: 'brain', label: 'Brain', icon: Brain },
  { value: 'activity', label: 'Activity', icon: Activity },
  { value: 'zap', label: 'Zap', icon: Zap },
  { value: 'target', label: 'Target', icon: Target },
  { value: 'footprints', label: 'Footprints', icon: Footprints },
  { value: 'scale', label: 'Scale', icon: Scale },
  { value: 'hand', label: 'Hand', icon: Hand },
  { value: 'heart', label: 'Heart', icon: Heart },
  { value: 'move', label: 'Move', icon: Move },
  { value: 'wind', label: 'Wind', icon: Wind },
  { value: 'droplets', label: 'Droplets', icon: Droplets },
];

const ProceduresPage = () => {
  const [procedures, setProcedures] = useState<any[]>([]);
  const [latestScores, setLatestScores] = useState<LatestProcedureScores>({ bolt_score: null, coherence_score: null });
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    target_count: 5,
    icon: 'target'
  });

  const fetchProcedures = async () => {
    try {
      const [procedureData, scoreData] = await Promise.all([
        supabase.from('procedures').select('*').order('created_at', { ascending: false }),
        fetchLatestProcedureScores()
      ]);
      if (procedureData.error) throw procedureData.error;
      setProcedures(procedureData.data || []);
      setLatestScores(scoreData);
    } catch (err) {
      showError("Failed to load procedures");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEnabled = async (id: string, currentEnabled: boolean) => {
    try {
      const { error } = await supabase.from('procedures').update({ enabled: !currentEnabled }).eq('id', id);
      if (error) throw error;
      showSuccess(currentEnabled ? "Procedure disabled" : "Procedure enabled");
      fetchProcedures();
    } catch (err: any) {
      showError(err.message || "Failed to update procedure");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const payload = {
        user_id: user.id,
        name: formData.name,
        description: formData.description,
        target_count: formData.target_count,
        icon: formData.icon,
      };

      if (editingProcedure) {
        const { error } = await supabase.from('procedures').update(payload).eq('id', editingProcedure.id);
        if (error) throw error;
        showSuccess("Procedure updated");
      } else {
        const { error } = await supabase.from('procedures').insert({ ...payload, current_count: 0, enabled: true });
        if (error) throw error;
        showSuccess("Procedure added");
      }

      setDialogOpen(false);
      setEditingProcedure(null);
      setFormData({ name: '', description: '', target_count: 5, icon: 'target' });
      fetchProcedures();
    } catch (err: any) {
      showError(err.message || "Failed to save procedure");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      const { error } = await supabase.from('procedures').delete().eq('id', id);
      if (error) throw error;
      showSuccess("Procedure deleted");
      fetchProcedures();
    } catch (err: any) {
      showError("Failed to delete procedure");
    }
  };

  useEffect(() => { fetchProcedures(); }, []);

  const enabledProcedures = procedures.filter(p => p.enabled);
  const completedCount = enabledProcedures.filter(p => p.current_count >= p.target_count).length;
  const totalProgress = enabledProcedures.length > 0 
    ? Math.round((enabledProcedures.reduce((sum, p) => sum + Math.min(p.current_count, p.target_count), 0) / 
        enabledProcedures.reduce((sum, p) => sum + p.target_count, 0)) * 100)
    : 0;

  if (loading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={48} /></div>;

  return (
    <div className="p-4 md:p-8 max-w-full mx-auto space-y-8">
      <Breadcrumbs items={[{ label: "Procedures" }]} />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Procedure Tracker</h1>
          <p className="text-slate-500 font-medium mt-1">Monitor your clinical mastery and protocol consistency.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingProcedure(null); }}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 rounded-2xl h-12 px-8 font-black text-xs uppercase tracking-widest">
              <Plus size={20} className="mr-2" /> Add Procedure
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-[2rem]">
            <DialogHeader><DialogTitle className="text-2xl font-black">{editingProcedure ? 'Edit Procedure' : 'Add New Procedure'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Procedure Name</Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., BOLT Test" required className="h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Description</Label>
                <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Brief description..." rows={3} className="rounded-xl resize-none" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Count</Label>
                <Input id="target" type="number" min="1" value={formData.target_count} onChange={(e) => setFormData({ ...formData, target_count: parseInt(e.target.value) })} required className="h-12 rounded-xl" />
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Visual Icon</Label>
                <div className="grid grid-cols-6 gap-2">
                  {ICON_OPTIONS.map((option) => (
                    <button key={option.value} type="button" onClick={() => setFormData({ ...formData, icon: option.value })} className={cn("p-3 rounded-xl border-2 transition-all", formData.icon === option.value ? "border-indigo-600 bg-indigo-50" : "border-slate-100 bg-white hover:bg-slate-50")}>
                      <option.icon size={20} className={formData.icon === option.value ? "text-indigo-600" : "text-slate-400"} />
                    </button>
                  ))}
                </div>
              </div>
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 rounded-xl font-bold shadow-lg shadow-indigo-100">
                {editingProcedure ? 'Update Procedure' : 'Add Procedure'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2"><MusclePracticeStats /></div>
        <Card className="border-none shadow-lg rounded-[2.5rem] bg-white overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
            <CardTitle className="text-xl font-black flex items-center gap-3 text-emerald-600"><TrendingUp size={24} /> Overall Progress</CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                <span className="text-slate-400">Total Completion</span>
                <span className="text-indigo-600">{totalProgress}%</span>
              </div>
              <Progress value={totalProgress} className="h-3 bg-slate-100 [&>div]:bg-indigo-600" />
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-xs font-bold text-slate-500">Completed:</span>
                <span className="font-black text-slate-900">{completedCount} / {enabledProcedures.length}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-xs font-bold text-slate-500">Total Tracked:</span>
                <span className="font-black text-slate-900">{procedures.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {procedures.map((p) => (
          <ProcedureCard key={p.id} procedure={p} latestScores={latestScores} onEdit={(proc) => { setEditingProcedure(proc); setFormData({ name: proc.name, description: proc.description, target_count: proc.target_count, icon: proc.icon }); setDialogOpen(true); }} onDelete={handleDelete} onToggle={handleToggleEnabled} />
        ))}
      </div>
    </div>
  );
};

export default ProceduresPage;