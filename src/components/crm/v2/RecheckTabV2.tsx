import { useState, useMemo } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { safeParse } from "@/utils/safe-json";
import { showSuccess } from "@/utils/toast";
import { PRIMITIVE_REFLEXES, PrimitiveReflex } from "@/data/primitive-reflex-data";
import { MUSCLE_INFO_DETAILS } from "@/data/muscle-info-data";
import { BRAIN_REFLEX_POINTS } from "@/data/brain-reflex-data";
import { AppointmentWithClient } from "@/types/crm";
import { CATEGORY_LABELS } from "@/components/crm/v2/categoryConstants";
import {
  Search, HelpCircle, Target, CheckCircle2, RotateCcw
} from "lucide-react";

interface RecheckItemData {
  name: string;
  rawCategory: string;
  status: string;
  side?: 'L' | 'R';
  isLateralized: boolean;
  wasPriority: boolean;
  reflex?: PrimitiveReflex;
  muscleInfo?: { description?: string };
  brainPoint?: { description?: string };
}

interface RecheckTabV2Props {
  appointment: AppointmentWithClient;
  history: any[];
  onUpdate: () => void;
  updatePriorityPattern: (category: string, itemName: string, status: string | null, side?: 'L' | 'R') => Promise<void>;
  saveField: (field: string, value: any) => Promise<void>;
  onJumpToPhase?: (index: number) => void;
}

type Action = 'carry_forward' | 'resolved' | 'unsure';

const CATEGORY_COLORS: Record<string, string> = {
  primitiveReflexes: 'bg-primary/10 text-primary border-primary/20',
  cranialNerves: 'bg-muted text-muted-foreground border-border',
  muscles: 'bg-destructive/10 text-destructive border-destructive/20',
  brainZones: 'bg-chart-emerald/10 text-chart-emerald border-chart-emerald/20',
};

