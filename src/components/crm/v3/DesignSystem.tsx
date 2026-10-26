import { cn } from "@/lib/utils";
import { Target, Zap, GitBranch, ClipboardCheck, CheckCircle2, Activity, ChevronRight } from "lucide-react";

/**
 * Strict Design System for PEACE Clinical Workflow
 * Enforces: typography, colors, spacing, components
 */

// `hint` doubles as the outstanding-work chip on the phase heading, so it is
// written the way a practitioner would say it out loud.
export const PHASE_SPECS = [
  { id: "p", label: "P", fullLabel: "Preliminary", icon: Activity, hint: "Needs goal & issue" },
  { id: "e1", label: "E", fullLabel: "Ease", icon: Zap, hint: "Needs one technique" },
  { id: "a", label: "A", fullLabel: "Align", icon: GitBranch, hint: "Needs a priority finding" },
  { id: "c", label: "C", fullLabel: "Correct", icon: Target, hint: "Needs modes & balances" },
  { id: "e2", label: "E", fullLabel: "Embed", icon: ClipboardCheck, hint: "Needs a north star" },
] as const;

export type PhaseId = (typeof PHASE_SPECS)[number]["id"];

/* ──────────────────────────────────────────────────────────────
   Layout Primitives
   ────────────────────────────────────────────────────────────── */

export const Card = ({ children, className, padding = "normal", hover }: { 
  children: React.ReactNode; 
  className?: string; 
  padding?: "none" | "compact" | "normal" | "comfortable";
  hover?: boolean;
}) => {
  const paddings = {
    none: "",
    compact: "p-4",
    normal: "p-4",
    comfortable: "p-6",
  };
  return (
    <div className={cn("card", hover && "card-hover", paddings[padding], className)}>
      {children}
    </div>
  );
};

export const Section = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("space-y-4", className)}>{children}</div>
);

/* ──────────────────────────────────────────────────────────────
   Typography
   ────────────────────────────────────────────────────────────── */

export const PageTitle = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <h1 className={cn("text-page-title", className)}>{children}</h1>
);

export const SectionTitle = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <h2 className={cn("text-section-title", className)}>{children}</h2>
);

export const CardTitle = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <h3 className={cn("text-card-title", className)}>{children}</h3>
);

export const BodyText = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <p className={cn("text-body", className)}>{children}</p>
);

export const MetaText = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <p className={cn("text-meta", className)}>{children}</p>
);

/* ──────────────────────────────────────────────────────────────
   Buttons
   ────────────────────────────────────────────────────────────── */

export const PrimaryButton = ({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button className={cn("btn-primary", className)} {...props}>{children}</button>
);

export const SecondaryButton = ({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button className={cn("btn-secondary", className)} {...props}>{children}</button>
);

export const GhostButton = ({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button className={cn("btn-ghost", className)} {...props}>{children}</button>
);

/* ──────────────────────────────────────────────────────────────
   Badges
   ────────────────────────────────────────────────────────────── */

export const StatusBadge = ({
  children,
  variant = "pending",
  className
}: {
  children: React.ReactNode;
  variant?: "completed" | "recorded" | "pending";
  className?: string;
}) => (
  // Plain span: shadcn Badge's own teal default would beat these component
  // classes in the cascade (twMerge can't see through them).
  <span className={cn("badge", {
    "badge-success": variant === "completed",
    "badge-recorded": variant === "recorded",
    "badge-pending": variant === "pending",
  }, className)}>
    {children}
  </span>
);

/**
 * Empty state — calm tile + title + description + optional action
 */
export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: any;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) => (
  <div className={cn('flex flex-col items-center justify-center gap-3 px-6 py-12 text-center', className)}>
    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground/60">
      <Icon size={22} strokeWidth={1.5} />
    </div>
    <div className="max-w-sm space-y-1">
      <p className="text-[15px] font-semibold text-foreground">{title}</p>
      {description && <p className="text-meta">{description}</p>}
    </div>
    {action && <div className="mt-1">{action}</div>}
  </div>
);

/* ──────────────────────────────────────────────────────────────
   Phase rail — the PEACE navigator, lives in the sticky toolbar so
   jumping phase never requires scrolling back to the top.
   ────────────────────────────────────────────────────────────── */

export const PhaseRail = ({
  activePhase,
  phaseStatus,
  onJumpToPhase,
  className,
}: {
  activePhase: number;
  phaseStatus: Record<string, boolean>;
  onJumpToPhase: (index: number) => void;
  className?: string;
}) => (
  <nav aria-label="PEACE phases" className={cn("flex min-w-0 items-center justify-center gap-0.5 sm:gap-1", className)}>
    {PHASE_SPECS.map((phase, index) => {
      const isCompleted = phaseStatus[phase.id];
      const isActive = activePhase === index;

      // Every phase is reachable at any time — a practitioner often needs to
      // step back to Preliminary mid-correction, or forward to check Embed.
      return (
        <div key={phase.id} className="flex min-w-0 items-center gap-0.5 sm:gap-1">
          {index > 0 && (
            <span aria-hidden className="hidden h-px w-2 shrink-0 bg-border sm:block sm:w-3" />
          )}
          <button
            type="button"
            onClick={() => onJumpToPhase(index)}
            title={
              isCompleted
                ? `${phase.fullLabel} — complete`
                : `${phase.fullLabel} — ${phase.hint.toLowerCase()}`
            }
            aria-label={`Phase ${index + 1}: ${phase.fullLabel}${isCompleted ? " (complete)" : ""}`}
            aria-current={isActive ? "step" : undefined}
            className={cn(
              "group flex h-8 min-w-0 shrink-0 items-center gap-1.5 rounded-full pl-0.5 outline-none transition-colors",
              isActive ? "bg-primary/[0.08] pr-2" : "pr-1 hover:bg-muted/70"
            )}
          >
            <span
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold transition-colors",
                isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : isCompleted
                  ? "border-success/30 bg-success/10 text-success"
                  : "border-border text-muted-foreground group-hover:border-primary/40 group-hover:text-primary"
              )}
            >
              {phase.label}
            </span>
            {/* The active phase keeps its name at every width — the heading
                block no longer repeats it. The rest appear once there is room. */}
            <span
              className={cn(
                "whitespace-nowrap text-[11px] leading-none transition-colors",
                isActive
                  ? "inline font-semibold text-foreground"
                  : "hidden font-medium text-muted-foreground group-hover:text-foreground lg:inline"
              )}
            >
              {phase.fullLabel}
            </span>
          </button>
        </div>
      );
    })}
  </nav>
);

