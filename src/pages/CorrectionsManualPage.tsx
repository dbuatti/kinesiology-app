import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Sparkles,
  MessageSquare,
  Info,
  Eye,
  BookOpen,
} from "lucide-react";

type SidebarItem = {
  id: string;
  label: string;
  icon: typeof Activity;
};

const AFFERENT_ITEMS: SidebarItem[] = [
  { id: "mechanoreceptor", label: "Mechanoreceptor (Unconscious)", icon: Activity },
  { id: "nociceptive", label: "Nociceptive (Threat Detection)", icon: AlertTriangle },
  { id: "physiological", label: "Physiological", icon: Droplets },
];

const EFFERENT_ITEMS: SidebarItem[] = [
  { id: "cortical", label: "Cortical (Top-Down)", icon: Brain },
  { id: "subcortical", label: "Subcortical (Autonomic)", icon: Zap },
  { id: "emotional", label: "Emotional", icon: Heart },
];

const HEART_WALL_ITEMS: SidebarItem[] = [
  { id: "hw-overview", label: "Overview", icon: Shield },
  { id: "hw-screen", label: "Screen — Is It Present?", icon: Search },
  { id: "hw-assessment", label: "Assessment Flow", icon: Layers },
  { id: "hw-correction", label: "Correction Flow", icon: Hand },
  { id: "hw-aftercare", label: "Somatic Responses & Aftercare", icon: RefreshCw },
  { id: "hw-hidden", label: "Hidden Heart Wall", icon: Eye },
];

const LIMITING_BELIEF_ITEMS: SidebarItem[] = [
  { id: "lb-overview", label: "Overview", icon: ShieldAlert },
  { id: "lb-suffering", label: "Psychology of Suffering", icon: Brain },
  { id: "lb-wants-needs", label: "Wants vs Needs", icon: Info },
  { id: "lb-mechanics", label: "Mechanics of Suffering", icon: Layers },
  { id: "lb-language", label: "Language Patterns", icon: MessageSquare },
];

const afferentContent: Record<string, { title: string; steps: string[] }> = {
  mechanoreceptor: {
    title: "Mechanoreceptor (Unconscious)",
    steps: [
      "85% of afferent input. Spinocerebellar tracts to cerebellum. Target ligaments, tendons, and fascia.",
      "Confirm: inhibited indicator muscle → state 'afferent' → it facilitates (locks). X card or GV16 TL also facilitates.",
      "Localise: strong indicator muscle + GV16 TL → bracket region → side → joint → touch specific ligament.",
      "Find stretch direction: stretch the ligament in different directions — one direction will inhibit the indicator.",
      "Correct: hold GV16 + maintain the stretch direction + tuning fork on bone (+ optional rocking).",
      "Re-test the original muscle — it should now facilitate (lock).",
      "Note: Unconscious mechanoreception processes ~85% of all afferent input through the cerebellum.",
    ],
  },
  nociceptive: {
    title: "Nociceptive (Threat Detection)",
    steps: [
      "Threat detection via the spinothalamic tract (anterolateral system). A-delta (fast, sharp) and C-fibre (slow, dull ache) pathways.",
      "Confirmation: compress over the suspected site → muscle locks after 5-10s → confirms nociception.",
      "Hold the thalamus point (Bl9 / occipitalis) — this down-regulates the threat signal.",
      "Re-apply the aggravating stimulus (light crude touch, joint impact, or pinch).",
      "Stack collateral inputs: look at the site + breathe fast (sympathetics) + think of the suffering.",
      "Tuning fork + rocking to integrate (piezoelectric reset).",
      "Reassess: site no longer inhibits, associated muscle restored.",
      "Scar rule: Stretch = mechanoreception. Light/crude touch = nociception. A scar can carry both.",
    ],
  },
  physiological: {
    title: "Physiological",
    steps: [
      "Biochemical, nutritional, and organ-based signals. Addresses systemic imbalances.",
      "Address biochemical or organ-specific reflexes identified during assessment.",
      "Check for nutritional or hydration priorities that may be driving the inhibition.",
      "Use specific neurolymphatic or neurovascular points for the identified organ.",
      "Consider meridian-based corrections if the finding aligns with a TCM channel.",
      "Reassess the original inhibition pattern to confirm the correction held.",
    ],
  },
};

