
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Trophy, 
  Zap, 
  RotateCcw, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle,
  TrendingUp,
  Target,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuizResultsProps {
  score: number;
  total: number;
  streak: number;
  onRestart: () => void;
  onExit: () => void;
}

const QuizResults = ({ score, total, streak, onRestart, onExit }: QuizResultsProps) => {
  const accuracy = total > 0 ? Math.round((score / total) * 100) : 0;
  
  const getMessage = () => {
    if (accuracy >= 90) return { title: "Clinical Master!", desc: "Your intuition is razor sharp. You're ready for the most complex cases.", color: "text-emerald-600" };
    if (accuracy >= 70) return { title: "Proficient Practitioner", desc: "Great work! You have a solid grasp of the foundations.", color: "text-indigo-600" };
    return { title: "Keep Studying", desc: "Repetition is the path to mastery. Return to the Bible and try again.", color: "text-amber-600" };
  };

  const message = getMessage();

  return (
    <div className="max-w-2xl mx-auto space-y-10 animate-in zoom-in-95 duration-700">
      <div className="text-center space-y-6">
        <div className="w-24 h-24 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-amber-100">
          <Trophy size={48} className="text-amber-600" />
        </div>
        <div className="space-y-2">
          <h2 className={cn("text-4xl font-semibold tracking-tight", message.color)}>{message.title}</h2>
          <p className="text-lg text-muted-foreground font-medium max-w-md mx-auto">{message.desc}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="border-none shadow-lg rounded-2xl bg-background text-center p-8 space-y-2">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Accuracy</p>
          <p className="text-4xl font-semibold text-foreground">{accuracy}%</p>
        </Card>
        <Card className="border-none shadow-lg rounded-2xl bg-background text-center p-8 space-y-2">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Best Streak</p>
          <p className="text-4xl font-semibold text-indigo-600">{streak}</p>
        </Card>
        <Card className="border-none shadow-lg rounded-2xl bg-background text-center p-8 space-y-2">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Total Answered</p>
          <p className="text-4xl font-semibold text-foreground">{total}</p>
        </Card>
      </div>

      <div className="p-8 bg-card text-primary-foreground rounded-2xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10"><Sparkles size={100} /></div>
        <div className="relative z-10 flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-card/10 flex items-center justify-center border border-primary-foreground/20">
            <TrendingUp size={32} className="text-indigo-400" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xl font-semibold">Clinical Evolution</h4>
            <p className="text-muted-foreground text-sm font-medium">Every question answered correctly builds your neural pathways for faster diagnosis.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 pt-4">
        <Button 
          onClick={onRestart}
          className="flex-1 h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-primary-foreground font-semibold text-xs shadow-xl shadow-indigo-100"
        >
          <RotateCcw size={20} className="mr-2" /> Try Another Set
        </Button>
        <Button 
          variant="outline"
          onClick={onExit}
          className="flex-1 h-16 rounded-2xl border-2 border-border font-semibold text-xs"
        >
          <ArrowLeft size={20} className="mr-2" /> Back to Hub
        </Button>
      </div>
    </div>
  );
};

export default QuizResults;