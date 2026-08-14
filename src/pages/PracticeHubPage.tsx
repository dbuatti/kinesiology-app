import { useMemo, useState } from "react";
import { User, Trophy, Brain, Zap, ShieldCheck } from "lucide-react";
import UnifiedEditor, { type UnifiedEditorSection } from "@/components/crm/UnifiedEditor";
import { SelfPracticeTool } from "@/pages/SelfPracticePage";
import { ProceduresTool } from "@/pages/ProceduresPage";
import { QuizTool } from "@/pages/QuizPage";
import { QuickCalibrateTool } from "@/pages/QuickCalibratePage";
import { CorrectionsReferenceTool } from "@/pages/CorrectionsReferencePage";

interface RawItem { id: string; label: string; icon: React.ElementType; group: string }

const TREE: RawItem[] = [
  { id: "self-practice", label: "Self Practice", icon: User, group: "Daily Practice" },
  { id: "procedures", label: "Procedures & Mastery", icon: Trophy, group: "Mastery" },
  { id: "quiz", label: "Knowledge Quiz", icon: Brain, group: "Mastery" },
  { id: "calibrate", label: "Quick Calibrate", icon: Zap, group: "Mastery" },
  { id: "corrections", label: "Corrections Reference", icon: ShieldCheck, group: "Reference" },
];

const VALID_IDS = new Set(TREE.map((t) => t.id));

const PracticeHubPage = () => {
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    const tool = new URLSearchParams(window.location.search).get("tool");
    return tool && VALID_IDS.has(tool) ? tool : "self-practice";
  });

  const sections = useMemo<UnifiedEditorSection[]>(
    () => [
      { id: "self-practice", label: "Self Practice", icon: User, group: "Daily Practice", render: () => <SelfPracticeTool nested /> },
      { id: "procedures", label: "Procedures & Mastery", icon: Trophy, group: "Mastery", render: () => <ProceduresTool /> },
      { id: "quiz", label: "Knowledge Quiz", icon: Brain, group: "Mastery", render: () => <QuizTool embedded onExit={() => setSelectedId("self-practice")} /> },
      { id: "calibrate", label: "Quick Calibrate", icon: Zap, group: "Mastery", render: () => <QuickCalibrateTool /> },
      { id: "corrections", label: "Corrections Reference", icon: ShieldCheck, group: "Reference", render: () => <CorrectionsReferenceTool /> },
    ],
    []
  );

  const selected = sections.find((s) => s.id === selectedId) ?? null;

  return (
    <UnifiedEditor
      className="h-full"
      leftTitle="Practice Hub"
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
            <Trophy size={28} className="text-chart-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Select a practice tool</p>
            <p className="text-xs text-muted-foreground font-medium mt-1">
              Self practice, mastery tracking, quiz, and clinical references.
            </p>
          </div>
        </div>
      }
    />
  );
};

export default PracticeHubPage;