const efferentContent: Record<string, { title: string; steps: string[] }> = {
  cortical: {
    title: "Cortical (Top-Down)",
    steps: [
      "Intentional, cognitive, and motor planning processes. Contralateral logic: right cortex controls left body.",
      "Identify the primary cortical zone (Prefrontal Cortex, M1, S1, Premotor, etc.) using indicator muscle challenge.",
      "Lateralise: Left or Right hemisphere based on the body side affected.",
      "Identify a secondary zone (cortical or subcortical) that partners with the primary zone.",
      "Apply correction method:",
      "  — Tapping: simultaneous tap both zones for 3-5 seconds.",
      "  — Holding + Intention: hold both points and mentally repeat the zone names until you feel a therapeutic pulse.",
      "  — Tuning Fork: TL both points, strike fork, place on cranium.",
      "Include pathway name during intention: e.g. 'Left Psoas, Right PFC, Left Limbic'.",
      "Re-test the original inhibition pattern — should clear.",
    ],
  },
  subcortical: {
    title: "Subcortical (Autonomic)",
    steps: [
      "Automatic, reflexive, and autonomic regulation. Ipsilateral logic: left cerebellum controls left body.",
      "Identify the subcortical zone (Limbic, Cerebellum, Hypothalamus, Basal Ganglia, Thalamus, Pons, Medulla) using indicator muscle challenge.",
      "Lateralise the response: Left = historical/past trauma, Right = current emotional processing.",
      "Use rhythmic movements or breathing patterns to engage the subcortical system.",
      "Apply correction method: Tapping (3-5s), Holding + Intention (until pulse), or Tuning Fork.",
      "Subcortical structures are ipsilateral — left cerebellum corrects left body dysfunction.",
      "Re-test the original inhibition to confirm the correction.",
    ],
  },
  emotional: {
    title: "Emotional",
    steps: [
      "Limbic system and emotional processing. Final check if afferent and efferent are clear.",
      "Apply ESR (Emotional Stress Release) points — holding specific points while the client focuses on the stressor.",
      "Acknowledge and release associated stressors through intention.",
      "Use specific meridian-based emotional balancing if the emotion maps to a TCM element.",
      "Complete the full emotional process before re-assessing — allow time for the shift.",
      "Re-test: the original inhibition should now clear.",
      "Note: Never suggest memories or emotions to the client. Let the nervous system guide the process.",
    ],
  },
};

