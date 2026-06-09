
import React from "react";
import { Link } from "react-router-dom";
import { 
 Compass, 
 ShieldCheck, 
 Palette, 
 RefreshCw, 
 FileText, 
 ChevronRight,
 Sparkles,
 Heart,
 Brain,
 Zap,
 CheckCircle2,
 PlayCircle,
 Briefcase
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/components/crm/AppLayout";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/shared/PageHeader";

const WORKSHEETS = [
 {
 id: "business-model",
 label: "FNH Business Model",
 desc: "Transition from hourly to program-based practice. Calculate LCV and forecast growth.",
 icon: Briefcase,
 path: "/resources/worksheets/business-model",
 color: "text-chart-emerald",
 bgColor: "bg-chart-emerald/10 ",
 category: "Business Strategy"
 },
 {
 id: "north-star",
 label: "Setting Your North Star",
 desc: "Define your core intention, commitment, and the version of yourself you are becoming.",
 icon: Compass,
 path: "/resources/worksheets/north-star",
 color: "text-chart-primary",
 bgColor: "bg-chart-primary/10 ",
 category: "Foundational"
 },
 {
 id: "inner-awareness",
 label: "Inner Awareness & Sovereignty",
 desc: "Daily practice for tracking triggers, projections, and reclaiming your personal state.",
 icon: ShieldCheck,
 path: "/resources/worksheets/inner-awareness",
 color: "text-chart-primary",
 bgColor: "bg-chart-primary/10 ",
 category: "Daily Practice"
 },
 {
 id: "week-3",
 label: "Week 3: Releasing Curses",
 desc: "A deep dive into releasing generational trauma, inherited shame, and secret society agreements.",
 icon: Zap,
 path: "/resources/worksheets/week-3",
 color: "text-chart-primary",
 bgColor: "bg-chart-primary/10 ",
 category: "Program Content"
 },
 {
 id: "fear-creativity",
 label: "Fear & Creativity",
 desc: "Identify how fear manifests in the body and mind to unblock your creative expression.",
 icon: Palette,
 path: "/resources/worksheets/fear-creativity",
 color: "text-chart-destructive",
 bgColor: "bg-chart-destructive/10 ",
 category: "Integration"
 },
 {
 id: "anger-flow",
 label: "Week 8: Anger & Flow",
 desc: "Reclaiming expression and self-acceptance by clearing toxic anger from the Wood element.",
 icon: RefreshCw,
 path: "/resources/worksheets/anger-flow",
 color: "text-chart-emerald",
 bgColor: "bg-chart-emerald/10 ",
 category: "Program Content",
 videoUrl: "https://share.descript.com/view/gDxcvRrEKGw?t=448.630353&autoplay=1"
 }
];

interface WorksheetsHubPageProps {
 isNested?: boolean;
}

const WorksheetsHubPage = ({ isNested = false }: WorksheetsHubPageProps) => {
 const content = (
 <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
 {!isNested && (
 <>
 <Breadcrumbs 
 items={[
 { label: "Resources", path: "/resources" },
 { label: "Worksheets" }
 ]} 
 />

 <PageHeader 
 title="Worksheets & Reflections"
 subtitle="Tools for personal integration and practitioner development."
 icon={FileText}
 />
 </>
 )}

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {WORKSHEETS.map((ws) => (
 <div key={ws.id} className="flex flex-col h-full">
 <Link to={ws.path} className="block group flex-1">
 <Card className="border-none shadow-md rounded-xl bg-card hover:shadow-sm hover:-translate-y-1 transition-all duration-300 h-full overflow-hidden">
 <CardContent className="p-8 space-y-6">
 <div className="flex items-start justify-between">
 <div className={cn(
 "w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-sm",
 ws.bgColor, ws.color
 )}>
 <ws.icon size={28} />
 </div>
 <Badge variant="secondary" className="bg-muted text-muted-foreground border-none font-semibold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full">
 {ws.category}
 </Badge>
 </div>
 
 <div className="space-y-2">
 <h3 className="text-xl font-semibold text-foreground group-hover:text-chart-primary transition-colors">{ws.label}</h3>
 <p className="text-sm text-muted-foreground font-medium leading-relaxed">
 {ws.desc}
 </p>
 </div>

 <div className="pt-4 flex items-center justify-between border-t border-border">
 <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-chart-primary transition-colors">
 Open Worksheet
 </span>
 <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/80 group-hover:text-white transition-all">
 <ChevronRight size={18} />
 </div>
 </div>
 </CardContent>
 </Card>
 </Link>
 {ws.videoUrl && (
 <div className="mt-3 px-4">
 <Button variant="ghost" size="sm" asChild className="w-full rounded-xl h-9 text-[10px] font-semibold uppercase tracking-wider text-chart-primary hover:bg-muted">
 <a href={ws.videoUrl} target="_blank" rel="noopener noreferrer">
 <PlayCircle size={14} className="mr-2" /> Watch Lesson Recording
 </a>
 </Button>
 </div>
 )}
 </div>
 ))}
 </div>

 <Card className="border-none shadow-sm rounded-xl bg-card text-white overflow-hidden relative">
 <div className="absolute top-0 right-0 p-12 opacity-10"><Sparkles size={150} /></div>
 <CardContent className="p-10 md:p-14 flex flex-col md:flex-row items-center gap-10 relative z-10">
 <div className="w-24 h-24 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-sm ">
 <Brain size={48} className="text-white" />
 </div>
 <div className="space-y-4">
 <h4 className="text-2xl font-semibold">The Power of Reflection</h4>
 <p className="text-muted-foreground/60 font-medium text-lg leading-relaxed">
 "Awareness is the first step of integration. These worksheets are designed to help you name the patterns, reduce their power, and step into your full sovereignty as a healer."
 </p>
 <div className="flex gap-4 pt-2">
 <div className="flex items-center gap-2">
 <CheckCircle2 size={16} className="text-chart-emerald/60" />
 <span className="text-xs font-medium text-muted-foreground/60">Auto-saving progress</span>
 </div>
 <div className="flex items-center gap-2">
 <CheckCircle2 size={16} className="text-chart-emerald/60" />
 <span className="text-xs font-medium text-muted-foreground/60">Print-ready layouts</span>
 </div>
 </div>
 </div>
 </CardContent>
 </Card>
 </div>
 );

 return isNested ? content : <AppLayout>{content}</AppLayout>;
};

export default WorksheetsHubPage;