"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Palette,
  Zap,
  ShieldCheck
} from 'lucide-react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const FearCreativityWorksheet = () => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data, error } = await supabase
          .from('fear_creativity_worksheets')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data) {
          setAnswers(data.form_data || {});
        }
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleSave = async (silent = false) => {
    if (!userId) return;
    
    if (!silent) setSaving(true);
    try {
      const { error } = await supabase
        .from('fear_creativity_worksheets')
        .upsert({
          user_id: userId,
          form_data: answers,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;
      if (!silent) toast.success("Progress saved successfully.");
    } catch (error: any) {
      console.error("Error saving worksheet:", error);
      if (!silent) toast.error("Failed to save progress. Ensure the database table exists.");
    } finally {
      if (!silent) setSaving(false);
    }
  };

  const handleInputChange = (id: string, value: string) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-medium">Loading worksheet...</p>
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
          <div className="inline-flex items-center justify-center p-2 bg-rose-100 rounded-full text-rose-600 mb-4">
            <Heart className="w-6 h-6" />
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Fear & Creativity Awareness
          </h1>
          <p className="text-xl text-rose-600 font-medium">Integrated Healer Program</p>
          <p className="max-w-2xl mx-auto text-slate-500 italic">
            "Create awareness of how fear manifests in the body, mind, and creativity."
          </p>
        </motion.div>

        {/* Section 1: General Awareness */}
        <motion.div variants={itemVariants}>
          <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-indigo-50/50 border-b border-indigo-100">
              <CardTitle className="flex items-center gap-2 text-indigo-900">
                <Brain className="w-5 h-5" />
                Fill in the Blanks: Body & Mind
              </CardTitle>
              <CardDescription>Observe the physical and mental patterns of tension.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-4 text-lg leading-relaxed">
                  <Input 
                    className="w-64 h-10 border-b-2 border-t-0 border-x-0 rounded-none focus:ring-0 bg-transparent font-bold text-indigo-600"
                    placeholder="[Situation/Thought]"
                    value={answers.q1 || ''}
                    onChange={(e) => handleInputChange('q1', e.target.value)}
                  />
                  <span className="font-medium text-slate-700">makes me tense.</span>
                </div>

                <div className="flex flex-wrap items-center gap-x-2 gap-y-4 text-lg leading-relaxed">
                  <span className="font-medium text-slate-700">I typically feel this tense sensation in my</span>
                  <Input 
                    className="w-64 h-10 border-b-2 border-t-0 border-x-0 rounded-none focus:ring-0 bg-transparent font-bold text-indigo-600"
                    placeholder="[Body Part]"
                    value={answers.q2 || ''}
                    onChange={(e) => handleInputChange('q2', e.target.value)}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-x-2 gap-y-4 text-lg leading-relaxed">
                  <span className="font-medium text-slate-700">This makes me feel</span>
                  <Input 
                    className="w-full h-10 border-b-2 border-t-0 border-x-0 rounded-none focus:ring-0 bg-transparent font-bold text-indigo-600"
                    placeholder="[Emotions/Feelings]"
                    value={answers.q3 || ''}
                    onChange={(e) => handleInputChange('q3', e.target.value)}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-x-2 gap-y-4 text-lg leading-relaxed">
                  <span className="font-medium text-slate-700">When this happens, I start to</span>
                  <Input 
                    className="w-full h-10 border-b-2 border-t-0 border-x-0 rounded-none focus:ring-0 bg-transparent font-bold text-indigo-600"
                    placeholder="[Behavior/Reaction]"
                    value={answers.q4 || ''}
                    onChange={(e) => handleInputChange('q4', e.target.value)}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-x-2 gap-y-4 text-lg leading-relaxed">
                  <span className="font-medium text-slate-700">I think this is because</span>
                  <Input 
                    className="w-64 h-10 border-b-2 border-t-0 border-x-0 rounded-none focus:ring-0 bg-transparent font-bold text-indigo-600"
                    placeholder="[Reason 1]"
                    value={answers.q5a || ''}
                    onChange={(e) => handleInputChange('q5a', e.target.value)}
                  />
                  <span className="font-medium text-slate-700">and</span>
                  <Input 
                    className="w-64 h-10 border-b-2 border-t-0 border-x-0 rounded-none focus:ring-0 bg-transparent font-bold text-indigo-600"
                    placeholder="[Reason 2]"
                    value={answers.q5b || ''}
                    onChange={(e) => handleInputChange('q5b', e.target.value)}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-x-2 gap-y-4 text-lg leading-relaxed">
                  <span className="font-medium text-slate-700">Next time I feel tense, I will soothe myself by</span>
                  <Input 
                    className="w-full h-10 border-b-2 border-t-0 border-x-0 rounded-none focus:ring-0 bg-transparent font-bold text-indigo-600"
                    placeholder="[Self-Soothing Action]"
                    value={answers.q6 || ''}
                    onChange={(e) => handleInputChange('q6', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Section 2: Creativity Awareness */}
        <motion.div variants={itemVariants}>
          <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-rose-50/50 border-b border-rose-100">
              <CardTitle className="flex items-center gap-2 text-rose-900">
                <Palette className="w-5 h-5" />
                Creativity-Related Awareness
              </CardTitle>
              <CardDescription>Uncover the blocks in your creative expression.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-4 text-lg leading-relaxed">
                  <span className="font-medium text-slate-700">Fear stops me from creating</span>
                  <Input 
                    className="w-full h-10 border-b-2 border-t-0 border-x-0 rounded-none focus:ring-0 bg-transparent font-bold text-rose-600"
                    placeholder="[What would you create?]"
                    value={answers.c1 || ''}
                    onChange={(e) => handleInputChange('c1', e.target.value)}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-x-2 gap-y-4 text-lg leading-relaxed">
                  <span className="font-medium text-slate-700">I avoid taking risks in my work because I worry</span>
                  <Input 
                    className="w-full h-10 border-b-2 border-t-0 border-x-0 rounded-none focus:ring-0 bg-transparent font-bold text-rose-600"
                    placeholder="[The worry/fear]"
                    value={answers.c2 || ''}
                    onChange={(e) => handleInputChange('c2', e.target.value)}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-x-2 gap-y-4 text-lg leading-relaxed">
                  <span className="font-medium text-slate-700">When I feel uncertain about my next step, I</span>
                  <Input 
                    className="w-full h-10 border-b-2 border-t-0 border-x-0 rounded-none focus:ring-0 bg-transparent font-bold text-rose-600"
                    placeholder="[Your default reaction]"
                    value={answers.c3 || ''}
                    onChange={(e) => handleInputChange('c3', e.target.value)}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-x-2 gap-y-4 text-lg leading-relaxed">
                  <span className="font-medium text-slate-700">If I could create freely, without fear, I would</span>
                  <Input 
                    className="w-full h-10 border-b-2 border-t-0 border-x-0 rounded-none focus:ring-0 bg-transparent font-bold text-rose-600"
                    placeholder="[Your vision]"
                    value={answers.c4 || ''}
                    onChange={(e) => handleInputChange('c4', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Section 3: Somatic Integration */}
        <motion.div variants={itemVariants}>
          <Card className="border-none shadow-xl bg-emerald-50/30 overflow-hidden">
            <CardHeader className="bg-emerald-100/50 border-b border-emerald-200">
              <CardTitle className="flex items-center gap-2 text-emerald-900">
                <Wind className="w-5 h-5" />
                Somatic Integration
              </CardTitle>
              <CardDescription>Anchor this awareness into your physical body.</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <Zap size={20} />
                  </div>
                  <h4 className="font-bold text-emerald-800">1. Locate the Tension</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">Close your eyes and find where that fear-based tension lives right now. Don't try to change it, just witness it.</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <Wind size={20} />
                  </div>
                  <h4 className="font-bold text-emerald-800">2. Breathe Into It</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">Send your breath directly to that spot. Imagine the breath softening the edges of the tension with every exhale.</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <ShieldCheck size={20} />
                  </div>
                  <h4 className="font-bold text-emerald-800">3. Safe Release</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">Gently shake your hands or sigh audibly. Tell your body: "It is safe to be aware. It is safe to create."</p>
                </div>
              </div>
              <div className="mt-8 p-6 bg-emerald-900 text-emerald-50 rounded-2xl text-center italic shadow-lg">
                "Awareness is the first step of integration. By naming the fear, you reduce its power over your creative spirit."
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
    </div>
  );
};

export default FearCreativityWorksheet;