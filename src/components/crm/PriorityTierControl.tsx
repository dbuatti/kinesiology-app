import { Star, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FindingPriority } from "./v2/v2-utils";

type Tier = FindingPriority | null;

const TIERS: Array<{
  value: Tier;
  label: string;
  title: string;
  icon?: typeof Target;
}> = [
  { value: null, label: "None", title: "Remove priority" },
  {
    value: "priority",
    label: "Priority",
    title: "Mark as priority",
    icon: Target,
  },
  {
    value: "primary",
    label: "Primary priority",
    title: "Mark as the single primary priority (the previous one stays priority)",
    icon: Star,
  },
];

interface PriorityTierControlProps {
  value: Tier;
  onChange: (next: Tier) => void;
  /** Used for the group's accessible name, e.g. the finding it belongs to. */
  label?: string;
  compact?: boolean;
  className?: string;
}

/** Single, explicit control for the three priority states in Align:
 *  none → priority → primary priority. Only one state is ever active. */
const PriorityTierControl = ({
  value,
  onChange,
  label = "Priority level",
  compact = false,
  className,
}: PriorityTierControlProps) => (
  <div
    role="group"
    aria-label={label}
    className={cn(
      "inline-flex items-center gap-0.5 rounded-lg border border-border bg-background p-0.5",
      className,
    )}
  >
    {TIERS.map((tier) => {
      const active = value === tier.value;
      const Icon = tier.icon;
      return (
        <button
          key={tier.label}
          type="button"
          aria-pressed={active}
          title={tier.title}
          onClick={() => onChange(tier.value)}
          className={cn(
            "inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/25",
            compact ? "h-7 px-1.5 text-[10px]" : "h-9 px-2.5 text-[12px]",
            active
              ? tier.value === "primary"
                ? "bg-gold/15 text-gold-strong ring-1 ring-gold/40"
                : tier.value === "priority"
                  ? "bg-primary/10 text-primary-strong ring-1 ring-primary/20"
                  : "bg-muted text-foreground"
            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
          )}
        >
          {Icon && (
            <Icon
              size={compact ? 9 : 12}
              fill={tier.value === "primary" && active ? "currentColor" : "none"}
            />
          )}
          <span>{tier.label}</span>
        </button>
      );
    })}
  </div>
);

export default PriorityTierControl;
