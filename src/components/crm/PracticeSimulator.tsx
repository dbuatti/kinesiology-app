
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Activity, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PracticeSimulatorProps {
  simStep: 'idle' | 'test_baseline' | 'apply_challenge' | 'apply_correction' | 'retest' | 'complete';
  simImStatus: 'Normotonic' | 'Inhibited';
  simHoldReflex: boolean;
  simApplyStretch: boolean;
  simApplyIsometric: boolean;
  simNasalBreathing: boolean;
  simTimer: number;
  simTimerActive: boolean;
  sandboxJoint: string;
  sandboxTissue: 'Ligament' | 'Tendon';
  sandboxAction: string;
  sandboxProtocol: any;
  setSimHoldReflex: (val: boolean) => void;
  setSimApplyStretch: (val: boolean) => void;
  setSimApplyIsometric: (val: boolean) => void;
  setSimNasalBreathing: (val: boolean) => void;
  onStartSimulation: () => void;
  onTestBaseline: () => void;
  onApplyChallenge: () => void;
  onStartCorrectionTimer: () => void;
  onRetest: () => void;
}

const PracticeSimulator = ({
  simStep,
  simImStatus,
  simHoldReflex,
  simApplyStretch,
  simApplyIsometric,
  simNasalBreathing,
  simTimer,
  simTimerActive,
  sandboxJoint,
  sandboxTissue,
  sandboxAction,
  sandboxProtocol,
  setSimHoldReflex,
  setSimApplyStretch,
  setSimApplyIsometric,
  setSimNasalBreathing,
  onStartSimulation,
  onTestBaseline,
  onApplyChallenge,
  onStartCorrectionTimer,
  onRetest
}: PracticeSimulatorProps) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="border border-border shadow-lg rounded-2xl bg-card overflow-hidden">
      <CardHeader className="bg-muted/50 border-b border-border p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="text-indigo-600" size={20} />
            <CardTitle className="text-base font-bold text-foreground">Live Practice Simulator</CardTitle>
          </div>
          <Badge className={cn(
            "font-black text-[8px] uppercase tracking-widest px-2.5 py-1 rounded-full",
            simImStatus === 'Normotonic' ? "bg-emerald-500 text-primary-foreground" : "bg-rose-500 text-primary-foreground"
          )}>
            IM: {simImStatus}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {simStep === 'idle' && (
          <div className="text-center py-8 space-y-4">
            <p className="text-sm text-muted-foreground font-medium">Ready to test your clinical skills? Run a simulated walkthrough of this protocol.</p>
            <Button onClick={onStartSimulation} className="bg-foreground hover:bg-foreground text-primary-foreground rounded-xl h-11 px-8 font-bold text-xs uppercase tracking-wider">
              Start Practice Simulator
            </Button>
          </div>
        )}

        {simStep === 'test_baseline' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <p className="text-sm font-bold text-foreground/80">Step 1: Test the baseline Indicator Muscle (IM) to ensure it is strong (Normotonic).</p>
            <div className="flex justify-center py-4">
              <Button onClick={onTestBaseline} className="bg-foreground hover:bg-foreground text-primary-foreground rounded-xl h-12 px-8 font-bold text-xs uppercase tracking-wider">
                Test Indicator Muscle (IM)
              </Button>
            </div>
          </div>
        )}

        {simStep === 'apply_challenge' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <p className="text-sm font-bold text-foreground/80">Step 2: Apply the physical challenge to find the threat.</p>
            <div className="p-4 bg-muted/50 rounded-xl border border-border text-xs text-muted-foreground leading-relaxed">
              {sandboxTissue === 'Ligament' 
                ? `Action: Gently stretch the priority ligament of the ${sandboxJoint}.`
                : `Action: Place the ${sandboxJoint} into the restricted action (${sandboxAction}) and apply resistance.`}
            </div>
            <div className="flex justify-center py-4">
              <Button onClick={onApplyChallenge} className="bg-rose-600 hover:bg-rose-700 text-primary-foreground rounded-xl h-12 px-8 font-bold text-xs uppercase tracking-wider">
                {sandboxTissue === 'Ligament' ? 'Apply Ligament Stretch' : 'Apply Muscle Resistance'}
              </Button>
            </div>
          </div>
        )}

        {simStep === 'apply_correction' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <p className="text-sm font-bold text-foreground/80">Step 3: Apply the correction coordinates and hold.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sandboxTissue === 'Ligament' ? (
                <>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl border border-border">
                    <span className="text-xs font-bold text-foreground/80">Hold GV16 (Cerebellum)</span>
                    <Switch checked={simHoldReflex} onCheckedChange={setSimHoldReflex} />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl border border-border">
                    <span className="text-xs font-bold text-foreground/80">Maintain Ligament Stretch</span>
                    <Switch checked={simApplyStretch} onCheckedChange={setSimApplyStretch} />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl border border-border">
                    <span className="text-xs font-bold text-foreground/80">Hold Contralateral S1</span>
                    <Switch checked={simHoldReflex} onCheckedChange={setSimHoldReflex} />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl border border-border">
                    <span className="text-xs font-bold text-foreground/80">30% Isometric Contraction</span>
                    <Switch checked={simApplyIsometric} onCheckedChange={setSimApplyIsometric} />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl border border-border sm:col-span-2">
                    <span className="text-xs font-bold text-foreground/80">Nasal Breathing (In & Out)</span>
                    <Switch checked={simNasalBreathing} onCheckedChange={setSimNasalBreathing} />
                  </div>
                </>
              )}
            </div>

            <div className="bg-foreground text-primary-foreground p-6 rounded-2xl flex flex-col items-center justify-center border border-foreground/20">
              <div className="text-4xl font-black text-indigo-400 mb-4 font-mono">{simTimer}s</div>
              <Button 
                onClick={onStartCorrectionTimer} 
                disabled={simTimerActive}
                className="bg-indigo-600 hover:bg-indigo-700 text-primary-foreground rounded-xl h-11 px-8 font-bold text-xs uppercase tracking-wider"
              >
                {simTimerActive ? "Calibrating..." : "Apply Correction"}
              </Button>
            </div>
          </div>
        )}

        {simStep === 'retest' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <p className="text-sm font-bold text-foreground/80">Step 4: Re-test the Indicator Muscle (IM) to verify the correction.</p>
            <div className="flex justify-center py-4">
              <Button onClick={onRetest} className="bg-emerald-600 hover:bg-emerald-700 text-primary-foreground rounded-xl h-12 px-8 font-bold text-xs uppercase tracking-wider">
                Re-Test Indicator Muscle (IM)
              </Button>
            </div>
          </div>
        )}

        {simStep === 'complete' && (
          <div className="text-center py-8 space-y-4 animate-in zoom-in-95 duration-500">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
              <CheckCircle2 size={32} />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-bold text-foreground">Pathway Integrated!</h4>
              <p className="text-xs text-muted-foreground">Excellent work. You have successfully completed the clinical loop.</p>
            </div>
            <Button onClick={onStartSimulation} className="bg-foreground hover:bg-foreground text-primary-foreground rounded-xl h-10 px-6 font-bold text-xs uppercase tracking-wider">
              Practice Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PracticeSimulator;