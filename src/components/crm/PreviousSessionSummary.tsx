"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  History, Calendar, Target, AlertCircle, FlaskConical, 
  Activity, Brain, Heart, Zap, ExternalLink, Loader2, Move
} from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PreviousSessionSummaryProps {
  clientId: string;
  currentAppointmentId: string;
  manualData?: any;
}

const PreviousSessionSummary = ({ clientId, currentAppointmentId, manualData }: PreviousSessionSummaryProps) => {
  const [previousSession, setPreviousSession] = useState<any>(manualData || null);
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
        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('client_id', clientId)
          .neq('id', currentAppointmentId)
          .order('date', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          setPreviousSession(data);
        }
      } catch (err) {
        console.error("Error fetching previous session for summary:", err);
      } finally {
        setLoading(false);
      }
    };

    if (clientId) fetchPreviousSession();
    else setLoading(false);
  }, [clientId, currentAppointmentId, manualData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  if (!previousSession) {
    return (
      <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
        <History className="mx-auto text-slate-300 mb-4" size={48} />
        <h3 className="text-lg font-bold text-slate-900">No Previous Sessions</h3>
        <p className="text-slate-500 mt-1">This appears to be the client's first recorded session.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
            <History size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Previous Session Summary</h2>
            <p className="text-slate-500 flex items-center gap-1.5">
              <Calendar size={14} />
              {format(new Date(previousSession.date), "EEEE, MMMM d, yyyy")}
            </p>
          </div>
        </div>
        <Link to={clientId.includes('demo') ? '#' : `/appointments/${previousSession.id}`}>
          <Button variant="outline" className="rounded-xl border-indigo-200 text-indigo-600 hover:bg-indigo-50">
            <ExternalLink size={16} className="mr-2" /> View Full Session
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm bg-white rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Target size={16} className="text-indigo-500" /> Goal & Primary Issue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
              <p className="text-xs font-bold text-indigo-600 uppercase mb-1">Session Goal</p>
              <p className="text-slate-800 font-medium leading-relaxed">{previousSession.goal || 'No goal recorded'}</p>
            </div>
            <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
              <p className="text-xs font-bold text-rose-600 uppercase mb-1">Main Concern</p>
              <p className="text-slate-800 font-medium leading-relaxed">{previousSession.issue || 'No issue recorded'}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <FlaskConical size={16} className="text-emerald-500" /> Baseline Assessments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">BOLT Score</p>
                <p className="text-3xl font-black text-slate-900">{previousSession.bolt_score ? `${previousSession.bolt_score}s` : 'N/A'}</p>
                {previousSession.bolt_score && (
                  <Badge className={cn(
                    "mt-2",
                    previousSession.bolt_score >= 25 ? "bg-emerald-50" : "bg-amber-500"
                  )}>
                    {previousSession.bolt_score >= 25 ? 'Functional' : 'Below Target'}
                  </Badge>
                )}
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Coherence</p>
                <p className="text-3xl font-black text-slate-900">{previousSession.coherence_score ? previousSession.coherence_score.toFixed(2) : 'N/A'}</p>
                {previousSession.coherence_score && (
                  <Badge className={cn(
                    "mt-2",
                    Math.abs(previousSession.coherence_score - Math.round(previousSession.coherence_score)) < 0.01 ? "bg-emerald-50" : "bg-amber-500"
                  )}>
                    {Math.abs(previousSession.coherence_score - Math.round(previousSession.coherence_score)) < 0.01 ? 'Coherent' : 'Discordant'}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm bg-white rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Zap size={16} className="text-amber-500" /> Session Findings & Corrections
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Move size={14} className="text-purple-500" /> Pathway & Patterns
                </h4>
                <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 min-h-[80px]">
                  {previousSession.priority_pattern || "No specific pathway notes recorded."}
                </p>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Heart size={14} className="text-rose-500" /> Corrections Used
                </h4>
                <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 min-h-[80px]">
                  {previousSession.modes_balances || "No correction notes recorded."}
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Activity size={14} className="text-indigo-500" /> Acupoints
                </h4>
                <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 min-h-[80px]">
                  {previousSession.acupoints || "No acupoints recorded."}
                </p>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Brain size={14} className="text-emerald-500" /> Re-Assessment & Homework
                </h4>
                <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 min-h-[80px]">
                  {previousSession.session_north_star || "No re-assessment notes recorded."}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">General Session Notes</h4>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-amber-50/30 p-4 rounded-xl border border-amber-100">
              {previousSession.notes || "No general notes recorded for this session."}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PreviousSessionSummary;