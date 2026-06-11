
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
 Trophy, ArrowRight, Star, ExternalLink, MessageSquare, Code,
 EyeOff, Volume2, Heart, Quote
} from "lucide-react";
import AppLayout from "@/components/crm/AppLayout";

import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/utils/toast";
import { format } from "date-fns";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";
import PageHeader from "@/components/shared/PageHeader";

const CLAUDE_MARKETING_CHAT = "https://claude.ai/chat/e4805343-71a0-48fc-a1e0-4d2dde541a88";
const GEMINI_BUSINESS_CHAT = "https://gemini.google.com/app/5d5d4bcde141a99a";

const MarketingEnginePage = () => {
 const { isPrivate } = usePrivacyMode();
 const [activeTab, setActiveTab] = useState("guide");
 const [recentWins, setRecentWins] = useState<any[]>([]);
 const [vaultWins, setVaultWins] = useState<any[]>([]);
 const [selectedWin, setSelectedWin] = useState<string>("custom");
 const [outputFormat, setOutputFormat] = useState("kit_broadcast");
 const [cta, setCta] = useState("book_session");
 
 const [customStory, setCustomStory] = useState("");
 const [customInsight, setCustomInsight] = useState("");
 const [copied, setCopied] = useState(false);
 const [templateCopied, setTemplateCopied] = useState(false);

 useEffect(() => {
 const fetchData = async () => {
 const [appsRes, winsRes] = await Promise.all([
 supabase
 .from('appointments')
 .select('id, goal, issue, bolt_score, date, clients(name)')
 .eq('status', 'Completed')
 .not('issue', 'is', null)
 .order('date', { ascending: false })
 .limit(10),
 supabase
 .from('client_wins')
 .select('*')
 .order('created_at', { ascending: false })
 ]);
 
 if (appsRes.data) setRecentWins(appsRes.data);
 if (winsRes.data) setVaultWins(winsRes.data);
 };
 fetchData();
 }, []);

 const generatedPrompt = useMemo(() => {
 let contextText = "";

 if (selectedWin === "custom") {
 contextText = `STORY/EXPERIENCE:\n${customStory || "[Insert your story here]"}\n\nCORE INSIGHT/LESSON:\n${customInsight || "[Insert the main takeaway here]"}`;
 } else if (selectedWin.startsWith('vault-')) {
 const win = vaultWins.find(w => `vault-${w.id}` === selectedWin);
 if (win) {
 contextText = `CLIENT TESTIMONIAL:\n"${win.content}"\n- Client: ${win.client_name}\n- Context: ${win.context}\n\nTASK: Use this testimonial as social proof to explain a clinical concept.`;
 }
 } else {
 const win = recentWins.find(w => w.id === selectedWin);
 if (win) {
 contextText = `CLINICAL CASE STUDY (Anonymized):\n- Client Issue: ${win.issue}\n- Client Goal: ${win.goal}\n- Clinical Outcome: ${win.bolt_score ? `Physiological markers improved (e.g., BOLT score reached ${win.bolt_score}s). ` : ''}The nervous system shifted from a state of threat to a state of safety and integration.`;
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
 }, [selectedWin, recentWins, vaultWins, customStory, customInsight, outputFormat, cta]);

 const handleCopy = () => {
 navigator.clipboard.writeText(generatedPrompt);
 setCopied(true);
 showSuccess("Prompt copied to clipboard!");
 setTimeout(() => setCopied(false), 2000);
 };

 const handleCopyTemplate = async () => {
 try {
 const response = await fetch('/kit-template.html');
 let text = await response.text();
 text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
 navigator.clipboard.writeText(text.trim());
 setTemplateCopied(true);
 showSuccess("Clean HTML Template copied!");
 setTimeout(() => setTemplateCopied(false), 2000);
 } catch (err) {
 showError("Failed to load template file.");
 }
 };

 return (
 <AppLayout>
 <div className="space-y-8 animate-in fade-in duration-700 pb-20">
 <PageHeader 
 title="Marketing Engine"
 subtitle="Transform clinical wins and raw thoughts into distribution-ready assets for your Kit newsletter."
 icon={Mic}
 iconClassName="bg-primary"


 actions={
 <div className="flex flex-wrap gap-3 shrink-0">
 <Button asChild className="bg-card text-foreground hover:bg-muted h-12 px-6 rounded-xl font-semibold text-[10px] uppercase tracking-wider shadow-md border border-border">
 <a href={CLAUDE_MARKETING_CHAT} target="_blank" rel="noopener noreferrer">
 <MessageSquare size={18} className="mr-2 text-chart-emerald" /> Claude
 </a>
 </Button>
 <Button asChild className="bg-card text-foreground hover:bg-muted h-12 px-6 rounded-xl font-semibold text-[10px] uppercase tracking-wider shadow-md border border-border">
 <a href={GEMINI_BUSINESS_CHAT} target="_blank" rel="noopener noreferrer">
 <Sparkles size={18} className="mr-2 text-chart-primary" /> Gemini
 </a>
 </Button>
 </div>
 }
 />

 <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
 <TabsList className="grid w-full grid-cols-3 h-14 bg-muted p-1.5 rounded-xl mb-8">
 <TabsTrigger value="guide" className="flex items-center gap-2 rounded-xl h-11 font-semibold uppercase tracking-wider text-[10px]">
 <BookOpen size={14} /> The OS Guide
 </TabsTrigger>
 <TabsTrigger value="studio" className="flex items-center gap-2 rounded-xl h-11 font-semibold uppercase tracking-wider text-[10px]">
 <Wand2 size={14} /> Prompt Studio
 </TabsTrigger>
 <TabsTrigger value="templates" className="flex items-center gap-2 rounded-xl h-11 font-semibold uppercase tracking-wider text-[10px]">
 <Code size={14} /> Template Studio
 </TabsTrigger>
 </TabsList>

  <TabsContent value="guide" className="space-y-6 mt-0">
 <Card className="border-none shadow-sm rounded-xl bg-muted border-2 border-border overflow-hidden">
 <CardHeader className="p-8 pb-4">
 <CardTitle className="text-2xl font-semibold flex items-center gap-3 text-foreground">
 <Mic size={28} className="text-chart-emerald" /> The Thought Catcher
 </CardTitle>
 <CardDescription className="text-chart-emerald font-medium text-lg">
 Capture raw insights or voice-to-text ideas for future content.
 </CardDescription>
 </CardHeader>
 <CardContent className="p-8 pt-0 space-y-6">
 <Textarea 
 placeholder="Paste a raw voice memo transcript or type a quick clinical insight here..."
 className="min-h-[150px] bg-card border-border focus:ring-primary rounded-xl p-8 text-xl font-medium leading-relaxed shadow-inner"
 value={customStory}
 onChange={(e) => setCustomStory(e.target.value)}
 />
 <div className="flex justify-end">
 <Button onClick={() => setActiveTab('studio')} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 px-8 font-semibold text-xs uppercase tracking-wider shadow-sm">
 Process with AI <ArrowRight size={18} className="ml-2" />
 </Button>
 </div>
 </CardContent>
 </Card>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
 <div className="space-y-6">
 <div className="flex items-center justify-between px-2">
 <h2 className="text-2xl font-semibold flex items-center gap-3 text-foreground">
 <Trophy size={24} className="text-muted-foreground" /> The Wins Vault
 </h2>
 <Badge variant="outline" className="font-medium border-border text-muted-foreground">
 {recentWins.length} Case Stories
 </Badge>
 </div>
 
 <div className="grid grid-cols-1 gap-4">
 {recentWins.map(win => (
 <Card key={win.id} className="border-none shadow-md rounded-xl bg-card hover:shadow-sm transition-all group cursor-pointer" onClick={() => { setSelectedWin(win.id); setActiveTab('studio'); }}>
 <CardContent className="p-6 space-y-4">
 <div className="flex items-start justify-between">
 <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-muted0 group-hover:text-muted-foreground transition-all">
 <Star size={20} className="fill-current" />
 </div>
 <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">{format(new Date(win.date), "MMM d")}</span>
 </div>
 <div>
 <p className={cn("text-[10px] font-semibold text-chart-primary uppercase tracking-wider mb-1", isPrivate && "blur-sm")}>{win.clients?.name}</p>
 <h3 className="font-semibold text-lg text-foreground line-clamp-2 leading-tight">{win.issue}</h3>
 </div>
 </CardContent>
 </Card>
 ))}
 </div>
 </div>

 <div className="space-y-6">
 <div className="flex items-center justify-between px-2">
 <h2 className="text-2xl font-semibold flex items-center gap-3 text-chart-destructive">
 <Heart size={24} className="fill-current" /> Testimonials
 </h2>
 <Badge variant="outline" className="font-medium border-border text-chart-destructive">
 {vaultWins.length} Nice Words
 </Badge>
 </div>
 
 <div className="grid grid-cols-1 gap-4">
 {vaultWins.map(win => (
 <Card key={win.id} className="border-none shadow-md rounded-xl bg-card hover:shadow-sm transition-all group cursor-pointer" onClick={() => { setSelectedWin(`vault-${win.id}`); setActiveTab('studio'); }}>
 <CardContent className="p-6 space-y-4">
 <div className="flex items-start justify-between">
 <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-chart-destructive group-hover:bg-muted0 group-hover:text-muted-foreground transition-all">
 <Quote size={20} className="fill-current" />
 </div>
 <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">{format(new Date(win.created_at), "MMM d")}</span>
 </div>
 <div>
 <p className="text-[10px] font-semibold text-chart-destructive uppercase tracking-wider mb-1">{win.client_name}</p>
 <p className="text-sm font-medium text-muted-foreground italic line-clamp-3">"{win.content}"</p>
 </div>
 </CardContent>
 </Card>
 ))}
 </div>
 </div>
 </div>
 </TabsContent>

 <TabsContent value="studio" className="mt-0 space-y-6">
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
 <div className="lg:col-span-5 space-y-6">
 <Card className="border-none shadow-sm rounded-xl bg-card border-2 border-border/50">
 <CardHeader className="p-6 pb-4 border-b border-border bg-muted/30">
 <CardTitle className="text-lg font-semibold flex items-center gap-2 text-foreground">
 <Target size={20} className="text-chart-emerald" /> Prompt Configuration
 </CardTitle>
 </CardHeader>
 <CardContent className="p-6 space-y-6">
 <div className="space-y-3">
 <label className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">1. Content Source</label>
 <Select value={selectedWin} onValueChange={setSelectedWin}>
 <SelectTrigger className="h-12 rounded-xl font-medium bg-muted border-border">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="custom" className="font-medium text-chart-primary">From Scratch / Custom Story</SelectItem>
 
 <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Testimonials (Nice Words)</div>
 {vaultWins.map(win => (
 <SelectItem key={win.id} value={`vault-${win.id}`}>
 {win.client_name}: {win.content.substring(0,30)}...
 </SelectItem>
 ))}

 <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Clinical Wins (Cases)</div>
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
 <label className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">Story / Experience</label>
 <Textarea placeholder="Briefly describe what happened..." value={customStory} onChange={e => setCustomStory(e.target.value)} className="resize-none h-20 rounded-xl" />
 </div>
 <div className="space-y-2">
 <label className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">Core Insight / Lesson</label>
 <Input placeholder="What is the takeaway?" value={customInsight} onChange={e => setCustomInsight(e.target.value)} className="h-10 rounded-xl" />
 </div>
 </div>
 )}

 <div className="space-y-3 pt-4 border-t border-border">
 <label className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">2. Output Format</label>
 <Select value={outputFormat} onValueChange={setOutputFormat}>
 <SelectTrigger className="h-12 rounded-xl font-medium bg-muted border-border">
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
 <label className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">3. Call to Action</label>
 <Select value={cta} onValueChange={setCta}>
 <SelectTrigger className="h-12 rounded-xl font-medium bg-muted border-border">
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

 <div className="lg:col-span-7">
 <Card className="border-none shadow-sm rounded-xl bg-card text-card-foreground border border-border overflow-hidden h-full flex flex-col">
 <CardHeader className="p-6 pb-4 border-b border-border flex flex-row items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-muted0/20 text-chart-emerald flex items-center justify-center">
 <Wand2 size={20} />
 </div>
 <div>
 <CardTitle className="text-lg font-semibold text-foreground">Generated Prompt</CardTitle>
 <CardDescription className="text-muted-foreground/60 text-xs">Copy and paste this into Claude/ChatGPT.</CardDescription>
 </div>
 </div>
 <Button onClick={handleCopy} className={cn("h-10 px-4 rounded-xl font-medium text-[10px] uppercase tracking-wider transition-all", copied ? "bg-chart-emerald/10 text-chart-emerald" : "bg-muted text-muted-foreground")}>
 {copied ? <Check size={16} className="mr-2" /> : <Copy size={16} className="mr-2" />} {copied ? "Copied!" : "Copy Prompt"}
 </Button>
 </CardHeader>
 <CardContent className="p-6 flex-1">
 <div className="h-full bg-card border border-border rounded-xl border border-border p-6 overflow-y-auto font-mono text-sm text-foreground leading-relaxed whitespace-pre-wrap">
 {generatedPrompt}
 </div>
 </CardContent>
 </Card>
 </div>
 </div>
 </TabsContent>

 <TabsContent value="templates" className="mt-0">
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
 <Card className="border-none shadow-sm rounded-xl bg-card overflow-hidden">
 <CardHeader className="p-8 bg-muted border-b border-border">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
 <Code size={24} />
 </div>
 <div>
 <CardTitle className="text-xl font-semibold">Kit HTML Template</CardTitle>
 <CardDescription className="font-medium">The "Antigravity Clinical Standard" layout.</CardDescription>
 </div>
 </div>
 <Button onClick={handleCopyTemplate} className={cn("h-10 px-6 rounded-xl font-medium text-[10px] uppercase tracking-wider transition-all", templateCopied ? "bg-chart-emerald/10 text-chart-emerald" : "bg-primary text-primary-foreground")}>
 {templateCopied ? <Check size={16} className="mr-2" /> : <Copy size={16} className="mr-2" />} Copy HTML
 </Button>
 </div>
 </CardHeader>
 <CardContent className="p-8 space-y-6">
 <div className="p-4 bg-muted rounded-xl border border-border">
 <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">How to use:</h4>
 <ol className="text-xs text-muted-foreground space-y-2 list-decimal pl-4 font-medium">
 <li>Copy the HTML code using the button above.</li>
 <li>In Kit, go to <strong>Send {" > "} Email Templates</strong>.</li>
 <li>Click <strong>+ New Email Template</strong> and select <strong>HTML</strong>.</li>
 <li>Paste the code and save it as "Antigravity Standard".</li>
 </ol>
 </div>
 </CardContent>
 </Card>
 </div>
 </TabsContent>
 </Tabs>
 </div>
 </AppLayout>
 );
};

export default MarketingEnginePage;