import type { ComponentType } from "react";
import { cn } from "@/lib/utils";
import { Activity } from "lucide-react";

export interface CorrectionsSidebarItem {
  id: string;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
}

interface CorrectionsSidebarProps {
  items: CorrectionsSidebarItem[];
  activeId: string;
  setActiveId: (id: string) => void;
  tabAccent: string;
}

const CorrectionsSidebar = ({ items, activeId, setActiveId, tabAccent }: CorrectionsSidebarProps) => {
  return (
    <aside className="w-48 shrink-0 border-r border-border p-3 space-y-1 overflow-y-auto">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeId === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveId(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all text-xs font-medium",
              isActive
                ? tabAccent
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <Icon size={16} className="shrink-0" />
            <span className="truncate">{item.label}</span>
          </button>
        );
      })}
    </aside>
  );
};

export default CorrectionsSidebar;