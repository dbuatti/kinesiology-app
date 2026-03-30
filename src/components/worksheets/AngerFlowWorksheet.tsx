"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Zap,
  Heart,
  Wind,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Printer,
  Save,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Volume2,
  Target,
  Activity,
  ArrowRight,
  PlayCircle,
  ExternalLink
} from 'lucide-react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface AngerFlowWorksheetProps {
  submissionId?: string | null;
  onBack?: () => void;
}

const LESSON_URL = "https://share.descript.com/view/gDxcvRrEKGw?t=448.630353&autoplay=1";

const AngerFlowWorksheet = ({ submissionId, onBack }: AngerFlowWorksheetProps) => {
  const [title, setTitle] = useState('Week 8: Anger & Flow');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(!!submissionId);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [localId, setLocalId] = useState<string | null>(submissionId || null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        if (localId) {
          const { data } = await supabase
            .from('anger_flow_submissions')
            .select('*')
            .eq('id', localId)
            .single();

          if (data) {
            setAnswers(data.form_data || {});
            setTitle(data.title || 'Week 8 Reflection');
          }
        }
      }
      setLoading(false);
    };
    fetchData();
  }, [localId]);

  const handleSave = async (silent = false) => {
    if (!userId) return;
    if (!silent) setSaving(true);
    try {
      const payload = {
        user_id: userId,
        title: title,
        form_data: answers,
        updated_at: new Date().toISOString()
      };

      let result;
      if (localId) {
        result = await supabase.from('anger_flow_submissions').update(payload).eq('id', localId).select().single();
      } else {
        result = await supabase.from('anger_flow_submissions').insert(payload).select().single();
      }

      if (result.error) throw result.error;
      if (!localId && result.data) setLocalId(result.data.id);
      if (!silent) toast.success("Progress saved.");
    } catch (error: any) {
      if (!silent) toast.error("Failed to save.");
    } finally {
      if (!silent) setSaving(false);
    }
  };

  const handleInputChange = (id: string, value: string) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
      <p className="text-slate-500 font-medium">Loading Week 8...</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 bg-slate-50/50 min-h-screen pb-32">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
        {/* Header */}
        <div className="text-center space-y-4 relative">
          <div className="absolute right-0 top-0 flex gap-2 print:hidden">
            <Button variant="outline" size="sm" asChild className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
              <a href={LESSON_URL} target="_blank" rel="noopener noreferrer">
                <PlayCircle size={16} className="mr-2" /> Watch Lesson
              </a>
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleSave()} disabled={saving} className="flex items-center gap-2 border-slate-200">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()} className="flex items-center gap-2 border-slate-200">
              <Printer className="w-4 h-4" /> Print
            </Button>
          </div>
          <div className="inline-flex items-center justify-center p-2 bg-emerald-100 rounded-full text-emerald-600 mb-4">
            <RefreshCw className="w-6 h-6" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">Week 8: Anger & Flow</h1>
          <p className="text-xl text-emerald-600 font-medium">The Wood Element & Self-Acceptance</p>
          <p className="max-w-2xl mx-auto text-slate-500 italic">"Anger arises when we feel we cannot express ourselves. The antidote is self-acceptance."</p>
        </div>

        {/* Section 1: The Linguistic Prison */}
        <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
          <CardHeader className="bg-emerald-50/50 border-b border-emerald-100">
            <CardTitle className="flex items-center gap-2 text-emerald-900">
              <Zap className="w-5 h-5" /> The "Must & Should" Audit
            </CardTitle>
            <CardDescription>Identify where you are imprisoning your own expression.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="grid gap-6">
              <div className="space-y-3">
                <Label className="text-lg font-bold text-slate-800">Where am I using "Must" or "Should" in my life right now?</Label>
                <p className="text-sm text-slate-500">e.g., "I must be like my mother," "I shouldn't feel this way."</p>
                <Textarea 
                  placeholder="List your self-imposed limitations..."
                  className="min-h-[120px] border-slate-200 focus:border-emerald-500"
                  value={answers.must_should || ''}
                  onChange={(e) => handleInputChange('must_should', e.target.value)}
                />
              </div>
              <div className="space-y-3">
                <Label className="text-lg font-bold text-slate-800">Who or what am I currently blaming for my lack of expression?</Label>
                <Textarea 
                  placeholder="Explore the strategy of blame..."
                  className="min-h-[100px] border-slate-200 focus:border-emerald-500"
                  value={answers.blame_audit || ''}
                  onChange={(e) => handleInputChange('blame_audit', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Perfectionism & Procrastination */}
        <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
          <CardHeader className="bg-indigo-50/50 border-b border-indigo-100">
            <CardTitle className="flex items-center gap-2 text-indigo-900">
              <Target className="w-5 h-5" /> Perfectionism as Control
            </CardTitle>
            <CardDescription>Uncovering the "Not Good Enough" core belief.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="space-y-6">
              <div className="p-4 bg-indigo-900 text-white rounded-2xl shadow-lg italic text-sm">
                "Perfectionism is a control mechanism to avoid feeling not good enough. Fearing judgment leads to procrastination, which leads to frustration, which leads to anger."
              </div>
              <div className="space-y-3">
                <Label className="text-lg font-bold text-slate-800">What am I currently procrastinating on because I fear being judged?</Label>
                <Textarea 
                  placeholder="Be specific about the task and the fear..."
                  className="min-h-[100px] border-slate-200 focus:border-indigo-500"
                  value={answers.procrastination || ''}
                  onChange={(e) => handleInputChange('procrastination', e.target.value)}
                />
              </div>
              <div className="space-y-3">
                <Label className="text-lg font-bold text-slate-800">How would my life look if I allowed my growth to be messy and imperfect?</Label>
                <Textarea 
                  placeholder="Visualize the flow..."
                  className="min-h-[100px] border-slate-200 focus:border-indigo-500"
                  value={answers.messy_growth || ''}
                  onChange={(e) => handleInputChange('messy_growth', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Somatic Integration - The Shu Sound */}
        <Card className="border-none shadow-xl bg-slate-900 text-white overflow-hidden">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="flex items-center gap-2 text-emerald-400">
              <Volume2 className="w-5 h-5" /> Healing Sound: "SHU"
            </CardTitle>
            <CardDescription className="text-slate-400">Physiologically clearing toxic anger from the Liver.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="font-black text-emerald-400 uppercase tracking-widest text-xs">The Protocol</h4>
                <ol className="space-y-4 text-sm text-slate-300">
                  <li className="flex gap-3"><span className="font-bold text-emerald-500">1.</span> Hold the Liver Pulse Point (Middle finger, Left wrist) or the Liver itself.</li>
                  <li className="flex gap-3"><span className="font-bold text-emerald-500">2.</span> Inhale: Visualize the color Green and breathe in Compassion.</li>
                  <li className="flex gap-3"><span className="font-bold text-emerald-500">3.</span> Exhale: Make a long, whispering "SHUUUUUU" sound.</li>
                  <li className="flex gap-3"><span className="font-bold text-emerald-500">4.</span> Feel the reverberation in the liver as you exhale the anger.</li>
                </ol>
              </div>
              <div className="p-6 bg-white/5 rounded-3xl border border-white/10 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                  <Activity size={32} />
                </div>
                <div>
                  <p className="text-lg font-bold">"I fully accept myself now."</p>
                  <p className="text-xs text-slate-400 mt-2">Repeat 10 times with the healed bounce.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center pb-12">
          <p className="text-slate-400 text-sm">© {new Date().getFullYear()} The Integrated Healer Program. Week 8: Anger & Flow.</p>
        </div>
      </motion.div>
    </div>
  );
};

export default AngerFlowWorksheet;