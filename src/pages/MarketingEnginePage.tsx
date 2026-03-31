"use client";

import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Mic, Brain, Target, Laptop, AlertTriangle, Lightbulb, 
  CheckCircle2, Workflow, Clock, Sparkles, Link as LinkIcon, Send,
  BookOpen, Wand2, Copy, Check, User, Activity, History, Mail,
  Trophy, ArrowRight, Star
} from "lucide-react";
import AppLayout from "@/components/crm/AppLayout";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { cn } from "@/lib/utils";
import { showSuccess } from "@/utils/toast";
import { format } from "date-fns";

const MarketingEnginePage = () => {
  const [activeTab, setActiveTab] = useState("guide");
  const [recentWins, setRecentWins] = useState<any[]>([]);
  const [selectedWin, setSelectedWin] = useState<string>("custom");
  const [outputFormat, setOutputFormat] = useState("kit_broadcast");
  const [cta, setCta] = useState("book_session");
  
  const [customStory, setCustomStory] = useState("");
  const [customInsight, setCustomInsight] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchWins = async () => {
      // Fetch completed sessions with significant BOLT improvements or detailed notes
      const { data } = await supabase
        .from('appointments')
        .select('id, goal, issue, bolt_score, date, clients(name)')
        .eq('status', 'Completed')
        .not('issue', 'is', null)
        .order('date', { ascending: false })
        .limit(10);
      
      if (data) setRecentWins(data);
    };
    fetchWins();
  }, []);

  const generatedPrompt = useMemo(() => {
    let contextText = "";

    if (selectedWin === "custom") {
      contextText = `STORY/EXPERIENCE:\n${customStory || "[Insert your story here]"}\n\nCORE INSIGHT/LESSON:\n${customInsight || "[Insert the main takeaway here]"}`;
    } else {
      const win = recentWins.find(w => w.id === selectedWin);
      if (win) {
        contextText = `CLINICAL CASE STUDY (Anonymized):\n- Client Issue: ${win.issue}\n- Client Goal: ${win.goal}\n- Clinical Outcome: ${win.bolt_score ? `Physiological markers improved (e.g., BOLT score reached ${win.bolt_score}s). ` : ''}The nervous system shifted from a state of threat to a state of safety and integration.\n\nCORE INSIGHT:\nSometimes the site of pain isn't the source of the threat. When we address the nervous system's safety first, the structural symptoms often resolve themselves.`;
      }
    }

    const formatInstruction = 
      outputFormat === "kit_broadcast" ? "Create a high-value Kit (ConvertKit) Broadcast email. Include 3 variations of a compelling subject line. Use a personal, one-to-one tone. Format with plenty of white space for readability in the Kit editor. Ensure the content fits perfectly into the 'Antigravity Clinical Standard' HTML template." :
      outputFormat === "3_emails" ? "Create a 3-part Kit sequence (Monday: Story/Hook, Wednesday: Value/Education, Friday: Offer/Call to Action). Include engaging subject lines and preview text for each." :
      outputFormat === "linkedin" ? "Create an engaging LinkedIn post formatted with short, punchy paragraphs. Start with a strong hook, deliver the value, and end with the call to action." :
      "Create a 5-slide Instagram carousel script. Slide 1: Hook, Slides 2-4: Value/Education, Slide 5: Call to Action.";

    const ctaInstruction = 
      cta === "book_session" ? "Encourage the reader to book an initial kinesiology assessment to identify their own nervous system blocks." :
      cta === "reply" ? "Ask the reader to reply to this email with their biggest current struggle related to this topic." :
      "Direct the reader to check out my latest resource or worksheet on this topic.";

    return `Act as an expert copywriter for a functional neurology and kinesiology practice. I want to share a clinical insight to educate my audience, demonstrate authority, and build trust.

CONTEXT TO USE:
${contextText}

TASK:
${formatInstruction}

TONE & STYLE:
- Professional, empathetic, and insightful.
- Authoritative but accessible (avoid overly dense medical jargon, explain concepts simply).
- Use a storytelling framework: Hook -> Conflict -> Resolution (Insight) -> Action.

CALL TO ACTION:
${ctaInstruction}

Please provide the final output ready to be reviewed.`;
  }, [selectedWin, recentWins, customStory, customInsight, outputFormat, cta]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    showSuccess("Prompt copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AppLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
        <Breadcrumbs items={[{ label: "Business Tools" }, { label: "AI Marketing Engine" }]} />

        {/* Hero Section */}
        <div className="relative rounded-[3.5rem] overflow-hidden bg-slate-950 text-white p-12 shadow-2xl group border border-slate-800">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 via-slate-950 to-teal-900/40" />
          <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <Mic size={200} />
          </div>
          
          <div className="relative z-10 flex flex-col items-start space-y-6">
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 font-black text-[10px] uppercase tracking-[0.3em] px-4 py-1">
              Business Operating System
            </Badge>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight">The AI Marketing Engine</h1>
            <p className="text-lg text-slate-300 font-medium max-w-2xl leading-relaxed">
              Transform clinical wins and raw thoughts into distribution-ready assets for your Kit newsletter.
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-14 bg-muted p-1.5 rounded-2xl mb-8">
            <TabsTrigger value="guide" className="flex items-center gap-2 rounded-xl h-11 font-black uppercase tracking-wider text-[10px]">
              <BookOpen size={14} /> The OS Guide
            </TabsTrigger>
            <TabsTrigger value="studio" className="flex items-center gap-2 rounded-xl h-11 font-black uppercase tracking-wider text-[10px]">
              <Wand2 size={14} /> Prompt Studio
            </TabsTrigger>
          </TabsList>

          <TabsContent value="guide" className="space-y-12 mt-0">
            {/* Wins Vault Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-2xl font-black flex items-center gap-3 text-slate-900">
                  <Trophy size={24} className="text-amber-500" /> The Wins Vault
                </h2>
                <Badge variant="outline" className="font-bold border-amber-200 text-amber-600">
                  {recentWins.length} Potential Stories
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentWins.map(win => (
                  <Card key={win.id} className="border-none shadow-md rounded-[2rem] bg-card hover:shadow-xl transition-all group cursor-pointer" onClick={() => { setSelectedWin(win.id); setActiveTab('studio'); }}>
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-all">
                          <Star size={20} className="fill-current" />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{format(new Date(win.date), "MMM d")}</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">{win.clients?.name}</p>
                        <h3 className="font-black text-lg text-slate-900 line-clamp-2 leading-tight">{win.issue}</h3>
                      </div>
                      <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-600 transition-colors">Create Content</span>
                        <ArrowRight size={16} className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Strategic Foundation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-200">
              <div className="space-y-6">
                <h2 className="text-2xl font-black flex items-center gap-3 text-slate-900">
                  <LinkIcon size={24} className="text-indigo-600" /> Renting vs. Owning
                </h2>
                <div className="grid grid-cols-1 gap-4">
                  <Card className="border-2 border-rose-100 shadow-sm bg-rose-50/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-black text-rose-900">Rented Land (Social Media)</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm font-medium text-rose-800 space-y-2">
                      <ul className="list-disc pl-4 space-y-1">
                        <li>Don't control distribution or algorithm shifts</li>
                        <li>Can lose reach overnight</li>
                      </ul>
                    </CardContent>
                  </Card>
                  <Card className="border-2 border-emerald-100 shadow-sm bg-emerald-50/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-black text-emerald-900">Owned Land (Kit Email List)</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm font-medium text-emerald-800 space-y-2">
                      <ul className="list-disc pl-4 space-y-1">
                        <li>Own the relationship and control communication</li>
                        <li>Build long-term trust + conversion</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="space-y-6">
                <h2 className="text-2xl font-black flex items-center gap-3 text-slate-900">
                  <Target size={24} className="text-indigo-600" /> Strategic Objective
                </h2>
                <Card className="border-none shadow-lg rounded-3xl bg-indigo-900 text-white h-full">
                  <CardContent className="p-8 flex flex-col justify-center h-full space-y-6">
                    <p className="text-indigo-200 font-medium">Every piece of content should:</p>
                    <ol className="space-y-4">
                      <li className="flex items-center gap-3"><span className="w-8 h-8 rounded-full bg-indigo-800 flex items-center justify-center font-black">1</span> <strong>Capture attention</strong> (social)</li>
                      <li className="flex items-center gap-3"><span className="w-8 h-8 rounded-full bg-indigo-800 flex items-center justify-center font-black">2</span> <strong>Build trust</strong> (story, value)</li>
                      <li className="flex items-center gap-3"><span className="w-8 h-8 rounded-full bg-indigo-800 flex items-center justify-center font-black">3</span> <strong>Redirect</strong> → Kit email list</li>
                      <li className="flex items-center gap-3"><span className="w-8 h-8 rounded-full bg-indigo-800 flex items-center justify-center font-black">4</span> <strong>Nurture deeply</strong> (Kit Broadcasts)</li>
                    </ol>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="studio" className="mt-0 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Controls */}
              <div className="lg:col-span-5 space-y-6">
                <Card className="border-none shadow-lg rounded-[2.5rem] bg-white border-2 border-emerald-100/50">
                  <CardHeader className="p-6 pb-4 border-b border-slate-50 bg-emerald-50/30">
                    <CardTitle className="text-lg font-black flex items-center gap-2 text-emerald-900">
                      <Target size={20} className="text-emerald-600" /> Prompt Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">1. Content Source</label>
                      <Select value={selectedWin} onValueChange={setSelectedWin}>
                        <SelectTrigger className="h-12 rounded-xl font-bold bg-slate-50 border-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="custom" className="font-bold text-indigo-600">From Scratch / Custom Story</SelectItem>
                          <div className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">Recent Clinical Wins</div>
                          {recentWins.map(win => (
                            <SelectItem key={win.id} value={win.id}>
                              {win.clients?.name} - {win.issue?.substring(0,30)}...
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedWin === "custom" && (
                      <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Story / Experience</label>
                          <Textarea 
                            placeholder="Briefly describe what happened..."
                            value={customStory}
                            onChange={e => setCustomStory(e.target.value)}
                            className="resize-none h-20 rounded-xl"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Core Insight / Lesson</label>
                          <Input 
                            placeholder="What is the takeaway?"
                            value={customInsight}
                            onChange={e => setCustomInsight(e.target.value)}
                            className="h-10 rounded-xl"
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-3 pt-4 border-t border-slate-100">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">2. Output Format</label>
                      <Select value={outputFormat} onValueChange={setOutputFormat}>
                        <SelectTrigger className="h-12 rounded-xl font-bold bg-slate-50 border-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kit_broadcast">Single Kit Broadcast</SelectItem>
                          <SelectItem value="3_emails">3-Part Kit Sequence</SelectItem>
                          <SelectItem value="linkedin">LinkedIn Post</SelectItem>
                          <SelectItem value="instagram">Instagram Carousel Script</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">3. Call to Action</label>
                      <Select value={cta} onValueChange={setCta}>
                        <SelectTrigger className="h-12 rounded-xl font-bold bg-slate-50 border-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="book_session">Book a Session</SelectItem>
                          <SelectItem value="reply">Reply to Email</SelectItem>
                          <SelectItem value="resource">Download Resource</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Output */}
              <div className="lg:col-span-7">
                <Card className="border-none shadow-xl rounded-[2.5rem] bg-slate-900 text-white overflow-hidden h-full flex flex-col">
                  <CardHeader className="p-6 pb-4 border-b border-slate-800 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <Wand2 size={20} />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-black text-emerald-50">Generated Prompt</CardTitle>
                        <CardDescription className="text-slate-400 text-xs">Copy and paste this into Claude/ChatGPT.</CardDescription>
                      </div>
                    </div>
                    <Button 
                      onClick={handleCopy}
                      className={cn(
                        "h-10 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all",
                        copied ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "bg-white text-slate-900 hover:bg-slate-200"
                      )}
                    >
                      {copied ? <Check size={16} className="mr-2" /> : <Copy size={16} className="mr-2" />}
                      {copied ? "Copied!" : "Copy Prompt"}
                    </Button>
                  </CardHeader>
                  <CardContent className="p-6 flex-1">
                    <div className="h-full bg-slate-950 rounded-2xl border border-slate-800 p-6 overflow-y-auto font-mono text-sm text-emerald-50 leading-relaxed whitespace-pre-wrap">
                      {generatedPrompt}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default MarketingEnginePage;