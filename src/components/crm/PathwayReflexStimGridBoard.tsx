import React from "react";
import { Link } from "react-router-dom";
import { ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { StimXMark } from "./StimXMark";
import { getMuscleInfo } from "@/data/muscle-info-data";
import {
  INTRINSIC_GRID_MUSCLES,
  muscleMidlineKey,
  muscleSideKey,
  muscleMatches,
  type MuscleGridState,
} from "./muscle-grid-data";
import {
  PRIMITIVE_TRACKS,
  NERVE_GROUPS,
  NUCLEI_COLORS,
  nerveStimLines,
  primitiveStimKey,
  primitiveStimKeyAt,
  primitiveSideKey,
  cranialStimKey,
  cranialSideKey,
  cranialNerveInhibKey,
  isLateralStim,
  primitiveReflexMatches,
  cranialLineMatches,
} from "./pathway-reflex-stim-data";

interface PathwayReflexStimGridBoardProps {
  checked: Record<string, boolean>;
  onToggle: (key: string) => void;
  query: string;
  activeTab: "reflexes" | "nerves" | "muscles";
  muscleState?: Record<string, MuscleGridState>;
  onMuscleToggle?: (key: string) => void;
}

const SectionHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-2 px-3 py-2.5">
    <p className="text-xs font-bold uppercase tracking-widest text-foreground">{children}</p>
  </div>
);

const ColumnHeader = ({ cellLabel }: { cellLabel: string }) => (
  <div className="flex items-stretch border-b border-border/50 bg-muted/30">
    <div className="flex w-72 shrink-0 items-center border-r border-border/50 px-4 py-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/70">Reflex</p>
    </div>
    <div className="flex flex-1 items-center px-4 py-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/70">Stim</p>
    </div>
    <div className="flex w-24 shrink-0 items-center justify-center border-l border-border/50 px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/70">{cellLabel}</p>
    </div>
  </div>
);

