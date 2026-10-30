import type { ComponentType } from "react";
import { cn } from "@/lib/utils";

export interface CorrectionsSidebarItem {
  id: string;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  /** Optional group heading rendered above the first item that uses it. */
  group?: string;
}

interface CorrectionsSidebarProps {
  items: CorrectionsSidebarItem[];
  activeId: string;
  setActiveId: (id: string) => void;
  tabAccent: string;
}

const CorrectionsSidebar = ({ items, activeId, setActiveId, tabAccent }: CorrectionsSidebarProps) => {
  return (
    <aside className="w-44 shrink-0 self-start max-h-full border-r border-border/60 p-2.5 space-y-0.5 overflow-y-auto">
      {items.map((item, i) => {
        const Icon = item.icon;
        const isActive = activeId === item.id;
        const showGroup = !!item.group && item.group !== items[i - 1]?.group;
        return (
          <div key={item.id}>
            {showGroup && (
              <p
                className={cn(
                  "px-2.5 pb-1 text-[8.5px] font-bold uppercase tracking-wider text-muted-foreground/40",
                  i === 0 ? "pt-0" : "pt-2.5"
                )}
              >
                {item.group}
              </p>
            )}
            <button
              onClick={() => setActiveId(item.id)}
              className={cn(
                "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all text-[11px] font-medium",
                isActive
                  ? tabAccent
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon size={14} className="shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          </div>
        );
      })}
    </aside>
  );
};

export default CorrectionsSidebar;
