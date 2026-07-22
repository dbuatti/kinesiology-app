import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  ArrowDownCircle, ArrowUpCircle, Shield, ShieldAlert,
  Activity, AlertTriangle, Droplets, Brain, Zap, Heart,
  Search, Layers, Hand, RefreshCw, Eye, MessageSquare,
  BookOpen, Printer
} from "lucide-react";
import { BRAIN_REFLEX_POINTS } from "@/data/brain-reflex-data";
import type { BrainReflexPoint } from "@/data/brain-reflex-data";
import BrainReflexModal from "@/components/crm/BrainReflexModal";
import { Input } from "@/components/ui/input";

type SidebarItem = { id: string; label: string; icon: typeof Activity };

const AFFERENT_ITEMS: SidebarItem[] = [
  { id: "mechanoreceptor", label: "Mechanoreceptor", icon: Activity },
  { id: "nociceptive", label: "Nociceptive", icon: AlertTriangle },
  { id: "physiological", label: "Physiological", icon: Droplets },
];

const EFFERENT_ITEMS: SidebarItem[] = [
  { id: "cortical", label: "Cortical", icon: Brain },
  { id: "subcortical", label: "Subcortical", icon: Zap },
  { id: "emotional", label: "Emotional", icon: Heart },
];

const HEART_WALL_ITEMS: SidebarItem[] = [
  { id: "hw-screen", label: "Screen", icon: Search },
  { id: "hw-assessment", label: "Assessment", icon: Layers },
  { id: "hw-correction", label: "Correction", icon: Hand },
  { id: "hw-recheck", label: "Recheck", icon: RefreshCw },
  { id: "hw-hidden", label: "Hidden HW", icon: Eye },
];

const LIMITING_BELIEF_ITEMS: SidebarItem[] = [
  { id: "lb-process", label: "Process", icon: MessageSquare },
];

const corticalPoints = BRAIN_REFLEX_POINTS.filter(p => p.category === "Cortical");
const subcorticalPoints = BRAIN_REFLEX_POINTS.filter(p => p.category === "Subcortical");

const afferentContent: Record<string, { title: string; steps: string[] }> = {
  mechanoreceptor: {
    title: "Mechanoreceptor (Unconscious)",
    steps: [
      "Confirm: inhibited indicator muscle → state 'afferent' → it facilitates (locks). X card or GV16 TL also facilitates.",
      "Localise: strong indicator + GV16 TL → bracket region → side → joint → touch specific ligament.",
      "Find stretch direction: stretch ligament in different directions — one direction inhibits the indicator.",
      "Correct: hold GV16 + maintain stretch direction + tuning fork on bone (+ optional rocking).",
      "Re-test the original muscle — it should now lock.",
    ],
  },
  nociceptive: {
    title: "Nociceptive (Threat Detection)",
    steps: [
      "Confirm: compress over suspected site → muscle locks after 5-10s.",
      "Hold thalamus point (Bl9 / occipitalis) to down-regulate.",
      "Re-apply the aggravating stimulus (light crude touch, joint impact, or pinch).",
      "Stack collateral inputs: look at site + breathe fast (sympathetics) + think of the suffering.",
      "Tuning fork + rocking to integrate.",
      "Reassess: site no longer inhibits, associated muscle restored.",
    ],
  },
  physiological: {
    title: "Physiological",
    steps: [
      "Address organ-specific reflexes identified during assessment.",
      "Check nutritional or hydration priorities driving the inhibition.",
      "Use specific neurolymphatic or neurovascular points for the identified organ.",
      "Consider meridian-based corrections if aligned with a TCM channel.",
      "Reassess the original inhibition pattern to confirm the correction held.",
    ],
  },
};