const MarkButton = ({
  marked,
  active,
  onClick,
  title,
}: {
  marked: boolean;
  active?: boolean;
  onClick: () => void;
  title: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={marked}
    title={title}
    className={cn(
      "relative flex h-10 w-10 items-center justify-center rounded-lg border-2 transition-all cursor-pointer active:scale-95",
      marked
        ? "border-chart-destructive/60 bg-chart-destructive/15 text-chart-destructive"
        : active
          ? "border-yellow-400/80 bg-yellow-100/80 text-yellow-700"
          : "border-border text-muted-foreground hover:border-chart-destructive/40 hover:bg-chart-destructive/5"
    )}
  >
    {marked && <StimXMark className="w-6 h-6" />}
  </button>
);

const SideSplit = ({
  lKey,
  rKey,
  activeSide,
  checked,
  onToggle,
  itemTitle,
}: {
  lKey: string;
  rKey: string;
  activeSide?: "L" | "R" | "both";
  checked: Record<string, boolean>;
  onToggle: (key: string) => void;
  itemTitle: string;
}) => (
  <div className="flex overflow-hidden rounded-lg border-2 border-border">
    {(["L", "R"] as const).map((side, i) => {
      const key = side === "L" ? lKey : rKey;
      const marked = !!checked[key];
      const active = activeSide === side || activeSide === "both";
      return (
        <button
          key={side}
          type="button"
          onClick={() => onToggle(key)}
          aria-pressed={marked}
          title={`${side} — ${marked ? "showing, click to unmark" : itemTitle}`}
          className={cn(
            "relative flex h-10 w-11 items-center justify-center transition-colors cursor-pointer active:scale-95",
            i === 0 && "border-r border-border",
            marked
              ? "bg-chart-destructive/15 text-chart-destructive"
              : active
                ? "bg-yellow-100/80 text-yellow-700"
                : "text-muted-foreground hover:bg-muted"
          )}
        >
          {marked ? <StimXMark className="w-6 h-6" /> : (
            <span className="text-sm font-black">{side}</span>
          )}
        </button>
      );
    })}
  </div>
);

const NerveInhib = ({
  nerve,
  checked,
  onToggle,
}: {
  nerve: { id: number; name: string; isLateralized?: boolean };
  checked: Record<string, boolean>;
  onToggle: (key: string) => void;
}) => {
  if (nerve.isLateralized) {
    return (
      <div className="flex overflow-hidden rounded-lg border-2 border-border">
        {(["L", "R"] as const).map((side, i) => {
          const key = cranialNerveInhibKey(nerve.id, side);
          const marked = !!checked[key];
          return (
            <button
              key={side}
              type="button"
              onClick={() => onToggle(key)}
              aria-pressed={marked}
              title={`${side} ${nerve.name} — ${marked ? "inhibited, click to unmark" : "mark inhibited"}`}
              className={cn(
                "relative flex h-8 w-8 items-center justify-center transition-colors cursor-pointer active:scale-95",
                i === 0 && "border-r border-border",
                marked
                  ? "bg-chart-destructive/15 text-chart-destructive"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {marked ? <StimXMark className="w-5 h-5" /> : (
                <span className="text-xs font-black">{side}</span>
              )}
            </button>
          );
        })}
      </div>
    );
  }
  const key = cranialNerveInhibKey(nerve.id);
  const marked = !!checked[key];
  return (
    <MarkButton
      marked={marked}
      onClick={() => onToggle(key)}
      title={marked ? `${nerve.name} — inhibited, click to unmark` : `${nerve.name} — mark inhibited`}
    />
  );
};

const ReflexRow = ({
  reflex,
  checked,
  onToggle,
  query,
}: {
  reflex: { id: string; short: string; name: string; stimulus: string; inhibition: string; lateralized?: boolean; stims?: string[] };
  checked: Record<string, boolean>;
  onToggle: (key: string) => void;
  query: string;
}) => {
  const match = primitiveReflexMatches(reflex, query);
  const lateral = !!reflex.lateralized;
  const stims = reflex.stims ?? [reflex.stimulus];
  return (
    <div>
      {stims.map((label, i) => (
        <div
          key={i}
          id={i === 0 ? `prim-row-${reflex.short}` : undefined}
          className={cn(
            "flex items-stretch border-t border-border/50 transition-colors",
            match && "bg-yellow-100/60"
          )}
        >
          <div className="flex w-72 shrink-0 items-center border-r border-border/50 bg-muted/30 px-4 py-3">
            {i === 0 ? (
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <Link
                    to="/resources?tab=primitive"
                    className="text-sm font-semibold text-foreground hover:text-chart-primary"
                  >
                    {reflex.short} — {reflex.name}
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="rounded-xl max-w-[260px] text-[10px] leading-relaxed bg-foreground text-background border-none shadow-xl">
                  <p className="font-black uppercase tracking-wider text-[9px] mb-1">{reflex.short} — Inhibition</p>
                  <p className="font-medium">{reflex.inhibition}</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                {reflex.short} · {i + 1}
              </span>
            )}
          </div>
          <div className="flex flex-1 items-center px-4 py-3 text-xs font-medium text-foreground/75">
            {label}
          </div>
          <div className="flex w-24 shrink-0 items-center justify-center border-l border-border/50 bg-muted/30 px-3 py-3">
            {lateral ? (
              <SideSplit
                lKey={primitiveSideKey(reflex, "L")}
                rKey={primitiveSideKey(reflex, "R")}
                checked={checked}
                onToggle={onToggle}
                itemTitle={`mark ${reflex.name} showing`}
              />
            ) : reflex.stims?.length ? (
              <MarkButton
                marked={!!checked[primitiveStimKeyAt(reflex, i)]}
                onClick={() => onToggle(primitiveStimKeyAt(reflex, i))}
                title={`${reflex.name} — ${label}, click to mark showing`}
              />
            ) : (
              <MarkButton
                marked={!!checked[primitiveStimKey(reflex)]}
                onClick={() => onToggle(primitiveStimKey(reflex))}
                title={`${reflex.name} — click to mark showing`}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const NerveBlock = ({
  nerve,
  checked,
  onToggle,
  query,
}: {
  nerve: {
    id: number;
    name: string;
    latinName: string;
    nuclei: string;
    reflexPoint: string;
    isLateralized?: boolean;
    toneEffect?: string;
    functions?: string;
    stimulus?: string;
    clinicalPearl?: string;
    color?: string;
  };
  checked: Record<string, boolean>;
  onToggle: (key: string) => void;
  query: string;
}) => {
  const lines = nerveStimLines(nerve);
  const nerveInhibited =
    !nerve.isLateralized && !!checked[cranialNerveInhibKey(nerve.id)];
  return (
    <div className="border-t border-border/50">
      <div className="flex items-stretch">
        <div className="flex min-w-0 flex-1 items-center gap-2 bg-muted/30 px-4 py-2.5">
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <Link
                to="/resources?tab=cranial"
                className="text-sm font-semibold text-foreground hover:text-chart-primary"
              >
                {nerve.name} — {nerve.latinName}
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="rounded-xl max-w-[260px] text-[10px] leading-relaxed bg-foreground text-background border-none shadow-xl">
              <p className="font-black uppercase tracking-wider text-[9px] mb-1">{nerve.name} — Reflex Point</p>
              <p className="font-medium">{nerve.reflexPoint}</p>
            </TooltipContent>
          </Tooltip>
          <span className="hidden truncate text-[10px] text-muted-foreground/70 lg:inline">
            {nerve.reflexPoint}
          </span>
        </div>
        <div className="flex w-24 shrink-0 items-center justify-center border-l border-border/50 bg-muted/30 px-3 py-2.5">
          <NerveInhib nerve={nerve} checked={checked} onToggle={onToggle} />
        </div>
      </div>
      {lines.map((line, i) => {
        const lateral = isLateralStim(nerve.id, i);
        const match = cranialLineMatches(nerve, line, query);
        let activeSide: "L" | "R" | "both" | undefined;
        if (nerve.isLateralized) {
          const l = !!checked[cranialNerveInhibKey(nerve.id, "L")];
          const r = !!checked[cranialNerveInhibKey(nerve.id, "R")];
          if (l && r) activeSide = "both";
          else if (l) activeSide = "L";
          else if (r) activeSide = "R";
        }
        return (
          <div
            id={`cn-row-${nerve.id}-${i}`}
            key={i}
            className={cn(
              "flex items-stretch border-t border-border/40 transition-colors",
              match && "bg-yellow-100/60"
            )}
          >
            <div className="flex flex-1 items-center px-4 py-3 text-xs font-medium text-foreground/75">
              {line}
            </div>
            <div className="flex w-24 shrink-0 items-center justify-center border-l border-border/50 bg-muted/30 px-3 py-3">
              {lateral ? (
                <SideSplit
                  lKey={cranialSideKey(nerve.id, i, "L")}
                  rKey={cranialSideKey(nerve.id, i, "R")}
                  activeSide={activeSide}
                  checked={checked}
                  onToggle={onToggle}
                  itemTitle={`mark ${line} showing`}
                />
              ) : (
                <MarkButton
                  marked={!!checked[cranialStimKey(nerve.id, i)]}
                  active={!!nerveInhibited}
                  onClick={() => onToggle(cranialStimKey(nerve.id, i))}
                  title={`${line} — click to mark showing`}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const toneIcon = (state?: MuscleGridState, className?: string) => {
  if (state === "Hypotonic") return <ArrowDown size={18} className={className} />;
  if (state === "Inhibited") return <StimXMark className={className} />;
  if (state === "Hypertonic") return <ArrowUp size={18} className={className} />;
  return null;
};

const MuscleMarkButton = ({
  keyName,
  state,
  title,
  onClick,
}: {
  keyName: string;
  state?: MuscleGridState;
  title: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={!!state}
    title={title}
    className={cn(
      "relative flex h-10 w-10 items-center justify-center rounded-lg border-2 transition-all cursor-pointer active:scale-95",
      state === "Hypotonic" && "border-sky-500/70 bg-sky-500/15 text-sky-700",
      state === "Inhibited" && "border-chart-destructive/60 bg-chart-destructive/15 text-chart-destructive",
      state === "Hypertonic" && "border-amber-500/70 bg-amber-100/80 text-amber-700",
      !state && "border-border text-muted-foreground hover:border-sky-500/40 hover:bg-sky-500/5"
    )}
  >
    {toneIcon(state, "w-6 h-6")}
  </button>
);

const MuscleSideSplit = ({
  lKey,
  rKey,
  stateL,
  stateR,
  onToggle,
  itemTitle,
}: {
  lKey: string;
  rKey: string;
  stateL?: MuscleGridState;
  stateR?: MuscleGridState;
  onToggle: (key: string) => void;
  itemTitle: string;
}) => (
  <div className="flex overflow-hidden rounded-lg border-2 border-border">
    {([
      ["L", lKey, stateL],
      ["R", rKey, stateR],
    ] as const).map(([side, key, state], i) => (
      <button
        key={side}
        type="button"
        onClick={() => onToggle(key)}
        aria-pressed={!!state}
        title={`${side} — ${itemTitle}`}
        className={cn(
          "relative flex h-10 w-11 items-center justify-center transition-colors cursor-pointer active:scale-95",
          i === 0 && "border-r border-border",
          state === "Hypotonic" && "bg-sky-500/15 text-sky-700",
          state === "Inhibited" && "bg-chart-destructive/15 text-chart-destructive",
          state === "Hypertonic" && "bg-amber-100/80 text-amber-700",
          !state && "text-muted-foreground hover:bg-muted"
        )}
      >
        {toneIcon(state, "w-5 h-5") || <span className="text-sm font-black">{side}</span>}
      </button>
    ))}
  </div>
);

const MuscleRow = ({
  name,
  midline,
  group,
  checked,
  onToggle,
  query,
}: {
  name: string;
  midline: boolean;
  group: string;
  checked: Record<string, MuscleGridState>;
  onToggle: (key: string) => void;
  query: string;
}) => {
  const info = getMuscleInfo(name);
  const match = muscleMatches({ name, midline, group }, query);
  return (
    <div
      id={`mus-row-${name}`}
      className={cn(
        "flex items-stretch border-t border-border/50 transition-colors",
        match && "bg-yellow-100/60"
      )}
    >
      <div className="flex w-72 shrink-0 items-center border-r border-border/50 bg-muted/30 px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{name}</p>
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground/60">{info.meridian}</p>
        </div>
      </div>
      <div className="flex flex-1 items-center px-4 py-3 text-xs font-medium text-foreground/75">
        {info.testingPosition || info.description || "Standard muscle test"}
      </div>
      <div className="flex w-24 shrink-0 items-center justify-center border-l border-border/50 bg-muted/30 px-3 py-3">
        {midline ? (
          <MuscleMarkButton
            keyName={muscleMidlineKey(name)}
            state={checked[muscleMidlineKey(name)]}
            title={`${name} — tap to cycle Normotonic → Hypotonic → Inhibited`}
            onClick={() => onToggle(muscleMidlineKey(name))}
          />
        ) : (
          <MuscleSideSplit
            lKey={muscleSideKey(name, "L")}
            rKey={muscleSideKey(name, "R")}
            stateL={checked[muscleSideKey(name, "L")]}
            stateR={checked[muscleSideKey(name, "R")]}
            onToggle={onToggle}
            itemTitle={`${name} — tap to cycle Normotonic → Hypotonic → Inhibited`}
          />
        )}
      </div>
    </div>
  );
};

export function PathwayReflexStimGridBoard({
  checked,
  onToggle,
  query,
  activeTab,
  muscleState = {},
  onMuscleToggle,
}: PathwayReflexStimGridBoardProps) {
  const muscleToggle = onMuscleToggle ?? onToggle;
  return (
    <div className="bg-card">
      {activeTab === "reflexes" && (
        <section id="primitive-reflexes" className="scroll-mt-4">
          <SectionHeader>Primitive Reflexes</SectionHeader>
          <ColumnHeader cellLabel="Mark" />
          {PRIMITIVE_TRACKS.map((track) => (
            <div key={track.title}>
              <div className="flex items-center gap-2 bg-muted/40 px-4 py-2">
                <span className={cn("h-2.5 w-2.5 rounded-full", track.color)} />
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {track.title}
                </p>
              </div>
              {track.reflexes.map((reflex) => (
                <ReflexRow
                  key={reflex.id}
                  reflex={reflex}
                  checked={checked}
                  onToggle={onToggle}
                  query={query}
                />
              ))}
            </div>
          ))}
        </section>
      )}

      {activeTab === "nerves" && (
        <section id="cranial-nerves" className="scroll-mt-4">
          <SectionHeader>Cranial Nerves</SectionHeader>
          <ColumnHeader cellLabel="Mark" />
          {NERVE_GROUPS.map((group) => (
            <div key={group.label}>
              <div className="flex items-center gap-2 bg-muted/40 px-4 py-2">
                <span className={cn("h-2.5 w-2.5 rounded-full", NUCLEI_COLORS[group.label])} />
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {group.label} Nuclei
                </p>
              </div>
              {group.items.map((nerve) => (
                <NerveBlock
                  key={nerve.id}
                  nerve={nerve}
                  checked={checked}
                  onToggle={onToggle}
                  query={query}
                />
              ))}
            </div>
          ))}
        </section>
      )}

      {activeTab === "muscles" && (
        <section id="intrinsic-muscles" className="scroll-mt-4">
          <SectionHeader>Intrinsic Muscles</SectionHeader>
          <ColumnHeader cellLabel="Tone" />
          {INTRINSIC_GRID_MUSCLES.reduce<{ group: string; muscles: typeof INTRINSIC_GRID_MUSCLES }[]>(
            (acc, m) => {
              let g = acc.find((x) => x.group === m.group);
              if (!g) {
                g = { group: m.group, muscles: [] };
                acc.push(g);
              }
              g.muscles.push(m);
              return acc;
            },
            []
          ).map(({ group, muscles }) => (
            <div key={group}>
              <div className="flex items-center gap-2 bg-muted/40 px-4 py-2">
                <span className="h-2.5 w-2.5 rounded-full bg-chart-primary" />
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {group}
                </p>
              </div>
              {muscles.map((m) => (
                <MuscleRow
                  key={m.name}
                  name={m.name}
                  midline={m.midline}
                  group={m.group}
                  checked={muscleState}
                  onToggle={muscleToggle}
                  query={query}
                />
              ))}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

export default PathwayReflexStimGridBoard;
