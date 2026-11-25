import { type ReactNode, useState } from "react";
import { Star, Target } from "lucide-react";
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
  type CorrectionDirection,
  type CorrectionPathway,
  type ItemCorrection,
} from "./types";

interface Props {
  itemName: string;
  side?: "L" | "R";
  corrections: ItemCorrection[];
  isPriority: boolean;
  onTogglePriority: () => void;
  priorityTier?: FindingPriority | null;
  onSetPriorityTier?: (tier: FindingPriority | null) => void;
  onAddCorrection: (correction: ItemCorrection) => void | Promise<void>;
  onUpdateCorrection?: (correction: ItemCorrection) => void | Promise<void>;
  onToggleHolding: (id: string) => void;
  onRemoveCorrection: (id: string) => void;
  children: ReactNode;
  className?: string;
  /** Apply amber priority glow around the whole row. */
  glow?: boolean;
}

export function PathwayRow({
  itemName,
  side,
  corrections,
  isPriority,
  onTogglePriority,
  priorityTier = isPriority ? "priority" : null,
  onSetPriorityTier,
  onAddCorrection,
  onUpdateCorrection,
  onToggleHolding,
  onRemoveCorrection,
  children,
  className,
  glow = true,
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
          <div
            className={cn(
              "min-w-0 rounded-lg transition-shadow",
              glow && isPriority && "bg-primary/[0.04] ring-1 ring-primary/30 shadow-[0_0_0_1px_rgba(67,56,202,0.14),0_0_14px_rgba(67,56,202,0.10)]",
              className,
            )}
          >
            <div className="flex min-w-0 items-center gap-2">
              <div className="min-w-0 flex-1">{children}</div>
              {(corrections.length > 0 || isPriority) && (
                <ReflexCorrectionPills
                  corrections={corrections}
                  isPriority={isPriority}
                  priorityTier={priorityTier}
                  onToggleHolding={onToggleHolding}
                  onRemove={onRemoveCorrection}
                  onEdit={(c) => setModal({ direction: c.direction, pathway: c.pathway, correction: c })}
                />
              )}
            </div>
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
          itemName={itemName}
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
