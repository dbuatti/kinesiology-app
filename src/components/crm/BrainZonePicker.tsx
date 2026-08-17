
import { useState } from "react";
import { cn } from "@/lib/utils";
import { BRAIN_REFLEX_POINTS, type BrainReflexPoint } from "@/data/brain-reflex-data";

interface BrainZonePickerProps {
  value: string;
  onChange: (value: string) => void;
}

type Side = "L" | "R" | "B";

interface SelectedZone {
  id: string;
  name: string;
  side: Side;
  category: string;
}

function parseSelection(value: string): SelectedZone[] {
  if (!value) return [];
  return value.split(", ").map(part => {
    const match = part.match(/^(.+)\s+\((L|R|B)\)$/);
    if (!match) return null;
    const zone = BRAIN_REFLEX_POINTS.find(z => z.name === match[1]);
    if (!zone) return null;
    return { id: zone.id, name: zone.name, side: match[2] as Side, category: zone.category };
  }).filter(Boolean) as SelectedZone[];
}

function toValue(selected: SelectedZone[]): string {
  return selected.map(z => `${z.name} (${z.side})`).join(", ");
}

export default function BrainZonePicker({ value, onChange }: BrainZonePickerProps) {
  const [selected, setSelected] = useState<SelectedZone[]>(() => parseSelection(value));

  const cortical = BRAIN_REFLEX_POINTS.filter(z => z.category === "Cortical");
  const subcortical = BRAIN_REFLEX_POINTS.filter(z => z.category === "Subcortical");

  const toggle = (zone: BrainReflexPoint) => {
    const existing = selected.find(s => s.id === zone.id);
    let next: SelectedZone[];
    if (existing) {
      next = selected.filter(s => s.id !== zone.id);
    } else {
      const side: Side = zone.lateralization === "Bilateral" ? "B" : "R";
      next = [...selected, { id: zone.id, name: zone.name, side, category: zone.category }];
    }
    setSelected(next);
    onChange(toValue(next));
  };

  const cycleSide = (zoneId: string) => {
    const zone = BRAIN_REFLEX_POINTS.find(z => z.id === zoneId);
    if (!zone) return;
    const sides: Side[] = zone.lateralization === "Bilateral" ? ["B"] : ["L", "R"];
    const current = selected.find(s => s.id === zoneId);
    if (!current) return;
    const idx = sides.indexOf(current.side);
    const nextSide = sides[(idx + 1) % sides.length];
    const next = selected.map(s => s.id === zoneId ? { ...s, side: nextSide } : s);
    setSelected(next);
    onChange(toValue(next));
  };

  const renderGroup = (label: string, zones: BrainReflexPoint[]) => (
    <div className="space-y-1.5">
      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {zones.map(zone => {
          const sel = selected.find(s => s.id === zone.id);
          return (
            <div key={zone.id} className="flex items-center">
              <button
                onClick={() => toggle(zone)}
                className={cn(
                  "px-2.5 py-1.5 rounded-l-lg text-[11px] font-semibold transition-all border border-r-0",
                  sel
                    ? "bg-indigo-100 text-indigo-800 border-indigo-300"
                    : "bg-muted/40 text-foreground border-border hover:bg-muted",
                )}
              >
                {zone.name}
              </button>
              {sel ? (
                <button
                  onClick={() => cycleSide(zone.id)}
                  className={cn(
                    "px-2 py-1.5 rounded-r-lg text-[10px] font-bold transition-all border",
                    sel.side === "L" && "bg-blue-100 text-blue-700 border-blue-300",
                    sel.side === "R" && "bg-rose-100 text-rose-700 border-rose-300",
                    sel.side === "B" && "bg-amber-100 text-amber-700 border-amber-300",
                  )}
                  title="Click to cycle side"
                >
                  {sel.side}
                </button>
              ) : (
                <span className="px-2 py-1.5 rounded-r-lg text-[10px] font-bold bg-muted/20 text-muted-foreground/40 border border-border">
                  ?
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      {renderGroup("Cortical", cortical)}
      {renderGroup("Subcortical", subcortical)}

      {selected.length > 0 && (
        <div className="p-2.5 bg-indigo-50 rounded-lg border border-indigo-100">
          <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider mb-1">Selected ({selected.length})</p>
          <div className="flex flex-wrap gap-1">
            {selected.map(z => (
              <span key={z.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded text-[10px] font-semibold">
                {z.name}
                <span className={cn(
                  "text-[8px] font-bold",
                  z.side === "L" && "text-blue-600",
                  z.side === "R" && "text-rose-600",
                  z.side === "B" && "text-amber-600",
                )}>({z.side})</span>
                <button onClick={() => toggle(z)} className="text-indigo-400 hover:text-indigo-700 ml-0.5">×</button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
