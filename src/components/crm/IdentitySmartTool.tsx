"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Brain, 
  Zap, 
  Plus, 
  History, 
  ArrowRight, 
  Loader2, 
  CheckCircle2,
  ShieldAlert,
  Fingerprint,
  Target,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { format, differenceInDays } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const IdentitySmartTool = () => {
  const [backlog, setBacklog] = useState<any[]>([]);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newContent, setNewContent] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [backlogRes, shiftingRes, alignmentRes, beliefsRes] = await Promise.all([
        supabase.from('identity_backlog').select('*').eq('status', 'pending').order('priority_score', { ascending: false }).limit(5),
        supabase.from('identity_shifting_sessions').select('id, identity, created_at, is_complete').order('created_at', { ascending: false }).limit(3),
        supabase.from('identity_alignment_sessions').select('id, target_identity, created_at, is_complete').order('created_at', { ascending: false }).limit(3),
        supabase.from('limiting_belief_sessions').select('id, limiting_belief, created_at, is_complete').order('created_at', { ascending: false }).limit(3)
      ]);

      setBacklog(backlogRes.data || []);
      
      const combined = [
        ...(shiftingRes.data || []).map(s => ({ ...s, type: 'shifting', label: s.identity })),
        ...(alignmentRes.data || []).map(s => ({ ...s, type: 'alignment', label: s.target_identity })),
        ...(beliefsRes.data || []).map(s => ({ ...s, type: 'belief', label: s.limiting_belief }))
      ].sort((a, b) => b.created_at.localeCompare(a.created_at));

      setRecentSessions(combined);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    setIsAdding(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('identity_backlog').insert({
        user_id: user?.id,
        content: newContent.trim(),
        type: newContent.toLowerCase().includes('i am') ? 'belief' : 'shifting',
        status: 'pending'
      });
      if (error) throw error;
      showSuccess("Added to map.");
      setNewContent("");
      fetchData();
    } catch (err) {
      showError("Failed.");
    } finally {
      setIsAdding(false);
    }
  };

  if (loading) return <div className="h-48 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 px-2">
        <div className="w-8 h-8 bg-indigo-50 text-primary flex items-center justify-center">
          <Brain size={16} />
        </div>
        <h2 className="text-xl font-serif font-bold text-slate-900">Identity Intelligence</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <div className="p-8 bg-indigo-900 text-white rounded-none relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-700">
              <Sparkles size={100} />
            </div>
            <div className="relative z-10 space-y-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300">Pattern Recognition</p>
                <h3 className="text-2xl font-serif font-bold">The Sandbox Backlog</h3>
              </div>
              <form onSubmit={handleQuickAdd} className="flex gap-0 border border-white/20">
                <Input 
                  value={newContent} 
                  onChange={e => setNewContent(e.target.value)}
                  className="h-12 bg-white/5 border-none text-white placeholder:text-white/20 rounded-none focus:ring-0" 
                  placeholder="Capture a new identity or belief..." 
                />
                <Button type="submit" disabled={isAdding} className="h-12 w-12 bg-white text-indigo-900 rounded-none shrink-0">
                  {isAdding ? <Loader2 className="animate-spin" size={18} /> : <Plus size={20} />}
                </Button>
              </form>
            </div>
          </div>

          <div className="border border-border bg-white">
            <div className="p-4 border-b border-border bg-slate-50">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Map (Top 5)</h4>
            </div>
            <div className="divide-y divide-border">
              {backlog.map(item => (
                <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 border border-border flex items-center justify-center text-primary">
                      {item.type === 'belief' ? <ShieldAlert size={14} /> : <Fingerprint size={14} />}
                    </div>
                    <span className="text-xs font-bold uppercase tracking-tight text-slate-900">"{item.content}"</span>
                  </div>
                  <Link to="/sandbox" className="text-slate-300 group-hover:text-primary transition-colors">
                    <ChevronRight size={16} />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="border border-border bg-white h-full">
            <div className="p-4 border-b border-border bg-slate-50">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recent Shifts</h4>
            </div>
            <div className="p-0">
              {recentSessions.map((s, i) => (
                <div key={i} className="p-4 border-b border-border last:border-b-0 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-indigo-50 text-primary flex items-center justify-center">
                      <Check size={12} />
                    </div>
                    <span className="text-[11px] font-medium text-slate-600 truncate max-w-[150px]">"{s.label}"</span>
                  </div>
                  <span className="text-[8px] font-black text-slate-300 uppercase">{format(new Date(s.created_at), "MMM d")}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IdentitySmartTool;