const efferentContent: Record<string, { title: string; steps: string[] }> = {
  cortical: {
    title: "Cortical (Top-Down)",
    steps: [
      "Identify the primary zone (PFC, M1, S1, Premotor, etc.) via indicator muscle challenge.",
      "Lateralise: Left or Right hemisphere based on the body side affected (contralateral).",
      "Identify a secondary zone (cortical or subcortical) that partners with the primary.",
      "Apply correction: Tap both zones simultaneously for 3-5s, OR hold + mentally repeat zone names until therapeutic pulse, OR TL both points + strike tuning fork on cranium.",
      "Include pathway name during intention: e.g. 'Left Psoas, Right PFC, Left Limbic'.",
      "Re-test the original inhibition — should clear.",
    ],
  },
  subcortical: {
    title: "Subcortical (Autonomic)",
    steps: [
      "Identify the subcortical zone (Limbic, Cerebellum, Hypothalamus, Thalamus, etc.) via indicator challenge.",
      "Lateralise: Left = historical/past trauma, Right = current processing (ipsilateral).",
      "Apply correction: Tapping (3-5s), Holding + Intention (until pulse), or Tuning Fork.",
      "Re-test the original inhibition to confirm.",
    ],
  },
  emotional: {
    title: "Emotional",
    steps: [
      "Apply ESR (Emotional Stress Release) points while client focuses on the stressor.",
      "Acknowledge and release associated stressors through intention.",
      "Complete the full process before re-assessing — allow time for the shift.",
      "Re-test: original inhibition should now clear.",
    ],
  },
};

const heartWallContent: Record<string, { title: string; steps: string[] }> = {
  "hw-screen": {
    title: "Screen",
    steps: [
      "Qualify an indicator muscle.",
      "Ask client to focus on their heart and imagine receiving — love, money, acceptance, care, or whatever is relevant.",
      "If the muscle inhibits (weakens), the Heart Wall is present. The word 'receiving' is key.",
    ],
  },
  "hw-assessment": {
    title: "Assessment Flow",
    steps: [
      "Permission: ask 'Do we have permission to assess the Heart Wall?' If no, do Harmonic Rocking first, then re-ask.",
      "Count layers: ask 'How many layers?' Challenge: more than 5? 10? 15? 20? 25? Narrow to exact number.",
      "Find priority primary: challenge 'Mission to assess for priority primary'. Use pulse points to identify organ — right deep → Lung/Colon, left deep → Liver/Gallbladder.",
      "Once organ is known, scan the emotion chart for the specific emotion in that organ's row.",
      "Assess related muscles: test the muscles correlated to that emotion row — they will be inhibited.",
      "Find efferent coordinates: challenge Cortical → Subcortical → Cerebellum → Limbic. Write down the brain zones.",
      "Optional context: ask 'Do we need more context?' If yes: age? life event? absorbed or inherited? from Mom or Dad?",
    ],
  },
  "hw-correction": {
    title: "Correction Flow",
    steps: [
      "Permission: ask 'Do we have permission to correct the priority primary Heart Wall layer?'",
      "Stim Heart Visceral Referral Zone: lightly rub from chest, over shoulder, down ulnar (pinky) side of left arm.",
      "While rubbing, state intention: 'Heart wall, [organ], [emotion], inherited from [parent].' Repeat over 3 minutes.",
      "Hold organ pulse point or squeeze associated muscle (e.g. for Lung → squeeze Posterior Deltoid).",
      "Optional: ask client to place one hand on heart, other on the organ. 'Let them be friends again.'",
      "Tap efferent zones simultaneously while holding pulse point — 3 firm swipes (10 if inherited).",
      "Alternative: activate brain circuits then do Harmonic Rocking instead of holding for 3 minutes.",
    ],
  },
  "hw-recheck": {
    title: "Recheck",
    steps: [
      "Wait for a parasympathetic shift: sigh, yawn, gurgle, or client says 'a wave came up' or 'something is leaving'.",
      "Re-test the associated muscles — they should now lock.",
      "State the emotion again — indicator should lock.",
      "Re-count remaining layers: 'How many layers remain?' Track the reduction from baseline.",
    ],
  },
  "hw-hidden": {
    title: "Hidden Heart Wall",
    steps: [
      "After main Heart Wall clears, a hidden Heart Wall may appear after a few days or weeks.",
      "Uses the same screen, assessment, and correction process as the main Heart Wall.",
      "Screen for it in follow-up sessions using the standard protocol.",
    ],
  },
};

