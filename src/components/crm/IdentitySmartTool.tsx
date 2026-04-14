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
  RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { format, differenceInDays } from "date-fns";

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
        supabase.from('identity_backlog').select('*').eq('status', 'pending').order('created_at', { ascending: false }).limit(3),
        supabase.from('identity_shifting_sessions').select('id, identity, created_at, is_complete').order('created_at', { ascending: false }).limit(5),
        supabase.from('identity_alignment_sessions').select('id, target_identity, created_at, is_complete').order('created_at', { ascending: false }).limit(5),
        supabase.from('limiting_belief_sessions').select('id, limiting_belief, created_at, is_complete').order('created_at', { ascending: false }).limit(5)
      ]);

      setBacklog(backlogRes.data || []);
      
      // Combine and sort recent sessions
      const combined = [
        ...(shiftingRes.data || []).map(s => ({ ...s, type: 'shifting', label: s.identity })),
        ...(alignmentRes.data || []).map(s => ({ ...s, type: 'alignment', label: s.target_identity })),
        ...(beliefsRes.data || []).map(s => ({ ...s, type: 'belief', label: s.limiting_belief }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

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

      const { error } = await supabase
        .from('identity_backlog')
        .insert({
          user_id: user.id,
          content: newContent.trim(),
          type: newContent.toLowerCase().includes('i am') ? 'belief' : 'identity',
          status: 'pending'
        });

      if (error) throw error;
      
      showSuccess("Added to identity backlog.");
      setNewContent("");
      fetchData();
    } catch (err: any) {
      showError(err.message);
    } finally {
      setIsAdding(false);
    }
  };

  const smartSuggestion = useMemo(() => {
    if (recentSessions.length === 0) return null;
    
    // Find a session that is complete but hasn't been revisited in 7 days
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left: Smart Suggestions & Patterns */}
      <div className="lg:col-span-8 space-y-6">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg">
            <Brain size={20} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-foreground tracking-tight">Identity Intelligence</h2>
            <p className="text-xs text-muted-foreground font-medium">Pattern recognition and follow-up suggestions.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Smart Suggestion Card */}
          <Card className="border-none shadow-xl rounded-[2.5rem] bg-slate-900 text-white overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-transparent" />
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-700">
              <Sparkles size={80} />
            </div>
            <CardContent className="p-8 space-y-6 relative z-10">
              {smartSuggestion ? (
                <>
                  <div className="space-y-1">
                    <Badge className="bg-indigo-500 text-white border-none font-black text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-full">
                      Follow-up Suggestion
                    </Badge>
                    <h3 className="text-2xl font-black tracking-tight leading-tight">
                      Have you really worked through <span className="text-indigo-400">"{smartSuggestion.label}"</span>?
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">Last processed {smartSuggestion.daysAgo} days ago.</p>
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      asChild
                      className="bg-white text-slate-900 hover:bg-indigo-50 h-10 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg"
                    >
                      <Link to="/sandbox/identity-shifting" state={{ prefill: smartSuggestion.label }}>
                        Shift Again
                      </Link>
                    </Button>
                    <Button 
                      asChild
                      variant="outline"
                      className="bg-transparent border-white/20 text-white hover:bg-white/10 h-10 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest"
                    >
                      <Link to="/sandbox/identity-alignment" state={{ prefill: smartSuggestion.label }}>
                        Align
                      </Link>
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-4 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-indigo-400">
                    <CheckCircle2 size={24} />
                  </div>
                  <p className="text-sm font-bold text-slate-300">Your identity work is up to date. No immediate follow-ups detected.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Patterns Card */}
          <Card className="border-none shadow-lg rounded-[2.5rem] bg-card overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <History size={14} className="text-indigo-500" /> Recent Themes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-3">
              {recentSessions.length > 0 ? (
                <div className="space-y-2">
                  {recentSessions.slice(0, 3).map((session, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl border border-border group hover:bg-card transition-all">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                          session.type === 'shifting' ? "bg-indigo-50 text-indigo-600" :
                          session.type === 'alignment' ? "bg-emerald-50 text-emerald-600" :
                          "bg-rose-50 text-rose-600"
                        )}>
                          {session.type === 'shifting' ? <Fingerprint size={16} /> :
                           session.type === 'alignment' ? <Target size={16} /> :
                           <ShieldAlert size={16} />}
                        </div>
                        <p className="text-xs font-bold text-foreground truncate">"{session.label}"</p>
                      </div>
                      <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest shrink-0">
                        {format(new Date(session.created_at), "MMM d")}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic py-4 text-center">No recent identity work recorded.</p>
              )}
              <Button variant="ghost" size="sm" className="w-full h-8 text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 rounded-lg" asChild>
                <Link to="/sandbox">View Sandbox Hub <ArrowRight size={12} className="ml-1" /></Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right: Backlog Management */}
      <div className="lg:col-span-4 space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-lg">
              <Zap size={20} />
            </div>
            <h2 className="text-2xl font-black text-foreground tracking-tight">Backlog</h2>
          </div>
        </div>

        <Card className="border-none shadow-lg rounded-[2.5rem] bg-card overflow-hidden flex flex-col h-full">
          <CardContent className="p-6 space-y-6 flex-1 flex flex-col">
            <form onSubmit={handleAddToBacklog} className="space-y-3">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Quick Add Identity/Belief</label>
              <div className="flex gap-2">
                <Input 
                  placeholder="e.g. The Perfectionist..." 
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  className="h-11 rounded-xl bg-muted/50 border-none focus:ring-2 focus:ring-amber-500 font-medium"
                />
                <Button 
                  type="submit" 
                  disabled={isAdding || !newContent.trim()}
                  className="h-11 w-11 rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-100 dark:shadow-none shrink-0"
                >
                  {isAdding ? <Loader2 className="animate-spin" size={18} /> : <Plus size={20} />}
                </Button>
              </div>
            </form>

            <div className="space-y-3 flex-1">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Pending Work</p>
              {backlog.length > 0 ? (
                <div className="space-y-2">
                  {backlog.map((item) => (
                    <div key={item.id} className="p-4 bg-muted/30 rounded-2xl border border-border group hover:bg-card hover:shadow-md transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <p className="text-sm font-bold text-foreground leading-tight">"{item.content}"</p>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50 shrink-0"
                          asChild
                        >
                          <Link to={item.type === 'identity' ? "/sandbox/identity-shifting" : "/sandbox/limiting-beliefs"} state={{ prefill: item.content, backlogId: item.id }}>
                            <ChevronRight size={16} />
                          </Link>
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-[7px] font-black uppercase border-none bg-muted px-1.5 py-0">
                          {item.type}
                        </Badge>
                        <span className="text-[8px] font-bold text-muted-foreground uppercase">{format(new Date(item.created_at), "MMM d")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-8 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground/30">
                    <CheckCircle2 size={24} />
                  </div>
                  <p className="text-xs font-medium text-muted-foreground">No pending items.</p>
                </div>
              )}
            </div>

            <Button variant="outline" className="w-full h-10 rounded-xl text-[10px] font-black uppercase tracking-widest border-border hover:bg-muted" asChild>
              <Link to="/sandbox">Open Full Sandbox Hub</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default IdentitySmartTool;