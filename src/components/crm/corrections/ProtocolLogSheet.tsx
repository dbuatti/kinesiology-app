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
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CaptionWithPulse, PulsePointPeek } from "@/components/crm/corrections/PulsePointPeek";
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
  hasValue,
  isMidlineZone,
  isZoneValue,
  organPairFor,
  summariseValues,
  type BrainCategory,
  type Element,
  type OrganOption,
  type ProtocolEntry,
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

/** Progressive disclosure: only render a field once its parent is answered. */
const isVisible = (field: ProtocolField, values: Record<string, unknown>) => {
  const when = field.showWhen;
  if (!when) return true;
  const parent = values[when.field];
  if (when.truthy) return Boolean(parent);
  if (when.equals) return when.equals.includes(String(parent ?? ""));
  return true;
};

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

  /** One line for the header — the same reader the saved list uses. */
  const summary = summariseValues(processId, values);

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
                  ? "text-[11px] uppercase tracking-wide text-muted-foreground"
                  : "text-[11px]"
              )}
            >
              {field.label}
            </p>
            {field.hint && (
              <p className="shrink-0 text-[10px] text-muted-foreground/70">{field.hint}</p>
            )}
          </div>
        ) : (
          field.hint && <p className="text-[10px] text-muted-foreground/70">{field.hint}</p>
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
        className="mt-2.5 space-y-2.5 rounded-xl border border-border/70 bg-muted/30 p-2.5"
      >
        {visibleFields.map(renderField)}
      </div>
    );
  }

  return (
    <div data-protocol-sheet={processId} className="rounded-xl border border-border bg-muted/20">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-2 rounded-t-xl border-b border-border bg-muted/90 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-muted/75">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {heading ?? "Log"}
          </p>
          {(zonePair || summary.length > 0) && (
            <p
              className="text-[11px] font-semibold leading-snug break-words text-foreground/80"
              title={summary.join(" · ")}
            >
              {summary.length > 0 ? summary.join(" · ") : zonePair}
            </p>
          )}
        </div>
        <ProtocolLogActions processId={processId} log={log} onChange={onChange} />
      </div>

      <ProtocolEntryList
        processId={processId}
        entries={log?.entries}
        onChange={onChange}
        className="border-b border-border/60"
      />

      <div className="divide-y divide-border/60">{visibleFields.map(renderField)}</div>
    </div>
  );
};

/* ------------------------------------------------------------------ */

/**
 * "Add another" + the list of corrections already banked for this process.
 *
 * A session often corrects two ligaments, three zones or three emotions. The
 * sheet keeps editing one live entry; this banks it and starts a fresh one, so
 * nothing is overwritten. Works on old logs that only ever had one entry.
 */
