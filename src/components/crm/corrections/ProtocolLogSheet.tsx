import { useEffect, useState, type ChangeEvent, type KeyboardEvent } from "react";
import {
  ArrowDownLeft,
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpLeft,
  ArrowUpRight,
  Check,
  Minus,
  Plus,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BRAIN_ZONES,
  EYE_POSITIONS,
  PROTOCOL_STEP_MAP,
  allowedValuesFor,
  formatZonePair,
  isZoneValue,
  organPairFor,
  type BrainCategory,
  type Element,
  type OrganOption,
  type ProtocolField,
  type ProtocolLog,
  type ProtocolLogPatch,
  type StatusField,
  type ZoneValue,
} from "@/data/protocol-log";

interface ProtocolLogSheetProps {
  processId: string;
  fields: ProtocolField[];
  log?: ProtocolLog;
  /** Omitted in reference-only hosts (Library) — the sheet then renders nothing. */
  onChange?: (patch: ProtocolLogPatch) => void;
  /** Section caption for the multi-section Heart Wall panel. */
  heading?: string;
  /** Only render the fields mapped to this instruction step (1-based). */
  step?: number;
  /** Only render the fields with no mapped step (notes, context). */
  unassigned?: boolean;
  /** Inline drops the card chrome so the fields can sit inside a step. */
  variant?: "card" | "inline";
}

const hasValue = (value: unknown) =>
  Array.isArray(value) ? value.length > 0 : value !== null && value !== undefined && value !== "";

/** Progressive disclosure: only render a field once its parent is answered. */
const isVisible = (field: ProtocolField, values: Record<string, unknown>) => {
  const when = field.showWhen;
  if (!when) return true;
  const parent = values[when.field];
  if (when.truthy) return Boolean(parent);
  if (when.equals) return when.equals.includes(String(parent ?? ""));
  return true;
};

/** The spine of a correction, read back in one line. */
const logSummary = (values: Record<string, unknown>) =>
  [values.emotion, values.organ, values.polarity, values.shift, values.retest]
    .flatMap((v) => (Array.isArray(v) ? v : hasValue(v) ? [v] : []))
    .map(String);

const hasLogData = (log?: ProtocolLog) =>
  Object.values(log?.values ?? {}).some(hasValue) || (log?.steps?.length ?? 0) > 0;

/**
 * The writable half of a protocol page. Every control writes straight through
 * to the appointment, so a muscle test result is never lost between phases.
 *
 * Fields can be scoped to an instruction step (`step`) and rendered without
 * card chrome (`inline`), which lets the record live under the step itself.
 */
