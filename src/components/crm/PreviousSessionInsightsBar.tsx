"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ChevronDown, ChevronUp, History, FlaskConical, 
  Activity, Target, Calendar, Clock
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface PreviousSessionInsightsBarProps {
  clientId: string;
  currentAppointmentId: string;
  manualData?: any;
}

const PreviousSessionInsightsBar = ({ clientId, currentAppointmentId, manualData }: PreviousSessionInsightsBarProps) => {
  const [previousSession, setPreviousSession] = useState<any>(manualData || null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(!manualData);

  useEffect(() => {
    if (manualData) {
      setPreviousSession(manualData);
      setLoading(false);
      return;
    }

    const fetchPreviousSession = async () => {
      // Skip fetch if IDs are placeholders
      const isDemoId = clientId.includes('demo') || currentAppointmentId.includes('demo') || currentAppointmentId.includes('00000000');
      if (isDemoId) {
        setLoading(false);
        return;
      }

      try {
        // Fetch the last 20 sessions to find the most recent non-null scores
        const { data: recentApps, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('client_id', clientId)
          .neq('id', currentAppointmentId)
          .order('date', { ascending: false })
          .limit(20);

        if (!error && recentApps && recentApps.length > 0) {
          const latest = recentApps[0];
          
          // Find the most recent BOLT assessment and its index
          const boltIndex = recentApps.findIndex(a => a.bolt_score !== null);
          const lastBolt = boltIndex !== -1 ? recentApps[boltIndex].bolt_score : null;
          const lastBoltDate = boltIndex !== -1 ? recentApps[boltIndex].date : null;
          const boltSessionsAgo = boltIndex !== -1 ? boltIndex + 1 : null;
          
          // Find the most recent Coherence assessment and its index
          const cohIndex = recentApps.findIndex(a => a.coherence_score !== null);
          const lastCoh = cohIndex !== -1 ? recentApps[cohIndex].coherence_score : null;
          const lastCohDate = cohIndex !== -1 ? recentApps[cohIndex].date : null;
          const cohSessionsAgo = cohIndex !== -1 ? cohIndex + 1 : null;

          setPreviousSession({
            ...latest,
            bolt_score: lastBolt,
            bolt_date: lastBoltDate,
            bolt_sessions_ago: boltSessionsAgo,
            coherence_score: lastCoh,
            coherence_date: lastCohDate,
            coherence_sessions_ago: cohSessionsAgo
          });
        }
      } catch (err) {
        console.error("Error fetching previous session for bar:", err);
      } finally {
        setLoading(false);
      }
    };

    if (clientId) fetchPreviousSession();
    else setLoading(false);
  }, [clientId, currentAppointmentId, manualData]);

  if (loading || !previousSession) return null;

  return (
    <div className="mb-4">
      <Card className={cn(
        "border-none shadow-md overflow-hidden transition-all duration-300",
        isOpen ? "bg-slate-900 text-white" : "bg-indigo-50 border border-indigo-100"
      )}>
        <div 
          className="px-4 py-1.5 flex items-center justify-between cursor-pointer hover:bg-black/5 transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-4 overflow-hidden">
            <div className={cn(
              "flex items-center gap-2 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider",
              isOpen ? "bg-indigo-600 text-white" : "bg-indigo-100 text-indigo-700"
            )}>
              <History size={12} />
              Last Session
            </div>
            
            {!isOpen && (
              <div className="flex items-center gap-6 text-xs font-medium text-slate-600 truncate">
                <span className="flex items-center gap-1.5">
                  <Calendar size={12} className="text-indigo-400" />
                  {format(new Date(previousSession.date), "MMM d")}
                </span>
                {previousSession.bolt_score !== null && (
                  <span className="flex items-center gap-1.5">
                    <FlaskConical size={12} className="text-indigo-400" />
                    Last BOLT: {previousSession.bolt_score}s
                  </span>
                )}
                {previousSession.goal && (
                  <span className="flex items-center gap-1.5 truncate max-w-[300px]">
                    <Target size={12} className="text-indigo-400" />
                    Goal: {previousSession.goal}
                  </span>
                )}
              </div>
            )}
          </div>

          <Button variant="ghost" size="sm" className={cn(
            "h-7 w-7 rounded-full",
            isOpen ? "text-slate-400 hover:text-white hover:bg-white/10" : "text-indigo-400 hover:bg-indigo-100"
          )}>
            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </Button>
        </div>

        {isOpen && (
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Previous Context</p>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-bold text-indigo-400">GOAL</p>
                    <p className="text-sm leading-relaxed">{previousSession.goal || 'No goal set'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-rose-400">ISSUE</p>
                    <p className="text-sm leading-relaxed">{previousSession.issue || 'No issue recorded'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Last Recorded Vitals</p>
                <div className="grid grid-cols-1 gap-3">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">BOLT Score</p>
                      <p className="text-2xl font-black text-indigo-400">{previousSession.bolt_score !== null ? `${previousSession.bolt_score}s` : 'N/A'}</p>
                    </div>
                    {previousSession.bolt_date && (
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1">
                          <Clock size={10} /> {format(new Date(previousSession.bolt_date), "MMM d")}
                        </p>
                        {previousSession.bolt_sessions_ago && (
                          <Badge variant="outline" className="text-[8px] font-black border-none bg-indigo-500/10 text-indigo-400 px-1.5 py-0 rounded-md">
                            {previousSession.bolt_sessions_ago} {previousSession.bolt_sessions_ago === 1 ? 'Session' : 'Sessions'} Ago
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Coherence</p>
                      <p className="text-2xl font-black text-rose-400">{previousSession.coherence_score !== null ? previousSession.coherence_score.toFixed(2) : 'N/A'}</p>
                    </div>
                    {previousSession.coherence_date && (
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1">
                          <Clock size={10} /> {format(new Date(previousSession.coherence_date), "MMM d")}
                        </p>
                        {previousSession.coherence_sessions_ago && (
                          <Badge variant="outline" className="text-[8px] font-black border-none bg-rose-500/10 text-rose-400 px-1.5 py-0 rounded-md">
                            {previousSession.coherence_sessions_ago} {previousSession.coherence_sessions_ago === 1 ? 'Session' : 'Sessions'} Ago
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {previousSession.acupoints && (
                <div>
                  <p className="text-xs font-bold text-emerald-400">ACUPOINTS USED</p>
                  <p className="text-sm">{previousSession.acupoints}</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Practitioner Notes</p>
                <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                  <p className="text-xs text-amber-200 leading-relaxed line-clamp-4 italic">
                    {previousSession.notes || "No general notes recorded for this session."}
                  </p>
                </div>
              </div>
              <Link to={`/appointments/${previousSession.id}`} className="block">
                <Button variant="outline" size="sm" className="w-full bg-transparent border-white/20 text-white hover:bg-white/10 rounded-xl text-xs">
                  View Full Previous Session
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default PreviousSessionInsightsBar;