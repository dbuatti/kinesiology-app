import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  ArrowDownCircle, ArrowUpCircle, ArrowRightCircle, ArrowDown,
  Activity, AlertTriangle, Droplets, Brain, Zap, Heart,
  Search, Layers, Hand, RefreshCw, Eye, MessageSquare,
  Printer, ChevronLeft, Check, Maximize2
} from "lucide-react";
import { BRAIN_REFLEX_POINTS } from "@/data/brain-reflex-data";
import type { BrainReflexPoint } from "@/data/brain-reflex-data";
import BrainReflexModal from "@/components/crm/BrainReflexModal";
import { Input } from "@/components/ui/input";
import CorrectionsSidebar from "@/components/crm/CorrectionsSidebar";
import ProtocolLogSheet, { ProtocolLogBar } from "@/components/crm/corrections/ProtocolLogSheet";
import { PROTOCOL_FIELDS, EMOTION_ORGANS, EYE_POSITIONS, PROTOCOL_STEP_MAP, hasStepFields, type ProtocolLog, type ProtocolLogPatch } from "@/data/protocol-log";
import type { CorrectionTab, CorrectionSelection, CorrectionTarget } from "@/components/crm/corrections/CorrectionDockContext";

type SidebarItem = { id: string; label: string; icon: typeof Activity; group?: string };

const AFFERENT_ITEMS: SidebarItem[] = [
  { id: "mechanoreceptor", label: "Mechanoreceptor", icon: Activity },
  { id: "nociceptive", label: "Nociceptive", icon: AlertTriangle },
  { id: "physiological", label: "Physiological", icon: Droplets },
];

// Emotional is part of Efferent: Cortical/Subcortical say WHERE, the emotional
// protocols (ESR, Heart Wall, Limiting Beliefs) say HOW. They live in one list
// so emotional work isn't split across unrelated top-level tabs.
// Heart Wall is one process: screen → assess → correct → recheck → hidden,
// scrolled through as a single page rather than five separate ones.
const EFFERENT_ITEMS: SidebarItem[] = [
  { id: "cortical", label: "Cortical", icon: Brain, group: "Brain" },
  { id: "subcortical", label: "Subcortical", icon: Zap, group: "Brain" },
  { id: "emotional", label: "ESR / Pulse Point", icon: Heart, group: "Emotional" },
  { id: "hw", label: "Heart Wall", icon: Hand, group: "Heart Wall" },
  { id: "lb-process", label: "Process", icon: MessageSquare, group: "Limiting Beliefs" },
];

/** Older deep links point at `hw-screen`, `hw-assessment`… — all one page now. */
const normalizeItemId = (id: string) => (id.startsWith("hw-") ? "hw" : id);