const ProtocolLogSheet = ({
  processId,
  fields,
  log,
  onChange,
  heading,
  step,
  unassigned,
  variant = "card",
}: ProtocolLogSheetProps) => {
  const values = log?.values ?? {};

  if (!onChange) return null;

  const mapped = PROTOCOL_STEP_MAP[processId] ?? {};
  const scoped = fields.filter((f) =>
    step != null ? mapped[f.id] === step : unassigned ? mapped[f.id] == null : true
  );
  const visibleFields = scoped.filter((f) => isVisible(f, values));
  if (visibleFields.length === 0) return null;

  const inline = variant === "inline";

  const setField = (fieldId: string, value: unknown) => {
    // Functional so two controls edited in the same tick don't clobber
    // each other through a stale `values` snapshot.
    onChange((previous) => {
      const next: Record<string, unknown> = { ...(previous.values ?? {}), [fieldId]: value };

      // A changed parent invalidates children (emotion → organ pair).
      fields.forEach((f) => {
        if (f.kind === "text" || f.kind === "number" || f.kind === "longtext") return;
        if (!("dependsOn" in f) || f.dependsOn !== fieldId) return;
        const allowed = allowedValuesFor(f, value);
        const current = next[f.id];
        if (hasValue(current) && !allowed.includes(String(current))) next[f.id] = null;
      });

      // A field that just got re-hidden (upload unchecked) drops its answer so
      // the summary never claims a re-test that is no longer on screen.
      fields.forEach((f) => {
        if (f.showWhen?.field === fieldId && !isVisible(f, next)) next[f.id] = null;
      });

      return { values: next };
    });
  };

  const zonePair = fields.some((f) => f.id === "zone2")
    ? formatZonePair(values.zone1 as ZoneValue, values.zone2 as ZoneValue)
    : null;

  /** Chips that depend on another field only offer what that field allows. */
  const optionsFor = (field: Extract<ProtocolField, { kind: "chips" }>) => {
    if (!field.dependsOn || !field.optionsByValue) return field.options;
    const parent = values[field.dependsOn];
    if (!parent) return [];
    return field.optionsByValue[String(parent)] ?? [];
  };

  const renderField = (field: ProtocolField) => {
    // Inline single-field steps don't need a label — the step text is the
    // label. Multi-field steps keep captions so the controls stay distinct.
    const showLabel = field.kind !== "toggle" && (!inline || visibleFields.length > 1);

    return (
      <div
        key={field.id}
        className={cn(
          inline ? "space-y-1" : "space-y-1.5 px-3 py-2.5",
          field.kind === "eye" && "space-y-2"
        )}
      >
        {showLabel ? (
          <div className="flex items-baseline justify-between gap-2">
            <p
              className={cn(
                "font-semibold text-foreground/80",
                inline
                  ? "text-[9px] uppercase tracking-wide text-muted-foreground"
                  : "text-[10px]"
              )}
            >
              {field.label}
            </p>
            {field.hint && (
              <p className="shrink-0 text-[9px] text-muted-foreground/70">{field.hint}</p>
            )}
          </div>
        ) : (
          field.hint && <p className="text-[9px] text-muted-foreground/70">{field.hint}</p>
        )}

        {field.kind === "chips" && (
          <ChipsControl
            options={optionsFor(field)}
            value={values[field.id] as string | string[] | null | undefined}
            note={field.optionNotes}
            multiple={field.multiple}
            emphasis={field.emphasis}
            emptyHint={
              field.dependsOn && !values[field.dependsOn]
                ? `Pick ${field.dependsOn} first`
                : field.emptyHint
            }
            onChange={(v) => setField(field.id, v)}
          />
        )}

        {field.kind === "organ" && (
          <OrganControl
            organs={organPairFor(values[field.dependsOn ?? "emotion"])}
            value={values[field.id] as string | null | undefined}
            onChange={(v) => setField(field.id, v)}
          />
        )}

        {field.kind === "eye" && (
          <EyeControl
            value={values[field.id] as string | null | undefined}
            onChange={(v) => setField(field.id, v)}
          />
        )}

        {field.kind === "polarity" && (
          <PolarityControl
            value={values[field.id] as string | null | undefined}
            onChange={(v) => setField(field.id, v)}
          />
        )}

        {field.kind === "status" && (
          <StatusControl
            field={field}
            value={values[field.id] as string | null | undefined}
            onChange={(v) => setField(field.id, v)}
          />
        )}

        {field.kind === "zone" && (
          <ZoneControl
            value={isZoneValue(values[field.id]) ? (values[field.id] as ZoneValue) : null}
            lockedCategory={field.lockedCategory}
            onChange={(v) => setField(field.id, v)}
          />
        )}

        {field.kind === "toggle" && (
          <ToggleControl
            label={field.label}
            emphasis={field.emphasis}
            checked={Boolean(values[field.id])}
            onChange={(v) => setField(field.id, v)}
          />
        )}

        {field.kind === "text" && (
          <DraftInput
            value={values[field.id] as string | undefined}
            placeholder={field.placeholder}
            onCommit={(v) => setField(field.id, v)}
          />
        )}

        {field.kind === "longtext" && (
          <DraftInput
            multiline
            rows={field.rows ?? 2}
            value={values[field.id] as string | undefined}
            placeholder={field.placeholder}
            onCommit={(v) => setField(field.id, v)}
          />
        )}

        {field.kind === "number" && (
          <DraftInput
            numeric
            value={values[field.id] as number | undefined}
            suffix={field.suffix}
            onCommit={(v) => {
              const n =
                v === ""
                  ? null
                  : Math.min(
                      field.max ?? Number.MAX_SAFE_INTEGER,
                      Math.max(field.min ?? 0, Number(v))
                    );
              setField(field.id, Number.isFinite(n as number) ? n : null);
            }}
          />
        )}
      </div>
    );
  };

  if (inline) {
    return (
      <div
        data-protocol-sheet={processId}
        data-step={step ?? "extra"}
        className="mt-2 space-y-2 rounded-lg border border-border/60 bg-card/60 px-2 py-1.5"
      >
        {visibleFields.map(renderField)}
      </div>
    );
  }

  return (
    <div data-protocol-sheet={processId} className="rounded-xl border border-border bg-muted/20">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-2 rounded-t-xl border-b border-border bg-muted/90 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-muted/75">
        <div className="min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
            {heading ?? "Log"}
          </p>
          {(zonePair || logSummary(values).length > 0) && (
            <p className="truncate text-[10px] font-semibold text-foreground/80">
              {logSummary(values).length > 0 ? logSummary(values).join(" · ") : zonePair}
            </p>
          )}
        </div>
        {hasLogData(log) && (
          <button
            type="button"
            onClick={() => onChange({ values: {}, steps: [] })}
            title={`Clear the ${processId} log`}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <RotateCcw size={12} />
          </button>
        )}
      </div>

      <div className="divide-y divide-border/60">{visibleFields.map(renderField)}</div>
    </div>
  );
};

