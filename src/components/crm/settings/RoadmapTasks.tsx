
import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2, Circle, Plus, Trash2, Loader2, Wand2, Target, Sparkles
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  description?: string | null;
  phase?: number | null;
  is_completed: boolean;
  completed_at?: string | null;
  created_at: string;
}

interface RoadmapTasksProps {
  /** Pass the real client rate data so generated tasks are specific */
  rateDistribution?: Record<string, number>;
  averageSessionRate?: number;
}

const PHASE_META = [
  { phase: 1, label: "Phase 1", sub: "Now → Q3 2026", colour: "bg-amber-500", light: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/40", text: "text-amber-700 dark:text-amber-400" },
  { phase: 2, label: "Phase 2", sub: "Q1 2027", colour: "bg-orange-500", light: "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800/40", text: "text-orange-700 dark:text-orange-400" },
  { phase: 3, label: "Phase 3", sub: "Q3 2027", colour: "bg-indigo-500", light: "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/40", text: "text-indigo-700 dark:text-indigo-400" },
  { phase: 4, label: "Phase 4", sub: "Q4 2027", colour: "bg-emerald-600", light: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40", text: "text-emerald-700 dark:text-emerald-400" },
];

const RoadmapTasks = ({ rateDistribution, averageSessionRate }: RoadmapTasksProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [addingPhase, setAddingPhase] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from("practice_tasks")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      setTasks(data || []);
    } catch {
      showError("Could not load tasks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, []);

  const progress = useMemo(() => {
    if (!tasks.length) return 0;
    return Math.round((tasks.filter(t => t.is_completed).length / tasks.length) * 100);
  }, [tasks]);

  const byPhase = useMemo(() => {
    const map: Record<number, Task[]> = { 1: [], 2: [], 3: [], 4: [] };
    tasks.forEach(t => {
      const p = t.phase ?? 1;
      if (map[p]) map[p].push(t);
    });
    return map;
  }, [tasks]);

  const handleToggle = async (task: Task) => {
    setSavingId(task.id);
    const now = new Date().toISOString();
    const updates = { is_completed: !task.is_completed, completed_at: !task.is_completed ? now : null };
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, ...updates } : t));
    try {
      const { error } = await supabase.from("practice_tasks").update(updates).eq("id", task.id);
      if (error) throw error;
    } catch {
      showError("Failed to update task.");
      fetchTasks();
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    try {
      const { error } = await supabase.from("practice_tasks").delete().eq("id", id);
      if (error) throw error;
    } catch {
      showError("Failed to delete task.");
      fetchTasks();
    }
  };

  const handleAdd = async (phase: number) => {
    if (!newTitle.trim()) return;
    const title = newTitle.trim();
    setNewTitle("");
    setAddingPhase(null);
    const tmp = `tmp-${Date.now()}`;
    const optimistic: Task = { id: tmp, title, phase, is_completed: false, created_at: new Date().toISOString() };
    setTasks(prev => [...prev, optimistic]);
    try {
      const { data, error } = await supabase
        .from("practice_tasks")
        .insert({ title, phase })
        .select()
        .single();
      if (error) throw error;
      setTasks(prev => prev.map(t => t.id === tmp ? data : t));
    } catch {
      showError("Failed to add task.");
      setTasks(prev => prev.filter(t => t.id !== tmp));
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const suggestions: Omit<Task, "id" | "created_at">[] = [];

      // Phase 1 — move $30 clients
      const r30 = rateDistribution?.r30 ?? 0;
      if (r30 > 0) suggestions.push({ title: `Contact ${r30} client${r30 > 1 ? "s" : ""} on $30 about moving to $50`, phase: 1, is_completed: false });
      suggestions.push({ title: "Send rate increase email to all $30 clients", phase: 1, is_completed: false });
      suggestions.push({ title: "Set target rate to $50 for all $30 clients in Rates tab", phase: 1, is_completed: false });

      // Phase 2
      const r50 = rateDistribution?.r50 ?? 0;
      const r80 = rateDistribution?.r80 ?? 0;
      if (r50 > 0) suggestions.push({ title: `Move ${r50} client${r50 > 1 ? "s" : ""} from $50 → $80`, phase: 2, is_completed: false });
      if (r80 > 0) suggestions.push({ title: `Move ${r80} client${r80 > 1 ? "s" : ""} from $80 → $100`, phase: 2, is_completed: false });
      suggestions.push({ title: "Introduce 5-session package at $400 to smooth transitions", phase: 2, is_completed: false });

      // Phase 3
      const r100 = rateDistribution?.r100 ?? 0;
      if (r100 > 0) suggestions.push({ title: `Move ${r100} client${r100 > 1 ? "s" : ""} from $100 → $120`, phase: 3, is_completed: false });
      suggestions.push({ title: "Document 3 client wins to use when discussing rate increases", phase: 3, is_completed: false });

      // Phase 4
      suggestions.push({ title: "All active clients at $150", phase: 4, is_completed: false });
      suggestions.push({ title: "Set onboarding default rate to $150 for all new clients", phase: 4, is_completed: false });

      // Avoid duplicates
      const existingTitles = new Set(tasks.map(t => t.title.toLowerCase()));
      const toInsert = suggestions.filter(s => !existingTitles.has(s.title.toLowerCase()));

      if (!toInsert.length) {
        showSuccess("No new suggestions — you already have these tasks!");
        return;
      }

      const { data, error } = await supabase.from("practice_tasks").insert(toInsert).select();
      if (error) throw error;
      setTasks(prev => [...prev, ...(data || [])]);
      showSuccess(`Added ${toInsert.length} suggested tasks.`);
    } catch {
      showError("Failed to generate tasks.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card className="border-none shadow-lg rounded-[2.5rem] bg-card overflow-hidden">
      <CardHeader className="p-8 pb-4 border-b border-border bg-muted/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-xl font-black flex items-center gap-3">
              <Target size={22} className="text-primary" />
              Action Plan
            </CardTitle>
            <p className="text-xs text-muted-foreground font-medium">
              Trackable tasks for your $150/session goal by end of 2027.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {tasks.length > 0 && (
              <div className="flex items-center gap-2 min-w-[120px]">
                <Progress value={progress} className="h-1.5 flex-1" />
                <span className="text-[10px] font-black text-muted-foreground shrink-0">{progress}%</span>
              </div>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={handleGenerate}
              disabled={generating}
              className="rounded-xl font-black text-[10px] uppercase tracking-widest h-9 px-4 border-primary/30 text-primary hover:bg-primary/5"
            >
              {generating
                ? <><Loader2 size={12} className="mr-1.5 animate-spin" />Generating…</>
                : <><Wand2 size={12} className="mr-1.5" />Generate Tasks</>}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-muted-foreground/40" />
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {PHASE_META.map(({ phase, label, sub, colour, light, text }) => {
              const phaseTasks = byPhase[phase] || [];
              const done = phaseTasks.filter(t => t.is_completed).length;

              return (
                <div key={phase} className="p-6 space-y-3">
                  {/* Phase header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={cn("w-2 h-2 rounded-full", colour)} />
                      <span className="text-xs font-black text-foreground">{label}</span>
                      <span className="text-[10px] text-muted-foreground font-medium">{sub}</span>
                      {phaseTasks.length > 0 && (
                        <Badge variant="outline" className={cn("text-[8px] font-black px-2 border", light, text)}>
                          {done}/{phaseTasks.length}
                        </Badge>
                      )}
                    </div>
                    <button
                      onClick={() => { setAddingPhase(phase); setNewTitle(""); }}
                      className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                    >
                      <Plus size={11} /> Add
                    </button>
                  </div>

                  {/* Task list */}
                  <div className="space-y-1.5 pl-4">
                    {phaseTasks.map(task => (
                      <div
                        key={task.id}
                        className={cn(
                          "flex items-center gap-2.5 group p-2.5 rounded-xl transition-colors",
                          task.is_completed ? "opacity-50" : "hover:bg-muted/40"
                        )}
                      >
                        <button
                          onClick={() => handleToggle(task)}
                          disabled={savingId === task.id}
                          className="shrink-0 text-primary/70 hover:text-primary transition-colors"
                        >
                          {savingId === task.id
                            ? <Loader2 size={16} className="animate-spin text-muted-foreground" />
                            : task.is_completed
                            ? <CheckCircle2 size={16} className="text-emerald-500" />
                            : <Circle size={16} />}
                        </button>
                        <span className={cn(
                          "text-xs font-medium flex-1 leading-snug",
                          task.is_completed ? "line-through text-muted-foreground" : "text-foreground"
                        )}>
                          {task.title}
                        </span>
                        <button
                          onClick={() => handleDelete(task.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/50 hover:text-destructive ml-1 shrink-0"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}

                    {phaseTasks.length === 0 && addingPhase !== phase && (
                      <p className="text-[11px] text-muted-foreground/40 italic pl-1">
                        No tasks yet — hit Add or Generate Tasks above.
                      </p>
                    )}

                    {/* Inline add form */}
                    {addingPhase === phase && (
                      <div className="flex items-center gap-2 pt-1 animate-in slide-in-from-top-2 duration-200">
                        <Input
                          autoFocus
                          value={newTitle}
                          onChange={e => setNewTitle(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === "Enter") handleAdd(phase);
                            if (e.key === "Escape") { setAddingPhase(null); setNewTitle(""); }
                          }}
                          placeholder="Task title… (Enter to save, Esc to cancel)"
                          className="h-8 rounded-xl text-xs border-border/60 bg-muted/30"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleAdd(phase)}
                          className="h-8 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest"
                        >
                          Save
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {!loading && tasks.length === 0 && (
          <div className="px-8 pb-10 pt-4 text-center space-y-3">
            <Sparkles size={32} className="mx-auto text-muted-foreground/20" />
            <p className="text-sm font-bold text-muted-foreground">No tasks yet.</p>
            <p className="text-xs text-muted-foreground/60">
              Click <strong>Generate Tasks</strong> to get data-driven suggestions based on your current client rates, or add tasks manually under each phase.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RoadmapTasks;
