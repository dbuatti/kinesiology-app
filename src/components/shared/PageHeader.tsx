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
}: {
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-4", className)}>
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-chart-primary/10 flex items-center justify-center shrink-0">
            <Icon size={20} className="text-chart-primary" />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-xl font-serif font-bold text-foreground truncate">{title}</h1>
          {subtitle && <p className="text-xs text-muted-foreground font-medium">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

export default PageHeader;
