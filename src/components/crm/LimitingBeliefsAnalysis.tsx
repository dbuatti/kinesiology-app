
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Sparkles, Copy, Check, Loader2, Lightbulb, 
  Shuffle, AlertTriangle, Wand2, History
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showError } from "@/utils/toast";
import { format } from "date-fns";

interface SuggestionItem {
  name: string;
  reasoning?: string;
  evidence?: string;
}

interface AnalysisResult {
  tools: SuggestionItem[];
  identities: SuggestionItem[];
  patterns: SuggestionItem[];
}

interface PastSession {
  id: string;
  limiting_belief: string | null;
  positive_belief: string | null;
  problem: string | null;
  dissolve_log: string | null;
  is_complete: boolean;
  created_at: string;
}

const BELIEF_STEPS = ["A", "B", "C", "D", "E", "F"];
const STEP_LABELS: Record<string, string> = {
  A: "Feel the belief in your body",
  B: "Follow the sensation deeper",
  C: "Identify the desired state",
  D: "Embody the alternative",
  E: "Deepen the new feeling",
  F: "Check if the belief still holds",
};

const buildTranscript = (session: PastSession): string => {
  const belief = session.limiting_belief || session.problem || "Unknown belief";
  const lines: string[] = [];
  lines.push("=== Limiting Belief Session Transcript ===");
  lines.push("");
  lines.push(`Limiting Belief: "${belief}"`);
  if (session.positive_belief) {
    lines.push(`Positive/Opposite Belief: "${session.positive_belief}"`);
  }
  lines.push(`Session Date: ${format(new Date(session.created_at), "MMM d, yyyy h:mm a")}`);
  lines.push(`Status: ${session.is_complete ? "Resolved ✓" : "In Progress"}`);

  let parsed: { 
    responses?: Record<string, string>; 
    loopCount?: number;
    history?: Array<{loopCount: number, responses: Record<string, string>}>;
  } = {};
  try {
    parsed = JSON.parse(session.dissolve_log || "{}");
  } catch {}
  const rounds = parsed.history || [];
  lines.push(`Rounds Completed: ${rounds.length}`);
  lines.push("");

  if (rounds.length === 0) {
    const responses = parsed.responses || {};
    const hasAny = BELIEF_STEPS.some(s => responses[s]);
    if (hasAny) {
      lines.push("--- Session Responses ---");
      lines.push("");
      for (const step of BELIEF_STEPS) {
        const label = STEP_LABELS[step];
        const resp = responses[step];
        lines.push(`Step ${step} — ${label}:`);
        lines.push(resp ? `  "${resp.trim()}"` : `  [No response recorded]`);
        lines.push("");
      }
    }
  } else {
    for (let i = 0; i < rounds.length; i++) {
      const round = rounds[i];
      lines.push(`--- Round ${round.loopCount + 1} ---`);
      lines.push("");
      for (const step of BELIEF_STEPS) {
        const label = STEP_LABELS[step];
        const resp = round.responses[step];
        lines.push(`Step ${step} — ${label}:`);
        lines.push(resp ? `  "${resp.trim()}"` : `  [No response recorded]`);
        lines.push("");
      }
    }
  }

  return lines.join("\n");
};

