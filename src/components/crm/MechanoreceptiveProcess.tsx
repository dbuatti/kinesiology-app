
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">

      <div className="flex items-center gap-0 mb-6">
        {stepOrder.map((s, i) => (
          <div key={s} className="flex items-center">
            <div className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0",
              currentStep === s
                ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                : i < currentIndex
                  ? "bg-blue-200 text-blue-700"
                  : "bg-muted text-muted-foreground"
            )}>
              {i < currentIndex ? <CheckCircle2 size={14} /> : i + 1}
            </div>
            <span className={cn(
              "text-[9px] font-semibold uppercase tracking-wider mx-1.5 hidden sm:block",
              currentStep === s ? "text-blue-600" : i < currentIndex ? "text-blue-500" : "text-muted-foreground"
            )}>
              {stepNames[s]}
            </span>
            {i < stepOrder.length - 1 && (
              <div className={cn("w-6 h-px mx-0.5", i < currentIndex ? "bg-blue-300" : "bg-border")} />
            )}
          </div>
        ))}
      </div>

      {step === 'CONFIRM' && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-foreground">1. Confirm Unconscious Mechanoreception</h3>
            <p className="text-sm text-muted-foreground">
              Work from an inhibited direct muscle in the clear (e.g. quadriceps).
            </p>
          </div>

          <div className="p-5 rounded-xl bg-blue-50 border border-blue-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 text-sm font-bold">1</div>
              <div>
                <p className="font-semibold text-blue-900">State <strong>&quot;Afferent&quot;</strong></p>
                <p className="text-sm text-blue-700">The inhibited muscle facilitates (locks). This confirms the problem is afferent — but not yet which type.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 text-sm font-bold">2</div>
              <div>
                <p className="font-semibold text-blue-900">Show the <strong>X card</strong> for 5–10 seconds</p>
                <p className="text-sm text-blue-700">The inhibited muscle facilitates → <strong>afferent unconscious mechanoreception confirmed</strong>. (TL of GV16 facilitates too — same test.)</p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-muted border border-border">
            <div className="flex items-start gap-3">
              <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">The X card is your mechanoreception check</p>
                <p className="text-xs text-muted-foreground">Viewing an X-pattern (two crossed lines) for 5–10s while testing an inhibited direct muscle is the quick confirmation. If it facilitates, it&apos;s unconscious mechanoreception via the spinocerebellar tract. TL of GV16 (the cerebellum point) confirms the same thing.</p>
              </div>
            </div>
          </div>

          <Button onClick={() => goToStep('LOCALIZE')} className="w-full h-14 rounded-xl bg-blue-600 hover:bg-blue-700 text-lg font-medium">
            Confirmed — Localise the Ligament <ChevronRight size={20} className="ml-2" />
          </Button>
        </div>
      )}

      {step === 'LOCALIZE' && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-foreground">2. Localise the Ligament</h3>
            <p className="text-sm text-muted-foreground">
              Switch to a strong indicator muscle. The client TLs <strong>GV16 (cerebellum point)</strong> — the indicator stays facilitated. Then bracket in binaries.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
            <p className="text-sm text-blue-800 font-medium text-center">
              Client: hold GV16 (midline hollow below the occiput). Strong indicator → stays clear.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Region</p>
            <div className="grid grid-cols-2 gap-3">
              {REGIONS.map(r => (
                <Button key={r} variant="outline" className={cn("h-16 rounded-xl border-2 font-medium", region === r ? "border-blue-500 bg-blue-50" : "border-border")} onClick={() => setRegion(r)}>
                  {r}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Side</p>
            <div className="grid grid-cols-2 gap-3">
              {SIDES.map(s => (
                <Button key={s} variant="outline" className={cn("h-14 rounded-xl border-2 font-medium", side === s ? "border-blue-500 bg-blue-50" : "border-border")} onClick={() => setSide(s)}>
                  {s}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Joint</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {JOINT_GROUPS.flatMap(g => g.joints).map(j => (
                <Button key={j} variant="outline" className={cn("h-12 rounded-xl text-xs font-medium", joint === j ? "border-blue-500 bg-blue-50" : "border-border")} onClick={() => setJoint(j)}>
                  {j}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Ligament (specific)</p>
              <Button variant="link" size="sm" className="text-[10px] h-auto p-0 text-blue-600" onClick={onOpenLigamentCharts}>
                View Charts
              </Button>
            </div>
            <Input
              placeholder="Lightly rub over the suspected ligament — if it momentarily facilitates, that's the one. Enter name or leave blank."
              className="h-12 rounded-xl font-medium"
              value={ligament}
              onChange={(e) => setLigament(e.target.value)}
            />
            {joint && (
              <div className="grid grid-cols-2 gap-2">
                {(ligamentImages[jointToCategoryMap[joint]] || []).slice(0, 2).map((url, i) => url && (
                  <div key={i} className="aspect-video rounded-lg overflow-hidden border bg-white shadow-sm">
                    <img src={url} alt="Ligament reference" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl bg-muted border border-border">
            <p className="text-xs text-muted-foreground font-medium">
              <strong>You don&apos;t need to memorise the map.</strong> Touch the suspected ligament — if the indicator momentarily facilitates, that&apos;s the one. The testing finds it for you.
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={goBack} className="flex-1 h-12 rounded-xl"><ChevronLeft size={18} className="mr-2" /> Back</Button>
            <Button disabled={!region || !side || !joint} onClick={() => goToStep('STRETCH')} className="flex-[2] h-12 rounded-xl bg-blue-600 hover:bg-blue-700 font-medium">
              Ligament Found <ChevronRight size={18} className="ml-2" />
            </Button>
          </div>
        </div>
      )}

      {step === 'STRETCH' && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-foreground">3. Find the Direction of Stretch</h3>
            <p className="text-sm text-muted-foreground">
              On a strong indicator, stretch the ligament in different directions. The direction that <strong>inhibits</strong> the indicator is the one to correct.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 text-center space-y-3">
            <Move size={40} className="text-blue-600 mx-auto" />
            <p className="text-lg font-semibold text-blue-900">
              Stretch {side} {joint} in different directions
            </p>
            <p className="text-sm text-blue-700">
              Place your hand over the ligament area and stretch through it. Ligaments and fascia wrap around each other — it needn&apos;t be pinpoint. The direction that inhibits the indicator muscle is the correction direction.
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={goBack} className="flex-1 h-12 rounded-xl"><ChevronLeft size={18} className="mr-2" /> Back</Button>
            <Button onClick={() => goToStep('CORRECT')} className="flex-[2] h-12 rounded-xl bg-blue-600 hover:bg-blue-700 font-medium">
              Direction Found <ChevronRight size={18} className="ml-2" />
            </Button>
          </div>
        </div>
      )}

      {step === 'CORRECT' && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-foreground">4. Correction</h3>
            <p className="text-sm text-muted-foreground">
              Connect the ligament and the cerebellum point — then reset the circuit.
            </p>
          </div>

          <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-blue-200">
                <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">1</div>
                <Brain size={20} className="text-blue-600 shrink-0" />
                <div>
                  <p className="font-semibold text-sm text-blue-900">Hold GV16 (cerebellum point)</p>
                  <p className="text-xs text-blue-700">Client or practitioner holds the point below the occiput. This is the cerebellum relay — the top of the spinocerebellar pathway.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-blue-200">
                <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">2</div>
                <Activity size={20} className="text-blue-600 shrink-0" />
                <div>
                  <p className="font-semibold text-sm text-blue-900">Take the ligament into the stretch</p>
                  <p className="text-xs text-blue-700">The direction you found in step 3 — the one that inhibits the indicator.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-blue-200">
                <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">3</div>
                <Zap size={20} className="text-blue-600 shrink-0" />
                <div>
                  <p className="font-semibold text-sm text-blue-900">Tuning fork on bone + Rocking</p>
                  <p className="text-xs text-blue-700">Strike the tuning fork and rest it on a bony surface (head, sternum, or sacrum). Add rocking afterwards. This creates a piezoelectric effect that normalises the charge between the cerebellum and the ligament.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
            <p className="text-xs text-amber-800 font-medium text-center">
              Hold GV16, maintain the stretch, apply the tuning fork — then rock. Retest the original muscle — it now facilitates. Done.
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={goBack} className="flex-1 h-12 rounded-xl"><ChevronLeft size={18} className="mr-2" /> Back</Button>
            <Button onClick={() => goToStep('REASSESS')} className="flex-[2] h-12 rounded-xl bg-blue-600 hover:bg-blue-700 font-medium">
              Correction Applied <ChevronRight size={18} className="ml-2" />
            </Button>
          </div>
        </div>
      )}

      {step === 'REASSESS' && (
        <div className="space-y-6">
          <div className="bg-muted p-8 rounded-xl border-2 border-border text-center">
            <div className="w-20 h-20 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-6">
              <RefreshCw size={48} className="text-chart-emerald" />
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-2">5. Re-assess</h3>
            <p className="text-foreground font-medium">
              Retest the original inhibited muscle — it now facilitates. The ligament signal is restored.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              The cerebellum can now &quot;see&quot; the joint again. Movement rate, rhythm and accuracy are back online.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <Button className="h-16 rounded-xl bg-chart-emerald hover:bg-chart-emerald/90 text-xl font-semibold shadow-sm" onClick={handleFinish}>
              Pathway is Clear <CheckCircle2 size={24} className="ml-2" />
            </Button>
            <Button variant="outline" className="h-16 rounded-xl border-2 border-blue-200 text-blue-700 hover:bg-blue-50 font-medium text-lg" onClick={handleInhibited}>
              Still Inhibited — Add Layer
            </Button>
          </div>
        </div>
      )}

    </div>
  );
};

export default MechanoreceptiveProcess;
