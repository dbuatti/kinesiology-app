import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Flag, Pause, Play, RotateCcw, Star, Timer } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PATHWAY_DIRECTION } from "@/lib/pathway-direction";
import type { FindingPriority } from "@/components/crm/v2/v2-utils";
import { getPathwayById } from "@/data/pathway-logic-data";
import {
  BRAIN_ZONES,
  EMOTION_NOTES,
  EMOTIONS,
  EYE_POSITIONS,
  PROTOCOL_FIELDS,
  SHIFT_SIGNS,
  allowedValuesFor,
  formatZone,
  hasValue,
  isMidlineZone,
  isZoneValue,
  organPairFor,
  type BrainCategory,
  type ProtocolField,
  type ZoneValue,
} from "@/data/protocol-log";
import {
  PATHWAY_SHORT_LABEL,
  type ReflexCorrection,
  type ReflexCorrectionDirection,
  type ReflexCorrectionPathway,
} from "./types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  side?: "L" | "R";
  direction: ReflexCorrectionDirection;
  pathway: ReflexCorrectionPathway;
  isPriority: boolean;
  priorityTier?: FindingPriority | null;
  correction?: ReflexCorrection | null;
  onApply: (correction: ReflexCorrection) => void | Promise<void>;
  reflexName?: string;
}

const pill = "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium";

function fieldVisible(field: ProtocolField, values: Record<string, unknown>) {
  if (!field.showWhen) return true;
  const parent = values[field.showWhen.field];
  if (field.showWhen.truthy) return hasValue(parent);
  if (field.showWhen.equals) return field.showWhen.equals.includes(String(parent ?? ""));
  return true;
}

function ZoneField({
  field,
  value,
  onChange,
  autoFocus,
}: {
  field: Extract<ProtocolField, { kind: "zone" }>;
  value: ZoneValue | null;
  onChange: (v: ZoneValue | null) => void;
  autoFocus?: boolean;
}) {
  const categories: BrainCategory[] = field.lockedCategory ? [field.lockedCategory] : ["Cortical", "Subcortical"];
  const [category, setCategory] = useState<BrainCategory>(value?.category ?? field.lockedCategory ?? "Cortical");
  useEffect(() => {
    if (value?.category) setCategory(value.category);
    else if (field.lockedCategory) setCategory(field.lockedCategory);
  }, [value?.category, field.lockedCategory]);

  const zones = BRAIN_ZONES[category] ?? [];
  const selectedName = value?.name ?? "";
  const midline = isMidlineZone(selectedName);
  const side = midline ? null : value?.side ?? null;

  const setZone = (name: string) => {
    const m = isMidlineZone(name);
    onChange({ category, name, side: m ? null : value?.side ?? "L" });
  };
  const setSide = (s: "L" | "R" | null) => {
    if (!selectedName || isMidlineZone(selectedName)) return;
    onChange({ category, name: selectedName, side: s });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">{field.label}</span>
        {field.hint && <span className="text-[10px] text-muted-foreground/60">{field.hint}</span>}
      </div>
      {!field.lockedCategory && (
        <div className="flex gap-1.5">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => { setCategory(c); if (value && value.category !== c) onChange(null); }}
              className={cn(
                "rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors",
                category === c ? "border-primary/30 bg-primary/10 text-primary-strong dark:text-primary" : "border-border/60 text-muted-foreground hover:bg-muted/50"
              )}
            >
              {c}
            </button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
        {zones.map((z) => {
          const active = selectedName === z;
          return (
            <button
              key={z}
              type="button"
              autoFocus={autoFocus && !selectedName && z === zones[0]}
              onClick={() => setZone(z)}
              className={cn(
                "rounded-md border px-2.5 py-1.5 text-left text-[12px] transition-colors",
                active ? "border-primary/30 bg-primary/10 text-foreground" : "border-border/50 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              )}
            >
              {z}
            </button>
          );
        })}
      </div>
      {selectedName && !midline && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground/60">Side</span>
          {(["L", "R"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSide(s)}
              className={cn(
                "h-7 min-w-[36px] rounded-md border px-2 text-[11px] font-semibold transition-colors",
                side === s ? "border-primary/30 bg-primary/10 text-primary-strong dark:text-primary" : "border-border/60 text-muted-foreground hover:bg-muted/50"
              )}
            >
              {s}
            </button>
          ))}
          <span className="text-[10px] text-muted-foreground/50">Bilateral not needed — pick tested side</span>
        </div>
      )}
      {selectedName && midline && (
        <p className="text-[11px] text-muted-foreground/60">Midline zone — no side.</p>
      )}
    </div>
  );
}

function ChipsField({
  field,
  value,
  onChange,
  parentValue,
}: {
  field: Extract<ProtocolField, { kind: "chips" }>;
  value: unknown;
  onChange: (v: unknown) => void;
  parentValue?: unknown;
}) {
  const options = field.dependsOn && field.optionsByValue ? (field.optionsByValue[String(parentValue ?? "")] ?? []) : field.options;
  const selected = field.multiple ? (Array.isArray(value) ? value.map(String) : []) : (typeof value === "string" ? value : "");
  if (field.dependsOn && options.length === 0) return null;

  const toggle = (opt: string) => {
    if (field.multiple) {
      const arr = Array.isArray(value) ? value.map(String) : [];
      onChange(arr.includes(opt) ? arr.filter((x) => x !== opt) : [...arr, opt]);
    } else {
      onChange(selected === opt ? "" : opt);
    }
  };

  return (
    <div className="space-y-2">
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">{field.label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = field.multiple ? (selected as string[]).includes(opt) : selected === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={cn(
                "rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors",
                active ? "border-primary/30 bg-primary/10 text-primary-strong dark:text-primary" : "border-border/60 text-muted-foreground hover:bg-muted/50"
              )}
            >
              {field.multiple && active && <Check size={10} className="mr-1 inline" />}
              {opt}
            </button>
          );
        })}
      </div>
      {!field.multiple && typeof selected === "string" && selected && field.optionNotes?.[selected] && (
        <p className="text-[11px] text-muted-foreground/70">{field.optionNotes[selected]}</p>
      )}
    </div>
  );
}

