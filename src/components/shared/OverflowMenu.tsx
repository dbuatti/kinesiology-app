import { MoreHorizontal } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface OverflowAction {
  /** Verb-first label, e.g. "Duplicate client". */
  label: string;
  icon?: LucideIcon;
  onSelect: () => void;
  /** Destructive actions are tinted and, when last, separated. */
  destructive?: boolean;
  disabled?: boolean;
}

/**
 * A single "..." trigger that holds tertiary, destructive or administrative
 * actions (edit, duplicate, export, archive, delete). Use it instead of a row
 * of low-value buttons so each card or section keeps one clear primary action.
 */
export function OverflowMenu({
  actions,
  label = "More actions",
  align = "end",
  className,
  triggerClassName,
  showLabel = false,
}: {
  actions: OverflowAction[];
  label?: string;
  align?: "start" | "center" | "end";
  className?: string;
  triggerClassName?: string;
  showLabel?: boolean;
}) {
  if (actions.length === 0) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size={showLabel ? "sm" : "icon"}
          aria-label={label}
          title={label}
          className={cn("shrink-0 text-muted-foreground hover:text-foreground", triggerClassName)}
        >
          <MoreHorizontal className="h-4 w-4" />
          {showLabel && <span className="ml-1 text-[13px]">{label}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className={cn("w-52", className)}>
        {actions.map((action, index) => {
          const Icon = action.icon;
          const showSeparator = action.destructive && index > 0 && !actions[index - 1]?.destructive;
          return (
            <div key={action.label}>
              {showSeparator && <DropdownMenuSeparator />}
              <DropdownMenuItem
                onSelect={action.onSelect}
                disabled={action.disabled}
                className={cn(action.destructive && "text-destructive focus:text-destructive")}
              >
                {Icon && <Icon className="mr-2 h-4 w-4" />}
                {action.label}
              </DropdownMenuItem>
            </div>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default OverflowMenu;