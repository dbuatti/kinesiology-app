
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  GitBranch, Sparkles, Brain, Activity, CheckCircle2, 
  Zap, Info, List, RefreshCw, Eye, Dumbbell, Link as LinkIcon,
  Workflow, Lightbulb, ShieldAlert, Baby, ShieldCheck, ArrowRight
} from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import MotorControlHierarchy from './MotorControlHierarchy';

const SectionHeader = ({ icon: Icon, title, color }: { icon: React.ElementType, title: string, color: string }) => (
  <h3 className={`text-2xl font-black flex items-center gap-3 ${color}`}>
    <Icon size={28} /> {title}
  </h3>
);

const FnTheory = () => {
  return (
    <div className="space-y-12">
      <Card className="border-none shadow-2xl rounded-[3.5rem] bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 p-12 opacity-5"><Workflow size={200} /></div>
        <CardHeader className="p-12 relative z-10">
          <div className="flex items-center gap-5 mb-4">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20"><GitBranch size={32} className="text-indigo-400" /></div>
            <div>
              <CardTitle className="text-4xl font-black tracking-tight">Functional Neuro Approach</CardTitle>
              <CardDescription className="text-slate-400 text-xl font-medium mt-2">
                The Hierarchy of Clinical Integration
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Primitive Reflex Hierarchy Section */}
      <div className="space-y-8">
        <div className="px-2">
          <SectionHeader icon={Baby} title="Primitive Reflex Hierarchy" color="text-indigo-600" />
          <p className="text-slate-500 font-medium mt-2 text-lg">The "Safe Mode" of the nervous system. These foundational patterns must be integrated for higher-level work to stick.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="border-none shadow-lg rounded-[2.5rem] bg-indigo-900 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-6 opacity-10"><ShieldCheck size={100} /></div>
            <CardHeader>
              <CardTitle className="text-xl font-black flex items-center gap-2">
                <Zap size={20} className="text-amber-400" /> The Fractal Logic
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              <p className="text-sm text-indigo-100 leading-relaxed">
                "The nervous system works in fractal patterns. If you correct the highest level reflex, you can knock out 3-4 others in one go."
              </p>
              <div className="p-4 bg-white/10 rounded-2xl border border-white/10">
                <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2">Master Chain</p>
                <div className="flex items-center gap-2 text-sm font-bold">
                  <span>Fear Paralysis</span>
                  <ArrowRight size={14} />
                  <span>Moro</span>
                  <ArrowRight size={14} />
                  <span>Startle</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 border-none shadow-lg rounded-[2.5rem] bg-white overflow-hidden">
            <CardHeader className="bg-slate-50 p-8">
              <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs">Clinical Significance</h4>
            </CardHeader>
            <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h5 className="font-bold text-indigo-600 flex items-center gap-2">
                  <Brain size={16} /> Cognitive & Emotional
                </h5>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Movement development equals cognitive development. Retained reflexes disorganize the ANS into permanent fight-flight or freeze states.
                </p>
              </div>
              <div className="space-y-2">
                <h5 className="font-bold text-rose-600 flex items-center gap-2">
                  <Activity size={16} /> Postural Load
                </h5>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Posture equals brain function. Retained reflexes create a massive "neural load," forcing the system to compensate constantly.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <MotorControlHierarchy />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-lg rounded-[2.5rem] bg-white overflow-hidden">
          <CardHeader className="bg-blue-50 p-8">
            <SectionHeader icon={Brain} title="Mechanoreceptive Conscious" color="text-blue-600" />
            <p className="text-blue-800 font-medium">Targets the DCML pathway (15% of afferent input) to the contralateral sensory cortex (S1).</p>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
             <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-xs font-bold text-slate-700">Protocol: Isometric contraction (30-40% effort) for 30-90 seconds with nasal breathing.</p>
             </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-lg rounded-[2.5rem] bg-white overflow-hidden">
          <CardHeader className="bg-emerald-50 p-8">
            <SectionHeader icon={Activity} title="Mechanoreceptive Unconscious" color="text-emerald-600" />
            <p className="text-emerald-800 font-medium">Targets spinocerebellar tracts (85% of afferent input) to the cerebellum.</p>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
             <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-xs font-bold text-slate-700">Protocol: Stretch priority ligament/tendon while holding GV16. Apply tuning fork or tap for 3-5s.</p>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FnTheory;