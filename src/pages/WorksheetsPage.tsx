import { PageHeader } from "@/components/shared/PageHeader";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Lightbulb, Zap, Target, Brain, Activity, LayoutGrid, FileText,
  DollarSign, Compass, ArrowLeft, BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";

import WhereYourValueBeginsWorksheet from "@/components/worksheets/WhereYourValueBeginsWorksheet";
import FearCreativityWorksheet from "@/components/worksheets/FearCreativityWorksheet";
import InteractiveIntentionWorksheet from "@/components/crm/InteractiveIntentionWorksheet";
import InnerAwarenessWorksheet from "@/components/worksheets/InnerAwarenessWorksheet";
import AngerFlowWorksheet from "@/components/worksheets/AngerFlowWorksheet";
import BusinessModelWorksheet from "@/components/worksheets/BusinessModelWorksheet";
import Week3Worksheet from "@/components/worksheets/Week3Worksheet";
import MoneySecurityFreedomWorksheet from "@/components/worksheets/MoneySecurityFreedomWorksheet";
import BusinessStrategyDiagnosticWorksheet from "@/components/worksheets/BusinessStrategyDiagnosticWorksheet";

interface WorksheetItem {
  id: string;
  label: string;
  icon: React.ElementType;
  group: string;
  description: string;
  render: (onBack: () => void) => React.ReactNode;
}

const WORKSHEETS: WorksheetItem[] = [
  {
    id: "business-strategy-diagnostic",
    label: "Business Strategy Diagnostic",
    icon: Compass,
    group: "Business",
    description: "Do you actually have a strategy? A Mastery Business audit — transition, offer, marketing, time, numbers.",
    render: (onBack) => <BusinessStrategyDiagnosticWorksheet onBack={onBack} />,
  },
  {
    id: "money-security-freedom",
    label: "Money, Security & Freedom",
    icon: DollarSign,
    group: "Business",
    description: "Map your money orientation, inherited beliefs and where you default to contraction.",
    render: (onBack) => <MoneySecurityFreedomWorksheet onBack={onBack} />,
  },
  {
    id: "business-model",
    label: "Business Model Canvas",
    icon: LayoutGrid,
    group: "Business",
    description: "Define your ideal customer, the problem you solve, and your revenue streams.",
    render: () => <BusinessModelWorksheet submissionId={null} onComplete={() => {}} />,
  },
  {
    id: "north-star",
    label: "Setting Your North Star",
    icon: Target,
    group: "Personal Growth",
    description: "Clarify your yearly intention and the keystone practices that keep you on track.",
    render: () => <InteractiveIntentionWorksheet />,
  },
  {
    id: "where-your-value-begins",
    label: "Where Your Value Begins",
    icon: Lightbulb,
    group: "Personal Growth",
    description: "Uncover how you've been giving your value away before it's received.",
    render: (onBack) => <WhereYourValueBeginsWorksheet submissionId={null} onComplete={() => {}} onBack={onBack} />,
  },
  {
    id: "fear-creativity",
    label: "Fear & Creativity",
    icon: Zap,
    group: "Personal Growth",
    description: "See how the fear-brain collapses your creative range, and expand it.",
    render: (onBack) => <FearCreativityWorksheet submissionId={null} onComplete={() => {}} onBack={onBack} />,
  },
  {
    id: "inner-awareness",
    label: "Inner Awareness",
    icon: Brain,
    group: "Personal Growth",
    description: "Track presence, triggers and choice across a real week.",
    render: (onBack) => <InnerAwarenessWorksheet submissionId={null} onComplete={() => {}} onBack={onBack} />,
  },
  {
    id: "anger-flow",
    label: "Anger & Flow",
    icon: Activity,
    group: "Personal Growth",
    description: "Locate your anger, what it protects, and the flow beneath it.",
    render: (onBack) => <AngerFlowWorksheet submissionId={null} onComplete={() => {}} onBack={onBack} />,
  },
  {
    id: "week-3",
    label: "Week 3 Worksheet",
    icon: FileText,
    group: "Course",
    description: "The Week 3 companion worksheet from the Mechano course.",
    render: () => <Week3Worksheet submissionId={null} onComplete={() => {}} />,
  },
];

const WORKSHEETS_BY_ID = new Map(WORKSHEETS.map((w) => [w.id, w]));

const GROUP_ORDER = ["Business", "Personal Growth", "Course"];

const WorksheetsPage = () => {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const w = params.get("w") || params.get("worksheet");
    return w && WORKSHEETS_BY_ID.has(w) ? w : null;
  });

  const selected = selectedId ? WORKSHEETS_BY_ID.get(selectedId)! : null;

  const goBack = () => {
    setSelectedId(null);
    navigate("/worksheets", { replace: true });
  };

  if (selected) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-3 px-6 py-3 border-b border-border/30 bg-background/80 backdrop-blur">
          <Button variant="ghost" size="sm" onClick={goBack} className="rounded-xl gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Worksheets
          </Button>
          <div className="flex items-center gap-2">
            <selected.icon size={16} className="text-chart-primary" />
            <span className="text-sm font-bold text-foreground">{selected.label}</span>
          </div>
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          {selected.render(goBack)}
        </div>
      </div>
    );
  }

  const groups = GROUP_ORDER.map((g) => ({
    group: g,
    items: WORKSHEETS.filter((w) => w.group === g),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="h-full overflow-y-auto px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <PageHeader
            icon={BookOpen}
            title="Worksheets"
            subtitle="Personal-growth and business exercises — open one, complete it honestly, answers save automatically."
          />
        </div>

        {groups.map(({ group, items }) => (
          <section key={group} className="mb-10">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-4">
              {group}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((w) => (
                <button
                  key={w.id}
                  onClick={() => navigate(`/worksheets?w=${w.id}`)}
                  className="group text-left rounded-2xl border border-border/40 bg-card p-5 hover:border-primary/40 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <w.icon size={20} className="text-primary" />
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-foreground mb-1.5">{w.label}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{w.description}</p>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

export default WorksheetsPage;
