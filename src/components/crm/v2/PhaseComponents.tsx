import type { ComponentType, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type IconType = ComponentType<{ size?: number; className?: string }>;

/**
 * The five phase pages share one masthead, one section caption and one panel
 * frame so moving P → E → A → C → E feels like one surface, not five tools.
 * Everything here is presentational; phases own their own controls.
 */

export const PhaseIcon = ({
  icon: Icon,
  tone = 'primary',
}: {
  icon: IconType;
  tone?: 'primary' | 'muted';
}) => (
  <div
    className={cn(
      'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1',
      tone === 'primary'
        ? 'bg-primary/10 text-primary-strong ring-primary/15'
        : 'bg-muted text-muted-foreground ring-border'
    )}
  >
    <Icon size={20} />
  </div>
);

export const PhaseHeader = ({
  icon,
  title,
  description,
  meta,
}: {
  icon: IconType;
  title: string;
  description: string;
  /** Right-hand slot: a status chip, a count, a phase action. */
  meta?: ReactNode;
}) => (
  <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div className="flex min-w-0 items-start gap-3.5">
      <PhaseIcon icon={icon} />
      <div className="min-w-0 flex-1 space-y-1">
        <h2 className="text-[22px] font-semibold leading-tight tracking-tight text-foreground">
          {title}
        </h2>
        <p className="max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
    {meta && <div className="shrink-0 sm:pt-1">{meta}</div>}
  </header>
);

export const SectionHeading = ({
  icon: Icon,
  title,
  hint,
  badge,
}: {
  icon: IconType;
  title: string;
  hint?: string;
  badge?: ReactNode;
}) => (
  <div className="flex items-center justify-between gap-3">
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted/70 text-muted-foreground">
        <Icon size={14} />
      </span>
      <div className="min-w-0">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.11em] text-muted-foreground">
          {title}
        </h3>
        {hint && <p className="text-[11px] leading-snug text-muted-foreground/70">{hint}</p>}
      </div>
    </div>
    {badge}
  </div>
);

/** Soft card used to group a working area. No shadow stack, just one hairline. */
export const PhasePanel = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <section
    className={cn(
      'rounded-2xl border border-border/70 bg-card p-4 shadow-xs sm:p-5',
      className
    )}
  >
    {children}
  </section>
);

export const PhaseEmptyState = ({
  icon: Icon,
  title,
  description,
  className,
}: {
  icon: IconType;
  title: string;
  description: string;
  className?: string;
}) => (
  <div
    className={cn(
      'flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center',
      className
    )}
  >
    <span className="mb-1 flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
      <Icon size={20} />
    </span>
    <p className="text-sm font-semibold text-foreground">{title}</p>
    <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">{description}</p>
  </div>
);

/** One object named the same way on Align and Correct: the correction target. */
export const PathwayBanner = ({
  icon: Icon,
  label = 'Priority pathway',
  value,
  actions,
}: {
  icon: IconType;
  label?: string;
  value: string;
  actions?: ReactNode;
}) => (
  <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/[0.055] px-4 py-3">
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary-strong">
      <Icon size={16} />
    </span>
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-semibold uppercase tracking-[0.11em] text-primary/80">
        {label}
      </p>
      <p className="truncate text-sm font-semibold text-foreground">{value}</p>
    </div>
    {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
  </div>
);
