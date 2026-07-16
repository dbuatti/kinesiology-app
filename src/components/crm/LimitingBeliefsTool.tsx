import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mic, MicOff, RefreshCw, Loader2, Check, Plus, Brain, RotateCcw, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';

const STEP_IDS = [0, 1, 2, 3, 4, 5] as const;
const STEP_LABELS: Record<number, string> = {
  0: 'Feel the belief in your body',
  1: 'Follow the sensation deeper',
  2: 'Identify the desired state',
  3: 'Embody the alternative',
  4: 'Deepen the new feeling',
  5: 'Check if the belief still holds',
};
const STEP_PROMPTS: Record<number, string> = {
  0: 'What do you notice? Where is it in the body? What sensation?',
  1: 'What do you notice now? Is it changing, moving, shifting?',
  2: 'What would you rather feel instead?',
  3: 'Feel that new state. What do you notice in the body now?',
  4: 'Let that feeling expand. What do you notice?',
  5: 'Does the original belief still feel true? What do you notice?',
};
const STEP_LETTERS: Record<number, string> = { 0: 'A', 1: 'B', 2: 'C', 3: 'D', 4: 'E', 5: 'F' };

interface RoundData {
  responses: Record<number, string>;
  loopCount: number;
}

const EMPTY_ROUND = (loopCount = 0): RoundData => ({
  responses: { 0: '', 1: '', 2: '', 3: '', 4: '', 5: '' },
  loopCount,
});

const LimitingBeliefsTool = () => {
  const { session: authSession } = useAuth();
  const [beliefId, setBeliefId] = useState<string | null>(null);
  const [limitingBelief, setLimitingBelief] = useState('');
  const [rounds, setRounds] = useState<RoundData[]>([EMPTY_ROUND(0)]);
  const [activeRound, setActiveRound] = useState(0);
  const [saving, setSaving] = useState(false);
  const [voiceVisible, setVoiceVisible] = useState(false);
  const [voiceInput, setVoiceInput] = useState('');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const current = rounds[activeRound];
  const isComplete = rounds.some(r => r.responses[5]?.trim().length > 0);

  const buildDissolveLog = useCallback(() => ({
    responses: current.responses,
    loopCount: activeRound,
    history: rounds,
  }), [current.responses, activeRound, rounds]);

  const createSession = useCallback(async () => {
    if (!authSession?.user?.id) { showError('Not authenticated'); return; }
    const { data, error } = await supabase
      .from('limiting_belief_sessions')
      .insert({
        user_id: authSession.user.id,
        problem: limitingBelief,
        limiting_belief: limitingBelief,
        dissolve_log: JSON.stringify(buildDissolveLog()),
      })
      .select()
      .single();
    if (error) { showError('Failed to create session'); return; }
    setBeliefId(data.id);
    showSuccess('Session started');
  }, [authSession, limitingBelief, buildDissolveLog]);

  const saveToDb = useCallback(async (roundsData: RoundData[], belief: string) => {
    if (!beliefId) return;
    setSaving(true);
    const latest = roundsData[roundsData.length - 1];
    const isCompleteCheck = roundsData.some(r => r.responses[5]?.trim().length > 0);
    const { error } = await supabase
      .from('limiting_belief_sessions')
      .update({
        limiting_belief: belief,
        dissolve_log: JSON.stringify({ responses: latest.responses, loopCount: roundsData.length - 1, history: roundsData }),
        is_complete: isCompleteCheck,
      })
      .eq('id', beliefId);
    if (error) console.error('Save error:', error);
    setSaving(false);
  }, [beliefId]);

  const debouncedSave = useCallback((data: RoundData[], belief: string) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveToDb(data, belief), 600);
  }, [saveToDb]);

  const updateResponse = useCallback((stepId: number, value: string) => {
    const next = rounds.map((r, i) =>
      i === activeRound
        ? { ...r, responses: { ...r.responses, [stepId]: value } }
        : r
    );
    setRounds(next);
    debouncedSave(next, limitingBelief);
  }, [rounds, activeRound, debouncedSave, limitingBelief]);

  const updateBelief = useCallback((value: string) => {
    setLimitingBelief(value);
    debouncedSave(rounds, value);
  }, [rounds, debouncedSave]);

  const addRound = useCallback(() => {
    setRounds(prev => [...prev, EMPTY_ROUND(prev.length)]);
    setActiveRound(prev => prev + 1);
  }, []);

  const goToRound = useCallback((index: number) => {
    setActiveRound(index);
  }, []);

  const resetSession = useCallback(async () => {
    if (beliefId) {
      await supabase.from('limiting_belief_sessions').delete().eq('id', beliefId);
    }
    setBeliefId(null);
    setLimitingBelief('');
    setRounds([EMPTY_ROUND(0)]);
    setActiveRound(0);
    setVoiceInput('');
  }, [beliefId]);

  const hasSession = !!beliefId;

  useEffect(() => {
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, []);

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
              isComplete ? "bg-chart-emerald/10 text-chart-emerald" : "bg-amber-500/10 text-amber-500"
            )}>
              {isComplete ? "Resolved" : `Round ${activeRound + 1}`}
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
              {rounds.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goToRound(i)}
                  className={cn(
                    "w-8 h-8 rounded-xl text-xs font-semibold transition-all",
                    i === activeRound
                      ? "bg-violet-500/10 text-violet-600 border border-violet-500/30"
                      : "bg-muted text-muted-foreground hover:bg-muted/70"
                  )}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}

          {/* A-F Steps */}
          <div className="space-y-3">
            {STEP_IDS.map(stepIdx => {
              const val = current.responses[stepIdx];
              return (
                <div key={stepIdx} className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-2.5 bg-muted/20 border-b border-border/40">
                    <div className="w-6 h-6 rounded-md bg-violet-500/10 text-violet-600 flex items-center justify-center text-[11px] font-bold shrink-0">
                      {STEP_LETTERS[stepIdx]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground">{STEP_LABELS[stepIdx]}</p>
                      <p className="text-[10px] text-muted-foreground">{STEP_PROMPTS[stepIdx]}</p>
                    </div>
                    {val?.trim() && (
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
            <div className="flex items-center gap-2">
              {!isComplete && (
                <Button variant="outline" size="sm" onClick={addRound} className="rounded-xl text-xs">
                  <RotateCcw size={14} className="mr-1" /> New Round
                </Button>
              )}
              {isComplete && (
                <span className="text-xs text-chart-emerald font-semibold flex items-center gap-1.5">
                  <Check size={14} /> Belief resolved
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LimitingBeliefsTool;
