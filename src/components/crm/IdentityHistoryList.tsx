
import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { 
  Fingerprint, 
  Target, 
  ShieldAlert, 
  History, 
  ArrowRight, 
  Loader2, 
  Calendar,
  FileText,
  Trash2,
  Search,
  FilterX
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { showSuccess, showError } from "@/utils/toast";
import IdentityShiftingReport from './IdentityShiftingReport';
import IdentityAlignmentReport from './IdentityAlignmentReport';
import LimitingBeliefsReport from './LimitingBeliefsReport';

const IdentityHistoryList = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewingSession, setViewingSession] = useState<any | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [shiftingRes, alignmentRes, beliefsRes] = await Promise.all([
        supabase.from('identity_shifting_sessions').select('*').eq('is_complete', true).order('created_at', { ascending: false }),
        supabase.from('identity_alignment_sessions').select('*').eq('is_complete', true).order('created_at', { ascending: false }),
        supabase.from('limiting_belief_sessions').select('*').eq('is_complete', true).order('created_at', { ascending: false })
      ]);

      const combined = [
        ...(shiftingRes.data || []).map(s => ({ ...s, type: 'shifting', label: s.identity, title: s.problem })),
        ...(alignmentRes.data || []).map(s => ({ ...s, type: 'alignment', label: s.target_identity, title: s.goal })),
        ...(beliefsRes.data || []).map(s => ({ ...s, type: 'belief', label: s.limiting_belief, title: s.problem }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setSessions(combined);
    } catch (err) {
      console.error("Error fetching identity history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (e: React.MouseEvent, session: any) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this session record?")) return;

    const table = session.type === 'shifting' ? 'identity_shifting_sessions' :
                  session.type === 'alignment' ? 'identity_alignment_sessions' :
                  'limiting_belief_sessions';

    try {
      const { error } = await supabase.from(table).delete().eq('id', session.id);
      if (error) throw error;
      showSuccess("Session deleted.");
      setSessions(prev => prev.filter(s => s.id !== session.id));
    } catch (err) {
      showError("Failed to delete session.");
    }
  };

  const filteredSessions = sessions.filter(s => 
    s.title?.toLowerCase().includes(search.toLowerCase()) ||
    s.label?.toLowerCase().includes(search.toLowerCase())
  );

  if (viewingSession) {
    if (viewingSession.type === 'shifting') {
      return <IdentityShiftingReport session={viewingSession} onBack={() => setViewingSession(null)} />;
    }
    if (viewingSession.type === 'alignment') {
      return <IdentityAlignmentReport session={viewingSession} onBack={() => setViewingSession(null)} />;
    }
    return <LimitingBeliefsReport session={viewingSession} onBack={() => setViewingSession(null)} />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
        <Input 
          placeholder="Search past sessions..." 
          className="pl-10 h-11 rounded-xl bg-muted/50 border-none focus:ring-2 focus:ring-indigo-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-indigo-600" size={32} />
        </div>
      ) : filteredSessions.length > 0 ? (
        <div className="grid grid-cols-1 gap-3">
          {filteredSessions.map((session) => (
            <Card 
              key={session.id} 
              className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer group rounded-2xl overflow-hidden bg-card"
              onClick={() => setViewingSession(session)}
            >
              <CardContent className="p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform",
                    session.type === 'shifting' ? "bg-indigo-50 text-indigo-600" :
                    session.type === 'alignment' ? "bg-emerald-50 text-emerald-600" :
                    "bg-rose-50 text-rose-600"
                  )}>
                    {session.type === 'shifting' ? <Fingerprint size={24} /> :
                     session.type === 'alignment' ? <Target size={24} /> :
                     <ShieldAlert size={24} />}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-base text-foreground truncate">"{session.title}"</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-none bg-muted px-2 py-0.5">
                        {session.label}
                      </Badge>
                      <span className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                        <Calendar size={12} /> {format(new Date(session.created_at), "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 rounded-xl text-muted-foreground hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all"
                    onClick={(e) => handleDelete(e, session)}
                  >
                    <Trash2 size={16} />
                  </Button>
                  <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <ArrowRight size={18} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-muted/30 rounded-[3rem] border-2 border-dashed border-border">
          <div className="w-16 h-16 bg-card rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <History className="text-muted-foreground" size={32} />
          </div>
          <p className="text-foreground font-black text-xl">No history found</p>
          <p className="text-muted-foreground mt-1 font-medium">Complete a session in Identity Map to see it here.</p>
        </div>
      )}
    </div>
  );
};

export default IdentityHistoryList;