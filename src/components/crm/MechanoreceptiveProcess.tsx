
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Brain, 
  Activity, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Zap, 
  RefreshCw, 
  Info,
  Move
} from 'lucide-react';
import { cn } from '@/lib/utils';

type MechanoStep = 
  | 'CONFIRM'
  | 'LOCALIZE'
  | 'STRETCH'
  | 'CORRECT'
  | 'REASSESS';

interface MechanoreceptiveProcessProps {
  onSave: (summary: string) => void;
  onInhibited?: (summary: string) => void;
  onCancel: () => void;
  ligamentImages: Record<string, (string | null)[]>;
  onOpenLigamentCharts: () => void;
}

const REGIONS = ['Upper Body (above T12)', 'Lower Body (below T12)'];
const SIDES = ['Left', 'Right'];

interface JointGroup {
  label: string;
  joints: string[];
}

const JOINT_GROUPS: JointGroup[] = [
  { label: 'Lower', joints: ['Hip', 'Knee', 'Foot/Ankle', 'Pelvis', 'Sacrum'] },
  { label: 'Spine', joints: ['Lumbar', 'Thoracic', 'Cervical', 'Cranium', 'Jaw'] },
  { label: 'Upper', joints: ['Shoulder (GH Joint)', 'Scapula', 'Elbow', 'Wrist', 'Hand/Fingers'] }
];