/** Element dot for the organ reference — one colour per TCM element. */
const ELEMENT_DOT: Record<string, string> = {
  Wood: "bg-emerald-500",
  Fire: "bg-rose-500",
  Earth: "bg-amber-500",
  Metal: "bg-slate-400",
  Water: "bg-sky-500",
};

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
    title: "Emotional (Pulse Point Protocol)",
    steps: [
      "ESR Check — Hold frontal lobe (GB14) ESR points. Test indicator muscle — should weaken with stressor.",
      "Permission — Ask 'Do we have permission to correct this?' If denied, do Harmonic Rocking first.",
      "Timeline — Determine if the stress is Current or Historic. If historic, narrow to specific age/month.",
      "Primary Emotion — Identify the core feeling: Hurt (Fire), Worry (Earth), Sadness (Metal), Fear (Water), Anger (Wood).",
      "Priority Organ — Find the organ surrogate via pulse point. Match its element to the emotion, then choose the specific organ: the Yin organ (deep) or the Yang organ (superficial).",
      "Energy Polarity — Challenge for Energy IN (+) or Energy OUT (−). Usually OUT to release.",
      "Eye Position — Identify NLP sensory access (visual/auditory/kinesthetic) for the stress memory.",
      "Correction — Hold ESR + Pulse Point + Eye Position simultaneously. Replay stress until therapeutic shift (yawn, sigh, swallow, gurgle, deep breath).",
      "Upload — Once shift occurs, upload a positive/neutral state over the same access point.",
      "Re-test — Re-challenge ESR points and original stimulus. Muscle should now lock.",
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

const lbAE = [
  { step: "A", label: "Feel the belief in your body", prompt: "What do you notice? Where is it? What sensation?" },
  { step: "B", label: "Follow the sensation deeper", prompt: "What do you notice now? Is it changing, moving, shifting?" },
  { step: "C", label: "Identify the desired state", prompt: "What would you rather feel instead?" },
  { step: "D", label: "Embody the alternative", prompt: "Feel that new state. What do you notice in the body?" },
  { step: "E", label: "Deepen the new feeling", prompt: "Let that feeling expand. What do you notice?" },
];

const lbCheckpoints = [
  { id: "F", question: "Does the original belief still feel true?", noAdvance: "Advance to G" },
  { id: "G", question: "Do you see yourself believing this in the future?", noAdvance: "Advance to H" },
  { id: "H", question: "Is there any scenario where this belief might still feel true?", noAdvance: "Session complete — belief resolved" },
];

/** A reference diagram that opens full-screen — the dock is too narrow to read them. */
const ReferenceImage = ({
  src,
  alt,
  onOpen,
}: {
  src: string;
  alt: string;
  onOpen: (src: string) => void;
}) => (
  <button type="button" onClick={() => onOpen(src)} className="group relative block w-full">
    <img src={src} alt={alt} loading="lazy" className="block w-full" />
    <span className="absolute right-1.5 top-1.5 flex items-center gap-1 rounded-md bg-background/90 px-1.5 py-1 text-[9px] font-semibold text-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
      <Maximize2 size={10} /> Enlarge
    </span>
  </button>
);

interface CorrectionsManualContentProps {
  /** Deep-link request from the correction dock / finding rows. */
  target?: CorrectionTarget | null;
  /** Where the list was pointing last time — highlighted, but not opened. */
  initialSelection?: CorrectionSelection | null;
  /** Reports the current tab+item so hosts can remember it. */
  onSelectionChange?: (tab: CorrectionTab, item: string) => void;
  /** Compact mode: tells the host when instructions are showing (so it can widen). */
  onExpandedChange?: (open: boolean) => void;
  /** Per-process logs from the appointment. Omit for a reference-only manual. */
  protocolLogs?: Record<string, ProtocolLog>;
  onProtocolLogChange?: (processId: string, patch: ProtocolLogPatch) => void;
  /** Narrow container (the dock): chips instead of the 192px sidebar. */
  compact?: boolean;
  /** Fill the parent's height instead of sizing to content. */
  fill?: boolean;
  /** Report depth changes to parent (for dock breadcrumb/navigation). */
  onDepthChange?: (depth: number) => void;
  /** Signal from parent to step back one level. */
  backSignal?: number;
}

const CorrectionsManualContent = ({
  target,
  initialSelection,
  onSelectionChange,
  onExpandedChange,
  protocolLogs,
  onProtocolLogChange,
  compact = false,
  fill = false,
  onDepthChange,
  backSignal,
}: CorrectionsManualContentProps = {}) => {
  const [activeTab, setActiveTab] = useState<string>(() => initialSelection?.tab ?? "afferent");
  const [afferentActive, setAfferentActive] = useState(
    () => (initialSelection?.tab === "afferent" ? initialSelection.item : "mechanoreceptor")
  );
  const [efferentActive, setEfferentActive] = useState(
    () =>
      initialSelection?.tab === "efferent"
        ? normalizeItemId(initialSelection.item)
        : "cortical"
  );
  // Compact mode starts on the list alone; tapping a process slides its
  // instructions in beside it.
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [modalPoint, setModalPoint] = useState<BrainReflexPoint | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  /** Heart Wall is one page — a deep link scrolls to its section. */
  const [hwFocus, setHwFocus] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  // Report depth to parent for dock navigation (0 = list, 1 = viewing instructions)
  useEffect(() => {
    if (compact) {
      onDepthChange?.(instructionsOpen ? 1 : 0);
    }
  }, [compact, instructionsOpen, onDepthChange]);

  // Handle back signal from dock (Esc/Backspace)
  const [lastBackSignal, setLastBackSignal] = useState(backSignal);
  useEffect(() => {
    if (!compact || backSignal === undefined || backSignal === lastBackSignal) return;
    setLastBackSignal(backSignal);
    if (instructionsOpen) {
      setInstructionsOpen(false);
    }
  }, [backSignal, lastBackSignal, compact, instructionsOpen]);
  
  // Stop scroll events from bubbling up to parent elements
  useEffect(() => {
    const stopPropagation = (e: Event) => e.stopPropagation();
    const captureWheel = (e: WheelEvent) => {
      if ((e.target as HTMLElement).closest('.scroll-isolated')) {
        e.stopPropagation();
      }
    }
    const captureTouch = (e: TouchEvent) => {
      if ((e.target as HTMLElement).closest('.scroll-isolated')) {
        e.stopPropagation();
      }
    }
    
    document.addEventListener('wheel', captureWheel, { passive: true });
    document.addEventListener('touchstart', captureTouch, { passive: true });
    document.addEventListener('touchmove', captureTouch, { passive: true });
    
    return () => {
      document.removeEventListener('wheel', captureWheel);
      document.removeEventListener('touchstart', captureTouch);
      document.removeEventListener('touchmove', captureTouch);
    };
  }, []);

  const activeId = activeTab === "afferent" ? afferentActive : efferentActive;

  // Accent follows the active item so Heart Wall stays rose and Limiting
  // Beliefs stays red, even though both now sit under the Efferent tab.
  const efferentAccent = efferentActive === "hw"
    ? "text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800"
    : efferentActive === "lb-process"
    ? "text-destructive bg-destructive/10 border-destructive/20"
    : "text-purple-600 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800";

  const tabAccent = activeTab === "afferent"
    ? "text-primary dark:text-blue-300 bg-primary/5 dark:bg-primary/50 border-primary/20 dark:border-blue-800"
    : efferentAccent;

  // Apply a deep-link request (finding row, dock shortcut, keyboard).
  useEffect(() => {
    if (!target) return;
    setActiveTab(target.tab);
    if (target.tab === "afferent") {
      setAfferentActive(target.item);
    } else if (target.item.startsWith("hw-")) {
      setEfferentActive("hw");
      setHwFocus(target.item);
    } else {
      setEfferentActive(target.item);
    }
    setInstructionsOpen(true);
  }, [target]);

  // Keyboard navigation: 1-9 jump directly to root-level processes
  // (one-handed while the client is on the table). Context-aware: always
  // opens instructions on the selected process; if already showing it,
  // toggles back to the list.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key;
      if (key >= "1" && key <= "9") {
        e.preventDefault();
        const index = parseInt(key, 10) - 1;
        const items = getItems();
        if (index < items.length) {
          const item = items[index];
          const alreadyActive = item.id === activeId && instructionsOpen;
          setActiveId(item.id);
          setInstructionsOpen(alreadyActive ? false : true);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeTab, activeId, instructionsOpen]);

  // Scroll the requested Heart Wall section into view once it's rendered.
  useEffect(() => {
    if (!hwFocus || efferentActive !== "hw") return;
    const el = document.getElementById(`hw-section-${hwFocus}`);
    el?.scrollIntoView({ block: "start", behavior: "smooth" });
    setHwFocus(null);
  }, [hwFocus, efferentActive]);

  // Tell the host what's showing so it can be remembered next time.
  useEffect(() => {
    onSelectionChange?.(activeTab as CorrectionTab, activeId);
  }, [activeTab, activeId, onSelectionChange]);

  // Compact hosts widen the dock while instructions are on screen.
  useEffect(() => {
    onExpandedChange?.(compact ? instructionsOpen : true);
  }, [compact, instructionsOpen, onExpandedChange]);

  const filteredBrainZones = (points: BrainReflexPoint[]) => {
    if (!searchQuery) return points;
    const q = searchQuery.toLowerCase();
    return points.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.location.toLowerCase().includes(q) ||
      p.functions?.some(f => f.toLowerCase().includes(q))
    );
  };

  const renderSteps = (steps: string[], accent: string, processId?: string) => {
    const done = (processId && protocolLogs?.[processId]?.steps) || [];
    const canTick = !!(processId && onProtocolLogChange);

    const toggle = (index: number) => {
      if (!processId || !onProtocolLogChange) return;
      onProtocolLogChange(processId, (previous) => {
        const steps = previous.steps ?? [];
        return {
          steps: steps.includes(index)
            ? steps.filter((i) => i !== index)
            : [...steps, index].sort((a, b) => a - b),
        };
      });
    };

    const stepColor = accent === "text-primary"
      ? { done: "bg-emerald-500 text-white", pending: "bg-primary/10 dark:bg-primary/50 text-primary dark:text-blue-300" }
      : accent === "text-purple-600"
        ? { done: "bg-emerald-500 text-white", pending: "bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300" }
        : accent === "text-rose-600"
          ? { done: "bg-emerald-500 text-white", pending: "bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300" }
          : { done: "bg-emerald-500 text-white", pending: "bg-destructive/10 text-destructive" };

    return (
      <div className="space-y-1">
        {steps.map((step, i) => {
          const isDone = done.includes(i);
          return (
            <div
              key={step}
              className={cn(
                "flex gap-2.5 px-3 py-2.5 rounded-lg transition-colors",
                isDone ? "bg-emerald-50/40 dark:bg-emerald-950/15" : "hover:bg-muted/30"
              )}
            >
              <button
                type="button"
                onClick={() => toggle(i)}
                disabled={!canTick}
                title={canTick ? (isDone ? "Mark as not done" : "Mark as done") : undefined}
                className={cn(
                  "shrink-0 flex h-6 w-6 items-center justify-center rounded-md text-[9.5px] font-semibold transition-colors",
                  canTick && "cursor-pointer",
                  isDone ? stepColor.done : stepColor.pending
                )}
              >
                {isDone ? <Check size={10} strokeWidth={3} /> : i + 1}
              </button>
              <div className="min-w-0 flex-1 space-y-0.5">
                <span
                  className={cn(
                    "block text-[11px] leading-relaxed",
                    isDone ? "text-muted-foreground/80" : "text-foreground/95"
                  )}
                >
                  {step}
                </span>
                {processId && inlineLog(processId, i + 1)}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const StepProgress = ({ processId, total }: { processId: string; total: number }) => {
    const done = protocolLogs?.[processId]?.steps?.length ?? 0;
    if (!onProtocolLogChange || done === 0) return null;
    return (
      <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
        {done}/{total}
      </span>
    );
  };

  const logSheet = (processId: string, heading?: string) => (
    <ProtocolLogSheet
      processId={processId}
      fields={PROTOCOL_FIELDS[processId] ?? []}
      log={protocolLogs?.[processId]}
      onChange={
        onProtocolLogChange
          ? (patch) => onProtocolLogChange(processId, patch)
          : undefined
      }
      heading={heading}
    />
  );

  /** The controls for one instruction step, rendered under that step. */
  const inlineLog = (processId: string, step: number) => (
    <ProtocolLogSheet
      processId={processId}
      fields={PROTOCOL_FIELDS[processId] ?? []}
      log={protocolLogs?.[processId]}
      onChange={
        onProtocolLogChange
          ? (patch) => onProtocolLogChange(processId, patch)
          : undefined
      }
      step={step}
      variant="inline"
    />
  );

  /** Anything that belongs to the process but not to a single step (notes). */
  const trailingFields = (processId: string) => {
    const fields = PROTOCOL_FIELDS[processId] ?? [];
    const mapped = PROTOCOL_STEP_MAP[processId] ?? {};
    if (!onProtocolLogChange || !fields.some((f) => mapped[f.id] == null)) return null;

    return (
      <div className="mt-3 border-t border-border/50 pt-3">
        <ProtocolLogSheet
          processId={processId}
          fields={fields}
          log={protocolLogs?.[processId]}
          onChange={(patch) => onProtocolLogChange(processId, patch)}
          unassigned
          variant="inline"
        />
      </div>
    );
  };

  /** Summary + reset, pinned above the steps rather than in a log card. */
  const logBar = (processId: string, heading?: string) => {
    if (!hasStepFields(processId) || !onProtocolLogChange) return null;
    return (
      <ProtocolLogBar
        processId={processId}
        heading={heading}
        log={protocolLogs?.[processId]}
        onChange={(patch) => onProtocolLogChange(processId, patch)}
      />
    );
  };

  // The visual aids are part of the record, not just decoration: tapping an
  // eye cue or an organ writes it back to the emotional log.
  const emotionalValues = protocolLogs?.emotional?.values ?? {};
  const pickedOrgan = typeof emotionalValues.organ === "string" ? emotionalValues.organ : undefined;
  const pickedEye = typeof emotionalValues.eye === "string" ? emotionalValues.eye : undefined;
  const canLogEmotional = !!onProtocolLogChange;

  const pickEmotional = (patch: Record<string, unknown>) => {
    if (!onProtocolLogChange) return;
    onProtocolLogChange("emotional", (previous) => ({
      values: { ...(previous.values ?? {}), ...patch },
    }));
  };

  const BrainZoneList = ({ points, label, accent }: {
    points: BrainReflexPoint[]; label: string; accent: string;
  }) => {
    const filtered = filteredBrainZones(points);
    return (
      <div>
        <h4 className={cn("text-[9.5px] font-semibold uppercase tracking-wider mb-2", accent)}>{label}</h4>
        <div className="flex flex-wrap gap-1">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => setModalPoint(p)}
              className="text-[10px] px-2 py-0.5 rounded hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground border border-border/50 bg-card/50"
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
            <div className="flex items-center gap-2">
              <h2 className="text-base font-medium tracking-tight">{content.title}</h2>
              <StepProgress processId={afferentActive} total={content.steps.length} />
            </div>
            {logBar(afferentActive)}
            {renderSteps(content.steps, "text-primary", afferentActive)}
            {trailingFields(afferentActive)}
          </div>
        );
      }
      case "efferent": {
        if (efferentActive === "hw") return renderHeartWall();
        if (efferentActive === "lb-process") return renderLimitingBeliefs();

        const content = efferentContent[efferentActive];
        if (!content) return null;
        const isEmotional = efferentActive === "emotional";
        const isBrainZone = efferentActive === "cortical" || efferentActive === "subcortical";
        return (
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-medium tracking-tight">{content.title}</h2>
                <StepProgress processId={efferentActive} total={content.steps.length} />
              </div>
              {logBar(efferentActive)}
              {renderSteps(content.steps, "text-purple-600", efferentActive)}
              {trailingFields(efferentActive)}
            </div>

            {isBrainZone && (
              <div className="border-t border-border pt-4">
                <BrainZoneList
                  points={efferentActive === "cortical" ? corticalPoints : subcorticalPoints}
                  label={efferentActive === "cortical" ? "Cortical zones" : "Subcortical zones"}
                  accent="text-purple-600 dark:text-purple-400"
                />
              </div>
            )}
            {isEmotional && (
              <div className="space-y-4">
                {/* NLP Eye Position Reference */}
                <div className="panel p-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-3">NLP Eye Accessing Cues</h3>
                  <div className="mb-3 overflow-hidden rounded-lg border border-border bg-white">
                    <ReferenceImage
                      src="/images/eye-modes.png"
                      alt="NLP eye accessing cues — six eye positions and what they access"
                      onOpen={setLightbox}
                    />
                  </div>
                  <div className="space-y-1">
                    {EYE_POSITIONS.map((row) => {
                      const active = pickedEye === row.label;
                      return (
                        <button
                          key={row.label}
                          type="button"
                          disabled={!canLogEmotional}
                          aria-pressed={active}
                          onClick={() => pickEmotional({ eye: active ? null : row.label })}
                          className={cn(
                            "flex w-full items-start gap-2 rounded-md px-2 py-1 text-left text-[10px] transition-colors",
                            active
                              ? "bg-purple-50 text-purple-900 ring-1 ring-purple-200 dark:bg-purple-950/40 dark:text-purple-200 dark:ring-purple-800"
                              : canLogEmotional && "hover:bg-muted/50"
                          )}
                        >
                          <span className="flex w-[70px] shrink-0 items-center gap-1 font-bold text-foreground">
                            {active && <Check size={10} strokeWidth={3} className="text-purple-600" />}
                            {row.full}
                          </span>
                          <span className="w-24 shrink-0 font-semibold text-foreground/80">{row.cue}</span>
                          <span className="text-muted-foreground">{row.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                  {canLogEmotional && (
                    <p className="mt-2 text-[9px] italic text-muted-foreground">
                      Tap a cue to log the eye position.
                    </p>
                  )}
                </div>

                {/* Organ Pulse Point Reference */}
                <div className="panel p-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-3">Organ Pulse Points</h3>
                  <div className="mb-3 overflow-hidden rounded-lg border border-border bg-white">
                    <ReferenceImage
                      src="/images/pulse-points.png"
                      alt="Pulse point positions on the wrist — cun, guan and chi on left and right"
                      onOpen={setLightbox}
                    />
                  </div>
                  <div className="space-y-1.5">
                    {Object.entries(EMOTION_ORGANS).map(([emotion, organs]) => {
                      const first = organs[0];
                      return (
                        <div
                          key={emotion}
                          className="rounded-lg border border-border/70 bg-card px-2.5 py-1.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-foreground">
                              <span className={cn("h-1.5 w-1.5 rounded-full", ELEMENT_DOT[first.element])} />
                              {emotion}
                              <span className="font-medium text-muted-foreground">{first.element}</span>
                            </span>
                            <span className="text-[9px] font-semibold text-muted-foreground">
                              {first.pulse}
                            </span>
                          </div>
                          <div className="mt-1 grid grid-cols-2 gap-1.5">
                            {organs.map((organ) => {
                              const active = pickedOrgan === organ.name;
                              return (
                                <button
                                  key={organ.id}
                                  type="button"
                                  disabled={!canLogEmotional}
                                  aria-pressed={active}
                                  onClick={() =>
                                    pickEmotional(
                                      active ? { organ: null } : { emotion, organ: organ.name }
                                    )
                                  }
                                  className={cn(
                                    "rounded-md px-1.5 py-1 text-left transition-colors",
                                    active
                                      ? "bg-emerald-50 ring-1 ring-emerald-300 dark:bg-emerald-950/40 dark:ring-emerald-800"
                                      : canLogEmotional && "hover:bg-muted/50"
                                  )}
                                >
                                  <p className="flex items-center gap-1 text-[10px] font-semibold text-foreground/90">
                                    {active && <Check size={9} strokeWidth={3} className="text-emerald-600" />}
                                    {organ.name}
                                  </p>
                                  <p className="text-[9px] text-muted-foreground">{organ.depth}</p>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {canLogEmotional && (
                    <p className="mt-2 text-[9px] italic text-muted-foreground">
                      Tap an organ to set it — and its emotion — on the record.
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-3 italic leading-relaxed">
                    Light pressure = Yang (superficial pulse). Deep pressure = Yin (deep pulse). Hold until therapeutic shift.
                  </p>
                </div>
              </div>
            )}
          </div>
        );
      }
      default:
        return null;
    }
  };

  /** All five Heart Wall stages on one scrolling page. */
  const renderHeartWall = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h2 className="text-base font-medium tracking-tight">Heart Wall</h2>
        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[8px] font-bold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
          Screen → Assess → Correct → Recheck
        </span>
      </div>

      {(["hw-screen", "hw-assessment", "hw-correction", "hw-recheck", "hw-hidden"] as const).map(
        (sectionId, index) => {
          const section = heartWallContent[sectionId];
          if (!section) return null;
          return (
            <section
              key={sectionId}
              id={`hw-section-${sectionId}`}
              className="scroll-mt-2 space-y-2 border-t border-border/50 pt-4 first:border-t-0 first:pt-0"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded text-[9px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                  {index + 1}
                </span>
                <h3 className="text-sm font-medium tracking-tight">{section.title}</h3>
                <StepProgress processId={sectionId} total={section.steps.length} />
              </div>
              {logBar(sectionId, section.title)}
              {renderSteps(section.steps, "text-rose-600", sectionId)}
              {trailingFields(sectionId)}
            </section>
          );
        }
      )}
    </div>
  );

  const renderLimitingBeliefs = () => {
    const lbLog = protocolLogs?.[activeId]?.values ?? {};
    const saveLB = (patch: Record<string, unknown>) => {
      onProtocolLogChange?.("lb-process", (previous) => ({
        values: { ...(previous.values ?? {}), ...patch },
      }));
    };

    const belief = (lbLog.belief ?? "") as string;
    const aeFilled = lbAE.filter((item) => (lbLog[item.step.toLowerCase()] ?? "").trim().length > 0).length;
    const checkpointsAnswered = lbCheckpoints.filter((cp) => lbLog[cp.id.toLowerCase()]).length;
    const total = lbAE.length + lbCheckpoints.length + 1;

    const handleKeyDown = (e: React.KeyboardEvent, fieldId: string, value: string) => {
      if ((e.key === "y" || e.key === "Y") && value !== "Yes") {
        e.preventDefault();
        saveLB({ [fieldId]: "Yes" });
      } else if ((e.key === "n" || e.key === "N") && value !== "No") {
        e.preventDefault();
        saveLB({ [fieldId]: "No" });
      }
    };

    return (
      <div className={cn("space-y-4", compact && "space-y-3")}>
        {/* Belief header — prominent input for the core belief */}
        <div className="border border-border/60 rounded-lg bg-card/50 p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="flex items-center justify-center w-4 h-4 rounded text-[9px] font-bold bg-primary/10 text-primary shrink-0">B</span>
            <p className="text-[11px] font-medium text-foreground">Limiting Belief</p>
          </div>
          <input
            value={belief}
            onChange={(e) => saveLB({ belief: e.target.value })}
            placeholder="e.g. I am not safe"
            className="w-full border-none bg-transparent text-sm font-medium text-foreground focus:ring-0 placeholder:text-muted-foreground/50"
          />
        </div>

        {/* Progress bar */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">Progress</span>
            <span className="text-[9px] font-medium text-foreground">
              {Math.round(((aeFilled + checkpointsAnswered + (belief ? 1 : 0)) / total) * 100)}%
            </span>
          </div>
          <div className="w-full h-1 rounded-full bg-muted/30 overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${Math.round(((aeFilled + checkpointsAnswered + (belief ? 1 : 0)) / total) * 100)}%` }}
            />
          </div>
        </div>

        {/* A-E Core Cycle — editable inline */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-base font-medium tracking-tight">A-E Core Cycle</h2>
            <span className="flex items-center justify-center w-4 h-4 rounded-full bg-muted/50 text-muted-foreground text-[8px] font-bold">
              {aeFilled}/{lbAE.length}
            </span>
          </div>
          <div className="space-y-1 relative">
            {/* Vertical connection line */}
            {lbAE.length > 1 && (
              <div className="absolute left-2.5 top-0 bottom-[2px] w-[1px] bg-border/30" />
            )}
            {lbAE.map((item, i) => {
              const fieldId = item.step.toLowerCase();
              const currentValue = (lbLog[fieldId] ?? "") as string;
              const isFilled = currentValue.trim().length > 0;
              return (
                <div key={item.step} className="space-y-1">
                  <div
                    className={cn(
                      "flex gap-2.5 px-3 py-2.5 rounded-lg border transition-colors focus-within:border-primary/30 focus-within:ring-1 focus-within:ring-primary/10",
                      isFilled
                        ? "border-primary/20 bg-primary/5 hover:border-primary/30"
                        : "border-border/60 bg-card/50 hover:border-foreground/10",
                    )}
                  >
                    <span
                      className={cn(
                        "flex items-center justify-center w-5 h-5 rounded-md text-[10px] font-bold shrink-0 mt-0.5",
                        isFilled
                          ? "bg-emerald/10 text-emerald-strong"
                          : "bg-destructive/10 text-destructive-strong",
                      )}
                    >
                      {item.step}
                    </span>
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-[11px] font-medium text-foreground">{item.label}</p>
                      <p className="text-[10px] text-muted-foreground/80 italic">{item.prompt}</p>
                    </div>
                    <div className="ml-auto min-w-0">
                      <textarea
                        value={currentValue}
                        onChange={(e) => saveLB({ [fieldId]: e.target.value })}
                        placeholder="Type your notes here…"
                        rows={2}
                        className={cn(
                          "w-full min-w-0 resize-none rounded-md border border-transparent bg-transparent px-2 py-1 text-[10.5px] text-foreground focus:outline-none focus:border-primary/30 focus:bg-muted/20 transition-all",
                          isFilled && "placeholder:text-transparent",
                        )}
                      />
                    </div>
                  </div>
                  {i < lbAE.length - 1 && (
                    <div className="flex justify-center py-0.5">
                      <div className="w-px h-2 bg-border/30" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Divider with arrow */}
        <div className="relative my-3">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-dashed border-border/40" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-background px-3 text-[9px] font-medium text-muted-foreground/70 uppercase tracking-wider">Then Check</span>
          </div>
        </div>

        {/* F/G/H Checkpoints — interactive Yes/No */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-base font-medium tracking-tight">Decision Checkpoints</h2>
            <span className="flex items-center justify-center w-4 h-4 rounded-full bg-muted/50 text-muted-foreground text-[8px] font-bold">
              {checkpointsAnswered}/{lbCheckpoints.length}
            </span>
          </div>
          <div className="space-y-2">
            {lbCheckpoints.map((cp, i) => {
              const fieldId = cp.id.toLowerCase();
              const currentValue = (lbLog[fieldId] ?? "") as string;
              const isYes = currentValue === "Yes";
              const isNo = currentValue === "No";
              const answered = isYes || isNo;
              return (
                <div key={cp.id} className="space-y-1.5">
                  <div
                    className={cn(
                      "p-3 border rounded-lg transition-colors",
                      answered
                        ? (isYes ? "bg-rose-50/50 dark:bg-rose-950/15 border-rose-200/40" : "bg-emerald-50/50 dark:bg-emerald-950/15 border-emerald-200/40")
                        : "bg-destructive/5 border-destructive/15",
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <span
                        className={cn(
                          "flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold shrink-0 mt-0.5",
                          answered
                            ? (isYes ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300")
                            : "bg-destructive/10 text-destructive-strong border border-destructive/20",
                        )}
                      >
                        {cp.id}
                      </span>
                      <div className="space-y-2 flex-1">
                        <p className="text-sm font-medium text-foreground">{cp.question}</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div
                            onClick={() => saveLB({ [fieldId]: "Yes" })}
                            onKeyDown={(e) => handleKeyDown(e, fieldId, currentValue)}
                            tabIndex={0}
                            role="button"
                            aria-pressed={isYes}
                            aria-label={`${cp.question} — Yes`}
                            className={cn(
                              "p-2 rounded-lg border cursor-pointer transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                              isYes
                                ? "bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/50 shadow-sm"
                                : "bg-card border-transparent hover:border-rose-200/40 hover:bg-rose-50/30",
                            )}
                          >
                            <div className="flex items-center gap-1 mb-0.5">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Yes</span>
                              <ArrowRightCircle size={11} className="text-rose-500" />
                            </div>
                            <p className="text-[9px] text-rose-700 dark:text-rose-300 leading-relaxed">
                              Restart A-E cycle {i === 2 ? "(stay on H)" : "(skip to next)"}
                            </p>
                          </div>
                          <div
                            onClick={() => saveLB({ [fieldId]: "No" })}
                            onKeyDown={(e) => handleKeyDown(e, fieldId, currentValue)}
                            tabIndex={0}
                            role="button"
                            aria-pressed={isNo}
                            aria-label={`${cp.question} — No`}
                            className={cn(
                              "p-2 rounded-lg border cursor-pointer transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                              isNo
                                ? "bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 shadow-sm"
                                : "bg-card border-transparent hover:border-emerald-200/40 hover:bg-emerald-50/30",
                            )}
                          >
                            <div className="flex items-center gap-1 mb-0.5">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">No</span>
                              <ArrowRightCircle size={11} className="text-emerald-500" />
                            </div>
                            <p className="text-[10px] text-emerald-800 dark:text-emerald-200 leading-relaxed">{cp.noAdvance}</p>
                          </div>
                        </div>
                        {answered && (
                          <p className="mt-1.5 text-[9px] font-medium text-muted-foreground/70 italic">
                            Marked: {currentValue}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  {i < lbCheckpoints.length - 1 && (
                    <div className="flex justify-center py-0.5">
                      <ArrowDown size={10} className="text-muted-foreground/30" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const getActiveId = () => activeId;

  const setActiveId = (id: string) => {
    if (activeTab === "afferent") setAfferentActive(id);
    else setEfferentActive(id);
  };

  const getItems = (): SidebarItem[] => (activeTab === "afferent" ? AFFERENT_ITEMS : EFFERENT_ITEMS);

  const getSearchPlaceholder = () => {
    if (activeTab === "efferent" && (efferentActive === "cortical" || efferentActive === "subcortical")) {
      return "Search brain zones...";
    }
    return undefined;
  };

  const handlePrint = () => window.print();

  return (
    <div className={cn("flex flex-col", fill && "h-full min-h-0")}>

      <div className="border-b shrink-0">
        <div className={cn("flex items-center justify-between gap-3", compact ? "px-3 py-1.5" : "px-4 py-2")}>
          <div className="flex min-w-0 items-center gap-1.5">
            {compact && instructionsOpen && (
              <button
                type="button"
                onClick={() => setInstructionsOpen(false)}
                title="Back to the process list"
                aria-label="Back to the process list"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
              >
                <ChevronLeft size={14} />
              </button>
            )}
            <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); if (compact) setInstructionsOpen(false); }}>
              <TabsList className={cn("bg-muted/50", compact ? "h-7" : "h-8")}>
                <TabsTrigger value="afferent" className={cn(compact ? "h-6 text-[10.5px] px-2" : "h-7 text-[11px] px-2.5")}>
                  <ArrowDownCircle size={11} className="mr-1" /> Afferent
                </TabsTrigger>
                <TabsTrigger value="efferent" className={cn(compact ? "h-6 text-[10.5px] px-2" : "h-7 text-[11px] px-2.5")}>
                  <ArrowUpCircle size={11} className="mr-1" /> Efferent
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex items-center gap-2">
            {getSearchPlaceholder() && (
              <div className={cn("relative", compact ? "w-28" : "w-48")}>
                <Search size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={getSearchPlaceholder()}
                  className={cn("pl-6 rounded-lg", compact ? "h-6 text-[10px]" : "h-7 pl-7 text-[11px]")}
                />
              </div>
            )}
            {!compact && (
              <button
                onClick={handlePrint}
                className="h-7 px-2.5 rounded-lg text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors flex items-center gap-1.5"
              >
                <Printer size={11} /> Print
              </button>
            )}
            {compact && !instructionsOpen && (
              <span className="text-[9px] font-medium text-muted-foreground/50 uppercase tracking-wider">
                Keys 1–9
              </span>
            )}
          </div>
        </div>
      </div>

      {compact ? (
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* The list never moves: full width until a process is tapped, then a
              left column while its instructions slide in beside it. */}
          <div
            className={cn(
              "min-h-0 overflow-y-auto px-2.5 py-2 space-y-2 transition-all duration-200 scroll-isolated",
              instructionsOpen ? "w-[184px] shrink-0 border-r border-border" : "flex-1"
            )}
          >
            {(() => {
              const items = getItems();
              const groups = items.reduce<{ group?: string; items: typeof items }[]>((acc, item) => {
                const last = acc[acc.length - 1];
                if (last && last.group === item.group) last.items.push(item);
                else acc.push({ group: item.group, items: [item] });
                return acc;
              }, []);
              // Compute global index for keyboard shortcut display
              let globalIdx = 0;
              return groups.map((g, gi) => (
                <div key={g.group ?? gi} className="space-y-1">
                  {g.group && (
                    <p className="px-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground/40">{g.group}</p>
                  )}
                  <div className={cn("gap-0.5", instructionsOpen ? "flex flex-col" : "flex flex-wrap")}>
                    {g.items.map((item) => {
                      const num = globalIdx + 1;
                      globalIdx++;
                      return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveId(item.id);
                          setInstructionsOpen(true);
                        }}
                        className={cn(
                          "group relative px-2 py-1.5 rounded-lg border text-[10.5px] font-medium transition-all",
                          instructionsOpen && "w-full text-left",
                          item.id === activeId
                            ? cn(tabAccent, "shadow-sm")
                            : "border-transparent bg-card/60 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                      >
                        <span className="flex items-center gap-1.5">
                          <span className={cn(
                            "flex h-4 w-4 shrink-0 items-center justify-center rounded-md text-[8px] font-bold transition-colors",
                            item.id === activeId ? "bg-current/10" : "bg-muted/70 text-muted-foreground/70"
                          )}>
                            {num}
                          </span>
                          <span className="truncate">{item.label}</span>
                        </span>
                      </button>
                      );
                    })}
                  </div>
                </div>
              ));
            })()}
          </div>

          {instructionsOpen && (
            <div
              key={`${activeTab}:${activeId}`}
              className="flex min-w-0 flex-1 flex-col animate-in fade-in slide-in-from-right-2 duration-150"
            >
              {/* No pane header here — the process title inside the page is the
                  only heading, so the name isn't printed twice. */}
              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 scroll-isolated" onWheel={(e) => e.stopPropagation()} onTouchMove={(e) => e.stopPropagation()}>
            </div>
          </div>
        )}
        </div>
      ) : (
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <CorrectionsSidebar items={getItems()} activeId={getActiveId()} setActiveId={setActiveId} tabAccent={tabAccent} />
          <div className="min-w-0 flex-1 max-w-3xl px-6 py-6 overflow-y-auto scroll-isolated" onWheel={(e) => e.stopPropagation()} onTouchMove={(e) => e.stopPropagation()}>
            {getContent()}
          </div>
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-background/95 p-4 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-label="Reference image"
        >
          <img
            src={lightbox}
            alt=""
            className="max-h-full max-w-full rounded-xl border border-border bg-white object-contain shadow-2xl"
          />
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute right-4 top-4 rounded-lg border border-border bg-card px-2.5 py-1.5 text-[11px] font-medium text-foreground shadow-sm"
          >
            Close
          </button>
        </div>
      )}

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
