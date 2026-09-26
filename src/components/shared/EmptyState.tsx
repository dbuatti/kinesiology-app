import { isValidElement, useId, type ComponentType, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: ComponentType<{ className?: string; size?: number; strokeWidth?: number }>;
  title: ReactNode;
  description?: ReactNode;
  /** A ready-made node, or { label, onClick } for a standard outline button. */
  action?: ReactNode | { label: string; onClick: () => void };
  className?: string;
  compact?: boolean;
}

/**
 * Empty states share one small piece of line art: the Resonance motif — a
 * point with arcs radiating from it — in a soft halo, with the section's own
 * icon tucked into the corner. Calm, on-brand, correct in both themes.
 */
const EmptyState = ({ icon: Icon, title, description, action, className, compact = false }: EmptyStateProps) => {
  const id = useId().replace(/:/g, "");
  const actionNode =
    action && !isValidElement(action) && typeof action === "object" && "label" in (action as object) ? (
      <Button variant="outline" size="sm" onClick={(action as { onClick: () => void }).onClick}>
        {(action as { label: string }).label}
      </Button>
    ) : (
      (action as ReactNode)
    );

  return (
    <div className={cn("flex flex-col items-center justify-center text-center", compact ? "gap-3 px-6 py-8" : "gap-4 px-6 py-14", className)}>
      <div className={cn("relative", compact ? "h-16 w-16" : "h-20 w-20")}>
        <svg viewBox="0 0 80 80" className="h-full w-full" aria-hidden>
          <defs>
            <radialGradient id={`es-${id}`} cx="50%" cy="50%" r="50%">
              <stop offset="0" stopColor="hsl(var(--primary))" stopOpacity="0.16" />
              <stop offset="1" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="40" cy="40" r="40" fill={`url(#es-${id})`} />
          <circle cx="40" cy="40" r="33" fill="none" stroke="hsl(var(--border))" strokeDasharray="2 4" />
          <circle cx="40" cy="40" r="24" fill="hsl(var(--card))" stroke="hsl(var(--border))" />
          <circle cx="33.5" cy="40" r="3" fill="hsl(var(--primary))" />
          <path d="M39 33.5a9 9 0 0 1 0 13" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
          <path d="M44 29.5a15 15 0 0 1 0 21" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
        </svg>
        {Icon && (
          <span className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground shadow-sm">
            <Icon size={14} strokeWidth={1.9} className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
      <div className="max-w-sm">
        <p className="text-[15px] font-medium text-foreground">{title}</p>
        {description && <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {actionNode && <div className="mt-1">{actionNode}</div>}
    </div>
  );
};

export { EmptyState };
export default EmptyState;
