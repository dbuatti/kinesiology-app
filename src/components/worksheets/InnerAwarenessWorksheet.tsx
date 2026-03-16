"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  AlertCircle,
  CheckCircle2,
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

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-medium">Loading practice...</p>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 bg-slate-50/50 min-h-screen pb-32">
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-12"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center space-y-4 relative">
          <div className="absolute right-0 top-0 flex gap-2 print:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSave()}
              disabled={saving}
              className="flex items-center gap-2 border-slate-200 text-slate-600 hover:bg-slate-100"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="flex items-center gap-2 border-slate-200 text-slate-600 hover:bg-slate-100"
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
        </motion.div>

        {/* Daily Flow Checklist */}
        <motion.div variants={itemVariants}>
          <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-indigo-50/50 border-b border-indigo-100">
              <CardTitle className="flex items-center gap-2 text-indigo-900">
                <Clock className="w-5 h-5" />
                The Daily Flow
              </CardTitle>
              <CardDescription>Track your daily integration practices.</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid gap-4">
                {DAILY_FLOW.map((item) => (
                  <div 
                    key={item.id} 
                    className={cn(
                      "flex items-start gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer",
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
                      <Label className="text-base font-bold text-slate-900 cursor-pointer">{item.label}</Label>
                      <p className="text-sm text-slate-500">{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Trigger Tracking */}
        <motion.div variants={itemVariants}>
          <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-rose-50/50 border-b border-rose-100">
              <CardTitle className="flex items-center gap-2 text-rose-900">
                <Zap className="w-5 h-5" />
                Trigger & Projection Tracking
              </CardTitle>
              <CardDescription>Identify the specific trigger or projection you are working with today.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-3">
                <Label className="text-lg font-medium text-slate-800">What is the trigger?</Label>
                <Textarea 
                  placeholder="Describe the person, situation, or physical sensation..."
                  className="min-h-[120px] border-slate-200 focus:border-rose-500 focus:ring-rose-500 text-lg"
                  value={triggerContext}
                  onChange={(e) => setTriggerContext(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Deep Reflection Questions */}
        <motion.div variants={itemVariants}>
          <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-indigo-50/50 border-b border-indigo-100">
              <CardTitle className="flex items-center gap-2 text-indigo-900">
                <Brain className="w-5 h-5" />
                Deep Reflection
              </CardTitle>
              <CardDescription>Engage with the 5 questions to uncover the root patterns.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-10">
              {[
                { id: 'q1', label: "1. What was the thought or belief that surfaced when I felt triggered?", icon: Target },
                { id: 'q2', label: "2. What emotion was underneath it?", icon: Heart },
                { id: 'q3', label: "3. What was the felt sense in my body? (tightness, heat, contraction, etc.)", icon: Activity },
                { id: 'q4', label: "4. Where did this pattern start in my life?", icon: History },
                { id: 'q5', label: "5. Use the normal daily somatic integration affirmations to shift this.", icon: Sparkles, sub: "Read your affirmations aloud while focusing on the felt sense." }
              ].map((q) => (
                <div key={q.id} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <q.icon size={18} />
                    </div>
                    <Label className="text-lg font-bold text-slate-900">{q.label}</Label>
                  </div>
                  {q.sub && <p className="text-sm text-slate-500 ml-11">{q.sub}</p>}
                  <Textarea 
                    placeholder="Write your reflection here..."
                    className="min-h-[100px] border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 text-base ml-11 w-[calc(100%-2.75rem)]"
                    value={answers[q.id] || ''}
                    onChange={(e) => handleInputChange(q.id, e.target.value)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Healing Sound Practice */}
        <motion.div variants={itemVariants}>
          <Card className="border-none shadow-xl bg-slate-900 text-white overflow-hidden">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="flex items-center gap-2 text-indigo-400">
                <Volume2 className="w-5 h-5" />
                Healing Sound Practice: "Ssss"
              </CardTitle>
              <CardDescription className="text-slate-400">Release deep-seated emotional heaviness and strengthen lung energy.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="font-bold text-indigo-300 uppercase tracking-widest text-xs">The Context</h4>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    In Chinese Medicine, the Lungs hold grief, shame, and sadness. The "Ssss" sound helps release this heaviness.
                  </p>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                    <p className="text-xs font-medium italic text-indigo-200">
                      "As you exhale, visualise sadness leaving the body like steam escaping."
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-bold text-indigo-300 uppercase tracking-widest text-xs">How to Practice</h4>
                  <ol className="space-y-3 text-sm text-slate-300">
                    <li className="flex gap-3"><span className="font-bold text-indigo-400">1.</span> Hold the Lung Pulse Point (inner wrist, below thumb).</li>
                    <li className="flex gap-3"><span className="font-bold text-indigo-400">2.</span> Inhale: Mentally say "I breathe in joy and lightness."</li>
                    <li className="flex gap-3"><span className="font-bold text-indigo-400">3.</span> Exhale: Slowly whisper "Sssss..."</li>
                    <li className="flex gap-3"><span className="font-bold text-indigo-400">4.</span> Repeat for 3-5 minutes or until you feel a shift.</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer */}
        <motion.div variants={itemVariants} className="text-center pb-12">
          <p className="text-slate-400 text-sm">
            © {new Date().getFullYear()} The Integrated Healer Program. All rights reserved.
          </p>
        </motion.div>
      </motion.div>

      {/* Floating Save Button for Mobile */}
      <div className="fixed bottom-8 right-8 print:hidden lg:hidden">
        <Button
          onClick={() => handleSave()}
          disabled={saving}
          className="w-14 h-14 rounded-full bg-indigo-600 text-white shadow-2xl hover:bg-indigo-700"
        >
          {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
        </Button>
      </div>
    </div>
  );
};

export default InnerAwarenessWorksheet;