const heartWallContent: Record<string, { title: string; steps: React.ReactNode }> = {
  "hw-overview": {
    title: "Overview",
    steps: (
      <div className="space-y-4">
        <p className="text-base leading-relaxed">
          A Heart Wall is a metaphorical barrier created by the subconscious mind using trapped emotions. Its primary purpose is to protect the heart from emotional pain.
        </p>
        <div className="p-4 border-l-4 border-rose-400 bg-rose-50">
          <p className="text-sm font-medium text-rose-800">The Trade-off: While the wall provides safety during trauma, it also numbs positive emotions and blocks connection with others.</p>
        </div>
        <div className="p-4 border-l-4 border-indigo-400 bg-indigo-50">
          <p className="text-sm font-medium text-indigo-800">The Pericardium meridian in Chinese medicine is the same concept — the 'heart protector' described thousands of years ago.</p>
        </div>
        <div className="mt-4">
          <h4 className="font-bold text-sm mb-2">Priority Primary Approach</h4>
          <p className="text-sm leading-relaxed">Instead of clearing all layers one by one, ask the body for the priority primary layer — the highest-impact layer. One correction can clear 5-10 layers at once.</p>
        </div>
        <div>
          <h4 className="font-bold text-sm mb-2">When to Check</h4>
          <p className="text-sm leading-relaxed">The question isn't when — it's when do you not check? Screen new clients, returning clients, and yourself.</p>
        </div>
      </div>
    ),
  },
  "hw-screen": {
    title: "Screen — Is a Heart Wall Present?",
    steps: (
      <div className="space-y-4">
        <p className="text-base font-medium">Three-step screening process:</p>
        <ol className="space-y-3">
          <li className="flex gap-3">
            <span className="font-bold text-rose-600 shrink-0">1.</span>
            <span className="text-sm leading-relaxed"><strong>Qualify</strong> an indicator muscle.</span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold text-rose-600 shrink-0">2.</span>
            <span className="text-sm leading-relaxed">Ask the client to focus on their heart and imagine <strong>receiving</strong> — love, money, acceptance, care, or whatever is relevant.</span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold text-rose-600 shrink-0">3.</span>
            <span className="text-sm leading-relaxed">If the muscle inhibits (weakens), the Heart Wall is present. The word <strong>"receiving"</strong> is key — it directly challenges the protective barrier.</span>
          </li>
        </ol>
        <div className="p-4 border-l-4 border-amber-400 bg-amber-50">
          <p className="text-sm font-medium text-amber-800"><strong>Tip:</strong> Explain to the client: "You know when you've been through something and you can feel yourself shut down so it doesn't happen again? Those responses take bandwidth from the nervous system. We can calibrate that."</p>
        </div>
      </div>
    ),
  },
  "hw-assessment": {
    title: "Assessment Flow",
    steps: (
      <div className="space-y-6">
        <div>
          <h4 className="font-bold text-sm text-rose-600">1. Permission to Assess</h4>
          <p className="text-sm leading-relaxed">Ask: "Do we have permission to assess the Heart Wall?" If the system is not ready, respect the boundary. Perform Harmonic Rocking first to down-regulate, then re-ask.</p>
        </div>
        <div>
          <h4 className="font-bold text-sm text-indigo-600">2. Count Layers</h4>
          <p className="text-sm leading-relaxed">Ask the subconscious: "How many layers are present?" Challenge in sequence: More than 5? 10? 15? 20? 25? Then narrow to the exact number. Average is 5-25 layers.</p>
        </div>
        <div>
          <h4 className="font-bold text-sm text-rose-600">3. Find Emotion (Priority Primary)</h4>
          <p className="text-sm leading-relaxed">Challenge "Mission to assess for priority primary." Use pulse points to identify the organ. Right pulse points + deep touch → Lung/Colon. Left → Liver/Gallbladder. Once you know the organ, scan the emotion chart for the specific emotion.</p>
        </div>
        <div>
          <h4 className="font-bold text-sm text-emerald-600">4. Assess Related Muscles</h4>
          <p className="text-sm leading-relaxed">Every emotion row has correlated muscles. Test them — they will come up inhibited. This confirms the circuit is active.</p>
        </div>
        <div>
          <h4 className="font-bold text-sm text-indigo-600">5. Find Efferent Coordinates</h4>
          <p className="text-sm leading-relaxed">Challenge Cortical → Subcortical → Cerebellum → Limbic. Find which specific brain zones are involved and write them down.</p>
        </div>
        <div>
          <h4 className="font-bold text-sm text-amber-600">6. Gather Context (optional)</h4>
          <p className="text-sm leading-relaxed">Challenge: "Do we need more context?" If yes, ask: Age? Life event? Absorbed or inherited? From Mom or Dad? Don't share all of this with the client unless you have the skills.</p>
        </div>
        <div>
          <h4 className="font-bold text-sm text-amber-500">7. Priority Primary Confirmed</h4>
          <p className="text-sm leading-relaxed">You have: the emotion, the organ, the related muscles, the brain zones, and optionally the context. One correction on this can clear 5-10 layers.</p>
        </div>
      </div>
    ),
  },
  "hw-correction": {
    title: "Correction Flow",
    steps: (
      <div className="space-y-6">
        <div>
          <h4 className="font-bold text-sm text-emerald-600">1. Permission to Correct</h4>
          <p className="text-sm leading-relaxed">Ask: "Do we have permission to correct the priority primary Heart Wall layer?" If yes, proceed.</p>
        </div>
        <div>
          <h4 className="font-bold text-sm text-rose-600">2. Stim Heart Visceral Referral Zone</h4>
          <p className="text-sm leading-relaxed">Always the first step. Lightly rub along the Heart Visceral Referral Zone — from the chest, over the shoulder, and down the ulnar (pinky) side of the left arm. This signals to the brain that we are working on the Heart Wall.</p>
          <p className="text-sm mt-1 text-muted-foreground">Intention: "Heart wall, {organ}, {emotion}, inherited from {parent}." Repeat over the 3-minute period.</p>
        </div>
        <div>
          <h4 className="font-bold text-sm text-indigo-600">3. Hold Organ Pulse Point or Squeeze Muscle</h4>
          <p className="text-sm leading-relaxed">Touch and hold the organ-specific pulse point identified during assessment. You can also squeeze the associated muscle (e.g. for Lung → squeeze Posterior Deltoid).</p>
          <p className="text-sm mt-1 text-muted-foreground">Optional: Ask client to place one hand on their heart and the other on the organ. "Let them be friends again."</p>
        </div>
        <div>
          <h4 className="font-bold text-sm text-indigo-600">4. Tap Efferent Zones</h4>
          <p className="text-sm leading-relaxed">Tap the identified brain zones simultaneously while holding the pulse point. Standard: 3 firm swipes. If inherited: 10 swipes.</p>
          <p className="text-sm mt-1 text-muted-foreground">Alternative: Activate brain circuits, then do Harmonic Rocking instead of holding points for 3 minutes.</p>
        </div>
        <div>
          <h4 className="font-bold text-sm text-emerald-600">5. Recheck Muscles & Count Remaining Layers</h4>
          <p className="text-sm leading-relaxed">Re-test the associated muscles — they should now lock. Re-count layers: "How many layers remain?" Track the reduction. Wait for a parasympathetic shift (sigh, yawn, gurgle) before re-testing.</p>
        </div>
      </div>
    ),
  },
  "hw-aftercare": {
    title: "Somatic Responses & Aftercare",
    steps: (
      <div className="space-y-6">
        <div>
          <h4 className="font-bold text-sm mb-2">What Clients May Feel</h4>
          <ul className="space-y-1.5 text-sm">
            <li>• A wave or energy moving through the body</li>
            <li>• Feeling of something "leaving"</li>
            <li>• Electrical signal changes</li>
            <li>• Yawning, sighing, swallowing, gurgling (parasympathetic shifts)</li>
            <li>• Tears or emotional release</li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-sm mb-2">After the Correction</h4>
          <p className="text-sm leading-relaxed">Give the client a few minutes to rest. Let them drift — their body is replaying and integrating. Use this time to tap notes.</p>
          <p className="text-sm mt-1 italic text-muted-foreground">"And just like that, do its thing, it's like they're friends again."</p>
        </div>
        <div>
          <h4 className="font-bold text-sm mb-2">Client Instruction</h4>
          <p className="text-sm leading-relaxed">Place one hand on heart, the other on the organ. Let them rest. The hands create a self-soothing circuit.</p>
        </div>
        <div className="p-4 border-l-4 border-amber-400 bg-amber-50">
          <p className="text-sm font-medium text-amber-800">Pro-Tip: Clearing a Heart Wall is often a multi-session process. The subconscious will only allow release of what the system is ready to process. If the body says 'No', honor that boundary.</p>
        </div>
      </div>
    ),
  },
  "hw-hidden": {
    title: "Hidden Heart Wall",
    steps: (
      <div className="space-y-4">
        <p className="text-base leading-relaxed">
          After the main Heart Wall is cleared, a hidden Heart Wall may appear within a few days or weeks. It will usually have fewer layers than the original.
        </p>
        <div className="p-4 border-l-4 border-indigo-400 bg-indigo-50">
          <p className="text-sm font-medium text-indigo-800"><strong>Timeline:</strong> Hidden Heart Wall will not show for a few days, maybe weeks afterwards. Screen for it in follow-up sessions.</p>
        </div>
        <div className="p-4 border-l-4 border-indigo-400 bg-indigo-50">
          <p className="text-sm font-medium text-indigo-800"><strong>Why It Exists:</strong> The subconscious holds deeper layers back until the system is ready to process them.</p>
        </div>
        <p className="text-sm"><strong>Protocol:</strong> Same assessment and correction process as the main Heart Wall. Just screen for it again in subsequent sessions.</p>
      </div>
    ),
  },
};

