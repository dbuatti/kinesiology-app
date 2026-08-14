import { useMemo, useState } from "react";
import { Compass, Fingerprint, Target, ShieldAlert, Layers, Info } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, PlayCircle, Sparkles } from "lucide-react";
import UnifiedEditor, { type UnifiedEditorSection } from "@/components/crm/UnifiedEditor";
import SandboxPage from "./SandboxPage";
import IdentityShiftingBackground from "@/components/crm/IdentityShiftingBackground";
import IdentityShiftingTool from "@/components/crm/IdentityShiftingTool";
import IdentityAlignmentBackground from "@/components/crm/IdentityAlignmentBackground";
import IdentityAlignmentTool from "@/components/crm/IdentityAlignmentTool";
import LimitingBeliefsBackground from "@/components/crm/LimitingBeliefsBackground";
import LimitingBeliefsTool from "@/components/crm/LimitingBeliefsTool";
import LimitingBeliefsAnalysis from "@/components/crm/LimitingBeliefsAnalysis";
import FractalTool from "@/components/crm/FractalTool";

const TAB_TRIGGER_CLS =
  "rounded-md px-3 h-7 data-[state=active]:bg-card data-[state=active]:shadow-sm transition-all font-medium text-[10px] uppercase tracking-wider";
const TABS_LIST_CLS = "bg-muted p-0.5 rounded-lg h-8";

const TONE_CLASSES: Record<"primary" | "chart-primary" | "destructive", { wrap: string; badge: string; icon: string; title: string; body: string }> = {
  primary: {
    wrap: "bg-primary/5 border border-primary/10",
    badge: "bg-primary/10",
    icon: "text-primary",
    title: "text-primary",
    body: "text-primary/70",
  },
  "chart-primary": {
    wrap: "bg-chart-primary/5 border border-chart-primary/10",
    badge: "bg-chart-primary/10",
    icon: "text-chart-primary",
    title: "text-chart-primary",
    body: "text-chart-primary/70",
  },
  destructive: {
    wrap: "bg-destructive/5 border border-destructive/10",
    badge: "bg-destructive/10",
    icon: "text-destructive",
    title: "text-destructive",
    body: "text-chart-destructive/70",
  },
};

const PractitionerNote = ({ tone, title, children }: { tone: "primary" | "chart-primary" | "destructive"; title: string; children: React.ReactNode }) => {
  const c = TONE_CLASSES[tone];
  return (
    <div className={`mt-4 max-w-3xl mx-auto ${c.wrap} rounded-xl p-4 flex gap-3 items-start`}>
      <div className={`w-6 h-6 ${c.badge} rounded-lg flex items-center justify-center shrink-0`}>
        <Info size={14} className={c.icon} />
      </div>
      <div className="space-y-1">
        <h4 className={`font-semibold text-[10px] uppercase tracking-wider ${c.title}`}>{title}</h4>
        <p className={`text-xs ${c.body} leading-relaxed font-medium`}>{children}</p>
      </div>
    </div>
  );
};

const VALID_TOOLS = ["map", "shifting", "alignment", "limiting", "fractals"];

