"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ChevronDown, ChevronUp, History, FlaskConical, 
  Activity, Target, Calendar 
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface PreviousSessionInsightsBarProps {
  clientId: string;
  currentAppointmentId: string;
}

const PreviousSessionInsightsBar = ({ clientId, currentAppointmentId }: PreviousSessionInsightsBarProps) => {
  const [previousSession, setPreviousSession] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPreviousSession = async () => {
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('client_id', clientId)
          .neq('id', currentAppointmentId)
          .order('date', { ascending: false })
          .limit(1)
          .single();

        if (!error && data) {
          setPreviousSession(data);
        }
      } catch (err) {
        console.error("Error fetching previous session for bar:", err);
      } finally {
        setLoading(false);
      }
    };

    if (clientId) fetchPreviousSession();
  }, [clientId, currentAppointmentId]);

  if (loading || !previousSession) return null;

  return (
    <div className="mb-6">
      <Card className={cn(
        "border-none shadow-md overflow-hidden transition-all duration-300",
        isOpen ? "bg-slate-900 text-white" : "bg-indigo-50 border border-indigo-100"
      )}>
        <div 
          className="px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-black/5 transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-4 overflow-hidden">
            <div className={cn(
              "flex items-center gap-2 px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wider",
              isOpen ? "bg-indigo-600 text-white" : "bg-indigo-100 text-indigo-700"
            )}>
              <History size={14} />
              Last Session
            </div>
            
            {!isOpen && (
              <div className="flex items-center gap-6 text-sm font-medium text-slate-600 truncate">
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-indigo-400" />
                  {format(new Date(previousSession.date), "MMM d")}
                </span>
                {previousSession.bolt_score && (
                  <span className="flex items-center gap-1.5">
                    <FlaskConical size={14} className="text-indigo-400" />
                    BOLT: {previousSession.bolt_score}s
                  </span>
                )}
                {previousSession.goal && (
                  <span className="flex items-center gap-1.5 truncate max-w-[300px]">
                    <Target size={14} className="text-indigo-400" />
                    Goal: {previousSession.goal}
                  </span>
                )}
              </div>
            )}
          </div>

          <Button variant="ghost" size="sm" className={cn(
            "h-8 w-8 rounded-full",
            isOpen ? "text-slate-400 hover:text-white hover:bg-white/10" : "text-indigo-400 hover:bg-indigo-100"
          )}>
            {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
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
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Key Assessments</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">BOLT Score</p>
                    <p className="text-xl font-black text-indigo-400">{previousSession.bolt_score ? `${previousSession.bolt_score}s` : 'N/A'}</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Coherence</p>
                    <p className="text-xl font-black text-rose-400">{previousSession.coherence_score ? previousSession.coherence_score.toFixed(2) : 'N/A'}</p>
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