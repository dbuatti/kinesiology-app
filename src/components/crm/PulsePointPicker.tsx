
import { cn } from "@/lib/utils";
import { ROW_DATA } from "@/data/emotion-code-data";

interface PulsePointPickerProps {
  selectedRow: number | null;
  onSelect: (row: number) => void;
}

const HANDS = [
  {
    label: "Left Hand",
    points: [
      { left: "Small Intestine", right: "Heart", row: 1, pos: "Thumb" },
      { left: "Gallbladder", right: "Liver", row: 4, pos: "1 cun" },
      { left: "Bladder", right: "Kidney", row: 5, pos: "2 cun" },
    ],
  },
  {
    label: "Right Hand",
    points: [
      { left: "Lung", right: "Large Intestine", row: 3, pos: "Thumb" },
      { left: "Spleen", right: "Stomach", row: 2, pos: "1 cun" },
      { left: "Sex Organs", right: "Thyroid", row: 6, pos: "2 cun" },
    ],
  },
];

export default function PulsePointPicker({ selectedRow, onSelect }: PulsePointPickerProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-6">
        {HANDS.map((hand) => (
          <div key={hand.label} className="space-y-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center">
              {hand.label}
            </p>
            <div className="space-y-2">
              {hand.points.map((point) => {
                const isSelected = point.row === selectedRow;
                return (
                  <div key={point.pos} className="relative">
                    <div className="flex rounded-full overflow-hidden border-2 border-border">
                      {/* Left half — Yang / Light */}
                      <button
                        onClick={() => onSelect(point.row)}
                        className={cn(
                          "flex-1 py-2.5 px-2 text-center text-xs font-semibold transition-all",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted/50 text-foreground hover:bg-primary/10",
                        )}
                      >
                        {point.left}
                      </button>
                      {/* Divider */}
                      <div className="w-px bg-border" />
                      {/* Right half — Yin / Deep */}
                      <button
                        onClick={() => onSelect(point.row)}
                        className={cn(
                          "flex-1 py-2.5 px-2 text-center text-xs font-semibold transition-all",
                          isSelected
                            ? "bg-chart-destructive text-primary-foreground"
                            : "bg-muted/50 text-foreground hover:bg-chart-destructive/10",
                        )}
                      >
                        {point.right}
                      </button>
                    </div>
                    <p className="text-[8px] text-muted-foreground/60 text-center mt-1">{point.pos}</p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 pt-1">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2 rounded-sm bg-primary" />
          <span className="text-[9px] text-muted-foreground font-medium">Yang (light touch)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2 rounded-sm bg-chart-destructive" />
          <span className="text-[9px] text-muted-foreground font-medium">Yin (deep touch)</span>
        </div>
      </div>
    </div>
  );
}
