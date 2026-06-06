
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Printer, 
  FileText, 
  Zap, 
  Brain, 
  Move, 
  Heart, 
  Baby, 
  ChevronRight,
  LayoutGrid,
  ShieldCheck,
  Activity,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/crm/AppLayout";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import PageHeader from "@/components/shared/PageHeader";
import { cn } from "@/lib/utils";

const PRINTABLES = [
  {
    category: "Clinical Reference Sheets",
    description: "High-density maps and tables for rapid clinical lookup.",
    items: [
      {
        id: "cn-ref",
        label: "Cranial Nerve Map",
        desc: "12 nerves grouped by nuclei with stim protocols.",
        icon: Zap,
        path: "/resources/cranial-nerves/print",
        color: "text-rose-600",
        bgColor: "bg-rose-50"
      },
      {
        id: "bz-ref",
        label: "Brain Zone Map",
        desc: "Cortical and subcortical hand placements.",
        icon: Brain,
        path: "/resources/brain-zones/print",
        color: "text-purple-600",
        bgColor: "bg-purple-50"
      },
      {
        id: "ja-ref",
        label: "Joint Action Table",
        desc: "Geometry of movement across all 3 planes.",
        icon: Move,
        path: "/resources/joint-actions/print",
        color: "text-indigo-600",
        bgColor: "bg-indigo-50"
      },
      {
        id: "hw-ref",
        label: "Heart Wall Table",
        desc: "Subconscious barrier emotions and muscles.",
        icon: Heart,
        path: "/resources/heart-wall/print",
        color: "text-rose-500",
        bgColor: "bg-rose-50"
      }
    ]
  },
  {
    category: "Assessment Worksheets",
    description: "Structured logs for recording findings during a session.",
    items: [
      {
        id: "cn-ws",
        label: "Cranial Nerve Log",
        desc: "Detailed check-list for all 12 nerves.",
        icon: FileText,
        path: "/resources/cranial-nerves/worksheet",
        color: "text-blue-600",
        bgColor: "bg-blue-50"
      },
      {
        id: "pr-ws",
        label: "Primitive Reflex Log",
        desc: "Foundational OS assessment and fractal logic.",
        icon: Baby,
        path: "/resources/primitive-reflexes/worksheet",
        color: "text-amber-600",
        bgColor: "bg-amber-50"
      }
    ]
  }
];

const PrintHubPage = () => {
  return (
    <AppLayout>
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
        <Breadcrumbs 
          items={[
            { label: "Library", path: "/resources" },
            { label: "Print Hub" }
          ]} 
        />

        <PageHeader 
          title="Clinical Print Hub"
          subtitle="A central repository for all landscape-optimized reference sheets and worksheets."
          icon={Printer}
          iconClassName="bg-slate-900"
        />

        <div className="space-y-16">
          {PRINTABLES.map((section) => (
            <div key={section.category} className="space-y-6">
              <div className="px-2">
                <h2 className="text-2xl font-black text-slate-900">{section.category}</h2>
                <p className="text-sm text-slate-500 font-medium mt-1">{section.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {section.items.map((item) => (
                  <Link key={item.id} to={item.path} className="block group">
                    <Card className="border-none shadow-md rounded-[2.5rem] bg-card hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full overflow-hidden">
                      <CardContent className="p-8 space-y-6">
                        <div className="flex items-start justify-between">
                          <div className={cn(
                            "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-sm",
                            item.bgColor, item.color
                          )}>
                            <item.icon size={28} />
                          </div>
                          <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                            <Printer size={16} />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <h3 className="text-xl font-black text-foreground group-hover:text-indigo-600 transition-colors">{item.label}</h3>
                          <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                            {item.desc}
                          </p>
                        </div>

                        <div className="pt-4 flex items-center justify-between border-t border-border">
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-indigo-600 transition-colors">
                            Open Printable
                          </span>
                          <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <Card className="border-none shadow-lg rounded-[3rem] bg-slate-900 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-12 opacity-10"><Sparkles size={150} /></div>
          <CardContent className="p-10 md:p-14 flex flex-col md:flex-row items-center gap-10 relative z-10">
            <div className="w-24 h-24 rounded-[2rem] bg-indigo-600 flex items-center justify-center shrink-0 shadow-2xl shadow-indigo-500/40">
              <ShieldCheck size={48} className="text-white" />
            </div>
            <div className="space-y-4">
              <h4 className="text-2xl font-black">Clinical Standard v2.4</h4>
              <p className="text-slate-400 font-medium text-lg leading-relaxed">
                "All resources in this hub are optimized for A4 landscape printing. Use these to build your physical clinical manual or to provide structured handouts for clients."
              </p>
              <div className="flex gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  <span className="text-xs font-bold text-slate-300">Landscape Optimized</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  <span className="text-xs font-bold text-slate-300">High-Density Data</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default PrintHubPage;