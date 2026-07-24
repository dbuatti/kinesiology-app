import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Mic, MicOff, RefreshCw, Loader2, Check, Brain, RotateCcw, ArrowRight, ChevronDown, ThumbsUp, ThumbsDown, Lock, HelpCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';

// Core A-E cycle steps
const CYCLE_IDS = [0, 1, 2, 3, 4] as const;
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

// Checkpoints after each A-E cycle
const CHECKPOINTS = ['f', 'g', 'h'] as const;
type CheckpointId = typeof CHECKPOINTS[number];
const CHECKPOINT_QUESTIONS: Record<CheckpointId, string> = {
  f: 'Does the original belief still feel true?',
  g: 'Do you see yourself believing this in the future?',
  h: 'Is there any scenario where this belief might still feel true?',
};

interface RoundData {
  responses: Record<number, string>;
  checkpoint: CheckpointId | null;
  checkpointResult: 'Yes' | 'No' | null;
  loopCount: number;
}

const EMPTY_ROUND = (loopCount = 0): RoundData => ({
  responses: { 0: '', 1: '', 2: '', 3: '', 4: '' },
  checkpoint: null,
  checkpointResult: null,
  loopCount,
});

const LimitingBeliefsTool = () => {
  const { session: authSession } = useAuth();
  const [beliefId, setBeliefId] = useState<string | null>(null);
  const [limitingBelief, setLimitingBelief] = useState('');
  const [rounds, setRounds] = useState<RoundData[]>([EMPTY_ROUND(0)]);
  const [activeRound, setActiveRound] = useState(0);
  // Session-level checkpoint tracking: which checkpoint to show next after an A-E cycle
  // Starts at 'f', advances to 'g' after F resolves, then 'h' after G, stays on 'h' for H loops
  const [nextCheckpoint, setNextCheckpoint] = useState<CheckpointId>('f');
  const [phase, setPhase] = useState<'cycle' | 'checkpoint' | 'complete'>('cycle');
  const [saving, setSaving] = useState(false);
  const [voiceVisible, setVoiceVisible] = useState(false);
  const [voiceInput, setVoiceInput] = useState('');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const current = rounds[activeRound];
  const allCycleFilled = CYCLE_IDS.every(i => current.responses[i]?.trim().length > 0);

  const buildDissolveLog = useCallback(() => ({
    responses: current.responses,
    checkpoint: current.checkpoint,
    checkpointResult: current.checkpointResult,
    loopCount: activeRound,
    nextCheckpoint,
    history: rounds,
  }), [current.responses, current.checkpoint, current.checkpointResult, activeRound, nextCheckpoint, rounds]);

  const createSession = useCallback(async () => {
    if (!authSession?.user?.id) { showError('Not authenticated'); return; }
    const { data, error } = await supabase
      .from('limiting_belief_sessions')
      .insert({
        user_id: authSession.user.id,
        problem: limitingBelief,
        limiting_belief: limitingBelief,
        positive_belief: limitingBelief,
        dissolve_log: buildDissolveLog(),
      })
      .select()
      .single();
    if (error) { showError('Failed to create session'); return; }
    setBeliefId(data.id);
    showSuccess('Session started');
  }, [authSession, limitingBelief, buildDissolveLog]);

  const saveToDb = useCallback(async (roundsData: RoundData[], belief: string, cp: CheckpointId) => {
    if (!beliefId) return;
    setSaving(true);
    const latest = roundsData[roundsData.length - 1];
    const isCompleteCheck = phase === 'complete';
    const { error } = await supabase
      .from('limiting_belief_sessions')
      .update({
        limiting_belief: belief,
        positive_belief: belief,
        dissolve_log: {
          responses: latest.responses,
          checkpoint: latest.checkpoint,
          checkpointResult: latest.checkpointResult,
          loopCount: roundsData.length - 1,
          nextCheckpoint: cp,
          history: roundsData,
        },
        is_complete: isCompleteCheck,
      })
      .eq('id', beliefId);
    if (error) console.error('Save error:', error);
    setSaving(false);
  }, [beliefId, phase]);

  const debouncedSave = useCallback((data: RoundData[], belief: string, cp: CheckpointId) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveToDb(data, belief, cp), 600);
  }, [saveToDb]);

  const updateResponse = useCallback((stepId: number, value: string) => {
    const next = rounds.map((r, i) =>
      i === activeRound
        ? { ...r, responses: { ...r.responses, [stepId]: value } }
        : r
    );
    setRounds(next);
    debouncedSave(next, limitingBelief, nextCheckpoint);
    // Auto-advance to checkpoint when all A-E are filled
    if (CYCLE_IDS.every(s => (s === stepId ? value : next[activeRound].responses[s])?.trim().length > 0)) {
      setPhase('checkpoint');
    }
  }, [rounds, activeRound, debouncedSave, limitingBelief, nextCheckpoint]);

  const handleCheckpoint = useCallback(async (result: 'Yes' | 'No') => {
    // Record the checkpoint result on the current round
    const updatedRounds = rounds.map((r, i) =>
      i === activeRound
        ? { ...r, checkpoint: nextCheckpoint, checkpointResult: result }
        : r
    );

    if (result === 'No') {
      // Passed this checkpoint — advance to next or complete
      if (nextCheckpoint === 'f') {
        setNextCheckpoint('g');
        setPhase('cycle');
        setRounds(updatedRounds);
        debouncedSave(updatedRounds, limitingBelief, 'g');
      } else if (nextCheckpoint === 'g') {
        setNextCheckpoint('h');
        setPhase('cycle');
        setRounds(updatedRounds);
        debouncedSave(updatedRounds, limitingBelief, 'h');
      } else if (nextCheckpoint === 'h') {
        // All checkpoints passed — complete!
        setPhase('complete');
        setRounds(updatedRounds);
        const finalLog = {
          responses: updatedRounds[updatedRounds.length - 1].responses,
          checkpoint: 'h',
          checkpointResult: 'No',
          loopCount: updatedRounds.length - 1,
          nextCheckpoint: 'h',
          history: updatedRounds,
        };
        if (beliefId) {
          setSaving(true);
          await supabase
            .from('limiting_belief_sessions')
            .update({
              dissolve_log: finalLog,
              is_complete: true,
            })
            .eq('id', beliefId);
          setSaving(false);
        }
        showSuccess('Belief resolved');
      }
    } else {
      // Yes — loop back to A-E cycle
      // Advance to next checkpoint for next time (except H which stays)
      const nextCp = nextCheckpoint === 'f' ? 'g' : nextCheckpoint === 'g' ? 'h' : 'h';
      setNextCheckpoint(nextCp);
      const newRound = EMPTY_ROUND(rounds.length);
      const allRounds = [...updatedRounds, newRound];
      setRounds(allRounds);
      setActiveRound(rounds.length);
      setPhase('cycle');
      debouncedSave(allRounds, limitingBelief, nextCp);
    }
  }, [rounds, activeRound, nextCheckpoint, limitingBelief, debouncedSave, beliefId]);

  const goToRound = useCallback((index: number) => {
    setActiveRound(index);
    setPhase('cycle'); // Re-enter cycle view for historical rounds
  }, []);

  const resetSession = useCallback(async () => {
    if (beliefId) {
      await supabase.from('limiting_belief_sessions').delete().eq('id', beliefId);
    }
    setBeliefId(null);
    setLimitingBelief('');
    setRounds([EMPTY_ROUND(0)]);
    setActiveRound(0);
    setNextCheckpoint('f');
    setPhase('cycle');
    setVoiceInput('');
  }, [beliefId]);

  const hasSession = !!beliefId;

  useEffect(() => {
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, []);

  const activeCheckpoint = phase === 'checkpoint' ? nextCheckpoint : null;

  const CHECKPOINT_DATA: { id: CheckpointId; label: string; question: string }[] = [
    { id: 'f', label: 'F', question: 'Does the original belief still feel true?' },
    { id: 'g', label: 'G', question: 'Do you see yourself believing this in the future?' },
    { id: 'h', label: 'H', question: 'Is there any scenario where this belief might still feel true?' },
  ];

  const renderCheckpoints = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Brain size={16} className="text-violet-500" />
          <p className="text-xs font-semibold text-foreground">Decision Checkpoints</p>
        </div>
        <div className="space-y-2">
          {CHECKPOINT_DATA.map((cp, i) => {
            const isActive = activeCheckpoint === cp.id;
            const isPast = phase === 'complete' || (nextCheckpoint === 'g' && cp.id === 'f') || (nextCheckpoint === 'h' && (cp.id === 'f' || cp.id === 'g'));
            const isLocked = !isActive && !isPast && phase === 'cycle';
            return (
              <div key={cp.id} className={cn(
                "border rounded-xl p-4 transition-all",
                isActive ? "border-violet-500/30 bg-violet-500/5" :
                isPast ? "border-emerald-500/20 bg-emerald-500/5" :
                "border-border bg-muted/20"
              )}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                      isActive ? "bg-violet-500/20 text-violet-600" :
                      isPast ? "bg-emerald-500/20 text-emerald-600" :
                      "bg-muted-foreground/10 text-muted-foreground"
                    )}>
                      {isPast ? <Check size={14} /> : cp.label}
                    </div>
                    <div>
                      <p className={cn(
                        "text-xs font-semibold",
                        isPast ? "text-emerald-600" : isActive ? "text-violet-600" : "text-muted-foreground"
                      )}>
                        {cp.question}
                      </p>
                    </div>
                  </div>
                  {isLocked && <Lock size={14} className="text-muted-foreground/40 shrink-0" />}
                </div>
                {isActive && (
                  <div className="flex justify-end gap-3 mt-4">
                    <Button
                      onClick={() => handleCheckpoint('Yes')}
                      variant="outline"
                      className="h-9 px-5 rounded-xl border-rose-300 bg-rose-50/50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 font-semibold text-[11px] uppercase tracking-wider"
                    >
                      <ThumbsUp size={13} className="mr-1.5" /> Yes — Loop
                    </Button>
                    <Button
                      onClick={() => handleCheckpoint('No')}
                      variant="outline"
                      className="h-9 px-5 rounded-xl border-emerald-300 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 font-semibold text-[11px] uppercase tracking-wider"
                    >
                      <ThumbsDown size={13} className="mr-1.5" /> No — Advance
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain size={20} className="text-violet-500" />
          <h2 className="text-lg font-bold">Limiting Beliefs</h2>
          {saving && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
        </div>
        <div className="flex items-center gap-2">
          {hasSession && (
            <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full",
              phase === 'complete' ? "bg-chart-emerald/10 text-chart-emerald" : "bg-amber-500/10 text-amber-500"
            )}>
              {phase === 'complete' ? "Resolved" : `Round ${activeRound + 1}`}
            </span>
          )}
          <Button variant="ghost" size="icon" onClick={resetSession} className="h-8 w-8 rounded-xl text-muted-foreground">
            <RefreshCw size={14} />
          </Button>
        </div>
      </div>

      {!hasSession ? (
        <div className="flex flex-col items-center py-12 text-center space-y-4 border border-dashed border-border rounded-xl bg-muted/20">
          <div className="w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center">
            <Brain size={24} className="text-violet-500" />
          </div>
          <div className="space-y-1 max-w-sm">
            <p className="text-sm font-semibold text-foreground">Limiting Belief Inquiry</p>
            <p className="text-xs text-muted-foreground">Enter the belief the client is working with, then walk through the somatic inquiry loop.</p>
          </div>
          <div className="w-full max-w-md space-y-3">
            <Input
              placeholder="e.g. I am not enough, I am unsafe in my body"
              value={limitingBelief}
              onChange={e => setLimitingBelief(e.target.value)}
              className="rounded-xl border-border/60 text-center"
              onKeyDown={e => { if (e.key === 'Enter' && limitingBelief.trim()) createSession(); }}
            />
            <Button onClick={createSession} disabled={!limitingBelief.trim()} className="rounded-xl w-full">
              Start Inquiry <ArrowRight size={16} className="ml-1.5" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Active belief banner */}
          <div className="px-5 py-3 bg-violet-500/5 border border-violet-500/20 rounded-xl">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Working with</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">
              "{limitingBelief}"
            </p>
          </div>

          {/* Round selector */}
          {rounds.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Rounds:</span>
              {rounds.map((r, i) => (
                <button
                  key={r.loopCount}
                  onClick={() => goToRound(i)}
                  className={cn(
                    "w-8 h-8 rounded-xl text-xs font-semibold transition-all",
                    i === activeRound
                      ? "bg-violet-500/10 text-violet-600 border border-violet-500/30"
                      : "bg-muted text-muted-foreground hover:bg-muted/70",
                    r.checkpointResult === 'No' && i !== activeRound && "border-l-2 border-l-emerald-400",
                    r.checkpointResult === 'Yes' && i !== activeRound && "border-l-2 border-l-amber-400",
                  )}
                >
                  {i + 1}
                </button>
              ))}
              {phase === 'complete' && (
                <span className="text-[10px] text-chart-emerald font-semibold ml-2">✓ Complete</span>
              )}
            </div>
          )}

          {/* A-E Cycle Steps */}
          <div className="space-y-3">
            {CYCLE_IDS.map(stepIdx => {
              const val = current.responses[stepIdx];
              const filled = val?.trim().length > 0;
              return (
                <div key={stepIdx} className={cn(
                  "bg-card border rounded-xl overflow-hidden transition-all",
                  filled ? "border-violet-200" : "border-border"
                )}>
                  <div className="flex items-center gap-3 px-4 py-2.5 bg-muted/20 border-b border-border/40">
                    <div className={cn(
                      "w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold shrink-0",
                      filled
                        ? "bg-violet-500/10 text-violet-600"
                        : "bg-muted-foreground/10 text-muted-foreground"
                    )}>
                      {CYCLE_LETTERS[stepIdx]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground">{CYCLE_LABELS[stepIdx]}</p>
                      <p className="text-[10px] text-muted-foreground">{getCyclePrompt(stepIdx, limitingBelief)}</p>
                    </div>
                    {filled && (
                      <Check size={14} className="text-chart-emerald shrink-0 ml-auto" />
                    )}
                  </div>
                  <div className="px-4 py-3">
                    <Textarea
                      placeholder="Client's response..."
                      value={val || ''}
                      onChange={e => updateResponse(stepIdx, e.target.value)}
                      className="min-h-[48px] text-sm rounded-lg border-border/40 bg-muted/10 resize-none"
                      rows={2}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Decision Checkpoints — always visible */}
          {renderCheckpoints()}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setVoiceVisible(!voiceVisible)}
                className="rounded-xl text-xs text-muted-foreground"
              >
                {voiceVisible ? <MicOff size={14} className="mr-1.5" /> : <Mic size={14} className="mr-1.5" />}
                {voiceVisible ? 'Hide Voice' : 'Voice Input'}
              </Button>
              {voiceVisible && (
                <Input
                  placeholder="Voice transcript..."
                  value={voiceInput}
                  onChange={e => setVoiceInput(e.target.value)}
                  className="w-48 h-8 rounded-xl text-xs"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LimitingBeliefsTool;
