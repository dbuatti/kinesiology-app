
import { cn } from "@/lib/utils";
import { ROW_DATA } from "@/data/emotion-code-data";

interface PulsePointPickerProps {
  selectedRow: number | null;
  onSelect: (row: number) => void;
}

const PULSE_POSITIONS = [
  {
    hand: "Left" as const,
    positions: [
      { depth: "Light", label: "Small Intestine", paired: "Heart", row: 1 },
      { depth: "Deep", label: "Heart", paired: "Small Intestine", row: 1 },
      { depth: "Light", label: "Gallbladder", paired: "Liver", row: 4 },
      { depth: "Deep", label: "Liver", paired: "Gallbladder", row: 4 },
      { depth: "Light", label: "Bladder", paired: "Kidney", row: 5 },
      { depth: "Deep", label: "Kidney", paired: "Bladder", row: 5 },
    ],
  },
  {
    hand: "Right" as const,
    positions: [
      { depth: "Light", label: "Lung", paired: "Large Intestine", row: 3 },
      { depth: "Deep", label: "Large Intestine", paired: "Lung", row: 3 },
      { depth: "Light", label: "Spleen", paired: "Stomach", row: 2 },
      { depth: "Deep", label: "Stomach", paired: "Spleen", row: 2 },
      { depth: "Light", label: "Sex Organs / Adrenals", paired: "Thyroid", row: 6 },
      { depth: "Deep", label: "Thyroid", paired: "Adrenals", row: 6 },
    ],
  },
];

function WristDiagram({ hand, positions, selectedRow, onSelect }: {
  hand: "Left" | "Right";
  positions: typeof PULSE_POSITIONS[0]["positions"];
  selectedRow: number | null;
  onSelect: (row: number) => void;
}) {
  const isLeft = hand === "Left";

  // Group by depth: [light0, deep0, light1, deep1, light2, deep2]
  const groups = [
    { light: positions[0], deep: positions[1], label: "1st Position" },
    { light: positions[2], deep: positions[3], label: "2nd Position" },
    { light: positions[4], deep: positions[5], label: "3rd Position" },
  ];

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
        {isLeft ? "Left" : "Right"} Hand
      </p>

      {/* Wrist shape */}
      <div className="relative w-[140px] h-[160px]">
        {/* Forearm */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80px] h-[100px] bg-muted/60 rounded-b-3xl border border-border/60" />

        {/* Palm */}
        <div className="absolute bottom-[85px] left-1/2 -translate-x-1/2 w-[100px] h-[50px] bg-muted/40 rounded-t-3xl border border-b-0 border-border/60" />

        {/* Fingers hint */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 flex gap-1">
          {[20, 24, 26, 22].map((h, i) => (
            <div key={i} className="w-[14px] bg-muted/30 rounded-t-full border border-border/40 border-b-0" style={{ height: h }} />
          ))}
        </div>

        {/* Radial artery line */}
        <div className={cn(
          "absolute bottom-[10px] w-[2px] h-[120px] bg-rose-300/60",
          isLeft ? "right-[38px]" : "left-[38px]",
        )}>
          <div className="absolute top-0 -translate-x-1/2 text-[8px] text-rose-400 font-bold whitespace-nowrap">radial</div>
        </div>

        {/* Pulse position dots — 3 positions along the radial artery */}
        {groups.map((group, gi) => {
          const yPos = 28 + gi * 42; // vertical position from top
          const xPos = isLeft ? 100 : 38; // right side of left wrist, left side of right wrist
          const anySelected = group.light.row === selectedRow || group.deep.row === selectedRow;

          return (
            <div key={gi} className="absolute" style={{ top: yPos, left: xPos, transform: "translate(-50%, -50%)" }}>
              <div className="flex flex-col items-center gap-0.5">
                {/* Light (yang) */}
                <button
                  onClick={() => onSelect(group.light.row)}
                  className={cn(
                    "w-[42px] h-[22px] rounded-full text-[8px] font-bold flex items-center justify-center transition-all border",
                    group.light.row === selectedRow
                      ? "bg-chart-primary text-primary-foreground border-chart-primary shadow-md scale-110"
                      : anySelected
                        ? "bg-muted/40 text-muted-foreground border-border/40"
                        : "bg-white/80 text-foreground border-border hover:bg-chart-primary/10 hover:border-chart-primary/40",
                  )}
                  title={`Light touch: ${group.light.label}`}
                >
                  {group.light.label.length > 10 ? group.light.label.slice(0, 9) + "…" : group.light.label}
                </button>

                <div className="w-[1px] h-[3px] bg-border/60" />

                {/* Deep (yin) */}
                <button
                  onClick={() => onSelect(group.deep.row)}
                  className={cn(
                    "w-[42px] h-[22px] rounded-full text-[8px] font-bold flex items-center justify-center transition-all border",
                    group.deep.row === selectedRow
                      ? "bg-chart-destructive text-primary-foreground border-chart-destructive shadow-md scale-110"
                      : anySelected
                        ? "bg-muted/40 text-muted-foreground border-border/40"
                        : "bg-white/80 text-foreground border-border hover:bg-chart-destructive/10 hover:border-chart-destructive/40",
                  )}
                  title={`Deep touch: ${group.deep.label}`}
                >
                  {group.deep.label.length > 10 ? group.deep.label.slice(0, 9) + "…" : group.deep.label}
                </button>
              </div>

              {/* Position label */}
              <p className="text-[7px] text-muted-foreground/60 text-center mt-0.5 whitespace-nowrap">
                {gi === 0 ? "thumb" : gi === 1 ? "1 cun" : "2 cun"}
              </p>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-1">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-chart-primary" />
          <span className="text-[8px] text-muted-foreground font-medium">Yang (light)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-chart-destructive" />
          <span className="text-[8px] text-muted-foreground font-medium">Yin (deep)</span>
        </div>
      </div>
    </div>
  );
}

export default function PulsePointPicker({ selectedRow, onSelect }: PulsePointPickerProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center gap-8">
        {PULSE_POSITIONS.map((pp) => (
          <WristDiagram
            key={pp.hand}
            hand={pp.hand}
            positions={pp.positions}
            selectedRow={selectedRow}
            onSelect={onSelect}
          />
        ))}
      </div>

      {selectedRow && (
        <div className="text-center p-2 bg-primary/5 rounded-lg border border-primary/10">
          <p className="text-[10px] font-semibold text-primary">
            Selected: {ROW_DATA[selectedRow]?.organ}
          </p>
        </div>
      )}
    </div>
  );
}