const IdentityWorkspacePage = () => {
  const [selectedId, setSelectedId] = useState<string>(() => {
    const tool = new URLSearchParams(window.location.search).get("tool");
    return tool && VALID_TOOLS.includes(tool) ? tool : "map";
  });

  const sections = useMemo<UnifiedEditorSection[]>(
    () => [
      {
        id: "map",
        label: "Identity Map",
        icon: Compass,
        render: () => (
          <div className="space-y-8 p-6 md:p-8">
            <SandboxPage isNested={true} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-8 border-t border-border">
              <div className="p-5 bg-primary/5 rounded-2xl border-2 border-primary/10 flex items-start gap-5">
                <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-xl shrink-0">
                  <Target size={32} />
                </div>
                <div className="space-y-2">
                  <h4 className="text-xl font-black text-foreground">The Goal of Identity Work</h4>
                  <p className="text-muted-foreground font-medium leading-relaxed italic">
                    "Identity Work is where you become your own No.1 client. By processing your own identities and beliefs, you clear the static in your own system, allowing you to be a more precise mirror for your clients."
                  </p>
                </div>
              </div>
              <div className="p-5 bg-chart-emerald/5 rounded-2xl border-2 border-chart-emerald/10 flex items-start gap-5">
                <div className="w-12 h-12 rounded-xl bg-chart-emerald text-primary-foreground flex items-center justify-center shadow-xl shrink-0">
                  <Layers size={32} />
                </div>
                <div className="space-y-2">
                  <h4 className="text-xl font-black text-foreground">Active Integration</h4>
                  <p className="text-muted-foreground font-medium leading-relaxed">
                    Every insight extracted from your journal moves you closer to clinical mastery.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "shifting",
        label: "Identity Shifting",
        icon: Fingerprint,
        render: () => (
          <div className="p-6 md:p-8 space-y-4">
            <Tabs defaultValue="practice" className="w-full">
              <div className="flex justify-center mb-3">
                <TabsList className={TABS_LIST_CLS}>
                  <TabsTrigger value="learn" className={TAB_TRIGGER_CLS}><BookOpen className="mr-1.5" size={11} /> Learn</TabsTrigger>
                  <TabsTrigger value="practice" className={TAB_TRIGGER_CLS}><PlayCircle className="mr-1.5" size={11} /> Practice</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="learn" className="mt-0 focus-visible:ring-0"><IdentityShiftingBackground /></TabsContent>
              <TabsContent value="practice" className="mt-0 focus-visible:ring-0"><IdentityShiftingTool singlePage /></TabsContent>
            </Tabs>
            <PractitionerNote tone="primary" title="Practitioner Note">
              Identity shifting is a powerful tool for deep transformation. It is most effective when the practitioner is in a grounded, neutral state.
            </PractitionerNote>
          </div>
        ),
      },
      {
        id: "alignment",
        label: "Identity Alignment",
        icon: Target,
        render: () => (
          <div className="p-6 md:p-8 space-y-4">
            <Tabs defaultValue="practice" className="w-full">
              <div className="flex justify-center mb-3">
                <TabsList className={TABS_LIST_CLS}>
                  <TabsTrigger value="learn" className={TAB_TRIGGER_CLS}><BookOpen className="mr-1.5" size={11} /> Learn</TabsTrigger>
                  <TabsTrigger value="practice" className={TAB_TRIGGER_CLS}><PlayCircle className="mr-1.5" size={11} /> Practice</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="learn" className="mt-0 focus-visible:ring-0"><IdentityAlignmentBackground /></TabsContent>
              <TabsContent value="practice" className="mt-0 focus-visible:ring-0"><IdentityAlignmentTool singlePage /></TabsContent>
            </Tabs>
            <PractitionerNote tone="chart-primary" title="Practitioner's Playbook">
              The Identity Alignment Protocol is most effective when the client is in a state of autonomic safety. If you detect high sympathetic arousal, pause and use a down-regulation technique.
            </PractitionerNote>
          </div>
        ),
      },
      {
        id: "limiting",
        label: "Limiting Beliefs",
        icon: ShieldAlert,
        render: () => (
          <div className="p-6 md:p-8 space-y-4">
            <Tabs defaultValue="practice" className="w-full">
              <div className="flex justify-center mb-3">
                <TabsList className={TABS_LIST_CLS}>
                  <TabsTrigger value="learn" className={TAB_TRIGGER_CLS}><BookOpen className="mr-1.5" size={11} /> Learn</TabsTrigger>
                  <TabsTrigger value="practice" className={TAB_TRIGGER_CLS}><PlayCircle className="mr-1.5" size={11} /> Practice</TabsTrigger>
                  <TabsTrigger value="analysis" className={TAB_TRIGGER_CLS}><Sparkles className="mr-1.5" size={11} /> Review</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="learn" className="mt-0 focus-visible:ring-0"><LimitingBeliefsBackground /></TabsContent>
              <TabsContent value="practice" className="mt-0 focus-visible:ring-0"><LimitingBeliefsTool /></TabsContent>
              <TabsContent value="analysis" className="mt-0 focus-visible:ring-0"><LimitingBeliefsAnalysis /></TabsContent>
            </Tabs>
            <PractitionerNote tone="destructive" title="Practitioner Note">
              This protocol works by creating cognitive and emotional flexibility between the limiting identity and the desired positive identity.
            </PractitionerNote>
          </div>
        ),
      },
      {
        id: "fractals",
        label: "Fractal Analysis",
        icon: Layers,
        render: () => (
          <div className="p-6 md:p-8">
            <FractalTool />
          </div>
        ),
      },
    ],
    []
  );

  const selected = sections.find((s) => s.id === selectedId) ?? sections[0];

  return (
    <UnifiedEditor
      className="h-full"
      leftTitle="Identity Work"
      rightHeader={
        <div className="px-6 h-12 flex items-center gap-3">
          {selected.icon && <selected.icon size={16} className="text-primary" />}
          <span className="text-sm font-bold text-foreground">{selected.label}</span>
        </div>
      }
      sections={sections}
      selectedId={selectedId}
      onSelect={setSelectedId}
    />
  );
};

export default IdentityWorkspacePage;