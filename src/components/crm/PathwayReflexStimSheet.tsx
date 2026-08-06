import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  PRIMITIVE_TRACKS,
  NUCLEI_COLORS,
  NERVE_GROUPS,
  nerveStimLines,
  nerveGroupRowSpan,
  primitiveStimKey,
  primitiveSideKey,
  cranialStimKey,
  cranialSideKey,
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
  checked?: Record<string, boolean>;
  onToggle?: (key: string) => void;
  query?: string;
}

const PathwayReflexStimSheet = ({ checked: externalChecked, onToggle, query }: PathwayReflexStimSheetProps) => {
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

  const StimCheck = ({ checkedKey }: { checkedKey: string }) => {
    const isChecked = Boolean(checked[checkedKey]);
    return (
      <button
        type="button"
        onClick={() => toggle(checkedKey)}
        aria-pressed={isChecked}
        aria-label={isChecked ? "Pattern showing — click to clear" : "Mark pattern as showing"}
        title={isChecked ? "Showing — click to clear" : "Click to mark showing"}
        className={`w-5 h-5 border-2 border-black mx-auto flex items-center justify-center cursor-pointer rounded-[3px] transition-all duration-100 active:scale-75 hover:bg-black/[0.03] focus-visible:ring-2 focus-visible:ring-chart-primary focus-visible:ring-offset-1 print:cursor-default ${
          isChecked ? "bg-black/[0.08]" : ""
        }`}
      >
        {isChecked && <HandwrittenX />}
      </button>
    );
  };

  const SideCheck = ({ lKey, rKey }: { lKey: string; rKey: string }) => {
    const l = Boolean(checked[lKey]);
    const r = Boolean(checked[rKey]);
    const half = (key: string, side: "L" | "R", isMarked: boolean) => (
      <button
        type="button"
        onClick={() => toggle(key)}
        aria-pressed={isMarked}
        aria-label={`${side} side — ${isMarked ? "showing, click to clear" : "mark showing"}`}
        title={isMarked ? `${side} — click to clear` : `Mark ${side} showing`}
        className="relative flex-1 flex items-center justify-center cursor-pointer transition-colors duration-100 active:bg-black/[0.05] hover:bg-black/[0.02] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-chart-primary print:cursor-default"
      >
        <span aria-hidden="true" className="text-xl font-black leading-none text-neutral-400 select-none pointer-events-none">
          {side}
        </span>
        {isMarked && (
          <span className="absolute inset-0 p-1 pointer-events-none">
            <HandwrittenX />
          </span>
        )}
      </button>
    );
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
          <p className="mt-0.5">Primitive Reflexes &amp; Cranial Nerves</p>
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
          <tr id="primitive-reflexes">
            <td colSpan={4} style={{ backgroundColor: "#000", color: "#fff" }} className="border-2 border-black p-1 font-black uppercase tracking-[0.2em] sticky top-[34px] z-[5]">
              Primitive Reflexes
            </td>
          </tr>
          {PRIMITIVE_TRACKS.map((track) => (
            <React.Fragment key={track.title}>
              {track.reflexes.map((reflex, ri) => {
                const lateralized = Boolean(reflex.lateralized);
                const reflexKeys = lateralized
                  ? [primitiveSideKey(reflex, "L"), primitiveSideKey(reflex, "R")]
                  : [primitiveStimKey(reflex)];
                const rowMarked = reflexKeys.some((k) => checked[k]);
                const isMatch = primitiveReflexMatches(reflex, query ?? "");
                return (
                  <tr
                    key={reflex.short}
                    id={`prim-row-${reflex.short}`}
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
                    {ri === 0 ? (
                      <td
                        rowSpan={track.reflexes.length}
                        className={`${track.color} text-white p-1 pl-2 align-top font-black uppercase tracking-wider border-2 border-black border-t-0`}
                      >
                        {track.title}
                      </td>
                    ) : null}
                    <td className="border-2 border-black border-t-0 p-1 pl-2 align-middle font-black">
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
                    </td>
                    <td className="border-2 border-black border-t-0 p-1 align-middle">
                      {reflex.stimulus}
                    </td>
                    <td className={`border-2 border-black border-t-0 ${lateralized ? "p-0" : "p-1 text-center align-middle"}`}>
                      {lateralized ? (
                        <SideCheck lKey={primitiveSideKey(reflex, "L")} rKey={primitiveSideKey(reflex, "R")} />
                      ) : (
                        <StimCheck checkedKey={primitiveStimKey(reflex)} />
                      )}
                    </td>
                  </tr>
                );
              })}
            </React.Fragment>
          ))}

          <tr id="cranial-nerves">
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
                          <SideCheck lKey={cranialSideKey(nerve.id, i, "L")} rKey={cranialSideKey(nerve.id, i, "R")} />
                        ) : (
                          <StimCheck checkedKey={cranialStimKey(nerve.id, i)} />
                        )}
                      </td>
                    </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      <div className="mt-2 pt-1 border-t-2 border-black flex justify-between text-[8px] font-black uppercase tracking-widest">
        <p>Resonance Clinical Infrastructure • Prototype Grid v0.5</p>
        <p className="text-right">L / R = per-side showing • Stim lines are indicative</p>
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