function FieldRenderer({
  field,
  value,
  onChange,
  values,
}: {
  field: ProtocolField;
  value: unknown;
  onChange: (v: unknown) => void;
  values: Record<string, unknown>;
}) {
  if (!fieldVisible(field, values)) return null;
  const parentValue = "dependsOn" in field && field.dependsOn ? values[field.dependsOn] : undefined;

  if (field.kind === "zone") {
    return <ZoneField field={field} value={isZoneValue(value) ? value : null} onChange={onChange} autoFocus={field.id === "zone1"} />;
  }
  if (field.kind === "chips") {
    return <ChipsField field={field} value={value} onChange={onChange} parentValue={parentValue} />;
  }
  if (field.kind === "organ") {
    const organs = organPairFor(parentValue);
    if (organs.length === 0) return <p className="text-[11px] text-muted-foreground/60">Select an emotion first.</p>;
    return (
      <div className="space-y-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">{field.label}</span>
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {organs.map((o) => {
            const active = value === o.name;
            return (
              <button key={o.id} type="button" onClick={() => onChange(active ? "" : o.name)} className={cn("rounded-md border px-2.5 py-2 text-left transition-colors", active ? "border-primary/30 bg-primary/10" : "border-border/50 hover:bg-muted/40")}>
                <div className="text-[12px] font-medium text-foreground">{o.name}</div>
                <div className="text-[10px] text-muted-foreground/70">{o.element} · {o.pulse} · {o.depth}</div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }
  if (field.kind === "text" || field.kind === "longtext") {
    const C = field.kind === "longtext" ? Textarea : Input;
    return (
      <label className="block space-y-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">{field.label}</span>
        <C value={typeof value === "string" ? value : ""} onChange={(e: any) => onChange(e.target.value)} rows={field.kind === "longtext" ? field.rows ?? 2 : undefined} placeholder={field.placeholder} className="text-[13px]" />
      </label>
    );
  }
  if (field.kind === "number") {
    return (
      <label className="block space-y-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">{field.label}</span>
        <Input type="number" min={field.min} max={field.max} value={typeof value === "number" ? value : value === "" || value == null ? "" : Number(value)} onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))} className="text-[13px] w-28" />
      </label>
    );
  }
  if (field.kind === "toggle") {
    const checked = !!value;
    return (
      <button type="button" onClick={() => onChange(!checked)} className={cn("flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-[12px] transition-colors", checked ? "border-primary/30 bg-primary/10 text-foreground" : "border-border/50 text-muted-foreground hover:bg-muted/40")}>
        <span className={cn("flex h-4 w-4 items-center justify-center rounded border", checked ? "border-primary bg-primary text-primary-foreground" : "border-border/70")}>{checked && <Check size={10} strokeWidth={3} />}</span>
        {field.label}
      </button>
    );
  }
  if (field.kind === "status") {
    return (
      <div className="space-y-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">{field.label}</span>
        <div className="flex flex-wrap gap-1.5">
          {field.options.map((opt) => {
            const active = value === opt.value;
            const tone = opt.tone === "success" ? "border-primary/30 bg-primary/10 text-primary-strong dark:text-primary" : opt.tone === "danger" ? "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300" : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300";
            return <button key={opt.value} type="button" onClick={() => onChange(active ? "" : opt.value)} className={cn("rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors", active ? tone : "border-border/60 text-muted-foreground hover:bg-muted/50")}>{opt.value}</button>;
          })}
        </div>
      </div>
    );
  }
  if (field.kind === "eye") {
    return (
      <div className="space-y-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">{field.label}</span>
        <div className="grid grid-cols-3 gap-1.5">
          {EYE_POSITIONS.map((p) => {
            const active = value === p.label;
            return <button key={p.label} type="button" title={`${p.full}: ${p.desc}`} onClick={() => onChange(active ? "" : p.label)} className={cn("rounded-md border px-2 py-1.5 text-[10px] font-medium transition-colors", active ? "border-primary/30 bg-primary/10 text-primary-strong dark:text-primary" : "border-border/60 text-muted-foreground hover:bg-muted/50")}>{p.label}</button>;
          })}
        </div>
      </div>
    );
  }
  if (field.kind === "polarity") {
    const opts = ["IN", "OUT"];
    return (
      <div className="space-y-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">{field.label}</span>
        <div className="flex gap-1.5">{opts.map((o) => <button key={o} type="button" onClick={() => onChange(value === o ? "" : o)} className={cn("rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors", value === o ? "border-primary/30 bg-primary/10 text-primary-strong dark:text-primary" : "border-border/60 text-muted-foreground hover:bg-muted/50")}>{o}</button>)}</div>
      </div>
    );
  }
  return null;
}

function guidanceFor(pathway: ReflexCorrectionPathway, direction: ReflexCorrectionDirection) {
  if (pathway === "cortical") return "Identify the primary cortical brain zone, then select a second brain zone (cortical or subcortical). Tap, hold, or use tuning fork on both points.";
  if (pathway === "subcortical") return "Identify the primary subcortical brain zone, then select a second brain zone (cortical or subcortical). Apply correction while tracking both zones.";
  if (pathway === "emotional") return "Work through the emotional stress release sequence. Record only what you tested; leave unknown fields blank.";
  if (direction === "afferent") return "Identify the afferent driver, apply the correction, and re-test the indicator.";
  return "Apply the correction and re-test.";
}

export function ReflexCorrectionModal({
  open,
  onOpenChange,
  itemName,
  reflexName,
  side,
  direction,
  pathway,
  isPriority,
  priorityTier = isPriority ? "priority" : null,
  correction,
  onApply,
}: Props) {
  const displayName = itemName ?? reflexName ?? "";
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState<number | null>(null);
  const [timerRemaining, setTimerRemaining] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef<number | null>(null);
  const timerEndRef = useRef<number | null>(null);

  useEffect(() => {
    if (open) {
      const details = (correction?.details ?? {}) as Record<string, unknown>;
      setValues(details);
      setNote(correction?.note ?? "");
      const mins = typeof details.correctionTimerMinutes === "number" ? details.correctionTimerMinutes : null;
      const rem = typeof details.correctionTimerRemainingSeconds === "number" ? details.correctionTimerRemainingSeconds : mins ? mins * 60 : 0;
      setTimerMinutes(mins);
      setTimerRemaining(rem);
      setTimerRunning(false);
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
      timerEndRef.current = null;
    }
  }, [open, pathway, direction, displayName, side, correction]);

  useEffect(() => () => { if (timerRef.current) window.clearInterval(timerRef.current); }, []);

  useEffect(() => {
    if (!timerRunning || timerRemaining <= 0) return;
    timerEndRef.current = Date.now() + timerRemaining * 1000;
    timerRef.current = window.setInterval(() => {
      const end = timerEndRef.current;
      if (!end) return;
      const left = Math.max(0, Math.round((end - Date.now()) / 1000));
      setTimerRemaining(left);
      if (left <= 0) {
        if (timerRef.current) window.clearInterval(timerRef.current);
        timerRef.current = null;
        timerEndRef.current = null;
        setTimerRunning(false);
      }
    }, 250);
    return () => { if (timerRef.current) window.clearInterval(timerRef.current); timerRef.current = null; };
  }, [timerRunning]);

  const startTimer = (mins: number) => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    setTimerMinutes(mins);
    setTimerRemaining(mins * 60);
    setTimerRunning(true);
  };
  const pauseTimer = () => { setTimerRunning(false); if (timerRef.current) window.clearInterval(timerRef.current); timerRef.current = null; };
  const resumeTimer = () => { if (timerRemaining > 0) setTimerRunning(true); };
  const resetTimer = () => { pauseTimer(); setTimerRemaining(timerMinutes ? timerMinutes * 60 : 0); };
  const fmtTimer = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const pathwayMeta = useMemo(() => getPathwayById(pathway as never), [pathway]);
  const fields = PROTOCOL_FIELDS[pathway] ?? [];

  const setField = (id: string, v: unknown) => {
    setValues((prev) => {
      const next = { ...prev, [id]: v };
      if (id === "method" && typeof v === "string") {
        const m = v.match(/^(\d+) min$/);
        if (m) {
          startTimer(Number(m[1]));
        } else if (v && timerMinutes) {
          pauseTimer();
          setTimerMinutes(null);
          setTimerRemaining(0);
        }
      }
      for (const f of fields) {
        if ("dependsOn" in f && f.dependsOn === id) next[f.id] = f.kind === "chips" && f.multiple ? [] : "";
      }
      return next;
    });
  };

  const apply = async () => {
    setSaving(true);
    try {
      const details: Record<string, unknown> = {};
      for (const f of fields) {
        const v = values[f.id];
        if (hasValue(v)) details[f.id] = v;
      }
      if (timerMinutes) {
        details.correctionTimerMinutes = timerMinutes;
        details.correctionTimerRemainingSeconds = timerRemaining;
        details.correctionTimerCompleted = timerRemaining === 0;
      }
      await onApply({
        id: correction?.id ?? crypto.randomUUID(),
        pathway,
        direction,
        holding: correction?.holding ?? true,
        note: note.trim() || undefined,
        details: Object.keys(details).length ? details : undefined,
        createdAt: correction?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const DirIcon = PATHWAY_DIRECTION[direction].Icon;
  const visibleFields = fields.filter((f) => fieldVisible(f, values));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden p-0">
        <div className="border-b border-border/60 px-5 py-4 pr-12">
          <p className={cn("flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em]", PATHWAY_DIRECTION[direction].strong)}>
            <DirIcon size={13} />
            {PATHWAY_DIRECTION[direction].label} correction
          </p>
          <h2 className="mt-1 font-serif text-[20px] font-medium tracking-[-0.01em] text-foreground">
            {displayName}{side ? ` (${side})` : ""}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={cn(pill, PATHWAY_DIRECTION[direction].tint)}>{PATHWAY_SHORT_LABEL[pathway]}</span>
            {isPriority && (
              <span className={cn(pill, "px-1.5", priorityTier === "primary" ? "bg-gold/15 border-gold/40 text-gold-strong dark:text-gold" : "bg-primary/10 border-primary/25 text-primary-strong dark:text-primary")} title={priorityTier === "primary" ? "Primary priority" : "Priority"}>
                {priorityTier === "primary" ? <Star size={10} fill="currentColor" /> : <Flag size={10} />}
              </span>
            )}
          </div>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-4">
          <p className="text-[12px] leading-relaxed text-muted-foreground">{guidanceFor(pathway, direction)}</p>

          {visibleFields.length > 0 ? (
            <div className="space-y-4">
              {visibleFields.map((field) => (
                <FieldRenderer key={field.id} field={field} value={values[field.id]} onChange={(v) => setField(field.id, v)} values={values} />
              ))}
            </div>
          ) : pathwayMeta?.protocols?.length ? (
            <ol className="space-y-3">
              {pathwayMeta.protocols.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">{i + 1}</span>
                  <p className="text-[13px] leading-relaxed text-foreground/90">{step}</p>
                </li>
              ))}
            </ol>
          ) : null}

          {timerMinutes && (
            <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Timer size={14} className="text-muted-foreground" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">Timer</span>
                </div>
                <span className={cn("text-[12px] font-semibold tabular-nums", timerRemaining === 0 ? "text-primary-strong" : "text-foreground")}>{timerRemaining === 0 ? "Done" : fmtTimer(timerRemaining)}</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {timerRemaining > 0 && (
                  <button type="button" onClick={timerRunning ? pauseTimer : resumeTimer} className="inline-flex items-center gap-1 rounded-md border border-border/60 px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted/50">
                    {timerRunning ? <Pause size={11} /> : <Play size={11} />} {timerRunning ? "Pause" : "Resume"}
                  </button>
                )}
                <button type="button" onClick={resetTimer} className="inline-flex items-center gap-1 rounded-md border border-border/60 px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted/50">
                  <RotateCcw size={11} /> Reset
                </button>
              </div>
            </div>
          )}

          <label className="block">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">Note</span>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="mt-2 rounded-lg text-[13px]" placeholder="Optional clinical note..." />
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border/60 px-5 py-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={apply} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary-hover">{saving ? "Saving..." : correction ? "Save correction" : "Apply correction"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
