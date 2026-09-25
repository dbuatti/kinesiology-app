import { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Consistent page header: an icon tile, title + optional subtitle, and a slot
 * for actions on the right. Adopt across pages/hubs so every top reads the same.
 *
 *   <PageHeader icon={CalendarRange} title="Timetable Simulator"
 *     subtitle="Mock up your fortnight, pencil in, confirm."
 *     actions={<Button>…</Button>} />
 */
export function PageHeader({
  icon: Icon,
  title,
  subtitle,
  actions,
  className,
  iconClassName,
}: {
  icon?: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
  iconClassName?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 md:flex-row md:items-end md:justify-between", className)}>
      <div className="flex min-w-0 flex-1 items-center gap-3.5">
        {Icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card shadow-xs">
            <Icon size={18} strokeWidth={1.85} className={cn("text-primary", iconClassName?.split(/\s+/).filter((c) => /^(dark:)?text-(?!primary-foreground|white)/.test(c)).join(" "))} />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="font-serif sm:truncate text-[26px] font-medium leading-[1.15] tracking-[-0.02em] text-foreground">{title}</h1>
          {subtitle && <p className="mt-0.5 line-clamp-2 text-[13.5px] text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 md:max-w-[60%] md:justify-end">{actions}</div>}
    </div>
  );
}

export default PageHeader;
