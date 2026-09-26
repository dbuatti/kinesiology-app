import { motion, LayoutGroup } from "framer-motion";
import { useId } from "react";
import { cn } from "@/lib/utils";

export interface HubTab {
  id: string;
  label: string;
  icon?: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
}

/**
 * Sticky underline tabs for multi-tool hubs (Clients, Business, …). The
 * active indicator glides between tabs instead of jumping. Drive it with the
 * same controlled value as the Radix <Tabs> it sits above.
 */
export function HubTabs({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: HubTab[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  const scope = useId();
  return (
    <div className={cn("sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70", className)}>
      <LayoutGroup id={scope}>
        <div role="tablist" className="no-scrollbar flex gap-1 overflow-x-auto px-3 sm:px-5 lg:px-6">
          {tabs.map((t) => {
            const active = t.id === value;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={active}
                onClick={() => onChange(t.id)}
                className={cn(
                  "relative flex h-11 shrink-0 items-center gap-2 rounded-md px-2.5 text-[13.5px] font-medium outline-none",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t.icon && <t.icon size={15} strokeWidth={1.9} className={cn(active ? "text-primary" : "opacity-80")} />}
                {t.label}
                {active && (
                  <motion.span
                    layoutId={`hub-underline-${scope}`}
                    className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-foreground"
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </LayoutGroup>
    </div>
  );
}

export default HubTabs;
