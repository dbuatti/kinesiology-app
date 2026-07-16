import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Mic, MicOff, RefreshCw, Loader2, Check, Plus, Brain } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';

interface LimitingBeliefSession {
  id: string;
  problem: string;
  felt_sense: string;
  limiting_belief: string;
  positive_belief: string;
  dissolve_log: { note: string; timestamp: string }[];
  check_belief_result: boolean | null;
  check_problem_result: boolean | null;
  integration_awareness: string;
  integration_action: string;
  is_complete: boolean;
  current_step: number;
  created_at: string;
}

const EMPTY_SESSION: LimitingBeliefSession = {
  id: '',
  problem: '',
  felt_sense: '',
  limiting_belief: '',
  positive_belief: '',
  dissolve_log: [],
  check_belief_result: null,
  check_problem_result: null,
  integration_awareness: '',
  integration_action: '',
  is_complete: false,
  current_step: 0,
  created_at: '',
};

const LimitingBeliefsTool = () => {
  const { session: authSession } = useAuth();
  const [session, setSession] = useState<LimitingBeliefSession>(EMPTY_SESSION);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const [voiceVisible, setVoiceVisible] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [dissolveInput, setDissolveInput] = useState('');

  const hasSession = !!session.id;

  const createSession = useCallback(async () => {
    if (!authSession?.user?.id) { showError('Not authenticated'); return; }
    const { data, error } = await supabase
      .from('limiting_belief_sessions')
      .insert({
        user_id: authSession.user.id,
        problem: '',
        felt_sense: '',
        limiting_belief: '',
        positive_belief: '',
        dissolve_log: [],
        check_belief_result: null,
        check_problem_result: null,
        integration_awareness: '',
        integration_action: '',
        is_complete: false,
        current_step: 0,
      })
      .select()
      .single();
    if (error) { showError('Failed to create session'); return; }
    setSession({ ...EMPTY_SESSION, ...data });
    showSuccess('Session started');
  }, [authSession]);

  const saveField = useCallback(async (field: string, value: any) => {
    if (!session.id) return;
    setSaving(true);
    const { error } = await supabase
      .from('limiting_belief_sessions')
      .update({ [field]: value })
      .eq('id', session.id);
    if (error) console.error('Save error:', error);
    setSaving(false);
  }, [session.id]);

  const debouncedSave = useCallback((field: string, value: any) => {
    setDirty(prev => ({ ...prev, [field]: true }));
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveField(field, value);
    }, 600);
  }, [saveField]);

  const updateField = useCallback((field: keyof LimitingBeliefSession, value: any) => {
    setSession(prev => ({ ...prev, [field]: value }));
    if (hasSession) debouncedSave(field, value);
  }, [hasSession, debouncedSave]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  const addDissolveNote = useCallback(() => {
    const note = dissolveInput.trim();
    if (!note || !hasSession) return;
    const entry = { note, timestamp: new Date().toISOString() };
    const updated = [...session.dissolve_log, entry];
    setSession(prev => ({ ...prev, dissolve_log: updated }));
    setDissolveInput('');
    saveField('dissolve_log', updated);
  }, [dissolveInput, hasSession, session.dissolve_log, saveField]);

  const completeSession = useCallback(async () => {
    if (!hasSession) return;
    await supabase
      .from('limiting_belief_sessions')
      .update({ is_complete: true, current_step: 99 })
      .eq('id', session.id);
    setSession(prev => ({ ...prev, is_complete: true, current_step: 99 }));
    showSuccess('Session completed');
  }, [hasSession, session.id]);

  const resetSession = useCallback(async () => {
    if (hasSession) {
      await supabase.from('limiting_belief_sessions').delete().eq('id', session.id);
    }
    setSession(EMPTY_SESSION);
    setDirty({});
    setDissolveInput('');
  }, [hasSession, session.id]);

  const StepCard = ({ number, title, icon: Icon, children }: { number: number; title: string; icon: any; children: React.ReactNode }) => (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3 bg-muted/30 border-b border-border/40">
        <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
          {number}
        </div>
        <Icon size={16} className="text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {dirty[title.toLowerCase().replace(/\s+/g, '_')] && <Loader2 size={12} className="animate-spin text-muted-foreground ml-auto" />}
      </div>
      <div className="px-5 py-4">
        {children}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain size={20} className="text-violet-500" />
          <h2 className="text-lg font-bold">Limiting Beliefs</h2>
          {saving && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
          {!hasSession && <span className="text-[10px] text-muted-foreground font-medium">No active session</span>}
        </div>
        <div className="flex items-center gap-2">
          {hasSession && (
            <span className={cn(
              "text-[10px] font-semibold px-2 py-0.5 rounded-full",
              session.is_complete ? "bg-chart-emerald/10 text-chart-emerald" : "bg-amber-500/10 text-amber-500"
            )}>
              {session.is_complete ? "Complete" : "In Progress"}
            </span>
          )}
          <Button variant="ghost" size="icon" onClick={resetSession} className="h-8 w-8 rounded-xl text-muted-foreground">
            <RefreshCw size={14} />
          </Button>
        </div>
      </div>

      {!hasSession ? (
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 border border-dashed border-border rounded-xl bg-muted/20">
          <div className="w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center">
            <Brain size={24} className="text-violet-500" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">No active limiting belief session</p>
            <p className="text-xs text-muted-foreground">Start a new session to work through a belief with your client.</p>
          </div>
          <Button onClick={createSession} className="rounded-xl">
            Start New Session
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Step 1: Problem */}
          <StepCard number={1} title="Problem / Presenting Issue" icon={Brain}>
            <Textarea
              placeholder="What is the client's presenting issue or limiting belief?"
              value={session.problem}
              onChange={e => updateField('problem', e.target.value)}
              className="min-h-[80px] rounded-xl border-border/60 bg-muted/20"
            />
          </StepCard>

          {/* Step 2: Felt Sense */}
          <StepCard number={2} title="Felt Sense / Body Sensation" icon={Brain}>
            <Textarea
              placeholder="Where does the client feel this in their body? What sensation?"
              value={session.felt_sense}
              onChange={e => updateField('felt_sense', e.target.value)}
              className="min-h-[60px] rounded-xl border-border/60 bg-muted/20"
            />
          </StepCard>

          {/* Step 3: Limiting Belief */}
          <StepCard number={3} title="The Limiting Belief" icon={Brain}>
            <Textarea
              placeholder='The core belief — e.g. "I am not enough", "I am unsafe in my body"'
              value={session.limiting_belief}
              onChange={e => updateField('limiting_belief', e.target.value)}
              className="min-h-[60px] rounded-xl border-border/60 bg-muted/20"
            />
          </StepCard>

          {/* Step 4: Positive Belief */}
          <StepCard number={4} title="Positive / Replacement Belief" icon={Brain}>
            <Textarea
              placeholder='The empowering truth — e.g. "I am whole and enough as I am"'
              value={session.positive_belief}
              onChange={e => updateField('positive_belief', e.target.value)}
              className="min-h-[60px] rounded-xl border-border/60 bg-muted/20"
            />
          </StepCard>

          {/* Step 5: Dissolve Process */}
          <StepCard number={5} title="Dissolve Process" icon={Brain}>
            <div className="space-y-3">
              <Input
                placeholder="Type a dissolve note or technique used..."
                value={dissolveInput}
                onChange={e => setDissolveInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addDissolveNote(); } }}
                className="rounded-xl border-border/60 bg-muted/20"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={addDissolveNote}
                disabled={!dissolveInput.trim()}
                className="rounded-xl text-xs"
              >
                <Plus size={14} className="mr-1" /> Add Note
              </Button>
              {session.dissolve_log.length > 0 && (
                <div className="space-y-1.5 mt-3">
                  {session.dissolve_log.map((entry, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/20 rounded-lg px-3 py-2">
                      <Check size={12} className="text-chart-emerald mt-0.5 shrink-0" />
                      <span>{entry.note}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </StepCard>

          {/* Step 6: Check Results */}
          <StepCard number={6} title="Check Results" icon={Brain}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium cursor-pointer">Belief still feels true?</Label>
                <div className="flex items-center gap-2">
                  <span className={cn("text-xs font-medium", session.check_belief_result === false ? "text-chart-emerald" : "text-muted-foreground")}>No</span>
                  <Switch
                    checked={session.check_belief_result === true}
                    onCheckedChange={v => updateField('check_belief_result', v)}
                  />
                  <span className={cn("text-xs font-medium", session.check_belief_result === true ? "text-chart-destructive" : "text-muted-foreground")}>Yes</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium cursor-pointer">Problem still feels present?</Label>
                <div className="flex items-center gap-2">
                  <span className={cn("text-xs font-medium", session.check_problem_result === false ? "text-chart-emerald" : "text-muted-foreground")}>No</span>
                  <Switch
                    checked={session.check_problem_result === true}
                    onCheckedChange={v => updateField('check_problem_result', v)}
                  />
                  <span className={cn("text-xs font-medium", session.check_problem_result === true ? "text-chart-destructive" : "text-muted-foreground")}>Yes</span>
                </div>
              </div>
            </div>
          </StepCard>

          {/* Step 7: Integration */}
          <StepCard number={7} title="Integration" icon={Brain}>
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Awareness / Insight</Label>
                <Textarea
                  placeholder="What awareness or insight came from this process?"
                  value={session.integration_awareness}
                  onChange={e => updateField('integration_awareness', e.target.value)}
                  className="min-h-[60px] rounded-xl border-border/60 bg-muted/20"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Action Step</Label>
                <Textarea
                  placeholder="What action will the client take to embody this new belief?"
                  value={session.integration_action}
                  onChange={e => updateField('integration_action', e.target.value)}
                  className="min-h-[60px] rounded-xl border-border/60 bg-muted/20"
                />
              </div>
            </div>
          </StepCard>

          {/* Complete Button */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setVoiceVisible(!voiceVisible)}
              className="rounded-xl text-xs text-muted-foreground"
            >
              {voiceVisible ? <MicOff size={14} className="mr-1.5" /> : <Mic size={14} className="mr-1.5" />}
              {voiceVisible ? "Hide Voice" : "Show Voice"}
            </Button>
            <Button
              onClick={completeSession}
              disabled={session.is_complete}
              className="rounded-xl bg-chart-emerald hover:bg-chart-emerald/90"
            >
              <Check size={16} className="mr-1.5" /> Complete Session
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LimitingBeliefsTool;
