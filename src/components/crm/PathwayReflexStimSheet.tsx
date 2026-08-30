import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getMuscleInfo } from "@/data/muscle-info-data";
import {
  INTRINSIC_GRID_MUSCLES,
  muscleMidlineKey,
  muscleSideKey,
  type MuscleGridState,
} from "./muscle-grid-data";
import {
  PRIMITIVE_TRACKS,
  NUCLEI_COLORS,
  NERVE_GROUPS,
  nerveStimLines,
  nerveGroupRowSpan,
  primitiveStimKey,
  primitiveStimKeyAt,
  primitiveStimCount,
  primitiveSideKey,
  cranialStimKey,
  cranialSideKey,
  cranialNerveInhibKey,
  isLateralStim,
  primitiveReflexMatches,
  cranialLineMatches,
} from "./pathway-reflex-stim-data";

const HandwrittenX = () => (
  <svg viewBox="0 0 16 16" className="w-full h-full" aria-hidden="true">
    <g stroke="black" strokeWidth="1.7" fill="none" strokeLinecap="round">
      <path d="M3.2 3.2 C5.5 5.8, 6.8 7.2, 12.8 12.8" />
      <path d="M12.8 3.2 C10.6 5.8, 9.4 7.2, 3.2 12.8" />
    </g>
  </svg>
);

interface PathwayReflexStimSheetProps {
  externalChecked?: Record<string, boolean>;
  checked?: Record<string, boolean>;
  muscleState?: Record<string, MuscleGridState>;
  onToggle?: (key: string) => void;
  query?: string;
}

const TONE_SYMBOL: Record<MuscleGridState, string> = {
  Hypotonic: "↓",
  Inhibited: "✕",
  Hypertonic: "↑",
};

const ToneCell = ({ state, title }: { state?: MuscleGridState; title: string }) => (
  <div
    title={`${title} — ${state ?? "Normotonic"}`}
    className="w-5 h-5 border-2 border-black mx-auto flex items-center justify-center rounded-[3px]"
  >
    {state && <span className="text-base font-black leading-none">{TONE_SYMBOL[state]}</span>}
  </div>
);

const ToneSideSplit = ({
  lState,
  rState,
  title,
}: {
  lState?: MuscleGridState;
  rState?: MuscleGridState;
  title: string;
}) => (
  <div className="flex w-full min-h-[36px] divide-x-2 divide-black">
    {([
      ["L", lState],
      ["R", rState],
    ] as const).map(([side, state]) => (
      <div key={side} className="relative flex-1 flex items-center justify-center">
        <span
          aria-hidden="true"
          className="text-xl font-black leading-none text-neutral-400 select-none pointer-events-none"
        >
          {side}
        </span>
        {state && (
          <span
            title={`${title} ${side} — ${state}`}
            className="absolute inset-0 flex items-center justify-center text-base font-black"
          >
            {TONE_SYMBOL[state]}
          </span>
        )}
      </div>
    ))}
  </div>
);

