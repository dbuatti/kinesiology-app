import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { DraftEmail } from "@/types/assistant";
import { Mail, Send, Loader2, X } from "lucide-react";

interface Props {
  draft: DraftEmail;
  onSent: () => void;
  onDiscard: () => void;
}

// The only place in the frontend that calls send-assistant-email — nothing else
// in this app ever dispatches an assistant-drafted email without this explicit click.
export default function DraftEmailCard({ draft, onSent, onDiscard }: Props) {
  const [to, setTo] = useState(draft.to || "");
  const [subject, setSubject] = useState(draft.subject || "");
  const [body, setBody] = useState(draft.body || "");
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!to || !subject || !body) {
      showError("Fill in recipient, subject, and body before sending.");
      return;
    }
    setIsSending(true);
    try {
      const { error } = await supabase.functions.invoke("send-assistant-email", {
        body: { to, subject, body, client_id: draft.client_id, appointment_id: draft.appointment_id },
      });
      if (error) throw error;
      showSuccess(`Email sent to ${to}.`);
      onSent();
    } catch (err: any) {
      showError(err.message || "Failed to send email.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="border-chart-primary/40 bg-chart-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-chart-primary">
          <Mail className="h-4 w-4" /> Draft — not sent yet
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="Recipient email" disabled={isSending} />
        <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" disabled={isSending} />
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} placeholder="Body" disabled={isSending} className="text-base md:text-sm" />
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" size="sm" onClick={onDiscard} disabled={isSending}>
            <X className="h-4 w-4 mr-1" /> Discard
          </Button>
          <Button size="sm" onClick={handleSend} disabled={isSending}>
            {isSending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
            Send
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
