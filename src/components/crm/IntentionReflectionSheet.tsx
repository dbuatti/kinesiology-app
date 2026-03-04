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
  Flame,
  ChevronRight,
  ChevronLeft,
  Trophy
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const IntentionReflectionSheet = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  
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

  const steps = [
    {
      title: "Why Are You Here?",
      description: "Go beyond the surface reason. What was the deeper pull?",
      icon: Compass,
      fields: [
        { id: "part1_q1", label: "What called you to this program?", sub: "Go beyond the surface reason. What was the deeper pull?", icon: Sparkles },
        { id: "part1_q2", label: "What patterns or emotions are you tired of carrying?", sub: "What keeps showing up in your life that you're ready to release?", icon: Heart },
        { id: "part1_q3", label: "If you're being completely honest, what are you avoiding or hiding from?", sub: "What part of yourself have you been unwilling to look at?", icon: Shield }
      ]
    },
    {
      title: "What Are You Ready to Release?",
      description: "Identify the emotions and stories that no longer serve you.",
      icon: Flame,
      fields: [
        { id: "part2_q1", label: "What emotions have been running your life?", sub: "Shame, fear, guilt, anger, control, perfectionism, people-pleasing?", icon: Flame },
        { id: "part2_q2", label: "What stories about yourself are you ready to let go of?", sub: "\"I'm not good enough,\" \"I'm too much,\" \"I'm a burden\"...", icon: Quote },
        { id: "part2_q3", label: "What would your life look like if these patterns no longer controlled you?", sub: "Paint the picture. Be specific.", icon: Sparkles }
      ]
    },
    {
      title: "Who Do You Want to Become?",
      description: "Visualize the version of yourself on the other side of this work.",
      icon: User,
      fields: [
        { id: "part3_q1", label: "On the other side of this work, who are you?", sub: "How do you show up? How do you feel in your body?", icon: User },
        { id: "part3_q2", label: "What qualities or traits do you want to embody?", sub: "Confidence, trust, presence, authenticity, courage...", icon: Sparkles },
        { id: "part3_q3", label: "How will your relationships, work, and health shift?", sub: "When you step into this version of yourself?", icon: Heart }
      ]
    },
    {
      title: "Your Commitment",
      description: "What are you willing to do to make this transformation happen?",
      icon: CheckCircle2,
      fields: [
        { id: "part4_q1", label: "What are you willing to do to make this transformation happen?", sub: "Daily journaling, somatic practices, showing up to calls...", icon: CheckCircle2 },
        { id: "part4_q2", label: "What will you do when resistance shows up?", sub: "(Because it will.)", icon: Shield },
        { id: "part4_q3", label: "What support do you need to stay committed?", sub: "From yourself, from the community, from others?", icon: Heart }
      ]
    },
    {
      title: "Your Intention Statement",
      description: "Distill everything into a single North Star statement.",
      icon: Target,
      isFinal: true,
      fields: [
        { id: "part5_statement", label: "My Intention Statement", sub: "This is your North Star for the next 12 weeks.", icon: Target }
      ]
    }
  ];

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

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">Aligning your North Star...</p>
      </div>
    );
  }

  const progress = ((currentStep + 1) / steps.length) * 100;
  const currentStepData = steps[currentStep];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Header */}
      <div className="relative rounded-[2.5rem] overflow-hidden bg-slate-950 text-white p-8 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-slate-950 to-purple-900/40" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Compass size={28} className="text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">North Star Process</h1>
              <p className="text-slate-400 text-sm font-medium">Step {currentStep + 1} of {steps.length}: {currentStepData.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={handleSave} 
              disabled={saving}
              variant="outline"
              className="bg-white/5 border-white/20 text-white hover:bg-white/10 h-10 px-6 rounded-xl font-bold text-xs uppercase tracking-widest"
            >
              {saving ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Save size={14} className="mr-2" />}
              Save
            </Button>
            <Button 
              onClick={() => window.print()} 
              variant="outline" 
              className="bg-white/5 border-white/20 text-white hover:bg-white/10 h-10 px-6 rounded-xl font-bold text-xs uppercase tracking-widest"
            >
              <Printer size={14} className="mr-2" /> Print
            </Button>
          </div>
        </div>
        <div className="mt-8 relative h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
          <div 
            className="absolute top-0 left-0 h-full bg-indigo-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="space-y-8">
        <div className="px-4">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">{currentStepData.title}</h2>
          <p className="text-slate-500 font-medium text-lg">{currentStepData.description}</p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {currentStepData.fields.map((field) => (
            <Card key={field.id} className={cn(
              "border-2 shadow-none rounded-[2rem] overflow-hidden transition-all duration-300",
              currentStepData.isFinal ? "bg-indigo-600 text-white border-indigo-500" : "bg-white border-slate-100 hover:border-indigo-100"
            )}>
              <CardHeader className="p-8 pb-4">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm shrink-0",
                    currentStepData.isFinal ? "bg-white/20" : "bg-slate-50"
                  )}>
                    <field.icon size={20} className={currentStepData.isFinal ? "text-white" : "text-indigo-600"} />
                  </div>
                  <div>
                    <CardTitle className={cn("text-xl font-black", currentStepData.isFinal ? "text-white" : "text-slate-900")}>
                      {field.label}
                    </CardTitle>
                    <CardDescription className={cn("font-medium mt-1", currentStepData.isFinal ? "text-indigo-100" : "text-slate-500")}>
                      {field.sub}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <Textarea 
                  value={formData[field.id as keyof typeof formData]}
                  onChange={(e) => updateField(field.id, e.target.value)}
                  placeholder="Write freely here..."
                  className={cn(
                    "min-h-[180px] p-6 rounded-2xl text-lg font-medium leading-relaxed resize-none focus:ring-4 transition-all",
                    currentStepData.isFinal 
                      ? "bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:ring-white/20" 
                      : "bg-slate-50 border-slate-100 text-slate-700 focus:ring-indigo-500/10"
                  )}
                />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-8 px-4">
          <Button
            onClick={prevStep}
            disabled={currentStep === 0}
            variant="ghost"
            className="h-14 px-8 rounded-2xl font-black text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30"
          >
            <ChevronLeft size={20} className="mr-2" /> Previous
          </Button>

          {currentStep === steps.length - 1 ? (
            <Button
              onClick={handleSave}
              disabled={saving}
              className="h-14 px-10 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-lg shadow-xl shadow-indigo-200 transition-all active:scale-95"
            >
              {saving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Trophy size={20} className="mr-2" />}
              Complete Process
            </Button>
          ) : (
            <Button
              onClick={nextStep}
              className="h-14 px-10 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-lg shadow-xl shadow-slate-200 transition-all active:scale-95"
            >
              Next Step <ChevronRight size={20} className="ml-2" />
            </Button>
          )}
        </div>
      </div>

      {/* Tips Card */}
      <Card className="border-none bg-amber-50 rounded-[2rem] p-8">
        <div className="flex gap-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <Lightbulb size={24} />
          </div>
          <div className="space-y-2">
            <h4 className="font-black text-amber-900">Pro Tip for Transformation</h4>
            <p className="text-amber-800/80 font-medium leading-relaxed">
              Don't overthink your answers. The first thing that comes to mind is often the most honest. You can always come back and refine these later as you evolve through the program.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

const Lightbulb = ({ size, className }: { size?: number, className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size || 24} 
    height={size || 24} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .5 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
    <path d="M9 18h6" />
    <path d="M10 22h4" />
  </svg>
);

export default IntentionReflectionSheet;
