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
  ChevronDown
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
    <div className="h-48 border border-border flex items-center justify-center">
      <Loader2 className="animate-spin text-primary" size={32} />
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-7 space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border border-border flex items-center justify-center text-primary">
            <Brain size={20} />
          </div>
          <div>
            <h2 className="text-2xl font-medium uppercase tracking-tight">Identity Intelligence</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Pattern recognition and follow-up suggestions.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <div className="border border-border p-8 bg-background space-y-6">
            {smartSuggestion ? (
              <>
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Follow-up Suggestion</p>
                  <h3 className="text-2xl font-medium uppercase tracking-tight leading-tight">
                    Have you really worked through "{smartSuggestion.label}"?
                  </h3>
                  <p className="text-xs text-muted-foreground">Last processed {smartSuggestion.daysAgo} days ago.</p>
                </div>
                <div className="flex gap-4">
                  <Button 
                    asChild
                    className="bg-primary text-primary-foreground h-12 px-8 font-bold text-[10px] uppercase tracking-widest"
                  >
                    <Link to={smartSuggestion.type === 'alignment' ? "/sandbox/identity-alignment" : "/sandbox/identity-shifting"} state={{ prefill: smartSuggestion.label }}>
                      {smartSuggestion.type === 'alignment' ? 'Align Again' : 'Shift Again'}
                    </Link>
                  </Button>
                  <Button 
                    asChild
                    variant="outline"
                    className="h-12 px-8 font-bold text-[10px] uppercase tracking-widest border-border"
                  >
                    <Link to="/sandbox">View Map</Link>
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-4 space-y-4">
                <div className="w-12 h-12 border border-border flex items-center justify-center text-success">
                  <CheckCircle2 size={24} />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Your identity work is up to date.</p>
              </div>
            )}
          </div>

          <div className="border border-border bg-background">
            <div className="p-6 border-b border-border">
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <History size={14} className="text-primary" /> Recent Themes
              </h3>
            </div>
            <div className="p-0">
              {recentSessions.length > 0 ? (
                <div className="space-y-0">
                  {recentSessions.slice(0, 3).map((session, i) => (
                    <div key={i} className="flex items-center justify-between p-6 border-b border-border last:border-b-0 hover:bg-muted transition-colors group">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-8 h-8 border border-border flex items-center justify-center shrink-0 text-primary">
                          {session.type === 'shifting' ? <Fingerprint size={16} /> :
                           session.type === 'alignment' ? <Target size={16} /> :
                           <ShieldAlert size={16} />}
                        </div>
                        <p className="text-xs font-bold uppercase tracking-tight truncate">"{session.label}"</p>
                      </div>
                      <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
                        {format(new Date(session.created_at), "MMM d")}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground uppercase tracking-widest py-8 text-center">No recent identity work recorded.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-5 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border border-border flex items-center justify-center text-primary">
              <Zap size={20} />
            </div>
            <h2 className="text-2xl font-medium uppercase tracking-tight">Backlog</h2>
          </div>
          <Button variant="ghost" size="sm" className="text-[9px] font-bold uppercase tracking-widest text-primary" asChild>
            <Link to="/sandbox">View All <ArrowRight size={12} className="ml-1" /></Link>
          </Button>
        </div>

        <div className="border border-border bg-background flex flex-col h-full">
          <div className="p-8 space-y-8 flex-1 flex flex-col">
            <form onSubmit={handleAddToBacklog} className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Quick Add</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button type="button" className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-primary hover:text-primary/80 transition-colors">
                      Type: {selectedType === 'auto' ? 'Auto-Detect' : selectedType === 'alignment' ? 'Alignment' : selectedType === 'belief' ? 'Belief' : 'Shifting'}
                      <ChevronDown size={10} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40 p-0 border border-border bg-background">
                    <DropdownMenuItem onClick={() => setSelectedType('auto')} className="text-[9px] font-bold uppercase py-3 px-4 focus:bg-muted">Auto-Detect</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSelectedType('shifting')} className="text-[9px] font-bold uppercase py-3 px-4 focus:bg-muted flex items-center gap-2">
                      <Fingerprint size={12} className="text-primary" /> Stuck Identity
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSelectedType('alignment')} className="text-[9px] font-bold uppercase py-3 px-4 focus:bg-muted flex items-center gap-2">
                      <Target size={12} className="text-primary" /> Target Identity
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSelectedType('belief')} className="text-[9px] font-bold uppercase py-3 px-4 focus:bg-muted flex items-center gap-2">
                      <ShieldAlert size={12} className="text-primary" /> Limiting Belief
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex gap-0 border border-border">
                <Input
                  placeholder={selectedType === 'alignment' ? "e.g. The Sovereign Creator..." : "e.g. The Perfectionist..."}
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  className="h-12 border-none focus:ring-0 font-medium rounded-none"
                />
                <Button 
                  type="submit" 
                  disabled={isAdding || !newContent.trim()}
                  className="h-12 w-12 bg-primary text-primary-foreground shrink-0 rounded-none"
                >
                  {isAdding ? <Loader2 className="animate-spin" size={18} /> : <Plus size={20} />}
                </Button>
              </div>
            </form>

            <div className="space-y-0 border border-border flex-1">
              {backlog.length > 0 ? (
                backlog.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border-b border-border last:border-b-0 hover:bg-muted transition-colors group">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="relative">
                        <div className="w-8 h-8 border border-border flex items-center justify-center shrink-0 text-primary">
                          {item.type === 'belief' ? <ShieldAlert size={14} /> : 
                           item.type === 'alignment' ? <Target size={14} /> : <Fingerprint size={14} />}
                        </div>
                        {item.priority_score > 0 && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground flex items-center justify-center text-[6px] font-bold">
                            {item.priority_score}
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-bold uppercase tracking-tight truncate">"{item.content}"</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-primary shrink-0"
                      asChild
                    >
                      <Link to={item.type === 'shifting' ? "/sandbox/identity-shifting" : item.type === 'alignment' ? "/sandbox/identity-alignment" : "/sandbox/limiting-beliefs"} state={{ prefill: item.content, backlogId: item.id }}>
                        <ChevronRight size={16} />
                      </Link>
                    </Button>
                  </div>
                ))
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-12 space-y-4">
                  <div className="w-12 h-12 border border-border flex items-center justify-center text-muted-foreground/30">
                    <CheckCircle2 size={24} />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">No pending items.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IdentitySmartTool;