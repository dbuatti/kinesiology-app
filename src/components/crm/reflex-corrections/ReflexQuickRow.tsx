import { useState } from "react";
import { Star, Target } from "lucide-react";
import CheckItem from "@/components/crm/document-view/CheckItem";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";
import { PATHWAY_DIRECTION } from "@/lib/pathway-direction";
import type { FindingPriority } from "@/components/crm/v2/v2-utils";
import { ReflexCorrectionModal } from "./ReflexCorrectionModal";
import { ReflexCorrectionPills } from "./ReflexCorrectionPills";
import {
  CORRECTION_OPTIONS,
  type ItemCorrection,
  type CorrectionDirection,
  type CorrectionPathway,
} from "./types";

interface Props {
  category: string;
  name: string;
  side?: "L" | "R";
  pattern: Record<string, Record<string, string | undefined>>;
  onToggle: (category: string, name: string, nextStatus: string, side?: "L" | "R") => void;
  corrections: ItemCorrection[];
  isPriority: boolean;
  onTogglePriority: () => void;
  priorityTier?: FindingPriority | null;
  onSetPriorityTier?: (tier: FindingPriority | null) => void;
  onAddCorrection: (correction: ItemCorrection) => void | Promise<void>;
  onUpdateCorrection?: (correction: ItemCorrection) => void | Promise<void>;
  onToggleHolding: (id: string) => void;
  onRemoveCorrection: (id: string) => void;
  className?: string;
  compact?: boolean;
}

export function ReflexQuickRow({
  category,
  name,
  side,
  pattern,
  onToggle,
  corrections,
  isPriority,
  onTogglePriority,
  priorityTier = isPriority ? "priority" : null,
  onSetPriorityTier,
  onAddCorrection,
  onUpdateCorrection,
  onToggleHolding,
  onRemoveCorrection,
  className,
  compact = false,
}: Props) {
  const [modal, setModal] = useState<{ direction: CorrectionDirection; pathway: CorrectionPathway; correction?: ItemCorrection } | null>(null);

  const applyTier = (tier: FindingPriority | null) => {
    if (onSetPriorityTier) onSetPriorityTier(tier);
    else if (!!tier !== isPriority) onTogglePriority();
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className={cn("min-w-0", className)}>
            <CheckItem
              category={category}
              name={name}
              side={side}
              compact={compact}
              pattern={pattern}
              onToggle={onToggle}
              className={cn(isPriority && "ring-1 ring-primary/30 shadow-[0_0_0_1px_rgba(67,56,202,0.14)]")}
              trailing={
                corrections.length > 0 || isPriority ? (
                  <ReflexCorrectionPills
                    corrections={corrections}
                    isPriority={isPriority}
                    priorityTier={priorityTier}
                    onToggleHolding={onToggleHolding}
                    onRemove={onRemoveCorrection}
                    onEdit={(c) => setModal({ direction: c.direction, pathway: c.pathway, correction: c })}
                  />
                ) : undefined
              }
            />
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-52">
          {CORRECTION_OPTIONS.map((group) => {
            const direction = PATHWAY_DIRECTION[group.direction];
            const Icon = direction.Icon;
            return (
              <ContextMenuSub key={group.direction}>
                <ContextMenuSubTrigger className={cn("gap-2", direction.strong)}>
                  <Icon size={13} /> {group.section}
                </ContextMenuSubTrigger>
                <ContextMenuSubContent className="w-48">
                  {group.items.map((item) => (
                    <ContextMenuItem
                      key={item.pathway}
                      className={cn("gap-2", direction.text)}
                      onSelect={() => setModal({ direction: group.direction, pathway: item.pathway })}
                    >
                      <Icon size={12} /> {item.label}
                    </ContextMenuItem>
                  ))}
                </ContextMenuSubContent>
              </ContextMenuSub>
            );
          })}
          <ContextMenuSeparator />
          <ContextMenuLabel className="px-2 text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">
            Priority
          </ContextMenuLabel>
          <ContextMenuRadioGroup
            value={priorityTier ?? "none"}
            onValueChange={(value) => applyTier(value === "none" ? null : value as FindingPriority)}
          >
            <ContextMenuRadioItem value="none">None</ContextMenuRadioItem>
            <ContextMenuRadioItem value="priority" className="gap-2 text-primary-strong">
              <Target size={12} /> Priority
            </ContextMenuRadioItem>
            <ContextMenuRadioItem value="primary" className="gap-2 text-gold-strong">
              <Star size={12} fill="currentColor" /> Primary priority
            </ContextMenuRadioItem>
          </ContextMenuRadioGroup>
        </ContextMenuContent>
      </ContextMenu>

      {modal && (
        <ReflexCorrectionModal
          open={!!modal}
          onOpenChange={(open) => !open && setModal(null)}
          itemName={name}
          side={side}
          direction={modal.direction}
          pathway={modal.pathway}
          isPriority={isPriority}
          priorityTier={priorityTier}
          correction={modal.correction}
          onApply={async (correction) => {
            if (modal.correction && onUpdateCorrection) await onUpdateCorrection(correction);
            else await onAddCorrection(correction);
            setModal(null);
          }}
        />
      )}
    </>
  );
}

export const PathwayQuickRow = ReflexQuickRow;
