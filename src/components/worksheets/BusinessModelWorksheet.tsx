"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Briefcase,
  TrendingUp,
  DollarSign,
  Target,
  Users,
  Clock,
  Save,
  Loader2,
  Printer,
  CheckCircle2,
  Info,
  Zap,
  ArrowRight,
  Calculator,
  ShieldCheck,
  Layers,
  Lightbulb,
  Calendar,
  ChevronRight,
  BarChart3,
  Share2,
  Quote,
  Sparkles,
  MessageSquare,
  PlayCircle,
  Heart,
  Activity,
  RefreshCw
} from 'lucide-react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const MUST_SHOULD_EXAMPLES = [
  "I should be more affordable",
  "I must help everyone who asks",
  "I should work harder to earn more",
  "I must have more certifications first",
  "I should charge what others charge"
];

const BusinessModelWorksheet = () => {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data, error } = await supabase
          .from('business_model_worksheets')
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
        .from('business_model_worksheets')
        .upsert({
          user_id: userId,
          form_data: answers,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;
      if (!silent) toast.success("Business plan saved.");
    } catch (error: any) {
      if (!silent) toast.error("Failed to save progress.");
    } finally {
      if (!silent) setSaving(false);
    }
  };

  const handleInputChange = (id: string, value: any) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const addChip = (id: string, text: string) => {
    const current = answers[id] || '';
    if (current.includes(text)) return;
    handleInputChange(id, current ? `${current}\n- ${text}` : `- ${text}`);
  };

  // --- AUTO CALCULATIONS ---

  const lcvTotal = useMemo(() => {
    const entry = parseFloat(answers.lcv_entry_price) || 0;
    const core = parseFloat(answers.lcv_core_price) || 0;
    const advanced = parseFloat(answers.lcv_advanced_price) || 0;
    const maintenance = parseFloat(answers.lcv_maintenance_price) || 0;
    return entry + core + advanced + maintenance;
  }, [answers]);

  const sessionsNeeded = useMemo(() => {
    const target = parseFloat(answers.rev_target) || 0;
    const rate = parseFloat(answers.hourly_rate) || 0;
    if (rate === 0) return 0;
    return Math.ceil(target / rate);
  }, [answers.rev_target, answers.hourly_rate]);

  const programsNeeded = useMemo(() => {
    const target = parseFloat(answers.rev_target) || 0;
    const price = parseFloat(answers.program_price) || 0;
    if (price === 0) return 0;
    return Math.ceil(target / price);
  }, [answers.rev_target, answers.program_price]);

  const chartData = useMemo(() => [
    { name: 'Hourly Grind', value: sessionsNeeded, color: '#6366f1', label: 'Sessions/mo' },
    { name: 'Program Flow', value: programsNeeded, color: '#10b981', label: 'Clients/mo' }
  ], [sessionsNeeded, programsNeeded]);

  const forecastNeeded = useMemo(() => {
    const goal = parseFloat(answers.forecast_rev) || 0;
    const price = parseFloat(answers.forecast_price) || 0;
    if (price === 0) return 0;
    return Math.ceil(goal / price);
  }, [answers.forecast_rev, answers.forecast_price]);

  const forecastGap = useMemo(() => {
    const needed = forecastNeeded;
    const pipeline = parseFloat(answers.forecast_pipeline) || 0;
    return Math.max(0, needed - pipeline);
  }, [forecastNeeded, answers.forecast_pipeline]);

  const completionProgress = useMemo(() => {
    const totalFields = 25;
    const filledFields = Object.values(answers).filter(v => v && v !== '').length;
    return Math.min(100, Math.round((filledFields / totalFields) * 100));
  }, [answers]);

  const handleShare = () => {
    const text = `🚀 FNH BUSINESS MODEL UPDATE\n\n` +
      `MY ICP: ${answers.icp_who || 'Not set'}\n` +
      `CORE PROGRAM: ${answers.program_draft?.substring(0, 100) || 'Not set'}...\n` +
      `REVENUE GOAL: $${answers.forecast_rev || 0}/mo\n\n` +
      `COMMITMENT: ${answers.personal_commitment || 'To mastery.'}\n\n` +
      `#FNHMastery #BusinessModel`;
    
    navigator.clipboard.writeText(text);
    toast.success("Formatted for Community!", {
      description: "Summary copied to clipboard. Ready to post!"
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
        <p className="text-slate-500 font-medium">Loading your business model...</p>
      </div>
    );
  }

  const SectionHeader = ({ icon: Icon, title, subtitle, color }: any) => (
    <div className="flex items-center gap-4 mb-8">
      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg", color)}>
        <Icon size={28} className="text-white" />
      </div>
      <div>
        <h2 className="text-3xl font-serif font-bold text-slate-900">{title}</h2>
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">{subtitle}</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8 min-h-screen pb-32">
      {/* Sticky Progress Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-3 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4 flex-1 max-w-md">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-emerald-100">B</div>
          <div className="flex-1 space-y-1">
            <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-slate-400">
              <span>Mastery Progress</span>
              <span>{completionProgress}%</span>
            </div>
            <Progress value={completionProgress} className="h-1 bg-slate-100 [&>div]:bg-emerald-600" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleShare} className="text-indigo-600 hover:bg-indigo-50 font-bold text-[10px] uppercase tracking-widest">
            <Share2 size={14} className="mr-2" /> Share
          </Button>
          <Button size="sm" onClick={() => handleSave()} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-100">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} className="mr-2" />} Save Plan
          </Button>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-24 pt-12">
        
        {/* Header */}
        <div className="text-center space-y-6 relative">
          <div className="inline-flex items-center justify-center p-3 bg-emerald-100 rounded-2xl text-emerald-600 mb-4 shadow-inner">
            <Briefcase className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-tighter text-slate-900">Business Model</h1>
            <p className="text-xl text-emerald-600 font-medium tracking-widest uppercase">Mastery Program — Student Worksheet</p>
          </div>
          <div className="max-w-2xl mx-auto p-6 bg-slate-50 rounded-[2rem] border border-slate-100 italic text-slate-500 text-lg">
            "Transition from a practitioner who owns a job to a business owner who delivers outcomes."
          </div>
        </div>

        {/* Video Section */}
        <section className="space-y-8 print:hidden">
          <div className="aspect-video rounded-[3.5rem] overflow-hidden shadow-3xl border-[12px] border-white bg-slate-900 relative group">
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/o6ngbtsYD0s"
              title="FNH Business Model Training"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            ></iframe>
          </div>
          <div className="flex items-center gap-4 p-6 bg-indigo-900 text-white rounded-[2.5rem] shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
              <PlayCircle size={24} className="text-indigo-300" />
            </div>
            <p className="text-sm font-medium leading-relaxed">
              Watch the session and complete this worksheet in real-time. Your progress is saved automatically to your practitioner profile.
            </p>
          </div>
        </section>

        {/* SECTION 1 */}
        <section className="space-y-12">
          <SectionHeader icon={Clock} title="The Time-for-Money Trap" subtitle="Section 1: Core Concept" color="bg-indigo-600" />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-8">
              <Card className="border-none shadow-xl rounded-[2.5rem] bg-indigo-50/50 border-2 border-indigo-100">
                <CardContent className="p-10 space-y-6">
                  <div className="flex items-center gap-3 text-indigo-600">
                    <Zap size={24} className="fill-current" />
                    <h4 className="font-black uppercase tracking-[0.2em] text-xs">Key Distinction</h4>
                  </div>
                  <p className="text-lg text-indigo-900 font-medium leading-relaxed">
                    <strong>Hourly model</strong> = selling your time (which you can't predict or scale).<br/>
                    <strong>Program model</strong> = selling an outcome (which you can price, forecast, and deliver with greater depth).
                  </p>
                </CardContent>
              </Card>
              
              <div className="p-8 bg-white rounded-[2.5rem] border-2 border-slate-100 space-y-6">
                <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-500" /> Why the Hourly Model Breaks Down
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  {["Preparation time", "Report writing", "Email follow-up", "Mental load of case management"].map(item => (
                    <div key={item} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl text-sm font-bold text-slate-600">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" /> {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-10">
              <div className="space-y-4">
                <Label className="text-xl font-serif font-bold text-slate-800">What do you currently charge per hour? And what does one hour actually cost you in total time?</Label>
                <Textarea 
                  placeholder="Reflect on your true hourly cost..."
                  className="min-h-[150px] rounded-[2rem] border-2 border-slate-100 focus:border-indigo-500 p-8 text-lg leading-relaxed shadow-inner"
                  value={answers.hourly_cost || ''}
                  onChange={(e) => handleInputChange('hourly_cost', e.target.value)}
                />
              </div>
              <div className="space-y-4">
                <Label className="text-xl font-serif font-bold text-slate-800">What story are you telling yourself about why you charge per hour?</Label>
                <div className="flex flex-wrap gap-2 mb-4">
                  {MUST_SHOULD_EXAMPLES.map(chip => (
                    <button key={chip} onClick={() => addChip('pricing_story', chip)} className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-indigo-100 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-all border border-transparent hover:border-indigo-200">
                      + {chip}
                    </button>
                  ))}
                </div>
                <Textarea 
                  placeholder="Explore the origin of your pricing beliefs..."
                  className="min-h-[150px] rounded-[2rem] border-2 border-slate-100 focus:border-indigo-500 p-8 text-lg leading-relaxed shadow-inner"
                  value={answers.pricing_story || ''}
                  onChange={(e) => handleInputChange('pricing_story', e.target.value)}
                />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2 */}
        <section className="space-y-12">
          <SectionHeader icon={TrendingUp} title="Lifetime Customer Value (LCV)" subtitle="Section 2: Definition & Strategy" color="bg-emerald-600" />
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-4 space-y-6">
              <div className="p-8 bg-slate-900 text-white rounded-[3rem] shadow-2xl relative overflow-hidden h-full flex flex-col justify-center">
                <div className="absolute top-0 right-0 p-8 opacity-10"><DollarSign size={120} /></div>
                <h4 className="text-xs font-black uppercase tracking-[0.3em] text-emerald-400 mb-4">The Definition</h4>
                <p className="text-xl font-serif italic leading-relaxed relative z-10">
                  "LCV is the total amount your average client could spend with you across all your offerings — from entry-level to advanced."
                </p>
                <div className="mt-8 pt-8 border-t border-white/10">
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">
                    When you package into programs, LCV becomes a concrete number you can work with.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-8">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-2xl font-black text-slate-900">Build Your LCV</h3>
                <Badge className="bg-emerald-500 text-white border-none font-black text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg shadow-emerald-100">Auto-Calculating</Badge>
              </div>
              <div className="overflow-hidden rounded-[2.5rem] border-2 border-slate-100 shadow-xl bg-white">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b-2 border-slate-100">
                      <th className="p-8 font-black text-[10px] uppercase tracking-widest text-slate-500">Program / Offering</th>
                      <th className="p-8 font-black text-[10px] uppercase tracking-widest text-slate-500">Price ($)</th>
                      <th className="p-8 font-black text-[10px] uppercase tracking-widest text-slate-500">Format</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { id: 'entry', label: 'Entry-level program' },
                      { id: 'core', label: 'Core program' },
                      { id: 'advanced', label: 'Advanced / High-ticket' },
                      { id: 'maintenance', label: 'Add-on / Maintenance' }
                    ].map(row => (
                      <tr key={row.id} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="p-8 font-bold text-slate-700">{row.label}</td>
                        <td className="p-6">
                          <div className="flex items-center gap-3 bg-slate-100 rounded-2xl px-4 py-2 border border-transparent group-hover:border-emerald-200 transition-all">
                            <span className="text-slate-400 font-black">$</span>
                            <Input 
                              type="number" 
                              className="border-none bg-transparent focus:ring-0 font-black text-lg p-0" 
                              value={answers[`lcv_${row.id}_price`] || ''}
                              onChange={(e) => handleInputChange(`lcv_${row.id}_price`, e.target.value)}
                            />
                          </div>
                        </td>
                        <td className="p-6">
                          <Input 
                            className="border-none bg-slate-50 focus:ring-0 rounded-xl h-12 font-medium" 
                            placeholder="e.g. 4 weeks / Online"
                            value={answers[`lcv_${row.id}_format`] || ''}
                            onChange={(e) => handleInputChange(`lcv_${row.id}_format`, e.target.value)}
                          />
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-emerald-600 text-white">
                      <td className="p-8 font-black text-xs uppercase tracking-[0.3em]">TOTAL POTENTIAL LCV</td>
                      <td className="p-8" colSpan={2}>
                        <div className="flex items-center gap-3 text-4xl font-black">
                          <span className="opacity-50">$</span>
                          {lcvTotal.toLocaleString()}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3 */}
        <section className="space-y-12">
          <SectionHeader icon={Calculator} title="The Numbers — Hourly vs. Program" subtitle="Section 3: Run Your Own Comparison" color="bg-blue-600" />
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-5 space-y-8">
              <Card className="border-none shadow-2xl rounded-[3rem] bg-slate-900 text-white overflow-hidden">
                <CardHeader className="p-8 pb-4 border-b border-white/5">
                  <CardTitle className="text-sm font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                    <BarChart3 size={18} /> Workload Impact Visualizer
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 'bold' }} />
                        <YAxis hide />
                        <Tooltip 
                          cursor={{ fill: '#ffffff05' }}
                          contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={60}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="text-center p-4 bg-white/5 rounded-2xl border border-white/10">
                      <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Hourly Grind</p>
                      <p className="text-2xl font-black text-indigo-400">{sessionsNeeded}</p>
                      <p className="text-[8px] font-bold text-slate-500 uppercase">Sessions/mo</p>
                    </div>
                    <div className="text-center p-4 bg-white/5 rounded-2xl border border-white/10">
                      <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Program Flow</p>
                      <p className="text-2xl font-black text-emerald-400">{programsNeeded}</p>
                      <p className="text-[8px] font-bold text-slate-500 uppercase">Clients/mo</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-7">
              <div className="overflow-hidden rounded-[2.5rem] border-2 border-slate-100 shadow-xl bg-white">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b-2 border-slate-100">
                      <th className="p-8 font-black text-[10px] uppercase tracking-widest text-slate-500">Variable</th>
                      <th className="p-8 font-black text-[10px] uppercase tracking-widest text-slate-500">Your Figure</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-8 font-bold text-slate-700">Monthly revenue target ($)</td>
                      <td className="p-6">
                        <div className="flex items-center gap-3 bg-slate-100 rounded-2xl px-4 py-2">
                          <span className="text-slate-400 font-black">$</span>
                          <Input 
                            type="number"
                            className="border-none bg-transparent focus:ring-0 font-black text-lg p-0 text-blue-600" 
                            value={answers.rev_target || ''}
                            onChange={(e) => handleInputChange('rev_target', e.target.value)}
                          />
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="p-8 font-bold text-slate-700">Your current hourly rate ($)</td>
                      <td className="p-6">
                        <div className="flex items-center gap-3 bg-slate-100 rounded-2xl px-4 py-2">
                          <span className="text-slate-400 font-black">$</span>
                          <Input 
                            type="number"
                            className="border-none bg-transparent focus:ring-0 font-black text-lg p-0 text-blue-600" 
                            value={answers.hourly_rate || ''}
                            onChange={(e) => handleInputChange('hourly_rate', e.target.value)}
                          />
                        </div>
                      </td>
                    </tr>
                    <tr className="bg-indigo-50/50">
                      <td className="p-8 font-bold text-indigo-900">Sessions needed per month (target ÷ rate)</td>
                      <td className="p-8 font-black text-indigo-600 text-3xl">{sessionsNeeded}</td>
                    </tr>
                    <tr>
                      <td className="p-8 font-bold text-slate-700">Your core program price ($)</td>
                      <td className="p-6">
                        <div className="flex items-center gap-3 bg-slate-100 rounded-2xl px-4 py-2">
                          <span className="text-slate-400 font-black">$</span>
                          <Input 
                            type="number"
                            className="border-none bg-transparent focus:ring-0 font-black text-lg p-0 text-emerald-600" 
                            value={answers.program_price || ''}
                            onChange={(e) => handleInputChange('program_price', e.target.value)}
                          />
                        </div>
                      </td>
                    </tr>
                    <tr className="bg-emerald-50/50">
                      <td className="p-8 font-bold text-emerald-900">Programs needed per month (target ÷ price)</td>
                      <td className="p-8 font-black text-emerald-600 text-3xl">{programsNeeded}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4 */}
        <section className="space-y-12">
          <SectionHeader icon={Zap} title="Building Your Program Offer" subtitle="Section 4: Value Add & Inclusions" color="bg-amber-500" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <h3 className="text-2xl font-black text-slate-900 px-2">What's Included?</h3>
              <div className="space-y-3">
                {[
                  "In-person / online sessions",
                  "DM or messaging access (with time boundaries)",
                  "Private community or group Q&A",
                  "Mini course or educational content",
                  "Handouts, protocols, or resources",
                  "Monthly maintenance / check-in option"
                ].map(item => (
                  <div key={item} className="flex items-center justify-between p-5 bg-slate-50 rounded-[1.5rem] border-2 border-transparent hover:border-amber-200 transition-all group">
                    <span className="text-sm font-bold text-slate-700">{item}</span>
                    <ToggleGroup type="single" value={answers[`include_${item}`] || ""} onValueChange={(v) => handleInputChange(`include_${item}`, v)} className="bg-white p-1 rounded-xl border border-slate-200">
                      <ToggleGroupItem value="yes" className="rounded-lg px-4 h-9 text-[10px] font-black uppercase data-[state=on]:bg-emerald-600 data-[state=on]:text-white">✓</ToggleGroupItem>
                      <ToggleGroupItem value="no" className="rounded-lg px-4 h-9 text-[10px] font-black uppercase data-[state=on]:bg-slate-400 data-[state=on]:text-white">—</ToggleGroupItem>
                      <ToggleGroupItem value="later" className="rounded-lg px-4 h-9 text-[10px] font-black uppercase data-[state=on]:bg-amber-500 data-[state=on]:text-white">Later</ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-8">
              <h3 className="text-2xl font-black text-slate-900 px-2">Program Draft</h3>
              <div className="space-y-4">
                <Label className="text-sm font-bold text-slate-500 uppercase tracking-widest ml-1">Draft a 2–3 sentence description of your program offer:</Label>
                <Textarea 
                  placeholder="What it delivers, what's included, and who it's for..."
                  className="min-h-[300px] rounded-[3rem] border-2 border-slate-100 focus:border-amber-500 p-10 text-xl italic leading-relaxed shadow-xl"
                  value={answers.program_draft || ''}
                  onChange={(e) => handleInputChange('program_draft', e.target.value)}
                />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5 */}
        <section className="space-y-12">
          <SectionHeader icon={Layers} title="The FNH Clinical Program Structure" subtitle="Section 5: Session Pathway Map" color="bg-purple-600" />
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {[
                { range: '1–3', focus: 'Calming the system. Primitive reflexes. Establish stable baseline.', color: 'bg-indigo-600' },
                { range: '3–6', focus: 'Cranial nerves, visual system, afferent pathways. Immune & lymphatic screening.', color: 'bg-purple-600' },
                { range: '6–12', focus: 'Remaining pathways. Psychology and identity work. Lifestyle optimisation. Exit strategy.', color: 'bg-rose-600' }
              ].map(phase => (
                <div key={phase.range} className="p-10 bg-white rounded-[3rem] border-2 border-slate-100 flex flex-col md:flex-row gap-10 group hover:border-purple-200 transition-all shadow-sm hover:shadow-xl">
                  <div className="md:w-64 shrink-0 space-y-4">
                    <Badge className={cn("text-white border-none font-black text-[10px] uppercase tracking-[0.3em] px-4 py-1.5 rounded-full shadow-lg", phase.color)}>Sessions {phase.range}</Badge>
                    <p className="text-lg font-serif font-bold text-slate-900 leading-tight">{phase.focus}</p>
                  </div>
                  <div className="flex-1">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Your Notes / ICP Considerations</Label>
                    <Textarea 
                      placeholder="How does this apply to your specific niche?"
                      className="min-h-[120px] rounded-2xl border-none bg-slate-50 focus:ring-2 focus:ring-purple-500 p-6 text-base font-medium"
                      value={answers[`pathway_notes_${phase.range}`] || ''}
                      onChange={(e) => handleInputChange(`pathway_notes_${phase.range}`, e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 pl-4 md:pl-16">
            <Label className="text-xl font-serif font-bold text-slate-800">How does knowing you have 12 sessions change the way you approach Session 1 with a new client?</Label>
            <Textarea 
              placeholder="Reflect on the clinical shift..."
              className="min-h-[150px] rounded-[2.5rem] border-2 border-slate-100 focus:border-purple-500 p-10 text-xl leading-relaxed shadow-inner"
              value={answers.session1_shift || ''}
              onChange={(e) => handleInputChange('session1_shift', e.target.value)}
            />
          </div>
        </section>

        {/* SECTION 6 */}
        <section className="space-y-12">
          <SectionHeader icon={Users} title="Your ICP — Ideal Client Profile" subtitle="Section 6: Niche & Focus" color="bg-rose-600" />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-8">
              {[
                { id: 'icp_who', label: 'Primary ICP (who you love working with):', icon: Heart },
                { id: 'icp_complaint', label: 'Their core presenting complaint / condition:', icon: Activity },
                { id: 'icp_niche', label: "Community name / niche angle (e.g. 'Mums with Anxiety'):", icon: MessageSquare },
                { id: 'icp_why', label: 'Why this ICP? (clinical fit + personal resonance):', icon: Sparkles }
              ].map(field => (
                <div key={field.id} className="space-y-3">
                  <Label className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 ml-1">
                    <field.icon size={14} className="text-rose-500" /> {field.label}
                  </Label>
                  <Input 
                    className="h-14 rounded-2xl border-2 border-slate-100 focus:border-rose-500 px-6 text-lg font-bold bg-white shadow-sm"
                    value={answers[field.id] || ''}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                  />
                </div>
              ))}
            </div>
            <div className="space-y-6">
              <Label className="text-xl font-serif font-bold text-slate-800">What would change in your marketing and intake if you committed fully to this ICP?</Label>
              <Textarea 
                placeholder="Visualize the commitment..."
                className="min-h-[400px] rounded-[3rem] border-2 border-slate-100 focus:border-rose-500 p-10 text-xl italic leading-relaxed shadow-2xl"
                value={answers.icp_commitment || ''}
                onChange={(e) => handleInputChange('icp_commitment', e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* SECTION 7 */}
        <section className="space-y-12">
          <SectionHeader icon={Target} title="Forecasting — From Target to Action" subtitle="Section 7: Business Owner Mindset" color="bg-slate-900" />
          
          <div className="p-10 bg-amber-50 border-2 border-amber-100 rounded-[3rem] flex items-start gap-8 shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-2xl shrink-0">
              <Lightbulb size={32} />
            </div>
            <div className="space-y-3">
              <h4 className="text-2xl font-serif font-bold text-amber-900">Key Insight</h4>
              <p className="text-lg text-amber-800 font-medium leading-relaxed italic">
                "Word of mouth is not a strategy — it is an outcome of being good at what you do. A business owner forecasts. A practitioner waits."
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-7 space-y-8">
              <div className="overflow-hidden rounded-[2.5rem] border-2 border-slate-100 shadow-xl bg-white">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b-2 border-slate-100">
                      <th className="p-8 font-black text-[10px] uppercase tracking-widest text-slate-500">Question</th>
                      <th className="p-8 font-black text-[10px] uppercase tracking-widest text-slate-500">Your Answer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-8 font-bold text-slate-700">What is your 3-month monthly revenue goal?</td>
                      <td className="p-6">
                        <div className="flex items-center gap-3 bg-slate-100 rounded-2xl px-4 py-2">
                          <span className="text-slate-400 font-black">$</span>
                          <Input 
                            type="number"
                            className="border-none bg-transparent focus:ring-0 font-black text-lg p-0" 
                            value={answers.forecast_rev || ''}
                            onChange={(e) => handleInputChange('forecast_rev', e.target.value)}
                          />
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="p-8 font-bold text-slate-700">What is your core program price?</td>
                      <td className="p-6">
                        <div className="flex items-center gap-3 bg-slate-100 rounded-2xl px-4 py-2">
                          <span className="text-slate-400 font-black">$</span>
                          <Input 
                            type="number"
                            className="border-none bg-transparent focus:ring-0 font-black text-lg p-0" 
                            value={answers.forecast_price || ''}
                            onChange={(e) => handleInputChange('forecast_price', e.target.value)}
                          />
                        </div>
                      </td>
                    </tr>
                    <tr className="bg-indigo-50/50">
                      <td className="p-8 font-bold text-indigo-900">Programs to sell each month (goal ÷ price)?</td>
                      <td className="p-8 font-black text-indigo-600 text-3xl">{forecastNeeded}</td>
                    </tr>
                    <tr>
                      <td className="p-8 font-bold text-slate-700">Current pipeline — how many warm leads do you have now?</td>
                      <td className="p-6">
                        <Input 
                          type="number"
                          className="bg-slate-50 border-2 border-slate-100 rounded-2xl h-12 px-4 font-black text-lg" 
                          value={answers.forecast_pipeline || ''}
                          onChange={(e) => handleInputChange('forecast_pipeline', e.target.value)}
                        />
                      </td>
                    </tr>
                    <tr className="bg-rose-50/50">
                      <td className="p-8 font-bold text-rose-900">Gap — how many new leads do you need this month?</td>
                      <td className="p-8 font-black text-rose-600 text-3xl">{forecastGap}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="lg:col-span-5 space-y-8">
              <div className="space-y-4">
                <Label className="text-xl font-serif font-bold text-slate-800">What is the ONE constraint most limiting your ability to sell programs right now?</Label>
                <Textarea 
                  placeholder="Not enough leads / no clear offer / pricing confidence / something else?"
                  className="min-h-[250px] rounded-[3rem] border-2 border-slate-100 focus:border-slate-900 p-10 text-xl shadow-inner"
                  value={answers.one_constraint || ''}
                  onChange={(e) => handleInputChange('one_constraint', e.target.value)}
                />
              </div>
              
              <div className="p-8 bg-indigo-50 rounded-[2.5rem] border-2 border-indigo-100 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2">
                  <TrendingUp size={16} /> Pipeline Progress
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase">
                    <span className="text-slate-400">Current Pipeline</span>
                    <span className="text-indigo-600">{Math.round((parseFloat(answers.forecast_pipeline) || 0) / forecastNeeded * 100) || 0}% of Goal</span>
                  </div>
                  <Progress value={(parseFloat(answers.forecast_pipeline) || 0) / forecastNeeded * 100} className="h-2 bg-indigo-100 [&>div]:bg-indigo-600" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 8 */}
        <section className="space-y-12">
          <SectionHeader icon={ShieldCheck} title="Action Steps & Commitments" subtitle="Section 8: Final Integration" color="bg-emerald-600" />
          
          <div className="space-y-8">
            <h3 className="text-2xl font-black text-slate-900 px-2">Commitments</h3>
            <div className="overflow-hidden rounded-[2.5rem] border-2 border-slate-100 shadow-xl bg-white">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b-2 border-slate-100">
                    <th className="p-8 font-black text-[10px] uppercase tracking-widest text-slate-500">Action Item</th>
                    <th className="p-8 font-black text-[10px] uppercase tracking-widest text-slate-500">By When</th>
                    <th className="p-8 font-black text-[10px] uppercase tracking-widest text-slate-500 text-center">Done</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    "Define and write down your core program offer",
                    "Calculate your LCV and monthly sales target",
                    "Identify your ICP and write a one-paragraph description",
                    "List 3 warm leads you could have a discovery call with",
                    "Draft your verbal offer script"
                  ].map(item => (
                    <tr key={item} className={cn("group transition-colors", answers[`done_${item}`] && "bg-emerald-50/30")}>
                      <td className="p-8 font-bold text-slate-700">{item}</td>
                      <td className="p-6">
                        <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100 group-hover:border-emerald-200 transition-all">
                          <Calendar size={14} className="text-slate-400" />
                          <Input 
                            type="date"
                            className="border-none bg-transparent focus:ring-0 font-bold text-xs p-0" 
                            value={answers[`date_${item}`] || ''}
                            onChange={(e) => handleInputChange(`date_${item}`, e.target.value)}
                          />
                        </div>
                      </td>
                      <td className="p-6 text-center">
                        <button 
                          onClick={() => handleInputChange(`done_${item}`, !answers[`done_${item}`])}
                          className={cn(
                            "w-10 h-10 rounded-2xl border-2 mx-auto flex items-center justify-center transition-all shadow-sm",
                            answers[`done_${item}`] ? "bg-emerald-600 border-emerald-600 text-white" : "bg-white border-slate-200 hover:border-emerald-400 text-slate-300"
                          )}
                        >
                          {answers[`done_${item}`] ? <CheckCircle2 size={20} /> : <div className="w-2 h-2 rounded-full bg-current" />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <h3 className="text-2xl font-black text-slate-900 px-2 flex items-center gap-3">
                <Sparkles size={24} className="text-emerald-500" /> My Own Commitment
              </h3>
              <Textarea 
                placeholder="What is your personal commitment to this shift?"
                className="min-h-[200px] rounded-[3rem] border-2 border-slate-100 focus:border-emerald-600 p-10 text-xl italic shadow-xl"
                value={answers.personal_commitment || ''}
                onChange={(e) => handleInputChange('personal_commitment', e.target.value)}
              />
            </div>

            <div className="space-y-6">
              <h3 className="text-2xl font-black text-slate-900 px-2 flex items-center gap-3">
                <RefreshCw size={24} className="text-emerald-500" /> Mindset Shift
              </h3>
              <div className="space-y-4">
                <Label className="text-sm font-bold text-slate-500 uppercase tracking-widest ml-1">What is the biggest mindset shift this session has triggered for you?</Label>
                <Textarea 
                  placeholder="What does it mean to be a business owner rather than a practitioner who owns a job?"
                  className="min-h-[200px] rounded-[3rem] border-2 border-slate-100 focus:border-emerald-600 p-10 text-xl italic leading-relaxed shadow-xl"
                  value={answers.mindset_shift || ''}
                  onChange={(e) => handleInputChange('mindset_shift', e.target.value)}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center pb-12 border-t border-slate-100 pt-12 space-y-4">
          <div className="flex justify-center gap-8">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <ShieldCheck size={14} className="text-emerald-500" /> Securely Saved
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <CheckCircle2 size={14} className="text-emerald-500" /> Mastery Verified
            </div>
          </div>
          <p className="text-slate-400 text-xs font-medium">
            Functional Neuro Health | Mastery Program | © Nick Moss
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default BusinessModelWorksheet;