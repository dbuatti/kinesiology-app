import type { ReactNode, ElementType } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft } from "lucide-react";

export interface UnifiedEditorSection {
  id: string;
  label: string;
  icon?: ElementType;
  group?: string;
  badge?: string;
  render: () => ReactNode;
}

interface UnifiedEditorProps {
  sections: UnifiedEditorSection[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  leftTitle?: string;
  rightHeader?: ReactNode;
  emptyState?: ReactNode;
  className?: string;
}

const UnifiedEditor = ({
  sections,
  selectedId,
  onSelect,
  leftTitle,
  rightHeader,
  emptyState,
  className,
}: UnifiedEditorProps) => {
  const selected = sections.find((s) => s.id === selectedId) ?? null;

  const grouped = sections.reduce<Record<string, UnifiedEditorSection[]>>((acc, s) => {
    const key = s.group ?? "";
    (acc[key] ??= []).push(s);
    return acc;
  }, {});
  const groupKeys = Object.keys(grouped);

  return (
    <div className={cn("flex h-full w-full overflow-hidden", className)}>
      <aside
        className={cn(
          "shrink-0 w-full max-w-[280px] md:max-w-[260px] lg:max-w-[280px] border-r border-border bg-card/40 flex flex-col",
          selected && "hidden md:flex"
        )}
      >
        {leftTitle && (
          <div className="shrink-0 px-4 h-12 flex items-center border-b border-border">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">
              {leftTitle}
            </span>
          </div>
        )}
        <ScrollArea className="flex-1">
          <nav className="p-3 space-y-4">
            {groupKeys.map((groupKey) => (
              <div key={groupKey} className="space-y-0.5">
                {groupKey && (
                  <p className="px-3 mb-1 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                    {groupKey}
                  </p>
                )}
                {grouped[groupKey].map((s) => {
                  const active = s.id === selectedId;
                  return (
                    <button
                      key={s.id}
                      onClick={() => onSelect(s.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors text-left",
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      {s.icon && <s.icon size={16} className="shrink-0" />}
                      <span className="flex-1 truncate">{s.label}</span>
                      {s.badge && (
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                          {s.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
        </ScrollArea>
      </aside>

      <section className={cn("flex-1 min-w-0 flex flex-col h-full", !selected && "hidden md:flex")}>
        {rightHeader && (
          <div className="shrink-0 border-b border-border bg-card/40 backdrop-blur-sm">
            {rightHeader}
          </div>
        )}
        <div className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedId ?? "empty"}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              className="h-full"
            >
              {selected ? (
                selected.render()
              ) : emptyState ? (
                emptyState
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground/60 gap-2 p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em]">Select an item</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {selected && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSelect("")}
          className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 rounded-xl bg-card shadow-lg border border-border"
        >
          <ChevronLeft size={14} /> Back
        </Button>
      )}
    </div>
  );
};

export default UnifiedEditor;