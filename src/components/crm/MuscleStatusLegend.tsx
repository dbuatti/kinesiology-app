
import { cn } from "@/lib/utils";
import { MUSCLE_STATUSES } from "@/data/muscle-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MuscleStatusLegend = () => {
  return (
    <Card className="border-none shadow-sm rounded-[2rem] bg-card overflow-hidden">
      <CardHeader className="bg-muted/50 border-b border-border/50 p-8">
        <CardTitle className="text-xl font-black">Muscle Status Legend</CardTitle>
      </CardHeader>
      <CardContent className="p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {MUSCLE_STATUSES.map(status => {
            const Icon = status.icon;
            return (
              <div key={status.value} className={cn("p-4 rounded-2xl border-2 transition-all", status.color)}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={18} className={status.color.split(' ')[0]} />
                  <span className="font-black text-xs text-foreground uppercase tracking-wider">{status.label}</span>
                </div>
                <p className="text-[10px] text-foreground/80 font-medium leading-relaxed">{status.description}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default MuscleStatusLegend;