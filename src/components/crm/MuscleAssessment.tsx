import { useState, useEffect, useMemo } from "react";
import { MUSCLE_GROUPS, MIDLINE_MUSCLES } from "@/data/muscle-data";
import { Badge } from "@/components/ui/badge";
import { Zap, Search, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import MuscleInfoModal from "@/components/crm/MuscleInfoModal";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { safeParse } from "@/utils/safe-json";
import { getMuscleInfo } from "@/data/muscle-info-data";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface MuscleTestItemProps {
  name: string;
  statusL?: 'Clear' | 'Inhibited' | 'Hypertonic' | null;
  statusR?: 'Clear' | 'Inhibited' | 'Hypertonic' | null;
  statusMidline?: 'Clear' | 'Inhibited' | 'Hypertonic' | null;
  isLateralized: boolean;
  imageUrl?: string | null;
  showImage: boolean;
  compact?: boolean;
  onUpdate: (category: string, itemName: string, status: 'Clear' | 'Inhibited' | 'Hypertonic' | null, side?: 'L' | 'R') => Promise<void>;
}

const STATUS_CONFIG = {
  Inhibited: { label: "Inh", fullLabel: "Inhibited", color: "bg-rose-500 text-white border-rose-500", muted: "border-rose-300 text-rose-600 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-400" },
  Hypertonic: { label: "Hyp", fullLabel: "Hypertonic", color: "bg-amber-500 text-white border-amber-500", muted: "border-amber-300 text-amber-600 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400" },
  Clear: { label: "Clr", fullLabel: "Clear", color: "bg-emerald-500 text-white border-emerald-500", muted: "border-emerald-300 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400" },
};

const StatusButton = ({ status, current, onClick, side }: { status: 'Inhibited' | 'Hypertonic' | 'Clear'; current: string | null | undefined; onClick: () => void; side?: string }) => {
  const cfg = STATUS_CONFIG[status];
  const isActive = current === status;
  return (
    <button
      onClick={onClick}
      title={`${side ? side + ': ' : ''}${cfg.fullLabel}`}
      className={cn(
        "px-1.5 py-0.5 rounded text-[8px] font-bold border transition-colors min-w-[28px]",
        isActive ? cfg.color : cfg.muted
      )}
    >
      {cfg.label}
    </button>
  );
};

const MuscleRow = ({ name, statusL, statusR, statusMidline, isLateralized, info, onUpdate, onSelect }: {
  name: string;
  statusL?: 'Clear' | 'Inhibited' | 'Hypertonic' | null;
  statusR?: 'Clear' | 'Inhibited' | 'Hypertonic' | null;
  statusMidline?: 'Clear' | 'Inhibited' | 'Hypertonic' | null;
  isLateralized: boolean;
  info: { meridian?: string; testingPosition?: string; description?: string };
  onUpdate: (category: string, itemName: string, status: 'Clear' | 'Inhibited' | 'Hypertonic' | null, side?: 'L' | 'R') => Promise<void>;
  onSelect?: (name: string) => void;
}) => {
  const isInhibited = isLateralized ? (statusL === 'Inhibited' || statusR === 'Inhibited') : statusMidline === 'Inhibited';
  const isHypertonic = isLateralized ? (statusL === 'Hypertonic' || statusR === 'Hypertonic') : statusMidline === 'Hypertonic';
  const isClear = isLateralized ? (statusL === 'Clear' || statusR === 'Clear') : statusMidline === 'Clear';

  const rowBg = isInhibited ? "bg-rose-50/40 dark:bg-rose-950/10" :
    isHypertonic ? "bg-amber-50/40 dark:bg-amber-950/10" :
    isClear ? "bg-emerald-50/30 dark:bg-emerald-950/10" : "";

  return (
    <div className={cn("border-b border-border/40 last:border-b-0", rowBg)}>
      <div className="flex items-center gap-2 px-3 py-1.5">
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <button onClick={() => onSelect?.(name)} className="text-[11px] font-medium text-foreground truncate hover:text-primary hover:underline underline-offset-2 transition-colors text-left">
            {name}
          </button>
          {info.meridian && (
            <span className="text-[8px] font-semibold uppercase tracking-wider text-muted-foreground/50 shrink-0">{info.meridian}</span>
          )}
          {info.testingPosition && (
            <Popover>
              <PopoverTrigger asChild>
                <button className="shrink-0 text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                  <Info size={10} />
                </button>
              </PopoverTrigger>
              <PopoverContent side="right" className="w-64 p-2.5 text-[10px] leading-relaxed">
                <p className="font-medium text-foreground mb-1">{name}</p>
                <p className="text-muted-foreground">{info.testingPosition}</p>
                {info.description && <p className="text-muted-foreground/70 mt-1 italic">{info.description}</p>}
              </PopoverContent>
            </Popover>
          )}
        </div>

        {isLateralized ? (
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1">
              <span className="text-[7px] font-bold text-muted-foreground/50 w-3">L</span>
              <StatusButton status="Inhibited" current={statusL} onClick={() => onUpdate('muscles', name, statusL === 'Inhibited' ? null : 'Inhibited', 'L')} side="L" />
              <StatusButton status="Hypertonic" current={statusL} onClick={() => onUpdate('muscles', name, statusL === 'Hypertonic' ? null : 'Hypertonic', 'L')} side="L" />
              <StatusButton status="Clear" current={statusL} onClick={() => onUpdate('muscles', name, statusL === 'Clear' ? null : 'Clear', 'L')} side="L" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[7px] font-bold text-muted-foreground/50 w-3">R</span>
              <StatusButton status="Inhibited" current={statusR} onClick={() => onUpdate('muscles', name, statusR === 'Inhibited' ? null : 'Inhibited', 'R')} side="R" />
              <StatusButton status="Hypertonic" current={statusR} onClick={() => onUpdate('muscles', name, statusR === 'Hypertonic' ? null : 'Hypertonic', 'R')} side="R" />
              <StatusButton status="Clear" current={statusR} onClick={() => onUpdate('muscles', name, statusR === 'Clear' ? null : 'Clear', 'R')} side="R" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1 shrink-0">
            <StatusButton status="Inhibited" current={statusMidline} onClick={() => onUpdate('muscles', name, statusMidline === 'Inhibited' ? null : 'Inhibited')} />
            <StatusButton status="Hypertonic" current={statusMidline} onClick={() => onUpdate('muscles', name, statusMidline === 'Hypertonic' ? null : 'Hypertonic')} />
            <StatusButton status="Clear" current={statusMidline} onClick={() => onUpdate('muscles', name, statusMidline === 'Clear' ? null : 'Clear')} />
          </div>
        )}
      </div>
    </div>
  );
};

export function MuscleAssessment({
  priorityPattern,
  updatePriorityPattern,
  showImages,
  compactMode
}: {
  priorityPattern?: string | null;
  updatePriorityPattern: (category: string, itemName: string, status: 'Clear' | 'Inhibited' | 'Hypertonic' | null, side?: 'L' | 'R') => Promise<void>;
  showImages: boolean;
  compactMode?: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [customImages, setCustomImages] = useState<Record<string, string | null>>({});
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);

  const pattern = useMemo(() => safeParse(priorityPattern, {} as any), [priorityPattern]);
  const musclePattern = pattern.muscles || {};

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase.from('muscle_customizations').select('muscle_name, image_url').eq('user_id', user.id);
        const mapping: Record<string, string | null> = {};
        data?.forEach(item => {
          mapping[item.muscle_name] = item.image_url;
        });
        setCustomImages(mapping);
      } catch (err) {
        console.error("Error fetching muscle images:", err);
      }
    };
    fetchImages();
  }, []);

  const filteredGroups = useMemo(() => {
    const filtered: Record<string, string[]> = {};
    Object.entries(MUSCLE_GROUPS).forEach(([group, muscles]) => {
      const matchingMuscles = muscles.filter(m =>
        m.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (matchingMuscles.length > 0) filtered[group] = matchingMuscles;
    });
    return filtered;
  }, [searchQuery]);

  // Progress counts
  const progress = useMemo(() => {
    let total = 0, assessed = 0, inhibited = 0, hypertonic = 0, clear = 0;
    Object.values(MUSCLE_GROUPS).flat().forEach((m) => {
      const isLat = !MIDLINE_MUSCLES.includes(m);
      if (isLat) {
        total += 2;
        const sL = musclePattern[`${m} (L)`];
        const sR = musclePattern[`${m} (R)`];
        if (sL) { assessed++; if (sL === 'Inhibited' || sL === 'Inhibition') inhibited++; else if (sL === 'Hypertonic') hypertonic++; else if (sL === 'Clear' || sL === 'Normotonic') clear++; }
        if (sR) { assessed++; if (sR === 'Inhibited' || sR === 'Inhibition') inhibited++; else if (sR === 'Hypertonic') hypertonic++; else if (sR === 'Clear' || sR === 'Normotonic') clear++; }
      } else {
        total += 1;
        const s = musclePattern[m];
        if (s) { assessed++; if (s === 'Inhibited' || s === 'Inhibition') inhibited++; else if (s === 'Hypertonic') hypertonic++; else if (s === 'Clear' || s === 'Normotonic') clear++; }
      }
    });
    return { total, assessed, remaining: total - assessed, inhibited, hypertonic, clear };
  }, [musclePattern]);

  return (
    <>
      {/* Progress summary */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-2.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Progress</span>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="text-foreground font-medium">{progress.assessed}<span className="text-muted-foreground/50">/{progress.total}</span></span>
          <span className="text-muted-foreground/40">·</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-500" />{progress.inhibited}</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" />{progress.hypertonic}</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" />{progress.clear}</span>
          {progress.remaining > 0 && (
            <>
              <span className="text-muted-foreground/40">·</span>
              <span className="text-muted-foreground/60">{progress.remaining} untested</span>
            </>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search muscles..."
          className="pl-8 h-8 rounded-lg border-border bg-card text-[11px]"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Muscle table */}
      <div className="rounded-xl border border-border/60 overflow-hidden">
        <div className="grid grid-cols-[1fr_auto] gap-0">
          {Object.entries(filteredGroups).map(([group, muscles]) => (
            <div key={group} className="contents">
              <div className="col-span-2 px-3 py-2 bg-muted/40 border-b border-border/40">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">{group}</span>
              </div>
              {muscles.map(muscle => (
                <MuscleRow
                  key={muscle}
                  name={muscle}
                  statusL={musclePattern[`${muscle} (L)`]}
                  statusR={musclePattern[`${muscle} (R)`]}
                  statusMidline={musclePattern[muscle]}
                  isLateralized={!MIDLINE_MUSCLES.includes(muscle)}
                  info={getMuscleInfo(muscle)}
                  onUpdate={updatePriorityPattern}
                  onSelect={setSelectedMuscle}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

    <MuscleInfoModal
      muscleName={selectedMuscle}
      open={!!selectedMuscle}
      onOpenChange={(open) => { if (!open) setSelectedMuscle(null); }}
    />
    </>
  );
}