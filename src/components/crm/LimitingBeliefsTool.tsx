
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ShieldAlert, ArrowRight, RefreshCw, CheckCircle2, Zap, 
  Brain, ChevronDown, ChevronUp, Save, Loader2, BookOpen,
  History, Trash2, Sparkles, RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { format } from "date-fns";

interface LimitingBeliefsToolProps {
  singlePage?: boolean;
  clientId?: string;
  appointmentId?: string;
}

const BELIEF_STEPS = ["A", "B", "C", "D", "E", "F"];
const STEP_PROMPTS: Record<string, string> = {
  A: "Feel yourself believing (BELIEF)... what does it feel like?",
  B: "Feel (LAST RESPONSE)... what does (LAST RESPONSE) feel like?",
  C: "What would you rather feel?",
  D: "What would (DESIRED FEELING) feel like?",
  E: "Feel (LAST RESPONSE)... what does (LAST RESPONSE) feel like?",
  F: "Do you still believe (BELIEF)?",
};

const STEP_LABELS: Record<string, string> = {
  A: "Feel the belief in your body",
  B: "Follow the sensation deeper",
  C: "Identify the desired state",
  D: "Embody the alternative",
  E: "Deepen the new feeling",
  F: "Check if the belief still holds",
};

const CHECK_QUESTIONS = [
  "Does any part of you still believe (BELIEF)?",
  "Do you feel you may believe (BELIEF) again in the future?",
  "Is there any scenario in which you would still believe (BELIEF)?",
  "Do you now know (OPPOSITE OF BELIEF)?",
];

const CORE_BELIEFS = [
  "I am not safe.",
  "I am not good enough.",
  "I am unworthy.",
  "I am alone.",
  "I am bad.",
  "Being seen is dangerous.",
  "I don't deserve to be loved.",
  "My needs are not important.",
  "I can't rest or be still.",
];