const limitingBeliefContent: Record<string, { title: string; steps: string[] }> = {
  "lb-process": {
    title: "A-E Cycle + F/G/H Checkpoints",
    steps: [
      "A — Feel the belief in your body. Ask: 'What do you notice? Where is it? What sensation?'",
      "B — Follow the sensation deeper. Ask: 'What do you notice now? Is it changing, moving, shifting?'",
      "C — Identify the desired state. Ask: 'What would you rather feel instead?'",
      "D — Embody the alternative. Ask: 'Feel that new state. What do you notice in the body?'",
      "E — Deepen the new feeling. Ask: 'Let that feeling expand. What do you notice?'",
      "After E, show Checkpoint F: 'Does the original belief still feel true?'",
      "  → YES → start a new A-E cycle. Next time skip F and show G.",
      "  → NO → advance to G.",
      "Checkpoint G: 'Do you see yourself believing this in the future?'",
      "  → YES → start a new A-E cycle. Next time skip F + G and show H.",
      "  → NO → advance to H.",
      "Checkpoint H: 'Is there any scenario where this belief might still feel true?'",
      "  → YES → start a new A-E cycle. Stay on H and retry.",
      "  → NO → session complete — belief resolved.",
    ],
  },
};

const CorrectionsManualContent = () => {
  const [activeTab, setActiveTab] = useState("afferent");
  const [afferentActive, setAfferentActive] = useState("mechanoreceptor");
  const [efferentActive, setEfferentActive] = useState("cortical");
  const [heartWallActive, setHeartWallActive] = useState("hw-screen");
  const [limitingBeliefActive, setLimitingBeliefActive] = useState("lb-process");
  const [modalPoint, setModalPoint] = useState<BrainReflexPoint | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const tabAccent = activeTab === "afferent"
    ? "text-blue-600 bg-blue-50 border-blue-200"
    : activeTab === "efferent"
    ? "text-purple-600 bg-purple-50 border-purple-200"
    : activeTab === "heart-wall"
    ? "text-rose-600 bg-rose-50 border-rose-200"
    : "text-destructive bg-destructive/10 border-destructive/20";

  const filteredBrainZones = (points: BrainReflexPoint[]) => {
    if (!searchQuery) return points;
    const q = searchQuery.toLowerCase();
    return points.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.location.toLowerCase().includes(q) ||
      p.functions?.some(f => f.toLowerCase().includes(q))
    );
  };

  const Sidebar = ({ items, activeId, setActiveId }: {
    items: SidebarItem[]; activeId: string; setActiveId: (id: string) => void;
  }) => (
    <aside className="w-44 shrink-0 overflow-y-auto border-r max-h-[calc(100vh-140px)] sticky top-0 py-4">
      <div className="space-y-0.5 px-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeId === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveId(item.id)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-left group",
                isActive
                  ? cn("font-semibold shadow-sm", tabAccent)
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              <Icon size={14} className={cn("shrink-0", isActive ? "" : "text-muted-foreground/60")} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );

  const renderSteps = (steps: string[], accent: string) => (
    <div className="space-y-1.5">
      {steps.map((step, i) => (
        <div key={i} className="flex gap-3 px-3 py-2 rounded-lg hover:bg-muted/40 transition-colors">
          <span className={cn(
            "flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold shrink-0 mt-0.5",
            accent === "text-blue-600" ? "bg-blue-100 text-blue-700" :
            accent === "text-purple-600" ? "bg-purple-100 text-purple-700" :
            accent === "text-rose-600" ? "bg-rose-100 text-rose-700" :
            "bg-destructive/10 text-destructive"
          )}>
            {i + 1}
          </span>
          <span className="text-xs leading-relaxed text-foreground/90">{step}</span>
        </div>
      ))}
    </div>
  );

  const BrainZoneList = ({ points, label, accent }: {
    points: BrainReflexPoint[]; label: string; accent: string;
  }) => {
    const filtered = filteredBrainZones(points);
    return (
      <div>
        <h4 className={cn("text-[11px] font-semibold mb-2", accent)}>{label}</h4>
        <div className="flex flex-wrap gap-1.5">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => setModalPoint(p)}
              className="text-[10px] px-2.5 py-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground border border-border bg-card"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const getContent = () => {
    switch (activeTab) {
      case "afferent": {
        const content = afferentContent[afferentActive];
        if (!content) return null;
        return (
          <div className="space-y-4">
            <h2 className="text-base font-bold tracking-tight">{content.title}</h2>
            {renderSteps(content.steps, "text-blue-600")}
          </div>
        );
      }
      case "efferent": {
        const content = efferentContent[efferentActive];
        if (!content) return null;
        const showZones = efferentActive === "cortical" || efferentActive === "subcortical";
        return (
          <div className="space-y-4">
            <h2 className="text-base font-bold tracking-tight">{content.title}</h2>
            {renderSteps(content.steps, "text-purple-600")}
            {showZones && (
              <div className="mt-6 pt-4 border-t space-y-4">
                <h3 className="text-xs font-semibold text-muted-foreground">Brain Zone Reference</h3>
                <div className="space-y-4">
                  <BrainZoneList points={filteredBrainZones(corticalPoints)} label="Cortical" accent="text-blue-600" />
                  <BrainZoneList points={filteredBrainZones(subcorticalPoints)} label="Subcortical" accent="text-amber-600" />
                </div>
              </div>
            )}
          </div>
        );
      }
      case "heart-wall": {
        const content = heartWallContent[heartWallActive];
        if (!content) return null;
        return (
          <div className="space-y-4">
            <h2 className="text-base font-bold tracking-tight">{content.title}</h2>
            {renderSteps(content.steps, "text-rose-600")}
          </div>
        );
      }
      case "limiting-beliefs": {
        const content = limitingBeliefContent[limitingBeliefActive];
        if (!content) return null;
        return (
          <div className="space-y-4">
            <h2 className="text-base font-bold tracking-tight">{content.title}</h2>
            {renderSteps(content.steps, "text-destructive")}
          </div>
        );
      }
      default:
        return null;
    }
  };

  const getActiveId = () => {
    switch (activeTab) {
      case "afferent": return afferentActive;
      case "efferent": return efferentActive;
      case "heart-wall": return heartWallActive;
      case "limiting-beliefs": return limitingBeliefActive;
      default: return "";
    }
  };

  const setActiveId = (id: string) => {
    switch (activeTab) {
      case "afferent": setAfferentActive(id); break;
      case "efferent": setEfferentActive(id); break;
      case "heart-wall": setHeartWallActive(id); break;
      case "limiting-beliefs": setLimitingBeliefActive(id); break;
    }
  };

  const getItems = (): SidebarItem[] => {
    switch (activeTab) {
      case "afferent": return AFFERENT_ITEMS;
      case "efferent": return EFFERENT_ITEMS;
      case "heart-wall": return HEART_WALL_ITEMS;
      case "limiting-beliefs": return LIMITING_BELIEF_ITEMS;
      default: return [];
    }
  };

  const getSearchPlaceholder = () => {
    if (activeTab === "efferent") return "Search brain zones...";
    return undefined;
  };

  const handlePrint = () => window.print();

  return (
    <div className="h-full flex flex-col">
      <div className="border-b shrink-0">
        <div className="px-4 py-2 flex items-center justify-between gap-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="h-8 bg-muted/60">
              <TabsTrigger value="afferent" className="text-[10px] h-7 px-3 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm">
                <ArrowDownCircle size={12} className="mr-1.5" /> Afferent
              </TabsTrigger>
              <TabsTrigger value="efferent" className="text-[10px] h-7 px-3 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 data-[state=active]:shadow-sm">
                <ArrowUpCircle size={12} className="mr-1.5" /> Efferent
              </TabsTrigger>
              <TabsTrigger value="heart-wall" className="text-[10px] h-7 px-3 data-[state=active]:bg-rose-50 data-[state=active]:text-rose-700 data-[state=active]:shadow-sm">
                <Shield size={12} className="mr-1.5" /> Heart Wall
              </TabsTrigger>
              <TabsTrigger value="limiting-beliefs" className="text-[10px] h-7 px-3 data-[state=active]:bg-destructive/10 data-[state=active]:text-destructive data-[state=active]:shadow-sm">
                <ShieldAlert size={12} className="mr-1.5" /> Limiting Beliefs
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-2">
            {getSearchPlaceholder() && (
              <div className="relative w-48">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={getSearchPlaceholder()}
                  className="h-7 pl-7 text-[11px] rounded-lg"
                />
              </div>
            )}
            <button
              onClick={handlePrint}
              className="h-7 px-2.5 rounded-lg text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1.5"
            >
              <Printer size={12} /> Print
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar items={getItems()} activeId={getActiveId()} setActiveId={setActiveId} />
        <main className="flex-1 px-6 py-6 overflow-y-auto max-w-3xl">
          {getContent()}
        </main>
      </div>

      <BrainReflexModal
        point={modalPoint}
        open={!!modalPoint}
        onOpenChange={(open) => { if (!open) setModalPoint(null); }}
        primaryUrl={null}
        secondaryUrl={null}
      />
    </div>
  );
};

export default CorrectionsManualContent;
