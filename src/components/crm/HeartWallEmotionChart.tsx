
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { EMOTION_CODE_CHART, ROW_DATA } from "@/data/emotion-code-data";

interface HeartWallEmotionChartProps {
  selectedEmotion: string | null;
  onSelect: (emotion: string, row: number) => void;
  knownOrganRow?: number | null;
}

export default function HeartWallEmotionChart({ selectedEmotion, onSelect, knownOrganRow }: HeartWallEmotionChartProps) {
  const [search, setSearch] = useState("");

  const normalisedSearch = search.toLowerCase().trim();

  const rows = useMemo(() => {
    const rowNums = knownOrganRow ? [knownOrganRow] : [1, 2, 3, 4, 5, 6];

    return rowNums.map((rowNum) => {
      const cell = EMOTION_CODE_CHART[rowNum];
      const allEmotions = [...cell.columnA, ...cell.columnB];
      const filtered = normalisedSearch
        ? allEmotions.filter(e => e.toLowerCase().includes(normalisedSearch))
        : allEmotions;
      return { rowNum, data: ROW_DATA[rowNum], emotions: filtered };
    }).filter(r => r.emotions.length > 0);
  }, [knownOrganRow, normalisedSearch]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search emotions..."
          className="pl-9 pr-9 h-10 rounded-xl bg-muted/50 border-border text-sm"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
        {rows.map(({ rowNum, data, emotions }) => (
          <div key={rowNum} className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-3 py-2 bg-muted/50 border-b border-border">
              <p className="text-[10px] font-semibold text-chart-primary uppercase tracking-wider">
                {data.organ}
              </p>
              <p className="text-[9px] text-muted-foreground mt-0.5 line-clamp-1">
                {data.muscles}
              </p>
            </div>
            <div className="p-2 flex flex-wrap gap-1.5">
              {emotions.map((emotion) => {
                const isColA = EMOTION_CODE_CHART[rowNum].columnA.includes(emotion);
                const isSelected = selectedEmotion === emotion;
                return (
                  <button
                    key={emotion}
                    onClick={() => onSelect(emotion, rowNum)}
                    className={cn(
                      "px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border",
                      isSelected
                        ? "bg-chart-primary text-primary-foreground border-chart-primary shadow-sm"
                        : "bg-muted/40 text-foreground border-transparent hover:bg-muted hover:border-border"
                    )}
                  >
                    {emotion}
                    <span className={cn(
                      "ml-1.5 text-[8px] uppercase font-bold",
                      isSelected ? "text-primary-foreground/60" : "text-muted-foreground/60"
                    )}>
                      {isColA ? "A" : "B"}
                    </span>
                  </button>
                );
              })}
              {emotions.length === 0 && (
                <p className="text-[10px] text-muted-foreground italic px-1 py-1">No matches</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