const LimitingBeliefsTool = ({ singlePage = false, clientId, appointmentId }: LimitingBeliefsToolProps = {}) => {
  const [belief, setBelief] = useState("");
  const [oppositeBelief, setOppositeBelief] = useState("");
  const [stepIndex, setStepIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [currentResponse, setCurrentResponse] = useState("");
  const [loopCount, setLoopCount] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [checkResults, setCheckResults] = useState<Record<number, boolean>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [showReference, setShowReference] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [pastSessions, setPastSessions] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const currentStep = BELIEF_STEPS[stepIndex % 6];
  const lastResponse = stepIndex > 0 ? responses[`${BELIEF_STEPS[(stepIndex - 1) % 6]}`] : belief;
  const isLastStep = currentStep === "F";
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPastSessions();
  }, [clientId]);

  const fetchPastSessions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let query = supabase
      .from('limiting_belief_sessions')
      .select('*')
      .eq('user_id', user.id);

    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    const { data } = await query
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) setPastSessions(data);
  };

  const getPrompt = (step: string, beliefText: string) => {
    let prompt = STEP_PROMPTS[step]
      .replace(/\(BELIEF\)/g, beliefText)
      .replace(/\(LAST RESPONSE\)/g, lastResponse)
      .replace(/\(DESIRED FEELING\)/g, responses["C"] || "...");
    return prompt;
  };

  const handleNext = () => {
    if (!currentResponse.trim() && currentStep !== "F") return;
    
    setResponses(prev => ({ ...prev, [currentStep]: currentResponse }));
    setCurrentResponse("");
    
    if (isLastStep && currentResponse.toLowerCase().includes("no")) {
      setIsChecking(true);
    } else if (isLastStep && !currentResponse.toLowerCase().includes("no")) {
      setLoopCount(prev => prev + 1);
      setStepIndex(0);
      scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      setStepIndex(prev => prev + 1);
    }
  };

  const handleFQuick = (answer: boolean) => {
    const val = answer ? "Yes" : "No";
    setResponses(prev => ({ ...prev, [currentStep]: val }));
    setCurrentResponse("");
    if (!answer) {
      setIsChecking(true);
    } else {
      setLoopCount(prev => prev + 1);
      setStepIndex(0);
      scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleCheckAnswer = (index: number, result: boolean) => {
    const updated = { ...checkResults, [index]: result };
    setCheckResults(updated);
  };

  const allChecksClear = Object.keys(checkResults).length === 4 && Object.values(checkResults).every(v => !v);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const payload = {
        user_id: user.id,
        client_id: clientId || null,
        appointment_id: appointmentId || null,
        problem: belief,
        limiting_belief: belief,
        positive_belief: oppositeBelief,
        dissolve_log: JSON.stringify({ responses, loopCount }),
        check_belief_result: !allChecksClear,
        is_complete: allChecksClear,
      };

      if (sessionId) {
        await supabase.from('limiting_belief_sessions').update(payload).eq('id', sessionId);
      } else {
        const { data } = await supabase.from('limiting_belief_sessions').insert(payload).select().single();
        if (data) setSessionId(data.id);
      }
      showSuccess("Session saved");
      fetchPastSessions();
    } catch (e) {
      showError("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setBelief("");
    setOppositeBelief("");
    setStepIndex(0);
    setResponses({});
    setCurrentResponse("");
    setLoopCount(0);
    setIsChecking(false);
    setCheckResults({});
    setIsComplete(false);
    setSessionId(null);
  };

  const loadSession = (session: any) => {
    setBelief(session.limiting_belief || session.problem || "");
    setOppositeBelief(session.positive_belief || "");
    try {
      const parsed = JSON.parse(session.dissolve_log || "{}");
      if (parsed.responses) setResponses(parsed.responses);
      if (parsed.loopCount) setLoopCount(parsed.loopCount);
    } catch {}
    setSessionId(session.id);
    setIsComplete(session.is_complete);
    setShowHistory(false);
  };

  const deleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Delete this session?")) return;
    await supabase.from('limiting_belief_sessions').delete().eq('id', id);
    fetchPastSessions();
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="space-y-4">
      {/* Belief Setup */}
      <div ref={scrollRef} className="space-y-3">
        <div className="flex items-center gap-2">
          <ShieldAlert size={14} className="text-chart-destructive" />
          <h3 className="text-sm font-semibold text-foreground">Belief Shifting Protocol</h3>
          <Badge className="text-[9px] bg-muted text-muted-foreground border-border">A-F Somatic Loop</Badge>
        </div>

        <div className="space-y-2">
          <div>
            <label className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground mb-0.5 block">Limiting Belief</label>
            <div className="flex gap-2">
              <Input 
                placeholder='e.g. "I am not good enough"'
                value={belief}
                onChange={(e) => setBelief(e.target.value)}
                className="h-9 rounded-lg text-sm font-medium"
              />
              <Button variant="ghost" size="sm" onClick={() => setShowReference(!showReference)} className="h-9 w-9 shrink-0 rounded-lg">
                <BookOpen size={14} className="text-muted-foreground" />
              </Button>
            </div>
          </div>

          {showReference && (
            <div className="p-3 rounded-lg bg-muted/30 border border-border space-y-2 animate-in fade-in duration-200">
              <p className="text-[10px] font-medium text-muted-foreground">Common limiting belief patterns</p>
              <div className="flex flex-wrap gap-1.5">
                {CORE_BELIEFS.map((b, i) => (
                  <button key={i} onClick={() => setBelief(b)} className={cn(
                    "text-[9px] px-1.5 py-0.5 rounded-md border transition-colors",
                    belief === b ? "border-chart-destructive bg-chart-destructive/10 text-chart-destructive font-medium" : "border-border bg-card text-muted-foreground hover:border-chart-destructive/30"
                  )}>
                    {b}
                  </button>
                ))}
              </div>
              <p className="text-[9px] text-muted-foreground/60 leading-relaxed">A limiting belief is a state-dependent neural network formed to reduce uncertainty and protect the organism. They behave like primitive reflexes: ON or OFF.</p>
            </div>
          )}

          <div>
            <label className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground mb-0.5 block">Opposite / Desired Knowing</label>
            <Input 
              placeholder='e.g. "I am capable and enough"'
              value={oppositeBelief}
              onChange={(e) => setOppositeBelief(e.target.value)}
              className="h-9 rounded-lg text-sm font-medium"
            />
          </div>
        </div>
      </div>

      {/* A-F Loop Steps Preview (shown even without belief) */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <RefreshCw size={12} className={cn(belief ? "text-chart-primary" : "text-muted-foreground")} />
          <span className={cn("text-[10px] font-semibold uppercase tracking-wider", belief ? "text-chart-primary" : "text-muted-foreground")}>
            Dissolution Loop {loopCount > 0 && `(Loop ${loopCount + 1})`}
          </span>
        </div>

        <div className="grid grid-cols-6 gap-1.5">
          {BELIEF_STEPS.map((s, i) => {
            const isActive = belief && s === currentStep && !isChecking;
            const isDone = belief && !!responses[s];
            return (
              <div key={s} className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg border text-center transition-all",
                isActive ? "border-chart-destructive/30 bg-chart-destructive/5" :
                isDone ? "border-chart-emerald/30 bg-chart-emerald/5" :
                belief ? "border-border bg-card" :
                "border-dashed border-border/60 bg-muted/30 opacity-50"
              )}>
                <span className={cn(
                  "w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold",
                  isDone ? "bg-chart-emerald/20 text-chart-emerald" :
                  isActive ? "bg-chart-destructive/20 text-chart-destructive" :
                  "bg-muted text-muted-foreground"
                )}>{s}</span>
                <span className="text-[7px] leading-tight text-muted-foreground">{STEP_LABELS[s]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active A-F Loop Card */}
      {belief && !isChecking && (
        <div className="space-y-3">
          <Card className="border border-border bg-card">
            <CardContent className="p-3 space-y-2">
              <p className="text-sm text-foreground font-medium italic leading-relaxed">
                "{getPrompt(currentStep, belief)}"
              </p>
              <p className="text-[10px] text-muted-foreground">Keep answers brief — emotion, body sensation, thought or mental image.</p>

              {currentStep === "F" ? (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => handleFQuick(true)} className="flex-1 h-8 rounded-lg border-destructive text-destructive font-medium text-[10px]">
                    Yes, still believe it
                  </Button>
                  <Button variant="outline" onClick={() => handleFQuick(false)} className="flex-1 h-8 rounded-lg border-chart-emerald text-chart-emerald font-medium text-[10px]">
                    No, it's shifted
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={currentResponse}
                    onChange={(e) => setCurrentResponse(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                    placeholder="Brief response..."
                    className="h-9 rounded-lg text-sm font-medium flex-1"
                    autoFocus
                  />
                  <Button onClick={handleNext} className="h-9 w-9 rounded-lg shrink-0">
                    <ArrowRight size={14} />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Loop responses log */}
          {Object.keys(responses).length > 0 && (
            <div className="flex flex-wrap gap-1">
              {BELIEF_STEPS.map((s, i) => {
                const key = `${s}`;
                if (!responses[key]) return null;
                return (
                  <Badge key={i} variant="outline" className="text-[9px] font-normal border-border text-muted-foreground">
                    {s}: {responses[key].slice(0, 25)}{responses[key].length > 25 ? "…" : ""}
                  </Badge>
                );
              })}
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleSave} disabled={saving} className="h-7 text-[10px] rounded-lg">
              {saving ? <Loader2 size={11} className="animate-spin mr-1" /> : <Save size={11} className="mr-1" />}
              Save Progress
            </Button>
          </div>
        </div>
      )}

      {/* Verification Check - shown when checking or as preview */}
      <div id="belief-check" className={cn("space-y-3", !isChecking && !belief && "opacity-40 pointer-events-none")}>
        <div className="flex items-center gap-2">
          <CheckCircle2 size={14} className={cn(isChecking ? "text-chart-emerald" : "text-muted-foreground")} />
          <h3 className="text-sm font-semibold text-foreground">Verifying the Shift</h3>
        </div>
        {belief && (
          <p className="text-xs text-muted-foreground">
            Belief: <strong className="text-foreground">"{belief}"</strong>{" · "}
            {loopCount > 0 && <>Loops: {loopCount + 1}{" · "}</>}
            Opposite: <strong className="text-foreground">"{oppositeBelief}"</strong>
          </p>
        )}
        {!belief && (
          <p className="text-xs text-muted-foreground">Enter a belief above and work through the A-F loop to unlock verification.</p>
        )}

        <div className="space-y-2">
          {CHECK_QUESTIONS.map((q, i) => {
            const prompt = q
              .replace(/\(BELIEF\)/g, belief || "(belief)")
              .replace(/\(OPPOSITE OF BELIEF\)/g, oppositeBelief || "(opposite)");
            const result = isChecking ? checkResults[i] : undefined;
            return (
              <Card key={i} className={cn(
                "border transition-colors",
                !isChecking ? "border-border/50 bg-muted/20" :
                result === undefined ? "border-border bg-card" : 
                result ? "border-destructive/30 bg-destructive/5" : 
                "border-chart-emerald/30 bg-chart-emerald/5"
              )}>
                <CardContent className="p-3 flex items-center justify-between">
                  <p className={cn("text-xs", isChecking ? "text-foreground" : "text-muted-foreground")}>{prompt}</p>
                  <div className="flex gap-1.5 shrink-0 ml-3">
                    <Button variant="outline" size="sm" onClick={() => isChecking && handleCheckAnswer(i, true)}
                      className={cn("h-7 w-7 rounded-lg", !isChecking && "opacity-30", result === true && "border-destructive bg-destructive/10 text-destructive")}>Y</Button>
                    <Button variant="outline" size="sm" onClick={() => isChecking && handleCheckAnswer(i, false)}
                      className={cn("h-7 w-7 rounded-lg", !isChecking && "opacity-30", result === false && "border-chart-emerald bg-chart-emerald/10 text-chart-emerald")}>N</Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {allChecksClear && (
          <div className="p-4 rounded-xl bg-chart-emerald/5 border border-chart-emerald/20 text-center space-y-2">
            <CheckCircle2 size={20} className="text-chart-emerald mx-auto" />
            <div>
              <p className="text-sm font-semibold text-foreground">Belief Cleared</p>
              <p className="text-xs text-muted-foreground">"{belief}" has been integrated. Double-check with indicator muscle or body dowsing.</p>
            </div>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={handleSave} disabled={saving} className="rounded-lg h-8 text-[10px]">
                {saving ? <Loader2 size={11} className="animate-spin mr-1" /> : <Save size={11} className="mr-1" />}
                Save Session
              </Button>
              <Button onClick={handleReset} variant="ghost" className="rounded-lg h-8 text-[10px]">
                <RotateCcw size={11} className="mr-1" /> New Belief
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* History */}
      <div>
        <button onClick={() => setShowHistory(!showHistory)} className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground">
          <History size={11} />
          Past Sessions ({pastSessions.length})
          {showHistory ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        </button>
        {showHistory && (
          <div className="mt-2 space-y-0.5 max-h-40 overflow-y-auto">
            {pastSessions.map(s => (
              <button key={s.id} onClick={() => loadSession(s)} className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-muted transition-colors text-left">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{s.limiting_belief || s.problem}</p>
                  <p className="text-[9px] text-muted-foreground">{format(new Date(s.created_at), 'MMM d, h:mm a')}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {s.is_complete && <Badge className="bg-chart-emerald/10 text-chart-emerald text-[8px]">Cleared</Badge>}
                  <button onClick={(e) => deleteSession(e, s.id)} className="p-1 hover:bg-muted rounded">
                    <Trash2 size={10} className="text-muted-foreground" />
                  </button>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LimitingBeliefsTool;