const RecheckTabV2 = ({ appointment, history, onUpdate, updatePriorityPattern, saveField, onJumpToPhase }: RecheckTabV2Props) => {
  const [actions, setActions] = useState<Record<string, Action>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [onlyInhibited, setOnlyInhibited] = useState(true);
  const currentMeta = useMemo(() => {
    const raw = appointment.metadata;
    if (!raw) return {};
    if (typeof raw === 'string') return safeParse(raw, {});
    return raw;
  }, [appointment.metadata]);

  const priorityPathway = (currentMeta as any)?.priority_pathway || "";

  const previousSession = useMemo(() => {
    if (!history || history.length < 2) return null;
    return history[1];
  }, [history]);

  const prevModesBalances = previousSession?.modes_balances || "";

  const rawItems = useMemo(() => {
    if (!previousSession) return [];
    const pattern = safeParse(previousSession.priority_pattern, {} as any);
    const list: RecheckItemData[] = [];

    Object.entries(pattern).forEach(([rawCategory, categoryItems]: [string, any]) => {
      Object.entries(categoryItems).forEach(([fullName, status]) => {
        if (status !== 'Inhibited' && status !== 'Inhibition' && status !== 'Hypertonic') return;

        const sideMatch = fullName.match(/\(([LR])\)$/);
        const side = sideMatch ? sideMatch[1] as 'L' | 'R' : undefined;
        const baseName = fullName.replace(/ \([LR]\)$/, '').trim();

        const reflex = PRIMITIVE_REFLEXES.find(r => r.name === baseName || r.id === baseName);
        const muscleKey = Object.keys(MUSCLE_INFO_DETAILS).find(
          k => k.toLowerCase() === baseName.toLowerCase() || baseName.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(baseName.toLowerCase())
        );
        const muscleInfo = muscleKey ? MUSCLE_INFO_DETAILS[muscleKey] : undefined;
        const brainPoint = BRAIN_REFLEX_POINTS.find(p => p.name === baseName || p.id === baseName);
        const isLateralized = reflex?.isLateralized ?? true;
        const wasPriority = prevModesBalances.toLowerCase().includes(baseName.toLowerCase());

        list.push({
          name: baseName,
          rawCategory,
          status,
          side,
          isLateralized,
          wasPriority,
          reflex,
          muscleInfo,
          brainPoint,
        });
      });
    });

    return list.sort((a, b) => {
      if (a.wasPriority !== b.wasPriority) return a.wasPriority ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }, [previousSession, prevModesBalances]);

  const items = useMemo(() => {
    if (!search && !onlyInhibited) return rawItems;
    return rawItems.filter(item => {
      if (onlyInhibited && item.status !== 'Inhibited' && item.status !== 'Inhibition') return false;
      if (search) {
        const q = search.toLowerCase();
        if (!item.name.toLowerCase().includes(q) && !item.rawCategory.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [rawItems, search, onlyInhibited]);

  const itemKey = (item: RecheckItemData) =>
    `${item.rawCategory}-${item.name}${item.side ? ` (${item.side})` : ''}`;

  const handleAction = async (item: RecheckItemData, action: Action) => {
    const key = itemKey(item);
    setSaving(key);
    try {
      if (action === 'carry_forward') {
        await updatePriorityPattern(item.rawCategory, item.name, item.status, item.side);
      } else if (action === 'unsure') {
        await updatePriorityPattern(item.rawCategory, item.name, 'Unsure', item.side);
      } else {
        const existingMeta = safeParse(appointment.metadata, {});
        await saveField('metadata', {
          ...existingMeta,
          recheck_resolved: { ...(existingMeta?.recheck_resolved || {}), [key]: true },
        });
      }
      setActions(prev => ({ ...prev, [key]: action }));
      onUpdate();
    } catch {
      // handled upstream
    } finally {
      setSaving(null);
    }
  };

  const handleSetPrimary = async (item: RecheckItemData) => {
    const label = CATEGORY_LABELS[item.rawCategory] || item.rawCategory;
    const val = `${item.name}${item.side ? ` (${item.side})` : ''} — ${label}`;
    await saveField('metadata', { ...currentMeta, priority_pathway: val });
    showSuccess(`${item.name} set as 1° priority`);
    onUpdate();
    onJumpToPhase?.(3);
  };

  if (!previousSession || rawItems.length === 0) {
    return (
      <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed border-border">
        <RotateCcw size={40} className="text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground">No Items to Recheck</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
          {previousSession
            ? `No unresolved findings from the previous session (${format(new Date(previousSession.date), "MMM d, yyyy")}).`
            : "This appears to be the client's first recorded session."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search findings..."
            className="h-9 pl-9 rounded-lg text-xs bg-muted/50 border-border"
          />
        </div>
        <button
          onClick={() => setOnlyInhibited(!onlyInhibited)}
          className={cn(
            "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all",
            onlyInhibited
              ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
              : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
          )}
        >
          {items.length} active
        </button>
      </div>

      {/* Items */}
      <div className="space-y-3">
        {items.map((item, idx) => {
          const key = itemKey(item);
          const act = actions[key];
          const isSaving = saving === key;
          const catColor = CATEGORY_COLORS[item.rawCategory] || 'bg-muted text-muted-foreground border-border';

          return (
            <div
              key={idx}
              className={cn(
                "bg-card border rounded-xl p-5 transition-all",
                priorityPathway.startsWith(item.name)
                  ? "border-red-300 ring-1 ring-red-100"
                  : "border-border",
                act && "opacity-50"
              )}
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5">
                    <h4 className="text-sm font-bold text-foreground">{item.name}</h4>
                    {item.side && (
                      <Badge variant="outline" className="text-[9px] font-bold px-1.5 py-0 rounded border-border text-muted-foreground">
                        {item.side}
                      </Badge>
                    )}
                  </div>
                  {item.reflex && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {[item.reflex.category, item.reflex.developmentalWindow].filter(Boolean).join(' • ')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={cn(
                    "text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border",
                    item.status === 'Hypertonic'
                      ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                  )}>
                    {item.status === 'Inhibition' ? 'Inhib' : item.status}
                  </span>
                  {item.wasPriority && (
                    <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      Prio
                    </span>
                  )}
                </div>
              </div>

              {/* Info */}
              {item.reflex && (
                <div className="text-xs text-muted-foreground leading-relaxed space-y-0.5 mb-4">
                  <p>{item.reflex.stimulus}</p>
                  <p>{item.reflex.inhibitionPattern}</p>
                </div>
              )}
              {!item.reflex && item.muscleInfo?.description && (
                <p className="text-xs text-muted-foreground leading-relaxed mb-4">{item.muscleInfo.description}</p>
              )}
              {!item.reflex && item.brainPoint?.description && (
                <p className="text-xs text-muted-foreground leading-relaxed mb-4">{item.brainPoint.description}</p>
              )}

              {/* Category */}
              <div className="mb-4">
                <span className={cn("inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border", catColor)}>
                  {CATEGORY_LABELS[item.rawCategory] || item.rawCategory}
                </span>
              </div>

              {/* Actions */}
              {act === 'carry_forward' && (
                <div className="flex items-center gap-1.5 text-xs font-medium text-chart-emerald">
                  <CheckCircle2 size={13} /> Added to assessment as {item.status}
                </div>
              )}
              {act === 'unsure' && (
                <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                  <HelpCircle size={13} /> Flagged as Unsure
                </div>
              )}
              {act === 'resolved' && (
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <CheckCircle2 size={13} /> Cleared
                </div>
              )}
              {!act && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    onClick={() => handleSetPrimary(item)}
                    disabled={!!isSaving}
                    size="sm"
                    variant="outline"
                    className="h-7 px-3 rounded-md text-[10px] font-bold uppercase tracking-wider border-primary/20 text-primary hover:bg-primary/5"
                  >
                    <Target size={11} className="mr-1" /> Set 1°
                  </Button>
                  <ActionButton
                    onClick={() => handleAction(item, 'resolved')}
                    disabled={isSaving}
                    label="Clear"
                  />
                  <ActionButton
                    onClick={() => handleAction(item, 'carry_forward')}
                    disabled={isSaving}
                    label="Add to assessment"
                  />
                  <ActionButton
                    onClick={() => handleAction(item, 'unsure')}
                    disabled={isSaving}
                    label="Unsure"
                    className="text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/10"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* After Set 1°, user is auto-navigated to Correct phase */}
    </div>
  );
};

const ActionButton = ({
  onClick, disabled, label, className
}: {
  onClick: () => void;
  disabled: boolean | null;
  label: string;
  className?: string;
}) => (
  <Button
    onClick={onClick}
    disabled={!!disabled}
    size="sm"
    variant="outline"
    className={cn(
      "h-7 px-3 rounded-md text-[10px] font-bold uppercase tracking-wider border-border text-muted-foreground hover:bg-muted",
      className
    )}
  >
    {label}
  </Button>
);

export default RecheckTabV2;
