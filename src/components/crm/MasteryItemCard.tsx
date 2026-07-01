
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Dumbbell, Baby, Brain, Zap, 
  TrendingUp, Clock, CheckCircle2, 
  AlertCircle, Sparkles, PlayCircle, ExternalLink 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MasteryStat } from "@/utils/mastery-stats";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";

interface MasteryItemCardProps {
  stat: MasteryStat;
  onClick?: () => void;
}

const MasteryItemCard = ({ stat, onClick }: MasteryItemCardProps) => {
  const Icon = stat.category === 'Muscles' ? Dumbbell :
               stat.category === 'Reflexes' ? Baby :
               stat.category === 'Brain Zones' ? Brain : Zap;

  const levelColors = {
    'Novice': 'bg-rose-500',
    'Competent': 'bg-amber-500',
    'Proficient': 'bg-indigo-500',
    'Master': 'bg-emerald-500'
  };

  const levelText = {
    'Novice': 'text-rose-600',
    'Competent': 'text-amber-600',
    'Proficient': 'text-indigo-600',
    'Master': 'text-emerald-600'
  };

  // Progress towards next level (max 15 for Master)
  const progress = Math.min((stat.count / 15) * 100, 100);

  return (
    <Card 
      className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer group rounded-2xl overflow-hidden bg-card"
      onClick={onClick}
    >
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-110",
              levelColors[stat.masteryLevel]
            )}>
              <Icon size={20} />
            </div>
            <div>
              <h4 className="font-black text-sm text-foreground leading-tight group-hover:text-indigo-600 transition-colors">{stat.name}</h4>
              <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mt-0.5">{stat.category}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <Badge variant="outline" className={cn("border-none font-black text-[8px] uppercase tracking-widest px-2 py-0.5", levelText[stat.masteryLevel], "bg-muted/50")}>
              {stat.masteryLevel}
            </Badge>
            {stat.videoUrl && (
              <a 
                href={stat.videoUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-indigo-600 hover:text-indigo-700 transition-colors"
                title="Watch Lesson"
              >
                <PlayCircle size={14} className="fill-indigo-50" />
              </a>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
            <span className="text-muted-foreground">Experience</span>
            <span className="text-foreground">{stat.count} Logs</span>
          </div>
          <Progress value={progress} className={cn("h-1.5", `[&>div]:${levelColors[stat.masteryLevel]}`)} />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-1.5">
            <TrendingUp size={12} className="text-rose-500" />
            <span className="text-[9px] font-bold text-muted-foreground">
              {stat.dysfunctionRate}% Dysfunction
            </span>
          </div>
          {stat.lastLogged && (
            <div className="flex items-center gap-1 text-[8px] font-bold text-muted-foreground">
              <Clock size={10} />
              {formatDistanceToNow(new Date(stat.lastLogged), { addSuffix: true })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MasteryItemCard;