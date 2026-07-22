import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Shield,
  ShieldAlert,
  Activity,
  AlertTriangle,
  Droplets,
  Brain,
  Zap,
  Heart,
  Search,
  Layers,
  Hand,
  RefreshCw,
  Eye,
  BookOpen,
  MessageSquare,
} from "lucide-react";
import { BRAIN_REFLEX_POINTS } from "@/data/brain-reflex-data";
import type { BrainReflexPoint } from "@/data/brain-reflex-data";
import BrainReflexModal from "@/components/crm/BrainReflexModal";

type SidebarItem = {
  id: string;
  label: string;
  icon: typeof Activity;
};

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
    title: "A-F Process",
    steps: [
      "A — Feel the belief in your body. Ask: 'What do you notice? Where is it? What sensation?'",
      "B — Follow the sensation deeper. Ask: 'What do you notice now? Is it changing, moving, shifting?'",
      "C — Identify the desired state. Ask: 'What would you rather feel instead?'",
      "D — Embody the alternative. Ask: 'Feel that new state. What do you notice in the body?'",
      "E — Deepen the new feeling. Ask: 'Let that feeling expand. What do you notice?'",
      "F — Check if the belief still holds. Ask: 'Does the original belief still feel true? What do you notice?'",
    ],
  },
};

const CorrectionsManualPage = () => {
  const { session } = useAuth();

  const [activeTab, setActiveTab] = useState("afferent");
  const [afferentActive, setAfferentActive] = useState("mechanoreceptor");
  const [efferentActive, setEfferentActive] = useState("cortical");
  const [heartWallActive, setHeartWallActive] = useState("hw-screen");
  const [limitingBeliefActive, setLimitingBeliefActive] = useState("lb-process");
  const [modalPoint, setModalPoint] = useState<BrainReflexPoint | null>(null);

  if (!session) return <Navigate to="/login" replace />;

  const Sidebar = ({
    items,
    activeId,
    setActiveId,
    accent,
  }: {
    items: SidebarItem[];
    activeId: string;
    setActiveId: (id: string) => void;
    accent: string;
  }) => (
    <aside className="w-56 shrink-0 overflow-y-auto border-r max-h-[calc(100vh-120px)] sticky top-0 pt-8 pb-8">
      <div className="space-y-0.5 pr-4">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeId === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveId(item.id)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-left",
                isActive
                  ? cn("font-semibold", accent)
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon size={14} className="shrink-0" />
              <span className="text-xs">{item.label}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );

  const activeAccent = activeTab === "afferent"
    ? "bg-blue-50 text-blue-700"
    : activeTab === "efferent"
    ? "bg-purple-50 text-purple-700"
    : activeTab === "heart-wall"
    ? "bg-rose-50 text-rose-700"
    : "bg-destructive/10 text-destructive";

  const renderSteps = (steps: string[], accent: string) => (
    <ol className="space-y-3">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-3">
          <span className={cn("font-bold shrink-0 mt-0.5", accent)}>{i + 1}.</span>
          <span className="text-sm leading-relaxed">{step}</span>
        </li>
      ))}
    </ol>
  );

  const BrainZoneList = ({
    points,
    label,
    accent,
  }: {
    points: BrainReflexPoint[];
    label: string;
    accent: string;
  }) => (
    <div>
      <h4 className={cn("text-xs font-semibold mb-2", accent)}>{label}</h4>
      <div className="space-y-0.5">
        {points.map((p) => (
          <button
            key={p.id}
            onClick={() => setModalPoint(p)}
            className="w-full text-left text-xs px-3 py-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            {p.name}
          </button>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "afferent": {
        const content = afferentContent[afferentActive];
        if (!content) return null;
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-serif font-bold tracking-tight">{content.title}</h2>
            {renderSteps(content.steps, "text-blue-500")}
          </div>
        );
      }
      case "efferent": {
        const content = efferentContent[efferentActive];
        if (!content) return null;
        const showZones = efferentActive === "cortical" || efferentActive === "subcortical";
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-serif font-bold tracking-tight">{content.title}</h2>
            {renderSteps(content.steps, "text-purple-500")}
            {showZones && (
              <div className="mt-8 pt-6 border-t">
                <h3 className="text-sm font-semibold text-muted-foreground mb-4">Brain Zone Reference</h3>
                <div className="grid grid-cols-2 gap-6">
                  <BrainZoneList points={corticalPoints} label="Cortical" accent="text-blue-600" />
                  <BrainZoneList points={subcorticalPoints} label="Subcortical" accent="text-amber-600" />
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
            <h2 className="text-2xl font-serif font-bold tracking-tight">{content.title}</h2>
            {renderSteps(content.steps, "text-rose-500")}
          </div>
        );
      }
      case "limiting-beliefs": {
        const content = limitingBeliefContent[limitingBeliefActive];
        if (!content) return null;
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-serif font-bold tracking-tight">{content.title}</h2>
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

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="border-b bg-white dark:bg-neutral-950 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen size={18} className="text-muted-foreground" />
            <h1 className="text-sm font-semibold tracking-tight">Corrections Manual</h1>
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="h-8 bg-muted/60">
              <TabsTrigger value="afferent" className="text-[10px] h-7 px-3 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                <ArrowDownCircle size={12} className="mr-1.5" />
                Afferent
              </TabsTrigger>
              <TabsTrigger value="efferent" className="text-[10px] h-7 px-3 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700">
                <ArrowUpCircle size={12} className="mr-1.5" />
                Efferent
              </TabsTrigger>
              <TabsTrigger value="heart-wall" className="text-[10px] h-7 px-3 data-[state=active]:bg-rose-50 data-[state=active]:text-rose-700">
                <Shield size={12} className="mr-1.5" />
                Heart Wall
              </TabsTrigger>
              <TabsTrigger value="limiting-beliefs" className="text-[10px] h-7 px-3 data-[state=active]:bg-destructive/10 data-[state=active]:text-destructive">
                <ShieldAlert size={12} className="mr-1.5" />
                Limiting Beliefs
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="max-w-6xl mx-auto flex">
        <Sidebar
          items={getItems()}
          activeId={getActiveId()}
          setActiveId={setActiveId}
          accent={activeAccent}
        />
        <main className="flex-1 px-8 py-8 max-w-3xl">
          {renderContent()}
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

export default CorrectionsManualPage;
