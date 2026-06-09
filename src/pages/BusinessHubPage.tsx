
import React from "react";
import {
  Mic,
  MessageSquare,
  Sparkles,
  Volume2,
  ArrowRight,
  ExternalLink,
  Briefcase,
  TrendingUp,
  Target,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Music,
  Users,
  Globe,
  Rocket,
  Heart,
  Brain,
  FileText
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/crm/AppLayout";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import PageHeader from "@/components/shared/PageHeader";

const MARKETING_TOOLS = [
  {
    id: "marketing-engine",
    label: "Marketing Engine",
    desc: "AI-powered content distribution workflow. Transform clinical wins into newsletter assets.",
    icon: Mic,
    path: "/business/marketing-engine",
    color: "text-chart-emerald",
    bgColor: "bg-chart-emerald/10",
    category: "Internal Tool"
  },
  {
    id: "kit",
    label: "Kit (ConvertKit)",
    desc: "Your owned audience platform. Manage broadcasts, sequences, and subscriber growth.",
    icon: Globe,
    path: "https://app.kit.com/",
    color: "text-chart-primary",
    bgColor: "bg-chart-primary/10",
    category: "Distribution",
    isExternal: true
  }
];

const FINANCIAL_TOOLS = [
  {
    id: "client-audit",
    label: "Client Payment & Audit",
    desc: "Review client rates, track appointment recency, identify follow-up needs, and perform financial audits with AI-driven pricing suggestions.",
    icon: FileText,
    path: "/business/client-audit",
    color: "text-chart-primary",
    bgColor: "bg-chart-primary/10",
    category: "Financials"
  }
];

const AI_PARTNERS = [
  {
    id: "claude",
    label: "Claude Assistant",
    desc: "Primary partner for business strategy, copywriting, and clinical analysis.",
    icon: MessageSquare,
    path: "https://claude.ai/chat/e4805343-71a0-48fc-a1e0-4d2dde541a88",
    color: "text-chart-primary",
    bgColor: "bg-chart-primary/10",
    category: "AI Partner",
    isExternal: true
  },
  {
    id: "gemini",
    label: "Gemini Assistant",
    desc: "Google's AI for research, business planning, and data organization.",
    icon: Sparkles,
    path: "https://gemini.google.com/app/5d5d4bcde141a99a",
    color: "text-chart-primary",
    bgColor: "bg-chart-primary/10",
    category: "AI Partner",
    isExternal: true
  }
];

const LEADERSHIP_TOOLS = [
  {
    id: "insight-timer",
    label: "Insight Timer Portal",
    desc: "Connect with the world through guided meditations and teacher insights.",
    icon: Volume2,
    path: "https://teacher.insighttimer.com/login?next=%2Faudio%3Flibraryitem%3DNhUOPacb0145IEvUBJCf%26sortBy%3Dnewest%26sort_direction%3Ddesc",
    color: "text-chart-primary",
    bgColor: "bg-chart-primary/10",
    category: "Teacher",
    isExternal: true
  },
  {
    id: "choir",
    label: "Resonance Choir",
    desc: "Community connection through song. Your platform for collective resonance.",
    icon: Music,
    path: "https://resonance-with-daniele.vercel.app/",
    color: "text-chart-destructive",
    bgColor: "bg-chart-destructive/10",
    category: "Leader",
    isExternal: true
  }
];

const BusinessHubPage = () => {
  const ToolCard = ({ tool }: { tool: any }) => {
    const content = (
      <Card className="border-none shadow-sm rounded-xl bg-card hover:shadow-sm hover:-translate-y-1 transition-all duration-300 group cursor-pointer overflow-hidden h-full">
        <CardContent className="p-8 space-y-6">
          <div className="flex items-start justify-between">
            <div className={cn(
              "w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-sm",
              tool.bgColor, tool.color
            )}>
              <tool.icon size={28} />
            </div>
            <Badge variant="secondary" className="bg-muted text-muted-foreground border-none font-semibold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full">
              {tool.category}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-foreground group-hover:text-chart-primary transition-colors">
              {tool.label}
            </h3>
            <p className="text-sm text-muted-foreground font-medium leading-relaxed">
              {tool.desc}
            </p>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-border">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-chart-primary transition-colors">
              {tool.isExternal ? 'Open External' : 'Launch Tool'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-chart-primary group-hover:text-white transition-all">
              {tool.isExternal ? <ExternalLink size={16} /> : <ArrowRight size={18} />}
            </div>
          </div>
        </CardContent>
      </Card>
    );

    return tool.isExternal ? (
      <a key={tool.id} href={tool.path} target="_blank" rel="noopener noreferrer" className="block h-full">
        {content}
      </a>
    ) : (
      <Link key={tool.id} to={tool.path} className="block h-full">
        {content}
      </Link>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-12 animate-in fade-in duration-700 pb-20">
        <PageHeader 
          title="Business Hub"
          subtitle="Strategic tools for practice growth, audience ownership, and global connection."
          icon={Briefcase}
          iconClassName="bg-chart-emerald"
          breadcrumbs={[{ label: "Business" }, { label: "Hub" }]}
        />

        {/* Strategy Card */}
        <Card className="border-none shadow-sm rounded-xl bg-foreground text-card overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-chart-emerald/40 via-foreground to-chart-primary/40" />
          <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <TrendingUp size={200} />
          </div>
          <CardContent className="p-10 md:p-14 relative z-10">
            <div className="max-w-2xl space-y-6">
              <Badge className="bg-chart-emerald/10 text-chart-emerald border-chart-emerald/30 font-semibold text-[10px] uppercase tracking-wider px-4 py-1">
                Practice Growth Strategy
              </Badge>
              <h2 className="text-4xl md:text-5xl font-serif font-medium tracking-tighter leading-tight">
                Own Your Audience. <br/>Connect with the World.
              </h2>
              <p className="text-lg text-card/70 font-medium leading-relaxed">
                Move people from "Rented Land" (Social Media) to "Owned Land" (Your Kit Email List) through high-value clinical insights and collective resonance.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-chart-emerald" />
                  <span className="text-sm font-medium text-card/80">Kit Integration Active</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-chart-emerald" />
                  <span className="text-sm font-medium text-card/80">AI Marketing Engine Ready</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section: Marketing & Distribution (Primary Priority) */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-xl bg-chart-emerald/10 text-chart-emerald flex items-center justify-center shadow-sm">
              <Rocket size={20} />
            </div>
            <h2 className="text-2xl font-semibold text-foreground tracking-tight">Marketing & Distribution</h2>
            <div className="flex-1 h-[2px] bg-border rounded-full ml-4" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {MARKETING_TOOLS.map(tool => <ToolCard key={tool.id} tool={tool} />)}
          </div>
        </div>

        {/* Section: Practice Financials & Audit */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-xl bg-chart-primary/10 text-chart-primary flex items-center justify-center shadow-sm">
              <FileText size={20} />
            </div>
            <h2 className="text-2xl font-semibold text-foreground tracking-tight">Practice Financials & Audit</h2>
            <div className="flex-1 h-[2px] bg-border rounded-full ml-4" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FINANCIAL_TOOLS.map(tool => <ToolCard key={tool.id} tool={tool} />)}
          </div>
        </div>

        {/* Section: AI Strategy Partners (Secondary Priority) */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-xl bg-chart-primary/10 text-chart-primary flex items-center justify-center shadow-sm">
              <Brain size={20} />
            </div>
            <h2 className="text-2xl font-semibold text-foreground tracking-tight">AI Strategy Partners</h2>
            <div className="flex-1 h-[2px] bg-border rounded-full ml-4" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {AI_PARTNERS.map(tool => <ToolCard key={tool.id} tool={tool} />)}
          </div>
        </div>

        {/* Section: Teacher & Leader Development (Lower Priority) */}
        <div className="space-y-6 pt-8 border-t border-border">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-xl bg-chart-primary/10 text-chart-primary flex items-center justify-center shadow-sm">
              <Users size={20} />
            </div>
            <h2 className="text-2xl font-semibold text-foreground tracking-tight opacity-60">Teacher & Leader Development</h2>
            <div className="flex-1 h-[2px] bg-border rounded-full ml-4 opacity-30" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 opacity-80 hover:opacity-100 transition-opacity">
            {LEADERSHIP_TOOLS.map(tool => <ToolCard key={tool.id} tool={tool} />)}
          </div>
        </div>

        {/* Quick Tips */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-border">
          <Card className="border-none shadow-sm rounded-xl bg-card p-6 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-chart-primary/10 text-chart-primary flex items-center justify-center">
              <Target size={20} />
            </div>
            <h4 className="font-semibold text-foreground">Capture Wins</h4>
            <p className="text-xs text-muted-foreground leading-relaxed font-medium">
              Every time a client has a breakthrough, log it in the "Wins Vault" within the Marketing Engine. These are your best content hooks.
            </p>
          </Card>
          <Card className="border-none shadow-sm rounded-xl bg-chart-emerald/10 flex items-center justify-center p-6 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-card text-chart-emerald flex items-center justify-center shadow-sm">
              <Zap size={20} />
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-foreground">Batch Content</h4>
              <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                Use the AI Studio to turn one clinical insight into a Kit Broadcast, a LinkedIn post, and an Instagram carousel in seconds.
              </p>
            </div>
          </Card>
          <Card className="border-none shadow-sm rounded-xl bg-chart-destructive/10 flex items-center justify-center p-6 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-card text-chart-destructive flex items-center justify-center shadow-sm">
              <Heart size={20} />
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-foreground">Collective Resonance</h4>
              <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                Your choir and teacher profiles are not separate from your practice—they are the top of your funnel for global connection.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default BusinessHubPage;
