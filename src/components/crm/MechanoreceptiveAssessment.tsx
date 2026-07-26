
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
  CheckCircle2,
  FileText,
  Layers,
  Dumbbell,
  ArrowRight,
  ShieldAlert,
  Printer
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

  const SectionHeader = ({ title, subtitle }: { title: string, subtitle?: string }) => (
    <div className="border-b border-foreground/20 pb-1 mb-4 mt-8 first:mt-0">
      <h3 className="text-sm font-black uppercase tracking-widest text-foreground">{title}</h3>
      {subtitle && <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{subtitle}</p>}
    </div>
  );

  if (showWizard) {
    return (
      <div className="animate-in fade-in duration-500">
        <div className="flex items-center justify-between mb-6">
          <Badge className="bg-indigo-600 text-primary-foreground border-none font-black text-[10px] uppercase tracking-widest px-3 py-1">
            Interactive Calibration Active
          </Badge>
          <Button variant="ghost" size="sm" onClick={() => setShowWizard(false)} className="text-muted-foreground hover:text-rose-600 font-bold text-xs">
            Exit Wizard
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
    );
  }

  return (
    <div className="w-full bg-card text-foreground font-sans animate-in fade-in duration-700 pb-20">
      {/* Document Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-4 border-foreground/20 pb-8 mb-12">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">Mechanoreceptive Protocol</h1>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.5em]">Resonance Clinical Infrastructure • Section IV.A</p>
        </div>
        <div className="flex gap-3 print:hidden">
          <Button 
            variant="outline" 
            onClick={() => setActionTableOpen(true)}
            className="rounded-none border-foreground/20 font-black text-[10px] uppercase tracking-widest h-10 px-4 hover:bg-muted/50"
          >
            <List size={14} className="mr-2" /> Action Table
          </Button>
          <Button 
            onClick={() => setShowWizard(true)}
            className="bg-foreground text-primary-foreground hover:bg-foreground rounded-none h-10 px-6 font-black text-[10px] uppercase tracking-widest shadow-lg"
          >
            <Zap size={14} className="mr-2 fill-current" /> Start Calibration
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        {/* Main Document Body */}
        <div className="lg:col-span-8 space-y-12">
          
          {/* I. Theory */}
          <section>
            <SectionHeader title="I. Clinical Theory" subtitle="The 15/85 Afferent Split" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-6 border border-foreground/20 space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <Brain size={18} />
                  <h4 className="font-black text-[11px] uppercase tracking-widest">Conscious (DCML)</h4>
                </div>
                <p className="text-xs leading-relaxed font-medium text-foreground/80">
                  Targets the <strong>15%</strong> of afferent input processed by the contralateral Sensory Cortex (S1). Used for "smudged" sensory maps and chronic pain patterns.
                </p>
                <div className="pt-2 border-t border-border/50">
                  <p className="text-[9px] font-black uppercase text-muted-foreground mb-1">Correction</p>
                  <p className="text-[10px] font-bold">Isometric Contraction (30-40% effort) for 60-90s.</p>
                </div>
              </div>

              <div className="p-6 border border-foreground/20 space-y-4">
                <div className="flex items-center gap-2 text-emerald-600">
                  <Activity size={18} />
                  <h4 className="font-black text-[11px] uppercase tracking-widest">Unconscious (SC)</h4>
                </div>
                <p className="text-xs leading-relaxed font-medium text-foreground/80">
                  Targets the <strong>85%</strong> of afferent input processed by the Cerebellum via Spinocerebellar tracts. Used for ligamentous threat and stability issues.
                </p>
                <div className="pt-2 border-t border-border/50">
                  <p className="text-[9px] font-black uppercase text-muted-foreground mb-1">Correction</p>
                  <p className="text-[10px] font-bold">Ligament Stretch + GV16 + 128Hz Tuning Fork.</p>
                </div>
              </div>
            </div>
          </section>

          {/* II. Localization */}
          <section>
            <SectionHeader title="II. Localization Hierarchy" subtitle="Isolating the Priority Joint" />
            <div className="space-y-4">
              <div className="overflow-hidden border border-foreground/20">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/50 border-b border-foreground/20">
                      <th className="p-4 font-black text-[10px] uppercase tracking-widest border-r border-foreground/20 w-1/3">Step</th>
                      <th className="p-4 font-black text-[10px] uppercase tracking-widest">Clinical Logic</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/10">
                    {[
                      { s: "1. Region", l: "Upper vs. Lower (Divided at T12)" },
                      { s: "2. Laterality", l: "Left vs. Right vs. Midline" },
                      { s: "3. Skeleton", l: "Axial (Spine/Skull) vs. Appendicular (Limbs)" },
                      { s: "4. Specific Joint", l: "Isolate the segment (e.g. L4/L5, GH Joint)" }
                    ].map((row, i) => (
                      <tr key={i}>
                        <td className="p-4 font-bold text-xs border-r border-foreground/10 bg-muted/30">{row.s}</td>
                        <td className="p-4 text-xs font-medium text-muted-foreground">{row.l}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 bg-foreground text-primary-foreground italic text-xs leading-relaxed">
                "The joint may not be related to the symptom site—it's where the brain needs proprioceptive input to reduce threat."
              </div>
            </div>
          </section>

          {/* III. Geometry */}
          <section>
            <SectionHeader title="III. The Geometry of Movement" subtitle="Planes of Motion" />
            <div className="grid grid-cols-3 gap-4">
              {[
                { p: "Sagittal", m: "Flexion / Extension", c: "text-primary" },
                { p: "Frontal", m: "Abduction / Adduction", c: "text-emerald-600" },
                { p: "Transverse", m: "Internal / External Rot", c: "text-orange-600" }
              ].map(plane => (
                <div key={plane.p} className="p-4 border border-foreground/20 text-center space-y-1">
                  <p className={cn("font-black text-[10px] uppercase tracking-widest", plane.c)}>{plane.p}</p>
                  <p className="text-[10px] font-bold text-foreground">{plane.m}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar / Reference Column */}
        <div className="lg:col-span-4 space-y-10">
          <div className="p-8 border-2 border-foreground/20 space-y-6 bg-muted/50">
            <div className="flex items-center gap-3">
              <ShieldAlert size={20} className="text-foreground" />
              <h4 className="font-black text-xs uppercase tracking-widest">Practitioner Note</h4>
            </div>
            <p className="text-xs font-medium leading-relaxed italic text-muted-foreground">
              "Always re-test the original stimulus after each layer. If the IM remains inhibited, there is a deeper layer of compensation. Expect 5-15 layers in complex cases."
            </p>
            <div className="pt-4 border-t border-foreground/10 space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span className="text-[10px] font-black uppercase tracking-widest">Nasal Breathing Required</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span className="text-[10px] font-black uppercase tracking-widest">30-40% Effort Only</span>
              </div>
            </div>
          </div>

          <Card className="border-none shadow-sm bg-foreground text-primary-foreground rounded-none overflow-hidden">
            <CardHeader className="p-6 pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 flex items-center gap-2">
                <ImageIcon size={14} /> Visual Reference
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="aspect-square rounded-none overflow-hidden bg-card/5 border border-primary-foreground/10 flex items-center justify-center p-4">
                <img 
                  src="/images/mechanoreceptive/homunculus.png" 
                  alt="Homunculus" 
                  className="max-w-full h-auto opacity-80"
                />
              </div>
              <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-4 text-center">Cortical Homunculus (S1/M1 Map)</p>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Button 
              variant="outline" 
              className="w-full h-14 rounded-none border-foreground/20 font-black text-[10px] uppercase tracking-widest hover:bg-muted/50"
              onClick={() => setLigamentModalOpen(true)}
            >
              <Layers size={18} className="mr-2" /> Open Ligament Charts
            </Button>
            <Button 
              variant="outline" 
              className="w-full h-14 rounded-none border-foreground/20 font-black text-[10px] uppercase tracking-widest hover:bg-muted/50"
              onClick={() => window.print()}
            >
              <Printer size={18} className="mr-2" /> Print Protocol Sheet
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-20 pt-8 border-t-2 border-border/50 text-center">
        <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.5em]">Fractal Resolution OS • Confidential Practitioner Resource</p>
      </div>

      <JointActionTableModal open={actionTableOpen} onOpenChange={setActionTableOpen} />
    </div>
  );
};

export default MechanoreceptiveAssessment;