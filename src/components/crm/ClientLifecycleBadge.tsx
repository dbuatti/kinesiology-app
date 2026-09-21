import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LifecycleStatus } from "@/lib/clientStatus";

const META: Record<LifecycleStatus, { label: string; className: string }> = {
  lead: { label: "Lead", className: "bg-muted text-muted-foreground border-border" },
  active: { label: "Active", className: "bg-chart-emerald/10 text-chart-emerald border-chart-emerald/30" },
  at_risk: { label: "At Risk", className: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
  lapsed: { label: "Lapsed", className: "bg-muted/70 text-muted-foreground border-border" },
};

interface Props {
  status: LifecycleStatus;
  className?: string;
}

export default function ClientLifecycleBadge({ status, className }: Props) {
  const meta = META[status];
  return (
    <Badge className={cn("h-4 px-1.5 text-[7px] font-black uppercase tracking-widest border", meta.className, className)}>
      {meta.label}
    </Badge>
  );
}
