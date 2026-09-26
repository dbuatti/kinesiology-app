import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/** Soft, tinted pills — status reads by hue without shouting. */
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-4 transition-colors focus:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/25",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary/10 text-primary",
        secondary: "border-transparent bg-foreground/[0.06] text-secondary-foreground",
        destructive: "border-transparent bg-destructive/10 text-destructive",
        outline: "border-border text-foreground",
        success: "border-transparent bg-chart-emerald/10 text-chart-emerald",
        warning: "border-transparent bg-chart-amber/15 text-[hsl(30_80%_36%)] dark:text-chart-amber",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
