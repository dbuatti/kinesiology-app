"use client";

import React, { useState, useEffect } from 'react';
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
  Lightbulb
} from 'lucide-react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

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
        <h2 className="text-2xl font-black text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500 font-medium uppercase tracking-widest">{subtitle}</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8 min-h-screen pb-32">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-20">
        
        {/* Header */}
        <div className="text-center space-y-4 relative">
          <div className="absolute right-0 top-0 flex gap-2 print:hidden">
            <Button variant="outline" size="sm" onClick={() => handleSave()} disabled={saving} className="rounded-xl border-slate-200">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()} className="rounded-xl border-slate-200">
              <Printer className="w-4 h-4" /> Print
            </Button>
          </div>
          <div className="inline-flex items-center justify-center p-2 bg-emerald-100 rounded-full text-emerald-600 mb-4">
            <Briefcase className="w-6 h-6" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-6xl">FNH Business Model</h1>
          <p className="text-xl text-emerald-600 font-medium">Mastery Program — Student Worksheet</p>
        </div>

        {/* Video Section */}
        <section className="space-y-6 print:hidden">
          <div className="aspect-video rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white bg-slate-900">
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
          <Alert className="bg-indigo-50 border-indigo-100 rounded-2xl">
            <Info className="h-4 w-4 text-indigo-600" />
            <AlertDescription className="text-sm text-indigo-900 font-medium">
              Use this worksheet as you watch the session. Complete each section in order — the calculations and reflections build on each other.
            </AlertDescription>
          </Alert>
        </section>

        {/* SECTION 1 */}
        <section className="space-y-10">
          <SectionHeader icon={Clock} title="SECTION 1: The Time-for-Money Trap" subtitle="Core Concept" color="bg-indigo-600" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-none shadow-lg bg-indigo-50/50 rounded-[2rem]">
              <CardContent className="p-8 space-y-4">
                <div className="flex items-center gap-2 text-indigo-600">
                  <Zap size={20} />
                  <h4 className="font-black uppercase tracking-widest text-xs">Key Distinction</h4>
                </div>
                <p className="text-sm text-indigo-900 font-medium leading-relaxed">
                  <strong>Hourly model</strong> = selling your time (which you can't predict or scale).<br/>
                  <strong>Program model</strong> = selling an outcome (which you can price, forecast, and deliver with greater depth).
                </p>
              </CardContent>
            </Card>
            <div className="space-y-4">
              <h4 className="font-bold text-slate-900">Why the Hourly Model Breaks Down</h4>
              <ul className="space-y-2 text-sm text-slate-600 font-medium">
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> Preparation time</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> Report writing</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> Email follow-up</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> Mental load of case management</li>
              </ul>
            </div>
          </div>

          <div className="space-y-8 pl-4 md:pl-16">
            <div className="space-y-4">
              <Label className="text-lg font-bold text-slate-800">What do you currently charge per hour? And what does one hour actually cost you in total time?</Label>
              <Textarea 
                placeholder="Reflect on your true hourly cost..."
                className="min-h-[120px] rounded-2xl border-2 border-slate-100 focus:border-indigo-500 p-6 text-lg"
                value={answers.hourly_cost || ''}
                onChange={(e) => handleInputChange('hourly_cost', e.target.value)}
              />
            </div>
            <div className="space-y-4">
              <Label className="text-lg font-bold text-slate-800">What story are you telling yourself about why you charge per hour? Where did that belief come from?</Label>
              <Textarea 
                placeholder="Explore the origin of your pricing beliefs..."
                className="min-h-[120px] rounded-2xl border-2 border-slate-100 focus:border-indigo-500 p-6 text-lg"
                value={answers.pricing_story || ''}
                onChange={(e) => handleInputChange('pricing_story', e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* SECTION 2 */}
        <section className="space-y-10">
          <SectionHeader icon={TrendingUp} title="SECTION 2: Lifetime Customer Value (LCV)" subtitle="Definition & Strategy" color="bg-emerald-600" />
          
          <div className="p-8 bg-slate-900 text-white rounded-[3rem] shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10"><DollarSign size={150} /></div>
            <p className="text-lg font-medium leading-relaxed relative z-10">
              "Lifetime Customer Value (LCV) is the total amount your average client could spend with you across all your offerings — from entry-level programs to your highest-tier service."
            </p>
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-black text-slate-900 px-2">Build Your LCV</h3>
            <div className="overflow-hidden rounded-[2rem] border-2 border-slate-100 shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b-2 border-slate-100">
                    <th className="p-6 font-black text-[10px] uppercase tracking-widest text-slate-500">Program / Offering</th>
                    <th className="p-6 font-black text-[10px] uppercase tracking-widest text-slate-500">Price ($)</th>
                    <th className="p-6 font-black text-[10px] uppercase tracking-widest text-slate-500">Duration / Format</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    { id: 'entry', label: 'Entry-level program' },
                    { id: 'core', label: 'Core program' },
                    { id: 'advanced', label: 'Advanced / High-ticket' },
                    { id: 'maintenance', label: 'Add-on / Maintenance' }
                  ].map(row => (
                    <tr key={row.id}>
                      <td className="p-6 font-bold text-slate-700">{row.label}</td>
                      <td className="p-4">
                        <Input 
                          type="number" 
                          className="border-none bg-slate-50 focus:ring-0 font-bold" 
                          value={answers[`lcv_${row.id}_price`] || ''}
                          onChange={(e) => handleInputChange(`lcv_${row.id}_price`, e.target.value)}
                        />
                      </td>
                      <td className="p-4">
                        <Input 
                          className="border-none bg-slate-50 focus:ring-0" 
                          value={answers[`lcv_${row.id}_format`] || ''}
                          onChange={(e) => handleInputChange(`lcv_${row.id}_format`, e.target.value)}
                        />
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-emerald-50">
                    <td className="p-6 font-black text-emerald-700 uppercase tracking-widest">TOTAL POTENTIAL LCV</td>
                    <td className="p-4" colSpan={2}>
                      <div className="flex items-center gap-2 text-2xl font-black text-emerald-700">
                        $<Input 
                          type="number" 
                          className="border-none bg-transparent focus:ring-0 text-2xl font-black w-48" 
                          value={answers.lcv_total || ''}
                          onChange={(e) => handleInputChange('lcv_total', e.target.value)}
                        />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4 pl-4 md:pl-16">
            <Label className="text-lg font-bold text-slate-800">What surprised you when you added up your LCV? What does it tell you about your current pricing model?</Label>
            <Textarea 
              placeholder="Your insights on LCV..."
              className="min-h-[120px] rounded-2xl border-2 border-slate-100 focus:border-emerald-500 p-6 text-lg"
              value={answers.lcv_reflection || ''}
              onChange={(e) => handleInputChange('lcv_reflection', e.target.value)}
            />
          </div>
        </section>

        {/* SECTION 3 */}
        <section className="space-y-10">
          <SectionHeader icon={Calculator} title="SECTION 3: The Numbers — Hourly vs. Program" subtitle="Run Your Own Comparison" color="bg-blue-600" />
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4">
              <Card className="border-none shadow-lg bg-blue-50 rounded-[2rem] h-full">
                <CardHeader>
                  <CardTitle className="text-sm font-black uppercase tracking-widest text-blue-600 flex items-center gap-2">
                    <Target size={16} /> Worked Example
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-blue-900 font-medium">
                  <p>Goal: $10,000/month</p>
                  <div className="space-y-2">
                    <p>• At $150/hour → 66 sessions → 16 sessions per week</p>
                    <p>• At $2,950/program → 3.5 programs → ~4 clients</p>
                  </div>
                  <p className="pt-4 border-t border-blue-200 font-bold italic">Same revenue. Radically different workload.</p>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-8">
              <div className="overflow-hidden rounded-[2rem] border-2 border-slate-100 shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b-2 border-slate-100">
                      <th className="p-6 font-black text-[10px] uppercase tracking-widest text-slate-500">Variable</th>
                      <th className="p-6 font-black text-[10px] uppercase tracking-widest text-slate-500">Your Figure</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { id: 'rev_target', label: 'Monthly revenue target ($)' },
                      { id: 'hourly_rate', label: 'Your current hourly rate ($)' },
                      { id: 'sessions_month', label: 'Sessions needed per month (target ÷ rate)' },
                      { id: 'sessions_week', label: 'Sessions needed per week (÷ 4)' },
                      { id: 'program_price', label: 'Your core program price ($)' },
                      { id: 'programs_month', label: 'Programs needed per month (target ÷ price)' },
                      { id: 'clients_week', label: 'Clients you need to see per week' }
                    ].map(row => (
                      <tr key={row.id}>
                        <td className="p-6 font-bold text-slate-700">{row.label}</td>
                        <td className="p-4">
                          <Input 
                            className="border-none bg-slate-50 focus:ring-0 font-bold text-blue-600" 
                            value={answers[row.id] || ''}
                            onChange={(e) => handleInputChange(row.id, e.target.value)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-4 pl-4 md:pl-16">
            <Label className="text-lg font-bold text-slate-800">What does this comparison reveal about where your time is currently going?</Label>
            <Textarea 
              placeholder="Reflect on the numbers..."
              className="min-h-[120px] rounded-2xl border-2 border-slate-100 focus:border-blue-500 p-6 text-lg"
              value={answers.numbers_reflection || ''}
              onChange={(e) => handleInputChange('numbers_reflection', e.target.value)}
            />
          </div>
        </section>

        {/* SECTION 4 */}
        <section className="space-y-10">
          <SectionHeader icon={Zap} title="SECTION 4: Building Your Program Offer" subtitle="Value Add & Inclusions" color="bg-amber-500" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <h3 className="text-xl font-black text-slate-900 px-2">What's Included?</h3>
              <div className="space-y-3">
                {[
                  "In-person / online sessions",
                  "DM or messaging access (with time boundaries)",
                  "Private community or group Q&A",
                  "Mini course or educational content",
                  "Handouts, protocols, or resources",
                  "Monthly maintenance / check-in option"
                ].map(item => (
                  <div key={item} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-sm font-bold text-slate-700">{item}</span>
                    <ToggleGroup type="single" value={answers[`include_${item}`] || ""} onValueChange={(v) => handleInputChange(`include_${item}`, v)} className="bg-white p-1 rounded-xl border border-slate-200">
                      <ToggleGroupItem value="yes" className="rounded-lg px-3 h-8 text-[8px] font-black uppercase data-[state=on]:bg-emerald-600 data-[state=on]:text-white">✓</ToggleGroupItem>
                      <ToggleGroupItem value="no" className="rounded-lg px-3 h-8 text-[8px] font-black uppercase data-[state=on]:bg-slate-400 data-[state=on]:text-white">—</ToggleGroupItem>
                      <ToggleGroupItem value="later" className="rounded-lg px-3 h-8 text-[8px] font-black uppercase data-[state=on]:bg-amber-500 data-[state=on]:text-white">Later</ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-black text-slate-900 px-2">Program Draft</h3>
              <div className="space-y-4">
                <Label className="text-sm font-bold text-slate-500 uppercase tracking-widest">Draft a 2–3 sentence description of your program offer, including what it delivers, what's included, and who it's for:</Label>
                <Textarea 
                  placeholder="What it delivers, what's included, and who it's for..."
                  className="min-h-[250px] rounded-[2rem] border-2 border-slate-100 focus:border-amber-500 p-8 text-lg italic leading-relaxed"
                  value={answers.program_draft || ''}
                  onChange={(e) => handleInputChange('program_draft', e.target.value)}
                />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5 */}
        <section className="space-y-10">
          <SectionHeader icon={Layers} title="SECTION 5: The FNH Clinical Program Structure" subtitle="Session Pathway Map" color="bg-purple-600" />
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              {[
                { range: '1–3', focus: 'Calming the system. Primitive reflexes. Establish stable baseline.' },
                { range: '3–6', focus: 'Cranial nerves, visual system, afferent pathways. Immune & lymphatic screening.' },
                { range: '6–12', focus: 'Remaining pathways. Psychology and identity work. Lifestyle optimisation. Exit strategy.' }
              ].map(phase => (
                <div key={phase.range} className="p-8 bg-white rounded-[2.5rem] border-2 border-slate-100 flex flex-col md:flex-row gap-8">
                  <div className="md:w-48 shrink-0">
                    <Badge className="bg-purple-600 text-white border-none font-black text-xs uppercase tracking-widest px-4 py-1 rounded-full mb-2">Sessions {phase.range}</Badge>
                    <p className="text-sm font-bold text-slate-900 leading-tight">{phase.focus}</p>
                  </div>
                  <div className="flex-1">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Your Notes / ICP Considerations</Label>
                    <Textarea 
                      placeholder="How does this apply to your specific niche?"
                      className="min-h-[100px] rounded-2xl border-none bg-slate-50 focus:ring-1 focus:ring-purple-500 p-4"
                      value={answers[`pathway_notes_${phase.range}`] || ''}
                      onChange={(e) => handleInputChange(`pathway_notes_${phase.range}`, e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 pl-4 md:pl-16">
            <Label className="text-lg font-bold text-slate-800">How does knowing you have 12 sessions change the way you approach Session 1 with a new client?</Label>
            <Textarea 
              placeholder="Reflect on the clinical shift..."
              className="min-h-[120px] rounded-2xl border-2 border-slate-100 focus:border-purple-500 p-6 text-lg"
              value={answers.session1_shift || ''}
              onChange={(e) => handleInputChange('session1_shift', e.target.value)}
            />
          </div>
        </section>

        {/* SECTION 6 */}
        <section className="space-y-10">
          <SectionHeader icon={Users} title="SECTION 6: Your ICP — Ideal Client Profile" subtitle="Niche & Focus" color="bg-rose-600" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              {[
                { id: 'icp_who', label: 'Primary ICP (who you love working with):' },
                { id: 'icp_complaint', label: 'Their core presenting complaint / condition:' },
                { id: 'icp_niche', label: "Community name / niche angle (e.g. 'Mums with Anxiety'):" },
                { id: 'icp_why', label: 'Why this ICP? (clinical fit + personal resonance):' }
              ].map(field => (
                <div key={field.id} className="space-y-2">
                  <Label className="text-sm font-bold text-slate-700 ml-1">{field.label}</Label>
                  <Input 
                    className="h-12 rounded-xl border-2 border-slate-100 focus:border-rose-500 px-4 font-medium"
                    value={answers[field.id] || ''}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                  />
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <Label className="text-lg font-bold text-slate-800">What would change in your marketing, your intake process, and your program content if you committed fully to this ICP?</Label>
              <Textarea 
                placeholder="Visualize the commitment..."
                className="min-h-[300px] rounded-[2rem] border-2 border-slate-100 focus:border-rose-500 p-8 text-lg italic leading-relaxed"
                value={answers.icp_commitment || ''}
                onChange={(e) => handleInputChange('icp_commitment', e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* SECTION 7 */}
        <section className="space-y-10">
          <SectionHeader icon={Target} title="SECTION 7: Forecasting — From Target to Action" subtitle="Business Owner Mindset" color="bg-slate-900" />
          
          <div className="p-8 bg-amber-50 border-2 border-amber-100 rounded-[2.5rem] flex items-start gap-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xl shrink-0">
              <Lightbulb size={32} />
            </div>
            <div className="space-y-2">
              <h4 className="text-xl font-black text-amber-900">Key Insight</h4>
              <p className="text-amber-800 font-medium leading-relaxed italic">
                "Word of mouth is not a strategy — it is an outcome of being good at what you do. A business owner forecasts. A practitioner waits."
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7">
              <div className="overflow-hidden rounded-[2rem] border-2 border-slate-100 shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b-2 border-slate-100">
                      <th className="p-6 font-black text-[10px] uppercase tracking-widest text-slate-500">Question</th>
                      <th className="p-6 font-black text-[10px] uppercase tracking-widest text-slate-500">Your Answer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { id: 'forecast_rev', label: 'What is your 3-month monthly revenue goal?' },
                      { id: 'forecast_price', label: 'What is your core program price?' },
                      { id: 'forecast_needed', label: 'Programs to sell each month (goal ÷ price)?' },
                      { id: 'forecast_pipeline', label: 'Current pipeline — how many warm leads do you have now?' },
                      { id: 'forecast_gap', label: 'Gap — how many new leads do you need this month?' },
                      { id: 'forecast_channels', label: 'How will you find those leads? (list 1–2 channels)' }
                    ].map(row => (
                      <tr key={row.id}>
                        <td className="p-6 font-bold text-slate-700">{row.label}</td>
                        <td className="p-4">
                          <Input 
                            className="border-none bg-slate-50 focus:ring-0 font-bold" 
                            value={answers[row.id] || ''}
                            onChange={(e) => handleInputChange(row.id, e.target.value)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="lg:col-span-5 space-y-4">
              <Label className="text-lg font-bold text-slate-800">What is the ONE constraint most limiting your ability to sell programs right now?</Label>
              <Textarea 
                placeholder="Not enough leads / no clear offer / pricing confidence / something else?"
                className="min-h-[200px] rounded-[2rem] border-2 border-slate-100 focus:border-slate-900 p-8 text-lg"
                value={answers.one_constraint || ''}
                onChange={(e) => handleInputChange('one_constraint', e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* SECTION 8 */}
        <section className="space-y-10">
          <SectionHeader icon={ShieldCheck} title="SECTION 8: Action Steps & Commitments" subtitle="Final Integration" color="bg-emerald-600" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <h3 className="text-xl font-black text-slate-900 px-2">Commitments</h3>
              <div className="space-y-3">
                {[
                  "Define and write down your core program offer",
                  "Calculate your LCV and monthly sales target",
                  "Identify your ICP and write a one-paragraph description",
                  "List 3 warm leads you could have a discovery call with",
                  "Draft your verbal offer script"
                ].map(item => (
                  <div 
                    key={item} 
                    className={cn(
                      "flex items-center justify-between p-5 rounded-2xl border-2 transition-all cursor-pointer",
                      answers[`done_${item}`] ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-100 hover:border-emerald-100"
                    )}
                    onClick={() => handleInputChange(`done_${item}`, !answers[`done_${item}`])}
                  >
                    <span className={cn("text-sm font-bold", answers[`done_${item}`] ? "text-emerald-700" : "text-slate-600")}>{item}</span>
                    <div className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                      answers[`done_${item}`] ? "bg-emerald-600 border-emerald-600" : "border-slate-200"
                    )}>
                      {answers[`done_${item}`] && <CheckCircle2 size={16} className="text-white" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-black text-slate-900 px-2">Mindset Shift</h3>
              <div className="space-y-4">
                <Label className="text-sm font-bold text-slate-500 uppercase tracking-widest">What is the biggest mindset shift this session has triggered for you?</Label>
                <Textarea 
                  placeholder="What does it mean to be a business owner rather than a practitioner who owns a job?"
                  className="min-h-[250px] rounded-[2rem] border-2 border-slate-100 focus:border-emerald-600 p-8 text-lg italic leading-relaxed"
                  value={answers.mindset_shift || ''}
                  onChange={(e) => handleInputChange('mindset_shift', e.target.value)}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center pb-12 border-t border-slate-100 pt-12">
          <p className="text-slate-400 text-sm">
            Functional Neuro Health | Mastery Program | © Nick Moss
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default BusinessModelWorksheet;