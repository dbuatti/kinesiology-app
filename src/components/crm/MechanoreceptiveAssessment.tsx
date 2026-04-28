"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  Brain, 
  Zap, 
  Info, 
  Target, 
  Move, 
  RefreshCw, 
  Search,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Workflow,
  ImageIcon,
  List,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import MechanoreceptiveProcess from "./MechanoreceptiveProcess";
import JointActionTableModal from "./JointActionTableModal";
import { supabase } from "@/integrations/supabase/client";

interface MechanoreceptiveAssessmentProps {
  appointmentId: string;
  onSave: (summary: string) => void;
}

const MechanoreceptiveAssessment = ({ appointmentId, onSave }: MechanoreceptiveAssessmentProps) => {
  const [showWizard, setShowWizard] = useState(false);
  const [actionTableOpen, setActionTableOpen] = useState(false);
  const [ligamentModalOpen, setLigamentModalOpen] = useState(false);
  const [ligamentImages, setLigamentImages] = useState<Record<string, (string | null)[]>>({});

  useEffect(() => {
    const fetchLigamentImages = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('ligament_images').select('category, image_index, image_url').eq('user_id', user.id);
      if (data) {
        const imageMap: Record<string, (string | null)[]> = {};
        data.forEach(item => {
          if (!imageMap[item.category]) imageMap[item.category] = [];
          imageMap[item.category][item.image_index] = item.image_url ? `${item.image_url}?t=${Date.now()}` : null;
        });
        setLigamentImages(imageMap);
      }
    };
    fetchLigamentImages();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-slate-900">Mechanoreceptive Calibration</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Joint, Ligament, and Tendon Integration</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => setActionTableOpen(true)}
            className="rounded-xl h-10 px-4 font-bold text-xs uppercase tracking-widest border-slate-200"
          >
            <List size={16} className="mr-2" /> Action Table
          </Button>
          {!showWizard && (
            <Button 
              onClick={() => setShowWizard(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-10 px-6 font-black text-xs uppercase tracking-widest shadow-lg"
            >
              <Zap size={16} className="mr-2 fill-current" /> Start Calibration
            </Button>
          )}
        </div>
      </div>

      {showWizard ? (
        <div className="animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-6">
            <Badge className="bg-indigo-50 text-indigo-600 border-none font-black text-[10px] uppercase tracking-widest px-3 py-1">
              Interactive Wizard Active
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => setShowWizard(false)} className="text-slate-400 hover:text-rose-600 font-bold text-xs">
              Cancel Wizard
            </Button>
          </div>
          <MechanoreceptiveProcess 
            onSave={(summary) => {
              onSave(summary);
              setShowWizard(false);
            }}
            onCancel={() => setShowWizard(false)}
            ligamentImages={ligamentImages}
            onOpenActionTable={() => setActionTableOpen(true)}
            onOpenLigamentCharts={() => setLigamentModalOpen(true)}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Core Logic */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="border-none shadow-md rounded-2xl bg-white overflow-hidden">
              <CardHeader className="bg-blue-50 p-6">
                <CardTitle className="text-lg font-black flex items-center gap-2 text-blue-900">
                  <Brain size={20} className="text-blue-600" /> Conscious (DCML)
                </CardTitle>
                <CardDescription className="text-blue-700 font-medium">15% of afferent input. Contralateral logic.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-700 leading-relaxed">
                    Targets the S1 Sensory Cortex. Used for "smudged" sensory maps and chronic pain patterns.
                  </p>
                </div>
                <ul className="space-y-3">
                  {[
                    "Identify restricted joint action via Action Table",
                    "Hold contralateral M1/S1 brain zones",
                    "Perform 30-40% isometric contraction (60-90s)",
                    "Maintain nasal breathing throughout"
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm font-medium text-slate-600">
                      <CheckCircle2 size={18} className="text-blue-500 shrink-0 mt-0.5" />
                      {step}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md rounded-2xl bg-white overflow-hidden">
              <CardHeader className="bg-emerald-50 p-6">
                <CardTitle className="text-lg font-black flex items-center gap-2 text-emerald-900">
                  <Activity size={20} className="text-emerald-600" /> Unconscious (SC)
                </CardTitle>
                <CardDescription className="text-emerald-700 font-medium">85% of afferent input. Ipsilateral logic.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-700 leading-relaxed">
                    Targets the Cerebellum via Spinocerebellar tracts. Used for ligamentous threat and stability issues.
                  </p>
                </div>
                <ul className="space-y-3">
                  {[
                    "Identify priority ligament or tendon",
                    "Hold GV16 (Cerebellum) reflex point",
                    "Apply gentle stretch to the target tissue",
                    "Apply 128Hz tuning fork to cranium (5s)"
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm font-medium text-slate-600">
                      <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                      {step}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Right: Quick Reference */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="border-none shadow-xl rounded-[2.5rem] bg-slate-900 text-white overflow-hidden">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-xl font-black flex items-center gap-3">
                  <Search size={24} className="text-indigo-400" /> Localization Path
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-6">
                <div className="space-y-4">
                  {[
                    { l: "Region", v: "Upper vs. Lower" },
                    { l: "Laterality", v: "Left vs. Right" },
                    { l: "Skeleton", v: "Axial vs. Appendicular" },
                    { l: "Joint", v: "Specific Segment (e.g. L4/L5)" }
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 bg-white/5 rounded-2xl border border-white/10">
                      <span className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center font-black text-[10px]">{i + 1}</span>
                      <div>
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{step.l}</p>
                        <p className="text-xs font-bold">{step.v}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-indigo-600/20 rounded-2xl border border-indigo-500/30">
                  <p className="text-xs font-medium leading-relaxed italic text-indigo-100">
                    "The joint may not be related to the symptom site—it's where the brain needs proprioceptive input to reduce threat."
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="p-6 bg-amber-50 rounded-[2rem] border-2 border-amber-100 flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-amber-500 shrink-0">
                <Info size={24} />
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-amber-900 text-xs uppercase tracking-widest">Clinical Tip</h4>
                <p className="text-xs text-amber-800 font-medium leading-relaxed">
                  Always re-test the original stimulus after each layer. If the IM remains inhibited, there is a deeper layer of compensation.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <JointActionTableModal open={actionTableOpen} onOpenChange={setActionTableOpen} />
    </div>
  );
};

export default MechanoreceptiveAssessment;