const LimitingBeliefsAnalysis = () => {
  const [transcript, setTranscript] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const [pastSessions, setPastSessions] = useState<PastSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [loadingSessions, setLoadingSessions] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from('limiting_belief_sessions')
          .select('id, limiting_belief, positive_belief, problem, dissolve_log, is_complete, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);
        if (data) setPastSessions(data);
      } catch {
        // silent
      } finally {
        setLoadingSessions(false);
      }
    };
    fetch();
  }, []);

  const handleSessionSelect = (id: string) => {
    setSelectedSessionId(id);
    setResult(null);
    setError("");
    const session = pastSessions.find(s => s.id === id);
    if (session) {
      setTranscript(buildTranscript(session));
    }
  };

  const handleAnalyze = async () => {
    if (!transcript.trim()) return;
    setAnalyzing(true);
    setError("");
    setResult(null);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('analyze-belief-transcript', {
        body: { transcript: transcript.trim() }
      });
      if (invokeError) throw invokeError;
      if (data.error) throw new Error(data.error);
      setResult({ tools: data.tools || [], identities: data.identities || [], patterns: data.patterns || [] });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Analysis failed";
      showError(msg);
      setError(msg);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCopyTranscript = async () => {
    try {
      await navigator.clipboard.writeText(transcript.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showError("Failed to copy");
    }
  };

  const handleCopyResults = () => {
    const text = [
      "=== Session Transcript ===",
      transcript.trim(),
      "",
      "=== AI Analysis ===",
      "",
      "--- Tools Suggested ---",
      ...(result?.tools || []).map(t => `• ${t.name}: ${t.reasoning || ''}`),
      "",
      "--- Identity Shifts ---",
      ...(result?.identities || []).map(i => `• ${i.name}: ${i.reasoning || ''}`),
      "",
      "--- Patterns Detected ---",
      ...(result?.patterns || []).map(p => `• ${p.name}${p.evidence ? `: ${p.evidence}` : ''}`),
    ].join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => showError("Failed to copy"));
  };

  const SectionCard = ({ icon: Icon, title, items, color, emptyMsg }: {
    icon: React.ElementType;
    title: string;
    items: SuggestionItem[];
    color: string;
    emptyMsg: string;
  }) => (
    <Card className="border-0 shadow-none bg-muted/30">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Icon size={14} className={color} />
          <h4 className="text-xs font-semibold tracking-wide uppercase text-foreground/80">{title}</h4>
          <Badge variant="secondary" className="ml-auto text-[9px] h-4 px-1.5">{items.length}</Badge>
        </div>
        {items.length === 0 ? (
          <p className="text-[10px] text-muted-foreground italic">{emptyMsg}</p>
        ) : (
          <div className="space-y-1.5">
            {items.map((item, i) => (
              <div key={i} className="p-2 rounded-lg bg-card/80 border border-border/40">
                <p className="text-xs font-medium text-foreground">{item.name}</p>
                {(item.reasoning || item.evidence) && (
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                    {item.reasoning || item.evidence}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles size={14} className="text-chart-primary" />
        <p className="text-xs text-muted-foreground">
          Select a past session or paste a transcript to get AI-powered suggestions for identity work tools, target identities, and underlying belief patterns.
        </p>
      </div>

      <Card className="border-0 shadow-none bg-muted/30">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <History size={13} className="text-muted-foreground" />
            <label className="text-xs font-medium text-foreground/80">Load Past Session</label>
          </div>
          <Select value={selectedSessionId} onValueChange={handleSessionSelect} disabled={loadingSessions}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder={loadingSessions ? "Loading sessions..." : "Choose a session..."} />
            </SelectTrigger>
            <SelectContent>
              {pastSessions.map(s => {
                const belief = s.limiting_belief || s.problem || "(no belief)";
                const date = format(new Date(s.created_at), "MMM d, h:mm a");
                return (
                  <SelectItem key={s.id} value={s.id} className="text-xs">
                    <span className="truncate max-w-[280px] inline-block align-middle">{belief}</span>
                    <span className="text-[9px] text-muted-foreground ml-2">{date}</span>
                    {s.is_complete && <span className="text-[9px] text-chart-emerald ml-1">✓</span>}
                  </SelectItem>
                );
              })}
              {pastSessions.length === 0 && !loadingSessions && (
                <div className="px-2 py-4 text-[10px] text-muted-foreground text-center">No past sessions found</div>
              )}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-none bg-muted/30">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-foreground/80">Session Transcript</label>
            <div className="flex items-center gap-1.5">
              {transcript.trim() && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyTranscript}
                  className="h-6 text-[10px] px-2 gap-1"
                >
                  {copied ? <Check size={10} className="text-chart-emerald" /> : <Copy size={10} />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setTranscript(""); setSelectedSessionId(""); }}
                className="h-6 text-[10px] px-2 text-muted-foreground"
                disabled={!transcript}
              >
                Clear
              </Button>
            </div>
          </div>
          <textarea
            value={transcript}
            onChange={e => { setTranscript(e.target.value); setResult(null); setError(""); }}
            placeholder="Paste the full limiting belief session transcript here..."
            className="w-full h-40 p-3 rounded-lg bg-card border border-border/40 text-xs font-mono leading-relaxed resize-y focus:outline-none focus:ring-1 focus:ring-chart-primary/40 placeholder:text-muted-foreground/40"
          />
          <Button
            onClick={handleAnalyze}
            disabled={!transcript.trim() || analyzing}
            className="w-full h-8 text-xs gap-1.5"
          >
            {analyzing ? (
              <><Loader2 size={12} className="animate-spin" /> Analyzing...</>
            ) : (
              <><Wand2 size={12} /> Analyze with AI</>
            )}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="border border-destructive/20 shadow-none bg-destructive/5">
          <CardContent className="p-3 flex items-center gap-2">
            <AlertTriangle size={12} className="text-destructive shrink-0" />
            <p className="text-xs text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {result && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              <Sparkles size={14} className="text-chart-primary" />
              Analysis Results
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyResults}
              className="h-6 text-[10px] px-2 gap-1"
            >
              {copied ? <Check size={10} className="text-chart-emerald" /> : <Copy size={10} />}
              {copied ? "Copied All" : "Copy All"}
            </Button>
          </div>

          <SectionCard
            icon={Lightbulb}
            title="Tools to Try"
            items={result.tools}
            color="text-chart-primary"
            emptyMsg="No tool suggestions generated."
          />

          <SectionCard
            icon={Shuffle}
            title="Identity Shifts"
            items={result.identities}
            color="text-chart-emerald"
            emptyMsg="No identity shift suggestions generated."
          />

          <SectionCard
            icon={AlertTriangle}
            title="Belief Patterns"
            items={result.patterns}
            color="text-chart-destructive"
            emptyMsg="No additional patterns detected."
          />
        </div>
      )}
    </div>
  );
};

export default LimitingBeliefsAnalysis;