/* ──────────────────────────────────────────────────────────────
   Inputs
   ────────────────────────────────────────────────────────────── */

export const TextInput = ({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  className, 
  ...props 
}: { 
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div className={cn("space-y-2", className)}>
    {label && <label className="text-card-title">{label}</label>}
    <input
      className="input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      {...props}
    />
  </div>
);

export const TextareaInput = ({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  rows = 4,
  className, 
  ...props 
}: { 
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <div className={cn("space-y-2", className)}>
    {label && <label className="text-card-title">{label}</label>}
    <textarea
      className="textarea"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      {...props}
    />
  </div>
);

/* ──────────────────────────────────────────────────────────────
   Alert / Banner
   ────────────────────────────────────────────────────────────── */

export const AlertBanner = ({ 
  variant = "warning",
  icon: Icon,
  title,
  children,
  className 
}: { 
  variant?: "warning" | "info" | "success";
  icon?: any;
  title: string;
  children: React.ReactNode;
  className?: string;
}) => {
  const variants = {
    warning: "border-warning/20 bg-warning/5 text-warning",
    info: "border-primary/20 bg-primary/5 text-primary",
    success: "border-success/20 bg-success/5 text-success",
  };
  return (
    <div className={cn("flex items-start gap-3 rounded-xl px-4 py-3", variants[variant], className)}>
      {Icon && <Icon size={16} className="mt-1 shrink-0" />}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{title}</p>
        <div className="mt-1 text-sm leading-relaxed">{children}</div>
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────
   Confirmation Footer
   ────────────────────────────────────────────────────────────── */

export const ConfirmationFooter = ({ 
  title,
  description,
  action,
  className 
}: { 
  title: string;
  description?: string;
  action: React.ReactNode;
  className?: string;
}) => (
  <div className={cn("flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-6 py-4 shadow-sm", className)}>
    <div className="min-w-0">
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && <p className="text-meta">{description}</p>}
    </div>
    <div>{action}</div>
  </div>
);

/* ──────────────────────────────────────────────────────────────
   Section Header (for sub-tabs, etc)
   ────────────────────────────────────────────────────────────── */

export const SectionHeader = ({ 
  icon: Icon,
  title,
  subtitle,
  badge,
  children,
  className 
}: { 
  icon?: any;
  title: string;
  subtitle?: string;
  badge?: string;
  children?: React.ReactNode;
  className?: string;
}) => (
  <div className={cn("flex flex-wrap items-center justify-between gap-3", className)}>
    <div className="flex items-center gap-2">
      {Icon && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground">
          <Icon size={14} strokeWidth={1.75} />
        </div>
      )}
      <div>
        <h3 className="text-card-title">{title}</h3>
        {subtitle && <p className="text-meta">{subtitle}</p>}
      </div>
    </div>
    <div className="flex items-center gap-2">
      {children}
      {badge && <StatusBadge variant="completed">{badge}</StatusBadge>}
    </div>
  </div>
);

/* ──────────────────────────────────────────────────────────────
   Sub-tab Segmented Control
   ────────────────────────────────────────────────────────────── */

export const SegmentedTabs = ({
  tabs,
  activeTab,
  onChange,
  className
}: {
  tabs: { id: string; label: string; icon?: any }[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}) => (
  <div className={cn("overflow-x-auto no-scrollbar", className)}>
    <div className="mx-auto flex w-max items-center gap-1 rounded-xl border border-border/50 bg-muted/40 p-1">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          aria-pressed={activeTab === tab.id}
          className={cn(
            "flex h-9 items-center gap-2 whitespace-nowrap rounded-md px-2 text-[11px] font-medium transition-colors",
            activeTab === tab.id
              ? "bg-card text-foreground shadow-xs ring-1 ring-border/50"
              : "text-muted-foreground hover:bg-card/60 hover:text-foreground"
          )}
        >
          {tab.icon && <tab.icon size={13} className={activeTab === tab.id ? "text-primary" : undefined} />}
          {tab.label}
        </button>
      ))}
    </div>
  </div>
);