const limitingBeliefContent: Record<string, { title: string; steps: React.ReactNode }> = {
  "lb-overview": {
    title: "Overview",
    steps: (
      <div className="space-y-4">
        <p className="text-base leading-relaxed">
          Limiting beliefs are stories the mind creates to explain felt sensations. They become fused with identity and drive patterns of suffering, avoidance, and self-sabotage.
        </p>
        <p className="text-sm leading-relaxed">
          The protocol works by creating cognitive and emotional flexibility between the limiting identity and the desired positive identity. It dissolves the charge around the belief and installs a new, empowered perspective.
        </p>
        <div className="p-4 border-l-4 border-rose-400 bg-rose-50">
          <p className="text-sm font-medium text-rose-800">The core insight: Suffering is the result of the nervous system's inability to process a specific felt sense. We create beliefs to explain the feeling, and those beliefs become our reality.</p>
        </div>
      </div>
    ),
  },
  "lb-suffering": {
    title: "Psychology of Suffering",
    steps: (
      <div className="space-y-4">
        <div>
          <h4 className="font-bold text-sm mb-2">Moving Towards vs. Away</h4>
          <p className="text-sm leading-relaxed">Most suffering stems from trying to move "away" from a feeling rather than "towards" a goal. When we resist a feeling, we create a "not-me" identity that we must constantly defend or escape from.</p>
        </div>
        <div>
          <h4 className="font-bold text-sm mb-2">Inability to Sit in Feelings</h4>
          <p className="text-sm leading-relaxed">Suffering is the result of the nervous system's inability to process a specific felt sense. We create beliefs to explain why we feel this way, which then become the "truth" of our reality.</p>
        </div>
        <div>
          <h4 className="font-bold text-sm mb-2">The Goal</h4>
          <p className="text-sm leading-relaxed">The shift occurs when the client can distinguish between the 'me' (the observer) and the 'not-me' (the identity/emotion). This creates space for the limiting belief to dissolve and a new positive identity to integrate.</p>
        </div>
      </div>
    ),
  },
  "lb-wants-needs": {
    title: "Wants vs Needs",
    steps: (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed">The conscious mind wants one thing, but the nervous system has a different priority:</p>
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="p-3 text-left font-bold border-r">Client Wants (Conscious)</th>
                <th className="p-3 text-left font-bold">Nervous System Goals (Unconscious)</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="p-3 border-r">To be happy and successful</td>
                <td className="p-3">To maintain safety and predictability</td>
              </tr>
              <tr>
                <td className="p-3 border-r">To get rid of the pain</td>
                <td className="p-3">To keep the pain as a protective signal</td>
              </tr>
              <tr>
                <td className="p-3 border-r">To change their life</td>
                <td className="p-3">To preserve the current identity (even if it hurts)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    ),
  },
  "lb-mechanics": {
    title: "Mechanics of Suffering",
    steps: (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed">The chain of suffering follows a predictable pattern:</p>
        <div className="space-y-3">
          <div className="flex items-center gap-4 p-3 border rounded-lg">
            <span className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm">1</span>
            <div>
              <p className="font-bold text-sm">Stimulus</p>
              <p className="text-xs text-muted-foreground">External event or internal thought</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-3 border rounded-lg">
            <span className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 font-bold text-sm">2</span>
            <div>
              <p className="font-bold text-sm">Felt Sense</p>
              <p className="text-xs text-muted-foreground">Raw physical sensation in the body</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-3 border rounded-lg">
            <span className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">3</span>
            <div>
              <p className="font-bold text-sm">Belief Extraction</p>
              <p className="text-xs text-muted-foreground">Mind creates a story to explain the feeling</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-3 border rounded-lg">
            <span className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center text-destructive font-bold text-sm">4</span>
            <div>
              <p className="font-bold text-sm">Overwhelm</p>
              <p className="text-xs text-muted-foreground">Identity becomes fused with the belief</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  "lb-language": {
    title: "Language Patterns",
    steps: (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed">Limiting beliefs show up in specific language patterns. Listen for these in client speech:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 border border-blue-200 bg-blue-50 rounded-lg">
            <h4 className="font-bold text-sm text-blue-800">Identity Statements</h4>
            <p className="text-xs font-mono mt-1">"I am..."</p>
            <p className="text-xs italic mt-1">E.g. "I am not good enough"</p>
          </div>
          <div className="p-3 border border-purple-200 bg-purple-50 rounded-lg">
            <h4 className="font-bold text-sm text-purple-800">Generalizations</h4>
            <p className="text-xs font-mono mt-1">"People will..."</p>
            <p className="text-xs italic mt-1">E.g. "People will always let me down"</p>
          </div>
          <div className="p-3 border border-emerald-200 bg-emerald-50 rounded-lg">
            <h4 className="font-bold text-sm text-emerald-800">Causality</h4>
            <p className="text-xs font-mono mt-1">"If I... then..."</p>
            <p className="text-xs italic mt-1">E.g. "If I succeed, I'll be alone"</p>
          </div>
          <div className="p-3 border border-amber-200 bg-amber-50 rounded-lg">
            <h4 className="font-bold text-sm text-amber-800">Necessity</h4>
            <p className="text-xs font-mono mt-1">"I must / I can't..."</p>
            <p className="text-xs italic mt-1">E.g. "I can't show any weakness"</p>
          </div>
          <div className="p-3 border border-rose-200 bg-rose-50 rounded-lg">
            <h4 className="font-bold text-sm text-rose-800">Possibility</h4>
            <p className="text-xs font-mono mt-1">"It's impossible to..."</p>
            <p className="text-xs italic mt-1">E.g. "It's impossible to be truly happy"</p>
          </div>
          <div className="p-3 border border-indigo-200 bg-indigo-50 rounded-lg">
            <h4 className="font-bold text-sm text-indigo-800">External Control</h4>
            <p className="text-xs font-mono mt-1">"They make me..."</p>
            <p className="text-xs italic mt-1">E.g. "They make me feel worthless"</p>
          </div>
        </div>
      </div>
    ),
  },
};

const CorrectionsManualPage = () => {
  const { session } = useAuth();

  const [activeTab, setActiveTab] = useState("afferent");
  const [afferentActive, setAfferentActive] = useState("mechanoreceptor");
  const [efferentActive, setEfferentActive] = useState("cortical");
  const [heartWallActive, setHeartWallActive] = useState("hw-overview");
  const [limitingBeliefActive, setLimitingBeliefActive] = useState("lb-overview");

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
    <aside className="w-64 shrink-0 overflow-y-auto border-r max-h-[calc(100vh-120px)] sticky top-0 pt-8 pb-8">
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

  const renderContent = () => {
    switch (activeTab) {
      case "afferent": {
        const content = afferentContent[afferentActive];
        if (!content) return null;
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-serif font-bold tracking-tight">{content.title}</h2>
            <ol className="space-y-3">
              {content.steps.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="font-bold text-blue-500 shrink-0 mt-0.5">{i + 1}.</span>
                  <span className="text-sm leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        );
      }
      case "efferent": {
        const content = efferentContent[efferentActive];
        if (!content) return null;
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-serif font-bold tracking-tight">{content.title}</h2>
            <ol className="space-y-3">
              {content.steps.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="font-bold text-purple-500 shrink-0 mt-0.5">{i + 1}.</span>
                  <span className="text-sm leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        );
      }
      case "heart-wall": {
        const content = heartWallContent[heartWallActive];
        if (!content) return null;
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-serif font-bold tracking-tight flex items-center gap-2">
              <Shield size={20} className="text-rose-500" />
              {content.title}
            </h2>
            <div>{content.steps}</div>
          </div>
        );
      }
      case "limiting-beliefs": {
        const content = limitingBeliefContent[limitingBeliefActive];
        if (!content) return null;
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-serif font-bold tracking-tight flex items-center gap-2">
              <ShieldAlert size={20} className="text-destructive" />
              {content.title}
            </h2>
            <div>{content.steps}</div>
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
      {/* Simple header bar */}
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

      {/* Body */}
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
    </div>
  );
};

export default CorrectionsManualPage;
