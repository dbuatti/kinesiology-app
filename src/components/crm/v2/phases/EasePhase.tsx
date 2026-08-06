import { Zap, Shield } from "lucide-react";
import SnsList from "@/components/crm/v2/SnsList";
import { PhaseHeader, SectionHeading } from "@/components/crm/v2/PhaseComponents";
import type { PhaseProps } from "@/components/crm/v2/v2-types";

const EasePhase = ({ appointment, saveField }: PhaseProps) => {
  return (
    <div className="space-y-8">
      <PhaseHeader icon={Zap} title="Ease" description="Down-regulate the sympathetic nervous system before deeper assessment." />

      <SectionHeading icon={Shield} title="SNS Down-Regulation" />

      <SnsList appointment={appointment} onSaveField={saveField} />
    </div>
  );
};

export default EasePhase;