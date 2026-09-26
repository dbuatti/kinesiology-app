import type { ReactNode, ElementType } from "react";
import { cn } from "@/lib/utils";
import { motion, LayoutGroup } from "framer-motion";
import { useId } from "react";
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
  const scope = useId();

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
          "shrink-0 w-full md:max-w-[248px] lg:max-w-[264px] border-r border-border bg-sidebar/60 flex flex-col",
          selected && "hidden md:flex"
        )}
      >
        {leftTitle && (
          <div className="shrink-0 px-5 h-12 flex items-center">
            <span className="text-[13px] font-semibold tracking-[-0.01em] text-foreground">
              {leftTitle}
            </span>
          </div>
        )}
        <ScrollArea className="flex-1">
          <LayoutGroup id={scope}>
          <nav className="px-3 pb-6 pt-1 space-y-5">
            {groupKeys.map((groupKey) => (
              <div key={groupKey} className="space-y-0.5">
                {groupKey && (
                  <p className="px-2.5 mb-1 text-[11px] font-medium text-muted-foreground/80">
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
                        "relative w-full flex items-center gap-2.5 h-8 px-2.5 rounded-[7px] text-[13px] font-medium text-left",
                        active
                          ? "text-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.045]"
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId={`ue-pill-${scope}`}
                          className="absolute inset-0 rounded-[7px] bg-card shadow-sm ring-1 ring-border/70"
                          transition={{ type: "spring", stiffness: 520, damping: 42 }}
                        />
                      )}
                      {s.icon && <s.icon size={15} strokeWidth={active ? 2 : 1.75} className={cn("relative shrink-0", active && "text-primary")} />}
                      <span className="relative flex-1 truncate">{s.label}</span>
                      {s.badge && (
                        <span className="relative text-[11px] font-medium tabular-nums text-muted-foreground">
                          {s.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
          </LayoutGroup>
        </ScrollArea>
      </aside>

      <section className={cn("flex-1 min-w-0 flex flex-col h-full", !selected && "hidden md:flex")}>
        {rightHeader && (
          <div className="shrink-0 border-b border-border bg-background/80 backdrop-blur-xl">
            {rightHeader}
          </div>
        )}
        <div className="flex-1 overflow-auto">
          <motion.div
              key={selectedId ?? "empty"}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="h-full"
            >
              {selected ? (
                selected.render()
              ) : emptyState ? (
                emptyState
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground/60 gap-2 p-8">
                  <p className="text-sm">Choose something from the list</p>
                </div>
              )}
            </motion.div>
        </div>
      </section>

      {selected && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSelect("")}
          className="md:hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-40 h-9 gap-1 rounded-full bg-card/90 px-4 text-[13px] font-medium shadow-lg border border-border backdrop-blur-xl"
        >
          <ChevronLeft size={14} /> Back
        </Button>
      )}
    </div>
  );
};

export default UnifiedEditor;