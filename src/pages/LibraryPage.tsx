import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap, Trophy, BookOpen, Shield, Wind, Workflow, Dumbbell, Baby, Zap,
  Brain, ImageIcon, Youtube, Clock, RefreshCw, Layers, Target, Lightbulb,
  Heart, Calculator, Move, Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import UnifiedEditor, { type UnifiedEditorSection } from "@/components/crm/UnifiedEditor";

import MechanoMasteryModule from "@/components/crm/MechanoMasteryModule";
import MechanoBible from "@/components/crm/MechanoBible";
import HeartWallBible from "@/components/crm/HeartWallBible";
import TraumaClearingProtocol from "@/components/crm/TraumaClearingProtocol";
import FnTheory from "@/components/crm/FnTheory";
import MuscleReference from "@/components/crm/MuscleReference";
import PrimitiveReflexReference from "@/components/crm/PrimitiveReflexReference";
import CranialNerveReference from "@/components/crm/CranialNerveReference";
import BrainReflexReference from "@/components/crm/BrainReflexReference";
import LigamentReference from "@/components/crm/LigamentReference";
import ClinicalCheatSheet from "@/components/crm/ClinicalCheatSheet";
import VideoLibrary from "@/components/crm/VideoLibrary";
import MeridianClock from "@/components/crm/MeridianClock";
import FiveElementCycle from "@/components/crm/FiveElementCycle";
import BaGuaReference from "@/components/crm/BaGuaReference";
import TcmChannelReference from "@/components/crm/TcmChannelReference";
import AcupointReference from "@/components/crm/AcupointReference";
import EmotionsProtocolReference from "@/components/crm/EmotionsProtocolReference";
import CranialNerveHomeworkTool from "@/components/crm/CranialNerveHomeworkTool";
import BrainstemBreathingReference from "@/components/crm/BrainstemBreathingReference";
import SpinalSegmentReference from "@/components/crm/SpinalSegmentReference";

const REF_COMPONENTS: Record<string, () => ReactNode> = {
  "mechano-academy": () => <MechanoMasteryModule />,
  bible: () => <MechanoBible />,
  "heart-wall-bible": () => <HeartWallBible />,
  "trauma-clearing": () => <TraumaClearingProtocol />,
  theory: () => <FnTheory />,
  muscles: () => <MuscleReference />,
  primitive: () => <PrimitiveReflexReference />,
  cranial: () => <CranialNerveReference />,
  brain: () => <BrainReflexReference />,
  ligaments: () => <LigamentReference />,
  cheatsheet: () => <ClinicalCheatSheet />,
  video: () => <VideoLibrary />,
  clock: () => <MeridianClock />,
  elements: () => <FiveElementCycle />,
  bagua: () => <BaGuaReference />,
  channels: () => <TcmChannelReference />,
  acupoints: () => <AcupointReference />,
  "emotional-theory": () => <EmotionsProtocolReference />,
  "rehab-calc": () => <CranialNerveHomeworkTool />,
  "brainstem-breath": () => <BrainstemBreathingReference />,
  logic: () => <FnTheory />,
  spinal: () => <SpinalSegmentReference />,
  postural: () => <FnTheory />,
};

interface RawItem { id: string; label: string; icon: React.ElementType; group: string }

const TREE: RawItem[] = [
  { id: "mechano-academy", label: "Mechano Academy", icon: GraduationCap, group: "Foundations" },
  { id: "bible", label: "Mechano Bible", icon: Trophy, group: "Foundations" },
  { id: "heart-wall-bible", label: "Heart Wall Bible", icon: Shield, group: "Foundations" },
  { id: "trauma-clearing", label: "Trauma Clearing", icon: Wind, group: "Foundations" },
  { id: "theory", label: "FN Theory", icon: Workflow, group: "Foundations" },
  { id: "muscles", label: "Muscle Reference", icon: Dumbbell, group: "Clinical Reference" },
  { id: "primitive", label: "Primitive Reflexes", icon: Baby, group: "Clinical Reference" },
  { id: "cranial", label: "Cranial Nerves", icon: Zap, group: "Clinical Reference" },
  { id: "brain", label: "Brain Reflexes", icon: Brain, group: "Clinical Reference" },
  { id: "ligaments", label: "Ligaments", icon: ImageIcon, group: "Clinical Reference" },
  { id: "cheatsheet", label: "Cheat Sheets", icon: Zap, group: "Clinical Reference" },
  { id: "video", label: "Video Library", icon: Youtube, group: "Clinical Reference" },
  { id: "clock", label: "Meridian Clock", icon: Clock, group: "TCM & Meridians" },
  { id: "elements", label: "5 Elements", icon: RefreshCw, group: "TCM & Meridians" },
  { id: "bagua", label: "Ba Gua", icon: Zap, group: "TCM & Meridians" },
  { id: "channels", label: "Channels", icon: Layers, group: "TCM & Meridians" },
  { id: "acupoints", label: "Acupoints", icon: Target, group: "TCM & Meridians" },
  { id: "emotional-theory", label: "Emotional Theory", icon: Heart, group: "Practice Tools" },
  { id: "rehab-calc", label: "Rehab Calc", icon: Calculator, group: "Practice Tools" },
  { id: "brainstem-breath", label: "Brainstem Breath", icon: Wind, group: "Practice Tools" },
  { id: "logic", label: "Clinical Logic", icon: Lightbulb, group: "Practice Tools" },
  { id: "spinal", label: "Spinal", icon: Move, group: "Practice Tools" },
  { id: "postural", label: "Postural Reflexes", icon: RefreshCw, group: "Practice Tools" },
];

const VALID_IDS = new Set(TREE.map((t) => t.id));

const LibraryPage = () => {
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    const tab = new URLSearchParams(window.location.search).get("tab");
    if (tab === "worksheets") return "where-your-value-begins";
    return tab && VALID_IDS.has(tab) ? tab : null;
  });

  const sections = useMemo<UnifiedEditorSection[]>(
    () =>
      TREE.map((item) => ({
        id: item.id,
        label: item.label,
        icon: item.icon,
        group: item.group,
        render: REF_COMPONENTS[item.id] ?? (() => <p className="text-muted-foreground">Not available.</p>),
      })),
    []
  );

  const selected = sections.find((s) => s.id === selectedId) ?? null;

  return (
    <UnifiedEditor
      className="h-full"
      leftTitle="Library"
      rightHeader={
        selected ? (
          <div className="px-6 h-12 flex items-center gap-3">
            {selected.icon && <selected.icon size={16} className="text-chart-primary" />}
            <span className="text-sm font-bold text-foreground">{selected.label}</span>
          </div>
        ) : null
      }
      sections={sections}
      selectedId={selectedId}
      onSelect={setSelectedId}
      emptyState={
        <div className="h-full flex flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-chart-primary/10 flex items-center justify-center">
            <BookOpen size={28} className="text-chart-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Select a reference from the left</p>
            <p className="text-xs text-muted-foreground font-medium mt-1">
              Clinical references, worksheets, and practice tools.
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-xl text-xs gap-2">
            <Link to="/resources/print">
              <Printer size={14} /> Print Hub
            </Link>
          </Button>
        </div>
      }
    />
  );
};

export default LibraryPage;