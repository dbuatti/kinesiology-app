import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Target, Plus, TrendingUp, CheckCircle2, Loader2, 
  FlaskConical, Brain, Activity, Zap, Edit3, Trash2, Power, PowerOff, Footprints
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

interface Procedure {
  id: string;
  name: string;
  description: string;
  target_count: number;
  current_count: number;
  icon: string;
  enabled: boolean;
  created_at: string;
}

const ICON_OPTIONS = [
  { value: 'flask', label: 'Flask', icon: FlaskConical },
  { value: 'brain', label: 'Brain', icon: Brain },
  { value: 'activity', label: 'Activity', icon: Activity },
  { value: 'zap', label: 'Zap', icon: Zap },
  { value: 'target', label: 'Target', icon: Target },
  { value: 'footprints', label: 'Footprints', icon: Footprints }, // New icon option
];

const getIconComponent = (iconName: string) => {
  const iconOption = ICON_OPTIONS.find(opt => opt.value === iconName);
  return iconOption ? iconOption.icon : Target;
};

const ProceduresPage = () => {
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState<Procedure | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    target_count: 5,
    icon: 'target'
  });

  const fetchProcedures = async () => {
    try {
      const { data, error } = await supabase
        .from('procedures')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProcedures(data || []);
    } catch (err) {
      console.error("Error fetching procedures:", err);
      showError("Failed to load procedures");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEnabled = async (id: string, currentEnabled: boolean) => {
    try {
      const { error } = await supabase
        .from('procedures')
        .update({ enabled: !currentEnabled })
        .eq('id', id);

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

      if (editingProcedure) {
        const { error } = await supabase
          .from('procedures')
          .update({
            name: formData.name,
            description: formData.description,
            target_count: formData.target_count,
            icon: formData.icon,
          })
          .eq('id', editingProcedure.id);

        if (error) throw error;
        showSuccess("Procedure updated successfully");
      } else {
        const { error } = await supabase
          .from('procedures')
          .insert({
            user_id: user.id,
            name: formData.name,
            description: formData.description,
            target_count: formData.target_count,
            current_count: 0,
            icon: formData.icon,
            enabled: true,
          });

        if (error) throw error;
        showSuccess("Procedure added successfully");
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
    if (!confirm("Are you sure you want to delete this procedure?")) return;

    try {
      const { error } = await supabase
        .from('procedures')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showSuccess("Procedure deleted");
      fetchProcedures();
    } catch (err: any) {
      showError(err.message || "Failed to delete procedure");
    }
  };

  const handleEdit = (procedure: Procedure) => {
    setEditingProcedure(procedure);
    setFormData({
      name: procedure.name,
      description: procedure.description,
      target_count: procedure.target_count,
      icon: procedure.icon,
    });
    setDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingProcedure(null);
      setFormData({ name: '', description: '', target_count: 5, icon: 'target' });
    }
  };

  useEffect(() => {
    fetchProcedures();
  }, []);

  const enabledProcedures = procedures.filter(p => p.enabled);
  const completedCount = enabledProcedures.filter(p => p.current_count >= p.target_count).length;
  const totalProgress = enabledProcedures.length > 0 
    ? Math.round((enabledProcedures.reduce((sum, p) => sum + Math.min(p.current_count, p.target_count), 0) / 
        enabledProcedures.reduce((sum, p) => sum + p.target_count, 0)) * 100)
    : 0;

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="animate-spin text-indigo-500" size={48} />
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Procedure Tracker</h1>
          <p className="text-slate-500 mt-1">Track your progress learning new functional neurology procedures</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100">
              <Plus size={18} className="mr-2" /> Add Procedure
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingProcedure ? 'Edit Procedure' : 'Add New Procedure'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Procedure Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., BOLT Test"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the procedure..."
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="target">Target Count</Label>
                <Input
                  id="target"
                  type="number"
                  min="1"
                  value={formData.target_count}
                  onChange={(e) => setFormData({ ...formData, target_count: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div>
                <Label>Icon</Label>
                <div className="grid grid-cols-5 gap-2 mt-2">
                  {ICON_OPTIONS.map((option) => {
                    const IconComponent = option.icon;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon: option.value })}
                        className={cn(
                          "p-3 rounded-lg border-2 transition-all hover:border-indigo-300",
                          formData.icon === option.value 
                            ? "border-indigo-600 bg-indigo-50" 
                            : "border-slate-200 bg-white"
                        )}
                      >
                        <IconComponent size={24} className={formData.icon === option.value ? "text-indigo-600" : "text-slate-400"} />
                      </button>
                    );
                  })}
                </div>
              </div>
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">
                {editingProcedure ? 'Update Procedure' : 'Add Procedure'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm rounded-2xl bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-slate-700">
              <Target size={16} className="text-indigo-500" /> Active Procedures
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold text-slate-900">{enabledProcedures.length}</p>
            <p className="text-xs text-slate-400 mt-1">{procedures.length - enabledProcedures.length} disabled</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-2xl bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-slate-700">
              <CheckCircle2 size={16} className="text-emerald-500" /> Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold text-emerald-600">{completedCount}</p>
            <p className="text-xs text-slate-400 mt-1">Reached target</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-2xl bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-slate-700">
              <TrendingUp size={16} className="text-blue-500" /> Overall Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold text-blue-600">{totalProgress}%</p>
            <p className="text-xs text-slate-400 mt-1">Across active procedures</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {procedures.map((procedure) => {
          const IconComponent = getIconComponent(procedure.icon);
          const progress = Math.min((procedure.current_count / procedure.target_count) * 100, 100);
          const isComplete = procedure.current_count >= procedure.target_count;

          return (
            <Card key={procedure.id} className={cn(
              "border-none shadow-md rounded-2xl overflow-hidden transition-all hover:shadow-lg",
              !procedure.enabled && "opacity-60",
              isComplete && procedure.enabled ? "bg-gradient-to-br from-emerald-50 to-emerald-100" : "bg-white"
            )}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center shadow-sm",
                      !procedure.enabled ? "bg-slate-300" :
                      isComplete ? "bg-emerald-500" : "bg-indigo-600"
                    )}>
                      <IconComponent size={24} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg font-bold text-slate-900">{procedure.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {isComplete && procedure.enabled && (
                          <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white border-none text-xs">
                            <CheckCircle2 size={12} className="mr-1" /> Complete
                          </Badge>
                        )}
                        {!procedure.enabled && (
                          <Badge variant="outline" className="border-slate-300 text-slate-500 text-xs">
                            <PowerOff size={12} className="mr-1" /> Disabled
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEdit(procedure)}
                    >
                      <Edit3 size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-700"
                      onClick={() => handleDelete(procedure.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {procedure.description && (
                  <p className="text-sm text-slate-600 leading-relaxed">{procedure.description}</p>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">Track in appointments</span>
                  <Switch
                    checked={procedure.enabled}
                    onCheckedChange={() => handleToggleEnabled(procedure.id, procedure.enabled)}
                  />
                </div>

                {procedure.enabled && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-bold text-slate-700">Progress</span>
                      <span className={cn(
                        "font-bold",
                        isComplete ? "text-emerald-600" : "text-indigo-600"
                      )}>
                        {procedure.current_count} / {procedure.target_count}
                      </span>
                    </div>
                    <Progress 
                      value={progress} 
                      className={cn(
                        "h-3",
                        isComplete ? "[&>div]:bg-emerald-500" : "[&>div]:bg-indigo-600"
                      )}
                    />
                    <p className="text-xs text-slate-500 text-center">
                      {isComplete 
                        ? "🎉 Target reached!" 
                        : `${procedure.target_count - procedure.current_count} more to go`
                      }
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {procedures.length === 0 && (
        <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Target className="text-indigo-300" size={32} />
          </div>
          <h3 className="text-slate-900 font-bold text-lg">No procedures yet</h3>
          <p className="text-slate-500 mt-1 max-w-sm mx-auto">
            Procedures will automatically appear here when you use them in appointments (like BOLT tests).
            You can also manually add procedures to track.
          </p>
          <Button 
            className="mt-6 bg-indigo-600 hover:bg-indigo-700"
            onClick={() => setDialogOpen(true)}
          >
            <Plus size={18} className="mr-2" /> Add Your First Procedure
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProceduresPage;