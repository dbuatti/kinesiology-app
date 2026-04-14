"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Brain,
  Heart,
  Wind,
  Sparkles,
  Printer,
  Save,
  Loader2,
  Palette,
  Zap,
  ShieldCheck,
  Edit3
} from 'lucide-react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface FearCreativityWorksheetProps {
  submissionId?: string | null;
  onBack?: () => void;
}

const FearCreativityWorksheet = ({ submissionId, onBack }: FearCreativityWorksheetProps) => {
  const [title, setTitle] = useState('New Reflection');
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
          const { data, error } = await supabase
            .from('fear_creativity_submissions')
            .select('*')
            .eq('id', localId)
            .single();

          if (data) {
            setAnswers(data.form_data || {});
            setTitle(data.title || 'Untitled Reflection');
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
        result = await supabase
          .from('fear_creativity_submissions')
          .update(payload)
          .eq('id', localId)
          .select()
          .single();
      } else {
        result = await supabase
          .from('fear_creativity_submissions')
          .insert(payload)
          .select()
          .single();
      }

      if (result.error) throw result.error;
      
      if (!localId && result.data) {
        setLocalId(result.data.id);
      }

      if (!silent) toast.success("Progress saved successfully.");
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-medium">Loading worksheet...</p>
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
          <div className="inline-flex items-center justify-center p-2 bg-rose-100 rounded-full text-rose-600 mb-4">
            <Heart className="w-6 h-6" />
          </div>

          <div className="max-w-md mx-auto group relative">
            <Input 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl text-center border-none bg-transparent focus:ring-0 h-auto p-0 mb-2"
              placeholder="Reflection Title"
            />
          </div>
          
          <p className="text-xl text-rose-600 font-medium">Integrated Healer Program</p>
          <p className="max-w-2xl mx-auto text-slate-500 italic">
            "Create awareness of how fear manifests in the body, mind, and creativity."
          </p>
        </div>

        {/* Section 1: Body & Mind */}
        <section className="space-y-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Brain size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">Fill in the Blanks: Body & Mind</h2>
              <p className="text-sm text-slate-500 font-medium">Observe the physical and mental patterns of tension.</p>
            </div>
          </div>

          <div className="space-y-8 pl-16">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-4 text-xl leading-relaxed">
              <Input 
                className="w-64 h-10 border-b-2 border-t-0 border-x-0 rounded-none focus:ring-0 bg-transparent font-bold text-indigo-600"
                placeholder="[Situation/Thought]"
                value={answers.q1 || ''}
                onChange={(e) => handleInputChange('q1', e.target.value)}
              />
              <span className="font-medium text-slate-700">makes me tense.</span>
            </div>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-4 text-xl leading-relaxed">
              <span className="font-medium text-slate-700">I typically feel this tense sensation in my</span>
              <Input 
                className="w-64 h-10 border-b-2 border-t-0 border-x-0 rounded-none focus:ring-0 bg-transparent font-bold text-indigo-600"
                placeholder="[Body Part]"
                value={answers.q2 || ''}
                onChange={(e) => handleInputChange('q2', e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-4 text-xl leading-relaxed">
              <span className="font-medium text-slate-700">This makes me feel</span>
              <Input 
                className="w-full h-10 border-b-2 border-t-0 border-x-0 rounded-none focus:ring-0 bg-transparent font-bold text-indigo-600"
                placeholder="[Emotions/Feelings]"
                value={answers.q3 || ''}
                onChange={(e) => handleInputChange('q3', e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-4 text-xl leading-relaxed">
              <span className="font-medium text-slate-700">When this happens, I start to</span>
              <Input 
                className="w-full h-10 border-b-2 border-t-0 border-x-0 rounded-none focus:ring-0 bg-transparent font-bold text-indigo-600"
                placeholder="[Behavior/Reaction]"
                value={answers.q4 || ''}
                onChange={(e) => handleInputChange('q4', e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Section 2: Creativity */}
        <section className="space-y-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <Palette size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">Creativity-Related Awareness</h2>
              <p className="text-sm text-slate-500 font-medium">Uncover the blocks in your creative expression.</p>
            </div>
          </div>

          <div className="space-y-8 pl-16">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-4 text-xl leading-relaxed">
              <span className="font-medium text-slate-700">Fear stops me from creating</span>
              <Input 
                className="w-full h-10 border-b-2 border-t-0 border-x-0 rounded-none focus:ring-0 bg-transparent font-bold text-rose-600"
                placeholder="[What would you create?]"
                value={answers.c1 || ''}
                onChange={(e) => handleInputChange('c1', e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-4 text-xl leading-relaxed">
              <span className="font-medium text-slate-700">I avoid taking risks in my work because I worry</span>
              <Input 
                className="w-full h-10 border-b-2 border-t-0 border-x-0 rounded-none focus:ring-0 bg-transparent font-bold text-rose-600"
                placeholder="[The worry/fear]"
                value={answers.c2 || ''}
                onChange={(e) => handleInputChange('c2', e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Section 3: Somatic Integration */}
        <section className="p-12 bg-emerald-900 text-white rounded-[3rem] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-10"><Wind size={150} /></div>
          <div className="relative z-10 space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                <Wind size={24} className="text-emerald-400" />
              </div>
              <h2 className="text-2xl font-black">Somatic Integration</h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="space-y-2">
                <h4 className="font-black text-emerald-400 uppercase tracking-widest text-[10px]">1. Locate</h4>
                <p className="text-sm text-slate-300 leading-relaxed">Close your eyes and find where that fear-based tension lives right now. Witness it.</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-black text-emerald-400 uppercase tracking-widest text-[10px]">2. Breathe</h4>
                <p className="text-sm text-slate-300 leading-relaxed">Send your breath directly to that spot. Imagine the breath softening the edges.</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-black text-emerald-400 uppercase tracking-widest text-[10px]">3. Release</h4>
                <p className="text-sm text-slate-300 leading-relaxed">Gently shake your hands or sigh audibly. "It is safe to be aware."</p>
              </div>
            </div>
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

export default FearCreativityWorksheet;