/**
 * The record's own line, pinned above a process so the summary and reset stay
 * in reach while the fields live under their steps.
 */
export const ProtocolLogBar = ({
  processId,
  log,
  onChange,
  heading = "Log",
}: {
  processId: string;
  log?: ProtocolLog;
  onChange?: (patch: ProtocolLogPatch) => void;
  heading?: string;
}) => {
  if (!onChange) return null;
  const bits = logSummary(log?.values ?? {});

  return (
    <div className="sticky top-0 z-10 flex items-center justify-between gap-2 rounded-lg border border-border bg-card/95 px-2.5 py-1.5 shadow-xs backdrop-blur supports-[backdrop-filter]:bg-card/85">
      <p
        className="min-w-0 flex-1 truncate text-[10px]"
        title={bits.length > 0 ? bits.join(" · ") : undefined}
      >
        <span className="font-bold uppercase tracking-wider text-muted-foreground">{heading}</span>
        {bits.length > 0 && (
          <span className="ml-2 font-semibold text-foreground/80">{bits.join(" · ")}</span>
        )}
      </p>
      {hasLogData(log) && (
        <button
          type="button"
          onClick={() => onChange({ values: {}, steps: [] })}
          title={`Clear the ${processId} log`}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <RotateCcw size={12} />
        </button>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */

const ChipsControl = ({
  options,
  value,
  onChange,
  note,
  emptyHint,
  multiple,
  emphasis,
}: {
  options: string[];
  value?: string | string[] | null;
  onChange: (value: string | string[] | null) => void;
  note?: Record<string, string>;
  emptyHint?: string;
  multiple?: boolean;
  emphasis?: boolean;
}) => {
  const selected = Array.isArray(value) ? value : hasValue(value) ? [String(value)] : [];
  const caption = !multiple && selected.length === 1 ? note?.[selected[0]] : undefined;

  if (options.length === 0) {
    return emptyHint ? (
      <p className="text-[9px] text-muted-foreground/60">{emptyHint}</p>
    ) : null;
  }

  const toggle = (option: string) => {
    const active = selected.includes(option);
    if (!multiple) {
      onChange(active ? null : option);
      return;
    }
    const next = active ? selected.filter((v) => v !== option) : [...selected, option];
    onChange(next.length > 0 ? next : null);
  };

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap gap-1">
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(option)}
              className={cn(
                "flex items-center gap-1 rounded-md border font-medium transition-colors",
                emphasis
                  ? "min-h-10 px-3 py-2 text-[11px]"
                  : "px-2 py-1 text-[10px]",
                active
                  ? emphasis
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-primary/40 bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
              )}
            >
              {emphasis && active && <Check size={11} strokeWidth={3} />}
              {option}
            </button>
          );
        })}
      </div>
      {caption && <p className="text-[9px] leading-relaxed text-muted-foreground">{caption}</p>}
      {selected.length === 0 && emptyHint && (
        <p className="text-[9px] text-muted-foreground/60">{emptyHint}</p>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */

const ELEMENT_STYLE: Record<
  Element,
  { dot: string; idle: string; active: string }
> = {
  Wood: {
    dot: "bg-emerald-500",
    idle: "border-border bg-card hover:border-emerald-300 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30",
    active:
      "border-emerald-400 bg-emerald-50 ring-2 ring-emerald-500/20 dark:border-emerald-700 dark:bg-emerald-950/40",
  },
  Fire: {
    dot: "bg-rose-500",
    idle: "border-border bg-card hover:border-rose-300 hover:bg-rose-50/60 dark:hover:bg-rose-950/30",
    active:
      "border-rose-400 bg-rose-50 ring-2 ring-rose-500/20 dark:border-rose-700 dark:bg-rose-950/40",
  },
  Earth: {
    dot: "bg-amber-500",
    idle: "border-border bg-card hover:border-amber-300 hover:bg-amber-50/60 dark:hover:bg-amber-950/30",
    active:
      "border-amber-400 bg-amber-50 ring-2 ring-amber-500/20 dark:border-amber-700 dark:bg-amber-950/40",
  },
  Metal: {
    dot: "bg-slate-400",
    idle: "border-border bg-card hover:border-slate-300 hover:bg-slate-50/60 dark:hover:bg-slate-800/40",
    active:
      "border-slate-400 bg-slate-100 ring-2 ring-slate-400/20 dark:border-slate-600 dark:bg-slate-800/40",
  },
  Water: {
    dot: "bg-sky-500",
    idle: "border-border bg-card hover:border-sky-300 hover:bg-sky-50/60 dark:hover:bg-sky-950/30",
    active:
      "border-sky-400 bg-sky-50 ring-2 ring-sky-500/20 dark:border-sky-700 dark:bg-sky-950/40",
  },
};

const OrganControl = ({
  organs,
  value,
  onChange,
}: {
  organs: OrganOption[];
  value?: string | null;
  onChange: (value: string | null) => void;
}) => {
  if (organs.length === 0) {
    return <p className="text-[9px] text-muted-foreground/60">Pick primary emotion first</p>;
  }

  const selected = organs.find((o) => o.name === value);

  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-2 gap-1.5">
        {organs.map((organ) => {
          const active = organ.name === value;
          const tone = ELEMENT_STYLE[organ.element];
          return (
            <button
              key={organ.id}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(active ? null : organ.name)}
              className={cn(
                "relative flex min-h-12 flex-col items-start justify-center gap-0.5 rounded-xl border px-2.5 py-1.5 text-left transition-all",
                active ? tone.active : tone.idle
              )}
            >
              <span className="flex items-center gap-1.5">
                <span className={cn("h-1.5 w-1.5 rounded-full", tone.dot)} />
                <span className="text-[11px] font-bold text-foreground">{organ.name}</span>
              </span>
              <span className="text-[9px] text-muted-foreground">{organ.depth}</span>
              {active && (
                <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground animate-in zoom-in-50 duration-150">
                  <Check size={10} strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="rounded-lg border border-border/70 bg-card px-2.5 py-1.5">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
            {selected.pulse} · {selected.depth}
          </p>
          <p className="text-[10px] leading-relaxed text-muted-foreground">{selected.note}</p>
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */

const EYE_ICON: Record<string, typeof ArrowUpLeft> = {
  "Up & L": ArrowUpLeft,
  "Up & R": ArrowUpRight,
  "Horiz L": ArrowLeft,
  "Horiz R": ArrowRight,
  "Down & L": ArrowDownLeft,
  "Down & R": ArrowDownRight,
};

const EyeFace = ({ position }: { position?: (typeof EYE_POSITIONS)[number] }) => {
  const dx = (position?.dx ?? 0) * 2.6;
  const dy = (position?.dy ?? 0) * 2;

  return (
    <svg viewBox="0 0 120 140" className="h-full w-full" aria-hidden="true">
      <ellipse
        cx="60"
        cy="70"
        rx="33"
        ry="44"
        className="fill-card stroke-border"
        strokeWidth="1.5"
      />
      {[43, 77].map((cx) => (
        <g key={cx}>
          <ellipse
            cx={cx}
            cy="64"
            rx="9"
            ry="5.5"
            className="fill-muted stroke-border"
            strokeWidth="1"
          />
          <circle cx={cx + dx} cy={64 + dy} r="2.8" className="fill-current text-foreground/70" />
        </g>
      ))}
      <path d="M60 70v9l-3.5 3.5" fill="none" className="stroke-border" strokeWidth="1.2" />
      <path
        d="M51 95c4 2.5 14 2.5 18 0"
        fill="none"
        className="stroke-border"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
};

const EyeControl = ({
  value,
  onChange,
}: {
  value?: string | null;
  onChange: (value: string | null) => void;
}) => {
  const position = EYE_POSITIONS.find((p) => p.label === value);

  const eyeButton = (label: string) => {
    const Icon = EYE_ICON[label];
    const active = value === label;
    return (
      <button
        key={label}
        type="button"
        aria-pressed={active}
        title={EYE_POSITIONS.find((p) => p.label === label)?.cue}
        onClick={() => onChange(active ? null : label)}
        className={cn(
          "flex min-h-10 items-center justify-center gap-1 rounded-lg border px-1.5 text-[10px] font-semibold transition-all",
          active
            ? "border-primary bg-primary text-primary-foreground shadow-sm"
            : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
        )}
      >
        {Icon && <Icon size={11} />}
        {label}
      </button>
    );
  };

  const row = (labels: string[]) => labels.map(eyeButton);

  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-[1fr_76px_1fr] items-stretch gap-1.5">
        {row(["Up & L"])}
        <div className="row-span-3 flex items-center justify-center py-0.5">
          <EyeFace position={position} />
        </div>
        {row(["Up & R"])}
        {row(["Horiz L"])}
        {row(["Horiz R"])}
        {row(["Down & L"])}
        {row(["Down & R"])}
      </div>

      {position ? (
        <p className="rounded-lg border border-border/70 bg-card px-2 py-1.5 text-[9.5px] leading-relaxed">
          <span className="font-bold text-foreground">
            {position.full} · {position.cue}
          </span>{" "}
          <span className="text-muted-foreground">{position.desc}</span>
        </p>
      ) : (
        <p className="text-[9px] text-muted-foreground/60">
          Tap the direction the client's eyes moved.
        </p>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */

const POLARITY_OPTIONS = [
  {
    value: "IN (+)",
    icon: Plus,
    active:
      "border-emerald-400 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  {
    value: "OUT (−)",
    icon: Minus,
    active:
      "border-indigo-400 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500/20 dark:bg-indigo-950/40 dark:text-indigo-300",
  },
] as const;

const PolarityControl = ({
  value,
  onChange,
}: {
  value?: string | null;
  onChange: (value: string | null) => void;
}) => (
  <div className="grid grid-cols-2 gap-1.5">
    {POLARITY_OPTIONS.map((option) => {
      const active = value === option.value;
      const Icon = option.icon;
      return (
        <button
          key={option.value}
          type="button"
          aria-pressed={active}
          onClick={() => onChange(active ? null : option.value)}
          className={cn(
            "flex min-h-11 items-center justify-center gap-1.5 rounded-xl border text-[11px] font-bold transition-all",
            active
              ? option.active
              : "border-border bg-card text-muted-foreground hover:text-foreground"
          )}
        >
          <Icon size={13} strokeWidth={3} />
          Energy {option.value}
        </button>
      );
    })}
  </div>
);

/* ------------------------------------------------------------------ */

const TONE_ACTIVE: Record<StatusField["options"][number]["tone"], string> = {
  success: "border-emerald-500 bg-emerald-500 text-white shadow-sm",
  warning: "border-amber-400 bg-amber-400 text-amber-950 shadow-sm",
  danger: "border-rose-500 bg-rose-500 text-white shadow-sm",
};

const StatusControl = ({
  field,
  value,
  onChange,
}: {
  field: StatusField;
  value?: string | null;
  onChange: (value: string | null) => void;
}) => (
  <div
    className="grid gap-1.5"
    style={{ gridTemplateColumns: `repeat(${field.options.length}, minmax(0, 1fr))` }}
  >
    {field.options.map((option) => {
      const active = value === option.value;
      return (
        <button
          key={option.value}
          type="button"
          aria-pressed={active}
          onClick={() => onChange(active ? null : option.value)}
          className={cn(
            "min-h-10 rounded-lg border px-1.5 py-1 text-[10.5px] font-bold transition-all",
            active
              ? TONE_ACTIVE[option.tone]
              : "border-border bg-card text-muted-foreground hover:text-foreground"
          )}
        >
          {option.value}
        </button>
      );
    })}
  </div>
);

/* ------------------------------------------------------------------ */

const ToggleControl = ({
  label,
  checked,
  emphasis,
  onChange,
}: {
  label: string;
  checked: boolean;
  emphasis?: boolean;
  onChange: (value: boolean) => void;
}) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={cn(
      "flex w-full items-center gap-2 rounded-lg border text-left font-medium transition-colors",
      emphasis ? "min-h-11 px-3 py-2.5" : "px-2 py-1.5",
      checked
        ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
        : "border-border bg-card text-muted-foreground hover:text-foreground",
      emphasis && checked && "ring-2 ring-emerald-500/10"
    )}
  >
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded border",
        emphasis ? "h-5 w-5 border-2" : "h-3.5 w-3.5",
        checked
          ? "border-emerald-500 bg-emerald-500 text-white"
          : "border-muted-foreground/40"
      )}
    >
      {checked && (
        <Check
          size={emphasis ? 12 : 10}
          strokeWidth={3}
          className={emphasis ? "animate-in zoom-in-50 duration-200" : undefined}
        />
      )}
    </span>
    <span className={cn("flex-1", emphasis ? "text-[11px] font-semibold" : "text-[10px]")}>
      {label}
    </span>
    {emphasis && checked && (
      <span className="animate-in fade-in text-[9px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
        Anchored
      </span>
    )}
  </button>
);

/* ------------------------------------------------------------------ */

const ZoneControl = ({
  value,
  lockedCategory,
  onChange,
}: {
  value: ZoneValue | null;
  lockedCategory?: BrainCategory;
  onChange: (value: ZoneValue | null) => void;
}) => {
  const categories: BrainCategory[] = lockedCategory
    ? [lockedCategory]
    : ["Cortical", "Subcortical"];
  const category: BrainCategory = value?.category ?? lockedCategory ?? "Cortical";
  const zones = BRAIN_ZONES[category];

  const setCategory = (next: BrainCategory) => {
    if (next === category) return;
    onChange({ category: next, name: "", side: value?.side ?? "L" });
  };

  return (
    <div className="space-y-1.5">
      {!lockedCategory && (
        <div className="flex gap-1">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={cn(
                "rounded-md border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide transition-colors",
                category === c
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-stretch gap-1.5">
        <Select
          value={value?.name || undefined}
          onValueChange={(name) => onChange({ category, name, side: value?.side ?? "L" })}
        >
          <SelectTrigger className="h-8 flex-1 rounded-lg text-[11px]">
            <SelectValue placeholder="Choose zone…" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {zones.map((zone) => (
              <SelectItem key={zone} value={zone} className="text-[11px]">
                {zone}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex shrink-0 overflow-hidden rounded-lg border border-border">
          {(["L", "R"] as const).map((side) => (
            <button
              key={side}
              type="button"
              onClick={() => onChange({ category, name: value?.name ?? "", side })}
              className={cn(
                "w-7 text-[10px] font-bold transition-colors",
                value?.side === side
                  ? "bg-primary/10 text-primary"
                  : "bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              {side}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Text/number fields keep a local draft and commit on blur or Enter — one
 * write per edit instead of one per keystroke.
 */
const DraftInput = ({
  value,
  onCommit,
  placeholder,
  multiline,
  numeric,
  rows = 2,
  suffix,
}: {
  value?: string | number;
  onCommit: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  numeric?: boolean;
  rows?: number;
  suffix?: string;
}) => {
  const asText = value === undefined || value === null ? "" : String(value);
  const [draft, setDraft] = useState(asText);

  useEffect(() => {
    setDraft(asText);
  }, [asText]);

  const commit = () => {
    if (draft !== asText) onCommit(draft.trim());
  };

  const shared = {
    value: draft,
    placeholder,
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setDraft(e.target.value),
    onBlur: commit,
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === "Enter" && !multiline) {
        e.preventDefault();
        (e.target as HTMLElement).blur();
      }
    },
    className: "text-[11px] rounded-lg",
  };

  return (
    <div className="relative">
      {multiline ? (
        <Textarea {...shared} rows={rows} className={cn(shared.className, "resize-none")} />
      ) : (
        <Input
          {...shared}
          type={numeric ? "number" : "text"}
          inputMode={numeric ? "numeric" : undefined}
          className={cn(shared.className, suffix && "pr-8")}
        />
      )}
      {suffix && !multiline && (
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground">
          {suffix}
        </span>
      )}
    </div>
  );
};

export default ProtocolLogSheet;
