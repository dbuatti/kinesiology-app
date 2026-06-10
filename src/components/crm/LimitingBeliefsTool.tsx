
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
  const [showReference, setShowReference] = useState(false);
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
  }, []);

  const fetchPastSessions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('limiting_belief_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) setPastSessions(data);
  };

  const getPrompt = (step: string, beliefText: string) => {
    let prompt = STEP_PROMPTS[step]
      .replace('(BELIEF)', beliefText)
      .replace('(LAST RESPONSE)', lastResponse)
      .replace('(DESIRED FEELING)', responses["C"] || "...");
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
    <div className="space-y-6">
      {/* Belief Setup */}
      <div ref={scrollRef} className="space-y-4">
        <div className="flex items-center gap-2">
          <ShieldAlert size={18} className="text-chart-destructive" />
          <h3 className="text-base font-semibold text-foreground">Belief Shifting Protocol</h3>
          <Badge className="text-[10px] bg-muted text-muted-foreground border-border">Somatic alchemy</Badge>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">Limiting Belief</label>
            <div className="flex gap-2">
              <Input 
                placeholder='e.g. "I am not good enough"'
                value={belief}
                onChange={(e) => setBelief(e.target.value)}
                className="h-10 rounded-lg text-base font-medium"
              />
              <Button variant="ghost" size="sm" onClick={() => setShowReference(!showReference)} className="h-10 w-10 shrink-0 rounded-lg">
                <BookOpen size={16} className="text-muted-foreground" />
              </Button>
            </div>
          </div>

          {showReference && (
            <div className="p-4 rounded-lg bg-muted/30 border border-border space-y-3 animate-in fade-in duration-200">
              <p className="text-xs font-medium text-muted-foreground">Core 7 Belief Patterns</p>
              <div className="flex flex-wrap gap-1.5">
                {CORE_BELIEFS.map((b, i) => (
                  <button key={i} onClick={() => setBelief(b)} className={cn(
                    "text-[10px] px-2 py-1 rounded-md border transition-colors",
                    belief === b ? "border-chart-destructive bg-chart-destructive/10 text-chart-destructive font-medium" : "border-border bg-card text-muted-foreground hover:border-chart-destructive/30"
                  )}>
                    {b}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground/60 leading-relaxed">A limiting belief is a state-dependent neural network formed to reduce uncertainty and protect the organism. They behave like primitive reflexes: ON or OFF.</p>
            </div>
          )}

          <div>
            <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">Opposite / Desired Knowing</label>
            <Input 
              placeholder='e.g. "I am capable and enough"'
              value={oppositeBelief}
              onChange={(e) => setOppositeBelief(e.target.value)}
              className="h-10 rounded-lg text-base font-medium"
            />
          </div>
        </div>
      </div>

      {/* A-F Loop */}
      {belief && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-chart-destructive/10 text-chart-destructive flex items-center justify-center text-[10px] font-semibold">{currentStep}</span>
              <span className="text-sm font-medium text-foreground">Step {currentStep} of A-F</span>
              {loopCount > 0 && <Badge className="text-[10px] bg-muted text-muted-foreground">Loop {loopCount + 1}</Badge>}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleSave} disabled={saving} className="h-7 text-xs rounded-lg">
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} className="mr-1" />}
                Save
              </Button>
            </div>
          </div>

          <Card className="border border-border bg-card">
            <CardContent className="p-4 space-y-3">
              <p className="text-base text-foreground font-medium italic leading-relaxed">
                "{getPrompt(currentStep, belief)}"
              </p>
              <p className="text-xs text-muted-foreground">Keep answers brief — emotion, body sensation, thought or mental image.</p>

              {currentStep === "F" ? (
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => handleFQuick(true)} className="flex-1 h-10 rounded-lg border-destructive text-destructive font-medium text-xs">
                    Yes, still believe it
                  </Button>
                  <Button variant="outline" onClick={() => handleFQuick(false)} className="flex-1 h-10 rounded-lg border-chart-emerald text-chart-emerald font-medium text-xs">
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
                    className="h-10 rounded-lg text-base font-medium flex-1"
                    autoFocus
                  />
                  <Button onClick={handleNext} className="h-10 w-10 rounded-lg shrink-0">
                    <ArrowRight size={16} />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Loop responses log */}
          {Object.keys(responses).length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {BELIEF_STEPS.map((s, i) => {
                const key = `${s}`;
                if (!responses[key]) return null;
                return (
                  <Badge key={i} variant="outline" className="text-[10px] font-normal border-border text-muted-foreground">
                    {s}: {responses[key].slice(0, 30)}{responses[key].length > 30 ? "…" : ""}
                  </Badge>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Verification Check */}
      {isChecking && (
        <div id="belief-check" className="space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-chart-emerald" />
            <h3 className="text-base font-semibold text-foreground">Verifying the Shift</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Belief: <strong className="text-foreground">"{belief}"</strong>{" · "}
            Loops: {loopCount + 1}{" · "}
            Opposite: <strong className="text-foreground">"{oppositeBelief}"</strong>
          </p>

          <div className="space-y-3">
            {CHECK_QUESTIONS.map((q, i) => {
              const prompt = q
                .replace('(BELIEF)', belief)
                .replace('(OPPOSITE OF BELIEF)', oppositeBelief || "...");
              const result = checkResults[i];
              return (
                <Card key={i} className={cn(
                  "border transition-colors",
                  result === undefined ? "border-border bg-card" : 
                  result ? "border-destructive/30 bg-destructive/5" : 
                  "border-chart-emerald/30 bg-chart-emerald/5"
                )}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <p className="text-sm text-foreground">{prompt}</p>
                    <div className="flex gap-2 shrink-0 ml-4">
                      <Button variant="outline" size="sm" onClick={() => handleCheckAnswer(i, true)}
                        className={cn("h-8 w-8 rounded-lg", result === true && "border-destructive bg-destructive/10 text-destructive")}>Y</Button>
                      <Button variant="outline" size="sm" onClick={() => handleCheckAnswer(i, false)}
                        className={cn("h-8 w-8 rounded-lg", result === false && "border-chart-emerald bg-chart-emerald/10 text-chart-emerald")}>N</Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {allChecksClear && (
            <div className="p-5 rounded-xl bg-chart-emerald/5 border border-chart-emerald/20 text-center space-y-3">
              <CheckCircle2 size={28} className="text-chart-emerald mx-auto" />
              <div>
                <p className="text-base font-semibold text-foreground">Belief Cleared</p>
                <p className="text-sm text-muted-foreground">"{belief}" has been integrated. Double-check with indicator muscle or body dowsing.</p>
              </div>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={handleSave} disabled={saving} className="rounded-lg h-9 text-xs">
                  {saving ? <Loader2 size={13} className="animate-spin mr-1" /> : <Save size={13} className="mr-1" />}
                  Save Session
                </Button>
                <Button onClick={handleReset} variant="ghost" className="rounded-lg h-9 text-xs">
                  <RotateCcw size={13} className="mr-1" /> New Belief
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* History */}
      <div>
        <button onClick={() => setShowHistory(!showHistory)} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
          <History size={13} />
          Past Sessions ({pastSessions.length})
          {showHistory ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
        {showHistory && (
          <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
            {pastSessions.map(s => (
              <button key={s.id} onClick={() => loadSession(s)} className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors text-left">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{s.limiting_belief || s.problem}</p>
                  <p className="text-[10px] text-muted-foreground">{format(new Date(s.created_at), 'MMM d, h:mm a')}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {s.is_complete && <Badge className="bg-chart-emerald/10 text-chart-emerald text-[9px]">Cleared</Badge>}
                  <button onClick={(e) => deleteSession(e, s.id)} className="p-1 hover:bg-muted rounded">
                    <Trash2 size={12} className="text-muted-foreground" />
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
