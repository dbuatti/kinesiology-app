"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Sparkles, 
  Compass, 
  Target, 
  Heart, 
  Wind, 
  Printer, 
  Save,
  Brain,
  Shield,
  User,
  CheckCircle2,
  Loader2,
  Quote,
  Flame
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const IntentionReflectionSheet = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    part1_q1: "I’m not fully sure why I’m here asides from it being apart of the year programme and I seem to just ‘be here’. To be honest, I didn’t think that I was going to be invited to do this in February as it’s the second month of being involved this year. That said, I know that I have avoidant patterns. I know that I have things I’m not facing. I know that I have tensions, and confusions, and excessive thinking that makes daily life challenging.",
    part1_q2: "I want to release overthinking. I want to release sadness. I want to release dull aches and pains from the body. I want to release worry and anxiety. I want to release frustration, and agitation and contempt. I want to release the need to separate.",
    part1_q3: "I have been unwilling to look at the part of me that feels deeply sad. And unwilling to feel into the dark part of me that hates things. Dislikes things. Disagrees with things. Unwilling to look at the uncomfortable parts in my body. The fear. The anger and aggression. The truth and the expression. The willingness to speak truthfully and honestly.",
    part2_q1: "People-pleasing is a huge one… Perfectionism for sure. Lots of fear. Anger… I don’t think so but there’s definitely something hanging around here. I need to control everything. To keep everything feeling safe.",
    part2_q2: "I have to do it all alone, I’m not good enough, I’m a bad person, I’m an anxious person, I’ll always be uncomfortable. I’ll never make friends. I’ll never be successful. I’ll never be enough. I’ll never make substantial amount of money.",
    part2_q3: "I would smile. I would feel like there was a giant mud blanket lifted from my body. I’d float. I’d fly. I’d glow. Orange and yellow and red. My blood would be flowing. My limbs would be clear. I’d move forward practising Kinesiology/FNH. I’d practise on as many people as I could. I’d speak clearly and honestly.",
    part3_q1: "",
    part3_q2: "Confidence, trust, presence, authenticity, courage, compassion, power",
    part3_q3: "",
    part4_q1: "Daily journaling, somatic practices, showing up to calls, being vulnerable",
    part4_q2: "",
    part4_q3: "",
    part5_statement: "My intention for the Integrated Healer Program is: "
  });

  useEffect(() => {
    const fetchUserAndData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data, error } = await supabase
          .from("north_star_intentions")
          .select("form_data")
          .eq("user_id", user.id)
          .maybeSingle();

        if (data && data.form_data) {
          setFormData(prev => ({ ...prev, ...data.form_data }));
        }
      }
      setLoading(false);
    };

    fetchUserAndData();
  }, []);

  const handleSave = async () => {
    if (!userId) {
      toast.error("You must be logged in to save your intention.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("north_star_intentions")
        .upsert({
          user_id: userId,
          form_data: formData,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;
      toast.success("Your North Star intention has been saved.");
    } catch (error: any) {
      console.error("Error saving intention:", error);
      toast.error("Failed to save: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">Aligning your North Star...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Hero Section */}
      <div className="relative rounded-[3.5rem] overflow-hidden bg-slate-950 text-white p-12 shadow-2xl group">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1464802686167-b939a6910659?q=80&w=2000')] opacity-20 bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/80 via-slate-950 to-purple-900/80" />
        
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
          <Sparkles size={600} className="text-indigo-400 animate-pulse" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-2xl group-hover:scale-110 transition-transform duration-500">
            <Compass size={40} className="text-indigo-400" />
          </div>
          <div className="space-y-2">
            <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 font-black text-[10px] uppercase tracking-[0.3em] px-4 py-1">
              Integrated Healer Program
            </Badge>
            <h1 className="text-5xl font-black tracking-tighter">Setting Your North Star</h1>
            <p className="text-xl text-slate-400 font-medium max-w-2xl mx-auto">
              "The Deeper you work, the higher you rise."
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 pt-4 print:hidden">
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-500 text-white h-12 px-8 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95"
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save size={18} className="mr-2" />}
              {saving ? "Saving..." : "Save Progress"}
            </Button>
            <Button onClick={handlePrint} variant="outline" className="bg-white/5 border-white/20 text-white hover:bg-white/10 h-12 px-8 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">
              <Printer size={18} className="mr-2" /> Print Worksheet
            </Button>
          </div>
        </div>
      </div>

      {/* Purpose & Instructions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="md:col-span-1 border-none shadow-lg rounded-[2.5rem] bg-indigo-600 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-6 opacity-10"><Target size={100} /></div>
          <CardHeader className="p-8">
            <CardTitle className="text-xl font-black flex items-center gap-3">
              <Sparkles size={20} className="text-teal-300" /> The Purpose
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <p className="text-indigo-50 font-medium leading-relaxed">
              This reflection sheet will help you get crystal clear on why you're here and what you're ready to release over the next 12 weeks. Your intention is your North Star—it will anchor you when resistance shows up.
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-none shadow-lg rounded-[2.5rem] bg-white overflow-hidden">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-xl font-black flex items-center gap-3 text-slate-900">
              <Wind size={20} className="text-indigo-600" /> Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <div className="flex gap-6 items-start">
              <div className="space-y-4 flex-1">
                <p className="text-slate-600 font-medium leading-relaxed">
                  Find a quiet space, take a few deep breaths, and write freely. Don't overthink it. Let your truth emerge.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-indigo-600 shadow-sm"><Brain size={16} /></div>
                    <span className="text-xs font-bold text-slate-700">Clear Mind</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-rose-600 shadow-sm"><Heart size={16} /></div>
                    <span className="text-xs font-bold text-slate-700">Open Heart</span>
                  </div>
                </div>
              </div>
              <div className="hidden sm:block w-32 h-32 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-200">
                <Quote size={64} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Part 1: Why Are You Here? */}
      <section className="space-y-8">
        <div className="flex items-center gap-4 px-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-lg">1</div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Part 1: Why Are You Here?</h2>
          <div className="flex-1 h-[2px] bg-slate-200 rounded-full opacity-50" />
        </div>

        <div className="grid grid-cols-1 gap-8">
          {[
            {
              id: "part1_q1",
              q: "What called you to this program?",
              sub: "Go beyond the surface reason. What was the deeper pull?",
              icon: Sparkles,
              color: "border-indigo-100 bg-indigo-50/30",
              accent: "text-indigo-600"
            },
            {
              id: "part1_q2",
              q: "What patterns or emotions are you tired of carrying?",
              sub: "What keeps showing up in your life that you're ready to release?",
              icon: Heart,
              color: "border-rose-100 bg-rose-50/30",
              accent: "text-rose-600"
            },
            {
              id: "part1_q3",
              q: "If you're being completely honest, what are you avoiding or hiding from?",
              sub: "What part of yourself have you been unwilling to look at?",
              icon: Shield,
              color: "border-amber-100 bg-amber-50/30",
              accent: "text-amber-600"
            }
          ].map((item) => (
            <Card key={item.id} className={cn("border-2 shadow-none rounded-[2.5rem] overflow-hidden transition-all duration-300 hover:shadow-md", item.color)}>
              <CardHeader className="p-8 pb-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0">
                    <item.icon size={20} className={item.accent} />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-black text-slate-900">{item.q}</CardTitle>
                    <CardDescription className="text-slate-500 font-medium mt-1">{item.sub}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <Textarea 
                  value={formData[item.id as keyof typeof formData]}
                  onChange={(e) => updateField(item.id, e.target.value)}
                  placeholder="Write freely here..."
                  className="min-h-[150px] bg-white/80 backdrop-blur-sm p-6 rounded-2xl border-white shadow-inner text-lg font-medium text-slate-700 leading-relaxed resize-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Part 2: What Are You Ready to Release? */}
      <section className="space-y-8">
        <div className="flex items-center gap-4 px-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-lg">2</div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Part 2: What Are You Ready to Release?</h2>
          <div className="flex-1 h-[2px] bg-slate-200 rounded-full opacity-50" />
        </div>

        <div className="grid grid-cols-1 gap-8">
          {[
            {
              id: "part2_q1",
              q: "What emotions have been running your life?",
              sub: "Shame, fear, guilt, anger, control, perfectionism, people-pleasing?",
              icon: Flame,
              color: "border-orange-100 bg-orange-50/30",
              accent: "text-orange-600"
            },
            {
              id: "part2_q2",
              q: "What stories about yourself are you ready to let go of?",
              sub: "\"I'm not good enough,\" \"I'm too much,\" \"I'm a burden,\" \"I have to do it all alone\"...",
              icon: Quote,
              color: "border-blue-100 bg-blue-50/30",
              accent: "text-blue-600"
            },
            {
              id: "part2_q3",
              q: "What would your life look like if these patterns no longer controlled you?",
              sub: "Paint the picture. Be specific.",
              icon: Sparkles,
              color: "border-teal-100 bg-teal-50/30",
              accent: "text-teal-600"
            }
          ].map((item) => (
            <Card key={item.id} className={cn("border-2 shadow-none rounded-[2.5rem] overflow-hidden transition-all duration-300 hover:shadow-md", item.color)}>
              <CardHeader className="p-8 pb-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0">
                    <item.icon size={20} className={item.accent} />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-black text-slate-900">{item.q}</CardTitle>
                    <CardDescription className="text-slate-500 font-medium mt-1">{item.sub}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <Textarea 
                  value={formData[item.id as keyof typeof formData]}
                  onChange={(e) => updateField(item.id, e.target.value)}
                  placeholder="Write freely here..."
                  className="min-h-[150px] bg-white/80 backdrop-blur-sm p-6 rounded-2xl border-white shadow-inner text-lg font-medium text-slate-700 leading-relaxed resize-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Part 3: Who Do You Want to Become? */}
      <section className="space-y-8">
        <div className="flex items-center gap-4 px-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-lg">3</div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Part 3: Who Do You Want to Become?</h2>
          <div className="flex-1 h-[2px] bg-slate-200 rounded-full opacity-50" />
        </div>

        <div className="grid grid-cols-1 gap-8">
          {[
            {
              id: "part3_q1",
              q: "On the other side of this work, who are you?",
              sub: "How do you show up? How do you feel in your body? How do you relate to others?",
              icon: User,
              color: "border-purple-100 bg-purple-50/30",
              accent: "text-purple-600"
            },
            {
              id: "part3_q2",
              q: "What qualities or traits do you want to embody?",
              sub: "Confidence, trust, presence, authenticity, courage, compassion, power?",
              icon: Sparkles,
              color: "border-indigo-100 bg-indigo-50/30",
              accent: "text-indigo-600"
            },
            {
              id: "part3_q3",
              q: "How will your relationships, work, and health shift?",
              sub: "When you step into this version of yourself?",
              icon: Heart,
              color: "border-rose-100 bg-rose-50/30",
              accent: "text-rose-600"
            }
          ].map((item) => (
            <Card key={item.id} className={cn("border-2 shadow-none rounded-[2.5rem] overflow-hidden transition-all duration-300 hover:shadow-md", item.color)}>
              <CardHeader className="p-8 pb-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0">
                    <item.icon size={20} className={item.accent} />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-black text-slate-900">{item.q}</CardTitle>
                    <CardDescription className="text-slate-500 font-medium mt-1">{item.sub}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <Textarea 
                  value={formData[item.id as keyof typeof formData]}
                  onChange={(e) => updateField(item.id, e.target.value)}
                  placeholder="Write freely here..."
                  className="min-h-[150px] bg-white/80 backdrop-blur-sm p-6 rounded-2xl border-white shadow-inner text-lg font-medium text-slate-700 leading-relaxed resize-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Part 4: Your Commitment */}
      <section className="space-y-8">
        <div className="flex items-center gap-4 px-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-lg">4</div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Part 4: Your Commitment</h2>
          <div className="flex-1 h-[2px] bg-slate-200 rounded-full opacity-50" />
        </div>

        <div className="grid grid-cols-1 gap-8">
          {[
            {
              id: "part4_q1",
              q: "What are you willing to do to make this transformation happen?",
              sub: "Daily journaling, somatic practices, showing up to calls, being vulnerable?",
              icon: CheckCircle2,
              color: "border-emerald-100 bg-emerald-50/30",
              accent: "text-emerald-600"
            },
            {
              id: "part4_q2",
              q: "What will you do when resistance shows up?",
              sub: "(Because it will.)",
              icon: Shield,
              color: "border-slate-100 bg-slate-50/30",
              accent: "text-slate-600"
            },
            {
              id: "part4_q3",
              q: "What support do you need to stay committed?",
              sub: "From yourself, from the community, from others in your life?",
              icon: Heart,
              color: "border-rose-100 bg-rose-50/30",
              accent: "text-rose-600"
            }
          ].map((item) => (
            <Card key={item.id} className={cn("border-2 shadow-none rounded-[2.5rem] overflow-hidden transition-all duration-300 hover:shadow-md", item.color)}>
              <CardHeader className="p-8 pb-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0">
                    <item.icon size={20} className={item.accent} />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-black text-slate-900">{item.q}</CardTitle>
                    <CardDescription className="text-slate-500 font-medium mt-1">{item.sub}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <Textarea 
                  value={formData[item.id as keyof typeof formData]}
                  onChange={(e) => updateField(item.id, e.target.value)}
                  placeholder="Write freely here..."
                  className="min-h-[150px] bg-white/80 backdrop-blur-sm p-6 rounded-2xl border-white shadow-inner text-lg font-medium text-slate-700 leading-relaxed resize-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Part 5: Your Intention Statement */}
      <section className="space-y-8">
        <div className="flex items-center gap-4 px-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-lg">5</div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Part 5: Your Intention Statement</h2>
          <div className="flex-1 h-[2px] bg-slate-200 rounded-full opacity-50" />
        </div>

        <Card className="border-none shadow-2xl rounded-[3.5rem] bg-gradient-to-br from-indigo-600 to-purple-700 text-white overflow-hidden relative">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
          <CardHeader className="p-12 pb-6 text-center">
            <CardTitle className="text-3xl font-black">Your North Star Statement</CardTitle>
            <CardDescription className="text-indigo-100 text-lg font-medium">
              Distill everything above into a single intention statement.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-12 pt-0">
            <div className="relative">
              <Quote className="absolute -top-6 -left-6 w-12 h-12 text-white/20" />
              <Textarea 
                value={formData.part5_statement}
                onChange={(e) => updateField("part5_statement", e.target.value)}
                placeholder="I am here to..."
                className="min-h-[200px] bg-white/10 backdrop-blur-md border-white/20 text-white text-2xl font-black text-center leading-relaxed placeholder:text-white/30 rounded-[2.5rem] p-10 focus:ring-4 focus:ring-white/20 transition-all"
              />
              <Quote className="absolute -bottom-6 -right-6 w-12 h-12 text-white/20 rotate-180" />
            </div>
            
            <div className="mt-10 flex justify-center">
              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="bg-white text-indigo-600 hover:bg-indigo-50 h-16 px-12 rounded-3xl font-black text-lg uppercase tracking-widest shadow-2xl transition-all active:scale-95"
              >
                {saving ? <Loader2 className="mr-3 h-6 w-6 animate-spin" /> : <Flame size={24} className="mr-3" />}
                {saving ? "Saving..." : "Seal Your Intention"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer Quote */}
      <div className="text-center py-12 border-t border-slate-100">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4">The Integrated Healer</p>
        <p className="text-2xl font-black text-indigo-600 italic">"Your truth is the only path to transformation."</p>
      </div>
    </div>
  );
};

export default IntentionReflectionSheet;