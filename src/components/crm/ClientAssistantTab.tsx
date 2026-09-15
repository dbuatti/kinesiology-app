import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { Client } from "@/types/crm";
import { Sparkles, Loader2, Bot } from "lucide-react";

interface Props {
  client: Client;
}

const MAX_PASTE_CHARS = 8000;
const CHANNELS = [
  { value: "text", label: "Text / SMS" },
  { value: "email", label: "Email" },
  { value: "instagram", label: "Instagram" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "mixed", label: "Mixed" },
];

export default function ClientAssistantTab({ client }: Props) {
  const [pastedLogs, setPastedLogs] = useState("");
  const [channel, setChannel] = useState("text");
  const [styleSummary, setStyleSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("client_ai_profiles")
        .select("pasted_logs, style_summary, channel")
        .eq("client_id", client.id)
        .maybeSingle();
      if (!error && data) {
        setPastedLogs(data.pasted_logs || "");
        setStyleSummary(data.style_summary || null);
        setChannel(data.channel || "text");
      }
      setIsLoading(false);
    };
    load();
  }, [client.id]);

  const handleAnalyze = async () => {
    const trimmed = pastedLogs.trim();
    if (!trimmed) {
      showError("Paste some past messages with this client first.");
      return;
    }
    setIsAnalyzing(true);
    try {
      const truncated = trimmed.slice(-MAX_PASTE_CHARS);
      const { data, error } = await supabase.functions.invoke("analyze-client-style", {
        body: { pasted_logs: truncated, channel, client_name: client.name },
      });
      if (error) throw error;

      const { error: upsertErr } = await supabase.from("client_ai_profiles").upsert(
        {
          client_id: client.id,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          pasted_logs: truncated,
          style_summary: data.style_summary,
          channel,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "client_id" },
      );
      if (upsertErr) throw upsertErr;

      setStyleSummary(data.style_summary);
      showSuccess(`Learned ${client.name}'s communication style.`);
    } catch (err: any) {
      showError(err.message || "Failed to analyze communication style.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      {styleSummary && (
        <Card className="border-chart-primary/40 bg-chart-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-chart-primary">
              <Bot className="h-4 w-4" /> How {client.name.split(" ")[0]} communicates
            </CardTitle>
            <CardDescription>Used by the Assistant when you're in focused mode with this client.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground">{styleSummary}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Train on this client</CardTitle>
          <CardDescription>
            Paste past chat/email/DM messages with {client.name.split(" ")[0]} and the Assistant will learn how they typically confirm times, phrase constraints, and cancel — so replies and bookings match their real style.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={channel} onValueChange={setChannel}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CHANNELS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Textarea
            value={pastedLogs}
            onChange={(e) => setPastedLogs(e.target.value)}
            placeholder="Paste the conversation history here..."
            rows={12}
            className="font-mono text-xs"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {pastedLogs.length.toLocaleString()} characters{pastedLogs.length > MAX_PASTE_CHARS ? ` — only the most recent ${MAX_PASTE_CHARS.toLocaleString()} will be analysed` : ""}
            </span>
            <Button onClick={handleAnalyze} disabled={isAnalyzing}>
              {isAnalyzing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Analyze Style
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
