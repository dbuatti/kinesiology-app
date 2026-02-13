"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, Activity, FlaskConical, Brain, Plus, 
  Calendar, Clock, Loader2, TrendingUp, ArrowRight, 
  Zap, Info, History, ExternalLink, Sparkles
} from "lucide-react";
import { format, isToday } from "date-fns";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/utils/toast";
import Breadcrumbs from "@/components/crm/Breadcrumbs";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer } from 'recharts';

const SelfPracticePage = () => {
  const [selfClient, setSelfClient] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchSelfData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Find or create the "Self" client record
      let { data: client, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_practitioner', true)
        .single();

      if (clientError && clientError.code === 'PGRST116') {
        // Create the self record if it doesn't exist
        const { data: newClient, error: createError } = await supabase
          .from('clients')
          .insert({
            user_id: user.id,
            name: "Practitioner (Self)",
            is_practitioner: true,
            email: user.email,
            pronouns: "Practitioner"
          })
          .select()
          .single();
        
        if (createError) throw createError;
        client = newClient;
      } else if (clientError) {
        throw clientError;
      }

      setSelfClient(client);

      // 2. Fetch self-sessions
      const { data: appData, error: appError } = await supabase
        .from('appointments')
        .select('*')
        .eq('client_id', client.id)
        .order('date', { ascending: false });

      if (appError) throw appError;
      setSessions(appData || []);

    } catch (err) {
      console.error("Error fetching self-practice data:", err);
      showError("Failed to load your personal practice zone.");
    } finally {
      setLoading(false);
    }
  };

  const handleNewSelfSession = async () => {
    if (!selfClient) return;
    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const now = new Date();
      
      const { data, error } = await supabase
        .from('appointments')
        .insert({
          user_id: user!.id,
          client_id: selfClient.id,
          name: `Self Practice - ${format(now, "MMM d, yyyy")}`,
          date: now.toISOString(),
          tag: "Self Practice",
          status: "Scheduled",
          goal: "Personal health monitoring & protocol practice"
        })
        .select()
        .single();

      if (error) throw error;
      showSuccess("New self-practice session created!");
      window.location.href = `/appointments/${data.id}`;
    } catch (err: any) {
      showError(err.message || "Failed to create session");
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    fetchSelfData();
  }, []);

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="animate-spin text-indigo-500" size={48} />
    </div>
  );

  // Prepare chart data for BOLT trends
  const boltTrendData = [...sessions]
    .filter(s => s.bolt_score)
    .reverse()
    .map(s => ({
      date: format(new Date(s.date), "MMM d"),
      score: s.bolt_score
    }));

  const lastBolt = sessions.find(s => s.bolt_score)?.bolt_score || null;
  const lastCoh = sessions.find(s => s.coherence_score)?.coherence_score || null;

  return (
    <div className="p-4 md:p-8 max-w-full mx-auto space-y-8">
      <Breadcrumbs items={[{ label: "Self Practice" }]} />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-rose-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-rose-200">
            <Heart size={32} className="fill-current" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Self-Monitoring Zone</h1>
            <p className="text-slate-500 font-medium">Your private space for personal health tracking and protocol practice.</p>
          </div>
        </div>
        <Button 
          onClick={handleNewSelfSession} 
          disabled={creating}
          className="bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-100 h-12 px-8 rounded-xl font-bold"
        >
          {creating ? <Loader2 className="mr-2 animate-spin" /> : <Plus size={20} className="mr-2" />}
          Start Self-Session
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Personal Vitals Card */}
        <Card className="lg:col-span-2 border-none shadow-lg bg-white rounded-3xl overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <TrendingUp size={20} className="text-rose-500" /> Personal Health Trends
                </CardTitle>
                <CardDescription>Your BOLT score progress over time</CardDescription>
              </div>
              <div className="flex gap-3">
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Latest BOLT</p>
                  <p className={cn("text-2xl font-black", lastBolt && lastBolt >= 25 ? "text-emerald-600" : "text-amber-600")}>
                    {lastBolt ? `${lastBolt}s` : 'N/A'}
                  </p>
                </div>
                <div className="text-right border-l border-slate-200 pl-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Latest Coh</p>
                  <p className="text-2xl font-black text-indigo-600">
                    {lastCoh ? lastCoh.toFixed(2) : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {boltTrendData.length > 1 ? (
              <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={boltTrendData}>
                    <defs>
                      <linearGradient id="colorBolt" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#e11d48" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#e11d48" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                    <ChartTooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                    <Area type="monotone" dataKey="score" stroke="#e11d48" strokeWidth={3} fillOpacity={1} fill="url(#colorBolt)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <Activity size={48} className="text-slate-300 mb-4" />
                <p className="text-slate-500 font-medium">Not enough data to show trends yet.</p>
                <p className="text-xs text-slate-400 mt-1">Complete at least 2 self-sessions with BOLT scores.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Practice Info Card */}
        <Card className="border-none shadow-lg bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Sparkles size={120} />
          </div>
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Zap size={20} className="text-amber-400 fill-amber-400" /> Practice Mode
            </CardTitle>
            <CardDescription className="text-slate-400">Why use the Self-Monitoring Zone?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 relative z-10">
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  <strong>Clean Analytics:</strong> Self-sessions are automatically excluded from your professional practice statistics.
                </p>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  <strong>Protocol Mastery:</strong> Use this space to practice new neurological drills or muscle tests without creating "fake" client data.
                </p>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  <strong>Personal Health:</strong> Track your own autonomic regulation, BOLT scores, and emotional context over time.
                </p>
              </div>
            </div>
            
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Info size={14} /> Pro Tip
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Self-practice sessions still count towards your <strong>Procedure Tracker</strong> progress, helping you reach your learning targets!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Self-Session History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <History size={24} className="text-indigo-500" /> Self-Session History
          </h2>
          <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-bold">
            {sessions.length} Sessions
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map(session => (
            <Link key={session.id} to={`/appointments/${session.id}`}>
              <Card className="hover:shadow-xl transition-all border-slate-200 bg-white group rounded-2xl overflow-hidden cursor-pointer h-full">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">
                        {isToday(new Date(session.date)) ? "TODAY" : format(new Date(session.date), "EEEE, MMM d")}
                      </p>
                      <h3 className="font-bold text-lg text-slate-900 group-hover:text-rose-600 transition-colors">
                        {session.name || "Self Practice Session"}
                      </h3>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-rose-50 group-hover:text-rose-500 transition-colors">
                      <ArrowRight size={20} />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {session.bolt_score && (
                      <Badge className="bg-indigo-50 text-indigo-700 border-none text-[10px] font-bold">
                        BOLT: {session.bolt_score}s
                      </Badge>
                    )}
                    {session.coherence_score && (
                      <Badge className="bg-rose-50 text-rose-700 border-none text-[10px] font-bold">
                        COH: {session.coherence_score.toFixed(2)}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-[10px] font-bold border-slate-200 text-slate-500">
                      {session.status}
                    </Badge>
                  </div>

                  {session.goal && (
                    <p className="text-xs text-slate-500 line-clamp-2 italic">
                      "{session.goal}"
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}

          {sessions.length === 0 && (
            <div className="col-span-full text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="text-rose-300" size={32} />
              </div>
              <h3 className="text-slate-900 font-bold text-lg">No self-sessions yet</h3>
              <p className="text-slate-500 mt-1 max-w-xs mx-auto">Start your first self-monitoring session to track your personal health and practice protocols.</p>
              <Button 
                className="mt-6 bg-rose-600 hover:bg-rose-700 rounded-xl"
                onClick={handleNewSelfSession}
              >
                Start First Self-Session
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SelfPracticePage;