const PathwayReflexStimSheet = ({
  externalChecked,
  muscleState,
  onToggle,
  query,
}: PathwayReflexStimSheetProps) => {
  const [localChecked, setLocalChecked] = useState<Record<string, boolean>>({});

  const checked = externalChecked ?? localChecked;
  const interactive = Boolean(externalChecked && onToggle);

  const toggle = (key: string) => {
    if (externalChecked && onToggle) {
      onToggle(key);
    } else {
      setLocalChecked((prev) => ({ ...prev, [key]: !prev[key] }));
    }
  };

  const StimCheck = ({ checkedKey, highlight }: { checkedKey: string; highlight?: boolean }) => {
    const isChecked = Boolean(checked[checkedKey]);
    return (
      <button
        type="button"
        onClick={() => toggle(checkedKey)}
        aria-pressed={isChecked}
        aria-label={isChecked ? "Pattern showing — click to unmark" : "Mark pattern as showing"}
        title={isChecked ? "Showing — click to unmark" : "Click to mark showing"}
        className={`w-5 h-5 border-2 border-black mx-auto flex items-center justify-center cursor-pointer transition-all duration-100 active:scale-75 hover:bg-black/[0.03] focus-visible:ring-2 focus-visible:ring-chart-primary focus-visible:ring-offset-1 print:cursor-default ${
          isChecked ? "bg-black/[0.08]" : ""
        } ${highlight ? "bg-yellow-200/70" : ""}`}
      >
        {isChecked && <HandwrittenX />}
      </button>
    );
  };

  const SideCheck = ({ lKey, rKey, activeSide }: { lKey: string; rKey: string; activeSide?: "L" | "R" | "both" }) => {
    const l = Boolean(checked[lKey]);
    const r = Boolean(checked[rKey]);
    const half = (key: string, side: "L" | "R", isMarked: boolean) => {
      const active = activeSide === side || activeSide === "both";
      return (
        <button
          type="button"
          onClick={() => toggle(key)}
          aria-pressed={isMarked}
          aria-label={`${side} side — ${isMarked ? "showing, click to unmark" : "mark showing"}`}
          title={isMarked ? `${side} — click to unmark" : "Mark ${side} showing"}
          className={`relative flex-1 flex items-center justify-center cursor-pointer transition-colors duration-100 active:bg-black/[0.05] hover:bg-black/[0.02] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-chart-primary print:cursor-default ${
            active ? "bg-yellow-200/70" : ""
          }`}
        >
          <span
            aria-hidden="true"
            className="text-xl font-black leading-none text-neutral-400 select-none pointer-events-none"
          >
            {side}
          </span>
          {isMarked && (
            <span className="absolute inset-0 p-1 pointer-events-none">
              <HandwrittenX />
            </span>
          )}
        </button>
      );
    };
    return (
      <div className="flex w-full min-h-[36px] divide-x-2 divide-black">
        {half(lKey, "L", l)}
        {half(rKey, "R", r)}
      </div>
    );
  };

  return (
    <div className="bg-white text-black p-4 max-w-[210mm] mx-auto font-sans print:p-0 print:m-0">
      <div className="border-2 border-black mb-2 flex justify-between items-end px-3 py-2">
        <div>
          <h1 className="text-xl font-black uppercase tracking-tight leading-none">Pathway / Reflex / Stim</h1>
          <p className="text-[9px] font-bold uppercase tracking-[0.3em] mt-1">Reference Grid — Prototype</p>
        </div>
        <div className="text-right text-[9px] font-bold uppercase tracking-widest">
          <p>A4 Portrait</p>
          <p className="mt-0.5">Reflexes · Cranial Nerves · Intrinsic Muscles</p>
        </div>
      </div>

      <table className="w-full border-collapse text-[10px] leading-snug">
        <thead>
          <tr>
            <th style={{ backgroundColor: "#000", color: "#fff" }} className="border-2 border-black p-1 text-left font-black uppercase w-[12%] sticky top-0 z-10">Pathway</th>
            <th style={{ backgroundColor: "#000", color: "#fff" }} className="border-2 border-black p-1 text-left font-black uppercase w-[22%] sticky top-0 z-10">Reflex</th>
            <th style={{ backgroundColor: "#000", color: "#fff" }} className="border-2 border-black p-1 text-left font-black uppercase sticky top-0 z-10">Stim</th>
            <th style={{ backgroundColor: "#000", color: "#fff" }} className="border-2 border-black p-1 text-center font-black uppercase w-[8%] sticky top-0 z-10">
              <span className="block">✕</span>
              <span className="block text-[7px] font-bold tracking-wider text-white/70">L / R</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr key="primitive-reflexes" id="primitive-reflexes">
            <td colSpan={4} style={{ backgroundColor: "#000", color: "#fff" }} className="border-2 border-black p-1 font-black uppercase tracking-[0.2em] sticky top-[34px] z-[5]">
              Primitive Reflexes
            </td>
          </tr>
          {PRIMITIVE_TRACKS.map((track) => (
            <React.Fragment key={track.title}>
              {track.reflexes.map((reflex, ri) => {
                const lateralized = Boolean(reflex.lateralized);
                const stimLabels = reflex.stims ?? [reflex.stimulus];
                const rowKeys = lateralized
                  ? [primitiveSideKey(reflex, "L"), primitiveSideKey(reflex, "R")]
                  : stimLabels.map((_, i) => primitiveStimKeyAt(reflex, i));
                const rowMarked = rowKeys.some((k) => checked[k]);
                const isMatch = primitiveReflexMatches(reflex, query ?? "");
                return (
                  <React.Fragment key={reflex.short}>
                    {stimLabels.map((label, si) => (
                      <tr
                        key={si}
                        id={si === 0 ? `prim-row-${reflex.short}` : undefined}
                        className={`break-inside-avoid transition-colors ${
                          isMatch
                            ? "bg-yellow-100/80"
                            : interactive
                              ? rowMarked
                                ? "bg-black/[0.04] hover:bg-black/[0.07]"
                                : "hover:bg-black/[0.03]"
                              : ""
                        }`}
                      >
                        {ri === 0 && si === 0 ? (
                          <td
                            rowSpan={track.reflexes.reduce((acc, r) => acc + primitiveStimCount(r), 0)}
                            className={`${track.color} text-white p-1 pl-2 align-top font-black uppercase tracking-wider border-2 border-black border-t-0`}
                          >
                            {track.title}
                          </td>
                        ) : null}
                        <td className="border-2 border-black border-t-0 p-1 pl-2 align-middle font-black">
                          {si === 0 ? (
                            <Tooltip delayDuration={200}>
                              <TooltipTrigger asChild>
                                <Link to="/resources?tab=primitive" className="hover:underline">
                                  {reflex.short} —{" "}
                                  <span className="font-bold uppercase text-[8px] tracking-wider">{reflex.name}</span>
                                </Link>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="rounded-xl max-w-[260px] text-[10px] leading-relaxed bg-foreground text-background border-none shadow-xl">
                                <p className="font-black uppercase tracking-wider text-[9px] mb-1">{reflex.short} — Inhibition</p>
                                <p className="font-medium">{reflex.inhibition}</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="font-black text-[8px] uppercase tracking-wider text-black/30">{reflex.short} · {si + 1}</span>
                          )}
                        </td>
                        <td className="border-2 border-black border-t-0 p-1 align-middle">
                          {label}
                        </td>
                        <td className={`border-2 border-black border-t-0 ${lateralized ? "p-0" : "p-1 text-center align-middle"}`}>
                          {lateralized ? (
                            si === 0 ? (
                              <SideCheck lKey={primitiveSideKey(reflex, "L")} rKey={primitiveSideKey(reflex, "R")} />
                            ) : null
                          ) : reflex.stims?.length ? (
                            <StimCheck checkedKey={primitiveStimKeyAt(reflex, si)} />
                          ) : (
                            <StimCheck checkedKey={primitiveStimKey(reflex)} />
                          )}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                )})
              </React.Fragment>
            )
          )}
          <tr key="cranial-nerves" id="cranial-nerves">
            <td colSpan={4} style={{ backgroundColor: "#000", color: "#fff" }} className="border-2 border-black p-1 font-black uppercase tracking-[0.2em] sticky top-[34px] z-[5]">
              Cranial Nerves
            </td>
          </tr>
          {NERVE_GROUPS.map((group) => (
            <React.Fragment key={group.label}>
              {group.items.map((nerve, ni) => (
                <React.Fragment key={nerve.id}>
                  {nerveStimLines(nerve).map((line, i) => {
                    const lateralized = isLateralStim(nerve.id, i);
                    const lineKeys = lateralized
                      ? [cranialSideKey(nerve.id, i, "L"), cranialSideKey(nerve.id, i, "R")]
                      : [cranialStimKey(nerve.id, i)];
                    const rowMarked = lineKeys.some((k) => checked[k]);
                    const isMatch = cranialLineMatches(nerve, line, query ?? "");
                    const nerveActiveSide: "L" | "R" | "both" | undefined = nerve.isLateralized
                      ? checked[cranialNerveInhibKey(nerve.id, "L")] && checked[cranialNerveInhibKey(nerve.id, "R")]
                        ? "both"
                        : checked[cranialNerveInhibKey(nerve.id, "L")]
                          ? "L"
                          : checked[cranialNerveInhibKey(nerve.id, "R")]
                            ? "R"
                            : undefined;
                    const nerveInhibited = Boolean(checked[cranialNerveInhibKey(nerve.id)]);
                    return (
                    <tr
                      key={i}
                      id={`cn-row-${nerve.id}-${i}`}
                      className={`break-inside-avoid transition-colors ${
                        isMatch
                          ? "bg-yellow-100/80"
                          : interactive
                            ? rowMarked
                              ? "bg-black/[0.04] hover:bg-black/[0.07]"
                              : "hover:bg-black/[0.03]"
                            : ""
                      }`}
                    >
                      {ni === 0 && i === 0 ? (
                        <td
                          rowSpan={nerveGroupRowSpan(group.items)}
                          style={group.label === "Medulla" ? { backgroundColor: "#000", color: "#fff" } : undefined}
                          className={`${NUCLEI_COLORS[group.label]} text-white p-1 pl-2 align-top font-black uppercase tracking-wider border-2 border-black border-t-0`}
                        >
                          {group.label}
                        </td>
                      ) : null}
                      {i === 0 ? (
                        <td
                          rowSpan={nerveStimLines(nerve).length}
                          className="border-2 border-black border-t-0 p-1 pl-2 align-middle font-semibold"
                        >
                          <Tooltip delayDuration={200}>
                            <TooltipTrigger asChild>
                              <Link to="/resources?tab=cranial" className="hover:underline">
                                {nerve.name} —{" "}
                                <span className="font-bold uppercase text-[8px] tracking-wider">{nerve.latinName}</span>
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="rounded-xl max-w-[260px] text-[10px] leading-relaxed bg-foreground text-background border-none shadow-xl">
                              <p className="font-black uppercase tracking-wider text-[9px] mb-1">{nerve.name} — Reflex Point</p>
                              <p className="font-medium">{nerve.reflexPoint}</p>
                            </TooltipContent>
                          </Tooltip>
                          <div className="mt-1 flex items-center gap-1">
                            {nerve.isLateralized ? (
                              <div className="flex divide-x-2 divide-black border-2 border-black rounded-[3px] overflow-hidden">
                                {(["L", "R"] as const).map((side) => {
                                  const key = cranialNerveInhibKey(nerve.id, side);
                                  const marked = Boolean(checked[key]);
                                  return (
                                    <button
                                      key={side}
                                      type="button"
                                      onClick={() => toggle(key)}
                                      aria-pressed={marked}
                                      title={`${side} ${nerve.name} — ${marked ? "inhibited, click to unmark" : "mark inhibited"}`}
                                      className="w-6 h-6 relative flex items-center justify-center cursor-pointer transition-colors hover:bg-black/[0.04] active:bg-black/[0.06] print:cursor-default"
                                    >
                                      <span className="text-[9px] font-black text-neutral-500">{side}</span>
                                      {marked && <span className="absolute inset-0 p-0.5 pointer-events-none"><HandwrittenX /></span>}
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => toggle(cranialNerveInhibKey(nerve.id))}
                                aria-pressed={Boolean(checked[cranialNerveInhibKey(nerve.id)])}
                                title={`${nerve.name} — ${checked[cranialNerveInhibKey(nerve.id)] ? "inhibited, click to unmark" : "mark inhibited"}`}
                                className="w-6 h-6 border-2 border-black rounded-[3px] relative flex items-center justify-center cursor-pointer transition-colors hover:bg-black/[0.04] active:bg-black/[0.06] print:cursor-default"
                              >
                                {checked[cranialNerveInhibKey(nerve.id)] && <span className="absolute inset-0 p-0.5 pointer-events-none"><HandwrittenX /></span>}
                              </button>
                            )}
                          </div>
                        </td>
                      ) : null}
                      <td className="border-2 border-black border-t-0 p-1 align-middle">
                        <Tooltip delayDuration={200}>
                          <TooltipTrigger asChild>
                            <span className="block cursor-help">{line}</span>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="rounded-xl max-w-[260px] text-[10px] leading-relaxed bg-foreground text-background border-none shadow-xl">
                            <p className="font-black uppercase tracking-wider text-[9px] mb-1">{nerve.name} — Reflex Point</p>
                            <p className="font-medium">{nerve.reflexPoint}</p>
                          </TooltipContent>
                        </Tooltip>
                      </td>
                      <td className={`border-2 border-black border-t-0 ${lateralized ? "p-0" : "p-1 text-center align-middle"}`}>
                        {lateralized ? (
                          <SideCheck lKey={cranialSideKey(nerve.id, i, "L")} rKey={cranialSideKey(nerve.id, i, "R")} activeSide={nerveActiveSide} />
                        ) : (
                          <StimCheck checkedKey={cranialStimKey(nerve.id, i)} highlight={nerveInhibited} />
                        )}
                      </td>
                    </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </React.Fragment>
          )}
          <tr key="intrinsic-muscles" id="intrinsic-muscles">
            <td colSpan={4} style={{ backgroundColor: "#000", color: "#fff" }} className="border-2 border-black p-1 font-black uppercase tracking-[0.2em] sticky top-[34px] z-[5]">
              Intrinsic Muscles
            </td>
          </tr>
          {INTRINSIC_GRID_MUSCLES.map((muscle) => {
            const info = getMuscleInfo(muscle.name);
            const state = muscleState?.[muscleMidlineKey(muscle.name)];
            const lState = muscleState?.[muscleSideKey(muscle.name, "L")];
            const rState = muscleState?.[muscleSideKey(muscle.name, "R")];
            return (
              <tr key={muscle.name} className="break-inside-avoid">
                <td className="border-2 border-black border-t-0 p-1 pl-2 align-middle">
                  <span className="text-[8px] font-black uppercase tracking-wider text-black/40">{muscle.group}</span>
                </td>
                <td className="border-2 border-black border-t-0 p-1 pl-2 align-middle font-semibold">
                  {muscle.name}
                  <div className="text-[7px] font-bold uppercase tracking-wider text-black/40">{info.meridian}</div>
                </td>
                <td className="border-2 border-black border-t-0 p-1 align-middle">
                  {info.testingPosition || info.description || "Standard muscle test"}
                </td>
                <td className="border-2 border-black border-t-0 p-0 text-center align-middle">
                  {muscle.midline ? (
                    <ToneCell state={state} title={muscle.name} />
                  ) : (
                    <ToneSideSplit lState={lState} rState={rState} title={muscle.name} />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="mt-2 pt-1 border-t-2 border-black flex justify-between text-[8px] font-black uppercase tracking-widest">
        <p>Resonance Clinical Infrastructure • Prototype Grid v0.5</p>
        <p className="text-right">L / R = per-side showing • ↓ Hypo · ✕ Inhib · ↑ Hyper</p>
      </div>

      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
          body {
            background: white;
            -webkit-print-color-adjust: exact;
          }
          body * {
            visibility: visible !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PathwayReflexStimSheet;
