import { useState, useCallback } from "react";
import { Brain, Check, ThumbsUp, ThumbsDown, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const CYCLE_LABELS: Record<number, string> = {
  0: 'Feel the belief in your body',
  1: 'Follow the sensation deeper',
  2: 'Identify the desired state',
  3: 'Embody the alternative',
  4: 'Deepen the new feeling',
};

const CYCLE_PROMPTS: Record<number, string> = {
  0: 'What do you notice? Where is it in the body? What sensation?',
  1: 'What do you notice now? Is it changing, moving, shifting?',
  2: 'What would you rather feel instead?',
  3: 'Feel that new state. What do you notice in the body now?',
  4: 'Let that feeling expand. What do you notice?',
};

const getCyclePrompt = (stepIdx: number, belief: string): string => {
  const trimmed = belief.trim();
  if (!trimmed) return CYCLE_PROMPTS[stepIdx];
  switch (stepIdx) {
    case 0: return `Feel yourself believing "${trimmed}". What do you notice? Where is it in the body? What sensation?`;
    case 1: return `Stay with that. Follow the sensation deeper. What do you notice now? Is it changing, moving, shifting?`;
    case 2: return `What would you rather feel instead of "${trimmed}"?`;
    case 3: return `Now feel that new state. What do you notice in the body now?`;
    case 4: return `Let that new feeling expand. What do you notice?`;
    default: return CYCLE_PROMPTS[stepIdx];
  }
};

const CYCLE_LETTERS: Record<number, string> = { 0: 'A', 1: 'B', 2: 'C', 3: 'D', 4: 'E' };

const CHECKPOINTS = ['F', 'G', 'H'] as const;
type CheckpointId = typeof CHECKPOINTS[number];

interface RoundData {
  responses: Record<number, string>;
  checkpoint: CheckpointId | null;
  checkpointResult: 'Yes' | 'No' | null;
}

const EMPTY_ROUND: RoundData = {
  responses: { 0: '', 1: '', 2: '', 3: '', 4: '' },
  checkpoint: null,
  checkpointResult: null,
};

interface LimitingBeliefsSelfWorkProps {
  onComplete: (summary: string) => void;
}

export default function LimitingBeliefsSelfWork({ onComplete }: LimitingBeliefsSelfWorkProps) {
  const [belief, setBelief] = useState('');
  const [started, setStarted] = useState(false);
  const [cycleStep, setCycleStep] = useState(0);
  const [responses, setResponses] = useState<Record<number, string>>({ 0: '', 1: '', 2: '', 3: '', 4: '' });
  const [checkpoint, setCheckpoint] = useState<CheckpointId | null>(null);
  const [checkpointResult, setCheckpointResult] = useState<'Yes' | 'No' | null>(null);
  const [phase, setPhase] = useState<'input' | 'cycle' | 'checkpoint' | 'complete'>('input');
  const [rounds, setRounds] = useState(1);

  const colors = {
    bg: "bg-[linear-gradient(180deg,#0A1411_0%,#0E1B16_50%,#0A1411_100%)]",
    card: "bg-white/[0.05] backdrop-blur-sm",
    accent: "bg-emerald-200/12 border-emerald-200/25 text-emerald-100",
    accentSolid: "bg-emerald-200 text-[#07120D]",
    accentHover: "hover:bg-emerald-200",
    muted: "bg-white/[0.07] border-white/[0.10] text-white/65",
    mutedHover: "hover:bg-white/[0.10]",
    mint: "text-emerald-100",
    mintBright: "text-emerald-200",
  };

  const handleStart = () => {
    if (!belief.trim()) return;
    setStarted(true);
    setPhase('cycle');
    setCycleStep(0);
    setResponses({ 0: '', 1: '', 2: '', 3: '', 4: '' });
    setCheckpoint(null);
    setCheckpointResult(null);
  };

  const handleResponse = (value: string) => {
    setResponses(prev => ({ ...prev, [cycleStep]: value }));
  };

  const handleNext = () => {
    if (cycleStep < 4) {
      setCycleStep(prev => prev + 1);
    } else {
      // All A-E filled, go to checkpoint
      setPhase('checkpoint');
      setCheckpoint('F');
    }
  };

  const handleCheckpoint = (result: 'Yes' | 'No') => {
    setCheckpointResult(result);
    if (result === 'Yes') {
      // Belief still holds, loop
      setRounds(r => r + 1);
      setPhase('cycle');
      setCycleStep(0);
      setResponses({ 0: '', 1: '', 2: '', 3: '', 4: '' });
      setCheckpoint(null);
      setCheckpointResult(null);
    } else {
      // Belief dissolved
      setPhase('complete');
    }
  };

  const handleComplete = () => {
    const summary = `Limiting Beliefs: "${belief}" — ${rounds} round(s) completed`;
    onComplete(summary);
  };

  // INPUT PHASE
  if (phase === 'input') {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl p-5 bg-white/[0.06] border border-white/[0.08] backdrop-blur-sm">
          <h2 className="text-xl font-sans font-bold mb-1">Limiting Beliefs</h2>
          <p className="text-[12px]" style={{color: "rgba(255,255,255,0.45)"}}>A-E cycle: Feel → Follow → Identify → Embody → Deepen</p>
        </div>
        <div className="rounded-2xl p-5 bg-white/[0.06] border border-white/[0.08] backdrop-blur-sm">
          <label className="text-[11px] uppercase tracking-wider block mb-2" style={{color: "rgba(255,255,255,0.5)"}}>Limiting Belief</label>
          <textarea
            value={belief}
            onChange={(e) => setBelief(e.target.value)}
            placeholder="I am not lovable... I am not enough... I am not safe..."
            className="w-full h-24 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white p-3 text-base resize-none focus:outline-none focus:border-emerald-200/40"
          />
          <p className="text-[11px] mt-2" style={{color: "rgba(255,255,255,0.4)"}}>State the belief you want to dissolve.</p>
        </div>
        <button
          onClick={handleStart}
          disabled={!belief.trim()}
          className={cn("w-full rounded-2xl py-4 px-6 text-base font-semibold uppercase tracking-wider transition-all min-h-[56px] touch-manipulation select-none [-webkit-tap-highlight-color:transparent] active:scale-[0.99]", colors.accentSolid, colors.accentHover, !belief.trim() && "opacity-50")}
        >
          <Brain size={20} className="inline mr-2" /> Start Dissolving
        </button>
      </div>
    );
  }

  // CYCLE PHASE
  if (phase === 'cycle') {
    const prompt = getCyclePrompt(cycleStep, belief);
    return (
      <div className="space-y-4">
        <div className="rounded-2xl p-5 bg-white/[0.06] border border-white/[0.08] backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold" style={{background: "rgba(110,231,183,0.2)", color: "rgba(110,231,183,1)"}}>{CYCLE_LETTERS[cycleStep]}</span>
            <h2 className="text-lg font-sans font-bold">{CYCLE_LABELS[cycleStep]}</h2>
          </div>
          <p className="text-[13px] leading-relaxed mb-4" style={{color: "rgba(255,255,255,0.7)"}}>{prompt}</p>
          <textarea
            value={responses[cycleStep]}
            onChange={(e) => handleResponse(e.target.value)}
            placeholder="What do you notice..."
            className="w-full h-24 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white p-3 text-base resize-none focus:outline-none focus:border-emerald-200/40"
          />
        </div>
        <button
          onClick={handleNext}
          disabled={!responses[cycleStep]?.trim()}
          className={cn("w-full rounded-xl py-3 px-4 text-sm font-semibold uppercase tracking-wider transition-all min-h-[48px] touch-manipulation select-none [-webkit-tap-highlight-color:transparent] active:scale-[0.99]", colors.accentSolid, colors.accentHover, !responses[cycleStep]?.trim() && "opacity-50")}
        >
          Next <ArrowRight size={14} className="ml-1 inline" />
        </button>
      </div>
    );
  }

  // CHECKPOINT PHASE
  if (phase === 'checkpoint') {
    const cpLabel = checkpoint === 'F' ? 'F — Does the belief still feel true?' : checkpoint === 'G' ? 'G — Does it feel true in the future?' : 'H — Does it feel true in a past scenario?';
    return (
      <div className="space-y-4">
        <div className="rounded-2xl p-5 bg-white/[0.06] border border-white/[0.08] backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold" style={{background: "rgba(110,231,183,0.2)", color: "rgba(110,231,183,1)"}}>{checkpoint}</span>
            <h2 className="text-lg font-sans font-bold">{cpLabel}</h2>
          </div>
          <p className="text-[13px] leading-relaxed mb-4" style={{color: "rgba(255,255,255,0.7)"}}>Check in with your body. Does the limiting belief still feel true?</p>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => handleCheckpoint('Yes')} className="rounded-xl py-4 px-4 text-sm font-medium uppercase tracking-wider transition-all min-h-[52px] bg-rose-500/20 border border-rose-400/30 text-rose-300 hover:bg-rose-500/30 active:bg-rose-500/40 active:scale-[0.98] touch-manipulation select-none [-webkit-tap-highlight-color:transparent]">
              <ThumbsDown size={16} className="mx-auto mb-1" /> Still True
            </button>
            <button onClick={() => handleCheckpoint('No')} className="rounded-xl py-4 px-4 text-sm font-medium uppercase tracking-wider transition-all min-h-[52px] bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 hover:bg-emerald-500/30 active:bg-emerald-500/40 active:scale-[0.98] touch-manipulation select-none [-webkit-tap-highlight-color:transparent]">
              <ThumbsUp size={16} className="mx-auto mb-1" /> Dissolved
            </button>
          </div>
        </div>
      </div>
    );
  }

  // COMPLETE PHASE
  if (phase === 'complete') {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl p-5 bg-white/[0.06] border border-white/[0.08] backdrop-blur-sm text-center">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05))", boxShadow: "0 0 40px rgba(16,185,129,0.15)"}}>
            <Check size={32} className="text-emerald-400" />
          </div>
          <h2 className="text-xl font-sans font-bold mb-2">Belief Dissolved ✅</h2>
          <p className="text-[13px] mb-4" style={{color: "rgba(255,255,255,0.6)"}}>The limiting belief has been processed through {rounds} round(s).</p>
          <div className="space-y-2 mb-4 text-left">
            <div className="rounded-lg p-3" style={{background: "rgba(255,255,255,0.03)"}}>
              <p className="text-[10px] uppercase tracking-wider mb-1" style={{color: "rgba(255,255,255,0.4)"}}>Original Belief</p>
              <p className="text-sm">{belief}</p>
            </div>
          </div>
          <button onClick={handleComplete} className="w-full rounded-xl py-3.5 text-sm font-semibold uppercase tracking-wider transition-all min-h-[48px] bg-emerald-200 text-[#07120D] hover:bg-emerald-100 active:bg-emerald-100 active:scale-[0.99] touch-manipulation select-none [-webkit-tap-highlight-color:transparent]">Save to Session Log</button>
          <button onClick={() => { setPhase('input'); setBelief(''); setRounds(1); }} className="mt-3 w-full rounded-xl py-3 px-4 text-sm font-medium uppercase tracking-wider transition-all min-h-[48px] bg-white/10 border border-white/20 hover:bg-white/15 active:bg-white/20 active:scale-[0.99] touch-manipulation select-none [-webkit-tap-highlight-color:transparent]">New Belief</button>
        </div>
      </div>
    );
  }

  return null;
}