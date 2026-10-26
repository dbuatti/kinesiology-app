import { Zap, Shield } from "lucide-react";
import SnsList from "@/components/crm/v2/SnsList";
import { PhaseHeader, SectionHeading } from "@/components/crm/v2/PhaseComponents";
import { safeParse } from "@/utils/safe-json";
import type { PhaseProps } from "@/components/crm/v2/v2-types";

const SNS_KEYS = ['lymphatic', 'harmonic', 't1', 'diaphragm', 'vagus', 'other'] as const;

const EasePhase = ({ appointment, saveField }: PhaseProps) => {
  const metadata = safeParse<{ sns_resets?: Record<string, boolean> }>(appointment.metadata, {});
  const resets = metadata?.sns_resets || {};
  const done = SNS_KEYS.filter(key => resets[key]).length;

  return (
    <div className="space-y-4">
      <PhaseHeader icon={Zap} title="Ease" description="Down-regulate the sympathetic nervous system before deeper assessment." />

      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs">
        <div className="flex items-center justify-between gap-3 border-b border-border/60 bg-muted/20 px-4 py-2.5">
          <SectionHeading icon={Shield} title="SNS down-regulation" />
          <span className="shrink-0 rounded-full bg-card px-2 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground ring-1 ring-border/60">
            {done}/{SNS_KEYS.length} complete
          </span>
        </div>
        <div className="px-4">
          <SnsList appointment={appointment} onSaveField={saveField} />
        </div>
      </div>
    </div>
  );
};

export default EasePhase;
