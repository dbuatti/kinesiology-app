
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BookOpen, 
  Clock, 
  Target, 
  AlertCircle, 
  CheckCircle2,
  Wind,
  Timer,
  TrendingUp,
  PlayCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BoltResourcesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentScore?: number | null;
  onStartBolt?: () => void;
}

const BoltResourcesModal = ({ open, onOpenChange, currentScore, onStartBolt }: BoltResourcesModalProps) => {
  const hasScore = currentScore !== null && currentScore !== undefined;
  const needsImprovement = hasScore && currentScore < 25;
  const isOnTrack = hasScore && currentScore >= 25 && currentScore < 40;
  const isOptimal = hasScore && currentScore >= 40;
  const progress = hasScore ? Math.min(100, Math.round((currentScore / 40) * 100)) : 0;

  const scoreBanner = needsImprovement
    ? {
        container: "border-amber-200 bg-amber-50",
        bar: "bg-amber-500",
        badge: "bg-amber-500 text-primary-foreground",
        badgeIcon: null,
        title: "Needs Improvement",
        detail: "Prioritise the Breathing Recovery exercise below",
        sub: "Target: 25s minimum · Optimal: 40s+",
        subClass: "text-amber-700",
      }
    : isOptimal
      ? {
          container: "border-emerald-200 bg-emerald-50",
          bar: "bg-emerald-500",
          badge: "bg-emerald-500 text-primary-foreground",
          badgeIcon: <CheckCircle2 size={14} className="mr-1" />,
          title: "Optimal",
          detail: "Maintain with daily recovery practice",
          sub: "Keep it up — you're in the 40s+ range",
          subClass: "text-emerald-700",
        }
      : {
          container: "border-indigo-200 bg-indigo-50",
          bar: "bg-indigo-500",
          badge: "bg-indigo-500 text-primary-foreground",
          badgeIcon: <TrendingUp size={14} className="mr-1" />,
          title: "On Track",
          detail: "Keep practising to reach the 40s optimal target",
          sub: `Target: 25s minimum · ${currentScore}s of 40s`,
          subClass: "text-indigo-700",
        };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Wind size={24} className="text-primary-foreground" />
            </div>
            BOLT Score Improvement Resources
          </DialogTitle>
          <DialogDescription>
            Evidence-based breathing exercises to improve CO2 tolerance and respiratory health
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {hasScore && (
            <Card className={`border-2 ${scoreBanner.container}`}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Current BOLT Score</p>
                    <p className="text-4xl font-black text-foreground tabular-nums">{currentScore}s</p>
                    <p className={`text-xs font-medium mt-1 ${scoreBanner.subClass}`}>{scoreBanner.sub}</p>
                  </div>
                  <div className="text-right">
                    <Badge className={`${scoreBanner.badge} mb-2`}>
                      {scoreBanner.badgeIcon} {scoreBanner.title}
                    </Badge>
                    <p className="text-xs font-medium text-foreground/80">{scoreBanner.detail}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="h-2 bg-white/60 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${scoreBanner.bar} rounded-full transition-all duration-700 ease-out`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                    <span>25s Functional</span>
                    <span>40s+ Optimal</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Timer size={20} className="text-indigo-600" />
                Breathing Recovery Exercise
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-card rounded-lg border border-indigo-100">
                  <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-primary-foreground font-bold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Breath Hold</p>
                    <p className="text-sm text-foreground/80 leading-relaxed">
                      Take a normal breath in and out through the nose. Plug the nose/nostrils for <strong>5 seconds</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-card rounded-lg border border-indigo-100">
                  <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-primary-foreground font-bold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Recovery Breathing</p>
                    <p className="text-sm text-foreground/80 leading-relaxed">
                      Release the hold and resume normal, calm, nasal breathing for <strong>10-15 seconds</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-card rounded-lg border border-indigo-100">
                  <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-primary-foreground font-bold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Repeat Cycle</p>
                    <p className="text-sm text-foreground/80 leading-relaxed">
                      Continue the cycle for <strong>5-15 minutes</strong>
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-indigo-600 text-primary-foreground p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={18} />
                  <p className="font-bold">Recommended Practice Schedule</p>
                </div>
                <p className="text-sm text-indigo-100">
                  Do this exercise <strong>2-3 times per day</strong>, everyday in sets of <strong>10-20 minutes</strong> to increase your BOLT score
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target size={20} className="text-emerald-600" />
                Target Goals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <TrendingUp size={24} className="text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="font-bold text-emerald-900">Minimum Target: 25 seconds</p>
                  <p className="text-sm text-emerald-700">Essential for optimizing health</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                <CheckCircle2 size={24} className="text-primary flex-shrink-0" />
                <div>
                  <p className="font-bold text-primary">Optimal Target: 40+ seconds</p>
                  <p className="text-sm text-primary">Ideal for peak respiratory function</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Alert className="bg-destructive/5 border-destructive/20">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <AlertDescription className="text-sm text-destructive space-y-2">
              <p className="font-bold">Important Clinical Notes:</p>
              <ul className="space-y-1 ml-4 list-disc">
                <li>
                  The lower the client's BOLT score, the more imperative it is for them to do the Breathing Recovery exercise
                </li>
                <li>
                  If a client fails to heed advice regarding breathing and symptoms don't improve, consider whether they are committed to fully healing
                </li>
                <li>
                  <strong>Triggering Response:</strong> On some occasions, breathing exercises can be stressful to the nervous system. If this occurs, use the <strong>Nociceptive Threat Assessment</strong> to clear the nervous system's negative response before continuing
                </li>
                <li>
                  There needs to be a balance of shared responsibility, but ultimately the client must drive their own healing process
                </li>
              </ul>
            </AlertDescription>
          </Alert>

          <Card className="border-border bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen size={20} className="text-foreground/80" />
                Reference Books
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border">
                <BookOpen size={20} className="text-indigo-600 flex-shrink-0" />
                <div>
                  <p className="font-bold text-foreground">The Oxygen Advantage</p>
                  <p className="text-sm text-muted-foreground">by Patrick McKeown</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border">
                <BookOpen size={20} className="text-indigo-600 flex-shrink-0" />
                <div>
                  <p className="font-bold text-foreground">The Breathing Cure</p>
                  <p className="text-sm text-muted-foreground">by Patrick McKeown</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={() => {
              window.print();
            }}
            className="flex-1"
          >
            Print Resources
          </Button>
          <Button 
            onClick={() => {
              onOpenChange(false);
              onStartBolt?.();
            }}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700"
          >
            <PlayCircle size={16} className="mr-2" /> Run BOLT Test
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BoltResourcesModal;