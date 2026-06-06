
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FlaskConical, 
  Activity, 
  CheckCircle2, 
  TrendingUp, 
  Plus,
  Loader2,
  History
} from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import BoltTimer from "./BoltTimer";
import CoherenceAssessment from "./CoherenceAssessment";
import { cn } from "@/lib/utils";

interface PractitionerVitalsProps {
  onComplete: () => void;
}

const PractitionerVitals = ({ onComplete }: PractitionerVitalsProps) => {
  const [loading, setLoading] = useState(false);
  const [selfClient, setSelfClient] = useState<any>(null);
  const [activeTest, setActiveTest] = useState<'bolt' | 'coherence' | null>(null);
  const [results, setResults] = useState<{ bolt?: number; coherence?: number }>({});

  useEffect(() => {
    const fetchSelf = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_practitioner', true)
        .single();
      
      setSelfClient(data);
    };
    fetchSelf();
  }, []);

  const handleSaveResult = async (data: any) => {
    if (!selfClient) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const now = new Date();

      const { error } = await supabase
        .from('appointments')
        .insert({
          user_id: user!.id,
          client_id: selfClient.id,
          date: now.toISOString(),
          tag: "Self Practice",
          status: "Completed",
          name: `Morning Vitals - ${now.toLocaleDateString()}`,
          ...data
        });

      if (error) throw error;

      setResults(prev => ({ ...prev, ...data }));
      setActiveTest(null);
      showSuccess("Vitals logged to your history.");
      
      if (results.bolt || data.bolt_score) {
        if (results.coherence || data.coherence_score) {
          onComplete();
        }
      }
    } catch (err: any) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => setActiveTest('bolt')}
          className={cn(
            "p-6 rounded-[2rem] border-2 transition-all text-left group",
            results.bolt 
              ? "bg-emerald-50 border-emerald-200" 
              : "bg-white border-slate-100 hover:border-indigo-200"
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110",
              results.bolt ? "bg-emerald-500 text-white" : "bg-indigo-50 text-indigo-600"
            )}>
              <FlaskConical size={24} />
            </div>
            {results.bolt && <CheckCircle2 className="text-emerald-500" size={20} />}
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Step 1</p>
          <h4 className="text-xl font-black text-slate-900">Log BOLT Score</h4>
          <p className="text-xs text-slate-500 mt-1">Target: 40s for clinical peak.</p>
          {results.bolt && (
            <p className="mt-4 text-2xl font-black text-emerald-600">{results.bolt}s</p>
          )}
        </button>

        <button
          onClick={() => setActiveTest('coherence')}
          className={cn(
            "p-6 rounded-[2rem] border-2 transition-all text-left group",
            results.coherence 
              ? "bg-emerald-50 border-emerald-200" 
              : "bg-white border-slate-100 hover:border-indigo-200"
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110",
              results.coherence ? "bg-emerald-500 text-white" : "bg-rose-50 text-rose-600"
            )}>
              <Activity size={24} />
            </div>
            {results.coherence && <CheckCircle2 className="text-emerald-500" size={20} />}
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Step 2</p>
          <h4 className="text-xl font-black text-slate-900">Log Coherence</h4>
          <p className="text-xs text-slate-500 mt-1">Sync your heart and brain.</p>
          {results.coherence && (
            <p className="mt-4 text-2xl font-black text-emerald-600">{results.coherence.toFixed(2)}</p>
          )}
        </button>
      </div>

      {activeTest === 'bolt' && (
        <Card className="border-none shadow-2xl rounded-[2.5rem] bg-slate-900 text-white overflow-hidden animate-in zoom-in-95 duration-300">
          <CardContent className="p-10 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black">Practitioner BOLT</h3>
              <Button variant="ghost" size="icon" onClick={() => setActiveTest(null)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </Button>
            </div>
            <BoltTimer 
              initialScore={null} 
              onScoreRecorded={(score) => handleSaveResult({ bolt_score: score })} 
              isSaving={loading} 
            />
          </CardContent>
        </Card>
      )}

      {activeTest === 'coherence' && (
        <Card className="border-none shadow-2xl rounded-[2.5rem] bg-slate-900 text-white overflow-hidden animate-in zoom-in-95 duration-300">
          <CardContent className="p-10 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black">Practitioner Coherence</h3>
              <Button variant="ghost" size="icon" onClick={() => setActiveTest(null)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </Button>
            </div>
            <CoherenceAssessment 
              appointmentId="temp"
              initialHeartRate={null}
              initialBreathRate={null}
              initialCoherenceScore={null}
              onUpdate={() => {}}
              onSave={(data) => handleSaveResult(data)}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

function X({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
}

export default PractitionerVitals;