import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The standard content card: hairline border, quiet header (small icon,
 * sans title, optional description + action), then a body. Use for any
 * dashboard-style section so every panel in the app reads the same.
 */
export function SectionCard({
  title,
  description,
  icon: Icon,
  iconClassName,
  action,
  children,
  className,
  bodyClassName,
}: {
  title: ReactNode;
  description?: ReactNode;
  icon?: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  iconClassName?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("overflow-hidden rounded-2xl border border-border bg-card shadow-xs", className)}>
      <header className="flex items-start gap-3 px-5 pb-3 pt-4">
        {Icon && (
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border bg-background">
            <Icon size={14} strokeWidth={2} className={cn("text-muted-foreground", iconClassName)} />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-semibold leading-7 tracking-[-0.012em] text-foreground">{title}</h3>
          {description && <p className="-mt-0.5 text-[13px] text-muted-foreground">{description}</p>}
        </div>
        {action && <div className="flex shrink-0 items-center gap-1">{action}</div>}
      </header>
      <div className={cn("px-2 pb-2", bodyClassName)}>{children}</div>
    </section>
  );
}

export default SectionCard;