const MechanoreceptiveProcess = ({ 
  onSave, 
  onInhibited,
  onCancel, 
  ligamentImages, 
  onOpenLigamentCharts
}: MechanoreceptiveProcessProps) => {
  const [step, setStep] = useState<MechanoStep>('CONFIRM');
  const [history, setHistory] = useState<MechanoStep[]>([]);

  const [region, setRegion] = useState('');
  const [side, setSide] = useState('');
  const [joint, setJoint] = useState('');
  const [ligament, setLigament] = useState('');

  const goToStep = (nextStep: MechanoStep) => {
    setHistory([...history, step]);
    setStep(nextStep);
  };

  const goBack = () => {
    const lastStep = history.pop();
    if (lastStep) {
      setStep(lastStep);
      setHistory([...history]);
    } else {
      onCancel();
    }
  };

  const handleFinish = () => {
    const summary = `Mechanoreceptive Unconscious: ${side} ${joint} (${ligament || 'priority ligament'}) -> Stretch + GV16 + Tuning Fork + Rocking`;
    onSave(summary);
  };

  const handleInhibited = () => {
    const summary = `Mechanoreceptive Unconscious (STILL INHIBITED): ${side} ${joint} (${ligament || 'priority ligament'})`;
    onInhibited?.(summary);
  };

  const stepNames: Record<MechanoStep, string> = {
    CONFIRM: 'Confirm',
    LOCALIZE: 'Localize',
    STRETCH: 'Stretch',
    CORRECT: 'Correct',
    REASSESS: 'Reassess'
  };

  const stepOrder: MechanoStep[] = ['CONFIRM', 'LOCALIZE', 'STRETCH', 'CORRECT', 'REASSESS'];
  const currentIndex = stepOrder.indexOf(step);

  const jointToCategoryMap: Record<string, string> = {
    "Hip": "hip_shoulder", "Shoulder (GH Joint)": "hip_shoulder", "Scapula": "hip_shoulder",
    "Knee": "knee_elbow", "Elbow": "knee_elbow",
    "Foot/Ankle": "ankle_wrist", "Wrist": "ankle_wrist", "Hand/Fingers": "ankle_wrist",
    "Cranium": "spinal", "Jaw": "spinal", "Cervical Spine": "spinal", "Thoracic Spine": "spinal", "Lumbar Spine": "spinal", "Pelvis": "spinal", "Sacrum": "spinal"
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">

      <div className="mb-4">
        <p className="text-xs text-muted-foreground mb-2">{stepNames[step]}</p>
        <div className="flex items-center gap-2">
          {stepOrder.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full transition-all shrink-0",
                step === s
                  ? "bg-primary"
                  : i < currentIndex
                    ? "bg-primary/30"
                    : "bg-border"
              )} />
            </div>
          ))}
        </div>
      </div>

      {step === 'CONFIRM' && (
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-foreground">1. Confirm Unconscious Mechanoreception</h3>
            <p className="text-xs text-muted-foreground">
              Work from an inhibited direct muscle in the clear (e.g. quadriceps).
            </p>
          </div>

          <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 text-xs font-bold">1</div>
              <div>
                <p className="font-medium text-sm text-foreground">State <strong>&quot;Afferent&quot;</strong> in the mind</p>
                <p className="text-xs text-muted-foreground">The inhibited muscle facilitates (locks). <strong>Thought is a stim:</strong> stating &quot;afferent&quot; locks it; an unrelated thought unlocks it. The X card is the objective way to hold the indication.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 text-xs font-bold">2</div>
              <div>
                <p className="font-medium text-sm text-foreground">Show the <strong>X card</strong> for 5–10 seconds</p>
                <p className="text-xs text-muted-foreground">The inhibited muscle facilitates → <strong>afferent unconscious mechanoreception confirmed</strong>. (TL of GV16 facilitates too — same test, same result.)</p>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-start gap-3">
              <Info size={14} className="text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-foreground">The X card is your mechanoreception check</p>
                <p className="text-xs text-muted-foreground">Viewing an X-pattern for 5–10s while testing an inhibited direct muscle is the quick confirmation. If it facilitates, it&apos;s unconscious mechanoreception via the spinocerebellar tract. The X card is <strong>more objective</strong> than stating it in the mind — use it as your primary confirm.</p>
              </div>
            </div>
          </div>

          <Button onClick={() => goToStep('LOCALIZE')} className="w-full h-10 rounded-lg text-xs font-medium">
            Confirmed — Localise the Ligament <ChevronRight size={14} className="ml-2" />
          </Button>
        </div>
      )}

      {step === 'LOCALIZE' && (
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-foreground">2. Localise the Ligament</h3>
            <p className="text-xs text-muted-foreground">
              Switch to a strong indicator muscle. The client TLs <strong>GV16 (cerebellum point)</strong> — the indicator stays facilitated. Then bracket in binaries.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground font-medium text-center">
              Client: hold GV16 (midline hollow below the occiput). Strong indicator → stays clear.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Region</p>
            <div className="grid grid-cols-2 gap-2">
              {REGIONS.map(r => (
                <Button key={r} variant="outline" size="sm" className={cn("rounded-lg font-medium", region === r ? "border-primary bg-primary/10" : "border-border")} onClick={() => setRegion(r)}>
                  {r}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Side</p>
            <div className="grid grid-cols-2 gap-2">
              {SIDES.map(s => (
                <Button key={s} variant="outline" size="sm" className={cn("rounded-lg font-medium", side === s ? "border-primary bg-primary/10" : "border-border")} onClick={() => setSide(s)}>
                  {s}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Joint</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {JOINT_GROUPS.flatMap(g => g.joints).map(j => (
                <Button key={j} variant="outline" size="sm" className={cn("rounded-lg text-xs font-medium", joint === j ? "border-primary bg-primary/10" : "border-border")} onClick={() => setJoint(j)}>
                  {j}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Ligament (specific)</p>
              <Button variant="link" size="sm" className="text-[10px] h-auto p-0 text-muted-foreground" onClick={onOpenLigamentCharts}>
                View Charts
              </Button>
            </div>
            <Input
              placeholder="Lightly rub over the suspected ligament — if it momentarily facilitates, that's the one. Enter name or leave blank."
              className="h-10 rounded-lg text-xs font-medium"
              value={ligament}
              onChange={(e) => setLigament(e.target.value)}
            />
            {joint && (
              <div className="grid grid-cols-2 gap-2">
                {(ligamentImages[jointToCategoryMap[joint]] || []).slice(0, 2).map((url, i) => url && (
                  <div key={i} className="aspect-video rounded-lg overflow-hidden border border-border">
                    <img src={url} alt="Ligament reference" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2 p-3 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-start gap-3">
              <Info size={14} className="text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-foreground">Rub to confirm, stretch to correct</p>
                <p className="text-xs text-muted-foreground"><strong>Rubbing/compressing</strong> the tissue down-regulates the signal → the indicator momentarily facilitates (use this to confirm the spot). <strong>Stretching</strong> aggravates it → the indicator inhibits (this held with GV16 drives the correction). Same tissue, opposite readings.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Info size={14} className="text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-foreground">Golgi receptors are everywhere</p>
                <p className="text-xs text-muted-foreground">They sit in ligaments, tendons <strong>and fascia</strong>. That&apos;s why the tissue can be close (e.g. SC ligament → neck flexors) or distant and contralateral (e.g. anterior oblique sling → glute medius). When it doesn&apos;t &quot;make sense,&quot; follow the process anyway — it finds the tissue.</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={goBack} className="flex-1 rounded-lg"><ChevronLeft size={14} className="mr-1" /> Back</Button>
            <Button size="sm" disabled={!region || !side || !joint} onClick={() => goToStep('STRETCH')} className="flex-[2] rounded-lg font-medium">
              Ligament Found <ChevronRight size={14} className="ml-1" />
            </Button>
          </div>
        </div>
      )}

      {step === 'STRETCH' && (
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-foreground">3. Find the Direction of Stretch</h3>
            <p className="text-xs text-muted-foreground">
              On a strong indicator, stretch the ligament in different directions. The direction that <strong>inhibits</strong> the indicator is the one to correct.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-3">
            <div className="space-y-2">
              <Move size={20} className="text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                Stretch {side} {joint} in different directions
              </p>
              <p className="text-xs text-muted-foreground">
                Place your hand over the tissue and stretch through it. The direction that <strong>inhibits</strong> the indicator is the one to correct.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-background border border-border">
              <p className="text-xs font-medium text-foreground mb-1">Rubbing vs stretching — same tissue, opposite readings</p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li><strong>Rub / compress</strong> → down-regulates → muscle momentarily <strong>facilitates</strong> → use to <strong>confirm</strong> the spot</li>
                <li><strong>Stretch</strong> → aggravates → indicator <strong>inhibits</strong> → held with GV16, this <strong>drives the correction</strong></li>
              </ul>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={goBack} className="flex-1 rounded-lg"><ChevronLeft size={14} className="mr-1" /> Back</Button>
            <Button size="sm" onClick={() => goToStep('CORRECT')} className="flex-[2] rounded-lg font-medium">
              Direction Found <ChevronRight size={14} className="ml-1" />
            </Button>
          </div>
        </div>
      )}

      {step === 'CORRECT' && (
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-foreground">4. Correction</h3>
            <p className="text-xs text-muted-foreground">
              Connect the ligament and the cerebellum point — then reset the circuit.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-muted/50 overflow-hidden">
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">1</div>
                <Brain size={16} className="text-muted-foreground shrink-0" />
                <div>
                  <p className="font-medium text-xs text-foreground">Hold GV16 (cerebellum point)</p>
                  <p className="text-xs text-muted-foreground">Client or practitioner holds the point below the occiput. This is the cerebellum relay — the top of the spinocerebellar pathway.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">2</div>
                <Activity size={16} className="text-muted-foreground shrink-0" />
                <div>
                  <p className="font-medium text-xs text-foreground">Take the ligament into the stretch</p>
                  <p className="text-xs text-muted-foreground">The direction you found in step 3 — the one that inhibits the indicator.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">3</div>
                <Zap size={16} className="text-muted-foreground shrink-0" />
                <div>
                  <p className="font-medium text-xs text-foreground">Tuning fork on bone + Rocking</p>
                  <p className="text-xs text-muted-foreground">Strike the tuning fork and rest it on a bony surface (head, sternum, or sacrum). Add rocking afterwards. This creates a piezoelectric effect that normalises the charge between the cerebellum and the ligament.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground font-medium text-center">
              Hold GV16, maintain the stretch, apply the tuning fork — then rock. Retest the original muscle — it now facilitates. Done.
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={goBack} className="flex-1 rounded-lg"><ChevronLeft size={14} className="mr-1" /> Back</Button>
            <Button size="sm" onClick={() => goToStep('REASSESS')} className="flex-[2] rounded-lg font-medium">
              Correction Applied <ChevronRight size={14} className="ml-1" />
            </Button>
          </div>
        </div>
      )}

      {step === 'REASSESS' && (
        <div className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg border border-border">
            <div className="flex items-center gap-3 mb-3">
              <RefreshCw size={16} className="text-chart-emerald" />
              <h3 className="text-sm font-medium text-foreground">5. Re-assess</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Retest the original inhibited muscle — it now facilitates. The ligament signal is restored.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              The cerebellum can now &quot;see&quot; the joint again. Movement rate, rhythm and accuracy are back online.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <Button size="sm" className="rounded-lg font-medium" onClick={handleFinish}>
              Pathway is Clear <CheckCircle2 size={14} className="ml-1" />
            </Button>
            <Button variant="outline" size="sm" className="rounded-lg font-medium" onClick={handleInhibited}>
              Still Inhibited — Add Layer
            </Button>
          </div>
        </div>
      )}

    </div>
  );
};

export default MechanoreceptiveProcess;
