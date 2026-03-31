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
  BookOpen, Wand2, Copy, Check, User, Activity, History
} from "lucide-react";
import AppLayout from "@/components/crm/AppLayout";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { cn } from "@/lib/utils";
import { showSuccess } from "@/utils/toast";

const MarketingEnginePage = () => {
  const [activeTab, setActiveTab] = useState("guide");
  const [recentWins, setRecentWins] = useState<any[]>([]);
  const [selectedWin, setSelectedWin] = useState<string>("custom");
  const [outputFormat, setOutputFormat] = useState("3_emails");
  const [cta, setCta] = useState("book_session");
  
  const [customStory, setCustomStory] = useState("");
  const [customInsight, setCustomInsight] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchWins = async () => {
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
      outputFormat === "3_emails" ? "Create a 3-part email sequence (Monday: Story/Hook, Wednesday: Value/Education, Friday: Offer/Call to Action). Include engaging subject lines and preview text for each." :
      outputFormat === "linkedin" ? "Create an engaging LinkedIn post formatted with short, punchy paragraphs. Start with a strong hook, deliver the value, and end with the call to action." :
      "Create a 5-slide Instagram carousel script. Slide 1: Hook, Slides 2-4: Value/Education, Slide 5: Call to Action.";

    const ctaInstruction = 
      cta === "book_session" ? "Encourage the reader to book an initial kinesiology assessment to identify their own nervous system blocks." :
      cta === "reply" ? "Ask the reader to reply to the email/post with their biggest current struggle related to this topic." :
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
              Transform clinical wins and raw thoughts into distribution-ready assets.
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
            {/* Strategic Foundation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                      <CardTitle className="text-lg font-black text-emerald-900">Owned Land (Email List)</CardTitle>
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
                      <li className="flex items-center gap-3"><span className="w-8 h-8 rounded-full bg-indigo-800 flex items-center justify-center font-black">3</span> <strong>Redirect</strong> → email list</li>
                      <li className="flex items-center gap-3"><span className="w-8 h-8 rounded-full bg-indigo-800 flex items-center justify-center font-black">4</span> <strong>Nurture deeply</strong> (email)</li>
                    </ol>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* The 4-Phase Workflow */}
            <div className="space-y-8 pt-8 border-t border-slate-200">
              <div className="text-center space-y-4 max-w-2xl mx-auto">
                <h2 className="text-4xl font-black text-slate-900">The 4-Phase Workflow</h2>
                <p className="text-slate-500 font-medium text-lg">Transform a 20-minute walk into a week's worth of content.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { step: 1, time: "15 mins", title: "Voice Capture", icon: Mic, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", desc: "Speak a story/insight to Claude on a walk." },
                  { step: 2, time: "Instant", title: "AI Generation", icon: Workflow, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200", desc: "Use the Prompt Studio to format the output." },
                  { step: 3, time: "15 mins", title: "Refinement", icon: Laptop, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", desc: "Restore human precision and voice alignment." },
                  { step: 4, time: "10 mins", title: "Distribution", icon: Send, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200", desc: "Schedule in Mailchimp or LinkedIn." }
                ].map((phase) => (
                  <Card key={phase.step} className={cn("border-2 shadow-lg rounded-3xl relative overflow-hidden", phase.border)}>
                    <div className="absolute top-0 right-0 p-4 opacity-5"><phase.icon size={80} /></div>
                    <CardHeader className={cn("pb-4", phase.bg)}>
                      <div className="flex justify-between items-start mb-2">
                        <span className={cn("w-8 h-8 rounded-full flex items-center justify-center font-black text-white", phase.color.replace('text', 'bg'))}>{phase.step}</span>
                        <Badge variant="outline" className={cn("bg-white font-black text-[10px] uppercase tracking-widest", phase.color)}><Clock size={12} className="mr-1" /> {phase.time}</Badge>
                      </div>
                      <CardTitle className={cn("text-xl font-black", phase.color)}>{phase.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4"><p className="font-medium text-slate-600 text-sm">{phase.desc}</p></CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
              <Card className="border-none shadow-xl rounded-[3rem] bg-amber-50 border-2 border-amber-100">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-xl font-black flex items-center gap-3 text-amber-900">
                    <AlertTriangle size={24} className="text-amber-600" /> Common Pitfalls
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-4">
                  {[
                    { title: "Over-editing", desc: "Kills momentum. Don't rewrite everything." },
                    { title: "Skipping walks", desc: "Removes your best creative source." },
                    { title: "No Call-To-Action", desc: "Emails that lead nowhere don't convert." }
                  ].map((p, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                      <div>
                        <p className="font-bold text-amber-900 text-sm">{p.title}</p>
                        <p className="text-xs text-amber-700 font-medium">{p.desc}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="p-8 bg-indigo-50 rounded-[3rem] border-2 border-indigo-100 flex items-start gap-6">
                <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xl">
                  <Brain size={32} />
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-black text-indigo-900">Training Your AI</h3>
                  <p className="text-sm text-indigo-800 font-medium leading-relaxed">
                    The quality of your AI equals the quality of your feedback loop. Reduce editing time over weeks by explicitly feeding it your history (past emails, posts, notes) and defining your style. Each time you edit, you are training it.
                  </p>
                </div>
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

                    {selectedWin !== "custom" && (
                      <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 animate-in slide-in-from-top-2 duration-300 space-y-2">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                          <History size={12} /> Extracted Context
                        </p>
                        <p className="text-sm font-bold text-indigo-900 line-clamp-2">
                          "{recentWins.find(w => w.id === selectedWin)?.issue}"
                        </p>
                        <Badge className="bg-indigo-200 text-indigo-800 border-none text-[8px] font-black uppercase">Identity Hidden</Badge>
                      </div>
                    )}

                    <div className="space-y-3 pt-4 border-t border-slate-100">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">2. Output Format</label>
                      <Select value={outputFormat} onValueChange={setOutputFormat}>
                        <SelectTrigger className="h-12 rounded-xl font-bold bg-slate-50 border-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3_emails">3-Part Email Sequence</SelectItem>
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
                          <SelectItem value="reply">Reply with Struggle</SelectItem>
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