import { ReactNode } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import SharedEmptyState from "@/components/shared/EmptyState";

/**
 * Standard loading / empty / error states so pages feel calm and consistent
 * instead of each rolling its own spinner, radius and type scale.
 */

export function LoadingState({ label = "Loading…", className }: { label?: string; className?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("flex flex-col items-center justify-center gap-4 py-16 text-center", className)}
    >
      <div className="relative h-20 w-20">
        <svg viewBox="0 0 80 80" className="h-full w-full" aria-hidden>
          <defs>
            <radialGradient id="es-loading" cx="50%" cy="50%" r="50%">
              <stop offset="0" stopColor="hsl(var(--primary))" stopOpacity="0.16" />
              <stop offset="1" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="40" cy="40" r="40" fill={`url(#es-loading)`} />
          <circle cx="40" cy="40" r="33" fill="none" stroke="hsl(var(--border))" strokeDasharray="2 4" />
          <circle cx="40" cy="40" r="24" fill="hsl(var(--card))" stroke="hsl(var(--border))" />
          <circle cx="33.5" cy="40" r="3" fill="hsl(var(--primary))" />
          <path d="M39 33.5a9 9 0 0 1 0 13" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
          <path d="M44 29.5a15 15 0 0 1 0 21" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
        </svg>
        <Loader2 size={22} className="absolute inset-0 animate-spin text-primary" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  hint,
  description,
  action,
  className,
  compact,
}: {
  icon?: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  title: ReactNode;
  /** Preferred prop name on new call sites. */
  hint?: ReactNode;
  /** Alias kept so both historical call styles render the same motif. */
  description?: ReactNode;
  action?: ReactNode | { label: string; onClick: () => void };
  className?: string;
  compact?: boolean;
}) {
  return (
    <SharedEmptyState
      icon={icon}
      title={title}
      description={hint ?? description}
      action={action}
      className={className}
      compact={compact}
    />
  );
}

export function ErrorState({
  message = "Something went wrong while loading this view.",
  onRetry,
  className,
}: {
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div role="alert" className={cn("flex flex-col items-center justify-center gap-4 px-6 py-16 text-center", className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive-strong">
        <AlertTriangle size={22} />
      </div>
      <p className="max-w-sm text-lg font-medium text-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="h-10 rounded-lg px-4 text-sm font-medium">
          Try again
        </Button>
      )}
    </div>
  );
}
