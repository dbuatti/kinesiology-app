
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sun, MessageSquare, Zap, Fingerprint, Target, ShieldAlert, Layers, ArrowRight, Clock, Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import IdentitySmartTool from "../IdentitySmartTool";
import Scratchpad from "../Scratchpad";

interface GrowthDashboardProps {
  morningProgress: number;
  lastJournalDate: string | null;
}

const GrowthDashboard = ({ morningProgress, lastJournalDate }: GrowthDashboardProps) => {
  const missions = [
    { label: "Morning Program", status: morningProgress === 100 ? 'done' : 'pending', icon: Sun, path: "/morning-program" },
    { label: "Journal Entry", status: 'pending', icon: MessageSquare, path: "/practice/journal" },
    { label: "Identity Work", status: 'pending', icon: Fingerprint, path: "/identity-map" },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <Card className="border-none shadow-2xl shadow-indigo-500/10 rounded-[2.5rem] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl overflow-hidden">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-2 text-center md:text-left">
              <Badge className="bg-emerald-600 text-white border-none font-black text-[9px] uppercase tracking-[0.3em] px-3 py-1">
                Daily Mission
              </Badge>
              <h2 className="text-3xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">
                Your focus for <span className="text-emerald-600">today</span>.
              </h2>
              <p className="text-sm text-slate-500 font-medium">Complete these tasks to maintain clinical excellence.</p>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              {missions.map((m, i) => (
                <Link 
                  key={i} 
                  to={m.path}
                  className={cn(
                    "flex items-center gap-3 px-5 py-3 rounded-2xl border-2 transition-all duration-500 hover:scale-105 active:scale-95",
                    m.status === 'done'
                      ? "bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400 shadow-sm"
                      : "bg-slate-50 border-slate-100 text-slate-400 dark:bg-slate-800/50 dark:border-slate-800 hover:border-emerald-200 hover:bg-amber-50/30"
                  )}
                >
                  <m.icon size={18} className={cn(m.status === 'done' ? "text-emerald-500" : "text-slate-300")} />
                  <span className="text-xs font-black uppercase tracking-widest">{m.label}</span>
                  {m.status === 'done' && <Check size={14} className="ml-1 text-emerald-500" />}
                </Link>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-8">
          <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-[2rem] bg-white dark:bg-slate-900 overflow-hidden">
            <CardContent className="p-8">
              <div className="max-w-2xl space-y-4">
                <Badge className="bg-indigo-50 text-indigo-600 border-none font-bold text-[9px] uppercase tracking-widest px-3 py-1">
                  Daily Ritual
                </Badge>
                <h2 className="text-3xl font-serif font-bold text-slate-900 dark:text-white">
                  Establish Your State.
                </h2>
                <p className="text-base text-slate-500 font-medium leading-relaxed">
                  Complete your morning program to ensure you are grounded, coherent, and ready for clinical work.
                </p>
                <div className="flex items-center gap-6 pt-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between text-[9px] font-bold uppercase text-slate-400">
                      <span>Progress</span>
                      <span className="text-indigo-600">{morningProgress}%</span>
                    </div>
                    <Progress value={morningProgress} className="h-1 bg-slate-100 dark:bg-slate-800 [&>div]:bg-indigo-600" />
                  </div>
                  <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white h-11 px-6 rounded-xl font-bold text-xs uppercase tracking-widest">
                    <Link to="/morning-program">Open Program</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <IdentitySmartTool />
          <Scratchpad />
        </div>

        <div className="lg:col-span-4 space-y-8">
          <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-[2rem] bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="p-6 pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                <MessageSquare size={20} className="text-indigo-600" /> Practitioner Journal
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                Capture your clinical doubts, breakthroughs, and reflections.
              </p>
              {lastJournalDate && (
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800 flex items-center gap-3">
                  <Clock size={14} className="text-indigo-600" />
                  <p className="text-[10px] font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-widest">Last entry: {formatDistanceToNow(new Date(lastJournalDate))} ago</p>
                </div>
              )}
              <Button asChild className="w-full bg-slate-900 text-white h-10 rounded-xl font-bold text-[10px] uppercase tracking-widest">
                <Link to="/practice/journal">Open Journal</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-[2rem] bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="p-6 pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                <Layers size={20} className="text-indigo-600" /> Identity Map
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              <div className="grid grid-cols-1 gap-1">
                {[
                  { label: "Identity Shifting", path: "/identity-shifting", icon: Fingerprint },
                  { label: "Identity Alignment", path: "/identity-alignment", icon: Target },
                  { label: "Limiting Beliefs", path: "/limiting-beliefs", icon: ShieldAlert }
                ].map(tool => (
                  <Link key={tool.path} to={tool.path} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all group">
                    <div className="flex items-center gap-3">
                      <tool.icon size={14} className="text-slate-400 group-hover:text-indigo-600" />
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{tool.label}</span>
                    </div>
                    <ArrowRight size={12} className="text-slate-300 group-hover:text-indigo-600" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GrowthDashboard;