const ProtocolLogActions = ({
  processId,
  log,
  onChange,
}: {
  processId: string;
  log?: ProtocolLog;
  onChange: (patch: ProtocolLogPatch) => void;
}) => {
  const live = hasLogData(log);
  const savedCount = log?.entries?.length ?? 0;

  // Saved entries keep the buttons on screen even once the live form is empty,
  // so a second correction can always be started without hunting for the bar.
  if (!live && savedCount === 0) return null;

  const archive = () =>
    onChange((previous) => {
      const values = previous.values ?? {};
      const steps = previous.steps ?? [];
      if (!Object.values(values).some(hasValue) && steps.length === 0) return {};
      return {
        entries: [
          ...(previous.entries ?? []),
          {
            id: `entry-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            values,
            steps,
            savedAt: new Date().toISOString(),
          },
        ],
        values: {},
        steps: [],
      };
    });

  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        onClick={archive}
        disabled={!live}
        title="Save this correction and start a new one"
        className="flex h-6 items-center gap-1 rounded-md border border-border bg-card px-1.5 text-[10px] font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary-strong focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:bg-card disabled:hover:text-muted-foreground coarse:h-10 coarse:px-2.5 coarse:text-[12px]"
      >
        <Plus size={11} strokeWidth={3} />
        <span className="hidden sm:inline">Another</span>
      </button>
      <button
        type="button"
        onClick={() => onChange({ values: {}, steps: [] })}
        disabled={!live}
        title={`Clear the ${processId} log`}
        aria-label={`Clear the ${processId} log`}
        className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted-foreground coarse:h-10 coarse:w-10"
      >
        <RotateCcw size={12} />
      </button>
    </div>
  );
};

const ProtocolEntryList = ({
  processId,
  entries,
  onChange,
  className,
}: {
  processId: string;
  entries?: ProtocolEntry[];
  onChange: (patch: ProtocolLogPatch) => void;
  className?: string;
}) => {
  if (!entries?.length) return null;

  const remove = (id: string) =>
    onChange((previous) => ({
      entries: (previous.entries ?? []).filter((entry) => entry.id !== id),
    }));

  return (
    <div className={cn("px-1.5 py-1", className)}>
      <p className="px-1 pb-1 text-[9.5px] font-bold uppercase tracking-wider text-muted-foreground">
        Saved · {entries.length}
      </p>
      <ul className="max-h-28 space-y-px overflow-y-auto">
        {entries.map((entry, index) => {
          const bits = summariseValues(processId, entry.values);
          return (
            <li
              key={entry.id}
              className="group flex items-start gap-1.5 rounded-md px-1 py-0.5 transition-colors hover:bg-muted/60"
            >
              <span className="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold tabular-nums text-primary-strong">
                {index + 1}
              </span>
              {/* Two lines rather than an ellipsis: a saved correction is worth
                  reading in full when you check what you already did. */}
              <span
                className="line-clamp-2 min-w-0 flex-1 break-words text-[11px] leading-snug text-foreground/80"
                title={bits.join(" · ")}
              >
                {bits.join(" · ") || "Logged"}
              </span>
              <button
                type="button"
                onClick={() => remove(entry.id)}
                title="Delete this entry"
                aria-label={`Delete saved entry ${index + 1}`}
                className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive-strong focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/25 coarse:h-8 coarse:w-8"
              >
                <X size={11} />
              </button>
            </li>
          );
        })}
      </ul>
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
  const bits = summariseValues(processId, log?.values ?? {});
  const savedCount = log?.entries?.length ?? 0;

  return (
    <div className="sticky top-0 z-10 rounded-lg border border-border bg-card/95 shadow-xs backdrop-blur supports-[backdrop-filter]:bg-card/85">
      <div className="flex items-center justify-between gap-2 px-2.5 py-1.5">
        <p
          className="min-w-0 flex-1 truncate text-[11px]"
          title={bits.length > 0 ? bits.join(" · ") : undefined}
        >
          <span className="font-bold uppercase tracking-wider text-muted-foreground">{heading}</span>
          {savedCount > 0 && (
            <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9.5px] font-bold text-primary-strong">
              {savedCount} saved
            </span>
          )}
          {bits.length > 0 && (
            <span className="ml-2 font-semibold text-foreground/80">{bits.join(" · ")}</span>
          )}
        </p>
        <ProtocolLogActions processId={processId} log={log} onChange={onChange} />
      </div>
      <ProtocolEntryList
        processId={processId}
        entries={log?.entries}
        onChange={onChange}
        className="border-t border-border/60"
      />
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
      <p className="text-[10.5px] text-muted-foreground/60">{emptyHint}</p>
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
                "flex items-center gap-1 border font-medium transition-colors",
                emphasis
                  ? "min-h-11 px-3 py-2 text-[12px]"
                  : "px-2.5 py-1.5 text-[11px] rounded-lg",
                active
                  ? emphasis
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-primary/40 bg-primary/10 text-primary-strong"
                  : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
              )}
            >
              {emphasis && active && <Check size={11} strokeWidth={3} />}
              {option}
            </button>
          );
        })}
      </div>
      {caption && (
        <p className="text-[10.5px] leading-relaxed text-muted-foreground">
          <CaptionWithPulse caption={caption} />
        </p>
      )}
      {selected.length === 0 && emptyHint && (
        <p className="text-[10.5px] text-muted-foreground/60">{emptyHint}</p>
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
    return <p className="text-[10px] text-muted-foreground/60">Pick primary emotion first</p>;
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
              <span className="text-[10px] text-muted-foreground">{organ.depth}</span>
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
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            <PulsePointPeek pulse={selected.pulse}>{selected.pulse}</PulsePointPeek> · {selected.depth}
          </p>
          <p className="text-[11px] leading-relaxed text-muted-foreground">{selected.note}</p>
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
          "flex min-h-10 items-center justify-center gap-1 rounded-lg border px-1.5 text-[11px] font-semibold transition-all coarse:min-h-12 coarse:px-2 coarse:text-[12px]",
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
        <p className="text-[10px] text-muted-foreground/60">
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
            "flex min-h-11 items-center justify-center gap-1.5 rounded-xl border text-[11px] font-bold transition-all coarse:min-h-12 coarse:text-[12.5px]",
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
            "min-h-10 rounded-lg border px-1.5 py-1 text-[10.5px] font-bold transition-all coarse:min-h-12 coarse:px-1 coarse:text-[12px]",
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
      emphasis ? "min-h-11 px-3 py-2.5" : "px-2 py-1.5 coarse:min-h-11 coarse:px-3 coarse:py-2.5",
      checked
        ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
        : "border-border bg-card text-muted-foreground hover:text-foreground",
      emphasis && checked && "ring-2 ring-emerald-500/10"
    )}
  >
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded border",
        emphasis ? "h-5 w-5 border-2" : "h-3.5 w-3.5 coarse:h-5 coarse:w-5",
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
    <span
      className={cn(
        "flex-1",
        emphasis ? "text-[11px] font-semibold" : "text-[11px]",
        "coarse:text-[12.5px]"
      )}
    >
      {label}
    </span>
    {emphasis && checked && (
      <span className="animate-in fade-in text-[10px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
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
  const midline = isMidlineZone(value?.name);

  const setCategory = (next: BrainCategory) => {
    if (next === category) return;
    onChange({ category: next, name: "", side: value?.side ?? "L" });
  };

  const setZone = (name: string) => {
    // A midline structure has no side: store null so the log reads
    // "Hypothalamus", never "L · Hypothalamus".
    onChange({
      category,
      name,
      side: isMidlineZone(name) ? null : value?.side === "R" ? "R" : "L",
    });
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
                "rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition-colors coarse:min-h-9 coarse:px-2.5 coarse:py-1.5 coarse:text-[11.5px]",
                category === c
                  ? "border-primary/40 bg-primary/10 text-primary-strong"
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
          onValueChange={setZone}
        >
          <SelectTrigger className="h-8 flex-1 rounded-lg text-[11px] coarse:h-11 coarse:text-[16px]">
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

        {/* Fixed-width slot: L/R for paired structures, a quiet "Midline" tag
            for the ones that sit on the centre line. Never asks an impossible
            question, never makes the row jump. */}
        {midline ? (
          <div
            className="flex w-14 shrink-0 items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 coarse:w-16"
            title={`${value?.name} sits on the midline — no left/right side`}
          >
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Midline
            </span>
          </div>
        ) : (
          <div className="flex w-14 shrink-0 overflow-hidden rounded-lg border border-border coarse:w-16">
            {(["L", "R"] as const).map((side) => (
              <button
                key={side}
                type="button"
                onClick={() => onChange({ category, name: value?.name ?? "", side })}
                aria-pressed={value?.side === side}
                aria-label={`${side === "L" ? "Left" : "Right"} side`}
                className={cn(
                  "flex-1 text-[11px] font-bold transition-colors coarse:text-[13px]",
                  value?.side === side
                    ? "bg-primary/10 text-primary-strong"
                    : "bg-card text-muted-foreground hover:text-foreground"
                )}
              >
                {side}
              </button>
            ))}
          </div>
        )}
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
    // 16px on touch: iOS zooms the viewport for any input below it.
    className: "text-[11px] rounded-lg coarse:text-[16px] coarse:h-11",
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
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
          {suffix}
        </span>
      )}
    </div>
  );
};

export default ProtocolLogSheet;
