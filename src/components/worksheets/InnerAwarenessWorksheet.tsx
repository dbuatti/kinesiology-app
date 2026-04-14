"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Brain,
  Heart,
  Wind,
  Sparkles,
  Printer,
  Save,
  Loader2,
  Zap,
  ShieldCheck,
  History,
  Clock,
  Volume2,
  Target,
  Activity
} from 'lucide-react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface InnerAwarenessWorksheetProps {
  submissionId?: string | null;
  onBack?: () => void;
}

const DAILY_FLOW = [
  { id: 'anapana', label: 'Anapana Meditation (5-10 min)', sub: 'Single-pointed focus on breath awareness.' },
  { id: 'journaling', label: 'Journaling (15-20 min)', sub: 'Engage with the 5 deep questions below.' },
  { id: 'somatic', label: 'Daily Release & Somatic Integration (5 min)', sub: 'Affirmations + shaking.' },
  { id: 'heart', label: 'Heart-Focused Breathing (5-10 min)', sub: 'Activate self-compassion.' },
  { id: 'ssss', label: 'Healing Sound "Ssss" (3-5 min)', sub: 'Release sadness & shame.' },
];

const InnerAwarenessWorksheet = ({ submissionId, onBack }: InnerAwarenessWorksheetProps) => {
  const [title, setTitle] = useState('New Practice Session');
  const [triggerContext, setTriggerContext] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flowCompleted, setFlowCompleted] = useState<string[]>([]);
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
          const { data, error } = await supabase
            .from('inner_awareness_submissions')
            .select('*')
            .eq('id', localId)
            .single();

          if (data) {
            setAnswers(data.form_data || {});
            setFlowCompleted(data.flow_completed || []);
            setTriggerContext(data.trigger_context || '');
            setTitle(data.title || 'Untitled Practice');
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
        trigger_context: triggerContext,
        form_data: answers,
        flow_completed: flowCompleted,
        updated_at: new Date().toISOString()
      };

      let result;
      if (localId) {
        result = await supabase
          .from('inner_awareness_submissions')
          .update(payload)
          .eq('id', localId)
          .select()
          .single();
      } else {
        result = await supabase
          .from('inner_awareness_submissions')
          .insert(payload)
          .select()
          .single();
      }

      if (result.error) throw result.error;
      
      if (!localId && result.data) {
        setLocalId(result.data.id);
      }

      if (!silent) toast.success("Practice saved successfully.");
    } catch (error: any) {
      console.error("Error saving worksheet:", error);
      if (!silent) toast.error("Failed to save progress.");
    } finally {
      if (!silent) setSaving(false);
    }
  };

  const handleInputChange = (id: string, value: string) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const toggleFlowItem = (id: string) => {
    setFlowCompleted(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-medium">Loading practice...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 min-h-screen pb-32">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-20"
      >
        {/* Header */}
        <div className="text-center space-y-4 relative">
          <div className="absolute right-0 top-0 flex gap-2 print:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSave()}
              disabled={saving}
              className="flex items-center gap-2 border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="flex items-center gap-2 border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              <Printer className="w-4 h-4" />
              Print
            </Button>
          </div>
          <div className="inline-flex items-center justify-center p-2 bg-indigo-100 rounded-full text-indigo-600 mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>

          <div className="max-w-md mx-auto">
            <Input 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl text-center border-none bg-transparent focus:ring-0 h-auto p-0 mb-2"
              placeholder="Practice Title"
            />
          </div>
          
          <p className="text-xl text-indigo-600 font-medium">Inner Awareness & Sovereignty</p>
          <p className="max-w-2xl mx-auto text-slate-500 italic">
            "A practice to develop inner awareness and sovereignty over your personal state."
          </p>
        </div>

        {/* Daily Flow */}
        <section className="space-y-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Clock size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">The Daily Flow</h2>
              <p className="text-sm text-slate-500 font-medium">Track your daily integration practices.</p>
            </div>
          </div>

          <div className="grid gap-4 pl-16">
            {DAILY_FLOW.map((item) => (
              <div 
                key={item.id} 
                className={cn(
                  "flex items-start gap-4 p-6 rounded-[2rem] border-2 transition-all cursor-pointer",
                  flowCompleted.includes(item.id) ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-transparent hover:border-indigo-100"
                )}
                onClick={() => toggleFlowItem(item.id)}
              >
                <Checkbox 
                  checked={flowCompleted.includes(item.id)}
                  onCheckedChange={() => toggleFlowItem(item.id)}
                  className="mt-1"
                />
                <div className="space-y-1">
                  <Label className="text-lg font-bold text-slate-900 cursor-pointer">{item.label}</Label>
                  <p className="text-sm text-slate-500">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Trigger Tracking */}
        <section className="space-y-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <Zap size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">Trigger & Projection Tracking</h2>
              <p className="text-sm text-slate-500 font-medium">Identify the specific trigger you are working with today.</p>
            </div>
          </div>

          <div className="pl-16">
            <Textarea 
              placeholder="Describe the person, situation, or physical sensation..."
              className="min-h-[150px] border-2 border-slate-100 focus:border-rose-500 rounded-[2rem] p-8 text-xl font-medium leading-relaxed shadow-inner"
              value={triggerContext}
              onChange={(e) => setTriggerContext(e.target.value)}
            />
          </div>
        </section>

        {/* Deep Reflection */}
        <section className="space-y-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Brain size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">Deep Reflection</h2>
              <p className="text-sm text-slate-500 font-medium">Engage with the 5 questions to uncover root patterns.</p>
            </div>
          </div>

          <div className="space-y-12 pl-16">
            {[
              { id: 'q1', label: "1. What was the thought or belief that surfaced?", icon: Target },
              { id: 'q2', label: "2. What emotion was underneath it?", icon: Heart },
              { id: 'q3', label: "3. What was the felt sense in my body?", icon: Activity },
              { id: 'q4', label: "4. Where did this pattern start in my life?", icon: History },
              { id: 'q5', label: "5. Somatic Integration Affirmations", icon: Sparkles }
            ].map((q) => (
              <div key={q.id} className="space-y-4">
                <Label className="text-lg font-bold text-slate-900">{q.label}</Label>
                <Textarea 
                  placeholder="Write your reflection here..."
                  className="min-h-[120px] border-2 border-slate-100 focus:border-indigo-500 rounded-[2rem] p-8 text-lg font-medium leading-relaxed shadow-inner"
                  value={answers[q.id] || ''}
                  onChange={(e) => handleInputChange(q.id, e.target.value)}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <div className="text-center pb-12">
          <p className="text-slate-400 text-sm">
            © {new Date().getFullYear()} The Integrated Healer Program. All rights reserved.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default InnerAwarenessWorksheet;