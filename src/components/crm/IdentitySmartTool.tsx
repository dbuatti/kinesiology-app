"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Brain, 
  Zap, 
  Sparkles, 
  Plus, 
  History, 
  ArrowRight, 
  Loader2, 
  CheckCircle2,
  ShieldAlert,
  Fingerprint,
  Target,
  ChevronRight,
  MessageSquare,
  RefreshCw,
  ChevronDown
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

type IdentityType = 'shifting' | 'alignment' | 'belief' | 'auto';

const IdentitySmartTool = () => {
  const [backlog, setBacklog] = useState<any[]>([]);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newContent, setNewContent] = useState("");
  const [selectedType, setSelectedType] = useState<IdentityType>('auto');
  const [isAdding, setIsAdding] = useState(false);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [backlogRes, shiftingRes, alignmentRes, beliefsRes] = await Promise.all([
        supabase.from('identity_backlog').select('*').eq('status', 'pending').order('priority_score', { ascending: false }).order('created_at', { ascending: false }).limit(5),
        supabase.from('identity_shifting_sessions').select('id, identity, created_at, is_complete').order('created_at', { ascending: false }).limit(5),
        supabase.from('identity_alignment_sessions').select('id, target_identity, created_at, is_complete').order('created_at', { ascending: false }).limit(5),
        supabase.from('limiting_belief_sessions').select('id, limiting_belief, created_at, is_complete').order('created_at', { ascending: false }).limit(5)
      ]);

      setBacklog(backlogRes.data || []);
      
      const combined = [
        ...(shiftingRes.data || []).map(s => ({ ...s, type: 'shifting', label: s.identity })),
        ...(alignmentRes.data || []).map(s => ({ ...s, type: 'alignment', label: s.target_identity })),
        ...(beliefsRes.data || []).map(s => ({ ...s, type: 'belief', label: s.limiting_belief }))
      ].sort((a, b) => b.created_at.localeCompare(a.created_at));

      setRecentSessions(combined);
    } catch (err) {
      console.error("Error fetching identity data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddToBacklog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    setIsAdding(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let finalType = selectedType;
      if (finalType === 'auto') {
        const content = newContent.toLowerCase();
        if (content.includes('i am')) finalType = 'belief';
        else if (content.includes('want to') || content.includes('become') || content.includes('goal')) finalType = 'alignment';
        else finalType = 'shifting';
      }

      const { error } = await supabase
        .from('identity_backlog')
        .insert({
          user_id: user.id,
          content: newContent.trim(),
          type: finalType,
          status: 'pending'
        });

      if (error) throw error;
      
      showSuccess(`Added to ${finalType === 'alignment' ? 'Alignment' : finalType === 'belief' ? 'Beliefs' : 'Shifting'} backlog.`);
      setNewContent("");
      setSelectedType('auto');
      fetchData();
    } catch (err: any) {
      showError(err.message);
    } finally {
      setIsAdding(false);
    }
  };

  const smartSuggestion = useMemo(() => {
    if (recentSessions.length === 0) return null;
    
    const candidate = recentSessions.find(s => 
      s.is_complete && differenceInDays(new Date(), new Date(s.created_at)) >= 7
    );

    if (!candidate) return null;

    return {
      label: candidate.label,
      type: candidate.type,
      daysAgo: differenceInDays(new Date(), new Date(candidate.created_at))
    };
  }, [recentSessions]);

  if (loading) return (
    <Card className="border-none shadow-sm bg-card rounded-[2rem] h-48 flex items-center justify-center">
      <Loader2 className="animate-spin text-indigo-600" size={32} />
    </Card>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
      <div className="lg:col-span-7 space-y-8">
        <div className="flex items-center gap-4 px-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg">
            <Brain size={20} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-foreground tracking-tight">Identity Intelligence</h2>
            <p className="text-sm text-muted-foreground font-medium">Pattern recognition and follow-up suggestions.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <Card className="border-none shadow-xl rounded-[2.5rem] bg-slate-900 text-white overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-transparent" />
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
              <Sparkles size={100} />
            </div>
            <CardContent className="p-10 space-y-8 relative z-10">
              {smartSuggestion ? (
                <>
                  <div className="space-y-2">
                    <Badge className="bg-indigo-500 text-white border-none font-black text-[9px] uppercase tracking-[0.3em] px-4 py-1 rounded-full shadow-lg">
                      Follow-up Suggestion
                    </Badge>
                    <h3 className="text-3xl font-serif font-bold tracking-tight leading-tight">
                      Have you really worked through <span className="text-indigo-400 italic">"{smartSuggestion.label}"</span>?
                    </h3>
                    <p className="text-sm text-slate-400 font-medium">Last processed {smartSuggestion.daysAgo} days ago.</p>
                  </div>
                  <div className="flex gap-4">
                    <Button 
                      asChild
                      className="bg-white text-slate-900 hover:bg-indigo-50 h-12 px-8 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl transition-all hover:scale-105"
                    >
                      <Link to={smartSuggestion.type === 'alignment' ? "/sandbox/identity-alignment" : "/sandbox/identity-shifting"} state={{ prefill: smartSuggestion.label }}>
                        {smartSuggestion.type === 'alignment' ? 'Align Again' : 'Shift Again'}
                      </Link>
                    </Button>
                    <Button 
                      asChild
                      variant="outline"
                      className="bg-transparent border-white/20 text-white hover:bg-white/10 h-12 px-8 rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                    >
                      <Link to="/sandbox">View Map</Link>
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-6 space-y-6">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-white/10 flex items-center justify-center text-indigo-400 shadow-inner">
                    <CheckCircle2 size={32} />
                  </div>
                  <p className="text-lg font-bold text-slate-300">Your identity work is up to date. No immediate follow-ups detected.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg rounded-[2rem] bg-card overflow-hidden">
            <CardHeader className="p-8 pb-4 border-b border-border bg-muted/30">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-3">
                <History size={16} className="text-indigo-500" /> Recent Themes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-4">
              {recentSessions.length > 0 ? (
                <div className="space-y-3">
                  {recentSessions.slice(0, 3).map((session, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-muted/50 rounded-2xl border border-border group hover:bg-card hover:shadow-md transition-all duration-500">
                      <div className="flex items-center gap-5 min-w-0">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform",
                          session.type === 'shifting' ? "bg-indigo-50 text-indigo-600" :
                          session.type === 'alignment' ? "bg-emerald-50 text-emerald-600" :
                          "bg-rose-50 text-rose-600"
                        )}>
                          {session.type === 'shifting' ? <Fingerprint size={20} /> :
                           session.type === 'alignment' ? <Target size={20} /> :
                           <ShieldAlert size={20} />}
                        </div>
                        <p className="text-sm font-bold text-foreground truncate">"{session.label}"</p>
                      </div>
                      <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest shrink-0">
                        {format(new Date(session.created_at), "MMM d")}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic py-8 text-center">No recent identity work recorded.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="lg:col-span-5 space-y-8">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-lg">
              <Zap size={20} />
            </div>
            <h2 className="text-2xl font-black text-foreground tracking-tight">Backlog</h2>
          </div>
          <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 rounded-xl h-9 px-4" asChild>
            <Link to="/sandbox">View All <ArrowRight size={14} className="ml-2" /></Link>
          </Button>
        </div>

        <Card className="border-none shadow-lg rounded-[2.5rem] bg-card overflow-hidden flex flex-col h-full">
          <CardContent className="p-8 space-y-8 flex-1 flex flex-col">
            <form onSubmit={handleAddToBacklog} className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Quick Add</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button type="button" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 transition-colors">
                      Type: {selectedType === 'auto' ? 'Auto-Detect' : selectedType === 'alignment' ? 'Alignment' : selectedType === 'belief' ? 'Belief' : 'Shifting'}
                      <ChevronDown size={12} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 rounded-2xl p-2 shadow-3xl border-none bg-card">
                    <DropdownMenuItem onClick={() => setSelectedType('auto')} className="rounded-xl text-[10px] font-black uppercase py-3 px-4">Auto-Detect</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSelectedType('shifting')} className="rounded-xl text-[10px] font-black uppercase py-3 px-4 flex items-center gap-3">
                      <Fingerprint size={14} className="text-indigo-500" /> Stuck Identity
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSelectedType('alignment')} className="rounded-xl text-[10px] font-black uppercase py-3 px-4 flex items-center gap-3">
                      <Target size={14} className="text-emerald-500" /> Target Identity
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSelectedType('belief')} className="rounded-xl text-[10px] font-black uppercase py-3 px-4 flex items-center gap-3">
                      <ShieldAlert size={14} className="text-rose-500" /> Limiting Belief
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex gap-3">
                <Input
                  placeholder={selectedType === 'alignment' ? "e.g. The Sovereign Creator..." : "e.g. The Perfectionist..."}
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  className="h-12 rounded-xl bg-muted/50 border-none focus:ring-2 focus:ring-amber-500 font-medium text-base"
                />
                <Button 
                  type="submit" 
                  disabled={isAdding || !newContent.trim()}
                  className="h-12 w-12 rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-lg shrink-0 transition-all hover:scale-105"
                >
                  {isAdding ? <Loader2 className="animate-spin" size={20} /> : <Plus size={24} />}
                </Button>
              </div>
            </form>

            <div className="space-y-3 flex-1">
              {backlog.length > 0 ? (
                backlog.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border group hover:bg-card hover:shadow-md transition-all duration-500">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="relative">
                        <div className={cn(
                          "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-inner",
                          item.type === 'belief' ? "bg-rose-50 text-rose-600" : 
                          item.type === 'alignment' ? "bg-emerald-50 text-emerald-600" : "bg-indigo-50 text-indigo-600"
                        )}>
                          {item.type === 'belief' ? <ShieldAlert size={16} /> : 
                           item.type === 'alignment' ? <Target size={16} /> : <Fingerprint size={16} />}
                        </div>
                        {item.priority_score > 0 && (
                          <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[7px] font-black border-2 border-background shadow-sm">
                            {item.priority_score}
                          </div>
                        )}
                      </div>
                      <p className="text-sm font-bold text-foreground truncate">"{item.content}"</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-xl text-slate-300 hover:text-indigo-600 shrink-0 transition-all"
                      asChild
                    >
                      <Link to={item.type === 'shifting' ? "/sandbox/identity-shifting" : item.type === 'alignment' ? "/sandbox/identity-alignment" : "/sandbox/limiting-beliefs"} state={{ prefill: item.content, backlogId: item.id }}>
                        <ChevronRight size={18} />
                      </Link>
                    </Button>
                  </div>
                ))
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-12 space-y-4">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-muted flex items-center justify-center text-muted-foreground/30 shadow-inner">
                    <CheckCircle2 size={32} />
                  </div>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No pending items.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default IdentitySmartTool;